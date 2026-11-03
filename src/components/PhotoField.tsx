"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const MAX = 6;

// Photo picker with previews. Existing photos can be ticked for removal; the first photo is the cover.
export function PhotoField({ existing = [] }: { existing?: { id: string; thumbUrl: string }[] }) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);
  const kept = existing.length - removed.length;

  return (
    <fieldset className="space-y-2">
      <legend className="label">Photos (up to {MAX})</legend>
      <p className="-mt-1 text-xs text-stone-500">
        Real photos of your food, work, room or products get far more replies. The first photo is the cover. We remove hidden location data from
        photos when you upload them.
      </p>
      {existing.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {existing.map((p, i) => {
            const off = removed.includes(p.id);
            return (
              <label key={p.id} className={`relative block cursor-pointer ${off ? "opacity-40" : ""}`}>
                <Image src={p.thumbUrl} alt={`Photo ${i + 1}`} width={96} height={72} className="h-18 w-24 rounded-md object-cover ring-1 ring-stone-200" />
                <input type="checkbox" name="removePhotos" value={p.id} checked={off} className="sr-only"
                  onChange={() => setRemoved(off ? removed.filter((x) => x !== p.id) : [...removed, p.id])} />
                <span className="absolute right-1 top-1 rounded bg-white/90 px-1 text-xs">{off ? "Undo" : "✕"}</span>
              </label>
            );
          })}
        </div>
      )}
      {kept < MAX && (
        <input
          type="file"
          name="photos"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:font-semibold file:text-brand"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []).slice(0, MAX - kept);
            setPreviews(files.map((f) => URL.createObjectURL(f)));
          }}
        />
      )}
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((u) => (
            // Local previews are blob: URLs, which next/image can't optimize.
            // eslint-disable-next-line @next/next/no-img-element
            <img key={u} src={u} alt="New photo preview" className="h-18 w-24 rounded-md object-cover ring-1 ring-brand/40" />
          ))}
        </div>
      )}
    </fieldset>
  );
}
