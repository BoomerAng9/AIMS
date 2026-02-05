import { useMemo, useState } from 'react'
import {
    useLocation,
    useNavigate,
    useParams,
    useSearchParams
} from 'react-router'

import ButtonIcon from '@/components/button-icon'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { ENABLE_BETA } from '@/constants/features'
import {
    selectIsFavorite,
    toggleFavoriteAsync,
    useAppDispatch,
    useAppSelector
} from '@/state'
import { deleteSession } from '@/state/slice/sessions'
import { ISession } from '@/typings'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from './ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from './ui/alert-dialog'
import { SidebarTrigger } from './ui/sidebar'
import ShareConversation from './agent/share-conversation'

interface AgentHeaderProps {
    sessionData?: ISession
    isChatPage?: boolean
}

const AgentHeader = ({ sessionData, isChatPage }: AgentHeaderProps) => {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const { sessionId: sessionIdFromParams } = useParams()
    const [searchParams] = useSearchParams()
    const location = useLocation()

    // Get session ID from either URL params or query parameter
    const sessionId = sessionIdFromParams || searchParams.get('id') || ''

    const isFavorite = useAppSelector(selectIsFavorite(sessionId || ''))
    const [isShareOpen, setIsShareOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const isShareMode = useMemo(
        () => location.pathname.includes('/share/'),
        [location.pathname]
    )

    const handleShare = () => {
        if (!sessionId) return
        setIsShareOpen(true)
    }

    const handleBack = () => {
        navigate('/')
    }

    const handleToggleFavorite = () => {
        if (sessionId) {
            dispatch(toggleFavoriteAsync(sessionId))
        }
    }

    const handleDelete = () => {
        setIsDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        try {
            await dispatch(deleteSession(sessionId)).unwrap()
            setIsDeleteDialogOpen(false)
            // Navigate to home page after deletion
            navigate('/')
        } catch (error) {
            console.error('Failed to delete session:', error)
        }
    }

    const cancelDelete = () => {
        setIsDeleteDialogOpen(false)
    }

    return (
        <div className="relative py-3 px-3 md:px-6 flex items-center gap-x-4 md:border-b border-neutral-200 dark:border-white/30">
            {isChatPage ? (
                <SidebarTrigger className="size-6 p-0" />
            ) : (
                <>
                    <SidebarTrigger className="block md:hidden size-6 p-0" />
                    <ButtonIcon
                        name="home"
                        className="bg-black hidden md:flex"
                        iconClassName="fill-sky-blue-2 dark:fill-black"
                        onClick={handleBack}
                    />
                </>
            )}
            {!isChatPage && (
                <div className="relative hidden md:flex items-center gap-x-[6px]">
                    <img
                        src="/images/agent-head.png"
                        className="size-8"
                        alt="ACHEEVY"
                    />
                    <span 
                        className="text-black dark:text-sky-blue text-xl"
                        style={{ fontFamily: "'Permanent Marker', cursive" }}
                    >
                        Chat w/ACHEEVY
                    </span>
                    {ENABLE_BETA && (
                        <span className="text-[10px] absolute -right-8 -top-1">
                            BETA
                        </span>
                    )}
                </div>
            )}
            {sessionData?.name && (
                <div className="flex-1 pr-3 md:pr-0 flex gap-x-4 items-center md:absolute md:left-1/2 md:-translate-x-1/2">
                    <div className="flex-1 flex items-center gap-x-2">
                        <div className="hidden border dark:border-white rounded-full size-6 md:flex items-center justify-center">
                            <Icon
                                name="lock"
                                className="fill-black dark:fill-white"
                            />
                        </div>
                        <span className="dark:text-white font-semibold text-sm flex-1 line-clamp-1 text-center">
                            {sessionData?.name}
                        </span>
                    </div>
                    {!isShareMode && (
                        <>
                            <Button
                                size="icon"
                                className="hidden md:inline w-auto"
                                onClick={handleShare}
                            >
                                <Icon
                                    name="share"
                                    className="stroke-black dark:stroke-white size-[18px]"
                                />
                            </Button>
                            <Button
                                size="icon"
                                className="hidden md:inline w-auto"
                                onClick={handleToggleFavorite}
                            >
                                {isFavorite ? (
                                    <Icon
                                        name="star-fill"
                                        className="fill-black dark:fill-white size-[18px]"
                                    />
                                ) : (
                                    <Icon
                                        name="star"
                                        className="fill-black dark:fill-white size-[18px]"
                                    />
                                )}
                            </Button>
                        </>
                    )}
                </div>
            )}
            {sessionData?.name && (
                <DropdownMenu>
                    <DropdownMenuTrigger className="cursor-pointer flex md:hidden">
                        <Icon
                            name="more"
                            className="size-6 fill-black dark:fill-white"
                        />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-[185px] px-4 py-2"
                    >
                        <DropdownMenuItem
                            className="py-2"
                            onClick={handleShare}
                        >
                            <Icon
                                name="share"
                                className="size-5 stroke-black"
                            />
                            Share
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="py-2"
                            onClick={handleToggleFavorite}
                        >
                            {isFavorite ? (
                                <Icon
                                    name="star-fill"
                                    className="fill-black size-5"
                                />
                            ) : (
                                <Icon
                                    name="star"
                                    className="fill-black size-5"
                                />
                            )}
                            {isFavorite ? 'Unfavorite' : 'Favorite'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1" />
                        <DropdownMenuItem
                            onClick={handleDelete}
                            variant="destructive"
                            className="text-red-2 py-2"
                        >
                            <Icon name="trash" className="size-5" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
            <ShareConversation
                open={isShareOpen}
                onOpenChange={setIsShareOpen}
                sessionId={sessionId}
            />
            <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Session</AlertDialogTitle>
                        <AlertDialogDescription>
                            {`Are you sure you want to delete "${sessionData?.name}"? This action cannot be undone.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={cancelDelete}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-2 hover:bg-red-2 text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export default AgentHeader
