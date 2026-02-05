import { SubscriptionPlan } from '@/typings/subscription'

export const SUBSCRIPTION_PLANS: Record<
    SubscriptionPlan,
    { name: string; credits: number; price: number }
> = {
    free: {
        name: 'Free',
        credits: 0,
        price: 0
    },
    plus: {
        name: 'Plus',
        credits: 3900,
        price: 33
    },
    pro: {
        name: 'Pro',
        credits: 19900,
        price: 166
    }
}
