import { useNavigate } from 'react-router'

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { getFirstCharacters } from '@/lib/utils'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from './ui/dropdown-menu'
import { useAuth } from '@/contexts/auth-context'
import { selectUser } from '@/state/slice/user'
import { useAppSelector } from '@/state/store'
import { Icon } from './ui/icon'

interface UserProfileDropdownProps {
    avatarClassName?: string
}

const UserProfileDropdown = ({ avatarClassName }: UserProfileDropdownProps) => {
    const navigate = useNavigate()
    const { logout } = useAuth()
    const user = useAppSelector(selectUser)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const handleGetHelp = () => {
        window.open('https://discord.com/invite/intelligentinternet', '_blank')
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Avatar
                    className={`size-10 cursor-pointer hover:opacity-80 transition-opacity ${avatarClassName}`}
                >
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>
                        {user?.first_name
                            ? getFirstCharacters(
                                  `${user?.first_name} ${user?.last_name}`
                              )
                            : `II`}
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[189px] space-y-4">
                <DropdownMenuItem className="flex items-center gap-2 p-0">
                    <Avatar className="size-10">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="text-xs">
                            {user?.first_name
                                ? getFirstCharacters(
                                      `${user?.first_name} ${user?.last_name}`
                                  )
                                : `II`}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm">
                            {user?.first_name} {user?.last_name}
                        </span>
                        <span className="text-xs truncate">{user?.email}</span>
                    </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="flex items-center gap-[6px] p-0"
                    onClick={() => navigate('/settings/account')}
                >
                    <Icon name="user-2" className="size-4 fill-black" />
                    <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="flex items-center gap-[6px] p-0"
                    onClick={() => navigate('/settings/subscription')}
                >
                    <Icon name="dollar-circle" className="size-4 fill-black" />
                    <span>Subscription</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="flex items-center gap-[6px] p-0"
                    onClick={() => navigate('/settings/account')}
                >
                    <Icon name="receipt" className="size-4 fill-black" />
                    <span>Payment &amp; Billing</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-3" />
                <DropdownMenuItem
                    className="flex items-center gap-[6px] p-0"
                    onClick={() => navigate('/settings/general')}
                >
                    <Icon name="setting-2" className="size-4 fill-black" />
                    <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="flex items-center justify-between gap-[6px] p-0"
                    onClick={handleGetHelp}
                >
                    <div className="flex items-center gap-[6px]">
                        <Icon name="help" className="size-4 stroke-black" />
                        <span>Get Help</span>
                    </div>
                    <Icon name="arrow-right-2" className="size-4 fill-black" />
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-3" />
                <DropdownMenuItem
                    className="flex items-center gap-[6px] text-red-2 p-0"
                    variant="destructive"
                    onClick={handleLogout}
                >
                    <Icon name="logout" className="size-4 fill-red-2" />
                    <span>Sign out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default UserProfileDropdown
