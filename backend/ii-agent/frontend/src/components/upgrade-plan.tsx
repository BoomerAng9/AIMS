import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getStripe } from '@/lib/stripe'
import { billingService } from '@/services/billing.service'
import {
    SubscriptionPlan,
    type BillingCycle,
    type SubscriptionPlanId
} from '@/typings/subscription'
import {
    selectSubscriptionBillingCycle,
    selectSubscriptionPlan
} from '@/state/slice/user'
import { useAppSelector } from '@/state'
import { Icon } from './ui/icon'
import { useIsMobile } from '@/hooks/use-mobile'

type PlanFeature = {
    id: string
    content: ReactNode
    icon?: 'star' | 'sparkles'
}

type Plan = {
    id: SubscriptionPlanId
    name: string
    isRecommended?: boolean
    highlight?: boolean
    description?: string
    prices: Record<BillingCycle, number>
    features: PlanFeature[]
}

type UpgradePlanProps = {
    className?: string
    title?: ReactNode
    subtitle?: ReactNode
}

// const BILLING_OPTIONS: Array<{
//     id: BillingCycle
//     label: string
//     helper?: string
// }> = [
//     { id: 'monthly', label: 'Monthly' },
//     { id: 'annually', label: 'Annually', helper: '(-10%)' }
// ]

const PLANS: Plan[] = [
    {
        id: SubscriptionPlan.Free,
        name: 'Free',
        description: 'Try ACHEEVY',
        prices: {
            monthly: 0,
            annually: 0
        },
        features: [
            {
                id: 'credit',
                content: '300 credits/month'
            },
            {
                id: 'full-stack-web-development',
                content: 'Full Stack Web Development'
            },
            {
                id: 'bring-your-own-key',
                content: 'Bring Your Own Key (BYOK)'
            },
            {
                id: 'general-task-solving',
                content: 'General Task Solving'
            },
            {
                id: 'customize-any-mcp',
                content: 'Customize any MCP'
            },
            {
                id: 'slide-creation',
                content: 'Slide Creation'
            },
            {
                id: 'image-video-generation',
                content: 'Image/Video Generation'
            }
        ]
    },
    {
        id: SubscriptionPlan.Plus,
        name: 'Plus',
        description: 'Extended usage',
        isRecommended: true,
        prices: {
            monthly: 30,
            annually: 27
        },
        features: [
            {
                id: 'credit',
                content: '2,000 credits/month'
            },
            {
                id: 'full-stack-web-development',
                content: 'Full Stack Web Development'
            },
            {
                id: 'bring-your-own-key',
                content: 'Bring Your Own Key (BYOK)'
            },
            {
                id: 'general-task-solving',
                content: 'General Task Solving'
            },
            {
                id: 'customize-any-mcp',
                content: 'Customize any MCP'
            },
            {
                id: 'slide-creation',
                content: 'Slide Creation'
            },
            {
                id: 'image-video-generation',
                content: 'Image/Video Generation'
            }
        ]
    },
    {
        id: SubscriptionPlan.Pro,
        name: 'Pro',
        description: 'Full access to all features',
        prices: {
            monthly: 120,
            annually: 138
        },
        features: [
            {
                id: 'credit',
                content: '10,000 credits/month'
            },
            {
                id: 'full-stack-web-development',
                content: 'Full Stack Web Development'
            },
            {
                id: 'bring-your-own-key',
                content: 'Bring Your Own Key (BYOK)'
            },
            {
                id: 'general-task-solving',
                content: 'General Task Solving'
            },
            {
                id: 'customize-any-mcp',
                content: 'Customize any MCP'
            },
            {
                id: 'slide-creation',
                content: 'Slide Creation'
            },
            {
                id: 'image-video-generation',
                content: 'Image/Video Generation'
            }
        ]
    }
]

function formatPrice(value: number) {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
        maximumFractionDigits: 2
    })
}

export function UpgradePlan({ className }: UpgradePlanProps) {
    const subscriptionPlan = useAppSelector(selectSubscriptionPlan)
    const subscriptionBillingCycle = useAppSelector(
        selectSubscriptionBillingCycle
    )
    // const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
    const billingCycle = 'monthly'
    const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlanId | null>(
        null
    )
    const [selectedPlan, setSelectedPlan] = useState(
        subscriptionPlan === SubscriptionPlan.Free
            ? SubscriptionPlan.Plus
            : SubscriptionPlan.Pro
    )

    const plans = useMemo(() => PLANS, [])
    const isMobile = useIsMobile()

    const handleUpgrade = useCallback(
        async (planId: SubscriptionPlanId) => {
            if (planId === subscriptionPlan) {
                return
            }

            if (
                planId === SubscriptionPlan.Pro &&
                subscriptionPlan === SubscriptionPlan.Plus
            ) {
                const { url } = await billingService.createPortalSession({
                    returnUrl: window.location.href
                })
                if (!url) {
                    toast.error(
                        'Unable to open Stripe portal. Please try again.'
                    )
                    return
                }

                window.open(url)
                return
            }

            try {
                setLoadingPlan(planId)

                const checkoutSession =
                    await billingService.createCheckoutSession({
                        planId,
                        billingCycle
                    })

                if (checkoutSession?.url) {
                    window.location.href = checkoutSession.url
                    return
                }

                if (!checkoutSession?.sessionId) {
                    throw new Error('Checkout session identifier missing')
                }

                const stripe = await getStripe()
                if (!stripe) {
                    throw new Error('Unable to initialize Stripe client')
                }

                const { error } = await stripe.redirectToCheckout({
                    sessionId: checkoutSession.sessionId
                })

                if (error) {
                    throw error
                }
            } catch (error) {
                console.error('Failed to start checkout session', error)
                toast.error('Unable to start checkout. Please try again.')
            } finally {
                setLoadingPlan(null)
            }
        },
        [billingCycle, subscriptionPlan]
    )

    return (
        <section
            className={cn(
                'flex w-full md:w-max flex-col gap-6 md:p-6 rounded-2xl h-[calc(100vh-200px)] md:h-auto overflow-auto',
                { 'bg-firefly/10 dark:bg-sky-blue-2/10': !isMobile },
                className
            )}
        >
            <div className="block md:hidden bg-firefly/10 dark:bg-sky-blue-2/10 rounded-xl p-3">
                {plans.map((plan) => {
                    const isCurrentPlan = plan.id === subscriptionPlan
                    const matchesCurrentBillingCycle =
                        isCurrentPlan &&
                        (!subscriptionBillingCycle ||
                            subscriptionBillingCycle === billingCycle)
                    const price = plan.prices[billingCycle]
                    const priceSuffix = '/month'
                    const shouldHideUpgrade =
                        plan.id === SubscriptionPlan.Free ||
                        (subscriptionPlan === SubscriptionPlan.Plus &&
                            plan.id === SubscriptionPlan.Plus) ||
                        subscriptionPlan === SubscriptionPlan.Pro

                    return (
                        <div
                            key={plan.id}
                            className={cn(
                                'relative cursor-pointer flex justify-between rounded-xl p-3 w-full',
                                plan.id === selectedPlan
                                    ? 'bg-firefly/20 dark:bg-sky-blue-2/30'
                                    : ''
                            )}
                            onClick={() =>
                                setSelectedPlan(plan.id as SubscriptionPlan)
                            }
                        >
                            <div className="flex gap-x-3 items-center">
                                <div>
                                    {plan.id === selectedPlan ? (
                                        <input
                                            type="radio"
                                            checked
                                            readOnly
                                            className="size-3 accent-black dark:accent-white"
                                        />
                                    ) : (
                                        <span className="block size-3 border border-black dark:border-white rounded-full" />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-semibold">
                                            {plan.name}
                                        </h3>
                                        {matchesCurrentBillingCycle && (
                                            <span className="px-2 text-[10px] bg-[#d9d9d9] text-black font-semibold rounded-full">
                                                current
                                            </span>
                                        )}
                                        {plan.isRecommended &&
                                            !matchesCurrentBillingCycle && (
                                                <span className="px-2 text-[10px] bg-yellow text-black font-semibold rounded-full">
                                                    most benefits
                                                </span>
                                            )}
                                    </div>
                                    {plan.description && (
                                        <p className="text-xs">
                                            {plan.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-end">
                                <span className="text-base font-bold dark:text-[#8dd4d4]">
                                    {`$${formatPrice(price)}`}
                                </span>
                                <span className="text-sm dark:text-[#e4e4e4] ml-px mb-0.5">
                                    {priceSuffix}
                                </span>
                            </div>
                            {!shouldHideUpgrade && plan.id === selectedPlan && (
                                <div className="px-3 fixed bottom-4 left-0 w-full">
                                    <Button
                                        disabled={
                                            matchesCurrentBillingCycle ||
                                            loadingPlan === plan.id
                                        }
                                        onClick={() => handleUpgrade(plan.id)}
                                        className={cn(
                                            'w-full rounded-xl text-base font-semibold py-6 transition-colors',
                                            'bg-sky-blue cursor-pointer text-black',
                                            loadingPlan === plan.id &&
                                                'opacity-70'
                                        )}
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            {loadingPlan === plan.id ? (
                                                'Redirecting...'
                                            ) : (
                                                <>
                                                    <Icon
                                                        name="arrow-up-circle"
                                                        className="fill-black size-5"
                                                    />
                                                    Upgrade Now
                                                </>
                                            )}
                                        </span>
                                    </Button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
            <div className="block md:hidden">
                <h4 className="text-base font-semibold mb-3">Features</h4>
                <ul className="flex flex-col gap-3">
                    {plans
                        .find((plan) => plan.id === selectedPlan)
                        ?.features.map((feature) => (
                            <li
                                key={feature.id}
                                className="flex items-end gap-[6px]"
                            >
                                <Icon
                                    name="tick"
                                    className="fill-firefly dark:fill-yellow size-5"
                                />
                                <span className="text-xs">
                                    {feature.content}
                                </span>
                            </li>
                        ))}
                </ul>
            </div>

            <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    const isCurrentPlan = plan.id === subscriptionPlan
                    const matchesCurrentBillingCycle =
                        isCurrentPlan &&
                        (!subscriptionBillingCycle ||
                            subscriptionBillingCycle === billingCycle)

                    const price = plan.prices[billingCycle]
                    const priceSuffix = '/month'
                    const shouldHideUpgrade =
                        plan.id === SubscriptionPlan.Free ||
                        (subscriptionPlan === SubscriptionPlan.Plus &&
                            plan.id === SubscriptionPlan.Plus) ||
                        subscriptionPlan === SubscriptionPlan.Pro

                    return (
                        <div key={plan.id} className="h-full flex flex-col">
                            <div
                                className={cn(
                                    'relative cursor-pointer flex h-full flex-col rounded-2xl p-4 w-full md:w-[260px]',
                                    plan.id === selectedPlan
                                        ? 'bg-firefly/20 dark:bg-sky-blue-2/30'
                                        : ''
                                )}
                                onClick={() =>
                                    setSelectedPlan(plan.id as SubscriptionPlan)
                                }
                            >
                                <div className="absolute flex top-4 right-4">
                                    {plan.id === selectedPlan ? (
                                        <input
                                            type="radio"
                                            checked
                                            readOnly
                                            className="size-3 accent-black dark:accent-white"
                                        />
                                    ) : (
                                        <span className="block size-3 border border-black dark:border-white rounded-full" />
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-semibold">
                                            {plan.name}
                                        </h3>
                                        {matchesCurrentBillingCycle && (
                                            <span className="px-3 py-1 text-[10px] bg-[#d9d9d9] text-black font-semibold rounded-full">
                                                current
                                            </span>
                                        )}
                                        {plan.isRecommended &&
                                            !matchesCurrentBillingCycle && (
                                                <span className="px-3 py-1 text-[10px] bg-yellow text-black font-semibold rounded-full">
                                                    most benefits
                                                </span>
                                            )}
                                    </div>
                                    {plan.description && (
                                        <p className="text-sm">
                                            {plan.description}
                                        </p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <div className="flex items-end">
                                        <span className="text-2xl font-bold dark:text-[#8dd4d4]">
                                            {`$${formatPrice(price)}`}
                                        </span>
                                        <span className="text-sm dark:text-[#e4e4e4] ml-1 mb-1">
                                            {priceSuffix}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-base font-semibold mb-3">
                                        Features
                                    </h4>
                                    <ul className="flex flex-col gap-3">
                                        {plan.features.map((feature) => (
                                            <li
                                                key={feature.id}
                                                className="flex items-end gap-[6px]"
                                            >
                                                <Icon
                                                    name="tick"
                                                    className="fill-firefly dark:fill-yellow size-5"
                                                />
                                                <span className="text-xs">
                                                    {feature.content}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            {!shouldHideUpgrade && plan.id === selectedPlan && (
                                <Button
                                    disabled={
                                        matchesCurrentBillingCycle ||
                                        loadingPlan === plan.id
                                    }
                                    onClick={() => handleUpgrade(plan.id)}
                                    className={cn(
                                        'mt-4 w-full rounded-xl text-base font-semibold py-6 transition-colors',
                                        'bg-sky-blue cursor-pointer text-black',
                                        loadingPlan === plan.id && 'opacity-70'
                                    )}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        {loadingPlan === plan.id ? (
                                            'Redirecting...'
                                        ) : (
                                            <>
                                                <Icon
                                                    name="arrow-up-circle"
                                                    className="fill-black size-5"
                                                />
                                                Upgrade Now
                                            </>
                                        )}
                                    </span>
                                </Button>
                            )}
                        </div>
                    )
                })}
            </div>
        </section>
    )
}
