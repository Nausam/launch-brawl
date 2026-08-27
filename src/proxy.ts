import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { requestId } from "@/lib/server/request";

// Keep Clerk middleware for request context and cross-cutting request policy.
// Authentication is enforced by the protected pages and Route Handlers themselves.
const clerkProxy = clerkMiddleware((_auth, req) => {
  const unsafeMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  const isWebhookOrCron = req.nextUrl.pathname.startsWith("/api/freemius/webhook") || req.nextUrl.pathname.startsWith("/api/webhooks/") || req.nextUrl.pathname.startsWith("/api/cron/");
  const origin = req.headers.get("origin");
  if (unsafeMethod && !isWebhookOrCron && (origin || process.env.NODE_ENV === "production")) {
    let configured = req.nextUrl.origin;
    try {
      if (process.env.NEXT_PUBLIC_APP_URL) configured = new URL(process.env.NEXT_PUBLIC_APP_URL).origin;
    } catch {
      configured = req.nextUrl.origin;
    }
    if (!origin || (origin !== req.nextUrl.origin && origin !== configured)) return NextResponse.json({ error: "Cross-origin mutation rejected." }, { status: 403 });
  }
});

function isLocalDevelopmentRequest(request: NextRequest) {
  return process.env.NODE_ENV !== "production" && request.nextUrl.hostname === "localhost";
}

function cleanHandshakeUrl(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.searchParams.delete("__clerk_handshake");
  return url;
}

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  const id = requestId(request);
  let response: Response;
  if (isLocalDevelopmentRequest(request) && request.nextUrl.pathname === "/" && request.nextUrl.searchParams.has("__clerk_handshake")) {
    response = NextResponse.redirect(cleanHandshakeUrl(request));
  } else {
    response = (await clerkProxy(request, event)) ?? NextResponse.next();
  }
  response.headers.set("x-request-id", id);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
