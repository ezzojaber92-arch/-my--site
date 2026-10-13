import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("عبارة مصدر مقدمة المحمية", () => {
  it("يعرض عبارة من رمال الإمارات بوضوح دون عداد أرقام أسفلها", () => {
    const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("../index.css", import.meta.url), "utf8");

    expect(source).toContain('<p className="hero-origin-label">من رمال الإمارات</p>');
    expect(source).not.toContain("<span>٠١ / ٠١</span>");
    expect(styles).toContain(".hero-origin-label");
    expect(styles).toContain(".hero-index { position: absolute; left: 5.3vw; bottom: 97px; display: flex; flex-direction: column; gap: 4px; color: #edddc4; font-size: 10px; }");
    expect(styles).toContain(".hero-origin-label { margin: 0; color: inherit; font-size: inherit; font-weight: 400;");
  });
});

