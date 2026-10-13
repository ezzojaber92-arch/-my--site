import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("رابط إنجازات البعير في الإدارة", () => {
  it("يظهر كحقل مستقل ويُرسل مع حفظ البطاقة", () => {
    const source = readFileSync(new URL("./Admin.tsx", import.meta.url), "utf8");

    expect(source).toContain("achievementsUrl: string;");
    expect(source).toContain("achievementsUrl: \"\",");
    expect(source).toContain("achievementsUrl: camel.achievementsUrl ?? \"\"");
    expect(source).toContain("achievementsUrl: camelForm.achievementsUrl.trim() || null");
    expect(source).toContain('label="رابط إنجازات البعير (ركض وسباقات)"');
    expect(source).toContain('label="رابط اشتراك البعير"');
    expect(source).toContain("روابط إنتاج البعير");
  });
});
