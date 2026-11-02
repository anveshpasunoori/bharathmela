import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-md text-center">
      <h1 className="text-xl font-bold">Page not found</h1>
      <p className="mt-2 text-stone-600">This page doesn&apos;t exist, or the listing is no longer available.</p>
      <Link href="/" className="btn mt-4">Browse listings</Link>
    </div>
  );
}
