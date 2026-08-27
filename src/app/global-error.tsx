"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en"><body><main style={{ fontFamily: "system-ui", padding: "4rem", maxWidth: "44rem", margin: "0 auto" }}><p style={{ color: "#ff7058", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em" }}>Launch Brawl</p><h1 style={{ fontSize: "3rem", lineHeight: 1.05 }}>The arena needs a reset.</h1><p style={{ lineHeight: 1.6 }}>An unexpected error stopped the application. Try recovering the page.</p><button type="button" onClick={() => reset()} style={{ background: "#171717", color: "white", border: 0, padding: ".8rem 1.2rem", fontWeight: 700 }}>Try again</button></main></body></html>;
}
