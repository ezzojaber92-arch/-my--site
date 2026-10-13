import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const home = readFileSync(path.join(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

describe("reserve logo navigation", () => {
  it("uses an explicit home link for mobile navigation", () => {
    expect(home).toContain('<a href="/" className="brand"');
    expect(home).toContain("العودة إلى الصفحة الرئيسية");
  });
});
