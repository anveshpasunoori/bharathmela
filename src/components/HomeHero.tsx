import Image from "next/image";

export function HeroArt() {
  return (
    <div aria-hidden="true" className="hidden w-[30%] shrink-0 grid-cols-2 grid-rows-2 gap-2 self-stretch overflow-hidden rounded-2xl lg:grid">
      <div className="relative col-span-2 overflow-hidden rounded-xl">
        <Image src="/home/categories/DANCE_MUSIC.webp" alt="" fill sizes="300px" className="object-cover object-[center_36%]" />
      </div>
      <div className="relative overflow-hidden rounded-xl">
        <Image src="/home/categories/FOOD.webp" alt="" fill sizes="150px" className="object-cover" />
      </div>
      <div className="relative overflow-hidden rounded-xl">
        <Image src="/home/categories/CLOTHING.webp" alt="" fill sizes="150px" className="object-cover" />
      </div>
    </div>
  );
}

// Three short promises under the search box (passed in, already in the visitor's language).
export function TrustStrip({ items }: { items: [string, string, string] }) {
  const icons = ["✓", "★", "$"];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 border-t border-stone-200 pt-3 text-xs text-stone-600">
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
