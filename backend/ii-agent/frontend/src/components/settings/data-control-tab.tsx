import { Icon } from '@/components/ui/icon'
import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { sessionService } from '@/services/session.service'
import type { ISession } from '@/typings/agent'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import dayjs from 'dayjs'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog'

type SharedItem = {
    id: string
    title: string
    date: string
}

const DataControlTab = () => {
    const navigate = useNavigate()
    const [items, setItems] = useState<SharedItem[]>([])
    const [isUnpublishDialogOpen, setIsUnpublishDialogOpen] = useState(false)
    const [pendingUnpublishId, setPendingUnpublishId] = useState<string | null>(
        null
    )

    const handleOpenChat = (id: string) => {
        navigate(`/${id}`)
    }

    const handleUnpublishClick = useCallback((id: string) => {
        setPendingUnpublishId(id)
        setIsUnpublishDialogOpen(true)
    }, [])

    const confirmUnpublish = useCallback(async () => {
        if (!pendingUnpublishId) return
        try {
            await sessionService.unpublishSession(pendingUnpublishId)
            setItems((prev) => prev.filter((i) => i.id !== pendingUnpublishId))
        } finally {
            setIsUnpublishDialogOpen(false)
            setPendingUnpublishId(null)
        }
    }, [pendingUnpublishId])

    const cancelUnpublish = useCallback(() => {
        setIsUnpublishDialogOpen(false)
        setPendingUnpublishId(null)
    }, [])

    useEffect(() => {
        const load = async () => {
            try {
                const sessions: ISession[] = await sessionService.getSessions({
                    page: 1,
                    limit: 20,
                    public_only: true
                })
                const publicSessions = (sessions || []).filter(
                    (s) => s.is_public
                )
                const mapped: SharedItem[] = publicSessions.map((s) => ({
                    id: s.id,
                    title: s.name || 'Untitled',
                    date: dayjs(s.created_at).format('D MMM, YYYY')
                }))
                setItems(mapped)
            } catch {
                // Silent fail; keep items as-is
            }
        }
        load()
    }, [])

    return (
        <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{`Shared Chats (${items.length})`}</h2>
            </div>

            <div className="space-y-4">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between gap-x-4"
                    >
                        <div className="truncate text-sm flex-1">
                            {item.title}
                        </div>
                        <div className="flex items-center pl-4">
                            <div className="text-sm">Chat</div>
                            <div className="text-sm ml-8">{item.date}</div>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        className="cursor-pointer flex items-center justify-center ml-8"
                                        onClick={() => handleOpenChat(item.id)}
                                    >
                                        <Icon
                                            name="messages"
                                            className="size-[18px] fill-black dark:fill-white"
                                        />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Open chat</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        className="cursor-pointer flex items-center justify-center ml-4"
                                        onClick={() =>
                                            handleUnpublishClick(item.id)
                                        }
                                    >
                                        <Icon
                                            name="trash-2"
                                            className="size-[18px]"
                                        />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Unpublic</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                ))}
            </div>
            <AlertDialog
                open={isUnpublishDialogOpen}
                onOpenChange={setIsUnpublishDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unpublic Session</AlertDialogTitle>
                        <AlertDialogDescription>
                            {`Are you sure you want to unpublic this session? The public link will stop working.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={cancelUnpublish}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmUnpublish}
                            className="bg-red-2 hover:bg-red-2 text-white"
                        >
                            Unpublic
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export default DataControlTab
