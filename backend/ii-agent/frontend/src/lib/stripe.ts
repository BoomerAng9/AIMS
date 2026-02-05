import { loadStripe, type Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null> | null = null

export function getStripe() {
    if (!stripePromise) {
        const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

        if (!publishableKey) {
            console.error('VITE_STRIPE_PUBLISHABLE_KEY is not set')
            return Promise.resolve(null)
        }

        stripePromise = loadStripe(publishableKey)
    }

    return stripePromise
}
