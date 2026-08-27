export function isSeedDataEnabled() {
  return (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") && process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

export function requiresPersistentData() {
  return !isSeedDataEnabled();
}

export function publicAppUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && !(url.hostname === "localhost" && url.protocol === "http:")) return "";
    return url.origin;
  } catch {
    return "";
  }
}
