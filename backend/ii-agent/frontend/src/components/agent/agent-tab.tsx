import { useMemo } from 'react'
import clsx from 'clsx'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
    selectActiveTab,
    selectVscodeUrl,
    setActiveTab,
    useAppDispatch,
    useAppSelector
} from '@/state'
import { TAB } from '@/typings/agent'

const AgentTabs = () => {
    const dispatch = useAppDispatch()

    const activeTab = useAppSelector(selectActiveTab)
    const vscodeUrl = useAppSelector(selectVscodeUrl)

    const isShareMode = useMemo(
        () => location.pathname.includes('/share/'),
        [location.pathname]
    )

    const handleOpenVSCode = () => {
        if (!vscodeUrl) {
            toast.error('VS Code URL not available. Please try again.')
            return
        }

        window.open(vscodeUrl, '_blank')
    }

    return (
        <div className="hidden md:flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-white/30">
            <div className="flex items-center gap-x-2">
                <Button
                    className={clsx(
                        'h-7 text-xs font-semibold px-4 rounded-full border border-sky-blue',
                        {
                            'bg-firefly border-firefly dark:border-sky-blue-2 dark:bg-sky-blue text-sky-blue-2 dark:text-black':
                                activeTab === TAB.BUILD,
                            'dark:border-sky-blue border-firefly dark:text-sky-blue':
                                activeTab !== TAB.BUILD
                        }
                    )}
                    onClick={() => dispatch(setActiveTab(TAB.BUILD))}
                >
                    Build
                </Button>
                {!isShareMode && (
                    <Button
                        className={clsx(
                            'h-7 text-xs font-semibold px-4 rounded-full border border-sky-blue',
                            {
                                'bg-firefly border-firefly dark:border-sky-blue-2 dark:bg-sky-blue text-sky-blue-2 dark:text-black':
                                    activeTab === TAB.CODE,
                                'dark:border-sky-blue border-firefly dark:text-sky-blue':
                                    activeTab !== TAB.CODE
                            }
                        )}
                        onClick={() => dispatch(setActiveTab(TAB.CODE))}
                    >
                        Code
                    </Button>
                )}
                <Button
                    className={clsx(
                        'h-7 text-xs font-semibold px-4 rounded-full border border-sky-blue',
                        {
                            'bg-firefly border-firefly dark:border-sky-blue-2 dark:bg-sky-blue text-sky-blue-2 dark:text-black':
                                activeTab === TAB.RESULT,
                            'dark:border-sky-blue border-firefly dark:text-sky-blue':
                                activeTab !== TAB.RESULT
                        }
                    )}
                    onClick={() => dispatch(setActiveTab(TAB.RESULT))}
                >
                    Result
                </Button>
            </div>
            {vscodeUrl && !isShareMode && (
                <Button
                    className="rounded-full h-7 text-xs font-semibold"
                    variant="outline"
                    onClick={handleOpenVSCode}
                >
                    <img
                        src={'/images/vscode.png'}
                        alt="VS Code"
                        width={16}
                        height={16}
                    />{' '}
                    Open in VS Code
                </Button>
            )}
        </div>
    )
}

export default AgentTabs
