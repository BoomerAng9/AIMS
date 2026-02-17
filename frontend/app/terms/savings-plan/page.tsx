/**
 * Terms & Conditions — Savings Plan
 * plugmein.cloud/terms/savings-plan
 *
 * Explains the mandatory fee structure and how 70% of fees
 * are returned to users via the A.I.M.S. Savings Plan.
 */

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Savings Plan Terms — A.I.M.S.",
  description:
    "Terms and conditions for the A.I.M.S. Savings Plan — how platform fees fund your account savings.",
};

export default function SavingsPlanTermsPage() {
  return (
    <main className="min-h-screen bg-obsidian text-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          A.I.M.S. Savings Plan
        </h1>
        <p className="text-sm text-white/50 mb-10">
          Terms &amp; Conditions — Effective February 2026
        </p>

        {/* Section 1 */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gold mb-3">
            1. Overview
          </h2>
          <p className="text-sm text-white/70 leading-relaxed">
            The A.I.M.S. Savings Plan (&quot;Plan&quot;) is a mandatory
            fee-sharing program applied to all active accounts on the
            plugmein.cloud platform. The Plan ensures that a majority share
            of platform fees collected is returned to users as account
            savings, which can be applied toward future usage, subscription
            upgrades, or platform credits.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gold mb-3">
            2. Fee Structure
          </h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-wireframe-stroke bg-black/40 p-4">
              <h3 className="text-sm font-semibold text-white mb-1">
                Platform Maintenance Fee
              </h3>
              <p className="text-sm text-white/70">
                A <span className="text-white font-semibold">$5.00</span>{" "}
                maintenance fee is applied to every invoice generated on the
                platform. This fee covers infrastructure upkeep, security
                monitoring, and service continuity.
              </p>
            </div>
            <div className="rounded-xl border border-wireframe-stroke bg-black/40 p-4">
              <h3 className="text-sm font-semibold text-white mb-1">
                Pay-per-Use Transaction Fee
              </h3>
              <p className="text-sm text-white/70">
                A <span className="text-white font-semibold">$0.99</span>{" "}
                transaction fee is applied to each Pay-per-Use (P2P)
                execution. This fee applies only to metered, on-demand
                transactions outside of subscription allocations.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gold mb-3">
            3. Savings Split
          </h2>
          <p className="text-sm text-white/70 leading-relaxed mb-4">
            The two fees described in Section 2 — the $5.00 Platform
            Maintenance Fee and the $0.99 Pay-per-Use Transaction Fee —
            are split between the user and the platform as follows:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
              <p className="text-3xl font-bold text-emerald-400">70%</p>
              <p className="text-xs text-white/50 mt-1 uppercase tracking-wider">
                Credited to Your Savings
              </p>
            </div>
            <div className="rounded-xl border border-wireframe-stroke bg-black/40 p-4 text-center">
              <p className="text-3xl font-bold text-white/60">30%</p>
              <p className="text-xs text-white/50 mt-1 uppercase tracking-wider">
                Retained by Platform
              </p>
            </div>
          </div>
          <p className="text-sm text-white/50 mt-4 leading-relaxed">
            The user&apos;s 70% savings portion is credited to their account
            savings balance within the same billing cycle. Savings accrue
            automatically and are visible in the LUC dashboard under
            &quot;Account Savings.&quot;
          </p>
        </section>

        {/* Section 4 */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gold mb-3">
            4. Savings Usage
          </h2>
          <p className="text-sm text-white/70 leading-relaxed">
            Accumulated savings may be applied toward:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <span className="text-gold mt-0.5">&#9670;</span>
              <span>Future token usage and overage charges</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold mt-0.5">&#9670;</span>
              <span>Subscription upgrades or renewals</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold mt-0.5">&#9670;</span>
              <span>Platform credit purchases</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold mt-0.5">&#9670;</span>
              <span>Add-on services and pillar upgrades</span>
            </li>
          </ul>
          <p className="text-sm text-white/50 mt-4">
            Savings cannot be withdrawn as cash and have no monetary value
            outside the A.I.M.S. platform.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gold mb-3">
            5. Ledger Transparency
          </h2>
          <p className="text-sm text-white/70 leading-relaxed">
            All fee charges and savings credits are recorded in three
            concurrent audit ledgers:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <span className="text-gold mt-0.5">1.</span>
              <span>
                <span className="text-white font-semibold">User Ledger</span>{" "}
                — Your personal record of all charges, credits, and savings
                balance.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold mt-0.5">2.</span>
              <span>
                <span className="text-white font-semibold">
                  Platform Ledger
                </span>{" "}
                — Internal operations record for audit compliance and
                dispute resolution.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold mt-0.5">3.</span>
              <span>
                <span className="text-white font-semibold">
                  Web3 Ledger
                </span>{" "}
                — SHA-256 hash chain providing immutable, verifiable records
                of all financial transactions.
              </span>
            </li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gold mb-3">
            6. Account Closure
          </h2>
          <p className="text-sm text-white/70 leading-relaxed">
            Upon account closure or cancellation, any remaining savings
            balance will be applied as a credit toward final invoice charges.
            Unused savings after final settlement are forfeited.
          </p>
        </section>

        {/* Section 7 */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gold mb-3">
            7. Modifications
          </h2>
          <p className="text-sm text-white/70 leading-relaxed">
            A.I.M.S. reserves the right to modify the fee amounts and
            savings split ratio with 30 days&apos; written notice to active
            subscribers. Changes will not apply retroactively to savings
            already credited.
          </p>
        </section>

        <div className="mt-16 pt-8 border-t border-wireframe-stroke">
          <p className="text-xs text-white/30">
            A.I.M.S. — AI Managed Solutions | plugmein.cloud |
            Last updated: February 2026
          </p>
        </div>
      </div>
    </main>
  );
}
