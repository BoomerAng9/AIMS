import "./globals.css";
import type { ReactNode } from "react";
import { LogoWallBackground } from "@/components/LogoWallBackground";
import { SiteFooter } from "@/components/SiteFooter";
import Providers from "@/components/Providers";
import FloatingChat from "@/components/FloatingChat";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'A.I.M.S. | AI Managed Solutions',
  description: 'AI Managed Solutions powered by ACHEEVY',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Caveat:wght@400..700&family=Permanent+Marker&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-obsidian text-slate-200 font-sans">
        <Providers>
          <LogoWallBackground mode="hero">
            {children}
          </LogoWallBackground>
          <SiteFooter />
          <FloatingChat />
        </Providers>
      </body>
    </html>
  );
}
