export function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
}

export function isLikelyAutomatedAgent(userAgent: string | null) {
  return Boolean(userAgent && /bot|crawler|spider|headless|slurp|facebookexternalhit|curl|wget|python-requests|httpclient/i.test(userAgent));
}
