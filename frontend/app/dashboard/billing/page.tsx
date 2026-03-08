'use client';

import { motion } from 'framer-motion';
import useSWR from 'swr';
import { usePlatformMode } from '@/lib/platform-mode';
import { t } from '@/lib/terminology';
import { staggerContainer, staggerItem } from '@/lib/motion/variants';
import { QuotaBar } from '@/components/ui/QuotaBar';

interface BillingStatus {
    plan: string;
    price: string;
    renewalDate: string;
}

interface PaymentMethod {
    cardBrand: string;
    last4: string;
    expiry: string;
}

interface Invoice {
    id: string;
    date: string;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    pdfUrl: string;
}

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('API Error');
    return res.json();
});

export default function BillingPage() {
    const { mode } = usePlatformMode();

    const { data: billing, isLoading, error } = useSWR('/api/luc/billing', fetcher);

    // Fallback styling data for layout purposes if API not ready
    const safeBilling = billing || {
        status: { plan: 'Starter', price: '$29/mo', renewalDate: 'Mar 15, 2026' },
        paymentMethod: { cardBrand: 'Visa', last4: '4242', expiry: '12/28' },
        invoices: [
            { id: 'inv_123', date: 'Feb 15, 2026', amount: 29.00, status: 'paid', pdfUrl: '#' },
            { id: 'inv_122', date: 'Jan 15, 2026', amount: 29.00, status: 'paid', pdfUrl: '#' },
        ],
        usageCycle: { used: 3247, quota: 10000 }
    };

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
                    <p className="text-zinc-400 mt-1">Manage your subscriptions, payments, and view invoices.</p>
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
                            <span className="text-4xl font-extrabold text-[#D4AF37]">{safeBilling.status.plan}</span>
                            <span className="text-zinc-400 text-lg">{safeBilling.status.price}</span>
                        </div>
                        <p className="text-zinc-500 mt-2 text-sm">
                            Renews automatically on <span className="text-zinc-300 font-medium">{safeBilling.status.renewalDate}</span>
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
                            <div className="w-12 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md flex items-center justify-center text-white font-bold italic shadow-md">
                                {safeBilling.paymentMethod.cardBrand}
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-medium">
                                    •••• •••• •••• {safeBilling.paymentMethod.last4}
                                </p>
                                <p className="text-sm text-zinc-500">
                                    Expires {safeBilling.paymentMethod.expiry}
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
                <QuotaBar
                    used={safeBilling.usageCycle.used}
                    total={safeBilling.usageCycle.quota}
                    label="LUC Credits used this billing period"
                />
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
                            {safeBilling.invoices.map((inv: any) => (
                                <tr key={inv.id} className="hover:bg-white/[0.02]">
                                    <td className="py-4 pr-4">{inv.date}</td>
                                    <td className="py-4 px-4 font-mono">${inv.amount.toFixed(2)}</td>
                                    <td className="py-4 px-4">
                                        <span className={`px-2.5 py-1 flex items-center w-max gap-1.5 rounded-full text-xs font-medium border ${inv.status === 'paid'
                                                ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20'
                                                : 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${inv.status === 'paid' ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
                                                }`} />
                                            {inv.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="py-4 pl-4 text-right">
                                        <a
                                            href={inv.pdfUrl}
                                            className="text-[#22D3EE] hover:text-[#22D3EE]/80 transition-colors inline-flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            PDF
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

        </motion.div>
    );
}
