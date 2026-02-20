import { FC } from 'react'
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton
} from '@/components/ai-elements/conversation'
import ChatMessageContent from '@/components/chat-message-content'
import ThinkingMessage from '@/components/thinking-message'
import QuestionInput from '@/components/question-input'
import { Loader } from '@/components/ai-elements/loader'

export interface AcheevyChatProps {
    workspace?: string
    vertical?: string
    context?: string
    theme?: 'dark' | 'glass'
    groupedMessages: any[]
    isHistoryLoading: boolean
    sessionError?: string | null
    chatStatus: string
    isWaitingForNextEvent: boolean
    showThinking: boolean
    lastMessageFinishReason: string | null
    getFinishReasonMessage: (reason: string) => string | null
    handleKeyDown: (e: any) => void
    handleSend: (override?: string) => void
    isSubmitting: boolean
    isLoading: boolean
    stopActiveStream: () => void
    setIsOpenSetting: (val: boolean) => void
    setFilesCount: (val: number) => void
    handleGoogleDriveClick: () => void
    isGoogleDriveConnected: boolean
    isGoogleDriveAuthLoading: boolean
    downloadedGoogleDriveFiles: any[]
    clearDownloadedFiles: () => void
    filesCount: number
}

export const AcheevyChat: FC<AcheevyChatProps> = ({
    workspace,
    vertical,
    context,
    theme = 'dark',
    groupedMessages,
    isHistoryLoading,
    sessionError,
    chatStatus,
    isWaitingForNextEvent,
    showThinking,
    lastMessageFinishReason,
    getFinishReasonMessage,
    handleKeyDown,
    handleSend,
    isSubmitting,
    isLoading,
    stopActiveStream,
    setIsOpenSetting,
    setFilesCount,
    handleGoogleDriveClick,
    isGoogleDriveConnected,
    isGoogleDriveAuthLoading,
    downloadedGoogleDriveFiles,
    clearDownloadedFiles,
    filesCount
}) => {
    return (
        <div className="flex-1 flex flex-col w-full max-w-4xl py-3 md:py-4 relative rounded-xl overflow-hidden glass-card bg-black/40 border border-yellow/20 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
            {/* ACHEEVY Retro-Futurist Bezel */}
            <div className="bezel absolute top-0 left-0 w-full px-4 py-2 bg-gradient-to-r from-firefly to-black border-b border-yellow/30 flex justify-between items-center z-10 backdrop-blur-md">
                <div className="text-yellow text-xs tracking-[0.3em] font-mono uppercase bg-yellow/10 px-2 py-1 rounded shadow-[0_0_10px_rgba(255,215,0,0.2)]">
                    chat  w/ A C H E E V Y
                </div>
                {vertical && (
                    <div className="text-white/60 text-[10px] tracking-widest uppercase">
                        {vertical} | {workspace || 'core'}
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(255,0,0,0.8)]" title="Voice Active / Recording"></div>
                    <div className="text-white/40 text-[10px] uppercase font-mono tracking-widest">
                        SYS.ONLINE
                    </div>
                </div>
            </div>

            <div className="flex-1 mt-10 overflow-hidden flex flex-col relative z-0">
                {/* Optional scanlines/noise texture backdrop applied here or parent via CSS */}
                <div className="absolute inset-0 pointer-events-none bg-[url('/assets/noise.png')] opacity-10 mix-blend-overlay"></div>

                <Conversation
                    className={`flex-1 overflow-y-auto custom-scrollbar ${filesCount > 0 ? ' with-files' : ''}`}
                >
                    <ConversationContent className="p-4 md:p-6 pb-24 relative z-10">
                        {isHistoryLoading && (
                            <div className="flex items-center justify-center gap-2 py-12">
                                <Loader size={20} className="text-yellow" />
                                <span className="text-sm text-yellow/70 font-mono tracking-widest">
                                    [SYNCING NEURAL LOGS]&hellip;
                                </span>
                            </div>
                        )}
                        {sessionError && (
                            <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500 dark:text-red-300 font-mono backdrop-blur-sm">
                                [ERR] {sessionError}
                            </div>
                        )}
                        {!isHistoryLoading &&
                            !sessionError &&
                            groupedMessages.length === 0 && (
                                <div className="text-sm text-white/50 text-center py-12 font-mono tracking-wider">
                                    > READY FOR INPUT OR VOICE COMMAND
                                </div>
                            )}

                        {groupedMessages.map((group, index) => {
                            const isLastGroup = index === groupedMessages.length - 1
                            const isStreaming = isLastGroup && chatStatus === 'running'

                            return (
                                <ChatMessageContent
                                    key={index}
                                    group={group}
                                    isStreaming={isStreaming}
                                    isWaitingForNextEvent={isLastGroup && isWaitingForNextEvent}
                                />
                            )
                        })}

                        {showThinking && <ThinkingMessage />}

                        {lastMessageFinishReason &&
                            getFinishReasonMessage(lastMessageFinishReason) && (
                                <div className="rounded-lg border border-yellow dark:border-yellow/40 bg-yellow dark:bg-yellow/10 p-3 text-sm text-black dark:text-yellow mt-4 font-mono shadow-[0_0_10px_rgba(255,215,0,0.1)]">
                                    {getFinishReasonMessage(lastMessageFinishReason)}
                                </div>
                            )}
                    </ConversationContent>
                    <ConversationScrollButton />
                </Conversation>

                <div className="absolute bottom-0 left-0 w-full p-3 md:p-4 bg-gradient-to-t from-black via-black/90 to-transparent z-20">
                    <QuestionInput
                        hideSuggestions
                        className="w-full max-w-none shadow-xl border border-yellow/20 rounded-xl bg-black/60 backdrop-blur-xl"
                        textareaClassName="min-h-[60px] max-h-[120px] w-full bg-transparent text-white font-mono placeholder:text-white/30"
                        placeholder="Type or speak..."
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
                        isGoogleDriveConnected={isGoogleDriveConnected}
                        isGoogleDriveAuthLoading={isGoogleDriveAuthLoading}
                        googleDriveFiles={downloadedGoogleDriveFiles}
                        onGoogleDriveFilesHandled={clearDownloadedFiles}
                    />
                </div>
            </div>
        </div>
    )
}

export default AcheevyChat
