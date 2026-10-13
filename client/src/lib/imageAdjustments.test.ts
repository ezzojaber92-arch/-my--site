import { describe, expect, it } from "vitest";
import { imageAdjustmentStyle, normalizedImageAdjustments } from "./imageAdjustments";

describe("imageAdjustmentStyle", () => {
  it("keeps the full camel visible with contain and preserves saved adjustments", () => {
    expect(imageAdjustmentStyle({ imagePositionX: 28, imagePositionY: 64, imageScale: 120, imageRotation: -8 })).toMatchObject({
      objectFit: "contain",
      objectPosition: "50% 50%",
      transform: "translate3d(-4.399999999999999%, 2.7999999999999994%, 0) translate3d(0px, 0px, 0) scale(1.2) rotate(-8deg)",
      transformOrigin: "center center",
    });
  });

  it("clamps invalid persisted values to safe editor limits", () => {
    expect(normalizedImageAdjustments({ imagePositionX: -20, imagePositionY: 140, imageScale: 500, imageRotation: -500 })).toEqual({
      positionX: 0,
      positionY: 100,
      scale: 2.2,
      rotation: -180,
    });
  });
});
