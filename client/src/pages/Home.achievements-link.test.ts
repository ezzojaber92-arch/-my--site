import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("رابط إنجازات البعير", () => {
  it("يُعرض مستقلاً عن الإنتاج والاشتراك ويتحدث مع رابط QR", () => {
    const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

    expect(source).toContain("achievementsUrl: camel.achievementsUrl ?? null");
    expect(source).toContain("selectedCamel?.achievementsUrl === sharedCamel.achievementsUrl");
    expect(source).toContain('className="camel-achievements-card"');
    expect(source).toContain("إنجازات البعير");
    expect(source).toContain("ركض وسباقات");
    expect(source).toContain("اشتراك البعير");
    expect(source).toContain("selectedCamelProductionLinkItems");
  });
});
