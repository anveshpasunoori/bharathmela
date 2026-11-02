"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card mx-auto max-w-md text-center">
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-stone-600">Sorry about that. Please try again in a moment.</p>
      <div className="mt-4 flex justify-center gap-2">
        <button onClick={reset} className="btn">Try again</button>
        <Link href="/" className="btn-outline">Home</Link>
      </div>
    </div>
  );
}
