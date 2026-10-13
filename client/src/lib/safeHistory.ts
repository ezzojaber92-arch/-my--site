export function toSameOriginHistoryPath(currentUrl: string, nextUrl: string) {
  const current = new URL(currentUrl);
  const next = new URL(nextUrl, current);
  if (next.origin !== current.origin) return null;
  return `${next.pathname}${next.search}${next.hash}`;
}

export function replaceBrowserHistory(nextUrl: string) {
  if (typeof window === "undefined") return;
  try {
    const safePath = toSameOriginHistoryPath(window.location.href, nextUrl);
    if (safePath) window.history.replaceState({}, "", safePath);
  } catch {
    // لا نسمح لفشل History API في Safari بإغلاق بطاقة البعير أو الصفحة.
  }
}
