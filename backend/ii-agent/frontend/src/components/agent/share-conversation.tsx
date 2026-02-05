import { useMemo, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Link, useParams } from 'react-router'

import { Icon } from '../ui/icon'
import { Sheet, SheetClose, SheetContent, SheetHeader } from '../ui/sheet'
import { Button } from '../ui/button'
import { sessionService } from '@/services/session.service'

interface ShareConversationProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sessionId?: string
}

const ShareConversation = ({
    open,
    onOpenChange,
    sessionId: propSessionId
}: ShareConversationProps) => {
    const { sessionId: paramsSessionId } = useParams()
    const sessionId = propSessionId || paramsSessionId
    const [isPublished, setIsPublished] = useState(false)

    useEffect(() => {
        const fetchSessionData = async () => {
            if (!sessionId) return

            try {
                const session = await sessionService.getSession(sessionId)
                setIsPublished(session.is_public || false)
            } catch (error) {
                console.error('Error fetching session data:', error)
            }
        }

        if (open && sessionId) {
            fetchSessionData()
        }
    }, [sessionId, open])

    const shareUrl = useMemo(() => {
        return `${window.location.origin}/share/${sessionId}`
    }, [sessionId])

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl)
        toast.success('Copied to clipboard')
    }

    const handlePublish = async () => {
        if (!sessionId) {
            toast.error('Session ID not found')
            return
        }

        try {
            await sessionService.publishSession(sessionId)
            setIsPublished(true)
            toast.success('Session published successfully')
        } catch (error) {
            toast.error('Failed to publish session')
            console.error('Error publishing session:', error)
        }
    }

    const handleUnpublish = async () => {
        if (!sessionId) {
            toast.error('Session ID not found')
            return
        }

        try {
            await sessionService.unpublishSession(sessionId)
            setIsPublished(false)
            toast.success('Session unpublished successfully')
        } catch (error) {
            toast.error('Failed to unpublish session')
            console.error('Error unpublishing session:', error)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="pt-12 w-full !max-w-[560px]">
                <SheetHeader className="px-3 md:px-6 pt-0 gap-1 pb-4">
                    <div className="flex items-center justify-between">
                        <p className="text-2xl font-semibold">
                            Share conversation
                        </p>
                        <div className="flex items-center gap-x-4">
                            <SheetClose className="cursor-pointer">
                                <Icon
                                    name="close"
                                    className="fill-grey-2 dark:fill-grey"
                                />
                            </SheetClose>
                        </div>
                    </div>
                </SheetHeader>
                <div className="px-3 md:px-6 mt-2">
                    {isPublished ? (
                        <>
                            <p className="text-lg font-semibold">
                                Public link to chat
                            </p>
                            <p className="text-sm mt-1">
                                A public link to your chat has been created.
                                Manage previously shared chats at any time via
                                <Link
                                    to="/settings/data-controls"
                                    className="underline ml-1"
                                >
                                    Settings
                                </Link>
                                .
                            </p>
                            <div className="mt-6 px-4 py-3 flex items-center justify-between gap-x-4 rounded-xl border border-grey bg-grey-3 dark:bg-sky-blue-2/10">
                                <div className="flex items-center gap-x-2 text-sm flex-1">
                                    <Icon
                                        name="link-2"
                                        className="size-4 md:size-6 fill-black dark:fill-white -rotate-45"
                                    />
                                    <span className="line-clamp-1 flex-1">
                                        {shareUrl}
                                    </span>
                                </div>
                                <Button
                                    className="hidden md:flex h-[22px] bg-firefly dark:bg-sky-blue-2 text-sky-blue-2 dark:text-black gap-x-[6px] text-xs rounded-sm !font-normal"
                                    onClick={handleCopy}
                                >
                                    <Icon
                                        name="copy"
                                        className="size-4 fill-sky-blue-2 dark:fill-black"
                                    />
                                    Copy
                                </Button>
                            </div>
                            <Button
                                size="xl"
                                className="flex md:hidden mt-6 w-full bg-firefly dark:bg-sky-blue-2 text-sky-blue-2 dark:text-black font-semibold"
                                onClick={handleCopy}
                            >
                                <Icon
                                    name="copy"
                                    className="size-6 fill-sky-blue-2 dark:fill-black"
                                />
                                Copy
                            </Button>
                            <Button
                                size="xl"
                                className="mt-6 w-full bg-red-2 font-semibold"
                                onClick={handleUnpublish}
                            >
                                <Icon
                                    name="link-2"
                                    className="size-6 fill-white"
                                />
                                Unpublic
                            </Button>
                        </>
                    ) : (
                        <>
                            <p className="text-lg font-semibold">
                                Public link to chat
                            </p>
                            <p className="text-sm mt-1">
                                Your name, upload files, custom instructions,
                                and any messages you add after sharing stay
                                private.
                            </p>
                            <div className="mt-6 px-4 py-3 flex items-center justify-between gap-x-4 rounded-xl border border-grey bg-grey-3 dark:bg-sky-blue-2/10">
                                <div className="flex items-center gap-x-2 text-14 flex-1">
                                    <Icon
                                        name="link-2"
                                        className="size-6 fill-black dark:fill-white -rotate-45"
                                    />
                                    <span className="line-clamp-1 flex-1">
                                        {shareUrl}
                                    </span>
                                </div>
                            </div>
                            <Button
                                size="xl"
                                className="mt-6 w-full bg-firefly dark:bg-sky-blue text-sky-blue-2 dark:text-black font-semibold"
                                onClick={handlePublish}
                            >
                                <Icon
                                    name="link-2"
                                    className="size-6 fill-sky-blue-2 dark:fill-black"
                                />
                                Create Link
                            </Button>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default ShareConversation
