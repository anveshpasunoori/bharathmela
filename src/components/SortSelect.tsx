"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function SortSelect({ options, value }: { options: readonly { id: string; label: string }[]; value: string }) {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-stone-500">Sort</span>
      <select
        className="input w-auto py-1.5"
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value === "best") next.delete("sort");
          else next.set("sort", e.target.value);
          router.push(`?${next}`);
        }}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
