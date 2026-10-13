import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("مزامنة مخطط روابط الإنتاج", () => {
  it("يجهز جدول روابط الإنتاج وعمود العنوان عند اختلاف قاعدة الإنتاج", () => {
    const source = readFileSync(new URL("./db.ts", import.meta.url), "utf8");

    expect(source).toContain("CREATE TABLE IF NOT EXISTS `camel_production_links`");
    expect(source).toContain("`url` varchar(512) NOT NULL");
    expect(source).toContain("ADD COLUMN IF NOT EXISTS `title` varchar(255)");
    expect(source).toContain("await ensureApplicationSchema();\n  const db = await requireDb();\n  return db.select().from(camelProductionLinks)");
    expect(source).toContain("await ensureApplicationSchema();\n  const db = await requireDb();\n  return db.insert(camelProductionLinks).values(values)");
  });
});
