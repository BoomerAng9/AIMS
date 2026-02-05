'use client'

import { createContext, useContext, useRef, ReactNode, RefObject } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'

interface TerminalContextType {
    xtermRef: RefObject<XTerm | null>
}

const TerminalContext = createContext<TerminalContextType | undefined>(
    undefined
)

export function TerminalProvider({ children }: { children: ReactNode }) {
    const xtermRef = useRef<XTerm | null>(null)

    return (
        <TerminalContext.Provider value={{ xtermRef }}>
            {children}
        </TerminalContext.Provider>
    )
}

export function useTerminal() {
    const context = useContext(TerminalContext)
    if (context === undefined) {
        throw new Error('useTerminal must be used within a TerminalProvider')
    }
    return context
}
