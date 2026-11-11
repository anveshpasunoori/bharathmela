// The saffron, white and green ribbon along the bottom of the hero.
export function HeroWave({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden className={className}>
      <path d="M0 62 C360 18 720 96 1080 46 S1380 20 1440 30 V90 H0z" fill="#F47721" opacity="0.9" />
      <path d="M0 70 C360 30 720 104 1080 56 S1380 32 1440 42 V90 H0z" fill="#FFFFFF" />
      <path d="M0 78 C360 44 720 112 1080 66 S1380 46 1440 54 V90 H0z" fill="#145638" />
      <path d="M0 86 C360 60 720 118 1080 80 S1380 66 1440 70 V90 H0z" fill="var(--page)" />
    </svg>
  );
}
