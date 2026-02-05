'use client'

import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
// import { WebLinksAddon } from "@xterm/addon-web-links";
// import { SearchAddon } from "@xterm/addon-search";
import { useEffect, useMemo, useRef, useState } from 'react'
import '@xterm/xterm/css/xterm.css'
import clsx from 'clsx'
import { useTheme } from 'next-themes'
import { ActionStep, TOOL } from '@/typings/agent'

interface TerminalProps {
    className?: string
    currentActionData?: ActionStep
}

const Terminal = ({ className, currentActionData }: TerminalProps) => {
    const { theme } = useTheme()
    const xtermRef = useRef<XTerm | null>(null)
    const terminalRef = useRef<HTMLDivElement>(null)
    const [isTerminalReady, setIsTerminalReady] = useState(false)

    useEffect(() => {
        const interval = setInterval(() => {
            const container = terminalRef.current
            if (
                container &&
                container.clientWidth > 0 &&
                container.clientHeight > 0 &&
                !xtermRef.current
            ) {
                clearInterval(interval)

                const term = new XTerm({
                    cursorBlink: true,
                    fontSize: 14,
                    fontFamily: 'monospace',
                    theme: {
                        background:
                            theme === 'dark'
                                ? 'rgba(33, 33, 33, 1)'
                                : 'rgba(229, 231, 235, 1)',
                        foreground: theme === 'dark' ? '#ffffff' : '#212121',
                        cursor: '#ffffff',
                        cursorAccent: '#1a1b26',
                        selectionBackground: 'rgba(255, 255, 255, 0.3)',
                        selectionForeground: undefined
                    },
                    allowTransparency: true
                })

                const fitAddon = new FitAddon()
                term.loadAddon(fitAddon)
                // term.loadAddon(new WebLinksAddon());
                // term.loadAddon(new SearchAddon());

                term.open(container)
                fitAddon.fit()
                prompt(term)

                const handleResize = () => {
                    fitAddon.fit()
                }
                window.addEventListener('resize', handleResize)

                xtermRef.current = term
                setIsTerminalReady(true)

                return () => {
                    window.removeEventListener('resize', handleResize)
                    term.dispose()
                }
            }
        }, 100)

        return () => clearInterval(interval)
    }, [theme, xtermRef])

    // Handle theme changes for existing terminal
    useEffect(() => {
        if (xtermRef.current) {
            xtermRef.current.options.theme = {
                background:
                    theme === 'dark'
                        ? 'rgba(0,0,0,0.8)'
                        : 'rgba(229, 231, 235, 1)',
                foreground: theme === 'dark' ? '#ffffff' : '#212121',
                cursor: '#ffffff',
                cursorAccent: '#1a1b26',
                selectionBackground: 'rgba(255, 255, 255, 0.3)',
                selectionForeground: undefined
            }
        }
    }, [theme, xtermRef])

    const isBashTool = useMemo(() => {
        return (
            currentActionData?.type === TOOL.BASH ||
            currentActionData?.type === TOOL.BASH_INIT ||
            currentActionData?.type === TOOL.BASH_VIEW ||
            currentActionData?.type === TOOL.BASH_STOP ||
            currentActionData?.type === TOOL.BASH_KILL ||
            currentActionData?.type === TOOL.BASH_WRITE_TO_PROCESS ||
            currentActionData?.type === TOOL.LS ||
            currentActionData?.type === TOOL.GLOB ||
            currentActionData?.type === TOOL.GREP
        )
    }, [currentActionData])

    // Handle bash output from currentActionData
    useEffect(() => {
        if (
            !xtermRef.current ||
            !isBashTool ||
            !currentActionData?.data?.result
        )
            return

        // Handle bash tool outputs
        const result = currentActionData.data?.result
        if (result) {
            // Clear terminal for new bash command
            xtermRef.current.reset()

            // Write the output
            const lines = `${result}`.split('\n')
            const term = xtermRef.current
            lines.forEach((line, index) => {
                if (index === lines.length - 1 && line.trim()) {
                    // Last line without newline
                    term.write(line.trim())
                } else {
                    // Regular lines with newline
                    term.writeln(line.trim())
                }
            })

            // Scroll to bottom
            xtermRef.current.scrollToBottom()
        }
    }, [currentActionData?.data?.result, isBashTool, isTerminalReady])

    const prompt = (term: XTerm) => {
        scrollToBottom(term)
    }

    const scrollToBottom = (term: XTerm) => {
        term.scrollToBottom()
    }

    return (
        <div className={clsx('p-4 h-full overflow-auto', className)}>
            <div ref={terminalRef} className="h-full w-full" />
        </div>
    )
}

export default Terminal
