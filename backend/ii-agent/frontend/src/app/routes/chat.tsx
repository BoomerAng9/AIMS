import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'

import AgentSetting from '@/components/agent-setting'
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton
} from '@/components/ai-elements/conversation'
import { Loader } from '@/components/ai-elements/loader'
import ChatMessageContent from '@/components/chat-message-content'
import AgentHeader from '@/components/header'
import QuestionInput from '@/components/question-input'
import RightSidebar from '@/components/right-sidebar'
import Sidebar from '@/components/sidebar'
import ThinkingMessage from '@/components/thinking-message'
import { SidebarProvider } from '@/components/ui/sidebar'
import { useChat } from '@/hooks/use-chat-query'
import {
    selectIsLoading,
    setQuestionMode,
    useAppDispatch,
    useAppSelector
} from '@/state'
import { QUESTION_MODE } from '@/typings/agent'
import { FinishReason } from '@/typings/chat'
import { groupMessageParts } from '@/utils/chat-events'
import { useGoogleDrive } from '@/hooks/use-google-drive'

const getFinishReasonMessage = (finishReason: FinishReason): string | null => {
    switch (finishReason) {
        case FinishReason.MAX_TOKENS:
            return 'The response was stopped because it reached the maximum token limit.'
        case FinishReason.CANCELED:
            return 'The response was canceled.'
        case FinishReason.ERROR:
            return 'The response was stopped due to an error.'
        case FinishReason.PERMISSION_DENIED:
            return 'The response was stopped due to permission denial.'
        case FinishReason.PAUSE_TURN:
            return 'The conversation was paused. You can continue by sending another message.'
        case FinishReason.END_TURN:
        case FinishReason.TOOL_USE:
        case FinishReason.UNKNOWN:
        default:
            return null
    }
}

export function ChatPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const initialSessionId = searchParams.get('id')

    const location = useLocation()
    const navigateTo = useNavigate()
    const [isOpenSetting, setIsOpenSetting] = useState(false)
    const [filesCount, setFilesCount] = useState(0)
    const dispatch = useAppDispatch()

    const {
        sessionId,
        setSessionId,
        sessionData,
        sessionError,
        messages,
        chatStatus,
        isHistoryLoading,
        isWaitingForNextEvent,
        showThinking,
        hydrateSessionHistory,
        resetConversationState,
        sendMessage,
        isSubmitting,
        stopActiveStream
    } = useChat()

    const {
        isConnected: isGoogleDriveConnected,
        isAuthLoading: isGoogleDriveAuthLoading,
        handleGoogleDriveClick,
        downloadedFiles: downloadedGoogleDriveFiles,
        clearDownloadedFiles
    } = useGoogleDrive()

    const isLoading = useAppSelector(selectIsLoading)

    // Group message parts for rendering
    const groupedMessages = useMemo(() => {
        return groupMessageParts(messages)
    }, [messages])

    // Get finish reason from the last message part
    const lastMessageFinishReason = useMemo(() => {
        if (groupedMessages.length === 0) return null
        const lastGroup = groupedMessages[groupedMessages.length - 1]
        if (!lastGroup.parts || lastGroup.parts.length === 0) return null
        const lastPart = lastGroup.parts[lastGroup.parts.length - 1]
        return lastPart.finish_reason || null
    }, [groupedMessages])

    // Set question mode to CHAT when the chat page loads
    useEffect(() => {
        dispatch(setQuestionMode(QUESTION_MODE.CHAT))
    }, [dispatch])

    useEffect(() => {
        setSessionId(initialSessionId)
    }, [initialSessionId, setSessionId])

    useEffect(() => {
        if (!sessionId) {
            resetConversationState()
            return
        }

        // Skip hydration if agent is already running (e.g., navigated from home page with active query)
        if (chatStatus === 'running') {
            return
        }

        hydrateSessionHistory(sessionId).catch((error) => {
            console.error('Failed to hydrate history', error)
        })
    }, [chatStatus, hydrateSessionHistory, resetConversationState, sessionId])

    const handleSend = useCallback(
        async (overrideQuestion?: string) => {
            await sendMessage(overrideQuestion)
        },
        [sendMessage]
    )

    useEffect(() => {
        const rawState =
            (location.state as Record<string, unknown> | null) ?? null
        const pendingQuestion =
            typeof rawState?.pendingQuestion === 'string'
                ? (rawState.pendingQuestion as string)
                : undefined

        if (pendingQuestion) {
            handleSend(pendingQuestion)
            if (rawState) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { pendingQuestion: _ignored, ...rest } = rawState
                const nextState = Object.keys(rest).length > 0 ? rest : null
                navigateTo('.', { replace: true, state: nextState })
            } else {
                navigateTo('.', { replace: true, state: null })
            }
        }
    }, [handleSend, location.state, navigateTo])

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                if (!isSubmitting && chatStatus !== 'running') {
                    handleSend()
                }
            }
        },
        [chatStatus, handleSend, isSubmitting]
    )

    // Only update URL when a new session is created (not when loading existing session)
    // This prevents circular updates while allowing new session navigation
    useEffect(() => {
        // If we have a sessionId in state but no ID in URL, it means a new session was created
        if (sessionId && !initialSessionId) {
            setSearchParams({ id: sessionId })
        }
    }, [sessionId, initialSessionId, setSearchParams])

    return (
        <div className="flex h-screen">
            <SidebarProvider>
                <Sidebar />
                <div className="flex-1">
                    <AgentHeader sessionData={sessionData} isChatPage />
                    <div className="flex justify-center">
                        <div className="flex-1 flex flex-col max-w-4xl py-3 md:py-4">
                            <Conversation
                                className={`flex-1${filesCount > 0 ? ' with-files' : ''}`}
                            >
                                <ConversationContent className="p-0 md:p-2">
                                    {isHistoryLoading && (
                                        <div className="flex items-center justify-center gap-2 py-12">
                                            <Loader size={20} />
                                            <span className="text-sm text-neutral-500">
                                                Loading conversation
                                                history&hellip;
                                            </span>
                                        </div>
                                    )}
                                    {sessionError && (
                                        <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500 dark:text-red-300">
                                            {sessionError}
                                        </div>
                                    )}
                                    {!isHistoryLoading &&
                                        !sessionError &&
                                        messages.length === 0 && (
                                            <div className="text-sm text-neutral-500 text-center py-12">
                                                Ask anything&mdash;your
                                                assistant is ready to help.
                                            </div>
                                        )}

                                    {groupedMessages.map((group, index) => {
                                        // Check if this is the last group and agent is running
                                        const isLastGroup =
                                            index === groupedMessages.length - 1
                                        const isStreaming =
                                            isLastGroup &&
                                            chatStatus === 'running'

                                        return (
                                            <ChatMessageContent
                                                key={index}
                                                group={group}
                                                isStreaming={isStreaming}
                                                isWaitingForNextEvent={
                                                    isLastGroup &&
                                                    isWaitingForNextEvent
                                                }
                                            />
                                        )
                                    })}

                                    {showThinking && <ThinkingMessage />}

                                    {lastMessageFinishReason &&
                                        getFinishReasonMessage(
                                            lastMessageFinishReason
                                        ) && (
                                            <div className="rounded-lg border border-yellow dark:border-yellow/40 bg-yellow dark:bg-yellow/10 p-3 text-sm text-black dark:text-yellow">
                                                {getFinishReasonMessage(
                                                    lastMessageFinishReason
                                                )}
                                            </div>
                                        )}
                                </ConversationContent>
                                <ConversationScrollButton />
                            </Conversation>

                            <div className="flex flex-col items-start gap-2 px-3 md:px-4">
                                <QuestionInput
                                    hideSuggestions
                                    className="w-full max-w-none"
                                    textareaClassName="min-h-30 h-30 w-full"
                                    placeholder="Ask me anything..."
                                    value=""
                                    handleKeyDown={handleKeyDown}
                                    handleSubmit={handleSend}
                                    hideFeatureSelector
                                    isDisabled={isLoading}
                                    hideModeSelector
                                    handleCancel={stopActiveStream}
                                    onOpenSetting={() => setIsOpenSetting(true)}
                                    onFilesChange={setFilesCount}
                                    onGoogleDriveClick={handleGoogleDriveClick}
                                    isGoogleDriveConnected={
                                        isGoogleDriveConnected
                                    }
                                    isGoogleDriveAuthLoading={
                                        isGoogleDriveAuthLoading
                                    }
                                    googleDriveFiles={
                                        downloadedGoogleDriveFiles
                                    }
                                    onGoogleDriveFilesHandled={
                                        clearDownloadedFiles
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarProvider>
            <RightSidebar />
            <AgentSetting
                isOpen={isOpenSetting}
                onOpenChange={setIsOpenSetting}
            />
        </div>
    )
}

export const Component = ChatPage
