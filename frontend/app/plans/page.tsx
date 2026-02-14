import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/landing/Footer';

export const metadata = {
  title: 'Plans | A.I.M.S.',
  description: 'Choose your A.I.M.S. plan — Free, Pro, or Enterprise.',
};

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    description: 'Get started. Chat with ACHEEVY, explore the platform.',
    features: ['Chat with ACHEEVY', 'Basic agent access', 'Community support'],
  },
  {
    name: 'Pro',
    price: '$29/mo',
    description: 'Full access to the Boomer_Angs and automation workflows.',
    features: ['Everything in Free', 'Boomer_Ang deployments', 'Custom workflows', 'Priority support'],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Contact us',
    description: 'White-glove deployment for your organization.',
    features: ['Everything in Pro', 'Dedicated infrastructure', 'SLA guarantee', 'Custom integrations'],
  },
];

export default function PlansPage() {
  return (
    <main className="flex flex-col min-h-full bg-ink">
      <SiteHeader />
      <section className="flex-1 px-4 py-20 max-w-5xl mx-auto w-full">
        <h1
          className="text-4xl md:text-6xl text-white/90 mb-2 tracking-[0.08em] text-center"
          style={{ fontFamily: 'var(--font-marker), "Permanent Marker", cursive' }}
        >
          Plans
        </h1>
        <p className="text-sm text-white/30 text-center mb-12">
          Choose your level.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-6 flex flex-col ${
                plan.highlighted
                  ? 'border-gold/40 bg-gold/[0.03]'
                  : 'border-white/[0.06] bg-white/[0.02]'
              }`}
            >
              <h2
                className="text-lg font-bold text-white mb-1"
                style={{ fontFamily: 'var(--font-doto), "Doto", monospace' }}
              >
                {plan.name}
              </h2>
              <p className="text-2xl font-bold text-gold/80 mb-3">{plan.price}</p>
              <p className="text-sm text-white/40 mb-6">{plan.description}</p>
              <ul className="space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-white/50 flex items-start gap-2">
                    <span className="text-gold/60 mt-0.5">&#x2713;</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
