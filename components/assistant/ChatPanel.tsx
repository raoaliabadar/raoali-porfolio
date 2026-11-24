"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUp, Mic, MicOff, Minus, Square, Trash2, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { assistantConfig } from "@/lib/assistant/config";
import { GREETING, hiddenCommand, localAnswer } from "@/lib/assistant/local";
import { scrollToSection, splitNavMarker } from "@/lib/assistant/navigate";
import { sectionById } from "@/lib/assistant/sections";
import { ease } from "@/lib/motion";
import { getPandaMood, pandaReact, setPandaMood, type PandaMood } from "@/lib/panda";
import { holdSleep } from "./idle";
import { PandaFace, usePandaMood } from "./PandaFace";
import { useVoice } from "./useVoice";

// The real 3D panda, framed on its upper body, in the chat header (client-only, loaded with the panel).
const DeskScene = dynamic(() => import("@/components/ui/DeskScene").then((m) => m.DeskScene), { ssr: false });

type Msg = { id: string; role: "user" | "assistant"; text: string; nav?: string; note?: string; greeting?: boolean };

const STORE_KEY = "panda-chat:v1";
const VOICE_KEY = "panda-voice";
const MAX_INPUT = 800;

const uid = () => Math.random().toString(36).slice(2, 10);
const greetingMsg = (): Msg => ({ id: "greeting", role: "assistant", text: GREETING, greeting: true });
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

class ApiUnavailable extends Error {
  constructor(public status: number) {
    super(`chat api ${status}`);
  }
}

function readStore<T>(storage: "local" | "session", key: string): T | null {
  try {
    const raw = (storage === "local" ? localStorage : sessionStorage).getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function writeStore(storage: "local" | "session", key: string, value: unknown) {
  try {
    const s = storage === "local" ? localStorage : sessionStorage;
    if (value === null) s.removeItem(key);
    else s.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked: chat still works, just isn't remembered */
  }
}

/** Turns emails and URLs in a reply into links. */
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s)]+|[\w.+-]+@[\w-]+\.[\w.]*\w)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noreferrer" className="font-medium text-accent-ink underline underline-offset-2">
            {p.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
          </a>
        ) : /@/.test(p) && /^[\w.+-]+@/.test(p) ? (
          <a key={i} href={`mailto:${p}`} className="font-medium text-accent-ink underline underline-offset-2">
            {p}
          </a>
        ) : (
          p
        ),
      )}
    </>
  );
}

const STATUS: Record<PandaMood, string> = {
  idle: "Online · here to help",
  listening: "Listening…",
  thinking: "Thinking…",
  talking: "Talking…",
  sleeping: "Napping",
};

export default function ChatPanel({
  open,
  minimized,
  onMinimize,
  onRestore,
  onClose,
}: {
  open: boolean;
  minimized: boolean;
  onMinimize: () => void;
  onRestore: () => void;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([greetingMsg()]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<"idle" | "thinking" | "streaming">("idle");
  const [voiceOn, setVoiceOn] = useState(false);
  const [unread, setUnread] = useState(false);
  const [announce, setAnnounce] = useState("");
  const mood = usePandaMood();

  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const voiceOnRef = useRef(voiceOn);
  voiceOnRef.current = voiceOn;
  const minimizedRef = useRef(minimized);
  minimizedRef.current = minimized;
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<(text: string, viaVoice?: boolean) => void>(() => {});

  const voice = useVoice({
    onFinal: (text) => sendRef.current(text, true),
    onInterim: (text) => setInput(text),
  });

  // Restore this session's chat + the visitor's voice preference.
  useEffect(() => {
    const saved = readStore<Msg[]>("session", STORE_KEY);
    if (saved?.length) setMessages(saved);
    setVoiceOn(readStore<boolean>("local", VOICE_KEY) ?? false);
  }, []);

  useEffect(() => {
    if (phase === "idle") writeStore("session", STORE_KEY, messages.slice(-40));
  }, [messages, phase]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, phase, open, minimized]);

  // Focus the input when the panel opens; clear the unread dot when restored.
  useEffect(() => {
    if (open && !minimized) {
      setUnread(false);
      const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 120);
      return () => clearTimeout(t);
    }
  }, [open, minimized]);

  // Panda mood follows the conversation: listening → thinking → talking → idle.
  useEffect(() => {
    let next: PandaMood = "idle";
    if (voice.listening) next = "listening";
    else if (phase === "thinking") next = "thinking";
    else if (phase === "streaming" || voice.speaking) next = "talking";
    const cur = getPandaMood();
    if (next !== "idle") setPandaMood(next);
    else if (cur === "listening" || cur === "thinking" || cur === "talking") setPandaMood("idle");
  }, [voice.listening, voice.speaking, phase]);

  // Closing the panel stops voice and any reply in flight.
  useEffect(() => {
    if (open) return;
    abortRef.current?.abort();
    voice.stopListening();
    voice.stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      const cur = getPandaMood();
      if (cur !== "sleeping") setPandaMood("idle");
    },
    [],
  );

  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    writeStore("local", VOICE_KEY, next);
    if (!next) voice.stopSpeaking();
  };

  const updateMsg = (id: string, patch: Partial<Msg>) =>
    setMessages((list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const goTo = useCallback(
    (id: string) => {
      // On phones the panel covers the page: tuck it away first.
      if (window.innerWidth < 640) onMinimize();
      setTimeout(() => scrollToSection(id), 380);
    },
    [onMinimize],
  );

  /** Show a reply word by word (used for offline answers and hidden commands). */
  const reveal = async (id: string, text: string) => {
    setPhase("streaming");
    const words = text.split(/(\s+)/);
    let shown = "";
    const step = Math.max(1, Math.ceil(words.length / 40));
    for (let i = 0; i < words.length; i += step) {
      shown += words.slice(i, i + step).join("");
      updateMsg(id, { text: shown });
      await wait(28);
    }
    updateMsg(id, { text });
  };

  const send = async (raw: string, viaVoice = false) => {
    const text = raw.trim().slice(0, MAX_INPUT);
    if (!text || phaseRef.current !== "idle") return;
    voice.clearMicError();
    let speakOut = voiceOnRef.current;
    if (viaVoice && voice.ttsSupported) {
      speakOut = true; // talked to it → it talks back
      if (!voiceOnRef.current) {
        setVoiceOn(true);
        writeStore("local", VOICE_KEY, true);
      }
    }

    const userMsg: Msg = { id: uid(), role: "user", text };
    const history = [...messagesRef.current, userMsg];
    setMessages(history);
    setInput("");
    const replyId = uid();

    // Hidden commands → special animations, answered locally.
    const cmd = hiddenCommand(text);
    if (cmd) {
      setMessages((l) => [...l, { id: replyId, role: "assistant", text: "" }]);
      if (cmd.reaction) pandaReact(cmd.reaction);
      if (cmd.mood === "sleeping") holdSleep(12_000);
      await reveal(replyId, cmd.reply);
      setPhase("idle");
      if (cmd.mood) setTimeout(() => setPandaMood(cmd.mood!), 50);
      setAnnounce(cmd.reply);
      if (speakOut) await voice.speak(cmd.reply);
      return;
    }

    setPhase("thinking");
    let reply: { text: string; nav?: string; note?: string } | null = null;
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.filter((m) => !m.greeting && m.text).map((m) => ({ role: m.role, content: m.text })),
        }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) throw new ApiUnavailable(res.status);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      let started = false;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const { text: shown } = splitNavMarker(acc);
        if (!shown) continue;
        if (!started) {
          started = true;
          setPhase("streaming");
          setMessages((l) => [...l, { id: replyId, role: "assistant", text: shown }]);
        } else updateMsg(replyId, { text: shown });
      }
      const final = splitNavMarker(acc);
      if (!final.text) throw new ApiUnavailable(502);
      reply = { text: final.text, nav: final.nav, note: final.error ? "The connection dropped, so this reply may be cut short." : undefined };
      if (final.error) pandaReact("confused");
    } catch (err) {
      if (ctrl.signal.aborted) {
        // Stopped by the visitor (or panel closed): keep whatever arrived.
        setPhase("idle");
        return;
      }
      const status = err instanceof ApiUnavailable ? err.status : 0;
      // Not configured → quietly use the offline brain. Real failures → a confused panda first.
      if (status !== 503) pandaReact("confused", "Hmm, my connection wobbled.");
      const local = localAnswer(text);
      const prefix = status === 429 ? "I'm getting lots of questions right now, so here's the quick version: " : "";
      const exists = messagesRef.current.some((m) => m.id === replyId);
      if (!exists) setMessages((l) => [...l, { id: replyId, role: "assistant", text: "" }]);
      await wait(status === 503 ? 450 : 200);
      await reveal(replyId, prefix + local.text);
      reply = { text: prefix + local.text, nav: local.nav };
    } finally {
      if (abortRef.current === ctrl) abortRef.current = null;
    }

    setPhase("idle");
    if (!reply) return;
    const nav = reply.nav && sectionById(reply.nav) && document.getElementById(reply.nav) ? reply.nav : undefined;
    updateMsg(replyId, { text: reply.text, nav, note: reply.note });
    setAnnounce(reply.text);
    if (minimizedRef.current) setUnread(true);
    if (nav) goTo(nav);
    if (speakOut && voice.ttsSupported) await voice.speak(reply.text);
    else pandaReact("nod");
  };
  sendRef.current = send;

  const stop = () => {
    abortRef.current?.abort();
    voice.stopSpeaking();
  };

  const clearChat = () => {
    stop();
    voice.stopListening();
    setMessages([greetingMsg()]);
    setInput("");
    setPhase("idle");
    writeStore("session", STORE_KEY, null);
    pandaReact("wave", "Fresh start!");
    inputRef.current?.focus();
  };

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (voice.listening) voice.stopListening();
    void send(input);
  };

  const userCount = messages.filter((m) => m.role === "user").length;
  const busy = phase !== "idle";

  return (
    <AnimatePresence>
      {open && !minimized && (
        <motion.div
          key="panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="panda-chat-title"
          initial={{ opacity: 0, y: 28, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.95 }}
          transition={{ duration: 0.45, ease }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              onClose();
            }
          }}
          className="panda-glass fixed inset-x-2 bottom-2 z-[60] flex h-[min(44rem,calc(100svh-1rem))] origin-bottom-right flex-col overflow-hidden rounded-[28px] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[min(42rem,calc(100svh-3rem))] sm:w-[25rem]"
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-line/70 px-3 py-3 sm:gap-3 sm:px-4">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl sm:size-16 bg-[radial-gradient(120%_90%_at_50%_100%,var(--color-tint),var(--color-surface-2)_75%)]">
              <DeskScene variant="avatar" showChip={false} className="size-full" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="panda-chat-title" className="truncate font-display text-base font-semibold tracking-[-0.01em]">
                {assistantConfig.name}
              </h2>
              <p className="flex items-center gap-1.5 truncate text-xs text-muted" aria-live="polite">
                <span
                  aria-hidden
                  className={`inline-block size-1.5 shrink-0 rounded-full ${mood === "sleeping" ? "bg-muted" : mood === "listening" ? "animate-pulse bg-accent" : "bg-emerald-500"}`}
                />
                {STATUS[mood]}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {voice.ttsSupported && (
                <IconButton label={voiceOn ? "Mute the panda's voice" : "Let the panda speak replies"} onClick={toggleVoice} pressed={voiceOn}>
                  {voiceOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                </IconButton>
              )}
              <IconButton label="Minimize chat" onClick={onMinimize}>
                <Minus className="size-4" />
              </IconButton>
              <IconButton label="Close chat" onClick={onClose}>
                <X className="size-4" />
              </IconButton>
            </div>
          </div>

          {/* Messages (data-lenis-prevent keeps wheel scrolling inside the list) */}
          <div ref={listRef} role="log" aria-label="Conversation" data-lenis-prevent className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap break-words px-4 py-2.5 text-[0.9rem] leading-relaxed ${
                    m.role === "user"
                      ? "rounded-[20px] rounded-br-md bg-accent-strong text-white"
                      : "rounded-[20px] rounded-bl-md border border-line/80 bg-surface-2/80 text-fg"
                  }`}
                >
                  {m.role === "assistant" ? <Linkified text={m.text} /> : m.text}
                  {m.nav && (
                    <button
                      type="button"
                      onClick={() => goTo(m.nav!)}
                      className="mt-2 flex min-h-9 items-center gap-1.5 rounded-full border border-accent/30 bg-tint px-3 py-1.5 text-xs font-medium text-accent-ink transition-colors hover:bg-accent-strong hover:text-white"
                    >
                      {/* → = this scrolls the page to that section */}
                      Go to {sectionById(m.nav)?.label} <ArrowRight aria-hidden className="size-3.5" />
                    </button>
                  )}
                  {m.note && <span className="mt-1.5 block text-[0.7rem] text-muted">{m.note}</span>}
                </div>
              </div>
            ))}

            {phase === "thinking" && (
              <div className="flex justify-start" aria-label="The panda is typing">
                <div className="flex items-center gap-1 rounded-[20px] rounded-bl-md border border-line/80 bg-surface-2/80 px-4 py-3.5">
                  <span className="panda-dot size-2 rounded-full bg-muted" />
                  <span className="panda-dot size-2 rounded-full bg-muted [animation-delay:.15s]" />
                  <span className="panda-dot size-2 rounded-full bg-muted [animation-delay:.3s]" />
                </div>
              </div>
            )}

            {userCount === 0 && (
              <div className="pt-1">
                <p className="mb-2 text-xs font-medium text-muted">Try asking</p>
                <div className="flex flex-wrap gap-2">
                  {assistantConfig.suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void send(s)}
                      disabled={busy}
                      className="min-h-11 rounded-full border border-line bg-surface px-3.5 py-2 text-left text-[0.8rem] text-fg/80 transition-colors hover:border-accent/40 hover:bg-tint hover:text-fg active:scale-[0.98] disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <p className="sr-only" aria-live="polite">
            {announce}
          </p>

          {/* Footer */}
          <div className="border-t border-line/70 px-3 pb-3 pt-2">
            {voice.speaking && (
              <div className="mb-2 flex items-center justify-between rounded-full bg-tint pl-3 text-xs text-fg/80">
                <span className="flex items-center gap-2">
                  <span className="panda-eq flex h-3 items-end gap-0.5" aria-hidden>
                    <span /> <span /> <span />
                  </span>
                  The panda is speaking
                </span>
                <button
                  type="button"
                  onClick={voice.stopSpeaking}
                  className="flex min-h-11 items-center gap-1 rounded-full px-4 font-medium text-accent-ink hover:underline"
                >
                  <Square aria-hidden className="size-3 fill-current" /> Stop
                </button>
              </div>
            )}
            {voice.micError && (
              <p role="alert" className="mb-2 rounded-2xl bg-tint px-3 py-2 text-xs text-warn">
                {voice.micError}
              </p>
            )}
            <form onSubmit={onSubmit} className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => (voice.listening ? voice.stopListening() : void voice.startListening())}
                disabled={busy && !voice.listening}
                aria-pressed={voice.listening}
                aria-label={voice.listening ? "Stop listening" : voice.sttSupported ? "Ask with your voice" : "Voice input isn't supported in this browser"}
                title={voice.sttSupported ? undefined : "Voice input isn't supported in this browser. Try Chrome, Edge or Safari."}
                className={`relative grid size-11 shrink-0 place-items-center rounded-full border transition-colors disabled:opacity-40 ${
                  voice.listening
                    ? "border-accent bg-accent text-white"
                    : "border-line bg-surface text-muted hover:border-accent/40 hover:text-fg"
                }`}
              >
                {voice.listening && <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-accent/40" />}
                {voice.sttSupported ? <Mic className="relative size-[18px]" /> : <MicOff className="relative size-[18px]" />}
              </button>
              <label htmlFor="panda-chat-input" className="sr-only">
                Message the panda
              </label>
              <textarea
                id="panda-chat-input"
                ref={inputRef}
                value={input}
                rows={1}
                maxLength={MAX_INPUT}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    onSubmit();
                  }
                }}
                placeholder={voice.listening ? "Listening… speak now" : "Ask about Rao Ali…"}
                data-lenis-prevent
                className="max-h-32 min-h-11 flex-1 resize-none rounded-[22px] border border-line bg-surface px-4 py-2.5 text-[0.9rem] leading-relaxed text-fg outline-none transition-colors placeholder:text-muted/80 focus:border-accent/50 [field-sizing:content]"
              />
              {busy ? (
                <button
                  type="button"
                  onClick={stop}
                  aria-label="Stop the reply"
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-fg text-ink transition-transform hover:scale-105"
                >
                  <Square className="size-4 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  aria-label="Send message"
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-white shadow-[0_8px_20px_-8px_rgb(254_79_2/0.7)] transition-all hover:scale-105 disabled:scale-100 disabled:opacity-40 disabled:shadow-none"
                >
                  <ArrowUp className="size-5" />
                </button>
              )}
            </form>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="text-[0.7rem] text-muted">Answers come from Rao Ali&apos;s portfolio. AI can make mistakes.</p>
              <button
                type="button"
                onClick={clearChat}
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-2 text-[0.75rem] font-medium text-muted transition-colors hover:text-fg"
              >
                <Trash2 aria-hidden className="size-3.5" /> Clear chat
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {open && minimized && (
        <motion.button
          key="pill"
          type="button"
          onClick={onRestore}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease }}
          aria-label={`Open the chat with ${assistantConfig.name}${unread ? ", new reply" : ""}`}
          className="fixed bottom-4 right-4 z-[60] flex items-center gap-2.5 rounded-full border border-line bg-surface py-1.5 pl-1.5 pr-4 shadow-[0_18px_40px_-14px_rgb(80_60_40/0.45)] sm:bottom-6 sm:right-6"
        >
          <PandaFace mood={mood} className="size-9" />
          <span className="text-left">
            <span className="block text-sm font-semibold leading-tight">{assistantConfig.name}</span>
            <span className="block text-[0.7rem] leading-tight text-muted">{unread ? "New reply. Tap to read" : STATUS[mood]}</span>
          </span>
          {unread && <span aria-hidden className="absolute right-2 top-1.5 size-2.5 rounded-full bg-accent ring-2 ring-surface" />}
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function IconButton({
  label,
  onClick,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className="grid size-11 place-items-center rounded-full text-muted sm:size-9 transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
    >
      {children}
    </button>
  );
}
