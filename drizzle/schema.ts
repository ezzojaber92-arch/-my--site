import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
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
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const adminEmailAccess = mysqlTable("admin_email_access", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  createdByUserId: int("created_by_user_id").notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reserveSettings = mysqlTable("reserve_settings", {
  id: int("id").primaryKey(),
  reserveName: varchar("reserve_name", { length: 255 }).notNull(),
  locationName: varchar("location_name", { length: 255 }).notNull(),
  mapUrl: varchar("map_url", { length: 1024 }).notNull(),
  phone: varchar("phone", { length: 64 }).notNull(),
  veterinaryService: text("veterinary_service").notNull(),
  climateService: text("climate_service").notNull(),
  visitHours: varchar("visit_hours", { length: 255 }).notNull(),
  visitDescription: text("visit_description").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const camelRecords = mysqlTable("camel_records", {
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
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const contentKind = mysqlEnum("content_kind", ["news", "announcement", "celebration", "photo", "video"]);

export const contentItems = mysqlTable("content_items", {
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
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const camelPhotos = mysqlTable("camel_photos", {
  id: int("id").autoincrement().primaryKey(),
  camelRecordId: int("camel_record_id").notNull(),
  imageUrl: varchar("image_url", { length: 512 }).notNull(),
  mediaKey: varchar("media_key", { length: 1024 }),
  imagePositionX: int("image_position_x").default(50).notNull(),
  imagePositionY: int("image_position_y").default(50).notNull(),
  imageScale: int("image_scale").default(100).notNull(),
  imageRotation: int("image_rotation").default(0).notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  camelImageUnique: uniqueIndex("camel_photos_camel_image_unique").on(table.camelRecordId, table.imageUrl),
}));

export const camelProductionLinks = mysqlTable("camel_production_links", {
  id: int("id").autoincrement().primaryKey(),
  camelRecordId: int("camel_record_id").notNull(),
  url: varchar("url", { length: 512 }).notNull(),
  title: varchar("title", { length: 255 }).default("رابط إنتاج").notNull(),
  platform: varchar("platform", { length: 100 }).notNull(),
  linkedAt: timestamp("linked_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  camelLinkUnique: uniqueIndex("camel_production_links_camel_url_unique").on(table.camelRecordId, table.url),
}));

export const contentLikes = mysqlTable("content_likes", {
  id: int("id").autoincrement().primaryKey(),
  contentItemId: int("content_item_id").notNull(),
  userId: int("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  contentUserUnique: uniqueIndex("content_likes_content_user_unique").on(table.contentItemId, table.userId),
}));

export const contentComments = mysqlTable("content_comments", {
  id: int("id").autoincrement().primaryKey(),
  contentItemId: int("content_item_id").notNull(),
  userId: int("user_id").notNull(),
  body: text("body").notNull(),
  isVisible: boolean("is_visible").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Anonymous engagement is stored separately so public visitors never need an auth user row. */
export const contentGuestLikes = mysqlTable("content_guest_likes", {
  id: int("id").autoincrement().primaryKey(),
  contentItemId: int("content_item_id").notNull(),
  visitorToken: varchar("visitor_token", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  contentVisitorUnique: uniqueIndex("content_guest_likes_content_visitor_unique").on(table.contentItemId, table.visitorToken),
}));

export const contentGuestComments = mysqlTable("content_guest_comments", {
  id: int("id").autoincrement().primaryKey(),
  contentItemId: int("content_item_id").notNull(),
  visitorToken: varchar("visitor_token", { length: 64 }).notNull(),
  authorName: varchar("author_name", { length: 100 }).default("زائر المحمية").notNull(),
  body: text("body").notNull(),
  isVisible: boolean("is_visible").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CamelRecord = typeof camelRecords.$inferSelect;
export type InsertCamelRecord = typeof camelRecords.$inferInsert;
export type ContentItem = typeof contentItems.$inferSelect;
export type InsertContentItem = typeof contentItems.$inferInsert;
export type CamelPhoto = typeof camelPhotos.$inferSelect;
export type InsertCamelPhoto = typeof camelPhotos.$inferInsert;
export type CamelProductionLink = typeof camelProductionLinks.$inferSelect;
export type InsertCamelProductionLink = typeof camelProductionLinks.$inferInsert;
export type ContentComment = typeof contentComments.$inferSelect;
export type AdminEmailAccess = typeof adminEmailAccess.$inferSelect;
export type InsertReserveSettings = typeof reserveSettings.$inferInsert;
