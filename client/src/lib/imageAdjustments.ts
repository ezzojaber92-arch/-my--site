import type { CSSProperties } from "react";

export type ImageAdjustments = {
  imagePositionX?: number;
  imagePositionY?: number;
  imageScale?: number;
  imageRotation?: number;
};

export type ImageAdjustmentMotion = {
  translateX?: number;
  translateY?: number;
  scale?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizedImageAdjustments(adjustments: ImageAdjustments = {}) {
  return {
    positionX: clamp(adjustments.imagePositionX ?? 50, 0, 100),
    positionY: clamp(adjustments.imagePositionY ?? 50, 0, 100),
    scale: clamp(adjustments.imageScale ?? 100, 50, 220) / 100,
    rotation: clamp(adjustments.imageRotation ?? 0, -180, 180),
  };
}

export function imageAdjustmentStyle(adjustments: ImageAdjustments = {}, motion: ImageAdjustmentMotion = {}): CSSProperties {
  const normalized = normalizedImageAdjustments(adjustments);
  const motionScale = Math.max(0.5, motion.scale ?? 1);
  // Position values are the editor's 0–100% pan controls. Convert them to
  // movement only when the image is enlarged, so the image stays centered at
  // 100% and can be moved safely inside the 4:3 frame after zooming.
  const panX = (normalized.positionX - 50) * (normalized.scale - 1);
  const panY = (normalized.positionY - 50) * (normalized.scale - 1);

  return {
    objectFit: "contain",
    objectPosition: "50% 50%",
    transform: `translate3d(${panX}%, ${panY}%, 0) translate3d(${motion.translateX ?? 0}px, ${motion.translateY ?? 0}px, 0) scale(${normalized.scale * motionScale}) rotate(${normalized.rotation}deg)`,
    transformOrigin: "center center",
  };
}

export function imageAdjustmentKey(url: string) {
  return url.trim();
}
