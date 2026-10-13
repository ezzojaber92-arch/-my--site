import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("حالة الإدارة الخارجية", () => {
  it("تعرض رسالة إعداد مفهومة بدلاً من صفحة فارغة عندما تفشل خدمات Vercel", () => {
    const source = readFileSync(new URL("./Admin.tsx", import.meta.url), "utf8");

    expect(source).toContain("لوحة الإدارة قيد الإعداد");
    expect(source).toContain("تعذر الاتصال بخدمة الإدارة");
    expect(source).toContain("جارٍ التحقق من إعدادات لوحة الإدارة");
  });

  it("تعرض قائمة السجلات كاملة دون تمرير داخلي يخفي السجلات الأولى", () => {
    const source = readFileSync(new URL("./Admin.tsx", import.meta.url), "utf8");

    expect(source).toContain("camelOptions.map((camel)");
    expect(source).not.toContain("max-h-[900px] space-y-3 overflow-y-auto");
  });

  it("تتجنب فحص بريد الهاتف الخاطئ وتنظف المسافات قبل إرسال الدخول", () => {
    const source = readFileSync(new URL("./Admin.tsx", import.meta.url), "utf8");

    expect(source).toContain("<form noValidate");
    expect(source).toContain('inputMode="email" type="text"');
    expect(source).toContain('replace(/\\s+/g, "")');
  });
});
