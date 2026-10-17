"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import { SECTION_ICONS } from "@/components/sectionIcons";

type NavItem = { id: string; title: string };

export function NavLinks({ navItems }: { navItems: NavItem[] }) {
  const [activeId, setActiveId] = useState(navItems[0]?.id ?? "inicio");

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let next = navItems[0]?.id ?? "inicio";
      for (const item of navItems) {
        const element = document.getElementById(item.id);
        if (element && element.getBoundingClientRect().top <= 180) next = item.id;
      }
      setActiveId(next);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
    };
  }, [navItems]);

  return (
    <nav className="cv-nav" aria-label="CV sections">
      {navItems.map((item) => {
        const Icon = item.id === "inicio" ? Home : SECTION_ICONS[item.id];
        return (
          <Link
            key={item.id}
            href={`#${item.id}`}
            onClick={() => setActiveId(item.id)}
            aria-current={activeId === item.id ? "location" : undefined}
            className={`cv-nav-link ${activeId === item.id ? "is-active" : ""}`}
          >
            {Icon && <Icon size={18} strokeWidth={1.6} aria-hidden />}
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
