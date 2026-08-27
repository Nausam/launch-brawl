import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  async headers() {
    const production = process.env.NODE_ENV === "production";
    const storageOrigin = process.env.STORAGE_ENDPOINT ? (() => { try { return new URL(process.env.STORAGE_ENDPOINT as string).origin; } catch { return ""; } })() : "";
    const contentSecurityPolicy = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${production ? "" : " 'unsafe-eval'"} https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com https://*.protect.clerk.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      `connect-src 'self' https://*.clerk.com https://api.clerk.com https://*.clerk.accounts.dev https://clerk-telemetry.com https://*.clerk-telemetry.com https://*.protect.clerk.com:*${storageOrigin ? ` ${storageOrigin}` : ""}`,
      "frame-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com https://*.protect.clerk.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self' https://checkout.freemius.com",
    ].join('; ');
    return [{ source: "/(.*)", headers: [
      { key: "Content-Security-Policy", value: contentSecurityPolicy },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Resource-Policy", value: "same-site" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ...(production ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
    ] }];
  },
  async rewrites() {
    return [{ source: "/@:username", destination: "/profile/:username" }];
  },
};

export default nextConfig;
