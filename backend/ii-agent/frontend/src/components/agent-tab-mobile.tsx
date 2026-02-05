import { useMemo } from 'react'
import clsx from 'clsx'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Icon } from '@/components/ui/icon'
import {
    selectActiveTab,
    setActiveTab,
    useAppDispatch,
    useAppSelector
} from '@/state'
import { TAB } from '@/typings/agent'

export type ChatOption = 'chat' | 'design' | 'files'

interface AgentTabMobileProps {
    isShowChat: boolean
    onToggleChat: (value: boolean) => void
    activeChatOption: ChatOption
    onChatOptionChange: (option: ChatOption) => void
}

const AgentTabMobile = ({
    isShowChat,
    onToggleChat,
    activeChatOption,
    onChatOptionChange
}: AgentTabMobileProps) => {
    const dispatch = useAppDispatch()
    const activeTab = useAppSelector(selectActiveTab)

    const chatOptionLabel = useMemo(() => {
        switch (activeChatOption) {
            case 'design':
                return 'Design'
            case 'files':
                return 'All files'
            case 'chat':
            default:
                return 'Chat'
        }
    }, [activeChatOption])

    const handleSelectTab = (tab: TAB) => {
        onToggleChat(false)
        dispatch(setActiveTab(tab))
    }

    const handleChatOptionSelect = (option: ChatOption) => {
        onChatOptionChange(option)
        onToggleChat(true)
    }

    return (
        <div className="px-3 flex md:hidden items-center gap-3 mt-1">
            <DropdownMenu>
                <DropdownMenuTrigger
                    className={clsx(
                        `flex-1 text-sm cursor-pointer flex justify-between md:hidden px-4 py-[6px] rounded-3xl`,
                        {
                            'border border-black text-black dark:border-sky-blue dark:text-sky-blue':
                                isShowChat,
                            'bg-firefly text-sky-blue-2 dark:bg-sky-blue dark:text-black':
                                !isShowChat
                        }
                    )}
                >
                    <span className="capitalize font-semibold">
                        {activeTab}
                    </span>
                    <Icon
                        name="arrow-down"
                        className={clsx('size-5', {
                            'fill-black dark:fill-white': isShowChat,
                            'fill-sky-blue-2 dark:fill-black': !isShowChat
                        })}
                    />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="w-[185px] px-4 py-2"
                >
                    <DropdownMenuItem
                        className="px-0 py-2"
                        onClick={() => handleSelectTab(TAB.BUILD)}
                    >
                        <Icon name="build" className="size-5 stroke-black" />
                        Build
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        disabled
                        className="px-0 py-2"
                        onClick={() => handleSelectTab(TAB.CODE)}
                    >
                        <Icon name="code-2" className="size-5 stroke-black" />
                        Code
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="px-0 py-2"
                        onClick={() => handleSelectTab(TAB.RESULT)}
                    >
                        <Icon name="ai-magic" className="size-5 stroke-black" />
                        Result
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
                <DropdownMenuTrigger
                    className={clsx(
                        `flex-1 text-sm cursor-pointer flex justify-between md:hidden px-4 py-[6px] rounded-3xl`,
                        {
                            'border border-black text-black dark:border-sky-blue dark:text-sky-blue':
                                !isShowChat,
                            'bg-firefly text-sky-blue-2 dark:bg-sky-blue dark:text-black':
                                isShowChat
                        }
                    )}
                >
                    <span className="capitalize font-semibold">
                        {chatOptionLabel}
                    </span>
                    <Icon
                        name="arrow-down"
                        className={clsx('size-5', {
                            'fill-black dark:fill-white': !isShowChat,
                            'fill-sky-blue-2 dark:fill-black': isShowChat
                        })}
                    />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="w-[185px] px-4 py-2"
                >
                    <DropdownMenuItem
                        className="px-0 py-2"
                        onClick={() => handleChatOptionSelect('chat')}
                    >
                        <Icon name="chat" className="size-5 fill-black" />
                        Chat
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        disabled
                        className="px-0 py-2"
                        onClick={() => handleChatOptionSelect('design')}
                    >
                        <Icon name="design-2" className="size-5 fill-black" />
                        Design
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="px-0 py-2"
                        onClick={() => handleChatOptionSelect('files')}
                    >
                        <Icon
                            name="document-text"
                            className="size-5 fill-black"
                        />
                        All Files
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

export default AgentTabMobile
