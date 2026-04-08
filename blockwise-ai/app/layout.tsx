import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blockwise AI — Neighborhood Intelligence",
  description: "Find properties, analyze neighborhoods deeper than Redfin/Zillow/MLS, run flip calculations, and automate K1 tax reporting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-[#0A0A0F] text-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
