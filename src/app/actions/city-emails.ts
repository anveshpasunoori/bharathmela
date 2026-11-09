"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/ActionForm";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isMetro } from "@/lib/metros";

// The monthly "new in your city" email: turned on or off, and for which city, from the account page.
export async function updateCityEmails(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/account");
  const on = form.get("cityEmails") === "on";
  const metro = String(form.get("metro") ?? "");
  if (on && !isMetro(metro)) return { error: "Choose your city." };
  await db.user.update({ where: { id: user.id }, data: on ? { cityEmails: true, cityEmailMetro: metro } : { cityEmails: false } });
  revalidatePath("/account");
  return { message: on ? "You'll get an email on the 1st of each month." : "Monthly emails are off." };
}

export async function unsubscribeCityEmails(token: string) {
  await db.user.updateMany({ where: { cityEmailToken: token }, data: { cityEmails: false } });
}
