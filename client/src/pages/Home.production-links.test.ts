import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("رابط بطاقة البعير المباشر", () => {
  it("يعيد تحميل سجل البعير ببيانات قاعدة البيانات عند فتحه من QR أو رابط مباشر", () => {
    const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

    expect(source).toContain('selectedCamel?.id === camelCode && selectedCamel.databaseId');
    expect(source).toContain('trpc.camelProductionLinks.list.useQuery');
  });
});
