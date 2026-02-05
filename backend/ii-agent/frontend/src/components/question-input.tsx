import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'

import { Textarea } from './ui/textarea'
import { useUploadFiles, type FileUploadStatus } from '@/hooks/use-upload-files'
import FilesPreview from './question-files-preview'
import Suggestions from './question-suggestions'
import FeatureSelector from './question-feature-selector'
import ModeSelector from './question-mode-selector'
import EnhanceButton from './question-enhance-button'
import SubmitButton from './question-submit-button'
import QuestionFileUpload from './question-file-upload'
import { SlideTemplateSelector } from './slide-template-selector'
import { type SlideTemplate } from '@/services/slide.service'
import {
    selectRequireClearFiles,
    setRequireClearFiles,
    selectSelectedFeature,
    setSelectedFeature,
    selectShouldFocusInput,
    setShouldFocusInput,
    setSelectedSlideTemplate,
    selectSelectedSlideTemplate,
    selectQuestionMode,
    setQuestionMode,
    useAppDispatch,
    useAppSelector,
    selectSelectedModel,
    selectAvailableModels,
    addUploadedFiles,
    addToCurrentMessageFileIds
} from '@/state'
import { AGENT_TYPE, QUESTION_MODE } from '@/typings'
import { FEATURES } from '@/constants/tool'
import { Button } from './ui/button'
import { Icon } from './ui/icon'
import { isImageFile } from '@/lib/utils'
import type { DownloadedFile } from '@/services/connector.service'

interface QuestionInputProps {
    value: string
    setValue?: (value: string) => void
    handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
    handleSubmit: (question: string) => void
    className?: string
    textareaClassName?: string
    placeholder?: string
    isDisabled?: boolean
    handleEnhancePrompt?: (payload: {
        prompt: string
        onSuccess: (res: string) => void
    }) => void
    handleCancel?: () => void
    onFilesChange?: (filesCount: number) => void
    hideSuggestions?: boolean
    hideFeatureSelector?: boolean
    hideModeSelector?: boolean
    onOpenSetting?: () => void
    onGoogleDriveClick?: () => void
    isGoogleDriveConnected?: boolean
    isGoogleDriveAuthLoading?: boolean
    googleDriveFiles?: DownloadedFile[]
    onGoogleDriveFilesHandled?: () => void
}

const QuestionInput = ({
    className,
    textareaClassName,
    placeholder,
    value,
    handleKeyDown,
    handleSubmit,
    isDisabled,
    handleEnhancePrompt,
    handleCancel,
    onFilesChange,
    hideSuggestions,
    hideFeatureSelector,
    hideModeSelector,
    onOpenSetting,
    onGoogleDriveClick,
    isGoogleDriveConnected,
    isGoogleDriveAuthLoading,
    googleDriveFiles,
    onGoogleDriveFilesHandled
}: QuestionInputProps) => {
    const dispatch = useAppDispatch()
    const requireClearFiles = useAppSelector(selectRequireClearFiles)
    const selectedFeature = useAppSelector(selectSelectedFeature)
    const shouldFocusInput = useAppSelector(selectShouldFocusInput)
    const selectedSlideTemplate = useAppSelector(selectSelectedSlideTemplate)
    const questionMode = useAppSelector(selectQuestionMode)
    const availableModels = useAppSelector(selectAvailableModels)
    const selectedModel = useAppSelector(selectSelectedModel)
    const isUploading = useAppSelector((state) => state.files.isUploading)
    const isLoading = useAppSelector((state) => state.ui.isLoading)
    const isGeneratingPrompt = useAppSelector(
        (state) => state.ui.isGeneratingPrompt
    )
    const isCreatingSession = useAppSelector(
        (state) => state.ui.isCreatingSession
    )
    const { sessionId } = useParams()

    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const [files, setFiles] = useState<FileUploadStatus[]>([])
    const [currentTextareaValue, setCurrentTextareaValue] = useState(value)
    const [showTemplateSelector, setShowTemplateSelector] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    const {
        handleRemoveFile,
        handleFileUploadWithSignedUrl,
        handlePastedImageUpload
    } = useUploadFiles()

    const removeFile = (fileName: string) => {
        handleRemoveFile(fileName)
        setFiles((prev) => prev.filter((file) => file.name !== fileName))
    }

    // Handle key down events with auto-scroll for Shift+Enter
    const handleKeyDownWithAutoScroll = (
        e: React.KeyboardEvent<HTMLTextAreaElement>
    ) => {
        if (
            !currentTextareaValue.trim() ||
            isDisabled ||
            isCreatingSession ||
            files?.some((file) => file.loading) ||
            isUploading
        )
            return

        if (e.key === 'Enter') {
            if (e.shiftKey) {
                // Check if cursor is at the last line before allowing default behavior
                const textarea = textareaRef.current
                if (textarea) {
                    const cursorPosition = textarea.selectionStart
                    const text = textarea.value

                    // Check if cursor is at or near the end of the text
                    const isAtLastLine = !text
                        .substring(cursorPosition)
                        .includes('\n')

                    // Allow default behavior for Shift+Enter (new line)
                    // Only schedule auto-scroll if we're at the last line
                    if (isAtLastLine) {
                        setTimeout(() => {
                            if (textarea) {
                                textarea.scrollTop = textarea.scrollHeight
                            }
                        }, 0)
                    }
                }
            } else {
                // For Enter key, get current value from textarea and pass to handleSubmit
                e.preventDefault()
                const currentValue = textareaRef.current?.value || ''
                if (currentValue.trim()) {
                    handleSubmit(currentValue)
                    // Clear the textarea after submission
                    if (textareaRef.current) {
                        textareaRef.current.value = ''
                        setCurrentTextareaValue('')
                    }
                }
            }
        } else {
            // Pass other key events to the original handler, but modify to work with uncontrolled input
            const modifiedEvent = {
                ...e,
                target: {
                    ...e.target,
                    value: textareaRef.current?.value || ''
                }
            } as React.KeyboardEvent<HTMLTextAreaElement>
            handleKeyDown(modifiedEvent)
        }
    }

    const handleFileChange = async (filesToUpload: File[]) => {
        await handleFileUploadWithSignedUrl(filesToUpload, setFiles)
    }

    // Handle drag and drop events
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true)
        }
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        // Only set isDragging to false if we're leaving the main container
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const x = e.clientX
        const y = e.clientY
        if (
            x <= rect.left ||
            x >= rect.right ||
            y <= rect.top ||
            y >= rect.bottom
        ) {
            setIsDragging(false)
        }
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }, [])

    const handleDrop = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragging(false)

            if (isDisabled || isUploading || isCreatingSession) {
                return
            }

            const droppedFiles = Array.from(e.dataTransfer.files)
            if (droppedFiles.length > 0) {
                await handleFileUploadWithSignedUrl(droppedFiles, setFiles)
            }
        },
        [
            isDisabled,
            isUploading,
            isCreatingSession,
            handleFileUploadWithSignedUrl
        ]
    )

    // Handle clipboard paste (images upload + keep caret in view)
    const handlePaste = useCallback(
        async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
            const clipboardItems = e.clipboardData?.items
            if (!clipboardItems) return

            const imageItems = Array.from(clipboardItems).filter((item) =>
                item.type.startsWith('image/')
            )

            if (imageItems.length > 0) {
                // Prevent default paste behavior for images
                e.preventDefault()

                for (const item of imageItems) {
                    const file = item.getAsFile()
                    if (!file) continue

                    // Generate a unique filename for the pasted image
                    const timestamp = Date.now()
                    const extension = file.type.split('/')[1] || 'png'
                    const fileName = `pasted-image-${timestamp}.${extension}`

                    // Create a new File object with the generated name
                    const renamedFile = new File([file], fileName, {
                        type: file.type
                    })

                    await handlePastedImageUpload(
                        renamedFile,
                        fileName,
                        setFiles
                    )
                }
            }

            // Scroll to the end after text paste so the caret stays in view
            setTimeout(() => {
                const textarea = textareaRef.current
                if (!textarea) return
                textarea.scrollTop = textarea.scrollHeight
                setCurrentTextareaValue(textarea.value)
            }, 0)
        },
        [handlePastedImageUpload, setFiles]
    )

    const handleSelectFeature = (type: string) => {
        if (type === AGENT_TYPE.SLIDE) {
            // Show template selector instead of immediately setting the agent type
            setShowTemplateSelector(true)
        } else {
            dispatch(setSelectedFeature(type))
            setTimeout(() => {
                textareaRef.current?.focus()
            }, 300)
        }
    }

    const handleSelectMode = (mode: QUESTION_MODE) => {
        dispatch(setQuestionMode(mode))
        setTimeout(() => {
            textareaRef.current?.focus()
        }, 300)
    }

    const removeFeature = () => {
        dispatch(setSelectedFeature(AGENT_TYPE.GENERAL))
        dispatch(setSelectedSlideTemplate(null))
    }

    const handleTemplateSelect = (template: SlideTemplate | null) => {
        dispatch(setSelectedSlideTemplate(template))
        setShowTemplateSelector(false)
        dispatch(setSelectedFeature(AGENT_TYPE.SLIDE))

        setTimeout(() => {
            textareaRef.current?.focus()
        }, 300)
    }

    const handleTemplateSelectorClose = () => {
        setShowTemplateSelector(false)
    }

    useEffect(() => {
        if (onFilesChange) {
            onFilesChange(files.length)
        }
    }, [files, onFilesChange])

    useEffect(() => {
        if (requireClearFiles) {
            files.forEach((file) => {
                if (file.preview && !file.googleDriveId)
                    URL.revokeObjectURL(file.preview)
            })
            setFiles([])

            // Reset the flag
            dispatch(setRequireClearFiles(false))
        }
    }, [requireClearFiles, dispatch, files])

    // Clean up object URLs when component unmounts
    useEffect(() => {
        return () => {
            files.forEach((file) => {
                if (file.preview && !file.googleDriveId)
                    URL.revokeObjectURL(file.preview)
            })
        }
    }, [files])

    // Add effect to sync textarea with external value changes
    useEffect(() => {
        if (textareaRef.current && textareaRef.current.value !== value) {
            textareaRef.current.value = value
            setCurrentTextareaValue(value)
        }
    }, [value])

    // Handle auto-focus when shouldFocusInput is triggered
    useEffect(() => {
        if (shouldFocusInput && textareaRef.current) {
            // Small delay to ensure DOM is ready after navigation
            setTimeout(() => {
                if (textareaRef.current?.value) {
                    textareaRef.current.value = ''
                    setCurrentTextareaValue('')
                }
                textareaRef.current?.focus()
                // Reset the focus trigger
                dispatch(setShouldFocusInput(false))
            }, 100)
        }
    }, [shouldFocusInput, dispatch])

    useEffect(() => {
        if (!googleDriveFiles || googleDriveFiles.length === 0) return

        const existingDriveIds = new Set(
            files
                .map((file) => file.googleDriveId)
                .filter((id): id is string => typeof id === 'string')
        )

        const newFiles = googleDriveFiles.filter(
            (file) => !existingDriveIds.has(file.id)
        )

        if (newFiles.length === 0) {
            onGoogleDriveFilesHandled?.()
            return
        }

        const newStatuses: FileUploadStatus[] = newFiles.map((file) => {
            const isImage = isImageFile(file.name)
            const isFolder = file.is_folder ?? false
            return {
                name: file.name,
                loading: false,
                isImage,
                preview: isImage && file.file_url ? file.file_url : undefined,
                googleDriveId: file.id,
                isFolder,
                fileCount: file.file_count
            }
        })

        setFiles((prev) => [...prev, ...newStatuses])

        dispatch(
            addUploadedFiles(
                newFiles.map((file) => {
                    if (file.is_folder && file.file_ids) {
                        return {
                            id: file.id,
                            name: `${file.name} (${file.file_count} files)`,
                            path: '',
                            size: file.size,
                            folderName: file.name,
                            fileCount: file.file_count
                        }
                    }
                    return {
                        id: file.id,
                        name: file.name,
                        path: file.file_url ?? '',
                        size: file.size
                    }
                })
            )
        )
        dispatch(
            addToCurrentMessageFileIds(
                newFiles.flatMap((file) => {
                    if (file.is_folder && file.file_ids) {
                        return file.file_ids.map(String)
                    }
                    return [file.id]
                })
            )
        )

        onGoogleDriveFilesHandled?.()
    }, [dispatch, files, googleDriveFiles, onGoogleDriveFilesHandled])

    return (
        <div
            className={`relative ${className}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <FilesPreview
                files={files}
                isUploading={isUploading}
                onRemove={removeFile}
            />

            {/* Drag and Drop Overlay */}
            {isDragging && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-grey-3/90 dark:bg-black/90 border-2 border-dashed border-sky-blue rounded-xl pointer-events-none">
                    <div className="flex flex-col items-center gap-3 text-center">
                        <Icon
                            name="link"
                            className="size-10 fill-sky-blue animate-pulse"
                        />
                        <p className="text-lg font-medium text-black dark:text-sky-blue">
                            Drop files here to upload
                        </p>
                    </div>
                </div>
            )}

            {/* Slide Template Selector - Modal overlay */}
            <SlideTemplateSelector
                isVisible={showTemplateSelector}
                onTemplateSelect={handleTemplateSelect}
                onClose={handleTemplateSelectorClose}
            />

            <div className="relative">
                <Textarea
                    ref={textareaRef}
                    className={`w-full p-3 md:p-4 !pb-[64px] rounded-xl resize-none overflow-y-auto !placeholder-black/[0.48] dark:!placeholder-white/40 !bg-grey-3 dark:!bg-black border-2 border-grey  ${
                        files.length > 0
                            ? '!pt-[72px] !min-h-[240px]'
                            : 'min-h-[167px]'
                    } max-h-[400px] ${
                        questionMode === QUESTION_MODE.CHAT && files.length > 0
                            ? '!min-h-[200px]'
                            : ''
                    } ${textareaClassName}`}
                    placeholder={
                        placeholder || 'Describe what you want to accomplish...'
                    }
                    defaultValue={value}
                    onChange={(e) => {
                        const newValue = e.target.value
                        setCurrentTextareaValue(newValue)
                    }}
                    onKeyDown={handleKeyDownWithAutoScroll}
                    onPaste={handlePaste}
                />
            </div>
            <div className="absolute bottom-0 left-0 px-3 md:px-4 w-full">
                {!hideSuggestions && questionMode === QUESTION_MODE.AGENT && (
                    <Suggestions
                        hidden={!!currentTextareaValue.trim()}
                        agentType={selectedFeature}
                        onSelect={(item) => {
                            if (textareaRef.current) {
                                textareaRef.current.value = item
                                setCurrentTextareaValue(item)
                                setTimeout(() => {
                                    textareaRef.current?.focus()
                                }, 300)
                            }
                        }}
                    />
                )}
                <div className="flex items-center justify-between !bg-grey-3 dark:!bg-black py-3 md:py-4 mb-[2px]">
                    <div className="flex items-center gap-x-3 justify-between">
                        <QuestionFileUpload
                            onFileChange={handleFileChange}
                            onGoogleDriveClick={onGoogleDriveClick}
                            isGoogleDriveConnected={isGoogleDriveConnected}
                            isGoogleDriveAuthLoading={isGoogleDriveAuthLoading}
                            isDisabled={
                                isUploading || (sessionId ? isLoading : false)
                            }
                        />

                        {questionMode === QUESTION_MODE.AGENT && (
                            <EnhanceButton
                                isGenerating={isGeneratingPrompt}
                                onClick={() => {
                                    if (handleEnhancePrompt)
                                        handleEnhancePrompt({
                                            prompt: currentTextareaValue,
                                            onSuccess: (res) => {
                                                if (textareaRef.current) {
                                                    textareaRef.current.value =
                                                        res
                                                    setCurrentTextareaValue(res)
                                                }
                                            }
                                        })
                                }}
                                disabled={
                                    isGeneratingPrompt ||
                                    !currentTextareaValue.trim() ||
                                    isDisabled ||
                                    isLoading ||
                                    isUploading
                                }
                            />
                        )}

                        <ModeSelector
                            hide={hideModeSelector}
                            selectedMode={questionMode}
                            onSelect={handleSelectMode}
                        />

                        <FeatureSelector
                            hide={hideFeatureSelector}
                            selectedFeature={selectedFeature}
                            selectedTemplateName={
                                selectedSlideTemplate?.slide_template_name
                            }
                            onRemove={removeFeature}
                            onSelect={handleSelectFeature}
                        />

                        {onOpenSetting && (
                            <Button
                                variant="secondary"
                                size="icon"
                                className={`text-xs px-2 w-auto h-7 bg-white dark:bg-sky-blue text-black rounded-full cursor-pointer`}
                                onClick={onOpenSetting}
                            >
                                {
                                    availableModels.find(
                                        (m) => m.id === selectedModel
                                    )?.model
                                }
                                <Icon
                                    name="arrow-down"
                                    className="fill-black"
                                />
                            </Button>
                        )}
                    </div>
                    <SubmitButton
                        isLoading={isLoading}
                        isCreatingSession={isCreatingSession}
                        disabled={
                            !currentTextareaValue.trim() ||
                            isDisabled ||
                            isCreatingSession ||
                            files?.some((file) => file.loading) ||
                            isUploading
                        }
                        onCancel={handleCancel}
                        onSubmit={() => {
                            const currentValue =
                                textareaRef.current?.value || ''
                            if (currentValue.trim()) {
                                handleSubmit(currentValue)
                                if (textareaRef.current) {
                                    textareaRef.current.value = ''
                                    setCurrentTextareaValue('')
                                }
                            }
                        }}
                    />
                </div>
            </div>

            {!hideFeatureSelector &&
                selectedFeature === AGENT_TYPE.GENERAL &&
                questionMode === QUESTION_MODE.AGENT && (
                    <div className="flex items-center justify-center absolute w-full -bottom-20 md:-bottom-14 z-10">
                        <div className="flex items-center gap-3 md:gap-4 md:justify-center flex-wrap md:flex-nowrap">
                            {FEATURES.map((feature) => (
                                <Button
                                    variant="outline"
                                    key={feature.name}
                                    onClick={() =>
                                        handleSelectFeature(feature.type)
                                    }
                                    className="h-7 md:h-8 !px-4 cursor-pointer rounded-full text-xs border-firefly dark:border-sky-blue text-black dark:text-sky-blue"
                                >
                                    <Icon
                                        name={feature.icon}
                                        className="hidden md:block size-4 fill-black dark:fill-sky-blue"
                                    />
                                    {feature.name}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
        </div>
    )
}

export default QuestionInput
