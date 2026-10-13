import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("ترتيب أرقام سجلات الإبل", () => {
  it("يستخدم الرقم بعد الشرطة قبل ترتيب الإدخال", () => {
    const source = fs.readFileSync(path.resolve(import.meta.dirname, "db.ts"), "utf8");

    expect(source).toContain("CAST(SUBSTRING_INDEX(${camelRecords.recordCode}, '-', -1) AS UNSIGNED)");
    expect(source).toContain(".orderBy(...camelRecordOrder())");
    expect(source).toContain("function camelRecordOrder()");
  });
});
