import Lottie from 'lottie-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import Cancel from '@/assets/cancel.json'

const BillingCancel = () => {
    const navigate = useNavigate()

    useEffect(() => {
        toast.info(
            'Checkout cancelled. No changes were made to your subscription.'
        )

        const timer = setTimeout(() => {
            navigate('/settings/subscription', { replace: true })
        }, 2000)

        return () => clearTimeout(timer)
    }, [navigate])

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
            <div className="max-w-md space-y-4">
                <div className="flex justify-center">
                    <Lottie
                        className="w-30"
                        animationData={Cancel}
                        loop={true}
                    />
                </div>
                <h1 className="text-2xl font-semibold text-firefly dark:text-white">
                    Checkout Cancelled
                </h1>
                <p className="text-sm text-slate dark:text-white/70">
                    You can resume your checkout anytime from the subscription
                    page.
                </p>
                <p className="text-xs text-slate/70 dark:text-white/50">
                    Redirecting to subscription settings...
                </p>
            </div>
        </div>
    )
}

export const Component = BillingCancel
