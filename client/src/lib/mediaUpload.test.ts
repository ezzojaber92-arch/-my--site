import { describe, expect, it } from "vitest";
import { MAX_MEDIA_BYTES, validateMediaFile } from "./mediaUpload";

describe("media upload validation", () => {
  it("accepts a normal MP4 video", () => {
    const file = new File([new Uint8Array(10)], "reserve.mp4", { type: "video/mp4" });
    expect(validateMediaFile(file, "video")).toBeNull();
  });

  it("rejects unsupported video types with a useful Arabic message", () => {
    const file = new File([new Uint8Array(10)], "reserve.avi", { type: "video/x-msvideo" });
    expect(validateMediaFile(file, "video")).toContain("MP4");
  });

  it("rejects files above the upload limit", () => {
    const file = new File([new Uint8Array(MAX_MEDIA_BYTES + 1)], "large.mp4", { type: "video/mp4" });
    expect(validateMediaFile(file, "video")).toContain("25 ميغابايت");
  });
});
