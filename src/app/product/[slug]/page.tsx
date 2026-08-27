import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findProductBySlug, listPublishedProducts } from "@/lib/repositories/catalog";
import { ProductDetail } from "@/components/products/ProductDetail";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await findProductBySlug(slug);
  return {
    title: product?.name ?? "Product",
    description: product?.shortDescription,
    alternates: product ? { canonical: `/product/${product.slug}` } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await findProductBySlug(slug);
  if (!product) notFound();
  const products = await listPublishedProducts();
  const categoryMatches = products.filter((item) => item.categoryId === product.categoryId && item.id !== product.id);
  const related = (categoryMatches.length >= 3 ? categoryMatches : products.filter((item) => item.id !== product.id)).slice(0, 3);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: product.name,
    description: product.shortDescription,
    url: product.websiteUrl,
    image: product.coverImageUrl || product.logoUrl,
    applicationCategory: product.categoryId,
    offers: { "@type": "Offer", price: product.pricingType === "Free" ? "0" : undefined, priceCurrency: "USD" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductDetail product={product} related={related} />
    </>
  );
}
