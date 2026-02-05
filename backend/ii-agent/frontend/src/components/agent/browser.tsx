import React, { useMemo } from 'react'

import Markdown from '../markdown'
import { Icon } from '../ui/icon'
import { Button } from '../ui/button'
import { isValidBase64 } from '@/lib/utils'

interface BrowserProps {
    className?: string
    contentClassName?: string
    markdownClassName?: string
    url?: string
    screenshot?: string
    screenshotClassName?: string
    raw?: string
    isHideHeader?: boolean
    isVideoUrl?: boolean
}

const Browser = React.memo(
    ({
        className,
        url,
        screenshot,
        screenshotClassName,
        raw,
        isHideHeader,
        contentClassName,
        markdownClassName,
        isVideoUrl
    }: BrowserProps) => {
        const isVideo = useMemo(
            () =>
                isVideoUrl ||
                (typeof url === 'string' &&
                    (url.endsWith('.mp4') || url.endsWith('.mov'))),
            [url, isVideoUrl]
        )

        return (
            <div
                className={`h-[calc(100vh-178px)] rounded-xl overflow-hidden ${className}`}
            >
                {isHideHeader ? (
                    <Button
                        className={`absolute bottom-4 left-4 shadow-btn bg-white text-black text-xs font-semibold rounded-3xl px-3 py-1 !h-6 ${
                            url ? '' : 'hidden'
                        }`}
                        onClick={() => window.open(url, '_blank')}
                    >
                        <Icon name="export" className="size-4" /> Open in New
                        Tab
                    </Button>
                ) : (
                    <div className="flex items-center gap-3 px-3 py-2.5 bg-grey dark:bg-charcoal border-b border-grey-2/30 dark:border-white/30">
                        <div className="flex-1 flex items-center overflow-hidden">
                            <div className="px-3 py-1.5 rounded-lg w-full flex items-center gap-2 group transition-colors opacity-30">
                                <Icon
                                    name="document-text"
                                    className="size-5 fill-black dark:fill-white"
                                />
                                <span className="text-sm dark:text-white line-clamp-1 flex-1 font-semibold">
                                    {url}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                className="p-1.5 rounded-md cursor-pointer"
                                onClick={() => window.open(url, '_blank')}
                            >
                                <Icon
                                    name="maximize"
                                    className="h-4 w-4 fill-black dark:fill-white"
                                />
                            </button>
                        </div>
                    </div>
                )}
                <div
                    className={`bg-grey dark:bg-black p-3 md:p-6 ${contentClassName}`}
                >
                    {isVideo ? (
                        <video
                            src={url}
                            loop
                            muted
                            controls
                            className={`w-full h-full object-contain object-top rounded-xl overflow-hidden ${screenshotClassName}`}
                        />
                    ) : (
                        screenshot && (
                            <img
                                src={
                                    typeof screenshot === 'string' &&
                                    screenshot.startsWith('http')
                                        ? screenshot
                                        : isValidBase64(screenshot)
                                          ? `data:image/png;base64,${screenshot}`
                                          : undefined
                                }
                                alt="Browser"
                                className={`w-full h-full object-contain object-top rounded-xl overflow-hidden ${screenshotClassName}`}
                            />
                        )
                    )}
                    {raw && (
                        <div
                            className={`p-0 md:p-4 overflow-auto max-w-[calc(100vw-72px)] md:max-w-none h-[calc(100vh-234px)] ${markdownClassName}`}
                        >
                            <Markdown>{raw}</Markdown>
                        </div>
                    )}
                </div>
            </div>
        )
    }
)

Browser.displayName = 'Browser'

export default Browser
