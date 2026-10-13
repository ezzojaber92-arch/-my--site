export const MAX_MEDIA_BYTES = 25 * 1024 * 1024;

const SUPPORTED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export function validateMediaFile(file: File, kind: "image" | "video" | "media") {
  if (file.size <= 0) return "الملف فارغ أو غير صالح.";
  if (file.size > MAX_MEDIA_BYTES) return "حجم الملف أكبر من 25 ميغابايت. اختر فيديو أقصر أو اضغطه ثم أعد المحاولة.";
  if (kind === "image" && !file.type.startsWith("image/")) return "اختر ملف صورة صالحاً.";
  if (kind === "video" && !SUPPORTED_VIDEO_TYPES.has(file.type)) return "صيغة الفيديو غير مدعومة. استخدم MP4 أو WebM أو MOV.";
  if (kind === "media" && !file.type.startsWith("image/") && !SUPPORTED_VIDEO_TYPES.has(file.type)) return "الصيغة غير مدعومة. استخدم صورة أو فيديو MP4 أو WebM أو MOV.";
  return null;
}

export function isSupportedVideoType(type: string) {
  return SUPPORTED_VIDEO_TYPES.has(type);
}
