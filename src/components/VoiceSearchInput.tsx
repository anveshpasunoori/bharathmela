"use client";

import { useRef, type ComponentProps } from "react";
import { VoiceSearchButton } from "./VoiceSearchButton";

export function VoiceSearchInput(props: ComponentProps<"input">) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input {...props} ref={input} />
      <VoiceSearchButton onTranscript={(text) => {
        if (!input.current) return;
        input.current.value = text;
        input.current.focus();
      }} />
    </>
  );
}
