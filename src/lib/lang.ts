import "server-only";
import { cookies } from "next/headers";
import { LANG_COOKIE, type Lang, isLang } from "./i18n";

// The visitor's chosen language (see src/lib/i18n.ts); English until they pick one.
export async function getLang(): Promise<Lang> {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(value) ? value : "en";
}
