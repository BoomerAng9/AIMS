import { useState, useRef, useEffect, useMemo } from 'react'
import {
    EditableHtmlRenderer,
    type EditableHtmlRendererRef
} from './editable-html'

interface Slide {
    slideNumber: number
    content: string
}

interface SlidesViewerProps {
    slides?: Slide[]
    className?: string
    disableEditing?: boolean
    onSlideContentChange?: (
        slideNumber: number,
        content: string,
        title?: string
    ) => void
}

export function SlidesViewer({
    slides = [],
    className,
    disableEditing = false,
    onSlideContentChange
}: SlidesViewerProps) {
    const [scales, setScales] = useState<number[]>(
        new Array(slides.length).fill(1)
    )
    const [slideHeights, setSlideHeights] = useState<number[]>(
        new Array(slides.length).fill(720)
    )
    const containerRefs = useRef<(HTMLDivElement | null)[]>([])
    const slideContentRefs = useRef<(HTMLDivElement | null)[]>([])
    const editableRefs = useRef<(EditableHtmlRendererRef | null)[]>([])

    // Function to scope CSS for each slide
    const scopeSlideStyles = (htmlContent: string, slideId: string): string => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(htmlContent, 'text/html')

        // Find all style tags
        const styleTags = doc.querySelectorAll('style')

        styleTags.forEach((styleTag) => {
            let cssText = styleTag.textContent || ''

            // First, modify body width to 100% if it has a fixed width
            cssText = cssText.replace(/body\s*{([^}]*)}/g, (_match, rules) => {
                // Replace any width declaration with 100%
                const modifiedRules = rules.replace(
                    /width:\s*\d+px;?/gi,
                    'width: 100%;'
                )
                return `body {${modifiedRules}}`
            })

            // Add scope to each CSS rule
            // This regex matches CSS selectors (everything before {)
            cssText = cssText.replace(/([^{}]+){/g, (match, selector) => {
                // Skip keyframes and media queries
                if (
                    selector.includes('@keyframes') ||
                    selector.includes('@media')
                ) {
                    return match
                }

                // Process each selector in a comma-separated list
                const scopedSelectors = selector
                    .split(',')
                    .map((sel: string) => {
                        sel = sel.trim()

                        // Skip html and body selectors, replace with slide container
                        if (sel === 'html' || sel === 'body') {
                            return `[data-slide-id="${slideId}"]`
                        }

                        // Keep :root selector global for CSS custom properties
                        if (sel === ':root') {
                            return ':root'
                        }

                        // Keep @-rules global (like @font-face, @import, @charset)
                        if (sel.startsWith('@') && !sel.includes('{')) {
                            return sel
                        }

                        // Skip * selector - make it scoped
                        if (sel === '*') {
                            return `[data-slide-id="${slideId}"] *`
                        }

                        // Add scope to other selectors
                        const result = `[data-slide-id="${slideId}"] ${sel}`
                        return result
                    })
                    .join(', ')

                return scopedSelectors + ' {'
            })

            styleTag.textContent = cssText
        })

        // Also add to body for fallback
        if (doc.body) {
            doc.body.setAttribute('data-slide-id', slideId)
        }

        return doc.documentElement.outerHTML
    }

    // Process slides with scoped styles
    const processedSlides = useMemo(() => {
        return slides.map((slide) =>
            scopeSlideStyles(slide.content, `${slide.slideNumber}`)
        )
    }, [slides])

    useEffect(() => {
        const calculateScalesAndHeights = () => {
            const newScales: number[] = []
            const newHeights: number[] = []

            containerRefs.current.forEach((container, index) => {
                if (!container) {
                    newScales.push(1)
                    newHeights.push(720)
                    return
                }

                const containerWidth = container.clientWidth
                const slideWidth = 1280
                const scale = containerWidth / slideWidth
                newScales.push(scale)

                // Get the actual height from the EditableHtmlRenderer
                const editableRef = editableRefs.current[index]
                if (editableRef) {
                    const actualHeight = editableRef.getContainerHeight()
                    // Calculate the scaled height
                    newHeights.push(actualHeight * scale)
                } else {
                    newHeights.push(720 * scale)
                }
            })

            setScales(newScales)
            setSlideHeights(newHeights)
        }

        // Initial calculation with a small delay to ensure content is rendered
        setTimeout(calculateScalesAndHeights, 500)

        // Recalculate on resize
        window.addEventListener('resize', calculateScalesAndHeights)

        return () => {
            window.removeEventListener('resize', calculateScalesAndHeights)
        }
    }, [processedSlides])

    const handleSlideContentChange = async (
        slideIndex: number,
        fullHtmlContent: string,
        changes: Record<string, string>
    ) => {
        const slide = slides[slideIndex]
        if (slide && changes && onSlideContentChange) {
            onSlideContentChange(
                slide.slideNumber,
                fullHtmlContent,
                changes.title
            )
        }
    }

    return (
        <div className={`slides-viewer p-5 max-w-[1280px] m-auto ${className}`}>
            <div className="slides-container flex flex-col gap-8 items-center">
                {slides?.map((slide, index) => (
                    <div
                        key={slide.slideNumber}
                        className="w-full max-w-[1080px] rounded-xl bg-white overflow-hidden"
                    >
                        <div
                            ref={(el) => {
                                containerRefs.current[index] = el
                            }}
                            className="w-full overflow-hidden relative"
                            style={{
                                height: `${slideHeights[index] || 720}px`
                            }}
                        >
                            <div
                                ref={(el) => {
                                    slideContentRefs.current[index] = el
                                }}
                                className="w-[1280px] absolute top-0 left-0"
                                style={{
                                    transform: `scale(${scales[index] || 1})`,
                                    transformOrigin: 'top left'
                                }}
                            >
                                <EditableHtmlRenderer
                                    ref={(el) => {
                                        editableRefs.current[index] = el
                                    }}
                                    disableEditing={disableEditing}
                                    htmlContent={processedSlides[index]}
                                    onContentChange={(
                                        fullHtmlContent,
                                        changes
                                    ) =>
                                        handleSlideContentChange(
                                            index,
                                            fullHtmlContent,
                                            changes
                                        )
                                    }
                                />
                            </div>
                            <div className="absolute right-4 bottom-4 text-xs h-7 px-4 flex justify-center items-center bg-black text-white rounded-4xl">
                                <p>{`${index + 1} / ${slides?.length}`}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
