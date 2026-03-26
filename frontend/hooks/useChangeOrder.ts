/**
 * useChangeOrder Hook
 *
 * Manages Change Orders when Boomer_Angs pause for user input.
 * Tracks billing, token usage, and integrates with LUC billing engine.
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import type {
  ChangeOrder,
  ChangeOrderInput,
  ChangeOrderStatus,
  ChangeOrderTokenUsage,
  ChangeOrderInvoice,
  ChangeOrderLineItem,
} from '@/lib/change-order/types';
import {
  createChangeOrderId,
  estimateChangeOrderCost,
  estimateInputTokens,
  DEFAULT_COST_FACTORS,
} from '@/lib/change-order/types';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface UseChangeOrderOptions {
  sessionId: string;
  userId: string;
  onChangeOrderCreated?: (order: ChangeOrder) => void;
  onChangeOrderSubmitted?: (order: ChangeOrder) => void;
  onCostUpdated?: (totalCost: number, tokenUsage: number) => void;
}

interface UseChangeOrderReturn {
  // Current change order
  currentOrder: ChangeOrder | null;
  isWaitingForInput: boolean;

  // Order management
  createChangeOrder: (params: {
    triggerQuestion: string;
    requestingAgent: string;
    department: string;
    context?: string;
    timeoutMinutes?: number;
  }) => ChangeOrder;
  submitChangeOrder: (inputs: ChangeOrderInput[]) => Promise<void>;
  cancelChangeOrder: () => void;

  // History
  changeOrders: ChangeOrder[];
  getSessionInvoice: () => ChangeOrderInvoice;

  // Metrics
  totalTokensUsed: number;
  totalCost: number;
  averageWaitTime: number;
}

// ─────────────────────────────────────────────────────────────
// Hook Implementation
// ─────────────────────────────────────────────────────────────

export function useChangeOrder(options: UseChangeOrderOptions): UseChangeOrderReturn {
  const {
    sessionId,
    userId,
    onChangeOrderCreated,
    onChangeOrderSubmitted,
    onCostUpdated,
  } = options;

  const [currentOrder, setCurrentOrder] = useState<ChangeOrder | null>(null);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);

  const waitStartTimeRef = useRef<number | null>(null);

  // Computed values
  const isWaitingForInput = currentOrder?.status === 'pending';

  const { totalTokensUsed, totalCost, averageWaitTime } = useMemo(() => {
    const tokens = changeOrders.reduce((sum, order) => {
      return sum + order.inputs.reduce((s, input) => s + estimateInputTokens(input), 0);
    }, 0);

    const cost = changeOrders.reduce((sum, order) => {
      return sum + (order.actualCost || order.estimatedCost || 0);
    }, 0);

    const completed = changeOrders.filter(o => o.completedAt && o.submittedAt);
    const waitTime = completed.length > 0
      ? completed.reduce((sum, o) => sum + (o.waitDuration || 0), 0) / completed.length
      : 0;

    return {
      totalTokensUsed: tokens,
      totalCost: cost,
      averageWaitTime: waitTime,
    };
  }, [changeOrders]);

  // ─────────────────────────────────────────────────────────
  // Create Change Order
  // ─────────────────────────────────────────────────────────

  const createChangeOrder = useCallback((params: {
    triggerQuestion: string;
    requestingAgent: string;
    department: string;
    context?: string;
    timeoutMinutes?: number;
  }): ChangeOrder => {
    const now = new Date();
    const timeoutMinutes = params.timeoutMinutes || 30;

    const order: ChangeOrder = {
      id: createChangeOrderId(),
      sessionId,
      userId,
      triggerQuestion: params.triggerQuestion,
      context: params.context || '',
      requestingAgent: params.requestingAgent,
      department: params.department,
      inputs: [],
      status: 'pending',
      priority: 'normal',
      createdAt: now,
      timeoutAt: new Date(now.getTime() + timeoutMinutes * 60 * 1000),
    };

    setCurrentOrder(order);
    waitStartTimeRef.current = Date.now();

    onChangeOrderCreated?.(order);

    return order;
  }, [sessionId, userId, onChangeOrderCreated]);

  // ─────────────────────────────────────────────────────────
  // Submit Change Order
  // ─────────────────────────────────────────────────────────

  const submitChangeOrder = useCallback(async (inputs: ChangeOrderInput[]) => {
    if (!currentOrder) return;

    const now = new Date();
    const waitDuration = waitStartTimeRef.current
      ? Date.now() - waitStartTimeRef.current
      : 0;

    const estimatedCost = estimateChangeOrderCost({
      ...currentOrder,
      inputs,
    });

    const completedOrder: ChangeOrder = {
      ...currentOrder,
      inputs,
      status: 'completed',
      submittedAt: now,
      completedAt: now,
      waitDuration,
      estimatedCost,
      actualCost: estimatedCost, // In production, this would come from actual API usage
    };

    setChangeOrders(prev => [...prev, completedOrder]);
    setCurrentOrder(null);
    waitStartTimeRef.current = null;

    // Notify about cost update
    const newTotalCost = totalCost + estimatedCost;
    const newTotalTokens = totalTokensUsed + inputs.reduce(
      (sum, input) => sum + estimateInputTokens(input),
      0
    );
    onCostUpdated?.(newTotalCost, newTotalTokens);

    onChangeOrderSubmitted?.(completedOrder);

    // In production, send to LUC billing API
    await sendToLUC(completedOrder);
  }, [currentOrder, totalCost, totalTokensUsed, onChangeOrderSubmitted, onCostUpdated]);

  // ─────────────────────────────────────────────────────────
  // Cancel Change Order
  // ─────────────────────────────────────────────────────────

  const cancelChangeOrder = useCallback(() => {
    if (!currentOrder) return;

    const cancelledOrder: ChangeOrder = {
      ...currentOrder,
      status: 'cancelled',
      completedAt: new Date(),
    };

    setChangeOrders(prev => [...prev, cancelledOrder]);
    setCurrentOrder(null);
    waitStartTimeRef.current = null;
  }, [currentOrder]);

  // ─────────────────────────────────────────────────────────
  // Get Session Invoice
  // ─────────────────────────────────────────────────────────

  const getSessionInvoice = useCallback((): ChangeOrderInvoice => {
    const completedOrders = changeOrders.filter(o => o.status === 'completed');

    // Generate line items
    const lineItems: ChangeOrderLineItem[] = [];

    for (const order of completedOrders) {
      for (const input of order.inputs) {
        let quantity = 0;
        let unitPrice = 0;
        let description = '';

        switch (input.type) {
          case 'voice':
            quantity = Math.ceil(input.duration / 60);
            unitPrice = DEFAULT_COST_FACTORS.voiceTranscription;
            description = `Voice transcription (${Math.round(input.duration)}s)`;
            break;
          case 'image':
            quantity = 1;
            unitPrice = DEFAULT_COST_FACTORS.imageAnalysis;
            description = `Image analysis: ${input.filename}`;
            break;
          case 'file':
            quantity = Math.ceil(input.size / (1024 * 1024));
            unitPrice = DEFAULT_COST_FACTORS.fileProcessing;
            description = `File processing: ${input.filename}`;
            break;
          case 'code':
            quantity = Math.ceil(input.lineCount / 1000);
            unitPrice = DEFAULT_COST_FACTORS.codeAnalysis;
            description = `Code analysis (${input.language}, ${input.lineCount} lines)`;
            break;
          case 'text':
            const tokens = Math.ceil(input.content.length / 4);
            quantity = Math.ceil(tokens / 1000);
            unitPrice = DEFAULT_COST_FACTORS.textProcessing;
            description = `Text processing (${input.wordCount} words)`;
            break;
        }

        lineItems.push({
          id: `li-${order.id}-${input.type}-${Date.now()}`,
          changeOrderId: order.id,
          description,
          inputType: input.type,
          quantity,
          unitPrice,
          subtotal: quantity * unitPrice,
          timestamp: order.submittedAt || order.createdAt,
        });
      }
    }

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
    const changeOrderFees = completedOrders.length * DEFAULT_COST_FACTORS.changeOrderFee;
    const priorityCharges = completedOrders.reduce((sum, order) => {
      const baseCost = order.estimatedCost || 0;
      const multiplier = DEFAULT_COST_FACTORS.priorityMultiplier[order.priority];
      return sum + (baseCost * (multiplier - 1));
    }, 0);

    // Token breakdown
    const tokenBreakdown = {
      voice: 0,
      image: 0,
      file: 0,
      code: 0,
      text: 0,
      processing: 0,
    };

    for (const order of completedOrders) {
      for (const input of order.inputs) {
        const tokens = estimateInputTokens(input);
        tokenBreakdown[input.type] += tokens;
      }
      // Add ~20% overhead for processing
      tokenBreakdown.processing += Math.ceil(
        order.inputs.reduce((s, i) => s + estimateInputTokens(i), 0) * 0.2
      );
    }

    return {
      id: `inv-${sessionId}-${Date.now()}`,
      sessionId,
      userId,
      changeOrders: completedOrders,
      lineItems,
      subtotal,
      changeOrderFees,
      priorityCharges,
      totalCost: subtotal + changeOrderFees + priorityCharges,
      totalTokens: Object.values(tokenBreakdown).reduce((a, b) => a + b, 0),
      tokenBreakdown,
      createdAt: new Date(),
      periodStart: completedOrders[0]?.createdAt || new Date(),
      periodEnd: new Date(),
    };
  }, [changeOrders, sessionId, userId]);

  return {
    currentOrder,
    isWaitingForInput,
    createChangeOrder,
    submitChangeOrder,
    cancelChangeOrder,
    changeOrders,
    getSessionInvoice,
    totalTokensUsed,
    totalCost,
    averageWaitTime,
  };
}

// ─────────────────────────────────────────────────────────────
// LUC Billing Integration
// ─────────────────────────────────────────────────────────────

async function sendToLUC(order: ChangeOrder): Promise<void> {
  try {
    // In production, this would send to the LUC billing API
    const payload = {
      type: 'change_order',
      orderId: order.id,
      sessionId: order.sessionId,
      userId: order.userId,
      department: order.department,
      inputCount: order.inputs.length,
      inputTypes: order.inputs.map(i => i.type),
      tokenEstimate: order.inputs.reduce((s, i) => s + estimateInputTokens(i), 0),
      costEstimate: order.estimatedCost,
      waitDuration: order.waitDuration,
      priority: order.priority,
      timestamp: new Date().toISOString(),
    };

    console.log('[LUC Billing] Sending Change Order:', payload);

    const response = await fetch('/api/luc/billing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`LUC billing failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[LUC Billing] Recorded:', result);
  } catch (error) {
    console.error('[LUC Billing] Failed to send change order:', error);
  }
}

export default useChangeOrder;
