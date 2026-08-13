import Link from "next/link";
import type { Route } from "next";
import { SearchPalette } from "./search";
import { Logo } from "./logo";

const LINKS: { href: Route; label: string }[] = [
  { href: "/" as Route, label: "Library" },
  { href: "/glossary" as Route, label: "Glossary" },
  { href: "/graph" as Route, label: "Graph" },
  { href: "/interviewer" as Route, label: "Interviewer" },
];

/**
 * Two rows on small screens, one on wide.
 *
 * The previous single-row version was the cause of the site-wide mobile overflow:
 * four links plus the search button in a non-wrapping flex forced roughly 450px of
 * intrinsic width, and because that sat above every page, the whole document
 * inherited the overflow — which is why body copy was clipped on pages that had
 * nothing wrong with them.
 *
 * The link row scrolls horizontally rather than wrapping, so adding a fifth
 * destination later cannot re-break the layout.
 */
export function Nav({ crumb }: { crumb?: { label: string; href?: Route } }) {
  return (
    <nav className="mb-8 border-b border-ink-800 pb-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            href={"/" as Route}
            className="flex shrink-0 items-center gap-2 text-live-400 transition-opacity hover:opacity-80"
            aria-label="pm-os home"
          >
            <Logo />
            <span className="font-mono text-sm font-semibold tracking-tight text-ink-100">
              pm&#8209;os
            </span>
          </Link>
          {crumb && (
            <>
              <span aria-hidden className="shrink-0 text-ink-600">
                /
              </span>
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="truncate text-sm text-ink-400 hover:text-ink-100"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="truncate text-sm text-ink-300">{crumb.label}</span>
              )}
            </>
          )}
        </div>
        <div className="shrink-0">
          <SearchPalette />
        </div>
      </div>

      <div className="-mx-4 mt-2 overflow-x-auto px-4 sm:-mx-6 sm:mt-1 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max items-center gap-0.5">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-2.5 py-1.5 text-sm text-ink-400 transition-colors hover:bg-ink-850 hover:text-ink-100"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
