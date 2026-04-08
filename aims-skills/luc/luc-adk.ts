/**
 * LUC (LUKE) - Ledger Usage Control ADK
 * @version 2.0.0
 * @description Standalone billing and usage tracking engine for A.I.M.S.
 * 
 * PRONUNCIATION: "LUKE" (not L-U-C)
 * 
 * KEY FEATURES:
 * - Multi-use case calculator (solutions, sports analytics, custom)
 * - Real-time quota tracking
 * - Automated billing and invoicing
 * - Accounts receivable management
 * - Bookkeeping and reconciliation
 */

import { LucUsage, LucInvoice, OVERAGE_RATES, LUC_PLANS } from './types';
import { db, FieldValue } from '../lib/firebase';
import { stripe } from '../lib/stripe';

export class LucAdk {
  // ------------------------------------
  // USAGE TRACKING
  // ------------------------------------

  /**
   * Debit (deduct) usage from user's quota
   */
  static async debit(
    userId: string,
    service: keyof typeof OVERAGE_RATES,
    amount: number
  ): Promise<{ success: boolean; can_execute: boolean; overage?: number }> {
    const lucRef = db.collection('luc').doc(userId);
    const lucDoc = await lucRef.get();

    if (!lucDoc.exists) {
      throw new Error(`LUC record not found for user ${userId}`);
    }

    const luc = lucDoc.data() as LucUsage;
    const quota = luc.quotas[service];

    if (!quota) {
      throw new Error(`Service ${service} not found in user's quotas`);
    }

    // Check if P2P metered (limit <= 0) — always allow, bill per use
    if (quota.limit <= 0) {
      return { success: true, can_execute: true };
    }

    const newUsed = quota.used + amount;
    const overage = Math.max(0, newUsed - quota.limit);

    // Update usage
    await lucRef.update({
      [`quotas.${service}.used`]: newUsed,
      [`quotas.${service}.overage`]: overage,
      last_updated: FieldValue.serverTimestamp()
    });

    return {
      success: true,
      can_execute: newUsed <= quota.limit * 1.1, // Allow 10% overage before blocking
      overage
    };
  }

  /**
   * Credit (add) quota back to user (e.g., bonus, refund)
   */
  static async credit(
    userId: string,
    service: keyof typeof OVERAGE_RATES,
    amount: number,
    reason: string
  ): Promise<void> {
    const lucRef = db.collection('luc').doc(userId);

    await lucRef.update({
      [`quotas.${service}.limit`]: FieldValue.increment(amount),
      last_updated: FieldValue.serverTimestamp(),
      credits: FieldValue.arrayUnion({
        service,
        amount,
        reason,
        timestamp: new Date()
      })
    });
  }

  /**
   * Check if user can execute a service (quota check)
   */
  static async canExecute(
    userId: string,
    service: keyof typeof OVERAGE_RATES,
    amount: number = 1
  ): Promise<{ can_execute: boolean; reason?: string; overage?: number }> {
    const lucDoc = await db.collection('luc').doc(userId).get();

    if (!lucDoc.exists) {
      return { can_execute: false, reason: 'No LUC record found' };
    }

    const luc = lucDoc.data() as LucUsage;
    const quota = luc.quotas[service];

    if (!quota) {
      return { can_execute: false, reason: 'Service not available in plan' };
    }

    // P2P metered — always allow, bill per use
    if (quota.limit <= 0) {
      return { can_execute: true };
    }

    const wouldUse = quota.used + amount;
    const maxAllowed = quota.limit * 1.1; // 10% overage buffer

    if (wouldUse <= maxAllowed) {
      return {
        can_execute: true,
        overage: wouldUse > quota.limit ? wouldUse - quota.limit : 0
      };
    }

    return {
      can_execute: false,
      reason: 'Quota exceeded. Upgrade or wait for billing cycle reset.',
      overage: wouldUse - quota.limit
    };
  }

  /**
   * Get current usage summary for user
   */
  static async getUsageSummary(userId: string): Promise<{
    plan: string;
    quotas: Record<string, { limit: number; used: number; percent: number }>;
    billing_cycle_end: Date;
    status: string;
  }> {
    const lucDoc = await db.collection('luc').doc(userId).get();

    if (!lucDoc.exists) {
      throw new Error(`LUC record not found for user ${userId}`);
    }

    const luc = lucDoc.data() as LucUsage;

    const quotaSummary: Record<string, { limit: number; used: number; percent: number }> = {};
    for (const [service, quota] of Object.entries(luc.quotas)) {
      quotaSummary[service] = {
        limit: quota.limit,
        used: quota.used,
        percent: quota.limit <= 0 ? 0 : Math.round((quota.used / quota.limit) * 100)
      };
    }

    return {
      plan: luc.plan,
      quotas: quotaSummary,
      billing_cycle_end: luc.billing_cycle_end,
      status: luc.status
    };
  }

  // ------------------------------------
  // BILLING & INVOICING
  // ------------------------------------

  /**
   * Generate monthly invoice for user
   */
  static async generateInvoice(userId: string): Promise<LucInvoice> {
    const lucDoc = await db.collection('luc').doc(userId).get();
    const luc = lucDoc.data() as LucUsage;

    const plan = LUC_PLANS[luc.plan];
    const lineItems: LucInvoice['line_items'] = [];

    // Base subscription
    lineItems.push({
      description: `${plan.name} - Monthly Subscription`,
      quantity: 1,
      unit_price: plan.price_monthly,
      total: plan.price_monthly
    });

    // Overage charges
    for (const [service, quota] of Object.entries(luc.quotas)) {
      if (quota.overage > 0) {
        const rate = OVERAGE_RATES[service as keyof typeof OVERAGE_RATES];
        const overageCost = quota.overage * rate;

        lineItems.push({
          description: `${service} overage (${quota.overage} units)`,
          quantity: quota.overage,
          unit_price: rate,
          total: overageCost
        });
      }
    }

    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.08; // 8% tax (adjust per jurisdiction)
    const total = subtotal + tax;

    const invoice: LucInvoice = {
      invoice_id: `INV-${Date.now()}`,
      user_id: userId,
      period_start: luc.billing_cycle_start,
      period_end: luc.billing_cycle_end,
      line_items: lineItems,
      subtotal,
      tax,
      total,
      status: 'draft'
    };

    // Save to Firebase
    await db.collection('invoices').doc(invoice.invoice_id).set(invoice);

    return invoice;
  }

  /**
   * Send invoice via Stripe
   */
  static async sendInvoice(invoiceId: string): Promise<void> {
    const invoiceDoc = await db.collection('invoices').doc(invoiceId).get();
    const invoice = invoiceDoc.data() as LucInvoice;

    const lucDoc = await db.collection('luc').doc(invoice.user_id).get();
    const luc = lucDoc.data() as LucUsage;

    if (!luc.stripe_customer_id) {
      throw new Error('No Stripe customer ID found');
    }

    // Create Stripe invoice
    const stripeInvoice = await stripe.invoices.create({
      customer: luc.stripe_customer_id,
      collection_method: 'charge_automatically',
      auto_advance: true,
      metadata: {
        aims_invoice_id: invoiceId
      }
    });

    // Add line items
    for (const item of invoice.line_items) {
      await stripe.invoiceItems.create({
        customer: luc.stripe_customer_id,
        invoice: stripeInvoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_amount: Math.round(item.unit_price * 100), // Convert to cents
      });
    }

    // Finalize and send
    await stripe.invoices.finalizeInvoice(stripeInvoice.id);

    // Update Firebase
    await db.collection('invoices').doc(invoiceId).update({
      status: 'sent',
      stripe_invoice_id: stripeInvoice.id,
      sent_at: FieldValue.serverTimestamp()
    });
  }

  /**
   * Reset billing cycle (monthly cron)
   */
  static async resetBillingCycle(userId: string): Promise<void> {
    const lucRef = db.collection('luc').doc(userId);
    const lucDoc = await lucRef.get();
    const luc = lucDoc.data() as LucUsage;

    const now = new Date();
    const nextCycleEnd = new Date(now);
    nextCycleEnd.setMonth(nextCycleEnd.getMonth() + 1);

    // Reset all "used" and "overage" to 0
    const resetQuotas: Record<string, any> = {};
    for (const service of Object.keys(luc.quotas)) {
      resetQuotas[`quotas.${service}.used`] = 0;
      resetQuotas[`quotas.${service}.overage`] = 0;
    }

    await lucRef.update({
      ...resetQuotas,
      billing_cycle_start: now,
      billing_cycle_end: nextCycleEnd,
      last_reset: FieldValue.serverTimestamp()
    });
  }

  // ------------------------------------
  // SUBSCRIPTION MANAGEMENT
  // ------------------------------------

  /**
   * Create subscription for new user
   */
  static async createSubscription(
    userId: string,
    planId: string,
    billingInterval: 'monthly' | 'annual',
    stripeCustomerId: string
  ): Promise<void> {
    const plan = LUC_PLANS[planId];
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    const priceId = billingInterval === 'monthly'
      ? plan.stripe_price_id_monthly
      : plan.stripe_price_id_annual;

    // Create Stripe subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      metadata: {
        user_id: userId,
        plan_id: planId
      }
    });

    const now = new Date();
    const cycleEnd = new Date(now);
    cycleEnd.setMonth(cycleEnd.getMonth() + 1);

    // Create LUC record
    const lucUsage: LucUsage = {
      user_id: userId,
      plan: planId,
      quotas: Object.entries(plan.quotas).reduce((acc, [service, limit]) => {
        acc[service] = { limit, used: 0, overage: 0 };
        return acc;
      }, {} as any),
      billing_cycle_start: now,
      billing_cycle_end: cycleEnd,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: stripeCustomerId,
      status: 'active'
    };

    await db.collection('luc').doc(userId).set(lucUsage);
  }

  /**
   * Upgrade/downgrade subscription
   */
  static async changeSubscription(
    userId: string,
    newPlanId: string
  ): Promise<void> {
    const lucRef = db.collection('luc').doc(userId);
    const lucDoc = await lucRef.get();
    const luc = lucDoc.data() as LucUsage;

    const newPlan = LUC_PLANS[newPlanId];

    if (!luc.stripe_subscription_id) {
      throw new Error('No active subscription found');
    }

    // Update Stripe subscription
    const subscription = await stripe.subscriptions.retrieve(luc.stripe_subscription_id);
    await stripe.subscriptions.update(luc.stripe_subscription_id, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPlan.stripe_price_id_monthly
      }],
      proration_behavior: 'always_invoice'
    });

    // Update quotas
    const newQuotas: Record<string, any> = {};
    for (const [service, limit] of Object.entries(newPlan.quotas)) {
      newQuotas[`quotas.${service}.limit`] = limit;
    }

    await lucRef.update({
      plan: newPlanId,
      ...newQuotas,
      updated_at: FieldValue.serverTimestamp()
    });
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(
    userId: string,
    immediate: boolean = false
  ): Promise<void> {
    const lucRef = db.collection('luc').doc(userId);
    const lucDoc = await lucRef.get();
    const luc = lucDoc.data() as LucUsage;

    if (!luc.stripe_subscription_id) {
      throw new Error('No active subscription found');
    }

    if (immediate) {
      await stripe.subscriptions.cancel(luc.stripe_subscription_id);
      await lucRef.update({
        status: 'cancelled',
        cancelled_at: FieldValue.serverTimestamp()
      });
    } else {
      await stripe.subscriptions.update(luc.stripe_subscription_id, {
        cancel_at_period_end: true
      });
      await lucRef.update({
        status: 'active',
        cancel_at_period_end: true
      });
    }
  }

  // ------------------------------------
  // USAGE ESTIMATION
  // ------------------------------------

  /**
   * Estimate cost for a proposed action
   */
  static estimateCost(
    services: Array<{ service: keyof typeof OVERAGE_RATES; amount: number }>
  ): { breakdown: Record<string, number>; total: number } {
    const breakdown: Record<string, number> = {};
    let total = 0;

    for (const { service, amount } of services) {
      const rate = OVERAGE_RATES[service];
      const cost = amount * rate;
      breakdown[service] = cost;
      total += cost;
    }

    return { breakdown, total };
  }

  /**
   * Get plan recommendation based on usage
   */
  static recommendPlan(
    currentUsage: Record<string, number>
  ): { recommended_plan: string; savings: number; reason: string } {
    let bestPlan = 'p2p';
    let bestSavings = 0;
    let reason = 'Current usage fits within Pay-per-Use tier';

    // Calculate what P2P (no plan) would cost in pure overage
    let p2pOverageCost = 0;
    for (const [service, used] of Object.entries(currentUsage)) {
      const rate = OVERAGE_RATES[service as keyof typeof OVERAGE_RATES];
      if (rate) p2pOverageCost += used * rate;
    }

    for (const [planId, plan] of Object.entries(LUC_PLANS)) {
      if (planId === 'p2p') continue;

      // Check if all usage fits within plan limits
      let fitsWithinPlan = true;

      for (const [service, used] of Object.entries(currentUsage)) {
        const limit = plan.quotas[service as keyof typeof plan.quotas] || 0;
        if (limit > 0 && used > limit) {
          fitsWithinPlan = false;
          break;
        }
      }

      if (fitsWithinPlan) {
        // Savings = P2P overage cost minus this plan's monthly cost
        const savings = p2pOverageCost - plan.price_monthly;
        if (savings > bestSavings) {
          bestPlan = planId;
          bestSavings = savings;
          reason = `${plan.name} covers your usage and saves $${savings.toFixed(2)}/mo vs Pay-per-Use`;
        }
      }
    }

    return {
      recommended_plan: bestPlan,
      savings: bestSavings,
      reason
    };
  }
}

export default LucAdk;
