import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { requireVendor } from "@/lib/auth";
import { CityZipFields } from "@/components/CityZipFields";
import { metroName } from "@/lib/metros";
import { lookupSellerZip } from "../../actions/location";
import { updateProfile } from "../../actions/vendor";

export default async function VendorProfilePage() {
  const { vendor } = await requireVendor();
  // Their current city area, as saved (older sellers picked it from a list, so it can differ from the ZIP's).
  const zipInfo = await lookupSellerZip(vendor.zip);
  const found = zipInfo && { ...zipInfo, area: metroName(vendor.metro) };
  // Sellers who joined before the city box existed: start from their ZIP's town.
  const city = (vendor.city || zipInfo?.city || "").replace(/,\s*[A-Z]{2}$/, "");
  return (
    <div className="mx-auto max-w-lg">
      <Link href="/vendor" className="text-sm text-stone-500 hover:text-brand">← Dashboard</Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold">Business profile</h1>
      <p className="mb-4 text-stone-600">Shown on your public seller page and every listing.</p>
      <div className="card">
        <ActionForm action={updateProfile} submitLabel="Save profile">
          <div>
            <label className="label" htmlFor="businessName">Business name</label>
            <input className="input" id="businessName" name="businessName" required maxLength={100} defaultValue={vendor.businessName} />
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone (shown to buyers)</label>
            <input className="input" id="phone" name="phone" type="tel" required defaultValue={vendor.phone} />
            <label className="mt-2 flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" name="whatsapp" defaultChecked={vendor.whatsapp} /> Buyers can also message me on WhatsApp at this number
            </label>
          </div>
          <div>
            <label className="label" htmlFor="about">About your business</label>
            <textarea className="input min-h-28" id="about" name="about" maxLength={1000} defaultValue={vendor.about}
              placeholder="Who you are, what you specialize in, languages you speak, areas you serve…" />
          </div>
          <CityZipFields initialZip={vendor.zip} initialCity={city} initialFound={found} />
        </ActionForm>
      </div>
    </div>
  );
}
