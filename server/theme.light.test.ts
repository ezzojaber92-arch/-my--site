import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

const readProjectFile = (relativePath: string) =>
  readFileSync(path.join(projectRoot, relativePath), "utf8");

describe("forced light theme", () => {
  it("declares light color-scheme at the document and CSS levels", () => {
    const html = readProjectFile("client/index.html");
    const css = readProjectFile("client/src/index.css");

    expect(html).toContain('<meta name="color-scheme" content="light" />');
    expect(html).toContain('style.colorScheme = "light"');
    expect(css).toContain("color-scheme: light;");
    expect(css).toContain("--background: #f9f6f0;");
    expect(css).toContain("--card: #ffffff;");
  });

  it("keeps the public ThemeProvider from restoring dark mode", () => {
    const themeContext = readProjectFile("client/src/contexts/ThemeContext.tsx");
    const toaster = readProjectFile("client/src/components/ui/sonner.tsx");

    expect(themeContext).toContain('if (!switchable) return "light";');
    expect(themeContext).toContain('const activeTheme: Theme = switchable ? theme : "light";');
    expect(themeContext).toContain('root.style.colorScheme = activeTheme;');
    expect(toaster).toContain('theme="light"');
  });
});
