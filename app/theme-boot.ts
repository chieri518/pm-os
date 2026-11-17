/**
 * Runs in <head> before first paint: re-applies a theme the visitor chose with the
 * toggle. Lives outside the "use client" toggle module because the server layout
 * needs the string itself, not a client reference to it. Tiny and dependency-free
 * on purpose.
 */
export const THEME_BOOT = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
