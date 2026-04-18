"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type NavItem = { id: string; title: string };

type NavLinksProps = {
  navItems: NavItem[];
};

/**
 * Nav with scroll-spy.
 *
 * Two signals decide the active link:
 *  1. **IntersectionObserver** — tracks which sections cross an "activation
 *     line" near the top of the viewport (`rootMargin: "-120px 0px -55% 0px"`).
 *     This avoids per-pixel scroll work and is far cheaper than a scroll
 *     listener.
 *  2. **`hashchange` / link clicks** — give the targeted hash priority for a
 *     short window so the chosen link feels "sticky" while smooth-scrolling.
 */
export function NavLinks({ navItems }: NavLinksProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const hashPriorityUntil = useRef(0);
  /** Last known intersection ratio per section, used to pick the most-visible one. */
  const visibleSections = useRef(new Map<string, number>());

  useEffect(() => {
    const elements = navItems
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    function pickActive(): string | null {
      let bestId: string | null = null;
      let bestRatio = 0;
      for (const [id, ratio] of visibleSections.current) {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestId = id;
        }
      }
      return bestId;
    }

    function applyActive() {
      const hash = window.location.hash.slice(1);
      if (
        hash &&
        navItems.some((i) => i.id === hash) &&
        Date.now() < hashPriorityUntil.current
      ) {
        setActiveId(hash);
        return;
      }
      const next = pickActive();
      if (next) setActiveId(next);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) {
            visibleSections.current.set(id, entry.intersectionRatio);
          } else {
            visibleSections.current.delete(id);
          }
        }
        applyActive();
      },
      {
        /* Activation line ~120px from top, with the bottom 55% of the viewport
         * ignored so a section is "active" once its top has scrolled into the
         * upper portion of the screen. */
        rootMargin: "-120px 0px -55% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const el of elements) observer.observe(el);

    function onHashChange() {
      hashPriorityUntil.current = Date.now() + 400;
      applyActive();
    }

    window.addEventListener("hashchange", onHashChange);
    applyActive();

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", onHashChange);
      visibleSections.current.clear();
    };
  }, [navItems]);

  return (
    <nav
      className="hidden md:flex items-center gap-6 whitespace-nowrap"
      aria-label="CV sections"
    >
      {navItems.map((item) => {
        const isActive = activeId === item.id;
        return (
          <Link
            key={item.id}
            href={`#${item.id}`}
            onClick={() => {
              setActiveId(item.id);
              hashPriorityUntil.current = Date.now() + 600;
            }}
            className={`nav-link text-sm font-semibold whitespace-nowrap transition-colors ${
              isActive
                ? "text-primary nav-link-active"
                : "text-foreground hover:text-primary"
            }`}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
