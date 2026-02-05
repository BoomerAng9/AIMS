import { DialogContent } from '@/components/ui/dialog'

import { UpgradePlan } from './upgrade-plan'

export function UpgradePlanDialogContent() {
    return (
        <DialogContent
            className="!max-w-[1120px] w-full border-none bg-transparent p-0 shadow-none"
            showCloseButton
        >
            <UpgradePlan />
        </DialogContent>
    )
}
