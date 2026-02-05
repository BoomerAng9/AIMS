import { useNavigate } from 'react-router'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import dayjs from 'dayjs'

import { useAppSelector } from '@/state/store'
import {
    selectSubscriptionCurrentPeriodEnd,
    selectSubscriptionPlan,
    selectSubscriptionStatus,
    selectUser
} from '@/state/slice/user'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn, getFirstCharacters } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { billingService } from '@/services/billing.service'
import { connectorService } from '@/services/connector.service'
import { SubscriptionPlan } from '@/typings/subscription'
import { SUBSCRIPTION_PLANS } from '@/constants/subscription'

type GoogleDriveAction = 'connect' | 'disconnect' | null

const AccountTab = () => {
    const user = useAppSelector(selectUser)
    const { logout } = useAuth()
    const navigate = useNavigate()
    const [isManaging, setIsManaging] = useState(false)
    const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState(false)
    const [isGoogleDriveLoading, setIsGoogleDriveLoading] = useState(true)
    const [isGoogleDriveProcessing, setIsGoogleDriveProcessing] =
        useState(false)
    const [googleDriveAction, setGoogleDriveAction] =
        useState<GoogleDriveAction>(null)

    const status = useAppSelector(selectSubscriptionStatus)
    const currentPeriodEnd = useAppSelector(selectSubscriptionCurrentPeriodEnd)
    const plan = useAppSelector(selectSubscriptionPlan) ?? SubscriptionPlan.Free

    const formattedPeriodEnd = useMemo(() => {
        if (!currentPeriodEnd || (status !== 'active' && status !== 'paid'))
            return 'Not available'

        const parsed = dayjs(currentPeriodEnd)
        return parsed.isValid()
            ? parsed.format('MMMM D, YYYY')
            : 'Not available'
    }, [currentPeriodEnd, status])

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const handleManageSubscription = async () => {
        if (isManaging) return

        try {
            setIsManaging(true)
            const { url } = await billingService.createPortalSession({
                returnUrl: window.location.href
            })
            if (!url) {
                toast.error('Unable to open Stripe portal. Please try again.')
                return
            }

            window.open(url)
        } catch (error) {
            console.error('Failed to create Stripe portal session', error)
            toast.error('Unable to open Stripe portal. Please try again.')
        } finally {
            setIsManaging(false)
        }
    }

    useEffect(() => {
        let isMounted = true

        const fetchGoogleDriveStatus = async () => {
            try {
                const status = await connectorService.getGoogleDriveStatus()

                if (!isMounted) return

                setIsGoogleDriveConnected(Boolean(status.is_connected))
            } catch (error) {
                console.error('Failed to load Google Drive status', error)
            } finally {
                if (isMounted) {
                    setIsGoogleDriveLoading(false)
                }
            }
        }

        fetchGoogleDriveStatus()

        return () => {
            isMounted = false
        }
    }, [])

    const handleGoogleDriveConnect = async () => {
        if (isGoogleDriveProcessing) return

        setIsGoogleDriveProcessing(true)
        setGoogleDriveAction('connect')
        try {
            const { auth_url } = await connectorService.getGoogleDriveAuthUrl()
            const { code, state } =
                await connectorService.openAuthPopup(auth_url)
            const result = await connectorService.handleGoogleDriveCallback(
                code,
                state
            )

            if (!result.success) {
                throw new Error(
                    result.message || 'Failed to connect Google Drive.'
                )
            }

            setIsGoogleDriveConnected(true)
            toast.success('Google Drive connected successfully.')
        } catch (error) {
            console.error('Failed to connect Google Drive', error)
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to connect Google Drive.'
            )
        } finally {
            setIsGoogleDriveProcessing(false)
            setGoogleDriveAction(null)
        }
    }

    const handleGoogleDriveDisconnect = async () => {
        if (isGoogleDriveProcessing) return

        setIsGoogleDriveProcessing(true)
        setGoogleDriveAction('disconnect')
        try {
            const result = await connectorService.disconnectGoogleDrive()

            if (!result.success) {
                throw new Error(
                    result.message || 'Failed to disconnect Google Drive.'
                )
            }

            setIsGoogleDriveConnected(false)
            toast.success('Google Drive disconnected.')
        } catch (error) {
            console.error('Failed to disconnect Google Drive', error)
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to disconnect Google Drive.'
            )
        } finally {
            setIsGoogleDriveProcessing(false)
            setGoogleDriveAction(null)
        }
    }

    const googleDriveButtonLabel = (() => {
        if (isGoogleDriveLoading) return 'Checking...'
        if (isGoogleDriveProcessing) {
            return googleDriveAction === 'disconnect'
                ? 'Disconnecting...'
                : 'Connecting...'
        }
        return isGoogleDriveConnected ? 'Disconnect' : 'Connect your account'
    })()

    return (
        <div className="space-y-6 md:pt-2">
            <div className="flex items-center gap-4 mb-6">
                <Avatar className="size-14">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>
                        {user?.first_name
                            ? getFirstCharacters(
                                  `${user?.first_name} ${user?.last_name}`
                              )
                            : `II`}
                    </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <p className="text-[18px] font-semibold">{`${user?.first_name} ${user?.last_name}`}</p>
                    <p className="text-sm">{user?.email}</p>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-[18px] font-semibold mb-4">
                    Linked Accounts
                </h2>
                <div className="flex items-center justify-between">
                    <p className="text-sm">Google</p>
                    <Button
                        className={cn(
                            'underline p-0 h-auto text-black/[0.56] dark:text-white/[0.56]',
                            isGoogleDriveConnected &&
                                'text-red-600 dark:text-red-400'
                        )}
                        disabled={
                            isGoogleDriveLoading || isGoogleDriveProcessing
                        }
                        onClick={
                            isGoogleDriveConnected
                                ? handleGoogleDriveDisconnect
                                : handleGoogleDriveConnect
                        }
                    >
                        {googleDriveButtonLabel}
                    </Button>
                </div>
            </div>

            {plan !== SubscriptionPlan.Free && (
                <div className="pt-4 md:pt-6 border-t border-black/30 dark:border-white/30">
                    <h2 className="text-[18px] font-semibold mb-2">
                        Payment & Invoices
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-x-4">
                            <Button
                                size="xl"
                                className="bg-firefly text-sky-blue-2 dark:bg-sky-blue dark:text-black font-semibold w-[247px]"
                                onClick={handleManageSubscription}
                            >
                                Manage
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {plan !== SubscriptionPlan.Free && (
                <div className="pt-4 md:pt-6 border-t border-black/30 dark:border-white/30">
                    <h2 className="text-[18px] font-semibold mb-2">
                        {`ACHEEVY ${SUBSCRIPTION_PLANS[plan].name} Plan`}
                    </h2>
                    <div className="space-y-4">
                        <p className="text-sm text-black dark:text-white">
                            Your plan auto-renews on {formattedPeriodEnd}.
                        </p>
                        <div className="flex items-center gap-x-4">
                            <Button
                                size="xl"
                                className="bg-firefly text-sky-blue-2 dark:bg-sky-blue dark:text-black font-semibold w-[247px]"
                                onClick={handleManageSubscription}
                            >
                                Manage
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="pt-4 md:py-6 border-t border-black/30 dark:border-white/30">
                <h2 className="text-[18px] font-semibold mb-4">Security</h2>
                <div className="flex items-center gap-x-4">
                    <Button
                        size="xl"
                        className="bg-firefly text-sky-blue-2 dark:bg-sky-blue dark:text-black font-semibold w-[247px]"
                        onClick={handleLogout}
                    >
                        Log out
                    </Button>

                    {/* <Button
                        size="xl"
                        variant="outline"
                        className="text-red border-red w-[247px]"
                    >
                        Delete account
                    </Button> */}
                </div>
            </div>
        </div>
    )
}

export default AccountTab
