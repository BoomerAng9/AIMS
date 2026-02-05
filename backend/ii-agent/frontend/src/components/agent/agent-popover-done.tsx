import dayjs from 'dayjs'
import findLast from 'lodash/findLast'
import { useMemo, useState } from 'react'

import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@/components/ui/popover'
import { selectMessages, useAppSelector } from '@/state'
import { Message, TOOL } from '@/typings'
import { Icon } from '../ui/icon'

const AgentPopoverDone = () => {
    const [open, setOpen] = useState(false)
    const messages = useAppSelector(selectMessages)

    const plans = useMemo(
        () =>
            findLast(
                messages,
                (m: Message) => m?.action?.type === TOOL.TODO_WRITE
            )?.action?.data?.tool_input?.todos || [],
        [messages]
    )

    if (!plans || plans.length === 0) return null

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger>
                <div className="bg-firefly shadow-btn dark:bg-sky-blue rounded-full flex items-center justify-center cursor-pointer gap-3 py-[6px] px-4">
                    <Icon
                        name="brain"
                        className="stroke-sky-blue-2 dark:stroke-black size-5 md:size-7"
                    />
                    <span className="text-sm md:text-base font-semibold text-sky-blue-2 dark:text-black">
                        What I have done?
                    </span>
                </div>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                className="bg-white rounded-xl p-0 text-black w-[320px] border-none dark:border shadow-[0px_4px_24px_rgba(0,0,0,0.16)]"
            >
                <div className="flex items-center justify-between p-4 pb-0">
                    <span className="text-base font-semibold">
                        What I have done
                    </span>
                    <button
                        className="cursor-pointer"
                        onClick={() => setOpen(false)}
                    >
                        <Icon name="cancel" />
                    </button>
                </div>
                <div className="flex mt-4 px-4">
                    <p className="py-[6px] text-center px-4 text-[#666600] bg-[#666600]/10 rounded-full font-semibold">
                        {dayjs().format('HH:mm')}
                    </p>
                </div>
                <div className="mt-3 space-y-3 max-h-[400px] overflow-auto px-4 pb-4">
                    {Array.isArray(plans) &&
                        plans?.map((plan) => (
                            <div
                                key={plan.id}
                                className="flex items-start gap-x-[6px]"
                            >
                                <Icon name="tick-circle" />
                                <span className="flex-1">{plan.content}</span>
                            </div>
                        ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default AgentPopoverDone
