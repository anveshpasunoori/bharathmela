// Filters tucked behind one "Filters" button; opens by itself when any filter is in use.
export function FilterPanel({ active, children }: { active: number; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl bg-white ring-1 ring-stone-200" open={active > 0}>
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-sm font-semibold">
        <span>
          ⚙ Filters{active > 0 && <span className="badge ml-2 bg-brand text-white">{active}</span>}
        </span>
        <span className="text-stone-400 group-open:rotate-180">▾</span>
      </summary>
      <div className="border-t border-stone-100 p-4">{children}</div>
    </details>
  );
}
