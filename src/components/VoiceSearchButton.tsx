"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

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
const siteLanguages: Record<string, string> = { en: "en-US", te: "te-IN", hi: "hi-IN", ta: "ta-IN" };
const voiceLanguages = [
  ["en-US", "English (US)"], ["en-IN", "English (India)"], ["hi-IN", "हिन्दी"],
  ["te-IN", "తెలుగు"], ["ta-IN", "தமிழ்"], ["ml-IN", "മലയാളം"], ["kn-IN", "ಕನ್ನಡ"],
  ["bn-IN", "বাংলা"], ["mr-IN", "मराठी"], ["gu-IN", "ગુજરાતી"], ["pa-IN", "ਪੰਜਾਬੀ"],
  ["ur-IN", "اردو"], ["es-US", "Español"], ["fr-FR", "Français"], ["ar-SA", "العربية"],
  ["zh-CN", "普通话"], ["ja-JP", "日本語"], ["ko-KR", "한국어"],
];
const preferenceKey = "bm-voice-language";

function savedLanguage() {
  try {
    return window.localStorage.getItem(preferenceKey) ?? "";
  } catch {
    return "";
  }
}

export function VoiceSearchButton({ onTranscript }: { onTranscript: (transcript: string) => void }) {
  const available = useSyncExternalStore(subscribe, supported, () => false);
  const languageId = useId();
  const preference = useSyncExternalStore(subscribe, savedLanguage, () => "");
  const [choice, setChoice] = useState<string | null>(null);
  const [custom, setCustom] = useState<string | null>(null);
  const language = choice ?? (voiceLanguages.some(([tag]) => tag === preference) || !preference ? preference : "custom");
  const customTag = custom ?? (language === "custom" ? preference : "");
  const languageMenu = useRef<HTMLDetailsElement>(null);
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
    if (languageMenu.current) languageMenu.current.open = false;
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

    const preferred = language === "custom" ? customTag.trim() : language;
    if (language === "custom" && !preferred) {
      setMessage("Enter a language code, such as it-IT for Italian.");
      return;
    }
    let tag: string;
    try {
      const fallback = siteLanguages[document.documentElement.lang] ?? navigator.language ?? "en-US";
      [tag] = Intl.getCanonicalLocales(preferred || fallback);
    } catch {
      setMessage("Use a valid language code, such as it-IT for Italian.");
      return;
    }
    try {
      if (preferred) window.localStorage.setItem(preferenceKey, tag);
      else window.localStorage.removeItem(preferenceKey);
    } catch {
      // The selection still works when browser storage is unavailable.
    }

    const recognition = new SpeechRecognition();
    recognition.lang = tag;
    recognition.onresult = (event) => {
      if (session.current !== recognition) return;
      const transcript = event.results[0]?.[0]?.transcript.trim().slice(0, 100);
      if (transcript) onTranscript(transcript);
    };
    recognition.onerror = ({ error }) => {
      if (session.current !== recognition) return;
      session.current = null;
      setListening(false);
      if (error === "language-not-supported") {
        setMessage("Your browser doesn’t support this voice language. Try another or type your search.");
        return;
      }
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
      <details ref={languageMenu} className="group relative">
        <summary aria-label="Voice language" title="Voice language" className="grid min-h-11 w-6 cursor-pointer list-none place-items-center rounded-md text-forest hover:bg-ivory [&::-webkit-details-marker]:hidden">
          <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="m4 6 4 4 4-4" />
          </svg>
        </summary>
        <div className="absolute right-0 top-full z-40 mt-1 w-56 rounded-xl border border-line bg-white p-3 text-sm shadow-md">
          <label htmlFor={languageId} className="label">Voice language</label>
          <select id={languageId} className="input" value={language} onChange={(event) => setChoice(event.target.value)}>
            <option value="">Site language</option>
            {voiceLanguages.map(([tag, label]) => <option key={tag} value={tag}>{label}</option>)}
            <option value="custom">Other language…</option>
          </select>
          {language === "custom" && (
            <label className="mt-2 block text-xs">
              Language code
              <input className="input mt-1" value={customTag} onChange={(event) => setCustom(event.target.value)} placeholder="e.g. it-IT" maxLength={35}
                onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }} />
            </label>
          )}
          <p className="mt-2 text-xs text-muted">Choose a language, then tap the microphone. Availability depends on your browser.</p>
        </div>
      </details>
      <span role="status" className={listening || message ? "absolute right-0 top-full z-30 mt-1 w-52 rounded-lg border border-line bg-white px-3 py-2 text-xs text-ink shadow-md" : "sr-only"}>
        {listening ? "Listening… Speak now." : message}
      </span>
    </span>
  );
}
