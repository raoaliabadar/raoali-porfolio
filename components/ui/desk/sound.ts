/**
 * Tiny synthesized sound effects for the desk (Web Audio: no audio files to download).
 * Muted state is remembered per visitor. Audio only starts after a user gesture.
 */
export type DeskSound = "click" | "key" | "open" | "close" | "drawer" | "paper" | "boot" | "error" | "write" | "pop";

const KEY = "desk-sound-muted";
let ctx: AudioContext | null = null;
let muted: boolean | null = null;
const listeners = new Set<(m: boolean) => void>();

export function isMuted() {
  if (muted === null) {
    try {
      muted = localStorage.getItem(KEY) === "1";
    } catch {
      muted = false;
    }
  }
  return muted;
}

export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem(KEY, m ? "1" : "0");
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l(m));
}

export function onMutedChange(fn: (m: boolean) => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(a: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, gain: number, toFreq?: number) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (toFreq) o.frequency.exponentialRampToValueAtTime(toFreq, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(a.destination);
  o.start(start);
  o.stop(start + dur + 0.02);
}

function noise(a: AudioContext, start: number, dur: number, gain: number, filter: BiquadFilterType, freq: number) {
  const len = Math.max(1, Math.floor(a.sampleRate * dur));
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = filter;
  f.frequency.value = freq;
  const g = a.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(a.destination);
  src.start(start);
}

let lastWrite = 0;

export function playSound(kind: DeskSound) {
  if (isMuted()) return;
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  switch (kind) {
    case "click":
      tone(a, 1400, t, 0.05, "sine", 0.08);
      break;
    case "pop":
      tone(a, 600, t, 0.09, "sine", 0.1, 1100);
      break;
    case "key":
      tone(a, 2300, t, 0.03, "square", 0.025);
      noise(a, t, 0.025, 0.05, "highpass", 3000);
      break;
    case "open":
      tone(a, 520, t, 0.09, "sine", 0.07);
      tone(a, 780, t + 0.07, 0.12, "sine", 0.07);
      break;
    case "close":
      tone(a, 700, t, 0.08, "sine", 0.06);
      tone(a, 460, t + 0.06, 0.12, "sine", 0.06);
      break;
    case "drawer":
      noise(a, t, 0.32, 0.22, "lowpass", 500);
      tone(a, 90, t + 0.26, 0.12, "sine", 0.12);
      break;
    case "paper":
      noise(a, t, 0.22, 0.12, "bandpass", 2400);
      break;
    case "write": {
      const now = performance.now();
      if (now - lastWrite < 45) return; // throttle fast typing
      lastWrite = now;
      noise(a, t, 0.045, 0.05, "bandpass", 3800 + Math.random() * 1500);
      break;
    }
    case "boot":
      [523, 659, 784, 1047].forEach((f, i) => tone(a, f, t + i * 0.09, 0.35, "sine", 0.05));
      break;
    case "error":
      tone(a, 180, t, 0.18, "sawtooth", 0.05, 140);
      break;
  }
}
