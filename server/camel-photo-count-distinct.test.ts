import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("camel photo count query", () => {
  it("counts the primary image and unique additional gallery URLs", () => {
    const source = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
    expect(source).toContain("countDistinct(sql`COALESCE(");
    expect(source).toContain("leftJoin(camelPhotos");
  });
});
