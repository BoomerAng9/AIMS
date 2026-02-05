import { useEffect } from 'react'
import { toast } from 'sonner'
import { useNavigate, useSearchParams } from 'react-router'
import Lottie from 'lottie-react'

import Success from '@/assets/success.json'
import { authService } from '@/services/auth.service'
import { useAppDispatch } from '@/state'
import { setUser } from '@/state/slice/user'

const BillingSuccess = () => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const sessionId = searchParams.get('session_id')

    useEffect(() => {
        if (!sessionId) {
            toast.warning(
                'No Stripe session provided. Showing subscription overview.'
            )
        } else {
            toast.success('Subscription updated successfully.')
        }

        const timer = setTimeout(() => {
            navigate('/', { replace: true })
        }, 3000)

        return () => clearTimeout(timer)
    }, [sessionId, navigate])

    useEffect(() => {
        ;(async () => {
            const userRes = await authService.getCurrentUser()
            dispatch(setUser(userRes))
        })()
    }, [])

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
            <div className="max-w-md space-y-4">
                <div className="flex justify-center">
                    <Lottie
                        className="w-40"
                        animationData={Success}
                        loop={true}
                    />
                </div>
                <h1 className="text-2xl font-semibold text-firefly dark:text-white">
                    Payment Successful
                </h1>
                <p className="text-sm text-slate dark:text-white/70">
                    {sessionId
                        ? 'We received your payment details and are updating your subscription now.'
                        : 'Redirecting you back to your home page.'}
                </p>
                <p className="text-xs text-slate/70 dark:text-white/50">
                    Redirecting to home page...
                </p>
            </div>
        </div>
    )
}

export const Component = BillingSuccess
