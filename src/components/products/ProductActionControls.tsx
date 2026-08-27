import { FavoriteButton, VoteButton, type ActionButtonVariant } from "@/components/products/ProductActions";
import { getCurrentUserReactions } from "@/lib/server/user-reactions";

export async function VoteControl({
  productId,
  initialVotes,
  buttonVariant,
}: {
  productId: string;
  initialVotes: number;
  buttonVariant?: ActionButtonVariant;
}) {
  const reactions = await getCurrentUserReactions();
  return <VoteButton productId={productId} initialVotes={initialVotes} initialVoted={reactions.votedProductIds.has(productId)} buttonVariant={buttonVariant} />;
}

export async function FavoriteControl({
  productId,
  initialFavorites,
  buttonVariant,
}: {
  productId: string;
  initialFavorites: number;
  buttonVariant?: ActionButtonVariant;
}) {
  const reactions = await getCurrentUserReactions();
  return <FavoriteButton productId={productId} initialFavorites={initialFavorites} initialSaved={reactions.savedProductIds.has(productId)} buttonVariant={buttonVariant} />;
}
