"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type NavItem = { id: string; title: string };

type NavLinksProps = {
  navItems: NavItem[];
};

/**
 * Nav links with scroll-spy: active link shows blue underline based on section in view.
 * Hash links (click) take priority when the target section is in view.
 */
export function NavLinks({ navItems }: NavLinksProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const hashPriorityUntil = useRef(0);

  useEffect(() => {
    const activationLine = 120;

    function getActiveSection() {
      let bestId: string | null = null;
      let bestTop = -Infinity;

      for (const item of navItems) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= activationLine && top > bestTop) {
          bestTop = top;
          bestId = item.id;
        }
      }
      if (bestId === null) {
        bestTop = Infinity;
        for (const item of navItems) {
          const el = document.getElementById(item.id);
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          const top = rect.top;
          const bottom = rect.bottom;
          const isVisible = top < window.innerHeight && bottom > 0;
          if (isVisible && top < bestTop) {
            bestTop = top;
            bestId = item.id;
          }
        }
      }
      return bestId;
    }

    function updateActive() {
      const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
      const hashMatchesNav = hash && navItems.some((i) => i.id === hash);
      const hashEl = hashMatchesNav ? document.getElementById(hash) : null;
      const hashInView =
        hashEl &&
        (() => {
          const r = hashEl.getBoundingClientRect();
          return r.top < window.innerHeight && r.bottom > 0;
        })();

      if (hashMatchesNav && hashInView) {
        setActiveId(hash);
        return;
      }
      if (hashMatchesNav && Date.now() < hashPriorityUntil.current) {
        setActiveId(hash);
        return;
      }
      const scrollId = getActiveSection();
      if (scrollId) setActiveId(scrollId);
    }

    function onHashChange() {
      hashPriorityUntil.current = Date.now() + 400;
      updateActive();
    }

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("hashchange", onHashChange);
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
