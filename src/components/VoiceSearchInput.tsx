"use client";

import { useRef, type ComponentProps } from "react";
import { TranslatedVoiceSearch } from "./TranslatedVoiceSearch";
import { VoiceSearchButton } from "./VoiceSearchButton";

export function VoiceSearchInput({ translateVoice, ...props }: ComponentProps<"input"> & { translateVoice: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const fallback = <VoiceSearchButton onTranscript={(text) => {
    if (!input.current) return;
    input.current.value = text;
    input.current.focus();
  }} />;
  return (
    <>
      <input {...props} ref={input} />
      {translateVoice ? <TranslatedVoiceSearch fallback={fallback} onQuery={(text) => {
        if (!input.current) return;
        input.current.value = text;
        input.current.form?.requestSubmit();
      }} /> : fallback}
    </>
  );
}
