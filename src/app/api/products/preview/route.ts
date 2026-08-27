import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { rateLimit } from "@/lib/integrations/rate-limit";
import { fetchWebsitePreview, normalizeWebsiteUrl, parseWebsiteHtml } from "@/lib/server/website-metadata";
import { websitePreviewSchema } from "@/lib/server/schemas";
import { clientIp } from "@/lib/server/traffic";

export async function POST(request: Request) {
  const user = await getCurrentAppUser();
  const limit = await rateLimit(`preview:${user?.id ?? clientIp(request)}`, 12);
  if (!limit.success) return NextResponse.json({ error: "Too many lookups. Try again in a minute." }, { status: 429 });
  try {
    const parsed = websitePreviewSchema.parse(await request.json());
    try {
      const preview = await fetchWebsitePreview(parsed.url);
      return NextResponse.json({ ok: true, preview });
    } catch (error) {
      try {
        const url = normalizeWebsiteUrl(parsed.url);
        return NextResponse.json({
          ok: false,
          preview: parseWebsiteHtml("", url),
          error: error instanceof Error ? error.message : "Could not read that website. You can fill in the details yourself.",
        });
      } catch {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Enter a valid website URL." }, { status: 400 });
      }
    }
  } catch {
    return NextResponse.json({ error: "Enter a valid website URL." }, { status: 400 });
  }
}
