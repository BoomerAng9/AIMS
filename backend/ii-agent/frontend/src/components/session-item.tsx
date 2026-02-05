'use client'

import { useState } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { Icon } from './ui/icon'
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
import ShareConversation from './agent/share-conversation'
import { useAppDispatch } from '@/state'
import { deleteSession } from '@/state/slice/sessions'
import { Tooltip, TooltipContent } from './ui/tooltip'
import { TooltipTrigger } from '@radix-ui/react-tooltip'

interface SessionItemProps {
    session: {
        id: string
        name: string
        agent_type: string
    }
    isActive: boolean
    onClick: () => void
}

const SessionItem = ({ session, isActive, onClick }: SessionItemProps) => {
    const dispatch = useAppDispatch()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const [isShareOpen, setIsShareOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const handlePointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
            setIsHovered(true)
        }
    }

    const handlePointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
            setIsHovered(false)
        }
    }

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsShareOpen(true)
    }

    // const handleRename = (e: React.MouseEvent) => {
    //     e.preventDefault()
    //     e.stopPropagation()
    //     console.log('Rename session:', session.id)
    // }

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        try {
            await dispatch(deleteSession(session.id)).unwrap()
            setIsDeleteDialogOpen(false)
        } catch (error) {
            console.error('Failed to delete session:', error)
            // You might want to show a toast notification here
        }
    }

    const cancelDelete = () => {
        setIsDeleteDialogOpen(false)
    }

    return (
        <div
            className={cn(
                'relative flex items-center gap-x-2 rounded-lg px-2 py-1 before:hidden hover:before:block before:absolute before:-left-10 before:top-0 before:-bottom-0 before:w-200 md:before:w-100 before:bg-firefly/10 dark:before:bg-sky-blue-2/10',
                {
                    'before:block': isActive || isHovered || isDropdownOpen
                }
            )}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
        >
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link
                        to={
                            session.agent_type === 'chat'
                                ? `/chat?id=${session.id}`
                                : `/${session.id}`
                        }
                        onClick={onClick}
                        className={cn('flex-1 line-clamp-1 z-10')}
                    >
                        {session.name}
                    </Link>
                </TooltipTrigger>
                <TooltipContent
                    align="center"
                    side="bottom"
                    className="max-w-[200px]"
                >
                    {session.name}
                </TooltipContent>
            </Tooltip>
            <DropdownMenu
                open={isDropdownOpen}
                onOpenChange={setIsDropdownOpen}
            >
                <DropdownMenuTrigger
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                    className={cn(
                        'transition-opacity z-10 cursor-pointer',
                        isHovered || isDropdownOpen
                            ? 'opacity-100'
                            : 'opacity-0'
                    )}
                >
                    <Icon
                        name="more-2"
                        className="size-4 stroke-black dark:stroke-white"
                    />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="w-[185px] px-4 py-2"
                >
                    <DropdownMenuItem className="py-2" onClick={handleShare}>
                        <Icon name="share" className="size-5 stroke-black" />
                        Share
                    </DropdownMenuItem>
                    {/* <DropdownMenuItem className="py-2" onClick={handleRename}>
                        <Icon name="edit" className="size-5 fill-black" />
                        Rename
                    </DropdownMenuItem> */}
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
            <ShareConversation
                open={isShareOpen}
                onOpenChange={setIsShareOpen}
                sessionId={session.id}
            />
            <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Session</AlertDialogTitle>
                        <AlertDialogDescription>
                            {`Are you sure you want to delete "${session.name}"? This action cannot be undone.`}
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

export default SessionItem
