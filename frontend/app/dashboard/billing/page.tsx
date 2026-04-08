'use client';

import { motion } from 'framer-motion';
import useSWR from 'swr';
import { staggerContainer, staggerItem } from '@/lib/motion/variants';

import { mapBillingRecordsToInvoices, type BillingResponse } from '@/lib/billing/transform';

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('API Error');
    return res.json();
});

export default function BillingPage() {
    const { data: billing, isLoading, error } = useSWR<BillingResponse>('/api/luc/billing', fetcher);

    const invoices = mapBillingRecordsToInvoices(billing);

    const handleStripeCheckout = async () => {
        // Route to Stripe checkout
        try {
            const res = await fetch('/api/stripe/checkout', { method: 'POST' });
            const { url } = await res.json();
            if (url) window.location.href = url;
        } catch (e) { }
    };

    if (isLoading) {
        return (
            <div className="p-6 max-w-5xl mx-auto space-y-6 animate-pulse">
                <div className="h-10 bg-[#111113] rounded-md w-1/4 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-48 bg-[#111113] rounded-2xl"></div>
                    <div className="h-48 bg-[#111113] rounded-2xl"></div>
                </div>
                <div className="h-64 bg-[#111113] rounded-2xl mt-6"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 max-w-5xl mx-auto">
                <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 p-6">
                    <h1 className="text-xl font-semibold text-white">Billing data unavailable</h1>
                    <p className="mt-2 text-sm text-zinc-300">
                        We could not load billing data from the LUC billing API. No fallback billing values are displayed.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="p-6 max-w-5xl mx-auto space-y-8"
        >
            <motion.div variants={staggerItem} className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white/90">
                        Billing Management
                    </h1>
                    <p className="text-zinc-400 mt-1">View API-backed billing usage and event records.</p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CURRENT PLAN */}
                <motion.div
                    variants={staggerItem}
                    className="rounded-2xl border border-white/[0.06] bg-[#111113]/80 backdrop-blur-sm p-6 shadow-lg flex flex-col justify-between"
                >
                    <div>
                        <h2 className="text-lg font-bold text-white">Current Plan</h2>
                        <div className="mt-6 flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold text-[#D4AF37]">Unavailable</span>
                        </div>
                        <p className="text-zinc-500 mt-2 text-sm">
                            Subscription plan metadata is not returned by <span className="text-zinc-300 font-medium">/api/luc/billing</span>.
                        </p>
                    </div>
                    <div className="mt-8 flex gap-3">
                        <button
                            onClick={handleStripeCheckout}
                            className="px-4 py-2 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black rounded-lg font-medium transition-colors"
                        >
                            Upgrade Plan
                        </button>
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium border border-white/10 transition-colors">
                            Cancel Subscription
                        </button>
                    </div>
                </motion.div>

                {/* PAYMENT METHOD */}
                <motion.div
                    variants={staggerItem}
                    className="rounded-2xl border border-white/[0.06] bg-[#111113]/80 backdrop-blur-sm p-6 shadow-lg flex flex-col justify-between"
                >
                    <div>
                        <h2 className="text-lg font-bold text-white">Payment Method</h2>
                        <div className="mt-6 flex items-center gap-4 bg-[#18181B] p-4 rounded-xl border border-white/5">
                            <div className="w-12 h-8 bg-gradient-to-br from-zinc-600 to-zinc-800 rounded-md flex items-center justify-center text-white font-bold shadow-md">
                                --
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-medium">
                                    Not available
                                </p>
                                <p className="text-sm text-zinc-500">
                                    Payment details are managed in Stripe and not exposed by this endpoint.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8">
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium border border-white/10 transition-colors">
                            Update Payment Method
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* USAGE SUMMARY */}
            <motion.div
                variants={staggerItem}
                className="rounded-2xl border border-white/[0.06] bg-[#111113]/80 backdrop-blur-sm p-6 shadow-lg"
            >
                <h2 className="text-lg font-bold text-white mb-6">Usage Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-wide text-zinc-400">Events</p>
                        <p className="mt-2 text-2xl font-bold text-white">{billing?.totals.count ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-wide text-zinc-400">Tokens</p>
                        <p className="mt-2 text-2xl font-bold text-white">{billing?.totals.tokens ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-wide text-zinc-400">Cost</p>
                        <p className="mt-2 text-2xl font-bold text-white">${(billing?.totals.cost ?? 0).toFixed(2)}</p>
                    </div>
                </div>
            </motion.div>

            {/* INVOICES */}
            <motion.div
                variants={staggerItem}
                className="rounded-2xl border border-white/[0.06] bg-[#111113]/80 backdrop-blur-sm p-6 shadow-lg"
            >
                <h2 className="text-lg font-bold text-white mb-6">Invoice History</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="text-zinc-500 border-b border-white/5">
                                <th className="pb-3 font-medium">Date</th>
                                <th className="pb-3 font-medium">Amount</th>
                                <th className="pb-3 font-medium">Status</th>
                                <th className="pb-3 font-medium text-right pr-4">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-zinc-300">
                            {invoices.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-zinc-500">
                                        No billing records found for this account.
                                    </td>
                                </tr>
                            )}
                            {invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-white/[0.02]">
                                    <td className="py-4 pr-4">{inv.date}</td>
                                    <td className="py-4 px-4 font-mono">${inv.amount.toFixed(2)}</td>
                                    <td className="py-4 px-4">
                                        <span className="px-2.5 py-1 flex items-center w-max gap-1.5 rounded-full text-xs font-medium border bg-cyan-500/10 text-cyan-300 border-cyan-500/25">
                                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                                            {inv.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="py-4 pl-4 text-right text-zinc-400">{inv.eventType}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

        </motion.div>
    );
}
