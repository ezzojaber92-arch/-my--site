import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("TiDB index compatibility", () => {
  it("limits the uniquely indexed production URL and adapts legacy export SQL", () => {
    const schema = fs.readFileSync(path.resolve(import.meta.dirname, "../drizzle/schema.ts"), "utf8");
    const router = fs.readFileSync(path.resolve(import.meta.dirname, "routers.ts"), "utf8");
    const exporter = fs.readFileSync(path.resolve(import.meta.dirname, "../scripts/export-migration-data.mjs"), "utf8");
    const db = fs.readFileSync(path.resolve(import.meta.dirname, "db.ts"), "utf8");

    expect(schema).toContain('url: varchar("url", { length: 512 }).notNull()');
    expect(router).toContain("url: z.string().trim().url().max(512)");
    expect(exporter).toContain('table !== "camel_production_links"');
    expect(exporter).toContain('"`url` varchar(512) NOT NULL"');
    expect(db).toContain("CREATE TABLE IF NOT EXISTS `content_guest_likes`");
    expect(db).toContain("CREATE TABLE IF NOT EXISTS `content_guest_comments`");
    expect(db.match(/await ensureApplicationSchema\(\);/g)?.length).toBeGreaterThanOrEqual(6);
  });
});
