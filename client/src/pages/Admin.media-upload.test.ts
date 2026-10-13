import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("رفع وسائط لوحة الإدارة", () => {
  it("يستخدم الرفع الخادمي الاحتياطي عند فشل presigned URL", () => {
    const source = readFileSync(new URL("./Admin.tsx", import.meta.url), "utf8");

    expect(source).toContain("const uploadMediaFallback = trpc.media.upload.useMutation();");
    expect(source).toContain("return await uploadMediaFallback.mutateAsync({");
    expect(source).toContain('handleUploadUrl: "/api/media/upload-presigned"');
  });

  it("يرفع كل الملفات المختارة ويحفظ key الخاص بكل صورة", () => {
    const source = readFileSync(new URL("./Admin.tsx", import.meta.url), "utf8");

    expect(source).toContain("for (let index = 0; index < files.length; index += 1)");
    expect(source).toContain("uploadedFiles.push({ url: uploaded.url, key: uploaded.key });");
    expect(source).toContain("mediaKey: uploaded.key");
    expect(source).toContain("await createCamelPhoto.mutateAsync({ camelRecordId: editingCamelId, imageUrl: uploaded.url, mediaKey: uploaded.key, sortOrder: startOrder + index });");
    expect(source).toContain("await utils.camelPhotos.list.invalidate(camelGalleryInput);");
    expect(source).toContain("تمت إضافة ${files.length} صورة إلى معرض هذا البعير.");
  });
});
