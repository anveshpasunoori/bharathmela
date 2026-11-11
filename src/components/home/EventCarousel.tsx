"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";

// A swipeable row of event cards: native scroll-snap (so touch, trackpad and keyboard scrolling work),
// previous/next buttons, dots, and a slow auto-advance that pauses on hover or focus and never runs
// with reduced motion.
export function EventCarousel({ children, label, interval = 6500 }: { children: React.ReactNode; label: string; interval?: number }) {
  const track = useRef<HTMLDivElement>(null);
  const slides = Children.toArray(children);
  const [index, setIndex] = useState(0);
  const paused = useRef(false);

  const goTo = useCallback((i: number) => {
    const el = track.current;
    if (!el) return;
    const n = el.children.length;
    const target = el.children[((i % n) + n) % n] as HTMLElement | undefined;
    if (target) el.scrollTo({ left: target.offsetLeft - el.offsetLeft, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, []);

  // Which slide is showing, from the scroll position.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const w = (el.children[0] as HTMLElement | undefined)?.offsetWidth || 1;
        setIndex(Math.round(el.scrollLeft / (w + 24)));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      if (!paused.current && document.visibilityState === "visible") goTo(index + 1);
    }, interval);
    return () => clearInterval(timer);
  }, [index, interval, slides.length, goTo]);

  const arrow = "grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-ink shadow-sm transition duration-150 hover:border-forest hover:text-forest disabled:opacity-40";
  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onFocusCapture={() => (paused.current = true)}
      onBlurCapture={() => (paused.current = false)}
    >
      <div ref={track} className="scrollbar-none relative -mx-1 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-1 pb-2">
        {slides.map((slide, i) => (
          <div key={i} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}`} className="relative w-full shrink-0 snap-start">
            {slide}
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <button type="button" className={arrow} onClick={() => goTo(index - 1)} aria-label="Previous event">
            <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><path d="M12.7 5.3a1 1 0 0 1 0 1.4L9.4 10l3.3 3.3a1 1 0 0 1-1.4 1.4l-4-4a1 1 0 0 1 0-1.4l4-4a1 1 0 0 1 1.4 0z" /></svg>
          </button>
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show event ${i + 1}`}
                aria-current={i === index}
                className="h-2.5 w-2.5 rounded-full bg-stone-300 transition-all duration-200 aria-[current=true]:w-6 aria-[current=true]:bg-forest"
              />
            ))}
          </div>
          <button type="button" className={arrow} onClick={() => goTo(index + 1)} aria-label="Next event">
            <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><path d="M7.3 14.7a1 1 0 0 1 0-1.4l3.3-3.3-3.3-3.3a1 1 0 1 1 1.4-1.4l4 4a1 1 0 0 1 0 1.4l-4 4a1 1 0 0 1-1.4 0z" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
