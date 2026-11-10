"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { requireAdmin, requireVendor } from "@/lib/auth";
import { creatorTags, parseFollowers, platformLabel, readCreator, withVerification } from "@/lib/creators";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { hit } from "@/lib/rate-limit";
import { absoluteUrl, listingPath } from "@/lib/seo";

// The creator says the code is in their bio: it goes to the admin queue.
export async function submitHandleCheck(checkId: string) {
  const { vendor } = await requireVendor();
  const check = await db.creatorCheck.findFirst({ where: { id: checkId, listing: { vendorId: vendor.id } }, include: { listing: { select: { title: true } } } });
  if (!check || check.status === "VERIFIED" || check.status === "SUBMITTED") return;
  if (!(await hit("contact", `creator-check:${vendor.id}`))) return;
  await db.creatorCheck.update({ where: { id: check.id }, data: { status: "SUBMITTED", submittedAt: new Date(), reviewNote: "" } });
  const to = process.env.ALERT_EMAIL || process.env.SUPPORT_EMAIL;
  if (to) {
    await sendEmail(to, `Creator handle to check: @${check.handle}`, `${vendor.businessName} added code ${check.code} to their ${platformLabel(check.platform)} bio (@${check.handle}).\n\nCheck it: ${absoluteUrl("/admin")}`);
  }
  revalidatePath("/vendor/verify-handles");
}

// An admin looked at the live profile: verify (with the follower count they saw) or reject with a reason.
export async function reviewHandleCheck(checkId: string, approve: boolean, form: FormData) {
  const admin = await requireAdmin();
  const check = await db.creatorCheck.findUnique({
    where: { id: checkId },
    include: { listing: { select: { id: true, title: true, details: true, vendor: { select: { businessName: true, user: { select: { email: true, name: true } } } } } } },
  });
  if (!check || check.status !== "SUBMITTED") return;
  const creator = readCreator(check.listing.details);
  const platform = creator?.platforms.find((p) => p.platform === check.platform && p.handle.toLowerCase() === check.handle.toLowerCase());
  const note = String(form.get("note") ?? "").trim().slice(0, 300);
  const now = new Date();
  if (approve && creator && platform) {
    const seen = parseFollowers(String(form.get("followers") ?? ""));
    const followers = Number.isFinite(seen) && seen > 0 ? seen : platform.followers;
    const updated = withVerification(creator, check.platform, { at: now, followers });
    await db.$transaction([
      db.listing.update({ where: { id: check.listing.id }, data: { details: JSON.stringify(updated), tags: creatorTags(updated) } }),
      db.creatorCheck.update({ where: { id: check.id }, data: { status: "VERIFIED", reviewedAt: now, reviewNote: note } }),
    ]);
    await audit(admin.id, "creator.verify", "listing", check.listing.id, `${check.platform} @${check.handle}, ${followers} followers`);
  } else {
    await db.creatorCheck.update({
      where: { id: check.id },
      data: { status: "REJECTED", reviewedAt: now, reviewNote: note || "We couldn't find the code in that profile's bio." },
    });
    await audit(admin.id, "creator.reject", "listing", check.listing.id, `${check.platform} @${check.handle}: ${note}`);
  }
  const who = check.listing.vendor.user;
  const verified = approve && !!platform;
  await sendEmail(
    who.email,
    verified ? `Your ${platformLabel(check.platform)} handle is verified` : `We couldn't verify your ${platformLabel(check.platform)} handle`,
    verified
      ? `Hi ${who.name.split(" ")[0]},\n\n@${check.handle} on ${platformLabel(check.platform)} is now verified on BharathMela, so businesses see a ✓ Verified badge on your creator profile. You can remove ${check.code} from your bio.\n\n${absoluteUrl(listingPath(check.listing))}\n\n– BharathMela`
      : `Hi ${who.name.split(" ")[0]},\n\nWe couldn't verify @${check.handle} on ${platformLabel(check.platform)}: ${note || "we couldn't find the code in that profile's bio"}.\n\nAdd ${check.code} to your bio and submit again: ${absoluteUrl("/vendor/verify-handles")}\n\n– BharathMela`,
  );
  revalidatePath("/admin");
  revalidatePath("/listing/[id]", "page");
}
