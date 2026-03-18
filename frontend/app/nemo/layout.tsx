import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FOAI — Future of AI",
  description:
    "The future of artificial intelligence is private, governed, and autonomous. FOAI delivers next-generation AI infrastructure powered by NVIDIA NemoClaw.",
  keywords: ["AI", "future", "NemoClaw", "NVIDIA", "private AI", "autonomous agents", "intelligence"],
  openGraph: {
    title: "FOAI — Future of AI",
    description: "Private. Autonomous. Governed. The future of AI is here.",
    siteName: "FOAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FOAI — Future of AI",
    description: "Private. Autonomous. Governed. The future of AI is here.",
  },
  robots: { index: true, follow: true },
};

export default function NemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="foai-root">
      {children}
    </div>
  );
}
