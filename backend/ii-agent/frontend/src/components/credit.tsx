import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'

import { useAppSelector, useGetCreditBalanceQuery } from '@/state'
import { Button } from './ui/button'
import CreditTooltip from './credit-tooltip'
import { Dialog, DialogTrigger } from './ui/dialog'
import { Icon } from './ui/icon'
import { selectSubscriptionPlan } from '@/state/slice/user'
import { SUBSCRIPTION_PLANS } from '@/constants/subscription'
import { SubscriptionPlan } from '@/typings/subscription'

const Credit = () => {
    const navigate = useNavigate()
    const subscriptionPlan = useAppSelector(selectSubscriptionPlan)

    // Use RTK Query hook instead of Redux selectors
    const { data: balanceData, isLoading } = useGetCreditBalanceQuery()

    const availableCredit = balanceData?.credits || 0
    const bonusCredit = balanceData?.bonus_credits || 0

    const formatCredit = (value: number) => value.toLocaleString('en-US')

    const handleGotoSubscription = () => {
        navigate('/settings/subscription')
    }

    const totalCredit = useMemo(() => {
        return availableCredit + bonusCredit
    }, [availableCredit, bonusCredit])

    const isProPlan = useMemo(
        () => subscriptionPlan === SubscriptionPlan.Pro,
        [subscriptionPlan]
    )

    if (isLoading) return null

    return (
        <div className="hidden md:flex flex-col items-start gap-y-4 p-6 pb-8 border-t border-grey-2/30 dark:border-white/30">
            <p className="text-xs font-semibold text-sky-blue dark:text-black bg-firefly dark:bg-sky-blue px-2 h-[22px] rounded-full flex items-center">
                {subscriptionPlan
                    ? `${SUBSCRIPTION_PLANS[subscriptionPlan]?.name} Plan`
                    : 'Free Plan'}
            </p>
            <CreditTooltip credits={availableCredit} bonusCredits={bonusCredit}>
                <div className="flex gap-x-2 cursor-default">
                    <Icon
                        name="coin"
                        className="fill-firefly dark:fill-white"
                    />
                    <div>
                        <div>
                            <Link
                                to="/settings/usage"
                                className="font-bold text-firefly dark:text-sky-blue hover:underline"
                            >
                                {formatCredit(Math.round(totalCredit))}
                            </Link>
                            {/* <span className="ml-[6px] text-firefly/30 dark:text-white/30">{`/ ${formatCredit(totalCredit)}`}</span> */}
                        </div>
                        <p className="text-firefly dark:text-white text-xs">
                            Credits
                        </p>
                    </div>
                </div>
            </CreditTooltip>
            {!isProPlan && (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            size="xl"
                            className="w-full border-firefly text-firefly dark:border-sky-blue dark:text-sky-blue"
                            onClick={handleGotoSubscription}
                        >
                            <Icon
                                name="edit"
                                className="size-5 fill-firefly dark:fill-sky-blue"
                            />
                            Upgrade Plan
                        </Button>
                    </DialogTrigger>
                </Dialog>
            )}
        </div>
    )
}

export default Credit
