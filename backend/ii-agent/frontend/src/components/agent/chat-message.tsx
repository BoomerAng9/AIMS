import { motion } from 'framer-motion'
import { Check, SearchCheck, SkipForward } from 'lucide-react'
import { useState, useEffect, useCallback, useMemo, memo } from 'react'

import QuestionInput from '@/components/question-input'
import MessageContent from './message-content'
import SubagentContainer from './subagent-container'
import { ActionStep, AgentContext, Message } from '@/typings/agent'
import { Button } from '../ui/button'
import {
    selectCurrentQuestion,
    selectEditingMessage,
    selectIsCompleted,
    selectIsLoading,
    selectIsStopped,
    selectMessages,
    selectToolSettings,
    selectWorkspaceInfo,
    useAppDispatch,
    useAppSelector
} from '@/state'
import ModelTag from '../model-tag'
import ThinkingMessage from '../thinking-message'

// Debounce utility function
function debounce<T extends (...args: never[]) => unknown>(
    func: T,
    delay: number
): T & { cancel: () => void } {
    let timeoutId: NodeJS.Timeout
    const debounced = ((...args: Parameters<T>) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func(...args), delay)
    }) as T & { cancel: () => void }

    debounced.cancel = () => clearTimeout(timeoutId)
    return debounced
}

interface ChatMessageProps {
    isReplayMode: boolean
    messagesEndRef: React.RefObject<HTMLDivElement | null>
    handleClickAction: (
        data: ActionStep | undefined,
        showTabOnly?: boolean
    ) => void
    setCurrentQuestion: (value: string) => void
    handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
    handleQuestionSubmit: (question: string) => void
    handleEnhancePrompt: (payload: {
        prompt: string
        onSuccess: (res: string) => void
    }) => void
    handleCancel: () => void
    handleEditMessage: (newQuestion: string) => void
    processAllEventsImmediately?: () => void
    connectWebSocket: () => void
    handleReviewSession: () => void
    isShareMode?: boolean
}

const ChatMessage = ({
    messagesEndRef,
    isReplayMode,
    handleClickAction,
    setCurrentQuestion,
    handleKeyDown,
    handleQuestionSubmit,
    handleEnhancePrompt,
    handleCancel,
    handleEditMessage,
    processAllEventsImmediately,
    connectWebSocket,
    handleReviewSession,
    isShareMode = false
}: ChatMessageProps) => {
    const dispatch = useAppDispatch()
    const [showQuestionInput, setShowQuestionInput] = useState(false)
    const [userHasScrolledUp, setUserHasScrolledUp] = useState(false)
    const [manuallyCollapsedThinkMessages, setManuallyCollapsedThinkMessages] =
        useState<Set<string>>(new Set())
    // const [listHeight, setListHeight] = useState(600) // For future virtualization

    const currentQuestion = useAppSelector(selectCurrentQuestion)
    const isLoading = useAppSelector(selectIsLoading)
    const messages = useAppSelector(selectMessages)
    const isCompleted = useAppSelector(selectIsCompleted)
    const toolSettings = useAppSelector(selectToolSettings)
    const editingMessage = useAppSelector(selectEditingMessage)
    const isStopped = useAppSelector(selectIsStopped)
    const workspaceInfo = useAppSelector(selectWorkspaceInfo)

    useEffect(() => {
        if (isReplayMode && !isLoading && messages.length > 0) {
            // If we're in replay mode, loading is complete, and we have messages,
            // we can assume all events have been processed
            setShowQuestionInput(true)
        }
    }, [isReplayMode, isLoading, messages.length])

    // Add scroll event listener to detect manual scrolling with debouncing
    const debouncedHandleScroll = useCallback(
        debounce(() => {
            const messagesContainer = messagesEndRef.current?.parentElement
            if (!messagesContainer) return

            const isAtBottom =
                messagesContainer.scrollHeight -
                    messagesContainer.scrollTop -
                    messagesContainer.clientHeight <
                50
            setUserHasScrolledUp(!isAtBottom)
        }, 100),
        [messagesEndRef]
    )

    useEffect(() => {
        const messagesContainer = messagesEndRef.current?.parentElement
        if (!messagesContainer) return

        messagesContainer.addEventListener('scroll', debouncedHandleScroll)
        return () => {
            messagesContainer.removeEventListener(
                'scroll',
                debouncedHandleScroll
            )
            debouncedHandleScroll.cancel()
        }
    }, [messagesEndRef, debouncedHandleScroll])

    // Future: Update list height based on container size for virtualization
    // useEffect(() => {
    //     const updateHeight = () => {
    //         const container = messagesEndRef.current?.parentElement
    //         if (container) {
    //             setListHeight(container.clientHeight - 100)
    //         }
    //     }
    //     updateHeight()
    //     window.addEventListener('resize', updateHeight)
    //     return () => window.removeEventListener('resize', updateHeight)
    // }, [])

    // Replace the existing useEffect for message changes
    useEffect(() => {
        if (messages.length > 0 && !userHasScrolledUp) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
        }
    }, [messages?.length, userHasScrolledUp])

    const handleJumpToResult = () => {
        if (processAllEventsImmediately) {
            processAllEventsImmediately()
        }

        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            setShowQuestionInput(true)
        }, 100)
    }

    // Memoize latest user message
    const latestUserMessage = useMemo(() => {
        const userMessages = messages.filter((msg) => msg.role === 'user')
        return userMessages.length > 0
            ? userMessages[userMessages.length - 1]
            : undefined
    }, [messages])

    // Helper function to check if a message is the latest user message
    const isLatestUserMessage = useCallback(
        (message: Message): boolean => {
            return latestUserMessage?.id === message.id
        },
        [latestUserMessage]
    )

    const handleSetEditingMessage = (message?: Message) => {
        dispatch({ type: 'SET_EDITING_MESSAGE', payload: message })
    }

    const isThinkMessageExpanded = useCallback(
        (
            messageId: string,
            agentContext?: Message['agentContext']
        ): boolean => {
            // Check if this message is in the manually toggled set
            const isManuallyToggled =
                manuallyCollapsedThinkMessages.has(messageId)

            // Default behavior:
            // - Main agent thoughts: expanded by default
            // - Subagent thoughts: collapsed by default
            const defaultExpanded = agentContext?.agentType !== 'subagent'

            // If manually toggled, return the opposite of default
            // If not manually toggled, return the default
            return isManuallyToggled ? !defaultExpanded : defaultExpanded
        },
        [manuallyCollapsedThinkMessages]
    )

    const toggleThinkMessage = useCallback((messageId: string) => {
        console.log('[toggleThinkMessage] Called with messageId:', messageId)
        setManuallyCollapsedThinkMessages((prev) => {
            const isCurrentlyToggled = prev.has(messageId)

            if (isCurrentlyToggled) {
                // If currently in the toggled set, remove it to revert to default behavior
                const newSet = new Set(prev)
                newSet.delete(messageId)
                return newSet
            } else {
                // If not in the toggled set, add it to toggle from default behavior
                return new Set(prev).add(messageId)
            }
        })
    }, [])

    useEffect(() => {
        if (isReplayMode && showQuestionInput) {
            connectWebSocket()
        }
    }, [isReplayMode, showQuestionInput])

    // Memoize expensive computations
    const visibleMessages = useMemo(
        () => messages.filter((msg) => !msg.isHidden),
        [messages]
    )

    // Group messages by agent context for subagent containers
    const groupedMessages = useMemo(() => {
        const result: Array<{
            type: 'main' | 'subagent'
            agentContext?: Message['agentContext']
            messages: Message[]
        }> = []

        let currentGroup: Message[] = []
        let currentAgentContext: AgentContext | undefined = undefined

        for (const message of visibleMessages) {
            const messageAgentContext = message.agentContext

            // Check if we need to start a new group
            const needNewGroup =
                messageAgentContext?.agentId !==
                    (currentAgentContext as AgentContext | undefined)
                        ?.agentId ||
                messageAgentContext?.agentType !==
                    (currentAgentContext as AgentContext | undefined)?.agentType

            if (needNewGroup && currentGroup.length > 0) {
                // Close current group
                result.push({
                    type:
                        currentAgentContext?.agentType === 'subagent'
                            ? 'subagent'
                            : 'main',
                    agentContext: currentAgentContext,
                    messages: currentGroup
                })
                currentGroup = []
            }

            // Add message to current group
            currentGroup.push(message)
            currentAgentContext = messageAgentContext
        }

        // Close final group
        if (currentGroup.length > 0) {
            result.push({
                type:
                    currentAgentContext?.agentType === 'subagent'
                        ? 'subagent'
                        : 'main',
                agentContext: currentAgentContext,
                messages: currentGroup
            })
        }

        return result
    }, [visibleMessages])

    return (
        <div className="h-full flex flex-col">
            <div className="pb-4 px-3 md:px-4 w-full flex-1 overflow-y-auto overflow-x-hidden relative">
                {groupedMessages.map((group, groupIndex) => {
                    if (group.type === 'subagent' && group.agentContext) {
                        // Render subagent container
                        return (
                            <SubagentContainer
                                key={`subagent-${group.agentContext.agentId}-${groupIndex}`}
                                agentContext={group.agentContext}
                                messages={group.messages}
                            >
                                {group.messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`mb-4 ${
                                            message.role === 'user'
                                                ? 'text-right'
                                                : 'text-left'
                                        } ${message.role === 'user' && !message.files && 'mb-8'} ${
                                            message.role === 'system' &&
                                            'text-center'
                                        }`}
                                    >
                                        <MessageContent
                                            message={message}
                                            isLatestUser={isLatestUserMessage(
                                                message
                                            )}
                                            editingMessage={editingMessage}
                                            workspaceInfo={workspaceInfo}
                                            isThinkMessageExpanded={(id) =>
                                                isThinkMessageExpanded(
                                                    id,
                                                    message.agentContext
                                                )
                                            }
                                            toggleThinkMessage={
                                                toggleThinkMessage
                                            }
                                            handleSetEditingMessage={
                                                handleSetEditingMessage
                                            }
                                            handleEditMessage={
                                                handleEditMessage
                                            }
                                            handleClickAction={
                                                handleClickAction
                                            }
                                            dispatch={dispatch}
                                            isReplayMode={isReplayMode}
                                        />
                                    </div>
                                ))}
                            </SubagentContainer>
                        )
                    } else {
                        // Render main agent messages normally
                        return (
                            <div key={`main-${groupIndex}`}>
                                {group.messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`mb-4 ${
                                            message.role === 'user'
                                                ? 'text-right'
                                                : 'text-left'
                                        } ${message.role === 'user' && !message.files && 'mb-8'} ${
                                            message.role === 'system' &&
                                            'text-center'
                                        }`}
                                    >
                                        <MessageContent
                                            message={message}
                                            isLatestUser={isLatestUserMessage(
                                                message
                                            )}
                                            editingMessage={editingMessage}
                                            workspaceInfo={workspaceInfo}
                                            isThinkMessageExpanded={(id) =>
                                                isThinkMessageExpanded(
                                                    id,
                                                    message.agentContext
                                                )
                                            }
                                            toggleThinkMessage={
                                                toggleThinkMessage
                                            }
                                            handleSetEditingMessage={
                                                handleSetEditingMessage
                                            }
                                            handleEditMessage={
                                                handleEditMessage
                                            }
                                            handleClickAction={
                                                handleClickAction
                                            }
                                            dispatch={dispatch}
                                            isReplayMode={isReplayMode}
                                        />
                                    </div>
                                ))}
                            </div>
                        )
                    }
                })}

                {isCompleted && (
                    <div className="flex flex-col gap-y-4">
                        <div className="flex">
                            <div className="flex gap-x-2 items-center bg-sky-blue-2 text-black text-sm font-semibold px-4 py-2 rounded-full">
                                <div className="flex gap-x-2 items-center">
                                    <Check className="size-5" />
                                    <span>
                                        ACHEEVY has completed the task.
                                    </span>
                                </div>
                            </div>
                        </div>
                        {toolSettings?.enable_reviewer && (
                            <div
                                className={`group cursor-pointer flex items-start gap-2 px-3 py-2 bg-[#35363a] rounded-xl backdrop-blur-sm 
      shadow-sm
      transition-all duration-200 ease-out
      hover:shadow-[0_2px_8px_rgba(0,0,0,0.24)]
      active:scale-[0.98] overflow-hidden
      animate-fadeIn`}
                            >
                                <div className="flex text-sm items-center justify-between flex-1">
                                    <div className="flex items-center gap-x-1.5 flex-1">
                                        <SearchCheck className="size-5 text-white" />
                                        <span className="text-neutral-100 flex-1 font-medium group-hover:text-white">
                                            Allow ACHEEVY to review the results
                                        </span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="cursor-pointer text-neutral-900 bg-gradient-skyblue-lavender hover:text-neutral-950"
                                        onClick={handleReviewSession}
                                    >
                                        Review
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isStopped && !isCompleted && (
                    <div className="flex items-center">
                        <div className="flex items-center gap-x-[6px] py-2 px-4 bg-sky-blue-2 text-black rounded-full">
                            <div className="size-3 bg-black m-1" />
                            <span className="text-sm font-semibold">
                                ACHEEVY has stopped
                            </span>
                        </div>
                    </div>
                )}

                {isLoading && !isStopped && !isCompleted && <ThinkingMessage />}

                <div ref={messagesEndRef} />
            </div>
            {isReplayMode ? (
                showQuestionInput && !isShareMode ? (
                    <div className="flex flex-col items-start gap-2 px-4">
                        <ModelTag />
                        <QuestionInput
                            hideSuggestions
                            hideModeSelector
                            className="w-full max-w-none"
                            textareaClassName="min-h-40 h-40 w-full"
                            placeholder="Ask me anything..."
                            value={currentQuestion}
                            setValue={setCurrentQuestion}
                            handleKeyDown={handleKeyDown}
                            handleSubmit={handleQuestionSubmit}
                            handleEnhancePrompt={handleEnhancePrompt}
                            handleCancel={handleCancel}
                            hideFeatureSelector
                            isDisabled={isLoading}
                        />
                    </div>
                ) : (
                    <motion.div
                        className="sticky bottom-0 left-0 w-full p-3 md:p-4 pb-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                    >
                        {isShareMode && (
                            <div className="bg-white/5 backdrop-blur-md border dark:border-white/10 rounded-2xl p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 md:ml-2">
                                    <div className="animate-pulse">
                                        <div className="h-2 w-2 bg-black dark:bg-white rounded-full"></div>
                                    </div>
                                    <span className="text-sm md:text-base dark:text-white">
                                        ACHEEVY is replaying the task...
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="cursor-pointer rounded-full"
                                        onClick={handleJumpToResult}
                                    >
                                        <SkipForward /> Skip to results
                                    </Button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )
            ) : (
                !isShareMode && (
                    <motion.div
                        className="sticky bottom-0 left-0 w-full px-3 md:px-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                    >
                        <QuestionInput
                            hideSuggestions
                            hideModeSelector
                            className="w-full max-w-none"
                            textareaClassName="min-h-40 h-40 w-full"
                            placeholder="Ask me anything..."
                            value={currentQuestion}
                            setValue={setCurrentQuestion}
                            handleKeyDown={handleKeyDown}
                            handleSubmit={handleQuestionSubmit}
                            handleEnhancePrompt={handleEnhancePrompt}
                            handleCancel={handleCancel}
                            isDisabled={isLoading}
                            hideFeatureSelector
                        />
                    </motion.div>
                )
            )}
        </div>
    )
}

export default memo(ChatMessage, (prevProps, nextProps) => {
    // Custom comparison for better performance - avoid JSON.stringify
    return (
        prevProps.isReplayMode === nextProps.isReplayMode &&
        prevProps.messagesEndRef === nextProps.messagesEndRef &&
        prevProps.handleClickAction === nextProps.handleClickAction &&
        prevProps.handleQuestionSubmit === nextProps.handleQuestionSubmit &&
        prevProps.handleEditMessage === nextProps.handleEditMessage
    )
})
