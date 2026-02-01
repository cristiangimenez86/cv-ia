import type { ReactNode } from "react";

/**
 * Layout for locale-scoped CV page. Passes through children; root layout provides html/body.
 */
export default function LocaleLayout({ children }: { children: ReactNode }) {
  return children;
}
