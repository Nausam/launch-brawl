import { cache } from "react";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { listUserProductReactions } from "@/lib/repositories/engagement";

export const getCurrentUserReactions = cache(async () => {
  const empty = { votedProductIds: new Set<string>(), savedProductIds: new Set<string>() };
  try {
    const user = await getCurrentAppUser();
    if (!user) return empty;
    return listUserProductReactions(user.id);
  } catch {
    return empty;
  }
});
