import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("migration data import", () => {
  it("creates a separate target database and stops when application tables already exist", () => {
    const script = fs.readFileSync(path.resolve(import.meta.dirname, "import-migration-data.mjs"), "utf8");

    expect(script).toContain("CREATE DATABASE IF NOT EXISTS");
    expect(script).toContain("Target database already contains application tables");
    expect(script).toContain("ssl: { minVersion: \"TLSv1.2\", rejectUnauthorized: true }");
    expect(script).toContain("multipleStatements: true");
  });
});
