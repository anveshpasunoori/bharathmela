"use client";

import Image from "next/image";
import { useState } from "react";

type Photo = { id: string; url: string; thumbUrl: string; width: number; height: number };

// Main photo plus a scrollable strip of thumbnails. Tapping the main photo opens it full size.
export function PhotoGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [i, setI] = useState(0);
  if (!photos.length) return null;
  const current = photos[Math.min(i, photos.length - 1)];
  return (
    <div className="space-y-2">
      <a href={current.url} target="_blank" rel="noopener" className="block overflow-hidden rounded-lg bg-stone-100">
        <Image
          src={current.url}
          alt={`${title} – photo ${i + 1} of ${photos.length}`}
          width={current.width}
          height={current.height}
          sizes="(max-width: 672px) 100vw, 672px"
          className="max-h-[28rem] w-full object-contain"
          priority={i === 0}
        />
      </a>
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, n) => (
            <button key={p.id} type="button" onClick={() => setI(n)} aria-label={`Show photo ${n + 1}`}
              className={`shrink-0 overflow-hidden rounded-md ring-2 ${n === i ? "ring-brand" : "ring-transparent"}`}>
              <Image src={p.thumbUrl} alt="" width={96} height={72} className="h-16 w-20 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
