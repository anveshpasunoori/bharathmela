"use client";

import { useEffect, useState } from "react";

type InstallPrompt = Event & { prompt: () => Promise<void> };

// "Install app": Chrome and Android offer their install prompt; iPhones need Share → Add to Home Screen,
// so they get that tip instead. Hidden once the site is running as an installed app.
export function InstallApp({ className = "" }: { className?: string }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [ios, setIos] = useState(false);
  const [tip, setTip] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    // Read after mount; the server can't know the device.
    const timer = setTimeout(() => setIos(/iphone|ipad|ipod/i.test(navigator.userAgent)), 0);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      clearTimeout(timer);
    };
  }, []);
  if (!prompt && !ios) return null;
  return (
    <span className={className}>
      <button
        type="button"
        className="font-semibold text-brand hover:underline"
        onClick={() => (prompt ? prompt.prompt().then(() => setPrompt(null)) : setTip((t) => !t))}
      >
        📲 Install the app
      </button>
      {tip && <span className="ml-2 text-stone-600">Tap the Share button, then &ldquo;Add to Home Screen&rdquo;.</span>}
    </span>
  );
}
