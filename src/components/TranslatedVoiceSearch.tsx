"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { VOICE_SEARCH_FORMATS, VOICE_SEARCH_MAX_BYTES, VOICE_SEARCH_MAX_MS } from "@/lib/voice-search";

type Session = {
  controller: AbortController;
  recorder?: MediaRecorder;
  stream?: MediaStream;
  timer?: ReturnType<typeof setTimeout>;
};

const subscribe = () => () => {};
const supported = () => !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

function release(session: Session) {
  clearTimeout(session.timer);
  session.stream?.getTracks().forEach((track) => track.stop());
}

export function TranslatedVoiceSearch({ onQuery, fallback }: { onQuery: (query: string) => void; fallback: React.ReactNode }) {
  const available = useSyncExternalStore(subscribe, supported, () => false);
  const current = useRef<Session | null>(null);
  const [state, setState] = useState<"idle" | "ready" | "starting" | "recording" | "translating">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => () => {
    const session = current.current;
    current.current = null;
    if (!session) return;
    session.controller.abort();
    release(session);
  }, []);

  if (!available) return fallback;

  async function start() {
    const session: Session = { controller: new AbortController() };
    current.current = session;
    setState("starting");
    setMessage("");
    try {
      const type = Object.keys(VOICE_SEARCH_FORMATS).find((format) => MediaRecorder.isTypeSupported(format));
      if (!type) throw new Error("Unsupported recording format");
      session.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (current.current !== session) {
        release(session);
        return;
      }
      const recorder = new MediaRecorder(session.stream, { mimeType: type, audioBitsPerSecond: 48_000 });
      const chunks: Blob[] = [];
      session.recorder = recorder;
      recorder.ondataavailable = ({ data }) => { if (data.size) chunks.push(data); };
      recorder.onerror = () => {
        if (current.current !== session) return;
        current.current = null;
        release(session);
        setState("idle");
        setMessage("Recording failed. Try again or type your search.");
      };
      recorder.onstop = async () => {
        release(session);
        if (current.current !== session) return;
        setState("translating");
        try {
          const body = new Blob(chunks, { type });
          if (!body.size || body.size > VOICE_SEARCH_MAX_BYTES) {
            setMessage("Try recording a short search again.");
            return;
          }
          const response = await fetch("/api/voice-search", { method: "POST", body, signal: session.controller.signal });
          const result = await response.json();
          if (current.current !== session) return;
          if (response.ok && typeof result.query === "string" && result.query) onQuery(result.query);
          else setMessage(result.error || "Speech translation is unavailable. You can type your search.");
        } catch {
          if (current.current === session) setMessage("Speech translation couldn’t finish. Try typing your search.");
        } finally {
          if (current.current === session) {
            current.current = null;
            setState("idle");
          }
        }
      };
      recorder.start();
      session.timer = setTimeout(() => { if (recorder.state === "recording") recorder.stop(); }, VOICE_SEARCH_MAX_MS);
      setState("recording");
    } catch {
      release(session);
      if (current.current !== session) return;
      current.current = null;
      setState("idle");
      setMessage("Microphone access or recording is unavailable. You can type your search.");
    }
  }

  function toggle() {
    if (state === "recording") {
      const recorder = current.current?.recorder;
      if (recorder?.state === "recording") recorder.stop();
      return;
    }
    setMessage("");
    setState(state === "ready" ? "idle" : "ready");
  }

  const label = state === "recording" ? "Stop recording and search" : "Translate and search by voice";
  return (
    <span className="relative inline-flex shrink-0 items-center">
      <button type="button" aria-label={label} title={label} onClick={toggle} disabled={state === "starting" || state === "translating"}
        aria-expanded={state === "ready"} className={`grid size-11 place-items-center rounded-full text-forest hover:bg-ivory ${state === "recording" ? "bg-brand-soft" : ""}`}>
        <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <rect x="9" y="3" width="6" height="12" rx="3" />
          <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 18v3m-3 0h6" />
        </svg>
      </button>
      {state === "ready" && (
        <div className="absolute right-0 top-full z-40 mt-1 w-60 rounded-xl border border-line bg-white p-3 text-sm shadow-md">
          <p className="mb-2">Speak in your language. Your recording is sent to OpenAI to translate it into an English search.</p>
          <button type="button" className="btn min-h-10" onClick={start}>Start recording</button>
        </div>
      )}
      <span role="status" className={state === "recording" || state === "translating" || state === "starting" || message
        ? "absolute right-0 top-full z-30 mt-1 w-56 rounded-lg border border-line bg-white px-3 py-2 text-xs text-ink shadow-md" : "sr-only"}>
        {state === "starting" ? "Waiting for the microphone…" : state === "recording" ? "Listening… Tap the microphone again to search." : state === "translating" ? "Translating and searching…" : message}
      </span>
    </span>
  );
}
