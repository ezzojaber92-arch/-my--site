import { describe, expect, it } from "vitest";
import { CELEBRATION_WINDOW_MS, getCelebrationHoursRemaining, isCelebrationActive } from "./celebrationTiming";

describe("مدة ظهور التهنئة", () => {
  const publishedAt = new Date("2026-08-25T10:00:00.000Z");
  const publishedTime = publishedAt.getTime();

  it("تبقى التهنئة في أعلى الصفحة خلال أول 24 ساعة", () => {
    expect(isCelebrationActive(publishedAt, publishedTime + 23 * 60 * 60 * 1000)).toBe(true);
  });

  it("تبقى التهنئة ظاهرة بعد اكتمال 24 ساعة حتى تغيّرها الإدارة أو تحذفها", () => {
    expect(isCelebrationActive(publishedAt, publishedTime + CELEBRATION_WINDOW_MS)).toBe(true);
    expect(isCelebrationActive(publishedAt, publishedTime + 7 * 24 * 60 * 60 * 1000)).toBe(true);
  });

  it("يعرض الساعات المتبقية بالتقريب لأعلى", () => {
    expect(getCelebrationHoursRemaining(publishedAt, publishedTime + 90 * 60 * 1000)).toBe(23);
  });
});
