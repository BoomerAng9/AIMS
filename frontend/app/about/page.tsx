import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/landing/Footer';

export const metadata = {
  title: 'About | A.I.M.S.',
  description: 'About AI Managed Solutions — the mission, the team, the vision.',
};

export default function AboutPage() {
  return (
    <main className="flex flex-col min-h-full bg-ink">
      <SiteHeader />
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 max-w-3xl mx-auto">
        <h1
          className="text-4xl md:text-6xl text-white/90 mb-4 tracking-[0.08em] text-center"
          style={{ fontFamily: 'var(--font-marker), "Permanent Marker", cursive' }}
        >
          About A.I.M.S.
        </h1>
        <p className="text-lg text-gold/60 mb-8 text-center" style={{ fontFamily: 'var(--font-doto), "Doto", monospace' }}>
          Think It. Prompt It. Let&apos;s Build It.
        </p>
        <div className="space-y-6 text-white/50 text-sm leading-relaxed">
          <p>
            A.I.M.S. (AI Managed Solutions) is an AI-orchestrated platform where ACHEEVY — your executive AI
            assistant — manages a fleet of specialized agents called the Boomer_Angs.
          </p>
          <p>
            Together they automate workflows, deploy applications, and keep your infrastructure running.
            No back doors. No shortcuts. Evidence-based execution — every task requires proof of completion.
          </p>
          <p>
            Built by ACHIEVEMOR. Orchestrated by ACHEEVY. Powered by the Chain of Command.
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
