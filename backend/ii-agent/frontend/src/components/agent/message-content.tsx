'use client'

import { Check, ChevronDown, ChevronRight, Copy, Folder } from 'lucide-react'
import { memo, useMemo, useState } from 'react'

import Action from './action'
import EditQuestion from './edit-question'
import AttachmentsList from './attachments-list'
import Markdown from '@/components/markdown'
import { ActionStep, BUILD_STEP, Message, TAB, TOOL } from '@/typings/agent'
import { Button } from '../ui/button'
import { setActiveTab, setSelectedBuildStep, type AppDispatch } from '@/state'
import { getFileIconAndColor } from '@/utils/file-utils'
import { SaveCheckpointPublish } from './save-checkpoint-publish'

interface MessageContentProps {
    message: Message
    isLatestUser: boolean
    editingMessage: Message | null | undefined
    workspaceInfo: string
    isThinkMessageExpanded: (id: string) => boolean
    toggleThinkMessage: (id: string) => void
    handleSetEditingMessage: (msg?: Message) => void
    handleEditMessage: (question: string) => void
    handleClickAction: (
        data: ActionStep | undefined,
        showTabOnly?: boolean
    ) => void
    dispatch: AppDispatch
    isReplayMode: boolean
}

const MessageContent = memo(
    ({
        message,
        editingMessage,
        workspaceInfo,
        isThinkMessageExpanded,
        toggleThinkMessage,
        handleSetEditingMessage,
        handleEditMessage,
        handleClickAction,
        dispatch
    }: MessageContentProps) => {
        const [isCopied, setIsCopied] = useState(false)

        const handleCopyContent = async () => {
            try {
                await navigator.clipboard.writeText(message.content || '')
                setIsCopied(true)
                setTimeout(() => setIsCopied(false), 2000)
            } catch (err) {
                console.error('Failed to copy text:', err)
            }
        }

        const fileElements = useMemo(() => {
            if (!message.files || message.files.length === 0) return null

            // Process files logic (same as before but memoized)
            const folderFiles = message.files.filter((file) =>
                file.file_name.match(/^folder:(.+):(\d+)$/)
            )

            const folderNames = folderFiles
                .map((folderFile) => {
                    const match =
                        folderFile.file_name.match(/^folder:(.+):(\d+)$/)
                    return match ? match[1] : null
                })
                .filter(Boolean) as string[]

            const filesToDisplay = message.files.filter((file) => {
                if (file.file_name.match(/^folder:(.+):(\d+)$/)) {
                    return true
                }
                for (const folderName of folderNames) {
                    if (file.file_name.includes(folderName)) {
                        return false
                    }
                }
                return true
            })

            return filesToDisplay.map((file, fileIndex) => {
                const isFolderMatch =
                    file.file_name.match(/^folder:(.+):(\d+)$/)
                if (isFolderMatch) {
                    const folderName = isFolderMatch[1]
                    const fileCount = parseInt(isFolderMatch[2], 10)

                    return (
                        <div
                            key={`${message.id}-folder-${fileIndex}`}
                            className="inline-block ml-auto bg-[#35363a] text-white rounded-2xl px-4 py-3 border border-gray-700 shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl">
                                    <Folder className="size-6 text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base font-medium">
                                        {folderName}
                                    </span>
                                    <span className="text-left text-sm text-gray-500">
                                        {fileCount}{' '}
                                        {fileCount === 1 ? 'file' : 'files'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                }

                const isImage =
                    file.file_name.match(
                        /\.(jpeg|jpg|gif|png|webp|svg|heic|bmp)$/i
                    ) !== null

                if (
                    isImage &&
                    message.fileContents &&
                    message.fileContents[file.file_name]
                ) {
                    return (
                        <div
                            key={`${message.id}-file-${fileIndex}`}
                            className="inline-block ml-auto rounded-3xl overflow-hidden max-w-[320px]"
                        >
                            <div className="w-40 h-40 rounded-xl overflow-hidden">
                                <img
                                    src={message.fileContents[file.file_name]}
                                    alt={file.file_name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    )
                }

                const { IconComponent, bgColor, label } = getFileIconAndColor(
                    file.file_name
                )

                return (
                    <div
                        key={`${message.id}-file-${fileIndex}`}
                        className="inline-block ml-auto bg-[#35363a] text-white rounded-2xl px-4 py-3 border border-gray-700 shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={`flex items-center justify-center w-12 h-12 ${bgColor} rounded-xl`}
                            >
                                <IconComponent className="size-6 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-base font-medium">
                                    {file.file_name}
                                </span>
                                <span className="text-left text-sm text-gray-500">
                                    {label}
                                </span>
                            </div>
                        </div>
                    </div>
                )
            })
        }, [message.files, message.fileContents, message.id])

        return (
            <>
                {fileElements && (
                    <div className="flex flex-col gap-2 mb-2">
                        {fileElements}
                    </div>
                )}
                {message.content && (
                    <div
                        className={`inline-block text-left rounded-lg ${
                            message.role === 'user'
                                ? 'bg-[#f5f5f5] dark:bg-grey p-3 max-w-[80%] text-black whitespace-pre-wrap border border-grey dark:none'
                                : message.role === 'system'
                                  ? 'p-3 w-full text-gray-500 dark:text-gray-400'
                                  : 'text-white w-full'
                        } ${
                            editingMessage?.id === message.id
                                ? 'w-full max-w-none'
                                : ''
                        } ${
                            message.content?.startsWith('```Thinking:')
                                ? 'agent-thinking w-full'
                                : ''
                        }`}
                    >
                        {message.role === 'system' ? (
                            <div className="italic">
                                <Markdown>{message.content}</Markdown>
                            </div>
                        ) : message.role === 'user' ? (
                            <div>
                                {editingMessage?.id === message.id ? (
                                    <EditQuestion
                                        editingMessage={message.content}
                                        handleCancel={() =>
                                            handleSetEditingMessage(undefined)
                                        }
                                        handleEditMessage={handleEditMessage}
                                    />
                                ) : (
                                    <div className="relative group">
                                        <div className="text-left text-sm">
                                            {message.content}
                                        </div>
                                        <div className="flex items-center justify-end gap-1 absolute -right-4 -bottom-9">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-xs cursor-pointer text-white"
                                                onClick={handleCopyContent}
                                            >
                                                {isCopied ? (
                                                    <Check className="size-3" />
                                                ) : (
                                                    <Copy className="size-3" />
                                                )}
                                            </Button>
                                            {/* {isLatestUser && !isReplayMode && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-xs cursor-pointer hover:!bg-gray-200 dark:hover:!bg-gray-700"
                                                    onClick={() =>
                                                        handleSetEditingMessage(
                                                            message
                                                        )
                                                    }
                                                >
                                                    <Pencil className="size-3" />
                                                </Button>
                                            )} */}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : message?.isThinkMessage ? (
                            <div
                                className={`inline-flex flex-col bg-firefly/[0.18] dark:bg-sky-blue/[0.18] border border-grey rounded-xl overflow-hidden ${
                                    isThinkMessageExpanded(message.id)
                                        ? 'w-full'
                                        : ''
                                }`}
                            >
                                <button
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        toggleThinkMessage(message.id)
                                    }}
                                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-firefly dark:bg-sky-blue rounded-full"></div>
                                        <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                                            Thought
                                        </span>
                                    </div>
                                    {isThinkMessageExpanded(message.id) ? (
                                        <ChevronDown className="size-4 text-gray-500 dark:text-gray-400" />
                                    ) : (
                                        <ChevronRight className="size-4 text-gray-500 dark:text-gray-400" />
                                    )}
                                </button>
                                {isThinkMessageExpanded(message.id) && (
                                    <div className="px-4 pb-4">
                                        <Markdown>
                                            {message.content
                                                ?.replace(
                                                    '<video>',
                                                    '&lt;video&gt;'
                                                )
                                                ?.replace(/\n/g, '  \n')}
                                        </Markdown>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="relative group">
                                <Markdown>
                                    {message.content
                                        ?.replace('<video>', '&lt;video&gt;')
                                        ?.replace(/\n/g, '  \n')}
                                </Markdown>
                                <div className="absolute -bottom-1 right-0 flex items-center justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-xs cursor-pointer hover:!bg-gray-700/50 dark:hover:!bg-gray-600/50"
                                        onClick={handleCopyContent}
                                    >
                                        {isCopied ? (
                                            <Check className="size-3" />
                                        ) : (
                                            <Copy className="size-3" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                <AttachmentsList attachments={message.attachments} />
                {message.action && (
                    <div className="mt-2 space-y-2">
                        <Action
                            workspaceInfo={workspaceInfo}
                            type={message.action.type}
                            value={message.action.data}
                            onClick={() => {
                                dispatch(setActiveTab(TAB.BUILD))
                                dispatch(setSelectedBuildStep(BUILD_STEP.BUILD))
                                handleClickAction(message.action, true)
                            }}
                        />
                        {message.action.type === TOOL.SAVE_CHECKPOINT && (
                            <SaveCheckpointPublish
                                isResult={Boolean(message.action.data.isResult)}
                                result={message.action.data.result}
                            />
                        )}
                    </div>
                )}
            </>
        )
    },
    (prevProps, nextProps) => {
        return (
            prevProps.message.id === nextProps.message.id &&
            prevProps.message.content === nextProps.message.content &&
            prevProps.message.attachments === nextProps.message.attachments &&
            prevProps.message.action === nextProps.message.action &&
            prevProps.isLatestUser === nextProps.isLatestUser &&
            prevProps.editingMessage?.id === nextProps.editingMessage?.id &&
            prevProps.isThinkMessageExpanded(prevProps.message.id) ===
                nextProps.isThinkMessageExpanded(nextProps.message.id)
        )
    }
)

MessageContent.displayName = 'MessageContent'

export default MessageContent
