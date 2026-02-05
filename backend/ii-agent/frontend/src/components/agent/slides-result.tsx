import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import cloneDeep from 'lodash/cloneDeep'

import { Icon } from '../ui/icon'
import { selectActiveSessionId, useAppSelector } from '@/state'
import { PresentationListResponse, UpdateSlideRequest } from '@/typings/agent'
import { useSocketIOContext } from '@/contexts/websocket-context'
import { sessionService } from '@/services/session.service'
import { slideService} from '@/services/slide.service'
import { SlidesViewer } from '../slides-viewer'
import { useLocation } from 'react-router'

interface SlidesResultProps {
    className?: string
}

const SlidesResult = ({ className }: SlidesResultProps) => {
    const location = useLocation()

    const fullscreenContainerRef = useRef<HTMLDivElement>(null)
    const fullscreenIframeRef = useRef<HTMLIFrameElement>(null)
    const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [slidesData, setSlidesData] =
        useState<PresentationListResponse | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0, message: '', percent: 0 })
    const { socket } = useSocketIOContext()

    const activeSessionId = useAppSelector(selectActiveSessionId)

    const isShareMode = useMemo(
        () => location.pathname.includes('/share/'),
        [location.pathname]
    )

    // Function to process slide content and change body width to 100%
    const processSlideContent = (htmlContent: string): string => {
        // Replace body width from fixed pixels to 100%
        return htmlContent.replace(/body\s*{([^}]*)}/g, (_match, rules) => {
            const modifiedRules = rules.replace(
                /width:\s*\d+px;?/gi,
                'width: 100%;'
            )
            return `body {${modifiedRules}}`
        })
    }

    // Extract slide content from API response
    const slideContent = useMemo(
        () =>
            slidesData?.presentations?.[0]?.slides?.map((slide) => ({
                slideNumber: slide.slide_number || 1,
                content: processSlideContent(slide.slide_content || '')
            })) || [],
        [slidesData]
    )

    // Get presentation name from API response
    const presentationName = useMemo(
        () => slidesData?.presentations?.[0]?.name || 'Presentation',
        [slidesData]
    )

    // Fetch slides data from API
    const fetchSlides = useCallback(async () => {
        if (!activeSessionId) return

        setIsLoading(true)
        try {
            const data = isShareMode
                ? await sessionService.getPublicSessionSlides(activeSessionId)
                : await sessionService.getSessionSlides(activeSessionId)
            setSlidesData(data)
        } catch (error) {
            console.error('Failed to fetch slides:', error)
            toast.error('Failed to load slides')
        } finally {
            setIsLoading(false)
        }
    }, [activeSessionId, isShareMode])

    // Handle slide update
    const handleUpdateSlide = useCallback(
        async (slideNumber: number, content: string, title?: string) => {
            if (!activeSessionId || !presentationName) return

            try {
                const updateData: UpdateSlideRequest = {
                    session_id: activeSessionId,
                    presentation_name: presentationName,
                    slide_number: slideNumber,
                    content,
                    title: title || `Slide ${slideNumber}`
                }

                const response = await sessionService.updateSlide(
                    activeSessionId,
                    updateData
                )

                if (response.success) {
                    toast.success('Slide updated successfully')
                    setSlidesData((prev) => {
                        if (!prev) return prev
                        const updated = cloneDeep(prev)
                        if (updated.presentations?.[0]?.slides) {
                            const slideIndex =
                                updated.presentations[0].slides?.findIndex(
                                    (slide) =>
                                        slide.slide_number === slideNumber
                                )
                            if (slideIndex === -1) return prev
                            updated.presentations[0].slides[slideIndex] = {
                                ...updated.presentations[0].slides[slideIndex],
                                slide_content: content
                            }
                        }
                        return updated
                    })
                } else {
                    toast.error(response.error || 'Failed to update slide')
                }
            } catch (error) {
                console.error('Failed to update slide:', error)
                toast.error('Failed to update slide')
            }
        },
        [activeSessionId, presentationName, fetchSlides]
    )

    const handleRefresh = () => {
        fetchSlides()
        if (socket?.connected) {
            socket.emit('chat_message', { type: 'sandbox_status', session_uuid: activeSessionId })
        }
    }

    const handlePresent = async () => {
        if (!fullscreenContainerRef.current) return

        try {
            await fullscreenContainerRef.current.requestFullscreen()
            setIsFullscreenOpen(true)
            setCurrentSlideIndex(0)
        } catch (error) {
            console.error('Failed to enter fullscreen:', error)
            toast.error('Failed to enter fullscreen mode')
        }
    }

    const handleDownload = async () => {
        if (!activeSessionId || isDownloading) return

        setIsDownloading(true)
        // Reset progress state
        setDownloadProgress({ current: 0, total: 0, message: '', percent: 0 })

        try {
            const progressGenerator = await slideService.downloadSlidesWithProgress(
                activeSessionId,
                presentationName,
                isShareMode
            )

            for await (const progress of progressGenerator) {
                if (progress.type === 'progress') {
                    setDownloadProgress({
                        current: progress.current || 0,
                        total: progress.total || 0,
                        message: progress.message || '',
                        percent: progress.percent || 0
                    })
                } else if (progress.type === 'complete') {
                    if (progress.pdf_base64 && progress.filename) {
                        slideService.downloadPDFFile(progress.pdf_base64, progress.filename)
                        toast.success('Slides downloaded successfully')
                    }
                    setIsDownloading(false)
                    return
                } else if (progress.type === 'error') {
                    toast.error(progress.message || 'Failed to download slides')
                    setIsDownloading(false)
                    return
                }
            }

        } catch (error) {
            console.error('Failed to download:', error)
            toast.error('Failed to download slides')
            setIsDownloading(false)
        }
    }

    const handleNextSlide = useCallback(() => {
        if (isTransitioning) return
        const nextIndex = Math.min(
            currentSlideIndex + 1,
            slideContent.length - 1
        )
        if (nextIndex === currentSlideIndex) return

        setIsTransitioning(true)
        setCurrentSlideIndex(nextIndex)

        setTimeout(() => {
            setIsTransitioning(false)
        }, 300)
    }, [slideContent.length, currentSlideIndex, isTransitioning])

    const handlePrevSlide = useCallback(() => {
        if (isTransitioning) return
        const prevIndex = Math.max(currentSlideIndex - 1, 0)
        if (prevIndex === currentSlideIndex) return

        setIsTransitioning(true)
        setCurrentSlideIndex(prevIndex)

        setTimeout(() => {
            setIsTransitioning(false)
        }, 300)
    }, [currentSlideIndex, isTransitioning])

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!isFullscreenOpen) return

            switch (event.key) {
                case 'ArrowRight':
                case ' ':
                    event.preventDefault()
                    handleNextSlide()
                    break
                case 'ArrowLeft':
                    event.preventDefault()
                    handlePrevSlide()
                    break
                case 'Escape':
                    event.preventDefault()
                    document.exitFullscreen()
                    break
            }
        },
        [isFullscreenOpen, handleNextSlide, handlePrevSlide]
    )

    const handleFullscreenChange = useCallback(() => {
        if (!document.fullscreenElement) {
            setIsFullscreenOpen(false)
        }
    }, [])

    const scaleIframeToFitHeight = (
        iframe: HTMLIFrameElement | null,
        opts: {
            designWidth?: number
            allowUpscale?: boolean
            padding?: number
        } = {}
    ) => {
        if (!iframe || !iframe.contentDocument) return 1

        const { designWidth = 1280, allowUpscale = true, padding = 0 } = opts

        const doc = iframe.contentDocument

        // Measure iframe content height (natural height)
        const contentHeight = Math.max(
            doc.body.scrollHeight,
            doc.body.offsetHeight,
            doc.documentElement.offsetHeight
        )

        const viewportHeight = Math.max(0, window.innerHeight - padding)

        // Compute scale factor by height
        let scale = viewportHeight / contentHeight
        if (!allowUpscale) scale = Math.min(scale, 1)

        // Apply scaling to the iframe itself
        iframe.style.transformOrigin = 'top center'
        iframe.style.transform = `scale(${scale})`

        // Force iframe base dimensions (before scaling)
        iframe.style.width = `${designWidth}px`
        iframe.style.height = `${contentHeight}px`

        // Center horizontally
        iframe.style.margin = '0 auto'
        iframe.style.display = 'block'

        return scale
    }

    useEffect(() => {
        fetchSlides()
    }, [fetchSlides])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            document.removeEventListener(
                'fullscreenchange',
                handleFullscreenChange
            )
        }
    }, [handleKeyDown, handleFullscreenChange])

    // Calculate scale for fullscreen slides to fit full height
    useEffect(() => {
        const iframe = fullscreenIframeRef.current
        if (!iframe || !isFullscreenOpen) return

        const applyScale = () =>
            setTimeout(
                () => scaleIframeToFitHeight(iframe, { designWidth: 1280 }),
                200
            )

        applyScale()
        window.addEventListener('resize', applyScale)

        return () => {
            iframe.removeEventListener('load', applyScale)
            window.removeEventListener('resize', applyScale)
        }
    }, [isFullscreenOpen, currentSlideIndex])

    if (isLoading) {
        return (
            <div
                className={`flex-1 w-full h-full bg-white dark:bg-charcoal flex items-center justify-center ${className}`}
            >
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                    <p>Loading slides...</p>
                </div>
            </div>
        )
    }

    if (slideContent.length === 0) return null

    return (
        <div
            className={`flex-1 w-full h-full bg-white dark:bg-charcoal ${className}`}
        >
            <div className="w-full flex items-center justify-between pl-6 pr-4 py-2 gap-4 overflow-hidden border-b border-white/30">
                <div className="rounded-lg w-full flex items-center gap-4 group transition-colors">
                    <button className="cursor-pointer" onClick={handleRefresh}>
                        <Icon
                            name="refresh"
                            className="size-5 stroke-black dark:stroke-white"
                        />
                    </button>
                    <span className="text-sm text-black bg-[#f4f4f4] dark:bg-white line-clamp-1 break-all flex-1 font-semibold px-4 py-1 rounded-sm">
                        {presentationName}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        className="cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleDownload}
                        title="Download as PDF"
                        disabled={isDownloading}
                    >
                        {isDownloading ? (
                            <div className="size-5 animate-spin rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white" />
                        ) : (
                            <svg
                                className="size-5 stroke-black dark:stroke-white group-hover:opacity-80 transition-opacity"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                                />
                            </svg>
                        )}
                    </button>
                    <button
                        className="cursor-pointer"
                        onClick={handlePresent}
                        title="Present fullscreen"
                    >
                        <Icon
                            name="fullscreen"
                            className="size-5 fill-black dark:fill-white"
                        />
                    </button>
                </div>
            </div>
            <SlidesViewer
                slides={slideContent}
                className="h-hull max-h-[calc(100vh-159px)] overflow-auto"
                onSlideContentChange={handleUpdateSlide}
            />
            {/* Fullscreen container */}
            <div
                ref={fullscreenContainerRef}
                className={`${
                    isFullscreenOpen
                        ? 'fixed inset-0 z-[9999] bg-black'
                        : 'hidden'
                }`}
            >
                <div className="relative w-full h-full flex items-center justify-center">
                    <div className="absolute top-4 right-4 z-10 bg-black/50 text-white px-3 py-1 rounded text-sm">
                        {currentSlideIndex + 1} / {slideContent.length}
                    </div>

                    <div className="flex items-center gap-4 absolute z-10 bottom-4 right-4">
                        <button
                            onClick={handlePrevSlide}
                            disabled={currentSlideIndex === 0}
                            className="z-10 p-2 text-white bg-black cursor-pointer opacity-30 hover:opacity-100 rounded-full disabled:cursor-not-allowed"
                        >
                            <Icon
                                name="arrow-left-2"
                                className="size-6 fill-white"
                            />
                        </button>

                        <button
                            onClick={handleNextSlide}
                            disabled={
                                currentSlideIndex === slideContent.length - 1
                            }
                            className="z-10 p-2 text-white bg-black cursor-pointer opacity-30 hover:opacity-100 rounded-full disabled:cursor-not-allowed"
                        >
                            <Icon
                                name="arrow-left-2"
                                className="size-6 fill-white rotate-180"
                            />
                        </button>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={() => document.exitFullscreen()}
                        className="absolute top-4 left-4 z-10 p-2 text-white hover:bg-white/20 rounded-full"
                    >
                        <Icon name="x" className="size-6 fill-white" />
                    </button>

                    {/* Slide container with animations */}
                    <div className="w-full h-full relative overflow-hidden">
                        <div
                            className="w-full h-full flex transition-transform duration-300 ease-in-out"
                            style={{
                                transform: `translateX(-${currentSlideIndex * 100}%)`
                            }}
                        >
                            {slideContent.map((slide, index) => (
                                <div
                                    key={`slide-${slide.slideNumber}`}
                                    className="w-full h-full flex-shrink-0 flex items-start justify-center"
                                >
                                    <iframe
                                        ref={
                                            index === currentSlideIndex
                                                ? fullscreenIframeRef
                                                : undefined
                                        }
                                        srcDoc={slide.content}
                                        className="border-0"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading overlay for download */}
            {isDownloading && (
                <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-charcoal border border-sky-blue rounded-xl p-6 flex flex-col items-center gap-4 w-80 max-w-sm shadow-xl">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-blue border-t-black dark:border-t-black" />
                        <p className="text-black dark:text-white font-medium">Generating PDF...</p>

                        <div className="w-full space-y-3">
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                <span>
                                    {downloadProgress.total > 0 && downloadProgress.current > 0
                                        ? `${downloadProgress.current}/${downloadProgress.total} slides`
                                        : 'Starting...'
                                    }
                                </span>
                                <span>{downloadProgress.percent}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-sky-blue h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${downloadProgress.percent}%` }}
                                />
                            </div>
                            {downloadProgress.message && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed break-words">
                                    {downloadProgress.message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SlidesResult
