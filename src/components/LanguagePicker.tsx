"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLanguage } from "@/app/actions/language";
import { LANGS, type Lang } from "@/lib/i18n";

// Choose the site's language; the page redraws in it.
export function LanguagePicker({ lang, label }: { lang: Lang; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <label className="inline-flex items-center gap-1 text-sm text-stone-600">
      <span aria-hidden>🌐</span>
      <span className="sr-only">{label}</span>
      <select
        value={lang}
        disabled={pending}
        onChange={(e) => start(async () => {
          await setLanguage(e.target.value);
          router.refresh();
        })}
        className="cursor-pointer rounded-md bg-transparent py-1 pr-1 font-medium text-stone-700 outline-none hover:text-brand"
      >
        {LANGS.map((l) => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>
    </label>
  );
}
