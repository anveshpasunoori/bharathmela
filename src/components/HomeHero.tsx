import Image from "next/image";

export function HeroArt() {
  return (
    <div aria-hidden="true" className="market-hero-art">
      <Image src="/home/FOOD.webp" alt="" width={172} height={172} unoptimized className="market-hero-photo market-hero-photo-food" />
      <Image src="/home/CLOTHING.webp" alt="" width={172} height={172} unoptimized className="market-hero-photo market-hero-photo-clothing" />
      <Image src="/home/DANCE_MUSIC.webp" alt="" width={172} height={172} unoptimized className="market-hero-photo market-hero-photo-dance" />
    </div>
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
