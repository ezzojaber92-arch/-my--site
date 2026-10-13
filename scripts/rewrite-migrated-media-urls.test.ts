import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("migrated media URL rewrite", () => {
  it("targets only the media columns that are safe to update", () => {
    const script = fs.readFileSync(path.resolve(import.meta.dirname, "rewrite-migrated-media-urls.mjs"), "utf8");
    expect(script).toContain('["camel_records", "image_url"]');
    expect(script).toContain('["camel_photos", "image_url"]');
    expect(script).toContain('["content_items", "media_url"]');
    expect(script).toContain('["content_items", "thumbnail_url"]');
    expect(script).toMatch(/WHERE .* IN \(\?, \?\)/);
    expect(script).toContain("const bundledPath = `/media/");
    expect(script).toContain("rejectUnauthorized: true");
  });
});
