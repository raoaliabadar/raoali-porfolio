export type Theme = "light" | "dark";
export const THEME_KEY = "theme";

/** Runs before paint (inlined in <head>) so the saved theme never flashes. */
export const themeInitScript = `try{if(localStorage.getItem("${THEME_KEY}")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;
