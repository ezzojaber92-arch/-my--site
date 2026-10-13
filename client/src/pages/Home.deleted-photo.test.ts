import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("مزامنة صور البعير بعد الحذف", () => {
  it("يعرض في الرابط العميق الصورة الأساسية وصور camel_photos الحية فقط", () => {
    const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

    expect(source).toContain("const databaseImages = selectedCamelPhotos.isFetchedAfterMount && !selectedCamelPhotos.isFetching");
    expect(source).toContain(".filter((photo) => !isDeletedLegacyCamelPhoto(photo))");
    expect(source).toContain("return Array.from(new Set([selectedCamel.image, ...databaseImages].filter(Boolean)))");
    expect(source).not.toContain("camelGalleryFallback");
    expect(source).not.toContain("fallbackImages");
  });
});
