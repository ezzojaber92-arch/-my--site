import { describe, expect, it } from "vitest";
import { formatPhoneNumber, normalizePhoneNumber, phoneLink, whatsappLink } from "./phone";

describe("phone formatting", () => {
  it("normalizes a number with a misplaced plus sign", () => {
    expect(normalizePhoneNumber("971504419789+")).toBe("+971504419789");
    expect(formatPhoneNumber("971504419789+")).toBe("+971 50 441 9789");
  });

  it("supports local UAE numbers", () => {
    expect(formatPhoneNumber("0504419789")).toBe("+971 50 441 9789");
  });

  it("creates valid call and WhatsApp links", () => {
    expect(phoneLink("+971 50 441 9789")).toBe("tel:+971504419789");
    expect(whatsappLink("+971 50 441 9789")).toBe("https://wa.me/971504419789");
  });
});
