export function normalizePhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("0") && digits.length >= 9) return `+971${digits.slice(1)}`;
  return `+${digits}`;
}

export function phoneDigits(value: string) {
  return normalizePhoneNumber(value).replace(/\D/g, "");
}

export function formatPhoneNumber(value: string) {
  const normalized = normalizePhoneNumber(value);
  const digits = normalized.replace(/\D/g, "");
  if (digits.startsWith("971") && digits.length === 12) {
    return `+971 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return normalized;
}

export function phoneLink(value: string) {
  return `tel:${normalizePhoneNumber(value)}`;
}

export function whatsappLink(value: string) {
  const digits = phoneDigits(value);
  return digits ? `https://wa.me/${digits}` : "https://wa.me/";
}
