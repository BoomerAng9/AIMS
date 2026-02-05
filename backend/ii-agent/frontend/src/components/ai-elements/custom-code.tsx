'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckIcon, CopyIcon } from 'lucide-react'
import { CodeBlock, CodeBlockCopyButton } from './code-block'
import { type BundledLanguage } from 'shiki'
import { MermaidDiagram } from './mermaid-diagram'

// Custom code component that handles SVG, HTML, and Mermaid rendering
export const CustomCode = ({
    children,
    className,
    ...props
}: React.HTMLAttributes<HTMLElement>) => {
    const [isCopied, setIsCopied] = useState(false)

    // Extract language from className (e.g., "language-svg" -> "svg")
    const match = /language-(\w+)/.exec(className || '')
    const language = match?.[1]
    const code = String(children || '').trim()

    // Use our Mermaid component for mermaid blocks
    if (language === 'mermaid') {
        return <MermaidDiagram code={code} />
    }

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

    // Check if it's an SVG code block
    // More strict validation: must be explicitly marked as SVG language OR have actual SVG attributes
    const svgPattern = /^\s*(<\?xml[\s\S]*?\?>\s*)?<svg[\s>]/i
    const hasActualSvgAttributes =
        code.includes('xmlns') ||
        code.includes('viewBox') ||
        (code.includes('width') && code.includes('<svg')) ||
        (code.includes('height') && code.includes('<svg'))

    const isActualSvg =
        language === 'svg' || (svgPattern.test(code) && hasActualSvgAttributes)

    if (isActualSvg) {
        // Check if SVG has children elements (not just opening tag)
        const hasContent = /<svg[^>]*>[\s\S]*?</.test(code)

        return (
            <div className="relative w-full overflow-hidden rounded-lg !bg-firefly/10 dark:!bg-sky-blue/10 !border-none p-3 my-4">
                <div className="flex justify-between mb-4">
                    <span className="text-xs font-medium">SVG</span>
                    <Button
                        className="shrink-0 !p-0 size-auto"
                        onClick={copyToClipboard}
                        size="icon"
                        variant="ghost"
                    >
                        {isCopied ? (
                            <CheckIcon size={14} />
                        ) : (
                            <CopyIcon size={14} />
                        )}
                    </Button>
                </div>
                <div className="flex items-center justify-center min-h-[100px]">
                    {hasContent ? (
                        <div
                            className="w-full flex justify-center"
                            // biome-ignore lint/security/noDangerouslySetInnerHtml: "SVG rendering requires HTML parsing"
                            dangerouslySetInnerHTML={{ __html: code }}
                        />
                    ) : (
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
                            Loading SVG...
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // Check if it's an HTML code block
    const htmlPattern =
        /^\s*(<\?xml[\s\S]*?\?>\s*)?<!DOCTYPE html>|<html[\s>]|<artifact[\s>]/i
    const hasHtmlTags =
        code.includes('<head>') ||
        code.includes('<body>') ||
        code.includes('<!DOCTYPE') ||
        code.includes('<artifact')

    const isActualHtml =
        language === 'html' || (htmlPattern.test(code) && hasHtmlTags)
    const isComplete = /<\/html>/i.test(code)

    if (isActualHtml && isComplete) {
        return (
            <div className="relative w-full overflow-hidden rounded-lg !bg-firefly/10 dark:!bg-sky-blue/10 !border-none p-3 my-4">
                <div className="flex justify-between mb-4">
                    <span className="text-xs font-medium">HTML</span>
                    <Button
                        className="shrink-0 !p-0 size-auto"
                        onClick={copyToClipboard}
                        size="icon"
                        variant="ghost"
                    >
                        {isCopied ? (
                            <CheckIcon size={14} />
                        ) : (
                            <CopyIcon size={14} />
                        )}
                    </Button>
                </div>
                <div className="flex items-center justify-center min-h-[400px]">
                    <iframe
                        className="w-full h-[400px] border-0 rounded"
                        srcDoc={code}
                        sandbox="allow-scripts allow-same-origin"
                        title="HTML Preview"
                    />
                </div>
            </div>
        )
    }

    // For inline code (no language specified)
    if (!language) {
        return (
            <code className={className} {...props}>
                {children}
            </code>
        )
    }

    // For regular code blocks, use the CodeBlock component
    return (
        <CodeBlock code={code} language={language as BundledLanguage}>
            <CodeBlockCopyButton />
        </CodeBlock>
    )
}
