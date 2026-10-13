import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("حمولة النشر المباشر إلى Vercel", () => {
  it("تستبعد أسرار البيئة وملفات التطوير من حمولة المصدر", () => {
    const source = readFileSync(new URL("./create-vercel-mcp-deployment-payload.mjs", import.meta.url), "utf8");

    expect(source).toContain('excludedDirectories = new Set([".git", ".manus-logs", "coverage", "dist", "node_modules", "tmp"])');
    expect(source).toContain('excludedFiles = new Set([".env", ".env.local", ".env.production", ".env.test"])');
    expect(source).toContain("sourceOnlyExclusions");
    expect(source).toContain("scripts");
    expect(source).toContain("drizzle\\/meta");
    expect(source).toContain('target: "production"');
  });
});
