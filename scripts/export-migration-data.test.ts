import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("migration data export", () => {
  it("exports all application tables without hardcoding connection secrets", () => {
    const scriptPath = path.resolve(import.meta.dirname, "export-migration-data.mjs");
    const script = fs.readFileSync(scriptPath, "utf8");

    for (const table of [
      "users",
      "admin_email_access",
      "reserve_settings",
      "camel_records",
      "content_items",
      "camel_photos",
      "camel_production_links",
      "content_likes",
      "content_comments",
    ]) {
      expect(script).toContain(`"${table}"`);
    }

    expect(script).toContain("process.env.SOURCE_DATABASE_URL");
    expect(script).not.toMatch(/mysql:\/\/[^<\s]+:[^<\s]+@/);
    expect(script).toContain('column === "password_hash" ? null : row[column]');
  });
});
