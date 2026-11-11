"use client";

import { useEffect, useRef } from "react";

// Fades a section up as it scrolls into view, once. Children with data-reveal-item come in one after
// another. Without JavaScript, or with reduced motion, everything simply shows (see globals.css).
export function Reveal({ as: Tag = "section", className = "", stagger = 70, children, ...rest }: {
  as?: "section" | "div";
  className?: string;
  stagger?: number;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = [el, ...el.querySelectorAll<HTMLElement>("[data-reveal-item]")];
    items.forEach((item, i) => {
      item.setAttribute("data-reveal", "");
      if (i > 0) item.style.transitionDelay = `${Math.min(i - 1, 8) * stagger}ms`;
    });
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        items.forEach((item) => item.setAttribute("data-shown", ""));
        io.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [stagger]);
  return (
    <Tag ref={ref as React.Ref<HTMLDivElement>} className={className} {...rest}>
      {children}
    </Tag>
  );
}
