import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader
} from '@/components/ui/sheet'
import { useState } from 'react'
import ModelSetting from './model-setting'
import ToolSetting from './tool-setting'
import { selectQuestionMode, useAppSelector } from '@/state'
import { QUESTION_MODE } from '@/typings'

enum TABS {
    MODEL = 'Model',
    TOOLS = 'Tools'
    // MCP_MARKET = 'MCP Market'
}

interface AgentSettingProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

const AgentSetting = ({ isOpen, onOpenChange }: AgentSettingProps) => {
    const [activeTab, setActiveTab] = useState(TABS.MODEL)
    const questionMode = useAppSelector(selectQuestionMode)

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="pt-0 md:pt-12 w-full !max-w-[560px]">
                <SheetHeader className="px-3 md:px-6 gap-6 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-x-3">
                            <SheetClose className="md:hidden cursor-pointer">
                                <Icon
                                    name="close"
                                    className="fill-grey-2 dark:fill-grey"
                                />
                            </SheetClose>
                            <p className="text-2xl font-semibold">
                                {questionMode === QUESTION_MODE.AGENT
                                    ? 'Agent Settings'
                                    : 'Chat Settings'}
                            </p>
                        </div>
                        <div className="hidden md:flex items-center gap-x-4">
                            {/* <Button
                                size="sm"
                                className="h-[22px] dark:bg-white/40 rounded-md"
                                onClick={handleReset}
                            >
                                Reset
                            </Button> */}
                            <SheetClose className="cursor-pointer">
                                <Icon
                                    name="close"
                                    className="fill-grey-2 dark:fill-grey"
                                />
                            </SheetClose>
                        </div>
                    </div>
                    <div
                        className={`${questionMode === QUESTION_MODE.CHAT ? 'hidden' : 'grid'} grid-cols-2 gap-x-4`}
                    >
                        {Object.values(TABS).map((tab) => (
                            <Button
                                key={tab}
                                className={`border border-firefly dark:border-sky-blue-2 text-base rounded-lg h-10 ${
                                    activeTab === tab
                                        ? 'bg-firefly dark:bg-sky-blue-2 text-sky-blue-2 dark:text-black'
                                        : 'dark:text-sky-blue-2'
                                }`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </Button>
                        ))}
                    </div>
                </SheetHeader>
                <div className="space-y-4 flex-1 overflow-auto px-3 md:px-6 md:pb-12">
                    <ModelSetting
                        className={activeTab === TABS.MODEL ? '' : 'hidden'}
                    />
                    <ToolSetting
                        className={activeTab === TABS.TOOLS ? '' : 'hidden'}
                    />
                    {/* <McpSetting
                        className={
                            activeTab === TABS.MCP_MARKET ? '' : 'hidden'
                        }
                    /> */}
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default AgentSetting
