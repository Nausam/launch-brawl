export function hasSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const requestOrigin = new URL(request.url).origin;
    const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin : requestOrigin;
    return origin === requestOrigin || origin === configuredOrigin;
  } catch {
    return false;
  }
}

export function requestId(request: Request) {
  const supplied = request.headers.get("x-request-id")?.trim();
  return supplied && supplied.length <= 128 ? supplied : crypto.randomUUID();
}
