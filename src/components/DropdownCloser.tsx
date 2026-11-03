"use client";

import { useEffect } from "react";

// Pop-up menus are <details data-dropdown> elements. Close them like real menus: on a click or tap outside,
// on Escape, and after a link inside is chosen (client-side navigation keeps the header mounted).
export function DropdownCloser() {
  useEffect(() => {
    const openMenus = () => document.querySelectorAll<HTMLDetailsElement>("details[data-dropdown][open]");
    const onPointerDown = (e: PointerEvent) => {
      openMenus().forEach((d) => {
        if (!d.contains(e.target as Node)) d.open = false;
      });
    };
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest?.("a[href]");
      const menu = link?.closest<HTMLDetailsElement>("details[data-dropdown]");
      if (menu) menu.open = false;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      openMenus().forEach((d) => {
        d.open = false;
        d.querySelector("summary")?.focus();
      });
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);
  return null;
}
