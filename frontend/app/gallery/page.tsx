import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/landing/Footer';
import Image from 'next/image';

export const metadata = {
  title: 'Gallery | A.I.M.S.',
  description: 'Meet the crew — ACHEEVY, LUC, the Boomer_Angs, Chicken Hawk, and the Lil_Hawks.',
};

const GALLERY_ITEMS = [
  { src: '/images/acheevy/acheevy-helmet.png', alt: 'ACHEEVY', label: 'ACHEEVY' },
  { src: '/images/acheevy/hero-character.png', alt: 'ACHEEVY Hero', label: 'ACHEEVY — Hero Mode' },
  { src: '/images/boomerangs/ACHEEVY and the Boomer_Angs in a Hanger.png', alt: 'The Crew in the Hangar', label: 'The Hangar' },
  { src: '/images/boomerangs/Boomer_ang on Assignment.JPG', alt: 'Boomer_Ang on Assignment', label: 'On Assignment' },
  { src: '/images/boomerangs/Boomer_Angs.png', alt: 'Boomer_Angs', label: 'Boomer_Angs' },
  { src: '/images/luc/luc-logo.png', alt: 'LUC', label: 'LUC' },
];

export default function GalleryPage() {
  return (
    <main className="flex flex-col min-h-full bg-ink">
      <SiteHeader />
      <section className="flex-1 px-4 py-20 max-w-6xl mx-auto w-full">
        <h1
          className="text-4xl md:text-6xl text-white/90 mb-2 tracking-[0.08em] text-center"
          style={{ fontFamily: 'var(--font-marker), "Permanent Marker", cursive' }}
        >
          Gallery
        </h1>
        <p className="text-sm text-white/30 text-center mb-12">
          Meet the crew.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GALLERY_ITEMS.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-gold/20 transition-colors"
            >
              <div className="aspect-square relative">
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <p
                  className="text-sm font-bold text-white/80"
                  style={{ fontFamily: 'var(--font-doto), "Doto", monospace' }}
                >
                  {item.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
