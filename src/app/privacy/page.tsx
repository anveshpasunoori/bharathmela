import { SITE_NAME } from "@/lib/legal";

export const metadata = { title: `Privacy Policy – ${SITE_NAME}` };

// DRAFT. Fill in placeholders and have a lawyer review (CCPA/CalOPPA and other state privacy laws) before launch.
export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-4 text-stone-800 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>

      <h2>What we collect</h2>
      <ul>
        <li>Sellers: name, email, phone, business name, city and ZIP, listings, and payment references you submit.</li>
        <li>Anyone: reports you send us (and your email if you give it). If you tap &ldquo;Use my location&rdquo; or enter a ZIP code, we look up your city on our own server (no outside
          location service) and remember your city, ZIP and approximate area (rounded to about 1 km) in a cookie on your device for up to 6 months,
          so we can show listings near you. We don&apos;t store it in our database. Use &ldquo;forget&rdquo; next to your location to remove it.</li>
        <li>Basic technical data such as a login cookie.</li>
      </ul>

      <h2>What is public</h2>
      <p>Listings, business names, phone numbers, city and ZIP are shown publicly so buyers can contact sellers.</p>

      <h2>How we use it</h2>
      <p>To run the service, confirm payments, handle reports, prevent fraud and meet legal obligations. We do not sell personal information.</p>

      <h2>Your choices</h2>
      <p>You can ask to see, correct or delete your data by emailing [PRIVACY EMAIL]. Deleting your account removes your listings.</p>

      <h2>Contact</h2>
      <p>[LEGAL ENTITY NAME], [ADDRESS], [PRIVACY EMAIL]</p>
    </article>
  );
}
