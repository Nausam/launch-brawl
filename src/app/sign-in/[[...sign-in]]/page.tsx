import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowUpRight, ShieldCheck, Trophy, Vote } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { clerkAppearance } from "@/lib/clerk-appearance";

export const metadata = { title: "Sign in" };

export default async function SignInPage() {
  const { isAuthenticated } = await auth();
  if (isAuthenticated) redirect("/dashboard");

  return (
    <PageContainer>
      <div className="grid gap-12 lg:grid-cols-[.78fr_1.22fr] lg:gap-20">
        <div>
          <div className="eyebrow text-coral">Welcome back</div>
          <h1 className="display mt-4 text-5xl font-black leading-[.98] tracking-tight sm:text-7xl">
            Sign in to the brawl.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-muted">
            Vote in live matchups, bid for the Daily Brawl, and keep an eye on the campaigns you already paid for.
          </p>
          <div className="mt-10 grid gap-5">
            {[
              { icon: Vote, title: "Community votes stay yours", text: "One signed-in vote per Brawl, counted in the public split and kept private on your account." },
              { icon: Trophy, title: "Maker workspace", text: "Products, bids, impression delivery, and notifications live in one dashboard." },
              { icon: ShieldCheck, title: "Paid reach stays labeled", text: "Signing in never mixes sponsored placement with organic discovery." },
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
          <Link href="/about" className="mt-9 inline-flex items-center gap-2 text-sm font-bold text-ink underline decoration-coral decoration-2 underline-offset-4">
            Why Launch Brawl stays transparent <ArrowUpRight size={15} />
          </Link>
        </div>
        <SignIn
          appearance={clerkAppearance}
          fallbackRedirectUrl="/dashboard"
          signUpUrl="/sign-up"
        />
      </div>
    </PageContainer>
  );
}
