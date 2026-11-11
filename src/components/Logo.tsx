// The BharathMela mark: a saffron lotus on two green leaves, then the name in the display serif.
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className}>
      <path d="M24 40c-9 0-17-4-21-11 7-2 15 0 21 6 6-6 14-8 21-6-4 7-12 11-21 11z" fill="#145638" />
      <path d="M24 37c-4-4-6-9-6-15 0-4 2-9 6-13 4 4 6 9 6 13 0 6-2 11-6 15z" fill="#F47721" />
      <path d="M22 37c-6-1-11-5-13-11 0-3 1-6 3-8 4 2 7 5 9 9 1 3 2 7 1 10z" fill="#F89A4E" />
      <path d="M26 37c6-1 11-5 13-11 0-3-1-6-3-8-4 2-7 5-9 9-1 3-2 7-1 10z" fill="#F89A4E" />
      <circle cx="24" cy="6" r="2.2" fill="#F47721" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className="font-[family-name:var(--font-display)] text-[1.45rem] font-bold leading-none tracking-tight text-forest">
        Bharath<span className="text-saffron">Mela</span>
      </span>
    </span>
  );
}
