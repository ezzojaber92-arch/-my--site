export type PublishedContentFallback = {
  id: number;
  kind: "news" | "announcement" | "celebration" | "photo" | "video";
  title: string;
  body: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  camelRecordId: number | null;
  likeCount: number;
  publishedAt: string;
};

// نسخة عرض من المواد المنشورة فعلياً وقت النقل، تظهر عند تعذر الوصول إلى قاعدة البيانات الخارجية.
export const publishedContentFallback: PublishedContentFallback[] = [
  {
    id: 240001,
    kind: "announcement",
    title: "قريباً",
    body: "قريباً سيتم إعلان موعد فتح الزمول للموسم الجديد",
    mediaUrl: "/manus-storage/IMG_7657_ef9094a9_a6537c87.jpeg",
    thumbnailUrl: null,
    durationSeconds: null,
    camelRecordId: null,
    likeCount: 0,
    publishedAt: "2026-08-26T03:26:15.000Z",
  },
  {
    id: 210001,
    kind: "celebration",
    title: "تهنئة",
    body: "تهني إدارة المحمية المالك عيسى بن سعيد علي إطلاق هذا الموقع ليكون إضافة حقيقية للمحمية ويسهل للملاك امتلاك المعلومات من مكان واحد وموثوق.",
    mediaUrl: null,
    thumbnailUrl: null,
    durationSeconds: null,
    camelRecordId: null,
    likeCount: 0,
    publishedAt: "2026-08-26T03:09:53.000Z",
  },
  {
    id: 180001,
    kind: "photo",
    title: "عناد",
    body: null,
    mediaUrl: "/manus-storage/IMG_7642_ab2dba4c_592c9089.jpeg",
    thumbnailUrl: null,
    durationSeconds: null,
    camelRecordId: null,
    likeCount: 0,
    publishedAt: "2026-08-26T03:04:18.000Z",
  },
  {
    id: 150001,
    kind: "video",
    title: "المحمية 2026",
    body: "ذكرى من العام 2026",
    mediaUrl: "/manus-storage/v29044g50000d5ciac7og65i2dad18v0_e18747fd_36eaaa24.mp4",
    thumbnailUrl: "/manus-storage/reserve-video-2026-thumbnail_1931bf11_b97b1100.jpg",
    durationSeconds: 16,
    camelRecordId: null,
    likeCount: 0,
    publishedAt: "2026-08-25T19:07:57.000Z",
  },
  {
    id: 120001,
    kind: "photo",
    title: "راهي ولد السريعة",
    body: "ربنا يبارك في راعية",
    mediaUrl: "/manus-storage/IMG_7675_43657a15_0420cbe8.jpeg",
    thumbnailUrl: null,
    durationSeconds: null,
    camelRecordId: 1,
    likeCount: 1,
    publishedAt: "2026-08-25T18:40:36.000Z",
  },
];
