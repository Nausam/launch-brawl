import type { Product } from "@/lib/types";
import { findActiveCampaignForProduct } from "@/lib/repositories/engagement";
import { ProductBoardCard } from "@/components/products/ProductBoardCard";
import { createCampaignTrackingToken } from "@/lib/server/campaign-attribution";

export async function ProductCard({
  product,
  sponsored = false,
  index = 0,
}: {
  product: Product;
  featured?: boolean;
  sponsored?: boolean;
  index?: number;
}) {
  const campaignId = sponsored ? await findActiveCampaignForProduct(product.id) : undefined;
  const trackingToken = campaignId ? createCampaignTrackingToken({ campaignId, productId: product.id, placement: "sponsored-discovery", page: "product-directory" }) : "";

  return (
    <ProductBoardCard
      product={product}
      index={index}
      sponsored={sponsored}
      impression={campaignId && trackingToken ? { campaignId, trackingToken, placement: "sponsored-discovery", page: "product-directory" } : undefined}
    />
  );
}

export function SponsoredProductCard({ product }: { product: Product }) {
  return <ProductCard product={product} sponsored />;
}
