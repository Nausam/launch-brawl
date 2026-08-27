import { getMostLovedProducts } from "@/lib/repositories/catalog";
import { PageContainer } from "@/components/layout/PageContainer";
import { DirectoryHeader } from "@/components/discovery/DirectoryHeader";
import { ProductGrid } from "@/components/products/ProductGrid";

export const metadata = { title: "Most loved" };
export const dynamic = "force-dynamic";

export default async function MostLovedPage() { const products = await getMostLovedProducts(); return <PageContainer><DirectoryHeader active="loved" title="Most loved" description="The products the community is choosing to keep close. One account, one vote per product." /><div className="mt-4"><ProductGrid products={products} /></div></PageContainer>; }
