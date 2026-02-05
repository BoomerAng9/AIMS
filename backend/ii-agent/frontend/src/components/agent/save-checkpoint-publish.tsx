'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    selectPublished,
    setPublished,
    useAppDispatch,
    useAppSelector
} from '@/state'
import { fullstackService } from '@/services/fullstack.service'
import { useSocketIOContext } from '@/contexts/websocket-context'

interface SaveCheckpointPublishProps {
    result: unknown
    isResult: boolean
}

type SaveCheckpointResult = {
    project_directory?: string
    revision?: string
    [key: string]: unknown
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export const SaveCheckpointPublish = ({
    result,
    isResult
}: SaveCheckpointPublishProps) => {
    const dispatch = useAppDispatch()
    const publishedUrl = useAppSelector(selectPublished)
    const { sendMessage } = useSocketIOContext()

    const [isPublishDialogOpen, setPublishDialogOpen] = useState(false)
    const [vercelApiKey, setVercelApiKey] = useState('')
    const [projectName, setProjectName] = useState('')
    const [isPublishing, setIsPublishing] = useState(false)
    const lastPublishedUrlRef = useRef<string | null>(null)

    const isShareMode = useMemo(
        () => location.pathname.includes('/share/'),
        [location.pathname]
    )

    const checkpointResult: SaveCheckpointResult | null = useMemo(() => {
        if (!isPlainObject(result)) return null
        return result as SaveCheckpointResult
    }, [result])

    const projectDirectory = checkpointResult?.project_directory
    const revision = checkpointResult?.revision

    useEffect(() => {
        if (!publishedUrl || lastPublishedUrlRef.current === publishedUrl) {
            return
        }

        lastPublishedUrlRef.current = publishedUrl
        setIsPublishing(false)
        setPublishDialogOpen(false)
        setVercelApiKey('')
        setProjectName('')
    }, [publishedUrl])

    useEffect(() => {
        if (
            !isPublishDialogOpen ||
            projectName ||
            !projectDirectory ||
            typeof projectDirectory !== 'string'
        ) {
            return
        }

        const fallback = projectDirectory
            .split('/')
            .filter(Boolean)
            .pop()

        if (fallback) {
            setProjectName(fallback)
        }
    }, [isPublishDialogOpen, projectDirectory, projectName])

    const handleOpenDeployment = () => {
        if (!publishedUrl) return
        window.open(publishedUrl, '_blank', 'noopener')
    }

    const handlePublish = async () => {
        if (!projectDirectory || !revision) {
            toast.error('Checkpoint metadata missing project details.')
            return
        }

        const trimmedKey = vercelApiKey.trim()
        if (!trimmedKey) {
            toast.error('Please enter a Vercel API key.')
            return
        }

        try {
            setIsPublishing(true)
            setPublishDialogOpen(false)
            dispatch(setPublished(null))
            await fullstackService.publishProject({
                vercelApiKey: trimmedKey,
                sendMessage,
                projectName: projectName.trim() || undefined,
                projectPath: projectDirectory,
                revision
            })
            toast.success('Publish request sent. Watch the status updates in the activity feed.')
        } catch (error) {
            console.error('Failed to publish project', error)
            const fallbackMessage =
                'Failed to publish project. Please try again.'
            const responseMessage =
                (error as { response?: { data?: { detail?: string; message?: string } } })
                    ?.response?.data?.detail ||
                (error as { response?: { data?: { detail?: string; message?: string } } })
                    ?.response?.data?.message ||
                (error as { message?: string }).message ||
                fallbackMessage

            toast.error(responseMessage)
            setIsPublishing(false)
            setPublishDialogOpen(true)
        }
    }

    if (
        !isResult ||
        isShareMode ||
        !projectDirectory ||
        !revision ||
        typeof projectDirectory !== 'string' ||
        typeof revision !== 'string'
    ) {
        return null
    }

    return (
        <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-black/30 p-4 text-white shadow-inner">
            <div className="text-sm font-medium">Checkpoint ready</div>
            <div className="text-xs text-slate-200">
                <span className="font-semibold">Project:</span>{' '}
                <span className="break-all text-slate-100">{projectDirectory}</span>
            </div>
            <div className="text-xs text-slate-200">
                <span className="font-semibold">Revision:</span>{' '}
                <code className="rounded bg-white/10 px-1 py-0.5 text-xs">
                    {revision}
                </code>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
                {publishedUrl ? (
                    <Button
                        className="text-xs font-semibold"
                        variant="outline"
                        onClick={handleOpenDeployment}
                        title={publishedUrl}
                    >
                        View Deployment
                    </Button>
                ) : isPublishing ? (
                    <Button
                        className="text-xs font-semibold"
                        variant="outline"
                        disabled
                    >
                        <Loader2 className="mr-2 size-3 animate-spin" />
                        Publishing...
                    </Button>
                ) : (
                    <Button
                        className="text-xs font-semibold"
                        variant="outline"
                        onClick={() => setPublishDialogOpen(true)}
                    >
                        Publish
                    </Button>
                )}
            </div>

            <Dialog open={isPublishDialogOpen} onOpenChange={setPublishDialogOpen}>
                <DialogContent
                    className="bg-white/90 dark:bg-sky-blue-2/15 text-firefly dark:text-sky-blue rounded-2xl border border-grey/70 dark:border-sky-blue-2/30 shadow-btn backdrop-blur-xl p-6 md:p-8"
                    showCloseButton={!isPublishing}
                >
                    <DialogHeader className="gap-1">
                        <DialogTitle className="text-2xl font-semibold text-firefly dark:text-sky-blue">
                            Publish to Vercel
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate dark:text-sky-blue">
                            Provide a Vercel API key to publish the checkpointed project.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label
                                htmlFor="vercel-api-key"
                                className="text-sm font-medium text-firefly dark:text-sky-blue"
                            >
                                Vercel API Key
                            </Label>
                            <Input
                                id="vercel-api-key"
                                type="password"
                                value={vercelApiKey}
                                onChange={(event) => setVercelApiKey(event.target.value)}
                                placeholder="Enter your Vercel API key"
                                className="text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/60"
                            />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setPublishDialogOpen(false)}
                            disabled={isPublishing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePublish}
                            disabled={isPublishing || !vercelApiKey.trim()}
                        >
                            {isPublishing ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="size-4 animate-spin" />
                                    Publishing...
                                </span>
                            ) : (
                                'Publish'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
