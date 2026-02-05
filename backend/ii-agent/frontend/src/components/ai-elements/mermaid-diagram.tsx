'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    CheckIcon,
    CopyIcon,
    DownloadIcon,
    Maximize2Icon,
    XIcon
} from 'lucide-react'
import mermaid from 'mermaid'

// Track the number of active fullscreen modals to manage body scroll lock correctly
let activeFullscreenCount = 0

const lockBodyScroll = () => {
    activeFullscreenCount += 1
    if (activeFullscreenCount === 1) {
        document.body.style.overflow = 'hidden'
    }
}

const unlockBodyScroll = () => {
    activeFullscreenCount = Math.max(0, activeFullscreenCount - 1)
    if (activeFullscreenCount === 0) {
        document.body.style.overflow = ''
    }
}

// Mermaid diagram component with copy, download, and fullscreen buttons
export const MermaidDiagram = ({ code }: { code: string }) => {
    const [svg, setSvg] = useState<string>('')
    const [lastValidSvg, setLastValidSvg] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const [isCopied, setIsCopied] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)

    useEffect(() => {
        const renderDiagram = async () => {
            try {
                setIsLoading(true)

                // Initialize mermaid
                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'dark',
                    securityLevel: 'loose',
                    fontFamily: 'monospace',
                    suppressErrorRendering: true
                })

                // Generate a unique ID
                const chartHash = code.split('').reduce((acc, char) => {
                    return ((acc << 5) - acc + char.charCodeAt(0)) | 0
                }, 0)
                const uniqueId = `mermaid-${Math.abs(chartHash)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

                const { svg: renderedSvg } = await mermaid.render(
                    uniqueId,
                    code
                )
                // Update both current and last valid SVG
                setSvg(renderedSvg)
                setLastValidSvg(renderedSvg)
            } catch (err) {
                // Silently fail and keep the last valid SVG
                // Don't update svg here - just keep what we have
                console.error('Mermaid render error (keeping previous version):', err)
            } finally {
                setIsLoading(false)
            }
        }

        renderDiagram()
    }, [code])

    // Manage scroll lock and keyboard events for fullscreen
    useEffect(() => {
        if (isFullscreen) {
            lockBodyScroll()

            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    setIsFullscreen(false)
                }
            }

            document.addEventListener('keydown', handleEsc)
            return () => {
                document.removeEventListener('keydown', handleEsc)
                unlockBodyScroll()
            }
        }
    }, [isFullscreen])

    const copyToClipboard = async () => {
        if (typeof window === 'undefined' || !navigator?.clipboard?.writeText) {
            return
        }

        try {
            await navigator.clipboard.writeText(code)
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2000)
        } catch (error) {
            console.error('Failed to copy:', error)
        }
    }

    const downloadSvg = () => {
        const svgToDownload = svg || lastValidSvg
        if (!svgToDownload) return

        const blob = new Blob([svgToDownload], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'mermaid-diagram.svg'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen)
    }

    // Show loading only on initial load when we have no content
    if (isLoading && !svg && !lastValidSvg) {
        return (
            <div className="relative w-full overflow-hidden rounded-lg !bg-firefly/10 dark:!bg-sky-blue/10 !border-none p-3 my-4">
                <div className="flex justify-between mb-4">
                    <span className="text-xs font-medium">Mermaid Diagram</span>
                </div>
                <div className="flex items-center justify-center min-h-[200px]">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <svg
                            className="animate-spin h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        Loading diagram...
                    </div>
                </div>
            </div>
        )
    }

    // Always render the SVG if we have content (either current or last valid)
    const displaySvg = svg || lastValidSvg

    return (
        <>
            <div className="relative w-full overflow-hidden rounded-lg !bg-firefly/10 dark:!bg-sky-blue/10 !border-none p-3 my-4">
                <div className="flex justify-between mb-4">
                    <span className="text-xs font-medium">Mermaid Diagram</span>
                    <div className="flex gap-2">
                        <Button
                            className="shrink-0 !p-0 size-auto"
                            onClick={downloadSvg}
                            size="icon"
                            variant="ghost"
                            title="Download SVG"
                        >
                            <DownloadIcon size={14} />
                        </Button>
                        <Button
                            className="shrink-0 !p-0 size-auto"
                            onClick={copyToClipboard}
                            size="icon"
                            variant="ghost"
                            title="Copy code"
                        >
                            {isCopied ? (
                                <CheckIcon size={14} />
                            ) : (
                                <CopyIcon size={14} />
                            )}
                        </Button>
                        <Button
                            className="shrink-0 !p-0 size-auto"
                            onClick={toggleFullscreen}
                            size="icon"
                            variant="ghost"
                            title="View fullscreen"
                        >
                            <Maximize2Icon size={14} />
                        </Button>
                    </div>
                </div>
                <div className="flex items-center justify-center min-h-[200px]">
                    <div
                        className="w-full flex justify-center"
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: "Mermaid rendering requires HTML parsing"
                        dangerouslySetInnerHTML={{ __html: displaySvg }}
                    />
                </div>
            </div>

            {/* Fullscreen modal */}
            {isFullscreen && (
                // biome-ignore lint/a11y/useSemanticElements: "div is used as a backdrop overlay"
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
                    onClick={toggleFullscreen}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            toggleFullscreen()
                        }
                    }}
                    role="button"
                    tabIndex={0}
                >
                    <button
                        className="absolute top-4 right-4 z-10 rounded-md p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                        onClick={toggleFullscreen}
                        title="Exit fullscreen"
                        type="button"
                    >
                        <XIcon size={20} />
                    </button>
                    {/* biome-ignore lint/a11y/noStaticElementInteractions: "div with role=presentation is used for event propagation control" */}
                    <div
                        className="flex h-full w-full items-center justify-center p-12"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        role="presentation"
                    >
                        <div className="max-h-full max-w-full">
                            <div
                                className="flex justify-center [&_svg]:h-auto [&_svg]:min-h-[60vh] [&_svg]:w-auto [&_svg]:min-w-[60vw]"
                                // biome-ignore lint/security/noDangerouslySetInnerHtml: "Mermaid rendering requires HTML parsing"
                                dangerouslySetInnerHTML={{ __html: displaySvg }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
