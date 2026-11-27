/** Inline script for <head>: applies the stored theme before first paint (no flash). */
export const THEME_INIT = `try{var t=localStorage.getItem("ledger:theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t;}catch(e){}`;
