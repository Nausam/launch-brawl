import { getNewProducts } from "@/lib/repositories/catalog";
import { PageContainer } from "@/components/layout/PageContainer";
import { DirectoryHeader } from "@/components/discovery/DirectoryHeader";
import { ProductGrid } from "@/components/products/ProductGrid";

export const metadata = { title: "New products" };
export const dynamic = "force-dynamic";

export default async function NewProductsPage() { const products = await getNewProducts(); return <PageContainer><DirectoryHeader active="new" title="Freshly launched" description="The newest approved products on Launch Brawl. Be early, give useful feedback, and watch the momentum build." /><div className="mt-4"><ProductGrid products={products} /></div></PageContainer>; }
