import "./globals.css";
import type { ReactNode } from "react";
import { LogoWallBackground } from "@/components/LogoWallBackground";
import { SiteFooter } from "@/components/SiteFooter";
import type { Metadata } from 'next';
import { Inter, Doto } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const doto = Doto({ subsets: ['latin'], variable: '--font-doto' });

export const metadata: Metadata = {
  title: 'A.I.M.S. | Hybrid Business Architect',
  description: 'AI Managed Systems powered by ACHEEVY',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${doto.variable} antialiased min-h-screen bg-obsidian text-slate-200 font-sans`}>
        <LogoWallBackground mode="hero">
          {children}
        </LogoWallBackground>
        <SiteFooter />
      </body>
    </html>
  );
}
