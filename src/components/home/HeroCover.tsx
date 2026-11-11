"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { FestivalCover } from "@/lib/festival-cover";
import { BUSINESS_COVERS, BUSINESS_COVER_INTERVAL_MS } from "@/lib/home-cover";
import { Parallax } from "./Parallax";

const sizes = "(min-width: 1024px) 58vw, 100vw";

export function HeroCover({ festival }: { festival: FestivalCover | null }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (festival) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => setReducedMotion(motion.matches);
    const onVisibility = () => setVisible(!document.hidden);
    onMotion();
    onVisibility();
    motion.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      motion.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [festival]);

  useEffect(() => {
    if (festival || paused || reducedMotion || !visible) return;
    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % BUSINESS_COVERS.length), BUSINESS_COVER_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [festival, index, paused, reducedMotion, visible]);

  return (
    <>
      <Parallax className="absolute inset-0">
        {festival ? (
          <Image src={festival.src} alt={festival.alt} fill preload sizes={sizes} className="object-cover object-[64%_48%]" />
        ) : BUSINESS_COVERS.map((cover, slide) => (
          <Image
            key={cover.src}
            src={cover.src}
            alt={slide === index ? cover.alt : ""}
            aria-hidden={slide !== index}
            fill
            preload={slide === 0}
            sizes={sizes}
            className={`object-cover object-[64%_48%] motion-safe:transition-opacity motion-safe:duration-700 ${slide === index ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </Parallax>
      {!festival && (
        <div aria-label="Homepage cover controls" role="group" className="absolute bottom-5 right-4 z-10 flex items-center gap-1 rounded-full bg-ink/80 p-1 text-snow">
          <span className="px-2 text-xs font-semibold">{BUSINESS_COVERS[index].label}</span>
          {!reducedMotion && (
            <button
              type="button"
              aria-label={paused ? "Resume cover rotation" : "Pause cover rotation"}
              onClick={() => setPaused(!paused)}
              className="grid size-8 place-items-center rounded-full hover:bg-white/20 focus-visible:outline focus-visible:outline-white"
            >
              <span aria-hidden>{paused ? "▶" : "Ⅱ"}</span>
            </button>
          )}
          <button
            type="button"
            aria-label="Next business cover"
            onClick={() => setIndex((current) => (current + 1) % BUSINESS_COVERS.length)}
            className="grid size-8 place-items-center rounded-full hover:bg-white/20 focus-visible:outline focus-visible:outline-white"
          >
            <span aria-hidden>→</span>
          </button>
        </div>
      )}
    </>
  );
}
