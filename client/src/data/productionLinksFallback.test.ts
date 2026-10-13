import { describe, expect, it } from "vitest";
import { productionLinksFallback } from "./productionLinksFallback";

describe("productionLinksFallback", () => {
  it("keeps the real production links for Raahi ordered newest first", () => {
    expect(productionLinksFallback["Z-001"].map((link) => link.platform)).toEqual(["إكس", "يوتيوب"]);
  });
});
