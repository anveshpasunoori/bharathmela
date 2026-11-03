"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleSaved } from "@/app/actions/buyer";
import { HeartIcon } from "./HeartIcon";

// The heart on a listing card's photo. It flips straight away, then saves; logged-out visitors are sent
// to log in by the action.
export function SaveHeart({ listingId, title, saved }: { listingId: string; title: string; saved: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(saved);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Remove “${title}” from saved` : `Save “${title}”`}
      title={on ? "Remove from saved" : "Save"}
      disabled={pending}
      className="grid h-10 w-10 place-items-center rounded-full transition hover:scale-110 active:scale-95"
      onClick={() => {
        setOn(!on);
        start(async () => {
          await toggleSaved(listingId, `${window.location.pathname}${window.location.search}`);
          router.refresh();
        });
      }}
    >
      <HeartIcon filled={on} overlay className="h-8 w-8" />
    </button>
  );
}
