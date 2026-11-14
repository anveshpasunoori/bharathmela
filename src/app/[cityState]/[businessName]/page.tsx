import { cache } from "react";
import { notFound } from "next/navigation";
import { getPublicSeller, SellerProfile, sellerMetadata } from "@/components/SellerProfile";

type Params = { cityState: string; businessName: string };
const findSeller = cache((cityState: string, businessName: string) =>
  getPublicSeller({ publicPath: `/${cityState}/${businessName}` }),
);

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { cityState, businessName } = await params;
  return sellerMetadata(await findSeller(cityState, businessName));
}

export default async function BusinessPage({ params }: { params: Promise<Params> }) {
  const { cityState, businessName } = await params;
  const seller = await findSeller(cityState, businessName);
  if (!seller) notFound();
  return <SellerProfile seller={seller} />;
}
