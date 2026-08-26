import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("نموذج رابط الإنتاج في لوحة الإدارة", () => {
  it("يحفظ الرابط من زر مستقل ولا يعيد إدخال نموذج داخل نموذج بطاقة البعير", () => {
    const source = readFileSync(new URL("./Admin.tsx", import.meta.url), "utf8");

    expect(source).toContain('onClick={() => void addCamelProductionLink()}');
    expect(source).not.toContain('<form onSubmit={addCamelProductionLink}');
  });
});
