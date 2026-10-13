// server/_core/app.ts
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var OAUTH_STATE_COOKIE = "__Host-oauth_state";
var decodeOAuthState = (state) => {
  let decoded;
  try {
    decoded = atob(state);
  } catch {
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") return parsed;
  } catch {
  }
  return { redirectUri: decoded };
};

// server/_core/oauth.ts
import { parse as parseCookieHeader2 } from "cookie";

// server/db.ts
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { and, asc, count, countDistinct, desc, eq, getTableColumns, ne, sql } from "drizzle-orm";

// drizzle/schema.ts
import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var adminEmailAccess = mysqlTable("admin_email_access", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  createdByUserId: int("created_by_user_id").notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var reserveSettings = mysqlTable("reserve_settings", {
  id: int("id").primaryKey(),
  reserveName: varchar("reserve_name", { length: 255 }).notNull(),
  locationName: varchar("location_name", { length: 255 }).notNull(),
  mapUrl: varchar("map_url", { length: 1024 }).notNull(),
  phone: varchar("phone", { length: 64 }).notNull(),
  veterinaryService: text("veterinary_service").notNull(),
  climateService: text("climate_service").notNull(),
  visitHours: varchar("visit_hours", { length: 255 }).notNull(),
  visitDescription: text("visit_description").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
});
var camelRecords = mysqlTable("camel_records", {
  id: int("id").autoincrement().primaryKey(),
  recordCode: varchar("record_code", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  imageUrl: varchar("image_url", { length: 1024 }).notNull(),
  imagePositionX: int("image_position_x").default(50).notNull(),
  imagePositionY: int("image_position_y").default(50).notNull(),
  imageScale: int("image_scale").default(100).notNull(),
  imageRotation: int("image_rotation").default(0).notNull(),
  shade: varchar("shade", { length: 255 }).notNull(),
  owner: varchar("owner", { length: 255 }).notNull(),
  father: varchar("father", { length: 255 }).notNull(),
  mother: varchar("mother", { length: 255 }).notNull(),
  maternalSibling: text("maternal_sibling"),
  maternalSiblingLabel: varchar("maternal_sibling_label", { length: 100 }).notNull(),
  status: text("status").notNull(),
  achievements: text("achievements").notNull(),
  production: text("production").notNull(),
  worker: varchar("worker", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 64 }).notNull(),
  subscriptionUrl: varchar("subscription_url", { length: 1024 }),
  achievementsUrl: varchar("achievements_url", { length: 1024 }),
  note: text("note").notNull(),
  isPublished: boolean("is_published").default(true).notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
});
var contentKind = mysqlEnum("content_kind", ["news", "announcement", "celebration", "photo", "video"]);
var contentItems = mysqlTable("content_items", {
  id: int("id").autoincrement().primaryKey(),
  kind: contentKind.notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  mediaUrl: varchar("media_url", { length: 1024 }),
  mediaKey: varchar("media_key", { length: 1024 }),
  thumbnailUrl: varchar("thumbnail_url", { length: 1024 }),
  thumbnailKey: varchar("thumbnail_key", { length: 1024 }),
  durationSeconds: int("duration_seconds"),
  camelRecordId: int("camel_record_id"),
  isPublished: boolean("is_published").default(false).notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
});
var camelPhotos = mysqlTable("camel_photos", {
  id: int("id").autoincrement().primaryKey(),
  camelRecordId: int("camel_record_id").notNull(),
  imageUrl: varchar("image_url", { length: 512 }).notNull(),
  mediaKey: varchar("media_key", { length: 1024 }),
  imagePositionX: int("image_position_x").default(50).notNull(),
  imagePositionY: int("image_position_y").default(50).notNull(),
  imageScale: int("image_scale").default(100).notNull(),
  imageRotation: int("image_rotation").default(0).notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  camelImageUnique: uniqueIndex("camel_photos_camel_image_unique").on(table.camelRecordId, table.imageUrl)
}));
var camelProductionLinks = mysqlTable("camel_production_links", {
  id: int("id").autoincrement().primaryKey(),
  camelRecordId: int("camel_record_id").notNull(),
  url: varchar("url", { length: 512 }).notNull(),
  title: varchar("title", { length: 255 }).default("\u0631\u0627\u0628\u0637 \u0625\u0646\u062A\u0627\u062C").notNull(),
  platform: varchar("platform", { length: 100 }).notNull(),
  linkedAt: timestamp("linked_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  camelLinkUnique: uniqueIndex("camel_production_links_camel_url_unique").on(table.camelRecordId, table.url)
}));
var contentLikes = mysqlTable("content_likes", {
  id: int("id").autoincrement().primaryKey(),
  contentItemId: int("content_item_id").notNull(),
  userId: int("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  contentUserUnique: uniqueIndex("content_likes_content_user_unique").on(table.contentItemId, table.userId)
}));
var contentComments = mysqlTable("content_comments", {
  id: int("id").autoincrement().primaryKey(),
  contentItemId: int("content_item_id").notNull(),
  userId: int("user_id").notNull(),
  body: text("body").notNull(),
  isVisible: boolean("is_visible").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var contentGuestLikes = mysqlTable("content_guest_likes", {
  id: int("id").autoincrement().primaryKey(),
  contentItemId: int("content_item_id").notNull(),
  visitorToken: varchar("visitor_token", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  contentVisitorUnique: uniqueIndex("content_guest_likes_content_visitor_unique").on(table.contentItemId, table.visitorToken)
}));
var contentGuestComments = mysqlTable("content_guest_comments", {
  id: int("id").autoincrement().primaryKey(),
  contentItemId: int("content_item_id").notNull(),
  visitorToken: varchar("visitor_token", { length: 64 }).notNull(),
  authorName: varchar("author_name", { length: 100 }).default("\u0632\u0627\u0626\u0631 \u0627\u0644\u0645\u062D\u0645\u064A\u0629").notNull(),
  body: text("body").notNull(),
  isVisible: boolean("is_visible").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// server/_core/databaseUrl.ts
function resolveDatabaseUrl(env = process.env) {
  const directUrl = env.DATABASE_URL?.trim();
  if (directUrl) return directUrl;
  const host = env.TIDB_HOST?.trim();
  const user = env.TIDB_USER?.trim();
  const password = env.TIDB_PASSWORD;
  const database = env.TIDB_DATABASE?.trim() || env.TIDB_DB_NAME?.trim();
  const port = env.TIDB_PORT?.trim() || "4000";
  if (!host || !user || !password || !database) return "";
  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}?sslaccept=strict`;
}
function getTiDbConnectionOptions(env = process.env) {
  const directUrl = env.DATABASE_URL?.trim();
  const targetDatabase = env.TIDB_TARGET_DATABASE?.trim();
  if (directUrl) {
    try {
      const connection = getTiDbConnectionOptionsFromUrl(directUrl);
      return targetDatabase ? { ...connection, database: targetDatabase } : connection;
    } catch {
      return null;
    }
  }
  const host = env.TIDB_HOST?.trim();
  const user = env.TIDB_USER?.trim();
  const password = env.TIDB_PASSWORD;
  const database = targetDatabase || env.TIDB_DATABASE?.trim() || env.TIDB_DB_NAME?.trim();
  const port = Number(env.TIDB_PORT?.trim() || "4000");
  if (!host || !user || !password || !database || !Number.isInteger(port)) return null;
  return {
    host,
    port,
    user,
    password,
    database,
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true }
  };
}
function getTiDbConnectionOptionsFromUrl(connectionUrl) {
  const parsed = new URL(connectionUrl);
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  const port = Number(parsed.port || "4000");
  if (parsed.protocol !== "mysql:" || !parsed.hostname || !parsed.username || !parsed.password || !database || !Number.isInteger(port)) {
    throw new Error("Invalid TiDB migration connection URL.");
  }
  return {
    host: parsed.hostname,
    port,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true }
  };
}
function hasTiDbPasswordPlaceholder(connectionUrl) {
  try {
    const password = decodeURIComponent(new URL(connectionUrl).password);
    return /<[^>]+>|\{[^}]+\}|^password$/i.test(password);
  } catch {
    return false;
  }
}

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: resolveDatabaseUrl(),
  tiDbConnectionOptions: getTiDbConnectionOptions(),
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
var databaseConnectionStateLogged = false;
async function getDb() {
  if (!_db && ENV.databaseUrl) {
    if (!databaseConnectionStateLogged) {
      databaseConnectionStateLogged = true;
      console.info("[Database] TiDB connection configuration", {
        configured: Boolean(ENV.tiDbConnectionOptions),
        passwordLooksLikePlaceholder: hasTiDbPasswordPlaceholder(ENV.databaseUrl)
      });
    }
    try {
      _db = ENV.tiDbConnectionOptions ? drizzle(mysql.createPool({
        ...ENV.tiDbConnectionOptions,
        connectionLimit: 1,
        maxIdle: 1,
        enableKeepAlive: true
      })) : drizzle(ENV.databaseUrl);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = field === "email" && typeof value === "string" ? normalizeEmail(value) : value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    const emailGrantedAdmin = typeof user.email === "string" && await isAdminEmailGranted(user.email);
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId || emailGrantedAdmin) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}
async function isAdminEmailGranted(email) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: adminEmailAccess.id }).from(adminEmailAccess).where(eq(adminEmailAccess.email, normalizeEmail(email))).limit(1);
  return result.length > 0;
}
async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u063A\u064A\u0631 \u0645\u062A\u0627\u062D\u0629 \u062D\u0627\u0644\u064A\u0627\u064B.");
  return db;
}
var applicationSchemaReady = null;
function ensureApplicationSchema() {
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
      await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `camel_production_links` (`id` int AUTO_INCREMENT NOT NULL, `camel_record_id` int NOT NULL, `url` varchar(512) NOT NULL, `platform` varchar(100) NOT NULL, `linked_at` timestamp NOT NULL DEFAULT (now()), `created_at` timestamp NOT NULL DEFAULT (now()), `title` varchar(255) NOT NULL DEFAULT '\u0631\u0627\u0628\u0637 \u0625\u0646\u062A\u0627\u062C', CONSTRAINT `camel_production_links_id` PRIMARY KEY(`id`), CONSTRAINT `camel_production_links_camel_url_unique` UNIQUE(`camel_record_id`,`url`))"));
      await db.execute(sql.raw("ALTER TABLE `camel_production_links` ADD COLUMN IF NOT EXISTS `title` varchar(255) NOT NULL DEFAULT '\u0631\u0627\u0628\u0637 \u0625\u0646\u062A\u0627\u062C'"));
      await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `content_guest_likes` (`id` int AUTO_INCREMENT NOT NULL, `content_item_id` int NOT NULL, `visitor_token` varchar(64) NOT NULL, `created_at` timestamp NOT NULL DEFAULT (now()), CONSTRAINT `content_guest_likes_id` PRIMARY KEY(`id`), CONSTRAINT `content_guest_likes_content_visitor_unique` UNIQUE(`content_item_id`,`visitor_token`))"));
      await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `content_guest_comments` (`id` int AUTO_INCREMENT NOT NULL, `content_item_id` int NOT NULL, `visitor_token` varchar(64) NOT NULL, `author_name` varchar(100) NOT NULL DEFAULT '\u0632\u0627\u0626\u0631 \u0627\u0644\u0645\u062D\u0645\u064A\u0629', `body` text NOT NULL, `is_visible` boolean NOT NULL DEFAULT true, `created_at` timestamp NOT NULL DEFAULT (now()), CONSTRAINT `content_guest_comments_id` PRIMARY KEY(`id`))"));
    })().catch((error) => {
      applicationSchemaReady = null;
      throw error;
    });
  }
  return applicationSchemaReady;
}
var ensureAdminEmailPasswordSchema = ensureApplicationSchema;
async function listAdminEmailAccess() {
  const db = await requireDb();
  return db.select().from(adminEmailAccess).orderBy(desc(adminEmailAccess.createdAt));
}
async function getAdminEmailAccess(email) {
  const db = await requireDb();
  const result = await db.select().from(adminEmailAccess).where(eq(adminEmailAccess.email, normalizeEmail(email))).limit(1);
  return result[0] ?? null;
}
async function setAdminEmailPasswordHash(email, passwordHash) {
  const db = await requireDb();
  await db.update(adminEmailAccess).set({ passwordHash }).where(eq(adminEmailAccess.email, normalizeEmail(email)));
}
async function grantAdminEmailAccess(email, createdByUserId) {
  const db = await requireDb();
  const normalizedEmail = normalizeEmail(email);
  await db.insert(adminEmailAccess).values({ email: normalizedEmail, createdByUserId }).onDuplicateKeyUpdate({
    set: { email: normalizedEmail }
  });
  await db.update(users).set({ role: "admin" }).where(eq(users.email, normalizedEmail));
}
async function revokeAdminEmailAccess(email) {
  const db = await requireDb();
  const normalizedEmail = normalizeEmail(email);
  await db.delete(adminEmailAccess).where(eq(adminEmailAccess.email, normalizedEmail));
  await db.update(users).set({ role: "user" }).where(and(
    eq(users.email, normalizedEmail),
    ne(users.openId, ENV.ownerOpenId)
  ));
}
async function getReserveSettings() {
  const db = await requireDb();
  const result = await db.select().from(reserveSettings).where(eq(reserveSettings.id, 1)).limit(1);
  return result[0] ?? null;
}
async function updateReserveSettings(values) {
  const db = await requireDb();
  await db.insert(reserveSettings).values({ id: 1, ...values }).onDuplicateKeyUpdate({ set: values });
}
var camelRecordNumber = sql`CAST(SUBSTRING_INDEX(${camelRecords.recordCode}, '-', -1) AS UNSIGNED)`;
function camelRecordOrder() {
  return [asc(camelRecordNumber), asc(camelRecords.recordCode), asc(camelRecords.id)];
}
async function listPublicCamelRecords() {
  await ensureApplicationSchema();
  const db = await requireDb();
  return db.select().from(camelRecords).where(eq(camelRecords.isPublished, true)).orderBy(...camelRecordOrder());
}
async function listAllCamelRecords() {
  await ensureApplicationSchema();
  const db = await requireDb();
  return db.select().from(camelRecords).orderBy(...camelRecordOrder());
}
async function createCamelRecord(values) {
  const db = await requireDb();
  return db.insert(camelRecords).values(values);
}
async function updateCamelRecord(id, values) {
  const db = await requireDb();
  await db.update(camelRecords).set(values).where(eq(camelRecords.id, id));
}
async function deleteCamelRecord(id) {
  const db = await requireDb();
  await db.delete(camelRecords).where(eq(camelRecords.id, id));
}
async function listPublicContentItems() {
  const db = await requireDb();
  return db.select({
    ...getTableColumns(contentItems),
    likeCount: sql`(select count(*) from ${contentLikes} where ${contentLikes.contentItemId} = ${contentItems.id})`.as("like_count")
  }).from(contentItems).where(eq(contentItems.isPublished, true)).orderBy(desc(contentItems.publishedAt), asc(contentItems.sortOrder));
}
async function listAllContentItems() {
  const db = await requireDb();
  return db.select().from(contentItems).orderBy(desc(contentItems.createdAt));
}
async function createContentItem(values) {
  const db = await requireDb();
  return db.insert(contentItems).values(values);
}
async function updateContentItem(id, values) {
  const db = await requireDb();
  await db.update(contentItems).set(values).where(eq(contentItems.id, id));
}
async function deleteContentItem(id) {
  const db = await requireDb();
  const existing = await db.select({
    mediaUrl: contentItems.mediaUrl,
    mediaKey: contentItems.mediaKey,
    thumbnailUrl: contentItems.thumbnailUrl,
    thumbnailKey: contentItems.thumbnailKey
  }).from(contentItems).where(eq(contentItems.id, id)).limit(1);
  await db.delete(contentItems).where(eq(contentItems.id, id));
  return existing[0] ?? null;
}
async function listCamelPhotos(camelRecordId) {
  await ensureApplicationSchema();
  const db = await requireDb();
  return db.select().from(camelPhotos).where(eq(camelPhotos.camelRecordId, camelRecordId)).orderBy(asc(camelPhotos.sortOrder), asc(camelPhotos.id));
}
async function listCamelPhotoCounts() {
  await ensureApplicationSchema();
  const db = await requireDb();
  return db.select({
    camelRecordId: camelRecords.id,
    count: countDistinct(sql`COALESCE(${camelPhotos.imageUrl}, ${camelRecords.imageUrl})`)
  }).from(camelRecords).leftJoin(camelPhotos, eq(camelPhotos.camelRecordId, camelRecords.id)).groupBy(camelRecords.id, camelRecords.imageUrl);
}
async function createCamelPhoto(values) {
  await ensureApplicationSchema();
  const db = await requireDb();
  return db.insert(camelPhotos).values(values);
}
async function updateCamelPhoto(id, values) {
  await ensureApplicationSchema();
  const db = await requireDb();
  const existing = await db.select({ id: camelPhotos.id }).from(camelPhotos).where(eq(camelPhotos.id, id)).limit(1);
  if (!existing[0]) return null;
  await db.update(camelPhotos).set(values).where(eq(camelPhotos.id, id));
  return { id };
}
async function ensureCamelPhotoWithDb(db, values) {
  const existing = await db.select({ id: camelPhotos.id }).from(camelPhotos).where(and(
    eq(camelPhotos.camelRecordId, values.camelRecordId),
    eq(camelPhotos.imageUrl, values.imageUrl)
  )).limit(1);
  if (existing[0]) return { alreadyAdded: true };
  await db.insert(camelPhotos).values(values);
  return { alreadyAdded: false };
}
async function ensureCamelPhoto(values) {
  return ensureCamelPhotoWithDb(await requireDb(), values);
}
async function setCamelPhotoAsPrimary(photoId) {
  await ensureApplicationSchema();
  const db = await requireDb();
  const existing = await db.select({
    camelRecordId: camelPhotos.camelRecordId,
    imageUrl: camelPhotos.imageUrl,
    imagePositionX: camelPhotos.imagePositionX,
    imagePositionY: camelPhotos.imagePositionY,
    imageScale: camelPhotos.imageScale,
    imageRotation: camelPhotos.imageRotation
  }).from(camelPhotos).where(eq(camelPhotos.id, photoId)).limit(1);
  const photo = existing[0];
  if (!photo) return null;
  await db.update(camelRecords).set({
    imageUrl: photo.imageUrl,
    imagePositionX: photo.imagePositionX,
    imagePositionY: photo.imagePositionY,
    imageScale: photo.imageScale,
    imageRotation: photo.imageRotation
  }).where(eq(camelRecords.id, photo.camelRecordId));
  return photo;
}
async function deleteCamelPhoto(id) {
  await ensureApplicationSchema();
  const db = await requireDb();
  const existing = await db.select({ camelRecordId: camelPhotos.camelRecordId, imageUrl: camelPhotos.imageUrl, mediaKey: camelPhotos.mediaKey }).from(camelPhotos).where(eq(camelPhotos.id, id)).limit(1);
  const photo = existing[0];
  if (!photo) return null;
  await db.delete(camelPhotos).where(eq(camelPhotos.id, id));
  const camel = await db.select({ imageUrl: camelRecords.imageUrl }).from(camelRecords).where(eq(camelRecords.id, photo.camelRecordId)).limit(1);
  if (camel[0]?.imageUrl === photo.imageUrl) {
    const replacement = await db.select({ imageUrl: camelPhotos.imageUrl }).from(camelPhotos).where(eq(camelPhotos.camelRecordId, photo.camelRecordId)).orderBy(asc(camelPhotos.sortOrder), asc(camelPhotos.id)).limit(1);
    await db.update(camelRecords).set({ imageUrl: replacement[0]?.imageUrl ?? "" }).where(eq(camelRecords.id, photo.camelRecordId));
  }
  return photo;
}
async function listCamelProductionLinks(camelRecordId) {
  await ensureApplicationSchema();
  const db = await requireDb();
  return db.select().from(camelProductionLinks).where(eq(camelProductionLinks.camelRecordId, camelRecordId)).orderBy(desc(camelProductionLinks.linkedAt), desc(camelProductionLinks.id));
}
async function createCamelProductionLink(values) {
  await ensureApplicationSchema();
  const db = await requireDb();
  return db.insert(camelProductionLinks).values(values);
}
async function updateCamelProductionLink(id, values) {
  await ensureApplicationSchema();
  const db = await requireDb();
  await db.update(camelProductionLinks).set(values).where(eq(camelProductionLinks.id, id));
}
async function deleteCamelProductionLink(id) {
  await ensureApplicationSchema();
  const db = await requireDb();
  await db.delete(camelProductionLinks).where(eq(camelProductionLinks.id, id));
}
async function getContentEngagement(contentItemId, userId, visitorToken) {
  await ensureApplicationSchema();
  const db = await requireDb();
  const [likeSummary] = await db.select({ count: count(contentLikes.id) }).from(contentLikes).where(eq(contentLikes.contentItemId, contentItemId));
  const [guestLikeSummary] = await db.select({ count: count(contentGuestLikes.id) }).from(contentGuestLikes).where(eq(contentGuestLikes.contentItemId, contentItemId));
  const comments = await db.select({
    id: contentComments.id,
    body: contentComments.body,
    createdAt: contentComments.createdAt,
    userId: contentComments.userId,
    authorName: users.name
  }).from(contentComments).leftJoin(users, eq(contentComments.userId, users.id)).where(and(eq(contentComments.contentItemId, contentItemId), eq(contentComments.isVisible, true))).orderBy(asc(contentComments.createdAt));
  const guestComments = await db.select({
    id: contentGuestComments.id,
    body: contentGuestComments.body,
    createdAt: contentGuestComments.createdAt,
    userId: sql`NULL`,
    authorName: contentGuestComments.authorName
  }).from(contentGuestComments).where(and(eq(contentGuestComments.contentItemId, contentItemId), eq(contentGuestComments.isVisible, true))).orderBy(asc(contentGuestComments.createdAt));
  const likedAsUser = userId ? (await db.select({ id: contentLikes.id }).from(contentLikes).where(and(eq(contentLikes.contentItemId, contentItemId), eq(contentLikes.userId, userId))).limit(1)).length > 0 : false;
  const likedAsGuest = visitorToken ? (await db.select({ id: contentGuestLikes.id }).from(contentGuestLikes).where(and(eq(contentGuestLikes.contentItemId, contentItemId), eq(contentGuestLikes.visitorToken, visitorToken))).limit(1)).length > 0 : false;
  const mergedComments = [...comments, ...guestComments].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  );
  return {
    likeCount: Number(likeSummary?.count ?? 0) + Number(guestLikeSummary?.count ?? 0),
    liked: likedAsUser || likedAsGuest,
    comments: mergedComments
  };
}
async function toggleContentLike(contentItemId, userId, visitorToken) {
  await ensureApplicationSchema();
  const db = await requireDb();
  if (userId) {
    const existing2 = await db.select({ id: contentLikes.id }).from(contentLikes).where(and(eq(contentLikes.contentItemId, contentItemId), eq(contentLikes.userId, userId))).limit(1);
    if (existing2[0]) {
      await db.delete(contentLikes).where(eq(contentLikes.id, existing2[0].id));
      return { liked: false };
    }
    await db.insert(contentLikes).values({ contentItemId, userId });
    return { liked: true };
  }
  if (!visitorToken) throw new Error("VISITOR_TOKEN_REQUIRED");
  const existing = await db.select({ id: contentGuestLikes.id }).from(contentGuestLikes).where(and(eq(contentGuestLikes.contentItemId, contentItemId), eq(contentGuestLikes.visitorToken, visitorToken))).limit(1);
  if (existing[0]) {
    await db.delete(contentGuestLikes).where(eq(contentGuestLikes.id, existing[0].id));
    return { liked: false };
  }
  await db.insert(contentGuestLikes).values({ contentItemId, visitorToken });
  return { liked: true };
}
async function addContentComment(contentItemId, userId, body, visitorToken) {
  await ensureApplicationSchema();
  const db = await requireDb();
  const trimmedBody = body.trim();
  if (userId) return db.insert(contentComments).values({ contentItemId, userId, body: trimmedBody });
  if (!visitorToken) throw new Error("VISITOR_TOKEN_REQUIRED");
  return db.insert(contentGuestComments).values({ contentItemId, visitorToken, body: trimmedBody });
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    return decodeOAuthState(state).redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey2 = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey2);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey2 = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey2, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader2(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/storageProxy.ts
function registerStorageProxy(app) {
  const serveStoredMedia = async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  };
  app.get("/manus-storage/*", serveStoredMedia);
  app.get("/api/storage/*", serveStoredMedia);
}

// server/blobUploadRoute.ts
import { handleUploadPresigned } from "@vercel/blob/client";
import { issueSignedToken } from "@vercel/blob";

// server/externalAdminAuth.ts
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { parse as parseCookieHeader3 } from "cookie";
import { SignJWT as SignJWT2, jwtVerify as jwtVerify2 } from "jose";
var EXTERNAL_ADMIN_COOKIE = "zomool_admin_session";
var SESSION_TTL_SECONDS = 60 * 60 * 12;
var RATE_WINDOW_MS = 10 * 60 * 1e3;
var LOCKOUT_MS = 15 * 60 * 1e3;
var MAX_ATTEMPTS = 5;
var scrypt = promisify(scryptCallback);
var ACCOUNT_PASSWORD_PREFIX = "scrypt";
var ACCOUNT_PASSWORD_KEY_LENGTH = 64;
var attempts = /* @__PURE__ */ new Map();
function secretKey() {
  const configuredSecret = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || "";
  if (configuredSecret.length < 12) throw new Error("No server secret is configured for admin sessions");
  const derivedSecret = createHash("sha256").update(`zomool-reserve-admin-session:${configuredSecret}`).digest("hex");
  return new TextEncoder().encode(derivedSecret);
}
function configuredPassword() {
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (password.length < 12) throw new Error("ADMIN_PASSWORD is not configured");
  return password;
}
function sameSecret(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
function clientKey(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const address = typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : req.ip || "unknown";
  return createHash("sha256").update(address || "unknown").digest("hex").slice(0, 24);
}
function assertLoginAllowed(req, now = Date.now()) {
  const key = clientKey(req);
  const state = attempts.get(key);
  if (!state) return;
  if (state.lockedUntil > now) {
    throw new Error("ADMIN_LOGIN_RATE_LIMITED");
  }
  if (now - state.windowStartedAt >= RATE_WINDOW_MS) attempts.delete(key);
}
function recordLoginFailure(req, now = Date.now()) {
  const key = clientKey(req);
  const current = attempts.get(key);
  const state = !current || now - current.windowStartedAt >= RATE_WINDOW_MS ? { failed: 0, windowStartedAt: now, lockedUntil: 0 } : current;
  state.failed += 1;
  if (state.failed >= MAX_ATTEMPTS) state.lockedUntil = now + LOCKOUT_MS;
  attempts.set(key, state);
}
function clearLoginFailures(req) {
  attempts.delete(clientKey(req));
}
function verifyAdminPassword(password) {
  return sameSecret(password, configuredPassword());
}
async function hashAdminAccountPassword(password) {
  if (password.length < 8) throw new Error("ADMIN_ACCOUNT_PASSWORD_TOO_SHORT");
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, ACCOUNT_PASSWORD_KEY_LENGTH);
  return `${ACCOUNT_PASSWORD_PREFIX}$${salt}$${derivedKey.toString("hex")}`;
}
async function verifyAdminAccountPassword(password, storedHash) {
  if (!storedHash) return false;
  const [prefix, salt, encodedKey] = storedHash.split("$");
  if (prefix !== ACCOUNT_PASSWORD_PREFIX || !salt || !encodedKey) return false;
  try {
    const expected = Buffer.from(encodedKey, "hex");
    const actual = await scrypt(password, salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
async function createExternalAdminSession(email) {
  return new SignJWT2({ kind: "external-admin", ...email ? { email } : {} }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setIssuedAt().setIssuer("zomool-reserve-admin").setAudience("zomool-reserve").setExpirationTime(`${SESSION_TTL_SECONDS}s`).sign(secretKey());
}
async function verifyExternalAdminSession(token) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify2(token, secretKey(), {
      algorithms: ["HS256"],
      issuer: "zomool-reserve-admin",
      audience: "zomool-reserve"
    });
    return payload.kind === "external-admin";
  } catch {
    return false;
  }
}
async function hasExternalAdminSession(req) {
  const cookies = parseCookieHeader3(req.headers.cookie ?? "");
  return verifyExternalAdminSession(cookies[EXTERNAL_ADMIN_COOKIE]);
}
async function externalAdminSessionEmail(req) {
  const cookies = parseCookieHeader3(req.headers.cookie ?? "");
  const token = cookies[EXTERNAL_ADMIN_COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify2(token, secretKey(), { algorithms: ["HS256"], issuer: "zomool-reserve-admin", audience: "zomool-reserve" });
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}
function externalAdminUser(email = null) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: "external-admin",
    name: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062D\u0645\u064A\u0629",
    email,
    loginMethod: email ? "external-email-password" : "external-password",
    role: "admin",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now
  };
}
function externalAdminCookieOptions(req) {
  const forwardedProtocol = req.headers["x-forwarded-proto"];
  const isHttps = req.secure || forwardedProtocol === "https" || req.protocol === "https";
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    // Express cookie maxAge is milliseconds; the JWT lifetime above is seconds.
    maxAge: SESSION_TTL_SECONDS * 1e3
  };
}

// server/blobUploadRoute.ts
var ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "video/quicktime"
];
var MAX_MEDIA_BYTES = 25 * 1024 * 1024;
var FALLBACK_BLOB_WEBHOOK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAogZu1ggDOPjruoMlqC2a
/FQTdFDUdmPRpq2k9hRFk7LHg5WGyIFPLlB/Hix0U5hYJxTsXgbwM+bz7GpRucHm
OjAzg3nMk9jOvQ/zNV5SrVQyDEZ5vMnBE7q+zldsFOzuqjHSpqbgrZ9S9ydXn09D
bNbEsFuzFCiDOk8SN6T0jEmjxVMQ5rOWhje/O4vGIivGGKN6Vbs7JGaT4ZpD7Z2u
ecYSqMsT0kIRR5plmEuXYu+kgW4/sy74CfmwMaZ5lo0oFcCUmZcahleLNHAxm1js
CxhWnhvoWZ+eSEskhKVE6fdRfvzrgA+4S8QV4SuQMUUoGFVP/VnMky+78Txke8TY
JwIDAQAB
-----END PUBLIC KEY-----`;
var blobWebhookPublicKey = process.env.BLOB_WEBHOOK_PUBLIC_KEY || FALLBACK_BLOB_WEBHOOK_PUBLIC_KEY;
function registerBlobUploadRoute(app) {
  app.post("/api/media/upload-presigned", async (req, res) => {
    if (!await hasExternalAdminSession(req)) {
      res.status(401).json({ error: "Not authorized" });
      return;
    }
    try {
      const request = new Request(`${req.protocol}://${req.get("host")}${req.originalUrl}`, {
        method: req.method,
        headers: Object.fromEntries(
          Object.entries(req.headers).filter((entry) => typeof entry[1] === "string")
        ),
        body: JSON.stringify(req.body ?? {})
      });
      const jsonResponse = await handleUploadPresigned({
        body: req.body,
        request,
        webhookPublicKey: blobWebhookPublicKey,
        getSignedToken: async (pathname) => ({
          token: await issueSignedToken({
            pathname,
            operations: ["put"],
            allowedContentTypes: ALLOWED_CONTENT_TYPES,
            maximumSizeInBytes: MAX_MEDIA_BYTES,
            validUntil: Date.now() + 10 * 60 * 1e3
          }),
          urlOptions: {
            allowedContentTypes: ALLOWED_CONTENT_TYPES,
            maximumSizeInBytes: MAX_MEDIA_BYTES,
            addRandomSuffix: true,
            allowOverwrite: false,
            validUntil: Date.now() + 10 * 60 * 1e3,
            cacheControlMaxAge: 30 * 24 * 60 * 60
          }
        })
      });
      res.status(200).json(jsonResponse);
    } catch (error) {
      console.error("[Blob] Presigned upload failed", {
        code: error instanceof Error ? error.name : "UNKNOWN"
      });
      res.status(400).json({ error: "\u062A\u0639\u0630\u0631 \u062A\u062C\u0647\u064A\u0632 \u0631\u0641\u0639 \u0627\u0644\u0648\u0633\u064A\u0637. \u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649." });
    }
  });
}

// server/routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z2 } from "zod";

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/storage.ts
import { del, put } from "@vercel/blob";
function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) {
    throw new Error("Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY");
  }
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
function isVercelBlobConfigured() {
  return Boolean(process.env.BLOB_STORE_ID && (process.env.VERCEL_OIDC_TOKEN || process.env.BLOB_READ_WRITE_TOKEN));
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const key = appendHashSuffix(normalizeKey(relKey));
  if (isVercelBlobConfigured()) {
    const body = typeof data === "string" ? data : Buffer.from(data);
    const blob2 = await put(key, body, {
      access: "public",
      addRandomSuffix: false,
      contentType,
      multipart: Buffer.byteLength(data) > 4 * 1024 * 1024
    });
    return { key: blob2.pathname, url: blob2.url };
  }
  const { forgeUrl, forgeKey } = getForgeConfig();
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }
  const { url: s3Url } = await presignResp.json();
  if (!s3Url) throw new Error("Forge returned empty presign URL");
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob
  });
  if (!uploadResp.ok) throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  return { key, url: `/manus-storage/${key}` };
}
async function storageDelete(keyOrUrl) {
  if (!keyOrUrl || !isVercelBlobConfigured()) return false;
  if (!keyOrUrl.includes(".blob.vercel-storage.com/") && !keyOrUrl.startsWith("reserve/")) return false;
  await del(keyOrUrl);
  return true;
}

// server/routers.ts
var camelInput = z2.object({
  recordCode: z2.string().min(1).max(32),
  name: z2.string().min(1).max(255),
  imageUrl: z2.string().min(1).max(1024),
  imagePositionX: z2.number().int().min(0).max(100),
  imagePositionY: z2.number().int().min(0).max(100),
  imageScale: z2.number().int().min(50).max(220),
  imageRotation: z2.number().int().min(-180).max(180),
  shade: z2.string().min(1).max(255),
  owner: z2.string().min(1).max(255),
  father: z2.string().min(1).max(255),
  mother: z2.string().min(1).max(255),
  maternalSibling: z2.string().nullable().optional(),
  maternalSiblingLabel: z2.string().min(1).max(100),
  status: z2.string().min(1),
  achievements: z2.string().min(1),
  production: z2.string().min(1),
  worker: z2.string().min(1).max(255),
  phone: z2.string().min(1).max(64),
  subscriptionUrl: z2.string().trim().url().max(1024).nullable().optional(),
  achievementsUrl: z2.string().trim().url().max(1024).nullable().optional(),
  note: z2.string().min(1),
  isPublished: z2.boolean(),
  sortOrder: z2.number().int().min(0).max(9999)
});
var contentInput = z2.object({
  kind: z2.enum(["news", "announcement", "celebration", "photo", "video"]),
  title: z2.string().min(1).max(255),
  body: z2.string().nullable().optional(),
  mediaUrl: z2.string().nullable().optional(),
  mediaKey: z2.string().nullable().optional(),
  thumbnailUrl: z2.string().nullable().optional(),
  thumbnailKey: z2.string().nullable().optional(),
  durationSeconds: z2.number().int().min(0).max(24 * 60 * 60).nullable().optional(),
  camelRecordId: z2.number().int().positive().nullable().optional(),
  isPublished: z2.boolean(),
  sortOrder: z2.number().int().min(0).max(9999),
  publishedAt: z2.date()
});
var reserveSettingsInput = z2.object({
  reserveName: z2.string().trim().min(1).max(255),
  locationName: z2.string().trim().min(1).max(255),
  mapUrl: z2.string().url().max(1024),
  phone: z2.string().trim().min(1).max(64),
  veterinaryService: z2.string().trim().min(1),
  climateService: z2.string().trim().min(1),
  visitHours: z2.string().trim().min(1).max(255),
  visitDescription: z2.string().trim().min(1)
});
var adminEmailInput = z2.object({ email: z2.string().trim().toLowerCase().email().max(320) });
var storedMediaUrl = z2.string().trim().max(1024).refine((value) => {
  if (/^https?:\/\//i.test(value)) return true;
  return value.startsWith("/manus-storage/") || value.startsWith("/media/");
}, "\u0631\u0627\u0628\u0637 \u0627\u0644\u0635\u0648\u0631\u0629 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0631\u0627\u0628\u0637 \u062A\u062E\u0632\u064A\u0646 \u0635\u0627\u0644\u062D\u0627\u064B.");
var camelPhotoInput = z2.object({ camelRecordId: z2.number().int().positive(), imageUrl: storedMediaUrl, mediaKey: z2.string().nullable().optional(), sortOrder: z2.number().int().min(0).max(9999) });
var camelPhotoAdjustmentInput = z2.object({
  id: z2.number().int().positive(),
  values: z2.object({
    imagePositionX: z2.number().int().min(0).max(100),
    imagePositionY: z2.number().int().min(0).max(100),
    imageScale: z2.number().int().min(50).max(220),
    imageRotation: z2.number().int().min(-180).max(180)
  })
});
var camelProductionLinkInput = z2.object({
  camelRecordId: z2.number().int().positive(),
  title: z2.string().trim().min(1).max(255),
  url: z2.string().trim().url().max(512)
});
var contentItemIdInput = z2.object({ contentItemId: z2.number().int().positive() });
function getProductionLinkPlatform(url) {
  const hostname = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  if (hostname === "youtube.com" || hostname.endsWith(".youtube.com") || hostname === "youtu.be") return "\u064A\u0648\u062A\u064A\u0648\u0628";
  if (hostname === "instagram.com" || hostname.endsWith(".instagram.com")) return "\u0625\u0646\u0633\u062A\u063A\u0631\u0627\u0645";
  if (hostname === "tiktok.com" || hostname.endsWith(".tiktok.com")) return "\u062A\u064A\u0643 \u062A\u0648\u0643";
  if (hostname === "facebook.com" || hostname.endsWith(".facebook.com") || hostname === "fb.watch") return "\u0641\u064A\u0633\u0628\u0648\u0643";
  if (hostname === "x.com" || hostname.endsWith(".x.com") || hostname === "twitter.com" || hostname.endsWith(".twitter.com")) return "\u0625\u0643\u0633";
  return "\u0631\u0627\u0628\u0637 \u062E\u0627\u0631\u062C\u064A";
}
var appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    login: publicProcedure.input(z2.object({ email: z2.string().trim().toLowerCase().email().optional(), password: z2.string().min(8).max(256) })).mutation(async ({ ctx, input }) => {
      try {
        assertLoginAllowed(ctx.req);
      } catch {
        throw new TRPCError3({ code: "TOO_MANY_REQUESTS", message: "\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u0643\u062B\u064A\u0631\u0629. \u0627\u0646\u062A\u0638\u0631 \u0642\u0644\u064A\u0644\u0627\u064B \u062B\u0645 \u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649." });
      }
      try {
        await ensureAdminEmailPasswordSchema();
      } catch {
        throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "\u062A\u0639\u0630\u0631 \u062A\u062C\u0647\u064A\u0632 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u0629. \u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649." });
      }
      let sessionEmail = null;
      let valid = false;
      if (input.email) {
        const access = await getAdminEmailAccess(input.email);
        if (!access) {
          recordLoginFailure(ctx.req);
          throw new TRPCError3({ code: "UNAUTHORIZED", message: "\u0647\u0630\u0627 \u0627\u0644\u0628\u0631\u064A\u062F \u063A\u064A\u0631 \u0645\u0636\u0627\u0641 \u0641\u064A \u0642\u0627\u0626\u0645\u0629 \u0645\u0633\u0624\u0648\u0644\u064A \u0627\u0644\u0645\u062D\u0645\u064A\u0629." });
        }
        if (access.passwordHash) {
          valid = await verifyAdminAccountPassword(input.password, access.passwordHash);
        } else {
          try {
            await setAdminEmailPasswordHash(input.email, await hashAdminAccountPassword(input.password));
            valid = true;
          } catch {
            throw new TRPCError3({ code: "BAD_REQUEST", message: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 8 \u0623\u062D\u0631\u0641 \u0623\u0648 \u0623\u0643\u062B\u0631." });
          }
        }
        sessionEmail = input.email;
      } else {
        try {
          valid = verifyAdminPassword(input.password);
        } catch {
          throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "\u062E\u062F\u0645\u0629 \u062F\u062E\u0648\u0644 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0628\u0639\u062F." });
        }
      }
      if (!valid) {
        recordLoginFailure(ctx.req);
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "\u0627\u0644\u0628\u0631\u064A\u062F \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629." });
      }
      clearLoginFailures(ctx.req);
      const token = await createExternalAdminSession(sessionEmail);
      ctx.res.cookie(EXTERNAL_ADMIN_COOKIE, token, externalAdminCookieOptions(ctx.req));
      return { success: true };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie(EXTERNAL_ADMIN_COOKIE, { ...externalAdminCookieOptions(ctx.req), maxAge: 0 });
      return {
        success: true
      };
    })
  }),
  camel: router({
    listPublic: publicProcedure.query(() => listPublicCamelRecords()),
    listAll: adminProcedure.query(() => listAllCamelRecords()),
    create: adminProcedure.input(camelInput).mutation(({ input }) => createCamelRecord(input)),
    update: adminProcedure.input(z2.object({ id: z2.number().int().positive(), values: camelInput.partial() })).mutation(({ input }) => updateCamelRecord(input.id, input.values)),
    remove: adminProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(({ input }) => deleteCamelRecord(input.id))
  }),
  camelPhotos: router({
    list: publicProcedure.input(z2.object({ camelRecordId: z2.number().int().positive() })).query(({ input }) => listCamelPhotos(input.camelRecordId)),
    counts: publicProcedure.query(() => listCamelPhotoCounts()),
    create: adminProcedure.input(camelPhotoInput).mutation(({ input }) => createCamelPhoto(input)),
    update: adminProcedure.input(camelPhotoAdjustmentInput).mutation(async ({ input }) => {
      const updated = await updateCamelPhoto(input.id, input.values);
      if (!updated) throw new TRPCError3({ code: "NOT_FOUND", message: "\u0627\u0644\u0635\u0648\u0631\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629." });
      return { success: true };
    }),
    setPrimary: adminProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ input }) => {
      const updated = await setCamelPhotoAsPrimary(input.id);
      if (!updated) throw new TRPCError3({ code: "NOT_FOUND", message: "\u0627\u0644\u0635\u0648\u0631\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629." });
      return { success: true, camelRecordId: updated.camelRecordId };
    }),
    remove: adminProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ input }) => {
      const deleted = await deleteCamelPhoto(input.id);
      if (deleted?.mediaKey) await storageDelete(deleted.mediaKey);
      return { success: true };
    })
  }),
  camelProductionLinks: router({
    list: publicProcedure.input(z2.object({ camelRecordId: z2.number().int().positive() })).query(({ input }) => listCamelProductionLinks(input.camelRecordId)),
    create: adminProcedure.input(camelProductionLinkInput).mutation(({ input }) => createCamelProductionLink({
      camelRecordId: input.camelRecordId,
      title: input.title,
      url: input.url,
      platform: getProductionLinkPlatform(input.url)
    })),
    update: adminProcedure.input(z2.object({ id: z2.number().int().positive(), values: camelProductionLinkInput.pick({ title: true, url: true }) })).mutation(({ input }) => updateCamelProductionLink(input.id, {
      title: input.values.title,
      url: input.values.url,
      platform: getProductionLinkPlatform(input.values.url)
    })),
    remove: adminProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(({ input }) => deleteCamelProductionLink(input.id))
  }),
  content: router({
    listPublic: publicProcedure.query(() => listPublicContentItems()),
    listAll: adminProcedure.query(() => listAllContentItems()),
    create: adminProcedure.input(contentInput).mutation(async ({ input }) => {
      const result = await createContentItem(input);
      if (input.kind === "photo" && input.camelRecordId && input.mediaUrl) {
        await ensureCamelPhoto({ camelRecordId: input.camelRecordId, imageUrl: input.mediaUrl, mediaKey: input.mediaKey ?? null, sortOrder: 9999 });
      }
      return result;
    }),
    update: adminProcedure.input(z2.object({ id: z2.number().int().positive(), values: contentInput.partial() })).mutation(async ({ input }) => {
      const result = await updateContentItem(input.id, input.values);
      if (input.values.kind === "photo" && input.values.camelRecordId && input.values.mediaUrl) {
        await ensureCamelPhoto({ camelRecordId: input.values.camelRecordId, imageUrl: input.values.mediaUrl, mediaKey: input.values.mediaKey ?? null, sortOrder: 9999 });
      }
      return result;
    }),
    remove: adminProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ input }) => {
      const deleted = await deleteContentItem(input.id);
      if (deleted) {
        await storageDelete(deleted.mediaKey ?? deleted.mediaUrl);
        await storageDelete(deleted.thumbnailKey ?? deleted.thumbnailUrl);
      }
      return { success: true };
    }),
    engagement: publicProcedure.input(contentItemIdInput).query(({ input, ctx }) => getContentEngagement(input.contentItemId, ctx.user?.id, ctx.visitorToken)),
    toggleLike: publicProcedure.input(contentItemIdInput).mutation(({ input, ctx }) => toggleContentLike(input.contentItemId, ctx.user?.id, ctx.visitorToken)),
    addComment: publicProcedure.input(z2.object({ contentItemId: z2.number().int().positive(), body: z2.string().trim().min(1).max(1e3) })).mutation(({ input, ctx }) => addContentComment(input.contentItemId, ctx.user?.id, input.body, ctx.visitorToken))
  }),
  adminAccess: router({
    list: adminProcedure.query(async () => (await listAdminEmailAccess()).map(({ passwordHash, ...access }) => ({ ...access, passwordSet: Boolean(passwordHash) }))),
    add: adminProcedure.input(adminEmailInput).mutation(({ input, ctx }) => grantAdminEmailAccess(input.email, ctx.user.id)),
    resetPassword: adminProcedure.input(adminEmailInput).mutation(({ input }) => setAdminEmailPasswordHash(input.email, null)),
    remove: adminProcedure.input(adminEmailInput).mutation(({ input, ctx }) => {
      if (ctx.user.email?.trim().toLowerCase() === input.email) {
        throw new TRPCError3({ code: "BAD_REQUEST", message: "\u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u0633\u062D\u0628 \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0645\u0646 \u062D\u0633\u0627\u0628\u0643 \u0627\u0644\u062D\u0627\u0644\u064A." });
      }
      return revokeAdminEmailAccess(input.email);
    })
  }),
  reserve: router({
    getPublic: publicProcedure.query(() => getReserveSettings()),
    get: adminProcedure.query(() => getReserveSettings()),
    update: adminProcedure.input(reserveSettingsInput).mutation(({ input }) => updateReserveSettings(input))
  }),
  media: router({
    upload: adminProcedure.input(z2.object({
      fileName: z2.string().min(1).max(255),
      contentType: z2.string().min(1).max(128),
      dataUrl: z2.string().min(1),
      folder: z2.enum(["camels", "content"])
    })).mutation(async ({ input, ctx }) => {
      const commaIndex = input.dataUrl.indexOf(",");
      const base64 = commaIndex >= 0 ? input.dataUrl.slice(commaIndex + 1) : input.dataUrl;
      const bytes = Buffer.from(base64, "base64");
      const maxBytes = 25 * 1024 * 1024;
      if (bytes.length === 0 || bytes.length > maxBytes) {
        throw new Error("\u062D\u062C\u0645 \u0627\u0644\u0645\u0644\u0641 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0628\u064A\u0646 1 \u0628\u0627\u064A\u062A \u064825 \u0645\u064A\u063A\u0627\u0628\u0627\u064A\u062A.");
      }
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
      return storagePut(`reserve/${ctx.user.id}/${input.folder}/${safeName}`, bytes, input.contentType);
    })
  })
});

// server/_core/context.ts
import { randomUUID } from "node:crypto";
import { parse as parseCookieHeader4 } from "cookie";
var VISITOR_TOKEN_COOKIE = "zomool_visitor_token";
var VISITOR_TOKEN_MAX_AGE = 60 * 60 * 24 * 365;
function getOrSetVisitorToken(req, res) {
  const cookies = parseCookieHeader4(req.headers.cookie ?? "");
  const existing = cookies[VISITOR_TOKEN_COOKIE];
  const visitorToken = existing && /^[a-zA-Z0-9_-]{16,64}$/.test(existing) ? existing : randomUUID();
  if (visitorToken !== existing) {
    const secure = process.env.NODE_ENV === "production" || req.protocol === "https" ? "; Secure" : "";
    res.setHeader("Set-Cookie", `${VISITOR_TOKEN_COOKIE}=${encodeURIComponent(visitorToken)}; Max-Age=${VISITOR_TOKEN_MAX_AGE}; Path=/; SameSite=Lax; HttpOnly${secure}`);
  }
  return visitorToken;
}
async function createContext(opts) {
  let user = null;
  if (await hasExternalAdminSession(opts.req)) {
    user = externalAdminUser(await externalAdminSessionEmail(opts.req));
  } else try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user,
    visitorToken: getOrSetVisitorToken(opts.req, opts.res)
  };
}

// server/_core/app.ts
function createApp() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerBlobUploadRoute(app);
  registerOAuthRoutes(app);
  app.use("/api/trpc", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("CDN-Cache-Control", "no-store");
    res.setHeader("Vercel-CDN-Cache-Control", "no-store");
    next();
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, path }) {
        const cause = error.cause;
        const nestedCauseCode = cause?.cause?.code;
        const causeCode = typeof cause?.code === "string" ? cause.code : typeof nestedCauseCode === "string" ? nestedCauseCode : "UNKNOWN";
        console.error("[tRPC] Procedure failed", { path, code: error.code, causeCode });
      }
    })
  );
  return app;
}

// server/vercel-handler.ts
var vercel_handler_default = createApp();
export {
  vercel_handler_default as default
};
