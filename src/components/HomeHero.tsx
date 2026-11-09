// Decoration and reassurance for the home page's top panel.

// A rangoli-style flower drawn in the brand colors, peeking in from the panel's right edge.
export function HeroArt() {
  const petals = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg aria-hidden viewBox="0 0 200 200" className="pointer-events-none absolute -right-16 -top-16 -z-10 h-64 w-64 opacity-35 sm:-right-10 sm:-top-20 sm:h-80 sm:w-80 sm:opacity-60 dark:opacity-25">
      <g transform="translate(100 100)">
        {petals.map((a) => (
          <ellipse key={`o${a}`} cx="0" cy="-62" rx="14" ry="30" transform={`rotate(${a})`} fill="#fed7aa" />
        ))}
        {petals.map((a) => (
          <ellipse key={`m${a}`} cx="0" cy="-40" rx="10" ry="20" transform={`rotate(${a + 15})`} fill="#fdba74" />
        ))}
        {petals.map((a) => (
          <circle key={`d${a}`} cx="0" cy="-88" r="4" transform={`rotate(${a + 15})`} fill="#fb923c" />
        ))}
        <circle r="22" fill="#f97316" />
        <circle r="12" fill="#fcd34d" />
      </g>
    </svg>
  );
}

// Three short promises under the search box (passed in, already in the visitor's language).
export function TrustStrip({ items }: { items: [string, string, string] }) {
  const icons = ["✓", "★", "$"];
  return (
    <ul className="relative flex flex-wrap gap-x-5 gap-y-1.5 pt-1 text-sm text-stone-600">
      {items.map((text, i) => (
        <li key={text} className="flex items-center gap-1.5">
          <span aria-hidden className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-bold text-brand ring-1 ring-orange-200">
            {icons[i]}
          </span>
          {text}
        </li>
      ))}
    </ul>
  );
}
