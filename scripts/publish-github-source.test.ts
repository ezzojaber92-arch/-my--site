import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("GitHub source publisher", () => {
  it("allows only deployment source files and updates the branch without force-pushing", () => {
    const script = fs.readFileSync(path.resolve(import.meta.dirname, "publish-github-source.mjs"), "utf8");
    expect(script).toContain('entry.name === "node_modules"');
    expect(script).toContain('entry.name === ".env"');
    expect(script).toContain("spawnSync(\"gh\"");
    expect(script).toContain("cleanOutput");
    expect(script).toContain('force: false');
    expect(script).toContain('"vercel.json"');
    expect(script).toContain('"api"');
  });
});
