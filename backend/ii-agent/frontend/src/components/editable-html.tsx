import {
    useState,
    useEffect,
    useRef,
    forwardRef,
    useImperativeHandle,
    useCallback
} from 'react'
import { ImageEditDialog } from './image-edit-dialog'

interface EditableHtmlRendererProps {
    htmlContent: string
    disableEditing?: boolean
    onContentChange?: (
        fullHtmlContent: string,
        changes: Record<string, string>
    ) => void
}

export interface EditableHtmlRendererRef {
    getContainerHeight: () => number
}

export const EditableHtmlRenderer = forwardRef<
    EditableHtmlRendererRef,
    EditableHtmlRendererProps
>(({ htmlContent, onContentChange, disableEditing = false }, ref) => {
    const [contentState, setContentState] = useState<Record<string, string>>({})
    const [imageState, setImageState] = useState<Record<string, string>>({})
    const [editingImage, setEditingImage] = useState<HTMLImageElement | null>(
        null
    )
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
    const [currentImageSrc, setCurrentImageSrc] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)

    useImperativeHandle(
        ref,
        () => ({
            getContainerHeight: () => {
                return containerRef.current?.scrollHeight || 720
            }
        }),
        []
    )

    // Function to make HTML elements editable
    const makeElementsEditable = (htmlString: string): string => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(htmlString, 'text/html')

        // Add CSS for editable elements
        const style = doc.createElement('style')
        style.textContent = `
            .editable {
                cursor: pointer;
                border: 2px solid transparent;
                transition: border-color 0.2s ease;
                display: inline-block;
                min-width: 20px;
                min-height: 1em;
            }
            .editable:hover {
                border-color: #FF6B75;
                border-style: solid;
            }
            .editing {
                border-color: #FF6B75 !important;
                border-style: #FF6B75 !important;
                outline: none;
                padding: 2px 4px;
                margin: -2px -4px;
            }
            .editable-img {
                cursor: pointer;
                border: 2px solid transparent;
                transition: all 0.2s ease;
                display: inline-block;
                position: relative;
            }
            .editable-img:hover {
                outline: 2px solid #4a90e2;
                outline-offset: 2px;
            }
            .image-preview {
                width: 100%;
                max-height: 200px;
                object-fit: contain;
                border: 2px dashed #e5e7eb;
                border-radius: 8px;
                background: #f9fafb;
            }
            .drop-zone {
                border: 2px dashed #d1d5db;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                color: #6b7280;
                transition: all 0.2s ease;
                cursor: pointer;
            }
            .drop-zone.dragover {
                border-color: #4a90e2;
                background-color: #eff6ff;
                color: #4a90e2;
            }
        `
        if (!disableEditing) {
            doc.head.appendChild(style)
        }

        let editId = 1
        let imgId = 1

        // Function to process images and make them editable
        const processImages = (element: Element) => {
            const images = element.querySelectorAll('img')
            images.forEach((img) => {
                const imgIdStr = `img-${imgId++}`
                img.classList.add('editable-img')
                img.setAttribute('data-img-id', imgIdStr)

                // Apply saved image src if it exists
                const savedSrc = imageState[imgIdStr]
                if (savedSrc) {
                    img.setAttribute('src', savedSrc)
                }
            })
        }

        // Function to process text nodes and wrap them in editable spans
        const processTextNodes = (element: Element) => {
            const walker = doc.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
                acceptNode: (node) => {
                    // Skip if parent is already editable or is a script/style tag
                    const parent = node.parentElement
                    if (
                        !parent ||
                        parent.classList.contains('editable') ||
                        ['SCRIPT', 'STYLE', 'META', 'LINK', 'TITLE'].includes(
                            parent.tagName
                        )
                    ) {
                        return NodeFilter.FILTER_REJECT
                    }

                    // Only process text nodes with meaningful content
                    const text = node.textContent?.trim()
                    return text && text.length > 0
                        ? NodeFilter.FILTER_ACCEPT
                        : NodeFilter.FILTER_REJECT
                }
            })

            const textNodes: Text[] = []
            let node
            while ((node = walker.nextNode())) {
                textNodes.push(node as Text)
            }

            // Wrap each text node in an editable span
            textNodes.forEach((textNode) => {
                const text = textNode.textContent?.trim()
                if (text && text.length > 0) {
                    const span = doc.createElement('span')
                    span.className = 'editable'
                    const editIdStr = `edit-${editId++}`
                    span.setAttribute('data-edit-id', editIdStr)

                    // Apply saved content if it exists, otherwise use original text
                    const savedContent = contentState[editIdStr]
                    span.textContent =
                        savedContent || textNode.textContent || ''

                    textNode.parentNode?.replaceChild(span, textNode)
                }
            })
        }

        // Process the body content
        if (doc.body) {
            processTextNodes(doc.body)
            processImages(doc.body)

            // Create a wrapper div that will contain everything
            const wrapper = doc.createElement('div')

            // Convert body to div with all its attributes
            const bodyDiv = doc.createElement('div')

            // Copy all attributes from body to div (including data-slide-id)
            Array.from(doc.body.attributes).forEach((attr) => {
                bodyDiv.setAttribute(attr.name, attr.value)
            })

            // Copy all children from body to bodyDiv
            while (doc.body.firstChild) {
                bodyDiv.appendChild(doc.body.firstChild)
            }

            // Don't include external CSS link tags - they cause global pollution
            // Only include inline styles and meta tags
            const headElements = doc.head.querySelectorAll('style, link, meta')

            headElements.forEach((element) => {
                if (
                    element.tagName === 'LINK' &&
                    element.getAttribute('rel') === 'stylesheet'
                ) {
                    const href = element.getAttribute('href') || ''
                    const allowExternal =
                        element.getAttribute('data-allow-external') === 'true'
                    const allowList = [
                        'fonts.googleapis.com',
                        'fonts.gstatic.com'
                    ]
                    const isAllowListed = allowList.some((domain) =>
                        href.includes(domain)
                    )

                    if (!allowExternal && !isAllowListed) {
                        // Skip external stylesheet links to prevent CSS pollution
                        // Allow only data-allow-external or explicitly allowlisted domains
                        return
                    }
                }

                wrapper.appendChild(element.cloneNode(true))
            })

            // Add the body content div
            wrapper.appendChild(bodyDiv)

            // Return the wrapper containing styles and body content
            return wrapper.innerHTML
        }

        return doc.documentElement.outerHTML
    }

    // Function to reconstruct the full HTML with all changes applied
    const reconstructFullHtml = useCallback(
        (
            changes: Record<string, string>,
            imageChanges: Record<string, string> = {}
        ): string => {
            if (!containerRef.current) return htmlContent

            // Clone the current container DOM to avoid modifying the live DOM
            const containerClone = containerRef.current.cloneNode(
                true
            ) as HTMLElement

            // Remove editing styles and classes from all editable elements
            const editableElements =
                containerClone.querySelectorAll('.editable')
            editableElements.forEach((element) => {
                element.classList.remove('editing')
                element.removeAttribute('contenteditable')
                element.removeAttribute('style')
            })

            // Apply all text changes to the cloned DOM
            Object.entries(changes).forEach(([editId, newContent]) => {
                const element = containerClone.querySelector(
                    `[data-edit-id="${editId}"]`
                )
                if (element) {
                    element.textContent = newContent
                }
            })

            // Apply all image changes to the cloned DOM
            Object.entries(imageChanges).forEach(([imgId, newSrc]) => {
                const img = containerClone.querySelector(
                    `[data-img-id="${imgId}"]`
                ) as HTMLImageElement
                if (img) {
                    img.src = newSrc
                }
            })

            // Get the innerHTML of the cloned container
            const updatedInnerHTML = containerClone.innerHTML

            // Now we need to reconstruct a full HTML document
            // Parse the original HTML to get the structure
            const parser = new DOMParser()
            const originalDoc = parser.parseFromString(htmlContent, 'text/html')

            // Replace the body content with our updated content
            if (originalDoc.body) {
                originalDoc.body.innerHTML = updatedInnerHTML
            }

            return originalDoc.documentElement.outerHTML
        },
        [htmlContent]
    )

    // Image dialog handlers
    const handleImageUpdate = useCallback(
        (newSrc: string) => {
            if (editingImage) {
                const imgId = editingImage.getAttribute('data-img-id')
                if (imgId) {
                    // Update the image src immediately for visual feedback
                    editingImage.src = newSrc

                    // Update the image state and trigger content change (similar to saveContent)
                    setImageState((prev) => {
                        const updated = {
                            ...prev,
                            [imgId]: newSrc
                        }

                        // Reconstruct and provide the full HTML content
                        const fullHtmlContent = reconstructFullHtml(
                            contentState,
                            updated
                        )
                        onContentChange?.(fullHtmlContent, contentState)

                        return updated
                    })
                }
            }
        },
        [editingImage, contentState, onContentChange]
    )

    const handleDialogClose = useCallback(() => {
        setIsImageDialogOpen(false)
        setEditingImage(null)
        setCurrentImageSrc('')
    }, [])

    useEffect(() => {
        let editingElement: HTMLElement | null = null
        let originalContent = ''

        const saveContent = (
            element: HTMLElement,
            newContent: string,
            originalContent: string
        ) => {
            const elementId = element.getAttribute('data-edit-id')
            if (elementId && newContent !== originalContent) {
                setContentState((prev) => {
                    const updated = {
                        ...prev,
                        [elementId]: newContent
                    }

                    // Reconstruct and provide the full HTML content
                    const fullHtmlContent = reconstructFullHtml(
                        updated,
                        imageState
                    )
                    onContentChange?.(fullHtmlContent, updated)

                    return updated
                })
            }
        }

        const handleClick = (event: MouseEvent) => {
            if (disableEditing) return

            const target = event.target as HTMLElement

            if (target.classList && target.classList.contains('editable')) {
                event.preventDefault()
                event.stopPropagation()

                // If we're switching from one element to another, save the previous one
                if (editingElement && editingElement !== target) {
                    const currentContent = editingElement.innerText || ''
                    saveContent(editingElement, currentContent, originalContent)
                    editingElement.contentEditable = 'false'
                    editingElement.classList.remove('editing')
                }

                // Start editing the new element
                editingElement = target
                originalContent = target.innerText || ''
                target.contentEditable = 'true'
                target.classList.add('editing')
                target.focus()

                // Place cursor at the end without selecting text
                const range = document.createRange()
                const sel = window.getSelection()
                range.selectNodeContents(target)
                range.collapse(false) // Collapse to end
                sel?.removeAllRanges()
                sel?.addRange(range)
            } else if (editingElement && !editingElement.contains(target)) {
                // Clicking outside - save if content changed
                const currentContent = editingElement.innerText || ''
                saveContent(editingElement, currentContent, originalContent)
                editingElement.contentEditable = 'false'
                editingElement.classList.remove('editing')
                editingElement = null
            }
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (!editingElement || disableEditing) return

            if (event.key === 'Enter') {
                event.preventDefault()
                const currentContent = editingElement.innerText || ''
                saveContent(editingElement, currentContent, originalContent)
                editingElement.contentEditable = 'false'
                editingElement.classList.remove('editing')
                editingElement = null
            } else if (event.key === 'Escape') {
                event.preventDefault()
                editingElement.innerText = originalContent
                editingElement.contentEditable = 'false'
                editingElement.classList.remove('editing')
                editingElement = null
            }
        }

        // Handle image editing with React Dialog
        const handleImageClick = (event: MouseEvent) => {
            if (disableEditing) return

            const target = event.target as HTMLElement

            if (
                target.tagName === 'IMG' &&
                target.classList.contains('editable-img')
            ) {
                event.preventDefault()
                event.stopPropagation()

                const img = target as HTMLImageElement
                setEditingImage(img)
                setCurrentImageSrc(img.src)
                setIsImageDialogOpen(true)
            }
        }

        const container = containerRef.current
        if (container && !disableEditing) {
            container.addEventListener('click', handleClick)
            container.addEventListener('keydown', handleKeyDown)
            container.addEventListener('click', handleImageClick)

            return () => {
                container.removeEventListener('click', handleClick)
                container.removeEventListener('keydown', handleKeyDown)
                container.removeEventListener('click', handleImageClick)
            }
        }
    }, [contentState, imageState, onContentChange, disableEditing])

    return (
        <>
            <div
                ref={containerRef}
                dangerouslySetInnerHTML={{
                    __html: makeElementsEditable(htmlContent)
                }}
            />

            {/* Image Edit Dialog */}
            <ImageEditDialog
                open={isImageDialogOpen}
                onOpenChange={handleDialogClose}
                currentImageSrc={currentImageSrc}
                onImageUpdate={handleImageUpdate}
            />
        </>
    )
})

EditableHtmlRenderer.displayName = 'EditableHtmlRenderer'
