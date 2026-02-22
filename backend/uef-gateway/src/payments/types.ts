/**
 * Agent Payment Types — Payment Primitives for the Agentic Web
 *
 * Supports:
 *   - X402: HTTP 402 payment protocol for agent-to-agent micropayments
 *   - Stripe Agent Commerce: Fiat payments with scoped, time-constrained tokens
 *   - LUC Bridge: Converts external payments to internal LUC credits
 */

// ---------------------------------------------------------------------------
// X402 Protocol — Agent-to-Agent Micropayments
// ---------------------------------------------------------------------------

/**
 * X402 payment request — returned as HTTP 402 with payment instructions.
 * The agent reads these headers and fulfills the payment to access the resource.
 */
export interface X402PaymentRequired {
  /** The resource the agent is trying to access */
  resource: string;
  /** Payment amount in the smallest unit */
  amount: number;
  /** Currency (crypto or fiat) */
  currency: 'USDC' | 'ETH' | 'USD' | 'LUC';
  /** Payment network */
  network: 'base' | 'ethereum' | 'polygon' | 'stripe' | 'luc';
  /** Payment recipient address or account */
  recipient: string;
  /** Expiration timestamp */
  expiresAt: string;
  /** Description of what's being paid for */
  description: string;
  /** Unique payment session ID */
  paymentSessionId: string;
}

/**
 * X402 payment proof — sent by the agent after completing payment.
 */
export interface X402PaymentProof {
  paymentSessionId: string;
  transactionHash?: string;   // For crypto payments
  stripePaymentId?: string;   // For Stripe payments
  lucTransactionId?: string;  // For LUC payments
  paidAt: string;
}

// ---------------------------------------------------------------------------
// Stripe Agent Commerce — Fiat Payments for Agents
// ---------------------------------------------------------------------------

/**
 * Shared payment token — scoped, time-constrained credential for agent payments.
 * Agents don't get full Stripe keys; they get limited tokens.
 */
export interface AgentPaymentToken {
  tokenId: string;
  agentId: string;
  /** Maximum amount this token can charge */
  maxAmount: number;
  currency: 'usd' | 'eur' | 'gbp';
  /** Allowed product IDs */
  allowedProducts: string[];
  /** Token expiration */
  expiresAt: string;
  /** Number of uses remaining */
  usesRemaining: number;
  /** Creation metadata */
  createdBy: string;
  createdAt: string;
}

/**
 * Agent purchase request — what the agent sends when buying something.
 */
export interface AgentPurchaseRequest {
  tokenId: string;
  productId: string;
  quantity: number;
  metadata?: Record<string, string>;
}

/**
 * Agent purchase result.
 */
export interface AgentPurchaseResult {
  purchaseId: string;
  status: 'completed' | 'pending' | 'failed';
  amount: number;
  currency: string;
  stripePaymentIntentId?: string;
  lucCost: number;
  receipt?: string;
}

// ---------------------------------------------------------------------------
// LUC Bridge — Convert Between Payment Methods
// ---------------------------------------------------------------------------

export interface LucPaymentBridge {
  /** Convert external payment to LUC credits */
  externalToLuc(amount: number, currency: string): number;
  /** Convert LUC credits to external payment amount */
  lucToExternal(lucAmount: number, currency: string): number;
}

// ---------------------------------------------------------------------------
// Agent Wallet — Per-Agent Financial State
// ---------------------------------------------------------------------------

export interface AgentWallet {
  agentId: string;
  /** LUC balance (internal credits) */
  lucBalance: number;
  /** Spending limits */
  spendingLimit: {
    perTransaction: number;
    perHour: number;
    perDay: number;
  };
  /** Transaction history */
  recentTransactions: AgentTransaction[];
  /** Active payment tokens */
  activeTokens: AgentPaymentToken[];
}

export interface AgentTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  description: string;
  counterparty: string;   // Who paid/received
  protocol: 'x402' | 'stripe' | 'luc' | 'internal';
  timestamp: string;
}
