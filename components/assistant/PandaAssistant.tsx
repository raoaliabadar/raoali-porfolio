"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { assistantConfig } from "@/lib/assistant/config";
import { ease } from "@/lib/motion";
import { pandaReact } from "@/lib/panda";
import { useIdleSleep } from "./idle";
import { PandaFace, usePandaMood } from "./PandaFace";

// The chat panel (and the 3D panda in its header) only loads when a visitor first opens it.
const loadPanel = () => import("./ChatPanel");
const ChatPanel = dynamic(loadPanel, { ssr: false });

const VISITED_KEY = "panda:visited";
const GREETED_KEY = "panda:greeted";

/**
 * Floating panda assistant: the launcher button, the first-visit welcome,
 * the sleep/wake timer, and the (lazy) chat panel.
 */
export function PandaAssistant() {
  const [mounted, setMounted] = useState(false); // panel code requested at least once
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const [wiggle, setWiggle] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const mood = usePandaMood();

  useIdleSleep();

  // Welcome: a wave + speech bubble for first-time visitors, a shorter hello for returning ones.
  useEffect(() => {
    let first = false;
    let greeted = false;
    try {
      first = !localStorage.getItem(VISITED_KEY);
      greeted = !!sessionStorage.getItem(GREETED_KEY);
    } catch {
      /* storage blocked — treat as a returning visitor */
    }
    if (greeted) return;
    const show = setTimeout(() => {
      // Remember only once the welcome actually played (safe with StrictMode's double effects).
      try {
        localStorage.setItem(VISITED_KEY, "1");
        sessionStorage.setItem(GREETED_KEY, "1");
      } catch {
        /* ignore */
      }
      setBubble(first ? "Hi! I'm Rao Ali's panda 👋 Ask me anything about his work!" : "Welcome back! 🐼 Need a hand?");
      setWiggle(true);
      pandaReact("wave", first ? "Welcome! 👋" : "Welcome back! 🐼");
    }, first ? 2600 : 1800);
    const hide = setTimeout(() => setBubble(null), first ? 11000 : 7000);
    const still = setTimeout(() => setWiggle(false), first ? 5200 : 4200);
    return () => [show, hide, still].forEach(clearTimeout);
  }, []);

  const openChat = useCallback(() => {
    setMounted(true);
    setOpen(true);
    setMinimized(false);
    setBubble(null);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setMinimized(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.div
            key="launcher"
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 20 }}
            transition={{ duration: 0.45, ease }}
            className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6"
          >
            <AnimatePresence>
              {bubble && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.4, ease }}
                  className="panda-glass relative max-w-[16rem] origin-bottom-right rounded-[20px] rounded-br-md py-3 pl-4 pr-9 text-sm leading-snug"
                  role="status"
                >
                  <button type="button" onClick={openChat} className="text-left">
                    {bubble}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBubble(null)}
                    aria-label="Dismiss"
                    className="absolute right-2 top-2 grid size-6 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg"
                  >
                    <X className="size-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              ref={launcherRef}
              type="button"
              onClick={openChat}
              onPointerEnter={() => void loadPanel()}
              onFocus={() => void loadPanel()}
              aria-label={`Chat with ${assistantConfig.name}`}
              aria-haspopup="dialog"
              className={`group relative grid size-16 place-items-center rounded-full border border-line bg-surface shadow-[0_18px_40px_-14px_rgb(80_60_40/0.45)] transition-transform duration-300 hover:-translate-y-0.5 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${
                wiggle ? "panda-wiggle" : ""
              }`}
            >
              <span aria-hidden className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_70%,var(--color-glow),transparent_70%)] opacity-70" />
              <PandaFace mood={mood} className="relative size-12" />
              <span
                aria-hidden
                className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-accent text-[0.6rem] font-bold text-white ring-2 ring-surface"
              >
                AI
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {mounted && (
        <ChatPanel
          open={open}
          minimized={minimized}
          onMinimize={() => setMinimized(true)}
          onRestore={() => setMinimized(false)}
          onClose={close}
        />
      )}
    </>
  );
}
