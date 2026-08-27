import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findCategoryBySlug, getProductsForCategory } from "@/lib/repositories/catalog";
import { PageContainer } from "@/components/layout/PageContainer";
import { DirectoryHeader } from "@/components/discovery/DirectoryHeader";
import { ProductGrid } from "@/components/products/ProductGrid";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const category = await findCategoryBySlug(slug); return { title: category?.name ?? "Category" }; }

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const category = await findCategoryBySlug(slug); if (!category) notFound(); const categoryProducts = await getProductsForCategory(slug); return <PageContainer><DirectoryHeader title={category.name} description={category.description} /><div className="mt-4"><ProductGrid products={categoryProducts} /></div></PageContainer>; }
