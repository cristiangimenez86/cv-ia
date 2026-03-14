import { redirect } from "next/navigation";
import { loadSiteConfig } from "@/lib/content/loader";

/**
 * Root page redirects to the default locale so the CV is always under /es or /en.
 */
export default function RootPage() {
  const config = loadSiteConfig();
  redirect(`/${config.defaultLocale}`);
}
