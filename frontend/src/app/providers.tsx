"use client";

import { ThemeProvider } from "next-themes";
import { PaletteProvider } from "@/components/PaletteProvider";
import { DynamicFavicon } from "@/components/DynamicFavicon";

type Props = {
  children: React.ReactNode;
};

export function Providers({ children }: Props) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="cv.theme"
    >
      <PaletteProvider>
        <DynamicFavicon />
        {children}
      </PaletteProvider>
    </ThemeProvider>
  );
}
