import { notFound, permanentRedirect } from "next/navigation";
import { getPublicSeller } from "@/components/SellerProfile";
import { idFromSlugParam } from "@/lib/seo";
import { ensureSellerPath } from "@/lib/seller-urls";

// Both the old ID-only and ID-name URLs permanently redirect to the same profile.
export default async function LegacySellerPage({ params }: { params: Promise<{ id: string }> }) {
  const seller = await getPublicSeller({ id: idFromSlugParam((await params).id) });
  if (!seller) notFound();
  permanentRedirect(seller.publicPath ?? await ensureSellerPath(seller.id));
}
