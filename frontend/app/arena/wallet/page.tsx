'use client';

/**
 * Arena Wallet — Balance, Deposits, Transaction History
 *
 * Handles player funds for contest entries and winnings.
 * Integrates with Stripe for deposits and withdrawals.
 */

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Wallet, Plus, ArrowUpRight, ArrowDownLeft, Clock,
  CreditCard, ArrowLeft, Shield, AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/arena/types';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const DEMO_TRANSACTIONS = [
  { id: 'tx-001', type: 'DEPOSIT', amount: 50, balanceAfter: 50, description: 'Initial deposit via Stripe', createdAt: '2026-02-17T10:00:00Z' },
  { id: 'tx-002', type: 'ENTRY_FEE', amount: -5, balanceAfter: 45, description: 'Entry: Daily Trivia Blitz', createdAt: '2026-02-17T10:30:00Z' },
  { id: 'tx-003', type: 'WINNINGS', amount: 21.25, balanceAfter: 66.25, description: '1st Place: Daily Trivia Blitz', createdAt: '2026-02-17T12:00:00Z' },
  { id: 'tx-004', type: 'ENTRY_FEE', amount: -10, balanceAfter: 56.25, description: "Entry: NBA Pick'em", createdAt: '2026-02-17T14:00:00Z' },
  { id: 'tx-005', type: 'BONUS', amount: 5, balanceAfter: 61.25, description: 'Welcome bonus', createdAt: '2026-02-17T10:00:00Z' },
];

const TX_STYLES: Record<string, { icon: typeof ArrowUpRight; color: string; bg: string; prefix: string }> = {
  DEPOSIT: { icon: ArrowDownLeft, color: 'text-emerald-400', bg: 'bg-emerald-400/10', prefix: '+' },
  ENTRY_FEE: { icon: ArrowUpRight, color: 'text-red-400', bg: 'bg-red-400/10', prefix: '' },
  WINNINGS: { icon: ArrowDownLeft, color: 'text-gold', bg: 'bg-gold/10', prefix: '+' },
  REFUND: { icon: ArrowDownLeft, color: 'text-blue-400', bg: 'bg-blue-400/10', prefix: '+' },
  BONUS: { icon: ArrowDownLeft, color: 'text-purple-400', bg: 'bg-purple-400/10', prefix: '+' },
};

const DEPOSIT_AMOUNTS = [10, 25, 50, 100];

export default function WalletPage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const balance = 61.25;
  const totalDeposited = 50;
  const totalWon = 21.25;
  const totalSpent = 15;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 border border-gold/20">
            <Wallet size={20} className="text-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-display text-white tracking-tight">Wallet</h1>
            <p className="text-[0.55rem] font-mono text-white/30 uppercase tracking-widest">Balance & Transactions</p>
          </div>
        </div>
        <Link href="/arena" className="flex items-center gap-2 text-sm text-white/40 hover:text-gold transition-colors">
          <ArrowLeft size={14} />
          <span className="font-mono text-[0.6rem] uppercase tracking-widest">Lobby</span>
        </Link>
      </motion.div>

      {/* Balance Card */}
      <motion.div variants={fadeUp} className="wireframe-card rounded-3xl p-8 shadow-[0_0_30px_rgba(212,175,55,0.06)]">
        <p className="text-[0.55rem] font-mono uppercase tracking-widest text-white/30 mb-2">Available Balance</p>
        <p className="text-5xl font-display text-gold mb-6">{formatCurrency(balance)}</p>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <p className="text-sm font-display text-emerald-400">{formatCurrency(totalDeposited)}</p>
            <p className="text-[0.5rem] font-mono text-white/20 uppercase">Deposited</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <p className="text-sm font-display text-gold">{formatCurrency(totalWon)}</p>
            <p className="text-[0.5rem] font-mono text-white/20 uppercase">Won</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <p className="text-sm font-display text-white/40">{formatCurrency(totalSpent)}</p>
            <p className="text-[0.5rem] font-mono text-white/20 uppercase">Spent</p>
          </div>
        </div>
      </motion.div>

      {/* Deposit Section */}
      <motion.div variants={fadeUp} className="wireframe-card rounded-2xl p-6 space-y-4">
        <h2 className="text-xs uppercase tracking-widest text-white/30 font-mono flex items-center gap-2">
          <Plus size={12} /> Add Funds
        </h2>

        <div className="grid grid-cols-4 gap-3">
          {DEPOSIT_AMOUNTS.map(amount => (
            <button
              key={amount}
              onClick={() => setSelectedAmount(amount)}
              className={`py-3 rounded-xl text-sm font-display transition-all ${
                selectedAmount === amount
                  ? 'bg-gold/10 border-2 border-gold/30 text-gold'
                  : 'bg-white/[0.02] border border-white/10 text-white/50 hover:border-gold/15 hover:text-white/70'
              }`}
            >
              {formatCurrency(amount)}
            </button>
          ))}
        </div>

        <button
          disabled={!selectedAmount}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium transition-all ${
            selectedAmount
              ? 'bg-gold/10 border border-gold/20 text-gold hover:bg-gold/15'
              : 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed'
          }`}
        >
          <CreditCard size={16} />
          {selectedAmount ? `Deposit ${formatCurrency(selectedAmount)} via Stripe` : 'Select an amount'}
        </button>

        <div className="flex items-center gap-2 text-[0.55rem] text-white/20 font-mono">
          <Shield size={10} />
          <span>Secured by Stripe. Funds are available immediately.</span>
        </div>
      </motion.div>

      {/* Transaction History */}
      <motion.div variants={fadeUp} className="wireframe-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-widest text-white/30 font-mono flex items-center gap-2">
            <Clock size={12} /> Transaction History
          </h2>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {DEMO_TRANSACTIONS.map(tx => {
            const style = TX_STYLES[tx.type] || TX_STYLES.DEPOSIT;
            const IconComp = style.icon;
            return (
              <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${style.bg}`}>
                  <IconComp size={14} className={style.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/60">{tx.description}</p>
                  <p className="text-[0.5rem] text-white/20 font-mono">
                    {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-display ${tx.amount > 0 ? style.color : 'text-white/40'}`}>
                    {style.prefix}{formatCurrency(Math.abs(tx.amount))}
                  </p>
                  <p className="text-[0.45rem] text-white/15 font-mono">
                    Bal: {formatCurrency(tx.balanceAfter)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Withdrawal Note */}
      <motion.div variants={fadeUp} className="flex items-start gap-3 p-4 rounded-xl bg-amber-400/5 border border-amber-400/10">
        <AlertCircle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-amber-400 font-medium">Withdrawals</p>
          <p className="text-[0.6rem] text-white/30 mt-1">
            Withdraw to your bank account or PayPal. Minimum withdrawal: $25.
            Processing time: 1-3 business days. Go to Settings to add a payout method.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
