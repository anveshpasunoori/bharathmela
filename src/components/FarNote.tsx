import { metroName } from "@/lib/metros";

// Shown when the nearest city BharathMela covers is too far from the visitor to call local.
export function FarNote({ far, metro }: { far: { city: string; miles: number } | null; metro: string }) {
  if (!far) return null;
  return (
    <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
      BharathMela isn&rsquo;t in {far.city} yet. Showing {metroName(metro)}, our nearest city ({far.miles} mi away).
    </p>
  );
}
