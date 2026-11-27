"use client";

/** Open the desk's reading and writing views from anywhere (hero hotspots, nav…). */
export const BOOKS_EVENT = "ledger:books";
export const NOTE_EVENT = "ledger:note";

export const openBooks = (index = 0) => window.dispatchEvent(new CustomEvent<number>(BOOKS_EVENT, { detail: index }));
export const openNote = () => window.dispatchEvent(new Event(NOTE_EVENT));
