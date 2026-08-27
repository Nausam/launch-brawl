"use client";

import Link from "next/link";
import { Show, UserButton, useAuth } from "@clerk/nextjs";
import { ArrowUpRight, LayoutDashboard, Menu, Moon, Search, ShieldCheck, Sun, X } from "lucide-react";
import { useEffect, useSyncExternalStore, useState } from "react";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import type { AppUserRole } from "@/lib/types";
import { BrawlMark } from "@/components/brand/BrawlMark";
import { SubmitProductButton } from "@/components/submit/SubmitProductButton";
import { Button, ButtonLink } from "@/components/ui/Button";

function subscribeToTheme(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("launchbrawl-theme-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("launchbrawl-theme-change", onChange);
  };
}

function getThemeSnapshot() {
  return window.localStorage.getItem("launchbrawl-theme") === "dark";
}

function getServerThemeSnapshot() {
  return false;
}

function isAppUserRole(value: unknown): value is AppUserRole {
  return value === "USER" || value === "MODERATOR" || value === "ADMIN";
}

function WorkspaceLink({ role, onClick, className }: { role: AppUserRole; onClick?: () => void; className?: string }) {
  const staff = role === "ADMIN" || role === "MODERATOR";
  const label = staff ? "Admin" : "Dashboard";
  const href = staff ? "/admin" : "/dashboard";
  return (
    <ButtonLink
      href={href}
      onClick={onClick}
      aria-label={label}
      variant="secondary"
      size="sm"
      icon={staff ? <ShieldCheck size={14} /> : <LayoutDashboard size={14} />}
      arrow
      className={cn("font-bold", className)}
    >
      {label}
    </ButtonLink>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);
  const { isLoaded: authLoaded, isSignedIn, userId } = useAuth();
  const [workspaceAccess, setWorkspaceAccess] = useState<{ userId: string; role: AppUserRole } | null>(null);

  useEffect(() => {
    if (!authLoaded || !isSignedIn || !userId) return;

    const controller = new AbortController();
    const accountUserId = userId;
    void fetch("/api/account", { cache: "no-store", headers: { Accept: "application/json" }, signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: unknown) => {
        const role = data && typeof data === "object" && "role" in data && isAppUserRole(data.role) ? data.role : "USER";
        setWorkspaceAccess({ userId: accountUserId, role });
      })
      .catch(() => {
        if (!controller.signal.aborted) setWorkspaceAccess({ userId: accountUserId, role: "USER" });
      });

    return () => controller.abort();
  }, [authLoaded, isSignedIn, userId]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const toggleTheme = () => {
    const next = !dark;
    window.localStorage.setItem("launchbrawl-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
    window.dispatchEvent(new Event("launchbrawl-theme-change"));
  };

  const workspaceRole = workspaceAccess?.userId === userId ? workspaceAccess?.role ?? "USER" : "USER";

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
        <Link href="/" aria-label="Launch Brawl home" onClick={() => setOpen(false)}><BrawlMark compact /></Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
          {siteConfig.navigation.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return <Link key={item.href} href={item.href} className={cn("text-[13px] font-semibold text-muted transition hover:text-ink", active && "text-ink")}>{item.label}</Link>;
          })}
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          <ButtonLink href="/search" variant="icon" size="icon" icon={<Search size={17} strokeWidth={2.2} />} aria-label="Search" className="border-transparent bg-transparent" />
          <Button onClick={toggleTheme} variant="icon" icon={dark ? <Sun size={17} /> : <Moon size={17} />} aria-label="Toggle dark mode" aria-pressed={dark} />
          <Show when="signed-out">
            <ButtonLink href="/sign-in" variant="secondary" size="md" arrow className="ml-2">Sign in</ButtonLink>
            <SubmitProductButton variant="primary" size="md" arrow>Submit</SubmitProductButton>
          </Show>
          <Show when="signed-in">
            <WorkspaceLink role={workspaceRole} />
            <UserButton
              appearance={{ elements: { avatarBox: "ml-2 h-10 w-10" } }}
            >
              <UserButton.MenuItems>
                <UserButton.Link label="Dashboard" labelIcon={<LayoutDashboard size={14} />} href="/dashboard" />
                <UserButton.Link label="Submit a product" labelIcon={<ArrowUpRight size={14} />} href="/submit" />
              </UserButton.MenuItems>
            </UserButton>
          </Show>
        </div>
        <Button variant="icon" icon={open ? <X size={21} /> : <Menu size={21} />} className="border-transparent bg-transparent text-ink lg:hidden" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close menu" : "Open menu"} />
      </div>
      {open && <div className="border-t border-line bg-paper px-5 py-5 lg:hidden">
        <nav className="grid gap-1" aria-label="Mobile navigation">
          {siteConfig.navigation.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold hover:bg-paper-strong">{item.label}</Link>)}
          <Link href="/search" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold hover:bg-paper-strong">Search the brawl</Link>
          <Show when="signed-out">
            <ButtonLink href="/sign-in" onClick={() => setOpen(false)} variant="secondary" size="md" arrow className="w-full justify-between">Sign in</ButtonLink>
          </Show>
          <Show when="signed-in">
            <WorkspaceLink role={workspaceRole} onClick={() => setOpen(false)} className="justify-center" />
            <div className="px-3 py-2"><UserButton /></div>
          </Show>
          <SubmitProductButton onOpen={() => setOpen(false)} variant="primary" size="md" arrow className="mt-2 w-full">Submit</SubmitProductButton>
        </nav>
      </div>}
    </header>
  );
}
