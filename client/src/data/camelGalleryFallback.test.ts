import { describe, expect, it } from "vitest";
import { camelGalleryFallback } from "./camelGalleryFallback";

describe("camelGalleryFallback", () => {
  it("keeps the two verified published photos for Z-001 available outside the database", () => {
    expect(camelGalleryFallback["Z-001"]).toEqual([
      "/media/IMG_7677_a10100ed.png",
      "/manus-storage/reserve/1/content/IMG_7675_43657a15_0420cbe8.jpeg",
    ]);
  });
});
