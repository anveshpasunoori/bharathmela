"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/ActionForm";
import { aiConfigured, draftListing, type ListingDraft } from "@/lib/ai";
import { requireVendor } from "@/lib/auth";
import { getVendorPlan } from "@/lib/billing";
import { CATEGORIES, PAYMENT_METHODS, normalizeTags, serializeTags } from "@/lib/constants";
import { db } from "@/lib/db";
import { CATEGORY_RULES, REVIEW_FIRST_LISTING } from "@/lib/legal";
import { parseEventServiceForm } from "@/lib/event-services";
import { LANGUAGES, isProfessional, parseProfessionalForm } from "@/lib/professionals";
import { parseRentalForm } from "@/lib/rentals";
import { screenListing } from "@/lib/moderation";
import { TOO_MANY, hit } from "@/lib/rate-limit";
import { AI_DAILY_LIMIT, AI_WRITER_PLANS, PLANS, boostOption, isPaidPlan } from "@/lib/plans";

function field(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

async function parsePayment(form: FormData, vendorId: string) {
  const method = field(form, "method");
  const reference = field(form, "reference").slice(0, 100);
  if (!PAYMENT_METHODS.some((m) => m.id === method)) return { error: "Choose how you paid." } as const;
  if (reference.length < 4) return { error: "Enter the transaction ID or confirmation number from your payment." } as const;
  if (!hit("payment", vendorId)) return { error: TOO_MANY } as const;
  // A reference that was already used is either a mistake or an attempt to reuse one payment.
  const reused = await db.payment.findFirst({
    where: { reference: { equals: reference }, status: { in: ["PENDING", "APPROVED"] } },
  });
  if (reused) return { error: "That transaction ID has already been submitted. Check it and try again." } as const;
  return { method, reference } as const;
}

async function ownListing(vendorId: string, listingId: string) {
  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.vendorId !== vendorId) throw new Error("Listing not found");
  return listing;
}

// Listings waiting for review count toward the plan limit, so the queue can't be flooded.
async function hasRoomForListing(vendorId: string, excludeId?: string) {
  const { plan } = await getVendorPlan(vendorId);
  const used = await db.listing.count({
    where: { vendorId, status: { in: ["ACTIVE", "PENDING_REVIEW"] }, ...(excludeId ? { id: { not: excludeId } } : {}) },
  });
  return { ok: used < plan.maxListings, plan };
}

type ListingInput = {
  title: string;
  description: string;
  category: string;
  priceCents: number | null;
  priceUnit: string;
  tags: string;
  details: string;
};

function parseListing(form: FormData): ListingInput | { error: string } {
  const title = field(form, "title");
  const description = field(form, "description");
  const category = field(form, "category");
  const price = field(form, "price").replace(/^\$/, "");
  const priceUnit = field(form, "priceUnit").slice(0, 40);

  if (title.length < 5 || title.length > 100) return { error: "Title should be 5 to 100 characters." };
  if (description.length < 20 || description.length > 2000) return { error: "Description should be 20 to 2,000 characters." };
  if (!CATEGORIES.some((c) => c.id === category)) return { error: "Choose a category." };
  if (title === title.toUpperCase() && /[A-Z]{6}/.test(title)) return { error: "Please don't write the title in all capital letters." };
  let priceCents: number | null = null;
  if (price) {
    const n = Number(price);
    if (!Number.isFinite(n) || n < 0 || n > 100_000) return { error: "Price must be a number between 0 and 100,000, like 12.50." };
    priceCents = Math.round(n * 100);
  }
  if (form.get("confirm") !== "on") return { error: "Please confirm the listing follows the rules and Terms." };
  // Dietary markers only apply to food.
  const tags = category === "FOOD" ? serializeTags(normalizeTags(form.getAll("tags").map(String))) : "";
  if (category === "ROOM_RENTAL") {
    const rental = parseRentalForm(form);
    if ("error" in rental) return rental;
    if (priceCents == null || priceCents < 5000) return { error: "Enter the monthly rent." };
    return { title, description, category, priceCents, priceUnit: "per month", tags, details: JSON.stringify(rental) };
  }
  if (category === "EVENT_SERVICES") {
    const services = parseEventServiceForm(form, LANGUAGES);
    if ("error" in services) return services;
    return { title, description, category, priceCents, priceUnit, tags, details: JSON.stringify(services) };
  }
  if (isProfessional(category)) {
    const pro = parseProfessionalForm(form, category);
    if ("error" in pro) return pro;
    return { title, description, category, priceCents, priceUnit, tags, details: JSON.stringify(pro) };
  }
  return { title, description, category, priceCents, priceUnit, tags, details: "{}" };
}

// Decides whether a listing can go live right away or must wait for an admin.
async function moderate(input: ListingInput, vendorId: string) {
  const extra = JSON.parse(input.details);
  const neighborhood = [extra.neighborhood, extra.firm, extra.areasServed].filter(Boolean).join("\n");
  const screening = screenListing(`${input.title}\n${input.description}\n${input.priceUnit}\n${neighborhood}`, input.category);
  if (screening.block) return { error: screening.block } as const;
  const reasons = [...screening.flags];
  if (CATEGORY_RULES[input.category]?.requiresReview) reasons.push("category is reviewed before publishing");
  if (REVIEW_FIRST_LISTING) {
    const approvedBefore = await db.listing.count({ where: { vendorId, status: { in: ["ACTIVE", "HIDDEN"] } } });
    if (!approvedBefore) reasons.push("seller's first listing");
  }
  return reasons.length
    ? ({ status: "PENDING_REVIEW", moderationNote: reasons.join("; ") } as const)
    : ({ status: "ACTIVE", moderationNote: "" } as const);
}

export async function createListing(_: FormState, form: FormData): Promise<FormState> {
  const { vendor } = await requireVendor();
  const input = parseListing(form);
  if ("error" in input) return input;
  if (!hit("listing", vendor.id)) return { error: TOO_MANY };

  const { ok, plan } = await hasRoomForListing(vendor.id);
  if (!ok) {
    return { error: `Your ${plan.name} plan allows ${plan.maxListings} active listing(s). Upgrade your plan or hide a listing first.` };
  }
  const decision = await moderate(input, vendor.id);
  if ("error" in decision) return decision;

  await db.listing.create({ data: { vendorId: vendor.id, ...input, ...decision, metro: vendor.metro, zip: vendor.zip } });
  revalidatePath("/vendor");
  redirect(`/vendor?${decision.status === "PENDING_REVIEW" ? "review=1" : "published=1"}`);
}

export async function updateListing(_: FormState, form: FormData): Promise<FormState> {
  const { vendor } = await requireVendor();
  const listing = await ownListing(vendor.id, field(form, "listingId"));
  if (listing.status === "REMOVED") return { error: "This listing was removed by DesiBazaar and can't be edited." };
  const input = parseListing(form);
  if ("error" in input) return input;
  if (!hit("listing", vendor.id)) return { error: TOO_MANY };

  const decision = await moderate(input, vendor.id);
  if ("error" in decision) return decision;
  // A clean edit keeps a hidden listing hidden; a rejected one goes back for review.
  const status =
    decision.status === "PENDING_REVIEW" || listing.status === "REJECTED" || listing.status === "PENDING_REVIEW"
      ? "PENDING_REVIEW"
      : listing.status;
  if (status === "PENDING_REVIEW" && listing.status !== "PENDING_REVIEW" && listing.status !== "REJECTED") {
    const { ok } = await hasRoomForListing(vendor.id, listing.id);
    if (!ok) return { error: "You're at your plan's listing limit. Hide another listing first." };
  }
  await db.listing.update({
    where: { id: listing.id },
    data: { ...input, status, moderationNote: status === "PENDING_REVIEW" ? decision.moderationNote || "edited after rejection" : "" },
  });
  revalidatePath("/vendor");
  revalidatePath(`/listing/${listing.id}`);
  redirect(`/vendor?${status === "PENDING_REVIEW" ? "review=1" : "updated=1"}`);
}

export async function writeAdWithAI(
  idea: string,
  category: string,
): Promise<{ draft?: ListingDraft; error?: string }> {
  const { vendor } = await requireVendor();
  const { plan } = await getVendorPlan(vendor.id);
  if (!AI_WRITER_PLANS.includes(plan.id)) return { error: "The AI ad writer is included with the Pro plan." };
  if (!aiConfigured()) return { error: "The AI ad writer isn't set up yet. Please try again later." };
  idea = idea.trim().slice(0, 2000);
  if (idea.length < 15) return { error: "Tell us a bit more about what you offer (at least a sentence)." };
  if (!CATEGORIES.some((c) => c.id === category)) return { error: "Choose a category first." };

  const since = new Date(Date.now() - 86_400_000);
  if ((await db.aiDraft.count({ where: { vendorId: vendor.id, createdAt: { gt: since } } })) >= AI_DAILY_LIMIT) {
    return { error: `You've used the AI ad writer ${AI_DAILY_LIMIT} times today. Try again tomorrow.` };
  }
  await db.aiDraft.create({ data: { vendorId: vendor.id } });
  try {
    return { draft: await draftListing(idea, category, vendor.metro) };
  } catch (e) {
    console.error("AI ad writer failed", e);
    return { error: "The AI ad writer couldn't write this one. Try again or rephrase your idea." };
  }
}

export async function setListingVisibility(listingId: string, visible: boolean) {
  const { vendor } = await requireVendor();
  const listing = await ownListing(vendor.id, listingId);
  // Sellers can only switch between live and hidden; review and removal states belong to admins.
  if (listing.status !== "ACTIVE" && listing.status !== "HIDDEN") return;
  if (visible) {
    const { ok } = await hasRoomForListing(vendor.id);
    if (!ok) redirect("/vendor?error=limit");
  }
  await db.listing.update({ where: { id: listingId }, data: { status: visible ? "ACTIVE" : "HIDDEN" } });
  revalidatePath("/vendor");
}

export async function deleteListing(listingId: string) {
  const { vendor } = await requireVendor();
  await ownListing(vendor.id, listingId);
  await db.listing.delete({ where: { id: listingId } });
  revalidatePath("/vendor");
}

export async function requestPlan(_: FormState, form: FormData): Promise<FormState> {
  const { vendor } = await requireVendor();
  const planId = field(form, "plan");
  if (!isPaidPlan(planId)) return { error: "Choose a paid plan." };
  const payment = await parsePayment(form, vendor.id);
  if ("error" in payment) return payment;

  const pending = await db.payment.count({ where: { vendorId: vendor.id, purpose: "SUBSCRIPTION", status: "PENDING" } });
  if (pending) return { error: "You already have a plan payment waiting for review." };

  await db.subscription.create({
    data: {
      vendorId: vendor.id,
      plan: planId,
      payment: {
        create: {
          vendorId: vendor.id,
          purpose: "SUBSCRIPTION",
          amountCents: PLANS[planId].priceCents,
          method: payment.method,
          reference: payment.reference,
        },
      },
    },
  });
  revalidatePath("/vendor");
  redirect("/vendor?submitted=1");
}

export async function requestBoost(_: FormState, form: FormData): Promise<FormState> {
  const { vendor } = await requireVendor();
  const listing = await ownListing(vendor.id, field(form, "listingId"));
  const option = boostOption(Number(field(form, "days")));
  if (!option) return { error: "Choose how long to feature this listing." };
  if (listing.status !== "ACTIVE") return { error: "Make the listing visible before boosting it." };
  const payment = await parsePayment(form, vendor.id);
  if ("error" in payment) return payment;

  await db.adBoost.create({
    data: {
      listingId: listing.id,
      days: option.days,
      payment: {
        create: {
          vendorId: vendor.id,
          purpose: "AD_BOOST",
          amountCents: option.priceCents,
          method: payment.method,
          reference: payment.reference,
        },
      },
    },
  });
  revalidatePath("/vendor");
  redirect("/vendor?submitted=1");
}

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const { vendor } = await requireVendor();
  const businessName = field(form, "businessName").slice(0, 100);
  const phone = field(form, "phone");
  const about = field(form, "about").slice(0, 1000);
  if (businessName.length < 2) return { error: "Enter your business name." };
  if (phone.replace(/\D/g, "").length < 10) return { error: "Enter a 10-digit US phone number." };
  const screening = screenListing(`${businessName}\n${about}`, "GOODS");
  if (screening.block) return { error: screening.block };
  if (/https?:\/\/|www\./i.test(about)) return { error: "Links aren't allowed in your profile." };
  await db.vendorProfile.update({
    where: { id: vendor.id },
    data: { businessName, phone, about, whatsapp: form.get("whatsapp") === "on" },
  });
  revalidatePath(`/seller/${vendor.id}`);
  return { message: "Profile saved." };
}
