const LEGACY_STORAGE_ORIGIN = "https://zomoolreserv-9qm89e3w.manus.space";
const LEGACY_SITE_HOSTNAME = "zomoolreserv-9qm89e3w.manus.space";


const migratedMedia: Record<string, string> = {
  "https://1cmth25a8nzqrn3k.public.blob.vercel-storage.com/camels/ce42ffd7-cc11-479c-b51b-11aa2b0236fe-YBkim3ePkyEGXTJyt2lIj2aKMfdnxf.jpeg": "/media/IMG_7677_a10100ed_8a848c21.jpg",
  "https://1cmth25a8nzqrn3k.public.blob.vercel-storage.com/camels/9a526c17-a6d9-449a-afea-e01cbea70301-16QkOgpTFzcTmoGl2fzcLE8OJsEAWx.jpeg": "/media/alhathar-alsagheer_c8c1ed8e_d4fed9e6.jpg",
  "https://1cmth25a8nzqrn3k.public.blob.vercel-storage.com/camels/IMG_7641-EHswh3XMVlsf16ZnIC6d5tAn6RLffu.jpeg": "/media/enad_b3b0ae58_996cf3af.jpg",
  "https://1cmth25a8nzqrn3k.public.blob.vercel-storage.com/camels/IMG_8560-wG0WihoqFgdnui23Azr83WQEImZL5Q.jpeg": "/media/mardhi_138a6354_d2537b39.jpg",
  "https://1cmth25a8nzqrn3k.public.blob.vercel-storage.com/camels/IMG_8852-6oXE4Eh3Yjp92PEacO7EgGfaLFmEVu.png": "/media/alwasmi-alsagheer_04572c54_94bc1581.jpg",
  "https://1cmth25a8nzqrn3k.public.blob.vercel-storage.com/camels/b6e737d0-d29b-4fcc-8a2d-13fe8239be5d-0A4tUz4qibFht1df4uummILYm91a7W.jpeg": "/media/ghazi-weld-wafra_02cb9f56_ca096308.jpg",
  "/media/alhathar-alsagheer_c8c1ed8e.png": "/media/alhathar-alsagheer_c8c1ed8e_d4fed9e6.jpg",
  "/media/alwasmi-alsagheer_04572c54.png": "/media/alwasmi-alsagheer_04572c54_94bc1581.jpg",
  "/media/enad_b3b0ae58.png": "/media/enad_b3b0ae58_996cf3af.jpg",
  "/media/ghazi-weld-wafra_02cb9f56.png": "/media/ghazi-weld-wafra_02cb9f56_ca096308.jpg",
  "/media/mardhi_138a6354_d2537b39.png": "/media/mardhi_138a6354_d2537b39.jpg",
  "/media/alhathar-alsagheer_c8c1ed8e_d4fed9e6.png": "/media/alhathar-alsagheer_c8c1ed8e_d4fed9e6.jpg",
  "/media/alwasmi-alsagheer_04572c54_94bc1581.png": "/media/alwasmi-alsagheer_04572c54_94bc1581.jpg",
  "/media/enad_b3b0ae58_996cf3af.png": "/media/enad_b3b0ae58_996cf3af.jpg",
  "/media/ghazi-weld-wafra_02cb9f56_ca096308.png": "/media/ghazi-weld-wafra_02cb9f56_ca096308.jpg",
  "/media/IMG_7642_ab2dba4c_592c9089.jpeg": "/media/IMG_7642_ab2dba4c_592c9089.jpg",
  "/media/IMG_7657_ef9094a9_a6537c87.jpeg": "/media/IMG_7657_ef9094a9_a6537c87.jpg",
  "/media/IMG_7675_43657a15_0420cbe8.jpeg": "/media/IMG_7675_43657a15_0420cbe8.jpg",
  "/media/IMG_7677_a10100ed.png": "/media/IMG_7677_a10100ed_8a848c21.jpg",
  "/media/IMG_7677_a10100ed_8a848c21.png": "/media/IMG_7677_a10100ed_8a848c21.jpg",
  "/media/reserve-video-2026-thumbnail_1931bf11_b97b1100.jpg": "/media/reserve-video-2026-thumbnail_1931bf11.jpg",
  "/manus-storage/rahi-weld-alsareea_68f66fcf.png": "/manus-storage/IMG_7677_a10100ed_8a848c21.jpg",
  "/manus-storage/alhathar-alsagheer_c8c1ed8e.png": "/manus-storage/alhathar-alsagheer_c8c1ed8e_d4fed9e6.jpg",
  "/manus-storage/alwasmi-alsagheer_04572c54.png": "/manus-storage/alwasmi-alsagheer_04572c54_94bc1581.jpg",
  "/manus-storage/enad_b3b0ae58.png": "/manus-storage/enad_b3b0ae58_996cf3af.jpg",
  "/manus-storage/ghazi-weld-wafra_02cb9f56.png": "/manus-storage/ghazi-weld-wafra_02cb9f56_ca096308.jpg",
  "/manus-storage/mardhi_138a6354.png": "/manus-storage/mardhi_138a6354_d2537b39.jpg",
  "/manus-storage/IMG_7642_ab2dba4c_592c9089.jpeg": "/manus-storage/IMG_7642_ab2dba4c_592c9089.jpg",
  "/manus-storage/IMG_7657_ef9094a9_a6537c87.jpeg": "/manus-storage/IMG_7657_ef9094a9_a6537c87.jpg",
  "/manus-storage/IMG_7675_43657a15_0420cbe8.jpeg": "/manus-storage/IMG_7675_43657a15_0420cbe8.jpg",
  "/manus-storage/reserve/1/content/IMG_7675_43657a15_0420cbe8.jpeg": "/manus-storage/IMG_7675_43657a15_0420cbe8.jpg",
  "/manus-storage/reserve/270001/camels/IMG_7677_a10100ed.png": "/manus-storage/IMG_7677_a10100ed_8a848c21.jpg",
  "/manus-storage/reserve/270001/content/IMG_7675_43657a15.jpeg": "/manus-storage/IMG_7675_43657a15_0420cbe8.jpg",
  "/manus-storage/v29044g50000d5ciac7og65i2dad18v0_e18747fd.mp4": "/media/v29044g50000d5ciac7og65i2dad18v0_e18747fd_36eaaa24.mp4",
  "/manus-storage/v29044g50000d5ciac7og65i2dad18v0_e18747fd_36eaaa24.mp4": "/media/v29044g50000d5ciac7og65i2dad18v0_e18747fd_36eaaa24.mp4",
  "/manus-storage/zomool-desert-hero-new-camel_f986bb79.png": "/manus-storage/zomool-desert-hero-new-camel_f986bb79_23fd4f72.jpg",
  "/manus-storage/zomool-hero-user-camel-prominent_4eec01bd.png": "/manus-storage/zomool-hero-user-camel-prominent_4eec01bd_9efc625e.jpg",
  "/manus-storage/reserve-logo_7954e6d6.png": "/manus-storage/reserve-logo_7954e6d6.png",
  "/manus-storage/zomool-mark_69b1a465.png": "/manus-storage/reserve-logo_7954e6d6.png",
};


export function publicMediaUrl(value: string): string;
export function publicMediaUrl(value: null): null;
export function publicMediaUrl(value: undefined): undefined;
export function publicMediaUrl(value: string | null): string | null;
export function publicMediaUrl(value: string | undefined): string | undefined;
export function publicMediaUrl(value: string | null | undefined): string | null | undefined {
  if (!value) return value;
  const usesBundledMedia = typeof window !== "undefined" && window.location.hostname !== LEGACY_SITE_HOSTNAME;
  const migratedPath = migratedMedia[value];
  if (value.startsWith("/media/")) return usesBundledMedia ? (migratedMedia[value] ?? value) : value;
  if (!value.startsWith("/manus-storage/")) return migratedPath ? (usesBundledMedia ? migratedPath : value) : value;
  if (!usesBundledMedia) return `${LEGACY_STORAGE_ORIGIN}${value}`;
  if (migratedPath) return `/media/${migratedPath.split("/").at(-1)}`;
  const storageKey = value.slice("/manus-storage/".length);
  const proxiedPath = storageKey.split("/").map((segment) => encodeURIComponent(segment)).join("/");
  return `/api/storage/${proxiedPath}`;
}


export { LEGACY_STORAGE_ORIGIN };
