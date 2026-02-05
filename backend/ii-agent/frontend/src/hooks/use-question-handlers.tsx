import { useMemo, useRef, useEffect } from 'react'
import { toast } from 'sonner'

import {
    addMessage,
    selectAvailableModels,
    selectMessages,
    selectSelectedModel,
    selectToolSettings,
    selectCurrentMessageFileIds,
    selectWsConnectionState,
    setBuildStep,
    setCompleted,
    setCurrentActionData,
    setCurrentQuestion,
    setGeneratingPrompt,
    setIsCreatingSession,
    setLoading,
    setMessages,
    setRequireClearFiles,
    clearCurrentMessageFileIds,
    setStopped,
    updateMessage,
    useAppDispatch,
    useAppSelector,
    selectSelectedFeature,
    selectSelectedSlideTemplate,
    resetSlideTemplate,
    setActiveTab,
    setSandboxIframeAwake,
    setPendingQuery,
    setIsMobileChatVisible,
    selectPendingQuery,
    selectActiveSessionId
} from '@/state'
import { AGENT_TYPE, TAB, WebSocketConnectionState } from '@/typings/agent'
import { BUILD_STEP, Message } from '@/typings/agent'
import { useSocketIOContext } from '@/contexts/websocket-context'
import { promptService } from '@/services/prompt.service'
import { useParams } from 'react-router'

export function useQuestionHandlers() {
    const dispatch = useAppDispatch()
    const { sendMessage, joinSession } = useSocketIOContext()
    const { sessionId } = useParams()

    const messages = useAppSelector(selectMessages)
    const selectedModelId = useAppSelector(selectSelectedModel)
    const availableModels = useAppSelector(selectAvailableModels)
    const toolSettings = useAppSelector(selectToolSettings)
    const currentMessageFileIds = useAppSelector(selectCurrentMessageFileIds)
    const wsConnectionState = useAppSelector(selectWsConnectionState)
    const selectedFeature = useAppSelector(selectSelectedFeature)
    const selectedSlideTemplate = useAppSelector(selectSelectedSlideTemplate)
    const pendingQuery = useAppSelector(selectPendingQuery)
    const activeSessionId = useAppSelector(selectActiveSessionId)

    // Track previous session ID to detect when session is created
    const previousSessionIdRef = useRef(activeSessionId)

    const selectedModel = useMemo(
        () => availableModels.find((m) => m.id === selectedModelId),
        [selectedModelId, availableModels]
    )

    // Send pending query when session ID transitions from null/undefined to a value
    useEffect(() => {
        const wasNoSession = !previousSessionIdRef.current
        const nowHasSession = !!activeSessionId

        // Only send when we transition to having a session AND there's a pending query
        if (wasNoSession && nowHasSession && pendingQuery) {
            console.log(
                'Session created, sending pending query with session_uuid:',
                activeSessionId
            )
            sendMessage({
                type: 'query',
                content: {
                    ...pendingQuery,
                    session_uuid: activeSessionId // Attach session_uuid now that we have it
                }
            })
            dispatch(setPendingQuery(null))
        }

        // Update the previous value for next render
        previousSessionIdRef.current = activeSessionId
    }, [activeSessionId, sendMessage, pendingQuery, dispatch])

    const handleEnhancePrompt = async ({
        prompt,
        onSuccess
    }: {
        prompt: string
        onSuccess: (res: string) => void
    }) => {
        if (!prompt.trim()) {
            toast.error('Please enter a prompt to enhance.')
            return
        }

        dispatch(setGeneratingPrompt(true))

        try {
            const response = await promptService.enhancePrompt({
                prompt,
                context:
                    selectedFeature !== AGENT_TYPE.GENERAL
                        ? `This is for ${selectedFeature} feature`
                        : undefined
            })
            onSuccess(response.enhanced_prompt)
            dispatch(setGeneratingPrompt(false))
            toast.success('Prompt enhanced successfully!')
        } catch (error) {
            console.error('Error enhancing prompt:', error)
            dispatch(setGeneratingPrompt(false))
            toast.error('Failed to enhance prompt. Please try again.')
        }
    }

    const handleQuestionSubmit = (
        newQuestion: string,
        isNewSession = false
    ) => {
        if (!newQuestion.trim()) return

        if (wsConnectionState !== WebSocketConnectionState.CONNECTED) {
            toast.error('WebSocket connection is not open. Please try again.')
            dispatch(setLoading(false))
            return
        }

        // Check if Codex is selected but tools are not enabled
        if (selectedFeature === AGENT_TYPE.CODEX && !toolSettings.codex_tools) {
            toast.warning(
                'Codex tools must be enabled to use the Codex agent. Please enable it in the settings.'
            )
            dispatch(setLoading(false))
            return
        }

        // Check if a model is selected
        if (!selectedModel || !selectedModel.id) {
            toast.error(
                'Please select a model before submitting your question.'
            )
            dispatch(setLoading(false))
            return
        }

        // Check if Claude Code is selected but tools are not enabled
        if (
            selectedFeature === AGENT_TYPE.CLAUDE_CODE &&
            !toolSettings.claude_code
        ) {
            toast.warning(
                'Claude code must be enabled to use. Please enable it in the settings.'
            )
            dispatch(setLoading(false))
            return
        }

        // Determine if this is a new session creation (no sessionId in route or explicitly new)
        const isCreatingNewSession = !sessionId || isNewSession

        dispatch(setLoading(true))
        dispatch(setCompleted(false))
        dispatch(setStopped(false))
        dispatch(setActiveTab(TAB.BUILD))
        dispatch(setIsMobileChatVisible(true))
        dispatch(setBuildStep(BUILD_STEP.THINKING))
        dispatch(setSandboxIframeAwake(true))
        dispatch(setCurrentActionData(undefined))

        // Show all hidden messages
        messages.forEach((message) => {
            if (message.isHidden) {
                dispatch(updateMessage({ ...message, isHidden: false }))
            }
        })

        const newUserMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: newQuestion,
            timestamp: Date.now()
        }

        if (isCreatingNewSession) {
            dispatch(setMessages([newUserMessage]))
            dispatch(setIsCreatingSession(true))
        } else {
            dispatch(setRequireClearFiles(true))
            dispatch(setCurrentQuestion(''))
            dispatch(addMessage(newUserMessage))
        }

        // Clear current message file IDs after sending
        dispatch(clearCurrentMessageFileIds())

        const { thinking_tokens, ...tool_args } = toolSettings

        // Prepare metadata
        const metadata: Record<string, unknown> = {}
        if (selectedFeature === AGENT_TYPE.SLIDE && selectedSlideTemplate) {
            metadata.template_id = selectedSlideTemplate.id
        }

        // Reset slide template after preparing metadata
        if (selectedSlideTemplate) {
            dispatch(resetSlideTemplate())
        }

        // Prepare the query content
        const queryContent = {
            model_id: selectedModel.id,
            provider: selectedModel.api_type,
            source: selectedModel.source,
            agent_type: selectedFeature,
            tool_args,
            thinking_tokens,
            metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
            // Query params
            text: newQuestion,
            resume: messages.length > 0,
            files: currentMessageFileIds
        }

        if (isCreatingNewSession) {
            // New session: Join session first, then wait for session_id event
            // The pending query will be sent automatically in use-app-events.tsx when session_id is received
            console.log(
                'New session: storing pending query and joining session'
            )
            dispatch(setPendingQuery(queryContent))
            joinSession()
        } else {
            // Existing session: Send query immediately
            console.log('Existing session: sending query immediately')
            sendMessage({
                type: 'query',
                content: {
                    ...queryContent
                }
            })
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleQuestionSubmit((e.target as HTMLTextAreaElement).value)
        }
    }

    return {
        handleEnhancePrompt,
        handleQuestionSubmit,
        handleKeyDown
    }
}
