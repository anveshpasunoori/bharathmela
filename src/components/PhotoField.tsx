"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const MAX = 6;
const MAX_BYTES = 8 * 1024 * 1024;

// Photo picker with previews. Existing photos can be ticked for removal; the first photo is the cover.
export function PhotoField({ existing = [], batchLimit }: { existing?: { id: string; thumbUrl: string }[]; batchLimit?: number }) {
  const [previews, setPreviews] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [removed, setRemoved] = useState<string[]>([]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);
  const kept = existing.length - removed.length;

  function validateSelection(field: HTMLInputElement, slots: number) {
    const files = Array.from(field.files ?? []);
    const oversized = files.find((file) => file.size > MAX_BYTES);
    const problem = files.length > slots
      ? `Choose up to ${slots} more ${slots === 1 ? "photo" : "photos"}, or remove an existing photo.`
      : oversized ? `“${oversized.name}” is larger than 8 MB.`
        : batchLimit && files.reduce((sum, file) => sum + file.size, 0) > batchLimit
          ? "Choose photos totaling 4 MB or less. You can add more photos by editing the listing."
          : "";
    field.setCustomValidity(problem);
    setError(problem);
    setPreviews(problem ? [] : files.map((file) => URL.createObjectURL(file)));
  }

  return (
    <fieldset className="space-y-2">
      <legend className="label">Photos (up to {MAX})</legend>
      <p className="-mt-1 text-xs text-stone-500">
        Use JPG, PNG, or WebP, {batchLimit ? "up to 4 MB total per submission" : "up to 8 MB each"}. The first photo is the cover. We strip hidden location data on upload.
      </p>
      {existing.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {existing.map((p, i) => {
            const off = removed.includes(p.id);
            return (
              <label key={p.id} className={`relative block cursor-pointer ${off ? "opacity-40" : ""}`}>
                <Image src={p.thumbUrl} alt={`Photo ${i + 1}`} width={96} height={72} className="h-18 w-24 rounded-md object-cover ring-1 ring-stone-200" />
                <input type="checkbox" name="removePhotos" value={p.id} checked={off} className="sr-only"
                  onChange={() => {
                    const next = off ? removed.filter((x) => x !== p.id) : [...removed, p.id];
                    setRemoved(next);
                    if (input.current) validateSelection(input.current, MAX - existing.length + next.length);
                  }} />
                <span className="absolute right-1 top-1 rounded bg-white/90 px-1 text-xs">{off ? "Undo" : "✕"}</span>
              </label>
            );
          })}
        </div>
      )}
      <input
          ref={input}
          aria-label="Add listing photos"
          hidden={kept >= MAX && !error}
          type="file"
          name="photos"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:font-semibold file:text-brand"
          onChange={(e) => validateSelection(e.currentTarget, MAX - kept)}
      />
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
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
