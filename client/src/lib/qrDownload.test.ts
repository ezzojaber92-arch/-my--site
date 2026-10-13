import { describe, expect, it } from "vitest";
import { qrFileStem } from "./qrDownload";

describe("qrFileStem", () => {
  it("keeps printable QR filenames safe and readable", () => {
    expect(qrFileStem("Z-001")).toBe("Z-001");
    expect(qrFileStem("  reserve / sign  ")).toBe("reserve-sign");
  });
});
