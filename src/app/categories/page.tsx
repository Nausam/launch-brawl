import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getProductsForCategory, listCategories } from "@/lib/repositories/catalog";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

export default async function CategoriesPage() { const categories = await listCategories(); const counts = await Promise.all(categories.map(async (category) => [category.id, (await getProductsForCategory(category.slug)).length] as const)); const countById = new Map(counts); return <PageContainer><SectionHeading eyebrow="Find your corner" title="Browse categories" description="From AI experiments to open-source infrastructure, find the work that makes you curious." /><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{categories.map((category) => <Link key={category.id} href={`/category/${category.slug}`} className="group border border-line bg-paper p-6 transition hover:-translate-y-1 hover:border-ink/25 hover:shadow-[6px_6px_0_#dfe0db]"><div className="flex items-start justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl text-white" style={{ backgroundColor: category.accent }}>{category.icon}</span><ArrowUpRight size={17} className="text-muted transition group-hover:text-coral" /></div><h2 className="display mt-7 text-2xl font-black">{category.name}</h2><p className="mt-2 text-sm leading-6 text-muted">{category.description}</p><div className="mt-6 border-t border-line pt-4 text-xs font-bold text-muted">{countById.get(category.id) ?? 0} launches to explore</div></Link>)}</div>{!categories.length && <div className="mt-10"><p className="border border-dashed border-line p-10 text-center text-sm text-muted">Categories will appear after the platform is initialized.</p></div>}</PageContainer>; }
