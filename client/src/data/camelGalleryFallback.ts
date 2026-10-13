// الصور الإضافية المنشورة فعلياً وقت النقل، وتُستخدم فقط إلى أن تتصل TiDB في Vercel.
export const camelGalleryFallback: Record<string, string[]> = {
  // صورتا راهي المؤكدتان من حزمة الوسائط المنشورة؛ الصورة الأساسية تُضاف من selectedCamel.image.
  "Z-001": [
    "/media/IMG_7677_a10100ed.png",
    "/manus-storage/reserve/1/content/IMG_7675_43657a15_0420cbe8.jpeg",
  ],
};
