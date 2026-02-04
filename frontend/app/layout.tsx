import "./globals.css";
import type { ReactNode } from "react";
import { LogoWallBackground } from "@/components/LogoWallBackground";
import { SiteFooter } from "@/components/SiteFooter";
import type { Metadata } from 'next';
import { Inter, Permanent_Marker, Caveat } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
// const doto = Doto({ subsets: ['latin'], variable: '--font-doto' });
const marker = Permanent_Marker({ 
  weight: '400',
  subsets: ['latin'], 
  variable: '--font-marker' 
});
const caveat = Caveat({ 
  subsets: ['latin'], 
  variable: '--font-caveat' 
});

export const metadata: Metadata = {
  title: 'A.I.M.S. | Hybrid Business Architect',
  description: 'AI Managed Systems powered by ACHEEVY',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${marker.variable} ${caveat.variable} antialiased min-h-screen bg-obsidian text-slate-200 font-sans`}>
        <LogoWallBackground mode="hero">
          {children}
        </LogoWallBackground>
        <SiteFooter />
      </body>
    </html>
  );
}
