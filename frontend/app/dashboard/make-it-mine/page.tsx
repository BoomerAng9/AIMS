// frontend/app/dashboard/make-it-mine/page.tsx
import Link from 'next/link';

const PROJECT_TYPES = [
  {
    id: 'diy',
    title: 'DIY Projects',
    description: 'Hands-on home projects with voice and vision guidance',
    icon: '🔧',
    href: '/dashboard/make-it-mine/diy',
    features: ['Voice interaction', 'Camera guidance', 'Step-by-step help'],
  },
  {
    id: 'web-app',
    title: 'Web Application',
    description: 'Build a custom web application from scratch',
    icon: '🌐',
    href: '/dashboard/make-it-mine/web-app',
    features: ['Full-stack development', 'Deployment included', 'Custom domain'],
    comingSoon: true,
  },
  {
    id: 'mobile-app',
    title: 'Mobile App',
    description: 'Create iOS or Android applications',
    icon: '📱',
    href: '/dashboard/make-it-mine/mobile-app',
    features: ['Cross-platform', 'App store ready', 'Push notifications'],
    comingSoon: true,
  },
  {
    id: 'automation',
    title: 'Automation',
    description: 'Automate repetitive tasks and workflows',
    icon: '⚡',
    href: '/dashboard/make-it-mine/automation',
    features: ['n8n integration', 'API connections', 'Scheduled tasks'],
    comingSoon: true,
  },
];

export default function MakeItMinePage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">Make It Mine</h1>
        <p className="mt-2 text-white/50">
          Choose a project type and let A.I.M.S. guide you through the creation process
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PROJECT_TYPES.map((project) => (
          <Link
            key={project.id}
            href={project.comingSoon ? '#' : project.href}
            className={`
              group relative overflow-hidden rounded-2xl border p-6
              transition-all duration-300
              ${project.comingSoon
                ? 'border-wireframe-stroke bg-white/[0.02] cursor-not-allowed opacity-60'
                : 'border-gold/20 bg-white/[0.03] hover:border-gold/20 hover:bg-white/[0.05]'
              }
            `}
          >
            {project.comingSoon && (
              <span className="absolute top-4 right-4 text-[0.65rem] uppercase tracking-wider text-gold bg-gold/10 px-2 py-1 rounded">
                Coming Soon
              </span>
            )}

            <div className="flex items-start gap-4">
              <span className="text-4xl">{project.icon}</span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-white group-hover:text-gold transition-colors">
                  {project.title}
                </h2>
                <p className="mt-1 text-sm text-white/40">
                  {project.description}
                </p>

                <ul className="mt-4 flex flex-wrap gap-2">
                  {project.features.map((feature) => (
                    <li
                      key={feature}
                      className="text-[0.7rem] text-white/30 bg-white/5 px-2 py-1 rounded"
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
