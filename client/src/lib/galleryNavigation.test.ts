import { describe, expect, it } from "vitest";
import { getCyclicGalleryIndex } from "./galleryNavigation";

describe("getCyclicGalleryIndex", () => {
  it("ينتقل إلى الصورة التالية عند السحب نحو اليسار", () => {
    expect(getCyclicGalleryIndex(0, 3, 1)).toBe(1);
  });

  it("يعيد المعرض إلى الصورة الأولى بعد آخر صورة", () => {
    expect(getCyclicGalleryIndex(2, 3, 1)).toBe(0);
  });

  it("يعيد المعرض إلى الصورة الأخيرة عند السحب نحو اليمين من الأولى", () => {
    expect(getCyclicGalleryIndex(0, 3, -1)).toBe(2);
  });

  it("لا يحدد صورة عند عدم وجود صور", () => {
    expect(getCyclicGalleryIndex(0, 0, 1)).toBe(-1);
  });
});
