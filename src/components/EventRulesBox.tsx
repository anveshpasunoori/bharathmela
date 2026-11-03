import Link from "next/link";
import { EVENT_RULES } from "@/lib/legal";

export function EventRulesBox() {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <p className="font-semibold">Rules for events</p>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {EVENT_RULES.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  );
}

export function EventConfirm() {
  return (
    <label className="flex gap-2 text-sm text-stone-700">
      <input type="checkbox" name="confirm" required className="mt-0.5" />
      <span>
        I&apos;m the organizer or authorized to post this event, the details are accurate, and it follows the rules above and the{" "}
        <Link href="/terms" target="_blank" className="text-brand underline">Terms of Service</Link>.
      </span>
    </label>
  );
}
