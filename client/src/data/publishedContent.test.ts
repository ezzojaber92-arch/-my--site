import { describe, expect, it } from "vitest";
import { publishedContentFallback } from "./publishedContent";

describe("publishedContentFallback", () => {
  it("keeps the current published announcement available when the external API is unavailable", () => {
    const announcement = publishedContentFallback.find((item) => item.kind === "announcement");
    expect(announcement?.title).toBe("قريباً");
    expect(announcement?.mediaUrl).toMatch(/^\/manus-storage\//);
  });

  it("keeps fallback media in original storage paths so publicMediaUrl can map them per host", () => {
    for (const item of publishedContentFallback) {
      if (item.mediaUrl) expect(item.mediaUrl).toMatch(/^\/manus-storage\//);
      if (item.thumbnailUrl) expect(item.thumbnailUrl).toMatch(/^\/manus-storage\//);
    }
  });
});
