import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.join(process.cwd(), "client/src/index.css"), "utf8");

describe("announcement contrast", () => {
  it("keeps moving announcement text dark and heavy for sunlight readability", () => {
    expect(css).toContain(".announcement-ticker-track strong { color: #432b20;");
    expect(css).toContain("font-weight: 800; -webkit-text-stroke: .08px currentColor;");
    expect(css).toContain(".announcement-ticker-track em { color: #5b402e;");
    expect(css).toContain("font-weight: 800; -webkit-text-stroke: .06px currentColor;");
  });
});
