// A small "⋯" menu for less-used row actions (hide, delete) so rows stay to one line of buttons.
export function MoreMenu({ children }: { children: React.ReactNode }) {
  return (
    <details className="relative">
      <summary className="btn-outline cursor-pointer list-none px-3 py-1.5" aria-label="More actions">⋯</summary>
      <div className="absolute right-0 z-10 mt-1 w-36 space-y-1 rounded-lg border border-stone-200 bg-white p-1 shadow-lg [&_button]:w-full [&_button]:justify-start [&_button]:border-0 [&_button]:text-left">
        {children}
      </div>
    </details>
  );
}
