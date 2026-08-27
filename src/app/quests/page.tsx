import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check, Circle, Flame, Sparkles } from "lucide-react";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { getQuestProgress, getUserGamification } from "@/lib/repositories/competitive";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Pill } from "@/components/ui/Pill";

export const metadata: Metadata = { title: "Daily Quests", description: "Small, meaningful ways to participate in Launch Brawl and earn user XP." };
export const dynamic = "force-dynamic";

export default async function QuestsPage() {
  const user = await getCurrentAppUser();
  const [quests, stats] = await Promise.all([getQuestProgress(user?.id), user ? getUserGamification(user.id) : null]);
  const completed = quests.filter((quest) => quest.completed).length;
  return <PageContainer><SectionHeading eyebrow="User progression" title="Daily Quests" description="A few meaningful actions each day. No refresh farming, no paid shortcuts, and each reward is awarded once server-side." /><section className="mt-10 flex flex-wrap items-center gap-4 border border-coral/25 bg-coral/5 p-5"><Flame className="text-coral" size={22} /><div><p className="text-sm font-black">{completed} / {quests.length} complete today</p><p className="mt-1 text-xs text-muted">{user ? `Level ${stats?.level ?? 1} · verified progress for this account.` : "Sign in to persist quest progress across devices."}</p></div><Pill tone="coral"><Sparkles size={13} className="mr-1" />+{quests.reduce((sum, quest) => sum + (quest.completed ? quest.xpReward : 0), 0)} XP earned</Pill></section><div className="mt-8 grid gap-3">{quests.map((quest) => <div key={quest.id} className="border border-line bg-paper p-5 sm:flex sm:items-center sm:gap-5"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${quest.completed ? "bg-[#3E8E65]/10 text-[#3E8E65]" : "bg-paper-strong text-muted"}`}>{quest.completed ? <Check size={19} /> : <Circle size={19} />}</span><div className="mt-4 min-w-0 flex-1 sm:mt-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-black">{quest.title}</h2>{quest.completed && <Pill tone="mint">Complete</Pill>}</div><p className="mt-1 text-xs leading-5 text-muted">{quest.description}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-paper-strong"><div className="h-full rounded-full bg-coral transition-all" style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }} /></div><p className="mt-2 text-[11px] font-bold text-muted">{quest.progress} / {quest.target}</p></div><div className="mt-4 flex items-center justify-between gap-4 sm:mt-0 sm:block sm:text-right"><span className="text-sm font-black text-coral">+{quest.xpReward} XP</span>{!quest.completed && <Link href={quest.type === "VOTE_BRAWLS" ? "/brawls" : quest.type === "DAILY_PICKS" ? "/picks" : "/discover"} className="ml-3 inline-flex items-center gap-1 text-xs font-bold text-ink underline decoration-coral decoration-2 underline-offset-4">Continue <ArrowUpRight size={13} /></Link>}</div></div>)}{!quests.length && <p className="border border-dashed border-line p-10 text-center text-sm text-muted">Quest templates will appear after the platform is initialized.</p>}</div></PageContainer>;
}
