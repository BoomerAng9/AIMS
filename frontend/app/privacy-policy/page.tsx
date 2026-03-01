import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-800">
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-12"
        >
          Back to Home
        </Link>

        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-500 mb-12">Last updated: February 2026</p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">1. Information We Collect</h2>
            <p className="text-slate-600 leading-relaxed">
              When you use A.I.M.S., we collect information you provide directly (account details,
              deployment configurations) and usage data (feature interactions, container metrics,
              API call patterns) to improve our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">2. How We Use Your Information</h2>
            <p className="text-slate-600 leading-relaxed">
              We use collected information to provide and improve A.I.M.S. services, manage your
              deployments, communicate updates, enforce our terms, and ensure platform security.
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">3. Data Storage & Security</h2>
            <p className="text-slate-600 leading-relaxed">
              Your data is stored on secured infrastructure with encryption at rest and in transit.
              Deployed container data remains within your allocated resources. We implement
              industry-standard security measures including role-based access control, audit
              logging, and Secure Drop Tokens (SDTs) for artifact delivery.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">4. AI Processing</h2>
            <p className="text-slate-600 leading-relaxed">
              ACHEEVY, our AI orchestrator, processes your requests to manage deployments and
              services. Conversations with ACHEEVY may be analyzed to improve service quality.
              AI inference runs through secured endpoints and your data is not used to train
              third-party models.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">5. Third-Party Services</h2>
            <p className="text-slate-600 leading-relaxed">
              A.I.M.S. integrates with third-party services (cloud providers, AI model endpoints)
              to deliver functionality. Each third-party service has its own privacy policy.
              We share only the minimum data necessary for service operation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">6. Your Rights</h2>
            <p className="text-slate-600 leading-relaxed">
              You have the right to access, correct, or delete your personal data. You may export
              your deployment configurations at any time. To exercise these rights, contact us at
              the address below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">7. Cookies & Analytics</h2>
            <p className="text-slate-600 leading-relaxed">
              We use essential cookies for authentication and session management. Analytics data is
              collected in aggregate to understand usage patterns and improve the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">8. Contact</h2>
            <p className="text-slate-600 leading-relaxed">
              For privacy inquiries, contact us at{' '}
              <a
                href="mailto:admin@aimanagedsolutions.cloud"
                className="text-amber-600 hover:text-amber-700 underline"
              >
                admin@aimanagedsolutions.cloud
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
