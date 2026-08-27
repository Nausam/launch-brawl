import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowUpRight, Sparkles, Users, Vote } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { clerkAppearance } from "@/lib/clerk-appearance";

export const metadata = { title: "Sign up" };

export default async function SignUpPage() {
  const { isAuthenticated } = await auth();
  if (isAuthenticated) redirect("/dashboard");

  return (
    <PageContainer>
      <div className="grid gap-12 lg:grid-cols-[.78fr_1.22fr] lg:gap-20">
        <div>
          <div className="eyebrow text-coral">Join the board</div>
          <h1 className="display mt-4 text-5xl font-black leading-[.98] tracking-tight sm:text-7xl">
            Create your Launch Brawl account.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-muted">
            List a product for free, vote in live Brawls, and keep a maker workspace for campaigns when you want paid reach.
          </p>
          <div className="mt-10 grid gap-5">
            {[
              { icon: Sparkles, title: "Free to start", text: "A product profile and organic discovery do not require a bid." },
              { icon: Vote, title: "One vote, your record", text: "Signed-in votes stay private to you and count toward public Brawl splits." },
              { icon: Users, title: "Maker workspace", text: "Products, bids, and campaign delivery live in one dashboard." },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <item.icon size={19} className="mt-0.5 text-coral" />
                <div>
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/sign-in" className="mt-9 inline-flex items-center gap-2 text-sm font-bold text-ink underline decoration-coral decoration-2 underline-offset-4">
            Already have an account? Sign in <ArrowUpRight size={15} />
          </Link>
        </div>
        <SignUp
          appearance={clerkAppearance}
          fallbackRedirectUrl="/dashboard"
          signInUrl="/sign-in"
        />
      </div>
    </PageContainer>
  );
}
