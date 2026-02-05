import { useTheme } from 'next-themes'

import { Icon } from './ui/icon'
import ButtonIcon from './button-icon'
import { WebSocketConnectionState } from '@/typings/agent'
import { useAppSelector } from '@/state/store'
import { selectUser } from '@/state/slice/user'
import UserProfileDropdown from './user-profile-dropdown'

const RightSidebar = () => {
    const { theme, setTheme } = useTheme()

    const wsConnectionState = useAppSelector(
        (state) => state.agent.wsConnectionState
    )
    const user = useAppSelector(selectUser)

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    if (!user) return null

    return (
        <div className="hidden md:flex items-center justify-between flex-col h-full py-8 px-6 border-l border-neutral-200 dark:border-sidebar-border">
            <div className="flex flex-col items-center gap-4">
                <UserProfileDropdown />

                <ButtonIcon
                    name={theme === 'dark' ? 'sun' : 'moon'}
                    iconClassName="!fill-none stroke-black"
                    className="border border-black"
                    onClick={toggleTheme}
                />
            </div>
            {wsConnectionState === WebSocketConnectionState.CONNECTED && (
                <Icon name="connected" />
            )}
        </div>
    )
}

export default RightSidebar
