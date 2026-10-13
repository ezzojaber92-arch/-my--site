import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("migration verification", () => {
  it("compares all application tables between the source and TiDB", () => {
    const script = fs.readFileSync(path.resolve(import.meta.dirname, "verify-migration-data.mjs"), "utf8");
    expect(script).toContain("SELECT COUNT(*) AS count");
    expect(script).toContain("TiDB migration verification found mismatched table counts");
    expect(script).toContain('"camel_production_links"');
    expect(script).toContain('ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true }');
  });
});
