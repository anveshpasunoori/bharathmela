"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type Recognition = {
  lang: string;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
};

function recognitionConstructor() {
  const browser = window as Window & {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}

const subscribe = () => () => {};
const supported = () => !!recognitionConstructor();
const languages: Record<string, string> = { en: "en-US", te: "te-IN", hi: "hi-IN", ta: "ta-IN" };

export function VoiceSearchButton({ onTranscript }: { onTranscript: (transcript: string) => void }) {
  const available = useSyncExternalStore(subscribe, supported, () => false);
  const session = useRef<Recognition | null>(null);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => () => {
    const active = session.current;
    session.current = null;
    active?.abort();
  }, []);

  if (!available) return null;

  function toggle() {
    if (session.current) {
      const active = session.current;
      session.current = null;
      active.abort();
      setListening(false);
      setMessage("");
      return;
    }

    const SpeechRecognition = recognitionConstructor();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = languages[document.documentElement.lang] ?? "en-US";
    recognition.onresult = (event) => {
      if (session.current !== recognition) return;
      const transcript = event.results[0]?.[0]?.transcript.trim().slice(0, 100);
      if (transcript) onTranscript(transcript);
    };
    recognition.onerror = ({ error }) => {
      if (session.current !== recognition) return;
      session.current = null;
      setListening(false);
      setMessage(error === "not-allowed" || error === "service-not-allowed"
        ? "Microphone access is unavailable. You can type your search."
        : "Speech wasn’t recognized. Try again or type your search.");
    };
    recognition.onend = () => {
      if (session.current !== recognition) return;
      session.current = null;
      setListening(false);
    };

    session.current = recognition;
    setMessage("");
    try {
      recognition.start();
      setListening(true);
    } catch {
      session.current = null;
      setMessage("Voice search couldn’t start. You can type your search.");
    }
  }

  return (
    <span className="relative inline-flex shrink-0 items-center">
      <button
        type="button"
        aria-label={listening ? "Cancel voice search" : "Search by voice"}
        title={listening ? "Cancel voice search" : "Search by voice"}
        onClick={toggle}
        onBlur={() => setMessage("")}
        className={`grid size-11 place-items-center rounded-full text-forest focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-forest ${listening ? "bg-brand-soft" : "hover:bg-ivory"}`}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <rect x="9" y="3" width="6" height="12" rx="3" />
          <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 18v3m-3 0h6" />
        </svg>
      </button>
      <span role="status" className={listening || message ? "absolute right-0 top-full z-30 mt-1 w-52 rounded-lg border border-line bg-white px-3 py-2 text-xs text-ink shadow-md" : "sr-only"}>
        {listening ? "Listening… Speak now." : message}
      </span>
    </span>
  );
}
