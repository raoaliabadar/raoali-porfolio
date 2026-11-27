"use client";

import { CAR } from "@/components/blueprint/deskParts";

/**
 * The toy car's position along the desk. Two inputs add up: the hero's scroll progress
 * (0 → 1 drives it from one end of the desk to the other, backwards when scrolling up) and an
 * offset the visitor sets by dragging or tapping it. The result is clamped to the desk.
 */
type Listener = () => void;
const listeners = new Set<Listener>();
let scroll = 0;
let offset = 0;

const span = CAR.xMax - CAR.xMin;
const base = () => CAR.xMin + scroll * span;

export const carX = () => Math.min(CAR.xMax, Math.max(CAR.xMin, base() + offset));
/** Wheel turn in radians: distance rolled ÷ radius, so reversing rolls them back. */
export const carSpin = () => -(carX() - CAR.xMin) / CAR.wheel;

const emit = () => listeners.forEach((l) => l());
export const subscribeCar = (l: Listener) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

export function setCarScroll(p: number) {
  scroll = Math.min(1, Math.max(0, p));
  emit();
}
/** Move the car to x (dragging); keeps the offset inside the desk for the current scroll. */
export function setCarX(x: number) {
  offset = Math.min(CAR.xMax, Math.max(CAR.xMin, x)) - base();
  emit();
}
