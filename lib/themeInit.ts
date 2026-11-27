/**
 * Inline script for <head>: applies the stored theme and desk-lamp state before first paint (no flash), and makes
 * every visit start at the top of the page (no restored scroll position, no #hash jump).
 */
export const THEME_INIT = `try{var t=localStorage.getItem("ledger:theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t;document.documentElement.dataset.lamp=localStorage.getItem("ledger:lamp")==="on"?"on":"off";}catch(e){}try{if("scrollRestoration"in history)history.scrollRestoration="manual";if(location.hash)history.replaceState(null,"",location.pathname+location.search);window.scrollTo(0,0);}catch(e){}`;
