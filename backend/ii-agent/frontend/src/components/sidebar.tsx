'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import {
    Link,
    useLocation,
    useNavigate,
    useParams,
    useSearchParams
} from 'react-router'
import isEmpty from 'lodash/isEmpty'

import { Button } from '@/components/ui/button'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from './ui/collapsible'
import { Icon } from './ui/icon'
import {
    Sidebar as SidebarContainer,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    useSidebar
} from './ui/sidebar'
import {
    setCompleted,
    setMessages,
    fetchSessions,
    setActiveSessionId,
    selectSessions,
    selectActiveSessionId,
    selectSessionsLoading,
    selectSessionsHasMore,
    selectSessionsPage,
    selectSessionsLimit,
    resetPagination,
    useAppDispatch,
    useAppSelector,
    setBuildStep,
    setCurrentActionData,
    setAgentInitialized,
    setShouldFocusInput,
    setStopped,
    setRequireClearFiles,
    setActiveTab,
    setIsMobileChatVisible
} from '@/state'
import SearchHistory from './search-history'
import SessionItem from './session-item'
import { BUILD_STEP, TAB } from '@/typings/agent'
import Credit from './credit'
import { useGetCreditBalanceQuery } from '@/state'
import { Skeleton } from './ui/skeleton'
import { ENABLE_BETA } from '@/constants/features'

interface SidebarButtonProps {
    className?: string
    workspaceInfo?: string
}

const Sidebar = ({ className, workspaceInfo }: SidebarButtonProps) => {
    const navigate = useNavigate()
    const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(true)

    const dispatch = useAppDispatch()
    const { isMobile, toggleSidebar } = useSidebar()
    const sessions = useAppSelector(selectSessions)
    const activeSessionId = useAppSelector(selectActiveSessionId)
    const isLoading = useAppSelector(selectSessionsLoading)
    const hasMore = useAppSelector(selectSessionsHasMore)
    const currentPage = useAppSelector(selectSessionsPage)
    const limit = useAppSelector(selectSessionsLimit)
    const [searchParams] = useSearchParams()
    const location = useLocation()
    const { sessionId: sessionIdFromParams } = useParams()

    // Use RTK Query hook to fetch credit balance
    useGetCreditBalanceQuery()

    // Get session ID from either URL params or query parameter
    const sessionId = sessionIdFromParams || searchParams.get('id') || ''
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [loadingMore, setLoadingMore] = useState(false)

    const handleNewChat = () => {
        dispatch(setMessages([]))
        dispatch(setCompleted(false))
        dispatch(setActiveTab(TAB.BUILD))
        dispatch(setIsMobileChatVisible(true))
        dispatch(setBuildStep(BUILD_STEP.THINKING))
        dispatch(setStopped(false))
        dispatch(setAgentInitialized(false))
        dispatch(setShouldFocusInput(true))
        dispatch(setRequireClearFiles(true))
        navigate('/')
        if (isMobile) {
            toggleSidebar()
        }
    }

    const handleResetState = () => {
        dispatch(setMessages([]))
        dispatch(setCompleted(false))
        dispatch(setBuildStep(BUILD_STEP.THINKING))
        dispatch(setStopped(false))
        dispatch(setAgentInitialized(false))
        dispatch(setCurrentActionData(undefined))
        if (isMobile) {
            toggleSidebar()
        }
    }

    // Get the current session ID from URL parameters
    useEffect(() => {
        if (sessionId) {
            dispatch(setActiveSessionId(sessionId))
        }
    }, [sessionId, dispatch])

    const header = (
        <div className="flex items-center justify-center gap-4">
            <div className="flex w-full md:hidden items-center justify-between">
                <div className="flex gap-x-3 items-center">
                    <Button className="!p-0" onClick={toggleSidebar}>
                        <Icon
                            name="arrow-circle-left"
                            className="size-6 fill-black dark:fill-white"
                        />
                    </Button>

                    <div className="relative flex items-center gap-2">
                        <img
                            src="/images/logo-only.png"
                            alt="Logo"
                            className="size-8 md:size-10 rounded-sm hidden dark:inline"
                        />
                        <img
                            src="/images/logo-charcoal.svg"
                            alt="Logo"
                            className="size-8 md:size-10 rounded-sm dark:hidden"
                        />
                        <span
                            className={`text-black dark:text-white text-lg font-semibold`}
                        >
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
                    {location.pathname !== '/' && (
                        <Link to="/">
                            <Icon
                                name="home"
                                className="size-6 fill-black dark:fill-white"
                            />
                        </Link>
                    )}
                    <Link to="/dashboard">
                        <Icon
                            name="dashboard"
                            className="size-6 fill-black dark:fill-white"
                        />
                    </Link>
                    <SearchHistory isMobile />
                </div>
            </div>
            <div className="hidden relative md:flex items-center gap-3">
                <img
                    src="/images/logo-only.png"
                    alt="Logo"
                    width={40}
                    height={40}
                    className="rounded-sm hidden dark:inline"
                />
                <img
                    src="/images/logo-charcoal.svg"
                    alt="Logo"
                    width={40}
                    height={40}
                    className="rounded-sm dark:hidden"
                />
                <span
                    className={`text-black dark:text-white text-2xl font-semibold`}
                >
                    ACHEEVY
                </span>
                {ENABLE_BETA && (
                    <span className="text-[10px] absolute -right-8 -top-1">
                        BETA
                    </span>
                )}
            </div>
        </div>
    )

    useEffect(() => {
        dispatch(resetPagination())
        dispatch(fetchSessions({ page: 1, limit }))
    }, [dispatch, limit])

    const handleScroll = useCallback(() => {
        if (
            !scrollContainerRef.current ||
            loadingMore ||
            !hasMore ||
            isLoading
        ) {
            return
        }

        const { scrollTop, scrollHeight, clientHeight } =
            scrollContainerRef.current

        // Load more when user scrolls to within 100px of the bottom
        if (scrollHeight - scrollTop - clientHeight < 100) {
            setLoadingMore(true)
            dispatch(fetchSessions({ page: currentPage + 1, limit })).finally(
                () => setLoadingMore(false)
            )
        }
    }, [dispatch, currentPage, limit, hasMore, isLoading, loadingMore])

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current
        if (!scrollContainer) return

        scrollContainer.addEventListener('scroll', handleScroll)
        return () => scrollContainer.removeEventListener('scroll', handleScroll)
    }, [handleScroll])

    return (
        <SidebarContainer
            className={`bg-[#f8fafb]/30 dark:!bg-charcoal !border-grey-2/30 dark:!border-grey/30 ${className}`}
        >
            <SidebarHeader>{header}</SidebarHeader>
            <SidebarContent ref={scrollContainerRef}>
                <SidebarMenu>
                    <div className="px-3 md:px-6 pb-6">
                        <Button
                            className="bg-firefly dark:bg-sky-blue w-full !text-sky-blue dark:!text-black"
                            size="xl"
                            onClick={handleNewChat}
                        >
                            <Icon
                                name="edit"
                                className="fill-sky-blue dark:fill-black"
                            />{' '}
                            New chat
                        </Button>
                        <SearchHistory className="mt-4 hidden md:block" />
                        <SidebarMenuItem className="hidden md:block mt-4">
                            <Link
                                to="/dashboard"
                                className="flex items-center gap-x-2 px-4"
                            >
                                <Icon
                                    name="dashboard"
                                    className="fill-black dark:fill-white"
                                />
                                Dashboard
                            </Link>
                        </SidebarMenuItem>

                        <div className="mt-4 md:mt-8 space-y-8">
                            {/* <Button
                                variant="outline"
                                className="w-full justify-start !h-9 !text-[14px] !px-4 rounded-xl"
                            >
                                <Icon
                                    name="folder-add"
                                    className="size-5 fill-black dark:fill-white"
                                />{' '}
                                New Project
                            </Button> */}
                            <Collapsible
                                open={isCollapsibleOpen}
                                onOpenChange={setIsCollapsibleOpen}
                            >
                                <CollapsibleTrigger className="w-full">
                                    <div className="w-full justify-start !h-9 !text-[14px] !px-4 rounded-xl cursor-pointer border border-black dark:border-white flex items-center">
                                        <div className="flex items-center gap-x-2 flex-1">
                                            <Icon
                                                name="message-minus"
                                                className="size-5 fill-black dark:fill-white"
                                            />{' '}
                                            Single Chat
                                        </div>
                                        <Icon
                                            name="arrow-down"
                                            className={`size-5 fill-black dark:fill-white transition-transform duration-200 ${
                                                isCollapsibleOpen
                                                    ? 'rotate-180'
                                                    : ''
                                            }`}
                                        />
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-3">
                                    <div className="space-y-[6px] md:pl-4 text-[14px]">
                                        {isLoading && isEmpty(sessions) && (
                                            <div className="px-2 space-y-4">
                                                <Skeleton className="h-4 w-full !bg-black/10 dark:!bg-white/10" />
                                                <Skeleton className="h-4 w-full !bg-black/10 dark:!bg-white/10" />
                                                <Skeleton className="h-4 w-full !bg-black/10 dark:!bg-white/10" />
                                            </div>
                                        )}
                                        {sessions
                                            ?.filter((session) => session.name)
                                            ?.map((session) => (
                                                <SessionItem
                                                    key={session.id}
                                                    session={session}
                                                    isActive={
                                                        activeSessionId ===
                                                            session.id ||
                                                        (workspaceInfo?.includes(
                                                            session.id
                                                        ) ??
                                                            false)
                                                    }
                                                    onClick={handleResetState}
                                                />
                                            ))}
                                        {loadingMore && (
                                            <div className="text-center py-2 text-gray-500">
                                                Loading more...
                                            </div>
                                        )}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        </div>
                    </div>
                </SidebarMenu>
            </SidebarContent>
            <Credit />
        </SidebarContainer>
    )
}

export default Sidebar
