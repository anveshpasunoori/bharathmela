import Link from "next/link";
import { SITE_NAME, TERMS_VERSION } from "@/lib/legal";

export const metadata = { title: `Terms of Service – ${SITE_NAME}` };

// DRAFT. Placeholders in [brackets] must be filled in and the whole text reviewed by a lawyer before launch.
export default function TermsPage() {
  return (
    <article className="prose-sm mx-auto max-w-3xl space-y-4 text-stone-800 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc">
      <h1 className="text-2xl font-bold">Terms of Service</h1>
      <p className="text-sm text-stone-500">Version {TERMS_VERSION}</p>

      <p>
        These Terms are an agreement between you and [LEGAL ENTITY NAME, e.g. DesiBazaar LLC] (&ldquo;{SITE_NAME}&rdquo;,
        &ldquo;we&rdquo;). By using {SITE_NAME} or posting a listing, you agree to them.
      </p>

      <h2>1. We are a listing platform only</h2>
      <ul>
        <li>{SITE_NAME} lets independent sellers post listings and lets people find them. We do not sell, provide, rent, cook, teach, clean or perform anything listed.</li>
        <li>We are not a party to any agreement, payment, rental, employment or service arrangement between users. Any deal is solely between the buyer and the seller.</li>
        <li>We do not screen, verify, background-check, inspect, license or endorse sellers, their products, services or properties, unless a listing expressly says a specific check was done and by whom.</li>
        <li>Sellers are not employees, agents, contractors or partners of {SITE_NAME}. We do not set their prices, schedules or how they work.</li>
      </ul>

      <h2>2. Seller responsibilities</h2>
      <p>If you post a listing, you promise that:</p>
      <ul>
        <li>Everything in your listing is accurate, and you have the right to offer what you list.</li>
        <li>You hold and follow all licenses, permits, insurance, tax and legal requirements that apply to you, including food permits, child-safety rules, employment and work-authorization laws, and landlord, rental and housing laws.</li>
        <li>Your listing complies with the federal Fair Housing Act and all anti-discrimination laws. You will not state a preference or limit based on race, color, religion, national origin, sex, disability, familial status or any other protected trait.</li>
        <li>You own or have permission to use all text, photos and trademarks in your listing.</li>
      </ul>

      <h2>3. Prohibited listings</h2>
      <p>
        No illegal goods or services, weapons, drugs, alcohol or tobacco sales, counterfeit goods, adult services, discriminatory housing or job ads,
        multi-level marketing, or anything misleading or fraudulent. We may remove any listing or account at any time, for any reason or none.
      </p>

      <h2>4. Fees</h2>
      <p>
        Sellers may pay for plans and featured placements. Fees buy visibility on {SITE_NAME} only; they do not guarantee any sales, leads or results.
        Fees are non-refundable except where required by law or where we remove a listing by mistake. If we remove a listing for breaking these Terms, no refund is due.
      </p>

      <h2>5. Your content</h2>
      <p>
        You keep ownership of your listings. You give {SITE_NAME} a non-exclusive, worldwide, royalty-free license to host, display, reproduce and promote them
        in connection with operating and marketing the service. We may edit, hide or remove content at our discretion.
      </p>

      <h2>6. Reporting and copyright</h2>
      <p>
        Use the &ldquo;Report this listing&rdquo; link on any listing. For copyright complaints, send a notice under the Digital Millennium Copyright Act to our
        designated agent at [DMCA AGENT NAME, ADDRESS, EMAIL].
      </p>

      <h2>7. Disclaimers</h2>
      <p className="uppercase">
        {SITE_NAME} is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, express or implied, including merchantability,
        fitness for a particular purpose and non-infringement. We do not warrant the accuracy of any listing or the conduct, identity, safety or legality of any user.
      </p>

      <h2>8. Limitation of liability</h2>
      <p className="uppercase">
        To the fullest extent permitted by law, {SITE_NAME} and its owners, employees and agents will not be liable for any indirect, incidental, special,
        consequential or punitive damages, or for any loss, injury, illness, property damage or dispute arising from dealings between users. Our total
        liability for any claim is limited to the greater of the fees you paid us in the 12 months before the claim or $100.
      </p>

      <h2>9. Indemnity</h2>
      <p>
        You agree to defend, indemnify and hold harmless {SITE_NAME} and its owners, employees and agents from any claims, damages, losses and expenses
        (including reasonable attorneys&apos; fees) arising from your listings, your dealings with other users, or your breach of these Terms or any law.
      </p>

      <h2>10. Disputes between users</h2>
      <p>
        You release {SITE_NAME} from claims arising from disputes with other users. We may, but are not required to, help resolve them.
      </p>

      <h2>11. Governing law</h2>
      <p>These Terms are governed by the laws of [STATE], without regard to conflict-of-law rules. [Dispute resolution / arbitration clause per counsel.]</p>

      <h2>12. Changes</h2>
      <p>We may update these Terms. If the changes are material, we will ask sellers to accept the new version.</p>

      <p>
        Contact: [LEGAL EMAIL]. See also our <Link href="/privacy" className="text-brand underline">Privacy Policy</Link>.
      </p>
    </article>
  );
}
