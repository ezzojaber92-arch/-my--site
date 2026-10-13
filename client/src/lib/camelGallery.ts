type CamelPhotoMedia = {
  imageUrl?: string | null;
  mediaKey?: string | null;
};

/**
 * صورة قديمة كانت مرتبطة بمعرض Z-001 ثم حُذفت من إدارة المحمية.
 * يبقى الاستبعاد محصوراً في العرض العام ولا يمس الصورة الأساسية أو ملفات التخزين.
 */
const deletedLegacyCamelMediaTokens = [
  "reserve/270001/content/IMG_7675_43657a15.jpeg",
  "IMG_7675_43657a15_0420cbe8.jpeg",
] as const;

export function isDeletedLegacyCamelPhoto(photo: CamelPhotoMedia) {
  return [photo.mediaKey, photo.imageUrl]
    .filter((value): value is string => Boolean(value))
    .some((value) => deletedLegacyCamelMediaTokens.some((token) => value.includes(token)));
}
