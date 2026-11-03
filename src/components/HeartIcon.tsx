// The save heart: full rounded lobes and a soft point. `overlay` is for photos, where a white outline over a
// see-through dark fill stays visible on any image; otherwise it's an outline in the text color. Saved
// hearts are solid red either way.
const HEART = "M12 20.5C12 20.5 3 15 3 8.8 3 6 5.1 4 7.6 4c1.9 0 3.5 1.1 4.4 2.6C12.9 5.1 14.5 4 16.4 4 18.9 4 21 6 21 8.8 21 15 12 20.5 12 20.5Z";

export function HeartIcon({ filled, overlay = false, className = "h-5 w-5" }: { filled: boolean; overlay?: boolean; className?: string }) {
  const fill = filled ? "#e11d48" : overlay ? "rgba(28,25,23,0.35)" : "none";
  const stroke = overlay ? "#fff" : filled ? "#e11d48" : "currentColor";
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`${overlay ? "drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]" : ""} ${className}`}>
      <path d={HEART} fill={fill} stroke={stroke} strokeWidth={overlay ? 1.8 : 2} strokeLinejoin="round" />
    </svg>
  );
}
