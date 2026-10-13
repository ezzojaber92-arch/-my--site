import { describe, expect, it } from "vitest";
import { isDeletedLegacyCamelPhoto } from "./camelGallery";

describe("camelGallery", () => {
  it("يستبعد صورة IMG_7675 القديمة من العرض العام", () => {
    expect(isDeletedLegacyCamelPhoto({
      imageUrl: "/media/IMG_7675_43657a15_0420cbe8.jpeg",
      mediaKey: "reserve/270001/content/IMG_7675_43657a15.jpeg",
    })).toBe(true);
  });

  it("لا يستبعد الصور الحالية الأخرى", () => {
    expect(isDeletedLegacyCamelPhoto({
      imageUrl: "/media/IMG_7677_a10100ed_8a848c21.jpg",
      mediaKey: "reserve/270001/camels/IMG_7677_a10100ed.png",
    })).toBe(false);
  });
});
