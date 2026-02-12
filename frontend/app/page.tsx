/**
 * A.I.M.S. Landing Page
 *
 * Clean, centered landing: Gold ACHIEVEMOR logo wallpaper,
 * "A.I.M.S. AI MANAGED SYSTEMS" headline, two CTAs, three feature cards.
 */

import { Hero } from '@/components/landing/Hero';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/landing/Footer';
import FloatingChat from '@/components/FloatingChat';

export default function HomePage() {
  return (
    <main className="min-h-full bg-[#0A0A0A]">
      <SiteHeader />
      <Hero />
      <Footer />
      <FloatingChat />
    </main>
  );
}
