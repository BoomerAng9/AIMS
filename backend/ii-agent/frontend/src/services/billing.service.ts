import axiosInstance from '@/lib/axios'
import {
    type BillingCycle,
    type CreateCheckoutSessionResponse,
    type SubscriptionPlanId,
    type CreatePortalSessionResponse,
    type CreatePortalSessionRequest
} from '@/typings/subscription'

class BillingService {
    async createCheckoutSession({
        planId,
        billingCycle
    }: {
        planId: SubscriptionPlanId
        billingCycle: BillingCycle
    }): Promise<CreateCheckoutSessionResponse> {
        const response = await axiosInstance.post<CreateCheckoutSessionResponse>(
            '/billing/checkout-session',
            {
                planId,
                billingCycle,
                plan_id: planId,
                billing_cycle: billingCycle,
                returnUrl: window.location.origin
            }
        )

        return response.data
    }

    async createPortalSession({
        returnUrl
    }: CreatePortalSessionRequest = {}): Promise<CreatePortalSessionResponse> {
        const response = await axiosInstance.post<CreatePortalSessionResponse>(
            '/billing/portal-session',
            {
                returnUrl
            }
        )

        return response.data
    }
}

export const billingService = new BillingService()
