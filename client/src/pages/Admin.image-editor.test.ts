import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("معاينة صورة البعير في لوحة الإدارة", () => {
  it("تدعم السحب بالإصبع والتكبير أو التصغير بالإصبعين قبل الحفظ", () => {
    const admin = readFileSync(new URL("./Admin.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("../index.css", import.meta.url), "utf8");

    expect(admin).toContain("handleImageTouchStart");
    expect(admin).toContain("handleImageTouchMove");
    expect(admin).toContain("distanceBetweenTouches");
    expect(admin).toContain('setCamelField("imageScale"');
    expect(admin).toContain("clampImageValue(gesture.startScale + (distance - gesture.startDistance) * 0.22, 50, 220)");
    expect(admin.match(/clampImageValue\(gesture\.startScale/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(admin).toContain('setCamelField("imagePositionX"');
    expect(admin).toContain('setCamelField("imagePositionY"');
    expect(admin).toContain("touch-none select-none");
    expect(admin).toContain("admin-image-editor-frame");
    expect(admin.match(/admin-image-editor-frame/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(admin).not.toContain("relative mx-auto mt-4 aspect-square w-full max-w-md touch-none");
    expect(admin).toContain('aria-label="معاينة 4:3 لتحريك وتكبير صورة البعير"');
    expect(admin).toContain("اسحب بإصبعك، وكبّر أو صغّر بإصبعين");
    expect(styles).toContain(".admin-image-editor-frame");
    expect(styles).toContain("inline-size: min(100%, 420px) !important;");
    expect(styles).toContain("aspect-ratio: 4 / 3 !important;");
    expect(styles).toContain("object-fit: contain !important;");
  });
});
