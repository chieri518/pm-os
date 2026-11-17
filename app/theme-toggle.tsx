"use client";

/**
 * Light / dark switch.
 *
 * With no choice made, the site follows the system setting. Clicking stores an
 * explicit choice, which the inline script in the root layout re-applies before
 * first paint on later visits, so a dark-mode reader never sees a light flash.
 *
 * Which icon shows is decided by CSS (see globals.css), not by React state, so the
 * server-rendered markup is identical for every visitor and nothing mismatches on
 * hydration.
 */
export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const explicit = root.dataset.theme;
    const isDark = explicit
      ? explicit === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = isDark ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* private mode or blocked storage: the choice lasts for this page only */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between light and dark theme"
      title="Switch theme"
      className="grid size-8 place-items-center rounded-lg border border-ink-800 bg-ink-900 text-ink-400 transition-colors hover:border-ink-600 hover:text-ink-100"
    >
      <svg className="theme-moon size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      <svg className="theme-sun size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

