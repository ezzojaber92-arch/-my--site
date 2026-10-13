import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const adminSource = readFileSync(new URL("../client/src/pages/Admin.tsx", import.meta.url), "utf8");
const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const dbSource = readFileSync(new URL("./db.ts", import.meta.url), "utf8");

describe("ضبط صور معرض البعير", () => {
  it("يوفر تعديل الصورة الإضافية داخل إطار مربع وحفظ إعداداتها مستقلة", () => {
    expect(adminSource).toContain("openGalleryPhotoEditor");
    expect(adminSource).toContain("حفظ ضبط الصورة");
    expect(adminSource).toContain("admin-image-editor-frame");
    expect(adminSource.match(/admin-image-editor-frame/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(adminSource).toContain("handleGalleryImageTouchMove");
    expect(adminSource).toContain("galleryImageAdjustments");
    expect(adminSource).toContain("updateCamelPhoto.mutateAsync");
  });

  it("يمرر التعديل عبر إجراء إداري وحقول موضع وتكبير محددة", () => {
    expect(routerSource).toContain("update: adminProcedure.input(camelPhotoAdjustmentInput)");
    expect(routerSource).toContain("imagePositionX: z.number().int().min(0).max(100)");
    expect(routerSource).toContain("imagePositionY: z.number().int().min(0).max(100)");
    expect(routerSource).toContain("imageScale: z.number().int().min(50).max(220)");
    expect(dbSource).toContain("export async function updateCamelPhoto");
    expect(dbSource).toContain("db.update(camelPhotos).set(values)");
  });

  it("يهيئ أعمدة ضبط صور المعرض القديمة قبل القراءة والكتابة", () => {
    expect(dbSource).toContain("ALTER TABLE `camel_photos` ADD COLUMN IF NOT EXISTS `image_position_x`");
    expect(dbSource).toContain("ALTER TABLE `camel_photos` ADD COLUMN IF NOT EXISTS `image_position_y`");
    expect(dbSource).toContain("ALTER TABLE `camel_photos` ADD COLUMN IF NOT EXISTS `image_scale`");
    expect(dbSource).toContain("ALTER TABLE `camel_photos` ADD COLUMN IF NOT EXISTS `image_rotation`");
    expect(dbSource).toContain("export async function listCamelPhotos(camelRecordId: number) {\n  await ensureApplicationSchema();");
    expect(dbSource).toContain("export async function createCamelPhoto(values: InsertCamelPhoto) {\n  await ensureApplicationSchema();");
  });
});

