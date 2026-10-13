import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.join(process.cwd(), "client/src/index.css"), "utf8");
const home = readFileSync(path.join(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

describe("camel card visual identity", () => {
  it("uses the gentler herd-section treatment and the Zomool label", () => {
    expect(home).toContain("<SectionLabel>سجل الزمول</SectionLabel>");
    expect(home).not.toContain('className="camel-story-heading"');
    expect(home).not.toContain("نوثّق سيرة كل بعير بعناية، من أصله وإنجازاته إلى إنتاجه وتفاصيله.");
    expect(home).not.toContain("بطاقات تحكي <em>قصة كل زمول</em>");
    expect(css).toContain("border-top: 12px solid #d8a45d;");
    expect(css).toContain(".herd-section .section-label p { font-size: clamp(21px, 2.6vw, 32px); line-height: 1.2; font-weight: 900;");
    expect(css).toContain(".herd-section::before");
    expect(css).toContain(".herd-section .section-aside");
    expect(css).toContain(".template-note { position: relative;");
  });

  it("shows the requested story line in both desktop and mobile first-page hero interfaces", () => {
    expect(home).toContain("<span>لكل بعير في المحمية حكاية</span>");
    expect(home).toContain("<strong>ونحن حريصون أن تُكتب كاملة</strong>");
    expect(home).toContain("صُمم هذا السجل ليجمع معلومات كل بعير في مكان واحد؛ بطاقة واضحة تحفظ التفاصيل، ويستطيع فريق المحمية تحديثها متى توفرت البيانات المعتمدة.");
    expect(home).not.toContain("<span>لكل بعير حكاية</span>");
    expect(home).not.toContain("<strong>تُعرف باسمه</strong>");
  });

  it("uses heavy Noto Kufi Arabic, a visible lift shadow, and a subtle brown border around the complete card", () => {
    expect(css).toContain('font-family: "Noto Kufi Arabic", sans-serif;');
    expect(css).toContain('font-family: "Noto Kufi Arabic", sans-serif; font-weight: 800;');
    expect(css).toContain('font-weight: 800; -webkit-text-stroke: .12px currentColor;');
    expect(css).toContain(".camel-card { background: #ffffff;");
    expect(css).toContain(".camel-card-topbar { box-sizing: border-box; height: 36px; min-height: 36px;");
    expect(css).not.toContain("top: 12px; right: 12px; left: 12px;");
    expect(css).toContain(".view-profile { box-sizing: border-box; width: 100%; height: 30px;");
    expect(css).not.toContain("transform: translateY(12px);");
    expect(css).toContain("box-shadow: 0 16px 34px rgba(59, 41, 28, .16), 0 4px 10px rgba(59, 41, 28, .08);");
    expect(css).toContain("border: 2px solid #111111;");
    expect(css).toContain("border-top-color: #111111; border-bottom-color: #111111;");
    expect(css).toContain(".camel-card-topbar");
    expect(css).toContain(".camel-card-topbar::before, .view-profile::before");
    expect(css).toContain("rgba(224, 177, 92, .16)");
    expect(css).toContain("isolation: isolate; overflow: hidden;");
    expect(css).toContain("min-height: 36px;");
    expect(css).toContain("position: relative; z-index: 1; top: 0; display: block; overflow: visible;");
    expect(css).toContain("font-size: 16px; line-height: 1.15; font-weight: 950;");
    expect(css).toContain("letter-spacing: .01em;");
    expect(css).not.toContain("transform: scaleY(1.08);");
    expect(css).toContain("background: #111111;");
    expect(css).toContain("margin: -6px 0 0;");
    expect(home).toContain('className="camel-card-topbar"');
    expect(home).toContain('className="view-profile"');
    expect(home.indexOf('className="camel-card-body"')).toBeLessThan(home.indexOf('className="view-profile"'));
    expect(home).toContain("فتح سجل البعير");
    expect(css).toContain(".camel-meta strong { color: #4d382a; font-size: 10px; line-height: 2; font-weight: 800; -webkit-text-stroke: .12px currentColor; }");
    expect(css).toContain(".dialog-note { color: #755e4d; margin: 0 0 24px; font-size: 11px; line-height: 2.1; font-weight: 700;");
    expect(css).toContain(".dialog-facts span {");
    expect(css).toContain("overflow-wrap: anywhere;");
    expect(css).toContain(".dialog-facts strong {");
    expect(css).toContain(".dialog-facts .parent-value { font-size: 11px; font-weight: 900;");
    expect(css).toContain(".camel-number, .camel-shade { position: absolute; color: #f4dff6; font-size: 10px; font-weight: 800;");
  });
});
