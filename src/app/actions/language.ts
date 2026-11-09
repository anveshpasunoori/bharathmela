"use server";

import { cookies } from "next/headers";
import { LANG_COOKIE, isLang } from "@/lib/i18n";

export async function setLanguage(lang: string) {
  if (!isLang(lang)) return;
  (await cookies()).set(LANG_COOKIE, lang, { path: "/", maxAge: 365 * 24 * 60 * 60, sameSite: "lax" });
}
