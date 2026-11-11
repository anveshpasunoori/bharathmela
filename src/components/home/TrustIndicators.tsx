import { Reveal } from "./Reveal";

// Four plain promises at the bottom of the home page. Each one is something the site actually does.
export function TrustIndicators() {
  const items = [
    {
      title: "Trusted community",
      text: "Verified badge on businesses we've checked",
      icon: <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5zM8.5 12l2.5 2.5 4.5-5" />,
    },
    {
      title: "Real reviews",
      text: "Written by buyers from the community",
      icon: <path d="M12 2.8l2.8 5.8 6.4.8-4.7 4.4 1.2 6.4L12 17l-5.7 3.2 1.2-6.4-4.7-4.4 6.4-.8z" />,
    },
    {
      title: "Safety first",
      text: "Listings moderated, report anything off",
      icon: (
        <>
          <rect x="5" y="10" width="14" height="11" rx="2.5" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14.5v2.5" />
        </>
      ),
    },
    {
      title: "Supporting the Indian community",
      text: "Across America",
      icon: <path d="M12 20.5S3 15 3 8.8C3 6 5.1 4 7.6 4c1.9 0 3.5 1.1 4.4 2.6C12.9 5.1 14.5 4 16.4 4 18.9 4 21 6 21 8.8 21 15 12 20.5 12 20.5z" />,
    },
  ];
  return (
    <Reveal as="div" className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 lg:px-8">
      <ul className="grid grid-cols-1 gap-y-5 rounded-3xl border border-line bg-white px-6 py-6 shadow-soft sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-line lg:px-2">
        {items.map((it, i) => (
          <li key={it.title} data-reveal-item className="flex items-center gap-4 lg:px-6">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${i % 2 ? "bg-[#FFF1E5] text-saffron" : "bg-brand-soft text-forest"}`}>
              <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                {it.icon}
              </svg>
            </span>
            <span>
              <span className="block font-semibold text-ink">{it.title}</span>
              <span className="block text-sm text-muted">{it.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}
