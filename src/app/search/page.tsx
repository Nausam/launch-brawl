import { listCategories, searchProducts } from "@/lib/repositories/catalog";
import { PageContainer } from "@/components/layout/PageContainer";
import { SearchExperience } from "@/components/search/SearchExperience";

export const metadata = { title: "Search" };
export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) { const params = await searchParams; const [products, categories] = await Promise.all([searchProducts(params.q ?? ""), listCategories()]); return <PageContainer><div className="max-w-2xl"><div className="eyebrow text-coral">Find the signal</div><h1 className="display mt-4 text-5xl font-black tracking-tight sm:text-7xl">Search the brawl.</h1><p className="mt-5 text-base leading-7 text-muted">Search across products, categories, and maker-built ideas.</p></div><div className="mt-10"><SearchExperience products={products} categories={categories} initialQuery={params.q ?? ""} /></div></PageContainer>; }
