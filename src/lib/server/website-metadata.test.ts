import { describe, expect, it } from "vitest";
import { isBlockedHost, normalizeWebsiteUrl, parseWebsiteHtml } from "@/lib/server/website-metadata";

describe("website metadata", () => {
  it("blocks private hosts", () => {
    expect(isBlockedHost("localhost")).toBe(true);
    expect(isBlockedHost("127.0.0.1")).toBe(true);
    expect(isBlockedHost("192.168.1.10")).toBe(true);
    expect(isBlockedHost("linear.app")).toBe(false);
  });

  it("adds https when missing", () => {
    expect(normalizeWebsiteUrl("notion.so/product").hostname).toBe("notion.so");
  });

  it("reads open graph fields from html", () => {
    const html = `
      <html><head>
        <title>SupaAI — Official</title>
        <meta property="og:site_name" content="SupaAI" />
        <meta property="og:title" content="SupaAI" />
        <meta property="og:description" content="A thoughtful AI chief of staff for the messy middle of work." />
        <meta property="og:image" content="/logo.png" />
      </head></html>
    `;
    const preview = parseWebsiteHtml(html, new URL("https://supaai.example/"));
    expect(preview.name).toBe("SupaAI");
    expect(preview.shortDescription).toContain("chief of staff");
    expect(preview.logoUrl).toBe("https://supaai.example/logo.png");
    expect(preview.categoryId).toBe("ai");
  });

  it("prefers a raster icon over the first favicon.ico", () => {
    const html = `
      <html><head>
        <title>Cite Ready AI</title>
        <link rel="icon" href="/favicon.ico" sizes="256x256" type="image/x-icon" />
        <link rel="icon" href="/icon.png" sizes="512x512" type="image/png" />
      </head></html>
    `;
    const preview = parseWebsiteHtml(html, new URL("https://citereadyai.com/"));
    expect(preview.logoUrl).toBe("https://citereadyai.com/icon.png");
  });

  it("prefers a square apple touch icon over a wide open graph image", () => {
    const html = `
      <html><head>
        <title>Cite Ready AI</title>
        <meta property="og:image" content="https://citereadyai.com/og.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head></html>
    `;
    const preview = parseWebsiteHtml(html, new URL("https://citereadyai.com/"));
    expect(preview.logoUrl).toBe("https://citereadyai.com/apple-touch-icon.png");
  });
});
