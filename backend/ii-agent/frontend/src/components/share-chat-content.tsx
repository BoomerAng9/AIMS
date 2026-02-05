import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router'

import AgentHeader from '@/components/header'
import RightSidebar from '@/components/right-sidebar'
import ChatMessageContent from '@/components/chat-message-content'
import Sidebar from '@/components/sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { sessionService } from '@/services/session.service'
import { chatService } from '@/services/chat.service'
import { ISession } from '@/typings/agent'
import { type ChatMessage, groupMessageParts } from '@/utils/chat-events'
import { Loader } from './ai-elements/loader'
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton
} from './ai-elements/conversation'

export function ShareChatContent() {
    const { sessionId } = useParams()
    const messagesEndRef = useRef<HTMLDivElement | null>(null)
    const [sessionData, setSessionData] = useState<ISession | undefined>(
        undefined
    )
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchSessionData = async () => {
            if (!sessionId) {
                setError('No session ID provided')
                setIsLoading(false)
                return
            }

            try {
                setIsLoading(true)
                const session = await sessionService.getPublicSession(sessionId)
                setSessionData(session)

                // Fetch chat history
                const historyResponse =
                    await chatService.getPublicChatHistory(sessionId)

                // Convert ChatHistoryMessage[] to ChatMessage[] directly
                const messages: ChatMessage[] = (
                    historyResponse.messages ?? []
                ).map((historyMsg) => {
                    // Extract text content from parts
                    const textContent = historyMsg.content
                        .filter(
                            (
                                part
                            ): part is Extract<typeof part, { type: 'text' }> =>
                                part.type === 'text'
                        )
                        .map((part) => part.text)
                        .join('')

                    return {
                        id: historyMsg.id,
                        role: historyMsg.role,
                        content: textContent,
                        createdAt: historyMsg.created_at,
                        model: historyMsg.model,
                        parts: historyMsg.content,
                        finish_reason: historyMsg.finish_reason
                    }
                })

                setMessages(messages)
                setError(null)
            } catch (err) {
                console.error('Error fetching session data:', err)
                setError('Failed to load conversation')
            } finally {
                setIsLoading(false)
            }
        }

        fetchSessionData()
    }, [sessionId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Group message parts for rendering
    const groupedMessages = useMemo(() => {
        return groupMessageParts(messages)
    }, [messages])

    return (
        <div className="flex h-screen">
            <SidebarProvider>
                <div className="flex-1">
                    <AgentHeader sessionData={sessionData} />
                    <Sidebar className="block md:hidden" />
                    <div className="flex justify-center h-[calc(100vh-53px)]">
                        <div className="flex-1 flex flex-col max-w-4xl p-3 md:p-4">
                            <Conversation className="flex-1 share-conversation">
                                <ConversationContent className="p-0 md:p-2">
                                    {isLoading && (
                                        <div className="flex items-center justify-center gap-2 py-12">
                                            <Loader size={20} />
                                            <span className="text-sm text-neutral-500">
                                                Loading conversation
                                                history&hellip;
                                            </span>
                                        </div>
                                    )}
                                    {error && (
                                        <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500 dark:text-red-300">
                                            {error}
                                        </div>
                                    )}
                                    {!isLoading &&
                                        !error &&
                                        groupedMessages.length === 0 && (
                                            <div className="text-sm text-neutral-500 text-center py-12">
                                                No messages in this
                                                conversation.
                                            </div>
                                        )}

                                    {groupedMessages.map((group, index) => {
                                        return (
                                            <ChatMessageContent
                                                key={index}
                                                group={group}
                                            />
                                        )
                                    })}
                                </ConversationContent>
                                <ConversationScrollButton />
                            </Conversation>
                        </div>
                    </div>
                </div>
            </SidebarProvider>
            <RightSidebar />
        </div>
    )
}
