import Link from "next/link";
import type { Route } from "next";
import { SearchPalette } from "./search";

export function Nav({ crumb }: { crumb?: { label: string; href?: Route } }) {
  return (
    <nav className="mb-8 flex items-center justify-between gap-4 border-b border-ink-800 pb-4">
      <div className="flex items-baseline gap-3">
        <Link href="/" className="font-mono text-sm font-semibold text-ink-100 hover:text-white">
          pm-os
        </Link>
        {crumb && (
          <>
            <span className="text-ink-600">/</span>
            {crumb.href ? (
              <Link href={crumb.href} className="text-sm text-ink-400 hover:text-ink-100">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-sm text-ink-300">{crumb.label}</span>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-1">
        <NavLink href="/">Library</NavLink>
        <NavLink href="/glossary">Glossary</NavLink>
        <NavLink href="/graph">Graph</NavLink>
        <NavLink href="/interviewer">Interviewer</NavLink>
        <span className="ml-1.5">
          <SearchPalette />
        </span>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: Route; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-1.5 text-sm text-ink-400 transition-colors hover:bg-ink-850 hover:text-ink-100"
    >
      {children}
    </Link>
  );
}
