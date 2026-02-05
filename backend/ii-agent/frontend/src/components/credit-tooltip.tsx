import { ReactNode } from 'react'
import { useNavigate } from 'react-router'

import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { Icon } from './ui/icon'
import { Button } from './ui/button'

interface CreditTooltipProps {
    credits: number
    bonusCredits?: number
    children: ReactNode
    hideViewUsage?: boolean
}

const CreditTooltip = ({
    credits,
    bonusCredits = 0,
    children,
    hideViewUsage
}: CreditTooltipProps) => {
    const navigate = useNavigate()

    const formatCredit = (value: number) =>
        value.toLocaleString('en-US', {
            maximumFractionDigits: 4
        })

    const handleViewUsage = () => {
        navigate('/settings/usage')
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent side="top">
                <div className="w-[160px] text-sm flex flex-col items-start justify-between gap-1">
                    <div className="w-full flex items-center justify-between gap-6">
                        <span className="font-semibold flex-1">Credit</span>
                        <span>{formatCredit(Math.round(credits))}</span>
                    </div>
                    <div className="w-full flex items-center justify-between gap-6">
                        <span className="font-semibold flex-1">
                            Bonus Credit
                        </span>
                        <span>{formatCredit(Math.round(bonusCredits))}</span>
                    </div>
                    {!hideViewUsage && (
                        <Button className="!p-0" onClick={handleViewUsage}>
                            View Usage{' '}
                            <Icon
                                name="arrow-right-2"
                                className="size-4 stroke-black"
                            />
                        </Button>
                    )}
                </div>
            </TooltipContent>
        </Tooltip>
    )
}

export default CreditTooltip
