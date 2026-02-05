'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import rehypeMathJax from 'rehype-mathjax'
import rehypeKatex from 'rehype-katex'

import 'katex/dist/katex.min.css'

interface MarkdownProps {
    children: string | null | undefined
}

const Markdown = ({ children }: MarkdownProps) => {
    // Quick fix to prevent infinite recursion with long sequences of dashes
    const sanitizedContent = children?.replace(/(-{20,})/g, '---') || ''
    
    return (
        <div className="markdown-body">
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeMathJax, rehypeKatex]}
                components={{
                    a: ({ ...props }) => (
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                        />
                    )
                }}
            >
                {sanitizedContent}
            </ReactMarkdown>
        </div>
    )
}

export default Markdown
