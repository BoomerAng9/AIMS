export type BillingCycle = 'monthly' | 'annually'

export enum SubscriptionPlan {
    Free = 'free',
    Plus = 'plus',
    Pro = 'pro'
}

export type SubscriptionPlanId = 'free' | 'plus' | 'pro'

export interface CreateCheckoutSessionResponse {
    sessionId?: string
    url?: string
}

export interface CreateCheckoutSessionRequest {
    planId: SubscriptionPlanId
    billingCycle: BillingCycle
}

export interface CreatePortalSessionResponse {
    url: string
}

export interface CreatePortalSessionRequest {
    returnUrl?: string
}
