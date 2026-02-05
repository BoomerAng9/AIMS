import { Outlet } from 'react-router'
import { WebSocketProvider } from '@/contexts/websocket-context'
import { useAppEvents } from '@/hooks/use-app-events'
import { useNavigationLeaveSession } from '@/hooks/use-navigation-leave-session'
import { useWebSocketAuthSync } from '@/hooks/use-websocket-auth-sync'
import { ChatProvider } from '@/hooks/use-chat-query'

function RootLayoutContent() {
    useNavigationLeaveSession()
    // Establish WebSocket connection immediately when auth token is available
    useWebSocketAuthSync()

    return <Outlet />
}

export function RootLayout() {
    const { handleEvent } = useAppEvents()

    return (
        <WebSocketProvider handleEvent={handleEvent}>
            <ChatProvider>
                <RootLayoutContent />
            </ChatProvider>
        </WebSocketProvider>
    )
}
