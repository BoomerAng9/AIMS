'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-800">
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
          Terms of Service
        </h1>
        <p className="text-sm text-slate-500 mb-12">
          Last updated: February 2026
        </p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">1. Acceptance of Terms</h2>
            <p className="text-slate-600 leading-relaxed">
              By accessing or using the A.I.M.S. (AI Managed Solutions) platform at plugmein.cloud,
              you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">2. Description of Service</h2>
            <p className="text-slate-600 leading-relaxed">
              A.I.M.S. is an AI-orchestrated Platform-as-a-Service that enables users to deploy
              containers, stacks, and full environments through ACHEEVY, our AI orchestrator.
              Services include one-click provisioning, monitoring, scaling, and decommissioning
              of containerized applications.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">3. User Accounts</h2>
            <p className="text-slate-600 leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials
              and for all activities that occur under your account. You must notify us immediately
              of any unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">4. Acceptable Use</h2>
            <p className="text-slate-600 leading-relaxed">
              You agree not to use A.I.M.S. for any unlawful purpose, to distribute malware,
              to attempt unauthorized access to other users&apos; resources, or to consume
              resources in a manner that degrades service for other users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">5. Intellectual Property</h2>
            <p className="text-slate-600 leading-relaxed">
              A.I.M.S. and all associated branding, code, and documentation are proprietary
              software owned by ACHIEVEMOR. You retain ownership of any content you deploy
              through the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">6. Service Availability</h2>
            <p className="text-slate-600 leading-relaxed">
              We strive for high availability but do not guarantee uninterrupted service.
              Maintenance windows and updates may temporarily affect availability. We will
              provide reasonable notice when possible.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">7. Limitation of Liability</h2>
            <p className="text-slate-600 leading-relaxed">
              A.I.M.S. is provided &ldquo;as is&rdquo; without warranties of any kind. We are
              not liable for any indirect, incidental, or consequential damages arising from
              your use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">8. Contact</h2>
            <p className="text-slate-600 leading-relaxed">
              For questions about these terms, contact us at{' '}
              <a href="mailto:admin@aimanagedsolutions.cloud" className="text-amber-600 hover:text-amber-700 underline">
                admin@aimanagedsolutions.cloud
              </a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
