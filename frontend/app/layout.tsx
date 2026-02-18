import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Providers from "@/components/Providers";

/* ── Local Fonts — no Google Fonts dependency ───────────── */

const doto = localFont({
  src: "../fonts/Doto/Doto-VariableFont_ROND,wght.ttf",
  variable: "--font-doto",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const permanentMarker = localFont({
  src: "../fonts/Permanent_Marker/PermanentMarker-Regular.ttf",
  variable: "--font-marker",
  display: "swap",
  fallback: ["cursive"],
});

const caveat = localFont({
  src: "../fonts/Caveat_Brush/CaveatBrush-Regular.ttf",
  variable: "--font-caveat",
  display: "swap",
  fallback: ["cursive"],
});

const patrickHand = localFont({
  src: "../fonts/Patrick_Hand_SC/PatrickHandSC-Regular.ttf",
  variable: "--font-patrick",
  display: "swap",
  fallback: ["cursive"],
});

const nabla = localFont({
  src: "../fonts/Nabla/Nabla-Regular-VariableFont_EDPT,EHLT.ttf",
  variable: "--font-nabla",
  display: "swap",
  fallback: ["fantasy"],
});

/* ── Metadata ───────────────────────────────────────────── */

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "A.I.M.S. | AI Managed Solutions",
  description:
    "The Hybrid Business Architect. ACHEEVY orchestrates expert AI agents to run your business operations — CRM, automation, finance, and more.",
  keywords: [
    "AI",
    "automation",
    "agents",
    "ACHEEVY",
    "Boomer_Ang",
    "PMO",
    "AI management",
    "business intelligence",
    "plugs",
    "workflow",
  ],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_LANDING_URL || "https://plugmein.cloud"
  ),
  openGraph: {
    type: "website",
    siteName: "A.I.M.S.",
    title: "A.I.M.S. | AI Managed Solutions",
    description:
      "AI-powered management platform. ACHEEVY orchestrates 25 agents across 8 PMO offices. Voice-enabled, sandbox-ready.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "A.I.M.S. | AI Managed Solutions",
    description:
      "AI-powered management platform with ACHEEVY, Boomer_Ang agents, and the 3-6-9 pricing model.",
  },
  robots: { index: true, follow: true },
};

/* ── Root Layout ────────────────────────────────────────── */

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`
          ${doto.variable} ${permanentMarker.variable} ${caveat.variable}
          ${patrickHand.variable} ${nabla.variable}
          antialiased bg-[#0A0A0A] text-white/[0.92] font-sans overflow-x-hidden
        `}
      >
        <Providers>
          {/* Subtle background texture — never blocks content */}
          <div className="fixed inset-0 bg-grid pointer-events-none opacity-40 z-0" />
          <div className="fixed inset-0 vignette-overlay z-0" />

          {/* Main content */}
          <div className="relative z-10 flex flex-col min-h-screen">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
