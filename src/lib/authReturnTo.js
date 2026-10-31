// Return a safe same-site path from a login or registration query parameter.
export function safeReturnTo(raw) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return "/";

  try {
    const base = "https://littlegenius.invalid";
    const url = new URL(raw, base);
    if (url.origin !== base) return "/";
    url.searchParams.delete("access_token");
    url.searchParams.delete("clear_access_token");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
