import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { categoryLabel } from "./constants";
import { CATEGORY_RULES } from "./legal";
import { metroName } from "./metros";

const ListingDraft = z.object({
  title: z.string().describe("Catchy, specific title, at most 80 characters"),
  description: z.string().describe("Listing body, 60-180 words, plain text with short paragraphs or simple dashes"),
  price_usd: z.number().nullable().describe("Price in USD if the seller mentioned one, otherwise null"),
  price_unit: z.string().describe('e.g. "per plate", "per hour", "per month"; empty if no price'),
});

export type ListingDraft = z.infer<typeof ListingDraft>;

const SYSTEM = `You write classified listings for DesiBazaar, a marketplace where Indian home businesses in US cities advertise to their local community.
Turn the seller's rough idea into a clear, warm, honest listing. Keep every fact the seller gave; never invent credentials, certifications, reviews, prices, addresses or guarantees. If useful details are missing (pickup area, schedule, how to order), write the listing without them rather than making them up.
Write in simple American English. Indian terms (tiffin, thali, arangetram, griha pravesh) are fine.
Never mention or prefer any race, religion, caste, national origin, sex, disability or family status of the customer or tenant, even if the seller's idea does; describe the offering instead.`;

let client: Anthropic | undefined;

export function aiConfigured() {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export async function draftListing(idea: string, category: string, metro: string): Promise<ListingDraft> {
  client ??= new Anthropic();
  const rules = CATEGORY_RULES[category]?.seller ?? [];
  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(ListingDraft) },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content:
          `Category: ${categoryLabel(category)}\nCity: ${metroName(metro)}\n` +
          (rules.length ? `Posting rules for this category:\n- ${rules.join("\n- ")}\n` : "") +
          `\nSeller's idea:\n${idea}`,
      },
    ],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error("The ad writer couldn't write this listing. Try describing it differently.");
  }
  return response.parsed_output;
}
