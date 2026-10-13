import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("إرفاق صورة المناسبة", () => {
  it("يعرض خيار صورة اختيارياً عند اختيار تهنئة أو مناسبة", () => {
    const source = readFileSync(new URL("./Admin.tsx", import.meta.url), "utf8");

    expect(source).toContain('contentForm.kind === "celebration" ? "إرفاق صورة للمناسبة (اختياري)"');
    expect(source).toContain('contentForm.kind === "celebration" ? "image/*"');
    expect(source).toContain("uploadContentMedia");
  });
});
