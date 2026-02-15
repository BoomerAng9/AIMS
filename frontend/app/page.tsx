/**
 * A.I.M.S. Landing Page
 *
 * Clean, centered landing: Gold A.I.M.S. logo wallpaper,
 * "A.I.M.S. AI MANAGED SOLUTIONS" headline, two CTAs, three feature cards.
 */

import { Hero } from '@/components/landing/Hero';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/landing/Footer';
import FloatingChat from '@/components/FloatingChat';

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-full bg-ink">
      <SiteHeader />
      <Hero />
      <Footer />
      <FloatingChat />
    </main>
  );
}
