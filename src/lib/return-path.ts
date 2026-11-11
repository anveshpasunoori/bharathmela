// Keep user-supplied return destinations on this site.
export function safeNextPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("\\") || Array.from(value).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) return fallback;
  const origin = "https://www.bharathmela.com";
  const parsed = new URL(value, origin);
  return parsed.origin === origin && !parsed.pathname.startsWith("//") ? value : fallback;
}
