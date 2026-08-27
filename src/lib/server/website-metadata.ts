import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import type { PricingType } from "@/lib/types";

export type WebsitePreview = {
  websiteUrl: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  logoUrl: string;
  categoryId: string;
  pricingType: PricingType;
};

const MAX_HTML_BYTES = 800_000;
const FETCH_TIMEOUT_MS = 8_000;

const categoryHints: Record<string, string[]> = {
  ai: ["artificial intelligence", "machine learning", "language model", "chatgpt", "llm", " ai ", "gpt"],
  "developer-tools": ["developer", "dev tool", "api ", "sdk", "github", "code review", "open source library"],
  productivity: ["productivity", "notes", "task", "focus", "workspace", "meeting", "calendar"],
  design: ["design", "figma", "palette", "brand", "ui kit", "moodboard"],
  marketing: ["marketing", "seo", "campaign", "analytics", "newsletter", "growth"],
  saas: ["saas", "subscription", "b2b", "crm", "dashboard", "platform"],
  "mobile-apps": ["ios", "android", "mobile app", "iphone"],
  games: ["game", "playful", "arcade", "multiplayer"],
  finance: ["finance", "budget", "invoice", "money", "banking", "tax"],
  education: ["learn", "education", "course", "reading", "classroom"],
  ecommerce: ["shop", "storefront", "ecommerce", "checkout", "cart"],
  "open-source": ["open source", "oss", "mit license", "apache license"],
};

export function normalizeWebsiteUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Enter a website URL.");
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Only http and https URLs are allowed.");
  if (url.username || url.password) throw new Error("That URL cannot be used.");
  if (isBlockedHost(url.hostname)) throw new Error("That address cannot be fetched.");
  return url;
}

export function isBlockedHost(hostname: string) {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host === "0.0.0.0" || host === "::1" || host === "0") return true;
  if (host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return true;
  if (host === "metadata.google.internal") return true;
  return isPrivateIp(host);
}

function isPrivateIp(host: string) {
  const normalized = host.toLowerCase().replace(/%[0-9a-z]+$/i, "");
  if (normalized.startsWith("::ffff:")) return isPrivateIp(normalized.slice(7));
  const octets = normalized.split(".").map(Number);
  if (octets.length === 4 && octets.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
    const [a, b, c] = octets;
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 0 || b === 168)) || (a === 198 && (b === 18 || b === 19 || b === 51)) || (a === 203 && b === 0 && c === 113) || a >= 224;
  }
  if (/^\d+$/.test(normalized)) {
    const numeric = Number(normalized);
    if (Number.isSafeInteger(numeric) && numeric >= 0 && numeric <= 0xffffffff) return isPrivateIp(`${numeric >>> 24}.${(numeric >>> 16) & 255}.${(numeric >>> 8) & 255}.${numeric & 255}`);
  }
  if (!normalized.includes(":")) return false;
  const expanded = expandIpv6(normalized);
  if (!expanded) return false;
  const first = parseInt(expanded.slice(0, 4), 16);
  const second = parseInt(expanded.slice(4, 8), 16);
  return normalized === "::1" || (first & 0xfe00) === 0xfc00 || (first & 0xffc0) === 0xfe80 || (first === 0 && second === 0);
}

function expandIpv6(value: string) {
  const parts = value.split("::");
  if (parts.length > 2) return "";
  const left = parts[0] ? parts[0].split(":") : [];
  const right = parts[1] ? parts[1].split(":") : [];
  if ([...left, ...right].some((part) => !/^[0-9a-f]{1,4}$/i.test(part))) return "";
  const missing = 8 - left.length - right.length;
  if (missing < 0 || (parts.length === 1 && missing !== 0)) return "";
  return [...left, ...Array.from({ length: missing }, () => "0"), ...right].map((part) => part.padStart(4, "0")).join("");
}

export async function assertSafeRemoteHost(hostname: string) {
  await resolveSafeRemoteAddress(hostname);
}

type SafeRemoteAddress = { address: string; family: 4 | 6 };

async function resolveSafeRemoteAddress(hostname: string): Promise<SafeRemoteAddress> {
  if (isBlockedHost(hostname)) throw new Error("That address cannot be fetched.");
  try {
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    const safe = addresses.filter((address): address is SafeRemoteAddress => !isBlockedHost(address.address) && (address.family === 4 || address.family === 6));
    if (!safe.length) throw new Error("That address cannot be fetched.");
    return safe[0];
  } catch (error) {
    if (error instanceof Error && error.message === "That address cannot be fetched.") throw error;
    throw new Error("That website could not be resolved.");
  }
}

type PinnedResponse = { status: number; ok: boolean; url: string; headers: { get(name: string): string | null }; arrayBuffer(): Promise<ArrayBuffer> };

async function fetchPinnedPage(url: URL): Promise<PinnedResponse> {
  const address = await resolveSafeRemoteAddress(url.hostname);
  const request = url.protocol === "https:" ? httpsRequest : httpRequest;
  return new Promise((resolve, reject) => {
    const client = request({
      protocol: url.protocol,
      hostname: address.address,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: `${url.pathname || "/"}${url.search}`,
      method: "GET",
      headers: {
        Host: url.host,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en",
        "Accept-Encoding": "identity",
        "User-Agent": "Mozilla/5.0 (compatible; LaunchBrawl/1.0; +https://launchbrawl.com)",
      },
      servername: url.hostname,
      lookup: (_hostname, _options, callback) => callback(null, address.address, address.family),
      rejectUnauthorized: url.protocol === "https:",
    }, (response) => {
      const chunks: Buffer[] = [];
      let total = 0;
      const contentLength = Number(response.headers["content-length"] ?? 0);
      if (contentLength > MAX_HTML_BYTES) {
        response.destroy(new Error("That website response is too large."));
        reject(new Error("That website response is too large."));
        return;
      }
      response.on("data", (chunk: Buffer) => {
        total += chunk.length;
        if (total > MAX_HTML_BYTES) {
          response.destroy(new Error("That website response is too large."));
          reject(new Error("That website response is too large."));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => {
        const body = Buffer.concat(chunks);
        const headers = { get: (name: string) => { const value = response.headers[name.toLowerCase()]; return Array.isArray(value) ? value.join(", ") : value ?? null; } };
        resolve({ status: response.statusCode ?? 0, ok: (response.statusCode ?? 0) >= 200 && (response.statusCode ?? 0) < 300, url: url.toString(), headers, arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer });
      });
      response.on("error", reject);
    });
    client.setTimeout(FETCH_TIMEOUT_MS, () => client.destroy(new Error("That website took too long to respond.")));
    client.on("error", reject);
    client.end();
  });
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function clip(value: string, max: number) {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function metaContent(html: string, name: string) {
  const pattern = new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${name}["'][^>]*>`, "i");
  const alt = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["']${name}["'][^>]*>`, "i");
  const tag = html.match(pattern)?.[0] ?? "";
  const content = tag.match(/content=["']([^"']+)["']/i)?.[1] ?? html.match(alt)?.[1] ?? "";
  return content ? decodeHtml(content) : "";
}

function linkHref(html: string, rel: string) {
  return linkHrefs(html, rel)[0] ?? "";
}

function linkHrefs(html: string, rel: string) {
  const tags = [...html.matchAll(new RegExp(`<link[^>]+rel=["'][^"']*${rel}[^"']*["'][^>]*>`, "gi"))];
  return tags.map((tag) => tag[0].match(/href=["']([^"']+)["']/i)?.[1] ?? "").filter(Boolean);
}

function resolveUrl(value: string, base: URL) {
  if (!value) return "";
  try {
    return new URL(value, base).toString();
  } catch {
    return "";
  }
}

function titleFromHtml(html: string) {
  const raw = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  return decodeHtml(raw.replace(/<[^>]+>/g, ""));
}

function readJsonLd(html: string) {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1] ?? "") as unknown;
      const graph = parsed && typeof parsed === "object" && "@graph" in parsed
        ? (parsed as { "@graph": unknown })["@graph"]
        : null;
      const nodes = Array.isArray(parsed) ? parsed : Array.isArray(graph) ? graph : [parsed];
      for (const node of nodes) {
        if (!node || typeof node !== "object") continue;
        const record = node as Record<string, unknown>;
        const type = String(record["@type"] ?? "");
        if (/SoftwareApplication|WebApplication|Product|Organization|WebSite/i.test(type)) return record;
      }
    } catch {
      continue;
    }
  }
  return null;
}

function inferCategory(text: string) {
  const haystack = ` ${text.toLowerCase()} `;
  let best = { id: "saas", score: 0 };
  for (const [id, hints] of Object.entries(categoryHints)) {
    const score = hints.reduce((sum, hint) => sum + (haystack.includes(hint) ? hint.length : 0), 0);
    if (score > best.score) best = { id, score };
  }
  return best.id;
}

function inferPricing(text: string, hostname: string): PricingType {
  if (/open.?source|mit license|apache license/.test(text) || hostname.includes("github.io")) return "Open source";
  if (/freemium/.test(text)) return "Freemium";
  if (/\bfree\b/.test(text) && /pro|paid|pricing|subscription/.test(text)) return "Freemium";
  if (/\bfree\b/.test(text) && !/trial/.test(text)) return "Free";
  if (/\$|paid|pricing|subscription/.test(text)) return "Paid";
  return "Free";
}

function cleanName(title: string, siteName: string, hostname: string) {
  const brand = siteName || hostname.replace(/^www\./, "").split(".")[0] || "Untitled";
  const prettyBrand = brand.charAt(0).toUpperCase() + brand.slice(1);
  if (!title) return clip(prettyBrand, 80);
  const stripped = title
    .replace(new RegExp(`\\s*[|–—-]\\s*${siteName || hostname}.*$`, "i"), "")
    .replace(/\s*[|–—-]\s*(official site|home|welcome).*$/i, "")
    .trim();
  const firstClause = stripped.split(/\s+[|–—-]\s+/)[0]?.trim() ?? "";
  if (firstClause && firstClause.length >= 2 && firstClause.length <= 40) return clip(firstClause, 80);
  if (stripped && stripped.length <= 48) return clip(stripped, 80);
  if (siteName && siteName.length <= 40) return clip(siteName, 80);
  return clip(stripped || prettyBrand, 80);
}

function isIcoUrl(url: string) {
  return /\.ico(?:[?#]|$)/i.test(url);
}

function pickLogoUrl(html: string, pageUrl: URL, jsonImage: string) {
  const apple = resolveUrl(linkHref(html, "apple-touch-icon"), pageUrl);
  const icons = [...linkHrefs(html, "icon"), ...linkHrefs(html, "shortcut icon")].map((href) => resolveUrl(href, pageUrl)).filter(Boolean);
  const og = resolveUrl(metaContent(html, "og:image"), pageUrl);
  const twitter = resolveUrl(metaContent(html, "twitter:image"), pageUrl);
  const json = resolveUrl(jsonImage, pageUrl);
  const rasterIcon = icons.find((url) => !isIcoUrl(url));
  const icon = icons[0] ?? "";

  if (apple) return apple;
  if (rasterIcon) return rasterIcon;
  if (og) return og;
  if (twitter) return twitter;
  if (json) return json;
  return icon;
}

export function parseWebsiteHtml(html: string, pageUrl: URL): WebsitePreview {
  const jsonLd = readJsonLd(html);
  const jsonName = typeof jsonLd?.name === "string" ? decodeHtml(jsonLd.name) : "";
  const jsonDescription = typeof jsonLd?.description === "string" ? decodeHtml(jsonLd.description) : "";
  const jsonImageValue = jsonLd?.image;
  const jsonImage = typeof jsonImageValue === "string"
    ? jsonImageValue
    : jsonImageValue && typeof jsonImageValue === "object" && "url" in jsonImageValue && typeof jsonImageValue.url === "string"
      ? jsonImageValue.url
      : "";

  const siteName = metaContent(html, "og:site_name") || jsonName;
  const title = metaContent(html, "og:title") || metaContent(html, "twitter:title") || titleFromHtml(html) || jsonName;
  const description = metaContent(html, "og:description") || metaContent(html, "twitter:description") || metaContent(html, "description") || jsonDescription;
  const image = pickLogoUrl(html, pageUrl, jsonImage);
  const keywords = metaContent(html, "keywords");
  const blob = `${title} ${description} ${keywords} ${siteName}`.toLowerCase();
  const name = cleanName(title, siteName, pageUrl.hostname);
  const fullDescription = clip(description || `${name} is listed from ${pageUrl.hostname}.`, 4000);
  const shortDescription = clip(description || `A product from ${pageUrl.hostname}.`, 180);

  return {
    websiteUrl: pageUrl.origin + pageUrl.pathname.replace(/\/$/, "") + pageUrl.search,
    name: name || pageUrl.hostname,
    shortDescription: shortDescription.length >= 10 ? shortDescription : clip(`${shortDescription} Discover more on the official site.`, 180),
    fullDescription: fullDescription.length >= 20 ? fullDescription : clip(`${fullDescription} Visit the official website for details, pricing, and the latest updates.`, 4000),
    logoUrl: image,
    categoryId: inferCategory(blob),
    pricingType: inferPricing(blob, pageUrl.hostname),
  };
}

export async function fetchWebsitePreview(rawUrl: string): Promise<WebsitePreview> {
  const url = normalizeWebsiteUrl(rawUrl);
  await assertSafeRemoteHost(url.hostname);
  const deadline = Date.now() + FETCH_TIMEOUT_MS;
  try {
    let currentUrl = url;
    let response: PinnedResponse | undefined;
    for (let redirects = 0; redirects <= 5; redirects += 1) {
      if (Date.now() >= deadline) throw new Error("That website took too long to respond.");
      await assertSafeRemoteHost(currentUrl.hostname);
      response = await fetchPinnedPage(currentUrl).catch((error: unknown) => {
        if (error instanceof Error && /too long|timeout/i.test(error.message)) throw new Error("That website took too long to respond.");
        if (error instanceof Error && error.message === "That website response is too large.") throw error;
        throw new Error("Could not reach that website.");
      });
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      const location = response.headers.get("location");
      if (!location || redirects === 5) throw new Error("That website redirected too many times.");
      currentUrl = new URL(location, currentUrl);
      if (currentUrl.protocol !== "http:" && currentUrl.protocol !== "https:") throw new Error("That website redirected to an unsafe address.");
      await assertSafeRemoteHost(currentUrl.hostname);
    }
    if (!response) throw new Error("Could not reach that website.");
    const finalUrl = new URL(response.url || currentUrl.toString());
    await assertSafeRemoteHost(finalUrl.hostname);
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok) throw new Error("That website did not return a readable page.");
    if (contentType && !/text\/html|application\/xhtml\+xml/i.test(contentType)) {
      return parseWebsiteHtml("", finalUrl);
    }
    const buffer = await response.arrayBuffer();
    const html = new TextDecoder("utf-8", { fatal: false }).decode(buffer.slice(0, MAX_HTML_BYTES));
    return parseWebsiteHtml(html, finalUrl);
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Could not read that website.");
  }
}
