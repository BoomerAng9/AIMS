import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/landing/Footer';

export const metadata = {
  title: 'The Book of V.I.B.E. | A.I.M.S.',
  description: 'The origin story of A.I.M.S. — how ACHEEVY, LUC, and the Boomer_Angs came to be.',
};

export default function BookOfVibePage() {
  return (
    <main className="flex flex-col min-h-full bg-ink">
      <SiteHeader />
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <h1
          className="text-4xl md:text-6xl text-white/90 mb-4 tracking-[0.08em] text-center"
          style={{ fontFamily: 'var(--font-marker), "Permanent Marker", cursive' }}
        >
          The Book of V.I.B.E.
        </h1>
        <p className="text-lg text-gold/60 mb-2 text-center" style={{ fontFamily: 'var(--font-doto), "Doto", monospace' }}>
          Vision &middot; Implementation &middot; Build &middot; Execute
        </p>
        <p className="text-sm text-white/30 max-w-md text-center mt-4">
          The origin story is being written. Check back soon.
        </p>
      </section>
      <Footer />
    </main>
  );
}
