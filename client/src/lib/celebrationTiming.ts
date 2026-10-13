export const CELEBRATION_WINDOW_MS = 24 * 60 * 60 * 1000;

export function isCelebrationActive(publishedAt: Date | string, now: number) {
  // التهنئة تبقى ظاهرة حتى تغيّرها الإدارة أو تحذفها؛ الناشر المستقبلي فقط لا يظهر بعد.
  return now >= new Date(publishedAt).getTime();
}

export function getCelebrationHoursRemaining(publishedAt: Date | string, now: number) {
  const remaining = new Date(publishedAt).getTime() + CELEBRATION_WINDOW_MS - now;
  return Math.max(0, Math.ceil(remaining / (60 * 60 * 1000)));
}
