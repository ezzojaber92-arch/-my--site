import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("إغلاق سجل البعير والتصفح", () => {
  it("يعيد المستخدم إلى بطاقة البعير المفتوحة بدلاً من بداية القائمة", () => {
    const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

    expect(source).toContain("const camelIdToRestore = selectedCamel?.id");
    expect(source).toContain("document.getElementById(`camel-card-${camelIdToRestore}`)");
    expect(source).toContain('target?.scrollIntoView({ behavior: "auto", block: "center" })');
    expect(source).not.toContain('document.getElementById("herd")?.scrollIntoView({ behavior: "auto", block: "start" })');
  });

  it("يعرض زر تصفح الزمول الأخرى في نهاية السجل ويستخدم نفس الإغلاق", () => {
    const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

    expect(source).toContain('className="camel-browse-more"');
    expect(source).toContain("تصفح الزمول الأخرى");
    expect(source).toContain('onClick={closeCamel}');
  });
});
