import { drizzle } from "drizzle-orm/mysql2";
import { and, asc, count, desc, eq, getTableColumns, ne, sql } from "drizzle-orm";
import {
  adminEmailAccess,
  camelPhotos,
  camelProductionLinks,
  camelRecords,
  contentComments,
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

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
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

export async function listAdminEmailAccess() {
  const db = await requireDb();
  return db.select().from(adminEmailAccess).orderBy(desc(adminEmailAccess.createdAt));
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

export async function listPublicCamelRecords() {
  const db = await requireDb();
  return db
    .select()
    .from(camelRecords)
    .where(eq(camelRecords.isPublished, true))
    .orderBy(asc(camelRecords.sortOrder), asc(camelRecords.id));
}

export async function listAllCamelRecords() {
  const db = await requireDb();
  return db.select().from(camelRecords).orderBy(asc(camelRecords.sortOrder), asc(camelRecords.id));
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
  await db.delete(contentItems).where(eq(contentItems.id, id));
}

export async function listCamelPhotos(camelRecordId: number) {
  const db = await requireDb();
  return db.select().from(camelPhotos)
    .where(eq(camelPhotos.camelRecordId, camelRecordId))
    .orderBy(asc(camelPhotos.sortOrder), asc(camelPhotos.id));
}

export async function listCamelPhotoCounts() {
  const db = await requireDb();
  return db.select({ camelRecordId: camelPhotos.camelRecordId, count: count(camelPhotos.id) })
    .from(camelPhotos)
    .groupBy(camelPhotos.camelRecordId);
}

export async function createCamelPhoto(values: InsertCamelPhoto) {
  const db = await requireDb();
  return db.insert(camelPhotos).values(values);
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

export async function deleteCamelPhoto(id: number) {
  const db = await requireDb();
  await db.delete(camelPhotos).where(eq(camelPhotos.id, id));
}

export async function listCamelProductionLinks(camelRecordId: number) {
  const db = await requireDb();
  return db.select().from(camelProductionLinks)
    .where(eq(camelProductionLinks.camelRecordId, camelRecordId))
    .orderBy(desc(camelProductionLinks.linkedAt), desc(camelProductionLinks.id));
}

export async function createCamelProductionLink(values: InsertCamelProductionLink) {
  const db = await requireDb();
  return db.insert(camelProductionLinks).values(values);
}

export async function updateCamelProductionLink(id: number, values: Partial<InsertCamelProductionLink>) {
  const db = await requireDb();
  await db.update(camelProductionLinks).set(values).where(eq(camelProductionLinks.id, id));
}

export async function deleteCamelProductionLink(id: number) {
  const db = await requireDb();
  await db.delete(camelProductionLinks).where(eq(camelProductionLinks.id, id));
}

export async function getContentEngagement(contentItemId: number, userId?: number) {
  const db = await requireDb();
  const [likeSummary] = await db.select({ count: count(contentLikes.id) })
    .from(contentLikes)
    .where(eq(contentLikes.contentItemId, contentItemId));
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
  const liked = userId
    ? (await db.select({ id: contentLikes.id }).from(contentLikes).where(and(eq(contentLikes.contentItemId, contentItemId), eq(contentLikes.userId, userId))).limit(1)).length > 0
    : false;
  return { likeCount: likeSummary?.count ?? 0, liked, comments };
}

export async function toggleContentLike(contentItemId: number, userId: number) {
  const db = await requireDb();
  const existing = await db.select({ id: contentLikes.id }).from(contentLikes)
    .where(and(eq(contentLikes.contentItemId, contentItemId), eq(contentLikes.userId, userId))).limit(1);
  if (existing[0]) {
    await db.delete(contentLikes).where(eq(contentLikes.id, existing[0].id));
    return { liked: false };
  }
  await db.insert(contentLikes).values({ contentItemId, userId });
  return { liked: true };
}

export async function addContentComment(contentItemId: number, userId: number, body: string) {
  const db = await requireDb();
  return db.insert(contentComments).values({ contentItemId, userId, body: body.trim() });
}
