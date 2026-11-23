"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Browser voice features (no extra libraries):
 * - Speech-to-text via the Web Speech API (Chrome, Edge, Safari).
 * - Text-to-speech via speechSynthesis, spoken sentence by sentence with the most
 *   natural-sounding voice available.
 * Everything degrades gracefully: `sttSupported` / `ttsSupported` tell the UI what to offer.
 */

/* Minimal typings — SpeechRecognition isn't in TypeScript's DOM lib everywhere. */
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type RecognitionError = { error: string };
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: RecognitionError) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

function getRecognition(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const MIC_ERRORS: Record<string, string> = {
  "not-allowed": "Microphone access is blocked. Allow it from the 🔒 icon in your address bar, then try again.",
  "service-not-allowed": "Voice input isn't allowed in this browser. You can still type your question.",
  "audio-capture": "I couldn't find a microphone. Is one connected?",
  "no-speech": "I didn't hear anything — tap the mic and try again.",
  network: "Voice recognition needs an internet connection.",
};

/** Ranks voices so we pick a natural-sounding English one when the browser has it. */
function pickVoice(voices: SpeechSynthesisVoice[]) {
  const en = voices.filter((v) => /^en(-|_|$)/i.test(v.lang));
  const pool = en.length ? en : voices;
  const score = (v: SpeechSynthesisVoice) =>
    (/natural|neural|online/i.test(v.name) ? 40 : 0) +
    (/google uk english female|google us english|samantha|aria|jenny|libby|sonia|ava|allison|karen|moira|tessa|zira/i.test(v.name) ? 20 : 0) +
    (/female/i.test(v.name) ? 5 : 0) +
    (v.localService ? 0 : 3) +
    (/en-(us|gb)/i.test(v.lang) ? 2 : 0);
  return [...pool].sort((a, b) => score(b) - score(a))[0] ?? null;
}

/** Make text pleasant to hear: no emoji, markers or raw URLs; email read naturally. */
function speakable(text: string) {
  return text
    .replace(/\[\[[^\]]*\]\]/g, "")
    .replace(/https?:\/\/\S+/g, "the link in the chat")
    .replace(/([\w.+-]+)@([\w-]+)\.(\w+)/g, "$1 at $2 dot $3")
    .replace(/\p{Extended_Pictographic}|️|‍/gu, "")
    .replace(/[*_#`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function useVoice({ onFinal, onInterim }: { onFinal: (text: string) => void; onInterim?: (text: string) => void }) {
  const [sttSupported, setSttSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const recRef = useRef<Recognition | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const speakIdRef = useRef(0);
  const finalRef = useRef(onFinal);
  const interimRef = useRef(onInterim);
  finalRef.current = onFinal;
  interimRef.current = onInterim;

  useEffect(() => {
    setSttSupported(!!getRecognition());
    if (!("speechSynthesis" in window)) return;
    setTtsSupported(true);
    const load = () => (voiceRef.current = pickVoice(window.speechSynthesis.getVoices()));
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
      recRef.current?.abort();
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    speakIdRef.current++;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  /** Speak a reply; resolves when finished or interrupted. */
  const speak = useCallback(
    (text: string) =>
      new Promise<void>((resolve) => {
        if (!("speechSynthesis" in window)) return resolve();
        const clean = speakable(text);
        if (!clean) return resolve();
        stopSpeaking();
        const id = ++speakIdRef.current;
        // Short chunks avoid Chrome cutting long utterances off after ~15 s.
        const chunks = clean.match(/[^.!?]+[.!?]*\s*/g)?.map((c) => c.trim()).filter(Boolean) ?? [clean];
        const lang = navigator.language || "en-US";
        let i = 0;
        const next = () => {
          if (id !== speakIdRef.current) return resolve();
          if (i >= chunks.length) {
            setSpeaking(false);
            return resolve();
          }
          const u = new SpeechSynthesisUtterance(chunks[i++]);
          const voice = voiceRef.current;
          if (voice) u.voice = voice;
          u.lang = voice?.lang ?? lang;
          u.rate = 1.02;
          u.pitch = 1.12;
          u.onend = next;
          u.onerror = () => {
            if (id === speakIdRef.current) setSpeaking(false);
            resolve();
          };
          window.speechSynthesis.speak(u);
        };
        setSpeaking(true);
        next();
      }),
    [stopSpeaking],
  );

  const stopListening = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const startListening = useCallback(async () => {
    const Ctor = getRecognition();
    if (!Ctor) {
      setMicError("Voice input isn't supported in this browser — try Chrome, Edge or Safari. You can still type!");
      return;
    }
    setMicError(null);
    stopSpeaking(); // don't let the mic hear the panda
    // If permission was already denied, say so instead of failing silently.
    try {
      const status = await navigator.permissions?.query({ name: "microphone" as PermissionName });
      if (status?.state === "denied") {
        setMicError(MIC_ERRORS["not-allowed"]);
        return;
      }
    } catch {
      /* Permissions API not available for the mic here — just try. */
    }

    recRef.current?.abort();
    const rec = new Ctor();
    rec.lang = navigator.language || "en-US";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    let finalText = "";
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      interimRef.current?.((finalText + interim).trim());
    };
    rec.onerror = (e) => {
      if (e.error !== "aborted") setMicError(MIC_ERRORS[e.error] ?? "Voice input stopped unexpectedly. You can type instead.");
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
      const text = finalText.trim();
      if (text) finalRef.current(text);
    };
    recRef.current = rec;
    try {
      rec.start();
    } catch {
      setMicError("Couldn't start the microphone — please try again.");
      setListening(false);
    }
  }, [stopSpeaking]);

  return {
    sttSupported,
    ttsSupported,
    listening,
    speaking,
    micError,
    clearMicError: () => setMicError(null),
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
