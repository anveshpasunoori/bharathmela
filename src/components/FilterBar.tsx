"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// A row of filter buttons, each opening a small panel (a sheet from the bottom on phones). The page
// describes the filters and their current values; changes are written to the URL.
type Changes = Record<string, string | null>;

export type FilterDef =
  // Pick one; applies straight away. `params` says what each option sets (null removes a param).
  | { kind: "choice"; key: string; label: string; options: { label: string; params: Changes }[]; selected: number | null; defaultIndex?: number }
  // Pick several, stored comma-separated in one param.
  | { kind: "multi"; key: string; param: string; label: string; options: readonly { id: string; label: string }[]; selected: string[] }
  // A dollar amount, by default an upper limit ("Up to $1,500"); `prefix` and `fieldLabel` reword it.
  | { kind: "max"; key: string; param: string; label: string; value: number | null; presets: number[]; suffix?: string; prefix?: string; fieldLabel?: string; hint?: string }
  | { kind: "date"; key: string; param: string; label: string; prefix: string; value: string | null }
  // Several yes/no filters grouped under one button.
  | { kind: "checks"; key: string; label: string; items: { param: string; label: string; checked: boolean }[] }
  // One yes/no filter as its own button.
  | { kind: "toggle"; key: string; param: string; label: string; on: boolean };

const isActive = (f: FilterDef) => {
  switch (f.kind) {
    case "choice": return f.selected != null && f.selected !== f.defaultIndex;
    case "multi": return f.selected.length > 0;
    case "max": return f.value != null;
    case "date": return !!f.value;
    case "checks": return f.items.some((i) => i.checked);
    case "toggle": return f.on;
  }
};

const shortDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function buttonText(f: FilterDef) {
  switch (f.kind) {
    case "choice": return f.selected != null ? f.options[f.selected].label : f.label;
    case "multi": {
      const first = f.options.find((o) => o.id === f.selected[0])?.label;
      return first ? `${first}${f.selected.length > 1 ? ` +${f.selected.length - 1}` : ""}` : f.label;
    }
    case "max": return f.value != null ? `${f.prefix ?? "Up to"} $${f.value.toLocaleString()}` : f.label;
    case "date": return f.value ? `${f.prefix} ${shortDate(f.value)}` : f.label;
    case "checks": {
      const n = f.items.filter((i) => i.checked).length;
      return n ? `${f.label} · ${n}` : f.label;
    }
    case "toggle": return f.label;
  }
}

const pill = (active: boolean) =>
  `inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
    active ? "border-brand bg-brand-soft text-brand" : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
  }`;

export function FilterBar({ filters, clearHref }: { filters: FilterDef[]; clearHref?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openKey) return;
    const onDown = (e: PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpenKey(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenKey(null);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openKey]);

  function apply(changes: Changes) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.delete("from");
    setOpenKey(null);
    router.push(`${pathname}?${next}`, { scroll: false });
  }

  const anyActive = filters.some(isActive);

  return (
    <div ref={barRef} className="scrollbar-none -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
      {filters.map((f) => {
        const active = isActive(f);
        if (f.kind === "toggle") {
          return (
            <button key={f.key} type="button" aria-pressed={f.on} className={pill(active)} onClick={() => apply({ [f.param]: f.on ? null : "1" })}>
              {f.on && <span aria-hidden>✓</span>}
              {f.label}
            </button>
          );
        }
        const open = openKey === f.key;
        return (
          <div key={f.key} className="md:relative">
            <button
              type="button"
              aria-expanded={open}
              aria-haspopup="dialog"
              className={`${pill(active)} ${open ? "ring-2 ring-brand/20" : ""}`}
              onClick={() => setOpenKey(open ? null : f.key)}
            >
              {buttonText(f)}
              <span aria-hidden className={`text-xs transition ${open ? "rotate-180" : ""} ${active ? "text-brand" : "text-stone-400"}`}>▾</span>
            </button>
            {open && (
              <>
                {/* Phones: dim the page behind the bottom sheet. */}
                <div className="fixed inset-0 z-40 bg-stone-900/30 md:hidden" onClick={() => setOpenKey(null)} />
                <div
                  role="dialog"
                  aria-label={f.label}
                  className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl md:absolute md:inset-x-auto md:bottom-auto md:left-0 md:top-full md:mt-2 md:max-h-96 md:w-72 md:rounded-xl md:border md:border-stone-200 md:shadow-lg"
                >
                  <p className="mb-3 font-semibold md:hidden">{f.label}</p>
                  <FilterPanelBody filter={f} onApply={apply} />
                </div>
              </>
            )}
          </div>
        );
      })}
      {anyActive && clearHref && (
        <button type="button" className="shrink-0 whitespace-nowrap px-2 text-sm font-medium text-stone-500 underline-offset-2 hover:text-brand hover:underline" onClick={() => router.push(clearHref, { scroll: false })}>
          Clear all
        </button>
      )}
    </div>
  );
}

function Footer({ onClear, onApply }: { onClear: () => void; onApply: () => void }) {
  return (
    <div className="mt-4 flex items-center justify-between gap-2 border-t border-stone-100 pt-3">
      <button type="button" className="text-sm font-medium text-stone-500 hover:text-brand" onClick={onClear}>Clear</button>
      <button type="button" className="btn py-1.5" onClick={onApply}>Apply</button>
    </div>
  );
}

function FilterPanelBody({ filter: f, onApply }: { filter: Exclude<FilterDef, { kind: "toggle" }>; onApply: (c: Changes) => void }) {
  const [multi, setMulti] = useState(f.kind === "multi" ? f.selected : []);
  const [amount, setAmount] = useState(f.kind === "max" && f.value != null ? String(f.value) : "");
  const [date, setDate] = useState(f.kind === "date" ? (f.value ?? "") : "");
  const [checks, setChecks] = useState(f.kind === "checks" ? f.items.map((i) => i.checked) : []);

  if (f.kind === "choice") {
    return (
      <ul className="-mx-1 space-y-0.5" role="listbox" aria-label={f.label}>
        {f.options.map((o, i) => {
          const on = f.selected === i;
          return (
            <li key={o.label}>
              <button
                type="button"
                role="option"
                aria-selected={on}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-stone-100 ${on ? "font-semibold text-brand" : ""}`}
                onClick={() => onApply(o.params)}
              >
                {o.label}
                {on && <span aria-hidden>✓</span>}
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  if (f.kind === "multi") {
    return (
      <>
        <div className="flex flex-wrap gap-2">
          {f.options.map((o) => {
            const on = multi.includes(o.id);
            return (
              <button key={o.id} type="button" aria-pressed={on} className={pill(on)}
                onClick={() => setMulti(on ? multi.filter((x) => x !== o.id) : [...multi, o.id])}>
                {on && <span aria-hidden>✓</span>}
                {o.label}
              </button>
            );
          })}
        </div>
        <Footer onClear={() => onApply({ [f.param]: null })} onApply={() => onApply({ [f.param]: multi.join(",") || null })} />
      </>
    );
  }

  if (f.kind === "max") {
    const submit = () => onApply({ [f.param]: Number(amount) > 0 ? String(Math.round(Number(amount))) : null });
    return (
      <>
        <label className="label" htmlFor={`${f.key}-amount`}>{f.fieldLabel ?? "Maximum"}{f.suffix ? ` ${f.suffix}` : ""}</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">$</span>
          <input id={`${f.key}-amount`} className="input pl-6" inputMode="numeric" placeholder="No max" value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>
        {f.hint && <p className="mt-1 text-xs text-stone-500">{f.hint}</p>}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {f.presets.map((p) => (
            <button key={p} type="button" className={pill(amount === String(p))} onClick={() => setAmount(String(p))}>
              ${p.toLocaleString()}
            </button>
          ))}
        </div>
        <Footer onClear={() => onApply({ [f.param]: null })} onApply={submit} />
      </>
    );
  }

  if (f.kind === "date") {
    return (
      <>
        <label className="label" htmlFor={`${f.key}-date`}>{f.label}</label>
        <input id={`${f.key}-date`} type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        <Footer onClear={() => onApply({ [f.param]: null })} onApply={() => onApply({ [f.param]: date || null })} />
      </>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {f.items.map((item, i) => (
          <label key={item.param} className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-1.5 text-sm hover:bg-stone-50">
            <input type="checkbox" className="h-4 w-4 accent-[#c2410c]" checked={checks[i]}
              onChange={(e) => setChecks(checks.map((c, j) => (j === i ? e.target.checked : c)))} />
            {item.label}
          </label>
        ))}
      </div>
      <Footer
        onClear={() => onApply(Object.fromEntries(f.items.map((item) => [item.param, null])))}
        onApply={() => onApply(Object.fromEntries(f.items.map((item, i) => [item.param, checks[i] ? "1" : null])))}
      />
    </>
  );
}
