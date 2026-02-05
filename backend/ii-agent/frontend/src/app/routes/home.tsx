import { useTheme } from 'next-themes'
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type KeyboardEvent as ReactKeyboardEvent
} from 'react'
import { Link, useNavigate } from 'react-router'

import AgentSetting from '@/components/agent-setting'
import ButtonIcon from '@/components/button-icon'
import ModelTag from '@/components/model-tag'
import QuestionInput from '@/components/question-input'
import RightSidebar from '@/components/right-sidebar'
import Sidebar from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from '@/components/ui/tooltip'
import { ENABLE_BETA } from '@/constants/features'
import { useAuth } from '@/contexts/auth-context'
import { useAppEvents } from '@/hooks/use-app-events'
import { useQuestionHandlers } from '@/hooks/use-question-handlers'
import { useSessionManager } from '@/hooks/use-session-manager'
import { useGoogleDrive } from '@/hooks/use-google-drive'
import {
    selectCurrentQuestion,
    setCurrentQuestion,
    useAppDispatch,
    useAppSelector,
    selectQuestionMode
} from '@/state'
import { WebSocketConnectionState } from '@/typings'
import { QUESTION_MODE } from '@/typings/agent'
import UserProfileDropdown from '@/components/user-profile-dropdown'
import PublicHomePage from '@/components/public-home-page'
import { useChat } from '@/hooks/use-chat-query'
import GoogleDrivePicker from '@/components/google-drive-picker'

function HomePageContent() {
    const dispatch = useAppDispatch()
    const { handleEvent } = useAppEvents()
    const { user, isLoading } = useAuth()
    const { theme, setTheme } = useTheme()
    const navigate = useNavigate()
    const [isOpenSetting, setIsOpenSetting] = useState(false)

    const wsConnectionState = useAppSelector(
        (state) => state.agent.wsConnectionState
    )
    const questionMode = useAppSelector(selectQuestionMode)
    const isChatMode = questionMode === QUESTION_MODE.CHAT

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    useSessionManager({
        handleEvent
    })

    const { handleEnhancePrompt, handleQuestionSubmit, handleKeyDown } =
        useQuestionHandlers()

    const { sessionId, sendMessage, isSubmitting, setSessionId } = useChat()
    const [isStartingChat, setIsStartingChat] = useState(false)

    const {
        isConnected: isGoogleDriveConnected,
        isAuthLoading: isGoogleDriveAuthLoading,
        isPickerOpen,
        pickerConfig,
        handlePickerClose,
        handleGoogleDriveClick,
        handleFilesPicked,
        downloadedFiles: downloadedGoogleDriveFiles,
        clearDownloadedFiles
    } = useGoogleDrive()

    const handleChatModeSubmit = useCallback(
        (value: string) => {
            const trimmed = value.trim()
            if (!trimmed) return

            dispatch(setCurrentQuestion(''))
            setIsStartingChat(true)
            setSessionId(null)
            sendMessage(trimmed)
        },
        [dispatch, sendMessage, setSessionId, setIsStartingChat]
    )

    const handleChatKeyDown = useCallback(
        (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                handleChatModeSubmit(event.currentTarget.value)
            }
        },
        [handleChatModeSubmit]
    )

    const isInputDisabled = useMemo(() => {
        if (isChatMode) {
            return isSubmitting
        }
        return wsConnectionState !== WebSocketConnectionState.CONNECTED
    }, [isChatMode, isSubmitting, wsConnectionState])

    const currentQuestion = useAppSelector(selectCurrentQuestion)

    useEffect(() => {
        if (!isStartingChat || !sessionId) return

        navigate(`/chat?id=${sessionId}`)
        setIsStartingChat(false)
    }, [isStartingChat, navigate, sessionId])

    useEffect(() => {
        if (!isStartingChat) return
        if (isSubmitting) return
        if (sessionId) return

        setIsStartingChat(false)
    }, [isStartingChat, isSubmitting, sessionId])

    if (isLoading) return null

    if (!user) return <PublicHomePage />

    return (
        <>
            <div className="flex h-screen">
                <div>
                    <SidebarProvider>
                        <div className="absolute w-full top-1 left-0 md:hidden p-3 flex justify-between">
                            <div className="flex items-center gap-x-3">
                                <SidebarTrigger className="size-6 p-0" />
                                <div className="relative flex items-center gap-x-[6px]">
                                    <img
                                        src="/images/logo-only.png"
                                        className="size-6 hidden dark:inline"
                                        alt="Logo"
                                    />
                                    <img
                                        src="/images/logo-charcoal.svg"
                                        className="size-6 inline dark:hidden"
                                        alt="Logo"
                                    />
                                    <span className="text-black dark:text-white text-sm font-semibold">
                                        ACHEEVY
                                    </span>
                                    {ENABLE_BETA && (
                                        <span className="text-[10px] absolute -right-8 -top-1">
                                            BETA
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-x-4">
                                <Button
                                    className="!p-0 size-6"
                                    onClick={toggleTheme}
                                >
                                    <Icon
                                        name={theme === 'dark' ? 'sun' : 'moon'}
                                        className="size-6 stroke-black dark:stroke-white"
                                    />
                                </Button>
                                <Link to="/settings/usage">
                                    <Icon
                                        name="coin"
                                        className="size-6 fill-firefly dark:fill-white"
                                    />
                                </Link>
                                <UserProfileDropdown avatarClassName="size-8" />
                            </div>
                        </div>
                        <Sidebar />
                    </SidebarProvider>
                </div>
                <div className="flex-1 py-12 px-3 md:px-[126px] pt-[110px] md:pt-0 flex md:items-center justify-center">
                    <div className="w-full max-w-[768px]">
                        <p className="text-[25px] md:text-[32px] font-semibold dark:text-sky-blue">
                            Hello
                            {user?.first_name ? `, ${user?.first_name}` : ''}!
                        </p>
                        <p className="text-[20px] md:text-2xl dark:text-sky-blue">
                            What can I do for you today?
                        </p>
                        <div className="flex gap-x-2 mt-6 mb-2">
                            <ModelTag />
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <ButtonIcon
                                        name="setting"
                                        onClick={() => setIsOpenSetting(true)}
                                    />
                                </TooltipTrigger>
                                <TooltipContent>Agent Settings</TooltipContent>
                            </Tooltip>
                        </div>
                        <QuestionInput
                            value={currentQuestion}
                            setValue={(val) => {
                                dispatch(setCurrentQuestion(val))
                            }}
                            handleKeyDown={
                                isChatMode ? handleChatKeyDown : handleKeyDown
                            }
                            handleSubmit={(val: string) => {
                                if (isChatMode) {
                                    handleChatModeSubmit(val)
                                } else {
                                    handleQuestionSubmit(val, true)
                                }
                            }}
                            isDisabled={isInputDisabled}
                            handleEnhancePrompt={handleEnhancePrompt}
                            onGoogleDriveClick={handleGoogleDriveClick}
                            isGoogleDriveConnected={isGoogleDriveConnected}
                            isGoogleDriveAuthLoading={isGoogleDriveAuthLoading}
                            googleDriveFiles={downloadedGoogleDriveFiles}
                            onGoogleDriveFilesHandled={clearDownloadedFiles}
                        />
                    </div>
                </div>
                <RightSidebar />
            </div>
            <AgentSetting
                isOpen={isOpenSetting}
                onOpenChange={setIsOpenSetting}
            />
            <GoogleDrivePicker
                isOpen={isPickerOpen}
                onClose={handlePickerClose}
                onFilesPicked={handleFilesPicked}
                config={pickerConfig}
            />
        </>
    )
}

export function HomePage() {
    return <HomePageContent />
}

export const Component = HomePage
