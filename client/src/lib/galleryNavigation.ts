export function getCyclicGalleryIndex(currentIndex: number, imageCount: number, direction: 1 | -1) {
  if (imageCount <= 0) return -1;
  const normalizedIndex = Math.min(Math.max(currentIndex, 0), imageCount - 1);
  return (normalizedIndex + direction + imageCount) % imageCount;
}
