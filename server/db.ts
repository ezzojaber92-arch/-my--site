import { drizzle } from "drizzle-orm/mysql2";
import type { MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { and, asc, count, countDistinct, desc, eq, getTableColumns, ne, sql } from "drizzle-orm";
import {
  adminEmailAccess,
  camelPhotos,
  camelProductionLinks,
  camelRecords,
  contentComments,
  contentGuestComments,
  contentGuestLikes,
  contentItems,
  contentLikes,
  InsertCamelProductionLink,
  InsertCamelPhoto,
  InsertCamelRecord,
  InsertContentItem,
  InsertReserveSettings,
  InsertUser,
  reserveSettings,
  users,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { hasTiDbPasswordPlaceholder } from "./_core/databaseUrl";

let _db: MySql2Database | null = null;
let databaseConnectionStateLogged = false;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && ENV.databaseUrl) {
    if (!databaseConnectionStateLogged) {
      databaseConnectionStateLogged = true;
      console.info("[Database] TiDB connection configuration", {
        configured: Boolean(ENV.tiDbConnectionOptions),
        passwordLooksLikePlaceholder: hasTiDbPasswordPlaceholder(ENV.databaseUrl),
      });
    }
    try {
      _db = ENV.tiDbConnectionOptions
        ? drizzle(mysql.createPool({
            ...ENV.tiDbConnectionOptions,
            connectionLimit: 1,
            maxIdle: 1,
            enableKeepAlive: true,
          }))
        : drizzle(ENV.databaseUrl);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = field === "email" && typeof value === "string" ? normalizeEmail(value) : value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    const emailGrantedAdmin = typeof user.email === "string" && await isAdminEmailGranted(user.email);
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId || emailGrantedAdmin) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function isAdminEmailGranted(email: string) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: adminEmailAccess.id })
    .from(adminEmailAccess)
    .where(eq(adminEmailAccess.email, normalizeEmail(email)))
    .limit(1);
  return result.length > 0;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً.");
  return db;
}

let applicationSchemaReady: Promise<void> | null = null;

export function ensureApplicationSchema() {
  if (!applicationSchemaReady) {
    applicationSchemaReady = (async () => {
      const db = await requireDb();
      await db.execute(sql.raw("ALTER TABLE `admin_email_access` ADD COLUMN IF NOT EXISTS `password_hash` varchar(255)"));
      await db.execute(sql.raw("ALTER TABLE `camel_records` ADD COLUMN IF NOT EXISTS `subscription_url` varchar(1024)"));
      await db.execute(sql.raw("ALTER TABLE `camel_records` ADD COLUMN IF NOT EXISTS `achievements_url` varchar(1024)"));
      await db.execute(sql.raw("ALTER TABLE `camel_photos` ADD COLUMN IF NOT EXISTS `image_position_x` int NOT NULL DEFAULT 50"));
      await db.execute(sql.raw("ALTER TABLE `camel_photos` ADD COLUMN IF NOT EXISTS `image_position_y` int NOT NULL DEFAULT 50"));
      await db.execute(sql.raw("ALTER TABLE `camel_photos` ADD COLUMN IF NOT EXISTS `image_scale` int NOT NULL DEFAULT 100"));
      await db.execute(sql.raw("ALTER TABLE `camel_photos` ADD COLUMN IF NOT EXISTS `image_rotation` int NOT NULL DEFAULT 0"));
      await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `camel_production_links` (`id` int AUTO_INCREMENT NOT NULL, `camel_record_id` int NOT NULL, `url` varchar(512) NOT NULL, `platform` varchar(100) NOT NULL, `linked_at` timestamp NOT NULL DEFAULT (now()), `created_at` timestamp NOT NULL DEFAULT (now()), `title` varchar(255) NOT NULL DEFAULT 'رابط إنتاج', CONSTRAINT `camel_production_links_id` PRIMARY KEY(`id`), CONSTRAINT `camel_production_links_camel_url_unique` UNIQUE(`camel_record_id`,`url`))"));
      await db.execute(sql.raw("ALTER TABLE `camel_production_links` ADD COLUMN IF NOT EXISTS `title` varchar(255) NOT NULL DEFAULT 'رابط إنتاج'"));
      await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `content_guest_likes` (`id` int AUTO_INCREMENT NOT NULL, `content_item_id` int NOT NULL, `visitor_token` varchar(64) NOT NULL, `created_at` timestamp NOT NULL DEFAULT (now()), CONSTRAINT `content_guest_likes_id` PRIMARY KEY(`id`), CONSTRAINT `content_guest_likes_content_visitor_unique` UNIQUE(`content_item_id`,`visitor_token`))"));
      await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `content_guest_comments` (`id` int AUTO_INCREMENT NOT NULL, `content_item_id` int NOT NULL, `visitor_token` varchar(64) NOT NULL, `author_name` varchar(100) NOT NULL DEFAULT 'زائر المحمية', `body` text NOT NULL, `is_visible` boolean NOT NULL DEFAULT true, `created_at` timestamp NOT NULL DEFAULT (now()), CONSTRAINT `content_guest_comments_id` PRIMARY KEY(`id`))"));
    })().catch((error) => {
      applicationSchemaReady = null;
      throw error;
    });
  }
  return applicationSchemaReady;
}

export const ensureAdminEmailPasswordSchema = ensureApplicationSchema;

export async function listAdminEmailAccess() {
  const db = await requireDb();
  return db.select().from(adminEmailAccess).orderBy(desc(adminEmailAccess.createdAt));
}

export async function getAdminEmailAccess(email: string) {
  const db = await requireDb();
  const result = await db.select().from(adminEmailAccess).where(eq(adminEmailAccess.email, normalizeEmail(email))).limit(1);
  return result[0] ?? null;
}

export async function setAdminEmailPasswordHash(email: string, passwordHash: string | null) {
  const db = await requireDb();
  await db.update(adminEmailAccess).set({ passwordHash }).where(eq(adminEmailAccess.email, normalizeEmail(email)));
}

export async function grantAdminEmailAccess(email: string, createdByUserId: number) {
  const db = await requireDb();
  const normalizedEmail = normalizeEmail(email);
  await db.insert(adminEmailAccess).values({ email: normalizedEmail, createdByUserId }).onDuplicateKeyUpdate({
    set: { email: normalizedEmail },
  });
  await db.update(users).set({ role: "admin" }).where(eq(users.email, normalizedEmail));
}

export async function revokeAdminEmailAccess(email: string) {
  const db = await requireDb();
  const normalizedEmail = normalizeEmail(email);
  await db.delete(adminEmailAccess).where(eq(adminEmailAccess.email, normalizedEmail));
  await db.update(users).set({ role: "user" }).where(and(
    eq(users.email, normalizedEmail),
    ne(users.openId, ENV.ownerOpenId),
  ));
}

export async function getReserveSettings() {
  const db = await requireDb();
  const result = await db.select().from(reserveSettings).where(eq(reserveSettings.id, 1)).limit(1);
  return result[0] ?? null;
}

export async function updateReserveSettings(values: Omit<InsertReserveSettings, "id" | "updatedAt">) {
  const db = await requireDb();
  await db.insert(reserveSettings).values({ id: 1, ...values }).onDuplicateKeyUpdate({ set: values });
}

const camelRecordNumber = sql<number>`CAST(SUBSTRING_INDEX(${camelRecords.recordCode}, '-', -1) AS UNSIGNED)`;

function camelRecordOrder() {
  return [asc(camelRecordNumber), asc(camelRecords.recordCode), asc(camelRecords.id)] as const;
}

export async function listPublicCamelRecords() {
  await ensureApplicationSchema();
  const db = await requireDb();
  return db
    .select()
    .from(camelRecords)
    .where(eq(camelRecords.isPublished, true))
    .orderBy(...camelRecordOrder());
}

export async function listAllCamelRecords() {
  await ensureApplicationSchema();
  const db = await requireDb();
  return db.select().from(camelRecords).orderBy(...camelRecordOrder());
}

export async function createCamelRecord(values: InsertCamelRecord) {
  const db = await requireDb();
  return db.insert(camelRecords).values(values);
}

export async function updateCamelRecord(id: number, values: Partial<InsertCamelRecord>) {
  const db = await requireDb();
  await db.update(camelRecords).set(values).where(eq(camelRecords.id, id));
}

export async function deleteCamelRecord(id: number) {
  const db = await requireDb();
  await db.delete(camelRecords).where(eq(camelRecords.id, id));
}

export async function listPublicContentItems() {
  const db = await requireDb();
  return db
    .select({
      ...getTableColumns(contentItems),
      likeCount: sql<number>`(select count(*) from ${contentLikes} where ${contentLikes.contentItemId} = ${contentItems.id})`.as("like_count"),
    })
    .from(contentItems)
    .where(eq(contentItems.isPublished, true))
    .orderBy(desc(contentItems.publishedAt), asc(contentItems.sortOrder));
}

export async function listAllContentItems() {
  const db = await requireDb();
  return db.select().from(contentItems).orderBy(desc(contentItems.createdAt));
}

export async function createContentItem(values: InsertContentItem) {
  const db = await requireDb();
  return db.insert(contentItems).values(values);
}

export async function updateContentItem(id: number, values: Partial<InsertContentItem>) {
  const db = await requireDb();
  await db.update(contentItems).set(values).where(eq(contentItems.id, id));
}

export async function deleteContentItem(id: number) {
  const db = await requireDb();
  const existing = await db.select({
    mediaUrl: contentItems.mediaUrl,
    mediaKey: contentItems.mediaKey,
    thumbnailUrl: contentItems.thumbnailUrl,
    thumbnailKey: contentItems.thumbnailKey,
  }).from(contentItems).where(eq(contentItems.id, id)).limit(1);
  await db.delete(contentItems).where(eq(contentItems.id, id));
  return existing[0] ?? null;
}

export async function listCamelPhotos(camelRecordId: number) {
  await ensureApplicationSchema();
  const db = await requireDb();
  return db.select().from(camelPhotos)
    .where(eq(camelPhotos.camelRecordId, camelRecordId))
    .orderBy(asc(camelPhotos.sortOrder), asc(camelPhotos.id));
}

export async function listCamelPhotoCounts() {
  await ensureApplicationSchema();
  const db = await requireDb();
  // The primary image is part of the public gallery and must be counted once
  // alongside any additional gallery rows.
  return db.select({
    camelRecordId: camelRecords.id,
    count: countDistinct(sql`COALESCE(${camelPhotos.imageUrl}, ${camelRecords.imageUrl})`),
  })
    .from(camelRecords)
    .leftJoin(camelPhotos, eq(camelPhotos.camelRecordId, camelRecords.id))
    .groupBy(camelRecords.id, camelRecords.imageUrl);
}

export async function createCamelPhoto(values: InsertCamelPhoto) {
  await ensureApplicationSchema();
  const db = await requireDb();
  return db.insert(camelPhotos).values(values);
}

export async function updateCamelPhoto(id: number, values: Partial<Pick<InsertCamelPhoto, "imagePositionX" | "imagePositionY" | "imageScale" | "imageRotation">>) {
  await ensureApplicationSchema();
  const db = await requireDb();
  const existing = await db.select({ id: camelPhotos.id }).from(camelPhotos).where(eq(camelPhotos.id, id)).limit(1);
  if (!existing[0]) return null;
  await db.update(camelPhotos).set(values).where(eq(camelPhotos.id, id));
  return { id };
}

type ConnectedDatabase = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export async function ensureCamelPhotoWithDb(db: ConnectedDatabase, values: InsertCamelPhoto) {
  const existing = await db.select({ id: camelPhotos.id }).from(camelPhotos).where(and(
    eq(camelPhotos.camelRecordId, values.camelRecordId),
    eq(camelPhotos.imageUrl, values.imageUrl),
  )).limit(1);
  if (existing[0]) return { alreadyAdded: true };
  await db.insert(camelPhotos).values(values);
  return { alreadyAdded: false };
}

export async function ensureCamelPhoto(values: InsertCamelPhoto) {
  return ensureCamelPhotoWithDb(await requireDb(), values);
}

export async function setCamelPhotoAsPrimary(photoId: number) {
  await ensureApplicationSchema();
  const db = await requireDb();
  const existing = await db.select({
    camelRecordId: camelPhotos.camelRecordId,
    imageUrl: camelPhotos.imageUrl,
    imagePositionX: camelPhotos.imagePositionX,
    imagePositionY: camelPhotos.imagePositionY,
    imageScale: camelPhotos.imageScale,
    imageRotation: camelPhotos.imageRotation,
  }).from(camelPhotos).where(eq(camelPhotos.id, photoId)).limit(1);
  const photo = existing[0];
  if (!photo) return null;
  await db.update(camelRecords).set({
    imageUrl: photo.imageUrl,
    imagePositionX: photo.imagePositionX,
    imagePositionY: photo.imagePositionY,
    imageScale: photo.imageScale,
    imageRotation: photo.imageRotation,
  }).where(eq(camelRecords.id, photo.camelRecordId));
  return photo;
}

export async function deleteCamelPhoto(id: number) {
  await ensureApplicationSchema();
  const db = await requireDb();
  const existing = await db.select({ camelRecordId: camelPhotos.camelRecordId, imageUrl: camelPhotos.imageUrl, mediaKey: camelPhotos.mediaKey })
    .from(camelPhotos).where(eq(camelPhotos.id, id)).limit(1);
  const photo = existing[0];
  if (!photo) return null;
  await db.delete(camelPhotos).where(eq(camelPhotos.id, id));

  const camel = await db.select({ imageUrl: camelRecords.imageUrl })
    .from(camelRecords).where(eq(camelRecords.id, photo.camelRecordId)).limit(1);
  if (camel[0]?.imageUrl === photo.imageUrl) {
    const replacement = await db.select({ imageUrl: camelPhotos.imageUrl })
      .from(camelPhotos)
      .where(eq(camelPhotos.camelRecordId, photo.camelRecordId))
      .orderBy(asc(camelPhotos.sortOrder), asc(camelPhotos.id))
      .limit(1);
    await db.update(camelRecords).set({ imageUrl: replacement[0]?.imageUrl ?? "" })
      .where(eq(camelRecords.id, photo.camelRecordId));
  }
  return photo;
}

export async function listCamelProductionLinks(camelRecordId: number) {
  await ensureApplicationSchema();
  const db = await requireDb();
  return db.select().from(camelProductionLinks)
    .where(eq(camelProductionLinks.camelRecordId, camelRecordId))
    .orderBy(desc(camelProductionLinks.linkedAt), desc(camelProductionLinks.id));
}

export async function createCamelProductionLink(values: InsertCamelProductionLink) {
  await ensureApplicationSchema();
  const db = await requireDb();
  return db.insert(camelProductionLinks).values(values);
}

export async function updateCamelProductionLink(id: number, values: Partial<InsertCamelProductionLink>) {
  await ensureApplicationSchema();
  const db = await requireDb();
  await db.update(camelProductionLinks).set(values).where(eq(camelProductionLinks.id, id));
}

export async function deleteCamelProductionLink(id: number) {
  await ensureApplicationSchema();
  const db = await requireDb();
  await db.delete(camelProductionLinks).where(eq(camelProductionLinks.id, id));
}

export async function getContentEngagement(contentItemId: number, userId?: number, visitorToken?: string) {
  await ensureApplicationSchema();
  const db = await requireDb();
  const [likeSummary] = await db.select({ count: count(contentLikes.id) })
    .from(contentLikes)
    .where(eq(contentLikes.contentItemId, contentItemId));
  const [guestLikeSummary] = await db.select({ count: count(contentGuestLikes.id) })
    .from(contentGuestLikes)
    .where(eq(contentGuestLikes.contentItemId, contentItemId));
  const comments = await db.select({
    id: contentComments.id,
    body: contentComments.body,
    createdAt: contentComments.createdAt,
    userId: contentComments.userId,
    authorName: users.name,
  }).from(contentComments)
    .leftJoin(users, eq(contentComments.userId, users.id))
    .where(and(eq(contentComments.contentItemId, contentItemId), eq(contentComments.isVisible, true)))
    .orderBy(asc(contentComments.createdAt));
  const guestComments = await db.select({
    id: contentGuestComments.id,
    body: contentGuestComments.body,
    createdAt: contentGuestComments.createdAt,
    userId: sql<number | null>`NULL`,
    authorName: contentGuestComments.authorName,
  }).from(contentGuestComments)
    .where(and(eq(contentGuestComments.contentItemId, contentItemId), eq(contentGuestComments.isVisible, true)))
    .orderBy(asc(contentGuestComments.createdAt));
  const likedAsUser = userId
    ? (await db.select({ id: contentLikes.id }).from(contentLikes).where(and(eq(contentLikes.contentItemId, contentItemId), eq(contentLikes.userId, userId))).limit(1)).length > 0
    : false;
  const likedAsGuest = visitorToken
    ? (await db.select({ id: contentGuestLikes.id }).from(contentGuestLikes).where(and(eq(contentGuestLikes.contentItemId, contentItemId), eq(contentGuestLikes.visitorToken, visitorToken))).limit(1)).length > 0
    : false;
  const mergedComments = [...comments, ...guestComments].sort((left, right) =>
    new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
  return {
    likeCount: Number(likeSummary?.count ?? 0) + Number(guestLikeSummary?.count ?? 0),
    liked: likedAsUser || likedAsGuest,
    comments: mergedComments,
  };
}

export async function toggleContentLike(contentItemId: number, userId?: number, visitorToken?: string) {
  await ensureApplicationSchema();
  const db = await requireDb();
  if (userId) {
    const existing = await db.select({ id: contentLikes.id }).from(contentLikes)
      .where(and(eq(contentLikes.contentItemId, contentItemId), eq(contentLikes.userId, userId))).limit(1);
    if (existing[0]) {
      await db.delete(contentLikes).where(eq(contentLikes.id, existing[0].id));
      return { liked: false };
    }
    await db.insert(contentLikes).values({ contentItemId, userId });
    return { liked: true };
  }
  if (!visitorToken) throw new Error("VISITOR_TOKEN_REQUIRED");
  const existing = await db.select({ id: contentGuestLikes.id }).from(contentGuestLikes)
    .where(and(eq(contentGuestLikes.contentItemId, contentItemId), eq(contentGuestLikes.visitorToken, visitorToken))).limit(1);
  if (existing[0]) {
    await db.delete(contentGuestLikes).where(eq(contentGuestLikes.id, existing[0].id));
    return { liked: false };
  }
  await db.insert(contentGuestLikes).values({ contentItemId, visitorToken });
  return { liked: true };
}

export async function addContentComment(contentItemId: number, userId: number | undefined, body: string, visitorToken?: string) {
  await ensureApplicationSchema();
  const db = await requireDb();
  const trimmedBody = body.trim();
  if (userId) return db.insert(contentComments).values({ contentItemId, userId, body: trimmedBody });
  if (!visitorToken) throw new Error("VISITOR_TOKEN_REQUIRED");
  return db.insert(contentGuestComments).values({ contentItemId, visitorToken, body: trimmedBody });
}
