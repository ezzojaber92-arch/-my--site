import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const cssSource = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("تنسيق بطاقة سجل البعير", () => {
  it("يعرض الحقول بالترتيب المطلوب ويحذف الوصف من التفاصيل", () => {
    const order = [
      'className="parent-value"',
      'className="parent-value"',
      'className="lineage-maternal-fact"',
      "الإنجازات",
      "الإنتاج",
      "الجهة أو المالك",
      "العامل",
      "رقم التواصل",
    ];
    let previousIndex = -1;
    for (const token of order) {
      const index = homeSource.indexOf(token, previousIndex + 1);
      expect(index, `لم يظهر الحقل ${token} بالترتيب`).toBeGreaterThan(previousIndex);
      previousIndex = index;
    }
    expect(homeSource).toContain('className="camel-dialog-name"');
    expect(homeSource).toContain('<div className="lineage-origin-fact"><span>الأصل</span>');
    expect(homeSource).toContain('<div><span>الأب</span><strong className="parent-value">{selectedCamel.father}</strong></div>');
    expect(homeSource).toContain('<div><span>الأم</span><strong className="parent-value">{selectedCamel.mother}</strong></div>');
    expect(homeSource).not.toContain('<p className="dialog-note">{selectedCamel.note}</p>');
  });

  it("يضمن التفاف النص الطويل داخل الخانة نفسها", () => {
    expect(cssSource).toContain("minmax(0, 1fr)");
    expect(cssSource).toContain("overflow-wrap: anywhere");
    expect(cssSource).toContain("white-space: nowrap");
    expect(cssSource).toContain(".dialog-facts .parent-value");
  });
});
