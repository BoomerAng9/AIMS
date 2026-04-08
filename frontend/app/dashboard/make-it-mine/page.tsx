// frontend/app/dashboard/make-it-mine/page.tsx
import Link from 'next/link';

const PROJECT_TYPES = [
  {
    id: 'deep-scout',
    title: 'Deep Scout',
    description: 'AI research engine — validate ideas, clone competitors, and map markets before building',
    icon: '🔬',
    href: '/dashboard/deep-scout',
    features: ['4-step idea validation', 'Competitor research', 'Clone & adaptation plans', 'Scrollytelling reports'],
    recommended: true,
  },
  {
    id: 'creative-studio',
    title: 'Creative Studio',
    description: 'AI-powered creative builds with the NtNtN Engine — from brief to deployed site',
    icon: '✨',
    href: '/dashboard/ntntn-studio',
    features: ['NtNtN Engine', '3-pillar pipeline', 'Buildsmith delivery', 'Live preview'],
  },
  {
    id: 'web-app',
    title: 'Web Application',
    description: 'AI-powered web app builder — describe your idea and ACHEEVY builds it live',
    icon: '🌐',
    href: '/dashboard/make-it-mine/web-app',
    features: ['AI code generation', 'Live preview', 'Iterative editing', 'Plug deployment'],
  },
  {
    id: 'diy',
    title: 'DIY Projects',
    description: 'Hands-on home projects with voice and vision guidance',
    icon: '🔧',
    href: '/dashboard/make-it-mine/diy',
    features: ['Voice interaction', 'Camera guidance', 'Step-by-step help'],
  },
  {
    id: 'mobile-app',
    title: 'Mobile App',
    description: 'Create iOS or Android applications',
    icon: '📱',
    href: '/dashboard/make-it-mine/mobile-app',
    features: ['Cross-platform', 'App store ready', 'Push notifications'],
  },
  {
    id: 'automation',
    title: 'Automation',
    description: 'Automate repetitive tasks and workflows',
    icon: '⚡',
    href: '/dashboard/make-it-mine/automation',
    features: ['n8n integration', 'API connections', 'Scheduled tasks'],
  },
];

export default function MakeItMinePage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Make It Mine</h1>
        <p className="mt-2 text-zinc-400">
          Deep Universal Meticulous Build — research, validate, build, and deploy real software
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PROJECT_TYPES.map((project) => (
          <Link
            key={project.id}
            href={project.href}
            className={`
              group relative overflow-hidden rounded-2xl border p-6
              transition-all duration-300
              border-gold/20 bg-[#111113] hover:border-gold/20 hover:bg-white/5
            `}
          >
            {(project as any).recommended && (
              <span className="absolute top-4 right-4 text-[0.65rem] uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
                Recommended
              </span>
            )}

            <div className="flex items-start gap-4">
              <span className="text-4xl">{project.icon}</span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-zinc-100 group-hover:text-gold transition-colors">
                  {project.title}
                </h2>
                <p className="mt-1 text-base font-medium text-zinc-400">
                  {project.description}
                </p>

                <ul className="mt-4 flex flex-wrap gap-2">
                  {project.features.map((feature) => (
                    <li
                      key={feature}
                      className="text-[0.7rem] text-zinc-500 bg-[#18181B] px-2 py-1 rounded"
                    >
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
