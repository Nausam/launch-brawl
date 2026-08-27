import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/products/ProductCard";

export async function ProductGrid({ products, sponsoredFirst = false }: { products: Product[]; sponsoredFirst?: boolean }) {
  if (!products.length) {
    return (
      <div className="rounded-[24px] rounded-br-[10px] border-2 border-dashed border-line bg-paper px-5 py-12 text-center">
        <div className="eyebrow text-coral">No signal yet</div>
        <p className="mt-3 text-lg font-bold text-ink">No launches match this view yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} sponsored={sponsoredFirst && index === 0} />
      ))}
    </div>
  );
}
