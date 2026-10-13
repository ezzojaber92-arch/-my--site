import { describe, expect, it } from "vitest";
import { toSameOriginHistoryPath } from "./safeHistory";

describe("toSameOriginHistoryPath", () => {
  it("keeps the camel path on the open site's origin", () => {
    expect(toSameOriginHistoryPath("https://reserve.example/", "/?camel=Z-001#herd")).toBe("/?camel=Z-001#herd");
  });

  it("rejects a URL that points to another deployment", () => {
    expect(toSameOriginHistoryPath("https://reserve.example/", "https://old.example/?camel=Z-001")).toBeNull();
  });
});
