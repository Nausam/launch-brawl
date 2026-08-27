import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Space_Grotesk } from "next/font/google";
import { siteConfig } from "@/config/site";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MaintenanceBanner } from "@/components/layout/MaintenanceBanner";
import { SubmitProductProvider } from "@/components/submit/SubmitProductProvider";
import "./globals.css";

const siteFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-game",
  display: "swap",
  weight: "variable",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name} — ${siteConfig.tagline}`, template: `%s — ${siteConfig.name}` },
  description: siteConfig.description,
  openGraph: { title: siteConfig.name, description: siteConfig.description, type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={siteFont.variable} suppressHydrationWarning>
      <body>
        <ClerkProvider
          dynamic
          appearance={clerkAppearance}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          afterSignOutUrl="/"
        >
          <SubmitProductProvider>
            <SiteHeader />
            <MaintenanceBanner />
            {children}
            <SiteFooter />
          </SubmitProductProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
