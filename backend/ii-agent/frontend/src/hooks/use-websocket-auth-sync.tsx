import { useEffect } from 'react'
import { ACCESS_TOKEN } from '@/constants/auth'
import { useWebSocketContext } from '@/contexts/websocket-context'

/**
 * Hook that monitors the auth token and establishes WebSocket connection
 * immediately when a token becomes available
 */
export function useWebSocketAuthSync() {
    const { connectSocket, socket } = useWebSocketContext()

    useEffect(() => {
        // Set up a storage event listener to detect token changes from other tabs
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === ACCESS_TOKEN && e.newValue && !socket?.connected) {
                console.log('WebSocket: Token detected via storage event, connecting...')
                connectSocket()
            }
        }

        // Set up a custom event listener for immediate token detection
        const handleAuthTokenSet = () => {
            const token = localStorage.getItem(ACCESS_TOKEN)
            if (token && !socket?.connected) {
                console.log('WebSocket: Token set event detected, connecting immediately...')
                connectSocket()
            }
        }

        // Check if token exists on mount and connect immediately
        const token = localStorage.getItem(ACCESS_TOKEN)
        if (token && !socket?.connected) {
            console.log('WebSocket: Token exists on mount, connecting immediately...')
            connectSocket()
        }

        window.addEventListener('storage', handleStorageChange)
        window.addEventListener('auth-token-set', handleAuthTokenSet)
        return () => {
            window.removeEventListener('storage', handleStorageChange)
            window.removeEventListener('auth-token-set', handleAuthTokenSet)
        }
    }, [connectSocket, socket?.connected])

    // Also monitor for token changes in the same tab
    useEffect(() => {
        // Create a MutationObserver to watch for localStorage changes in the same tab
        let checkInterval: NodeJS.Timeout | null = null
        let lastToken = localStorage.getItem(ACCESS_TOKEN)

        checkInterval = setInterval(() => {
            const currentToken = localStorage.getItem(ACCESS_TOKEN)
            if (currentToken && currentToken !== lastToken && !socket?.connected) {
                console.log('WebSocket: New token detected, connecting...')
                connectSocket()
                lastToken = currentToken
            }
        }, 100) // Check every 100ms for quick response

        return () => {
            if (checkInterval) clearInterval(checkInterval)
        }
    }, [connectSocket, socket?.connected])
}