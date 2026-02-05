import { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import dayjs from 'dayjs'
import { Link, useNavigate } from 'react-router'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
dayjs.extend(isSameOrAfter)

import { Icon } from './ui/icon'
import { Input } from './ui/input'
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTrigger
} from './ui/sheet'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import {
    setCompleted,
    setMessages,
    selectSessions,
    selectSessionsLoading,
    selectSessionsHasMore,
    selectSessionsPage,
    selectSessionsLimit,
    fetchSessions,
    resetPagination,
    useAppDispatch,
    useAppSelector,
    setBuildStep,
    setActiveTab,
    setStopped,
    setAgentInitialized,
    setShouldFocusInput,
    setRequireClearFiles,
    setIsMobileChatVisible
} from '@/state'
import { BUILD_STEP, TAB } from '@/typings/agent'

interface SearchHistoryProps {
    className?: string
    isMobile?: boolean
}

const SearchHistory = ({ className, isMobile }: SearchHistoryProps) => {
    const [open, setOpen] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const sessions = useAppSelector(selectSessions)
    const isLoading = useAppSelector(selectSessionsLoading)
    const hasMore = useAppSelector(selectSessionsHasMore)
    const currentPage = useAppSelector(selectSessionsPage)
    const limit = useAppSelector(selectSessionsLimit)

    const [searchTerm, setSearchTerm] = useState('')

    const groupedSessions = useMemo(() => {
        const now = dayjs()
        const startOfToday = now.startOf('day')
        const startOfYesterday = startOfToday.subtract(1, 'day')
        const start7DaysAgo = startOfToday.subtract(7, 'days')

        const filteredSessions = [...sessions].filter((session) => {
            return (
                session.name &&
                session.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
        })

        const todaySessions = filteredSessions.filter((session) => {
            return dayjs(session.created_at).isSame(startOfToday, 'day')
        })

        const yesterdaySessions = filteredSessions.filter((session) => {
            return dayjs(session.created_at).isSame(startOfYesterday, 'day')
        })

        const last7DaysSessions = filteredSessions.filter((session) => {
            const sessionDate = dayjs(session.created_at)
            return (
                sessionDate.isBefore(startOfYesterday) &&
                sessionDate.isSameOrAfter(start7DaysAgo)
            )
        })

        const last30DaysSessions = filteredSessions.filter((session) => {
            const sessionDate = dayjs(session.created_at)
            return sessionDate.isBefore(start7DaysAgo)
        })

        return {
            today: todaySessions,
            yesterday: yesterdaySessions,
            last_7_days: last7DaysSessions,
            last_30_days: last30DaysSessions
        }
    }, [sessions, searchTerm])

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
        setOpen(false)
        navigate('/')
    }

    // Initialize sessions when sheet opens
    useEffect(() => {
        if (open) {
            dispatch(resetPagination())
            dispatch(fetchSessions({ page: 1, limit }))
        }
    }, [open, dispatch, limit])

    // Handle infinite scroll
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
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className={className}>
                {isMobile ? (
                    <Icon
                        name="search-status"
                        className="size-6 fill-black dark:fill-white"
                    />
                ) : (
                    <div className="flex items-center gap-x-2 px-4 cursor-pointer">
                        <Icon
                            name="search-status"
                            className="fill-black dark:fill-white"
                        />
                        Search Chat
                    </div>
                )}
            </SheetTrigger>
            <SheetContent
                side="left"
                className="p-3 md:px-6 md:pt-12 w-full !max-w-[560px]"
            >
                <SheetHeader className="p-0 gap-6 md:pb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-x-3">
                            <SheetClose className="md:hidden cursor-pointer">
                                <Icon
                                    name="close"
                                    className="fill-grey-2 dark:fill-grey"
                                />
                            </SheetClose>
                            <p className="text-2xl font-semibold">Search</p>
                        </div>
                        <div className="hidden md:flex items-center gap-x-4">
                            <SheetClose className="cursor-pointer">
                                <Icon
                                    name="close"
                                    className="fill-grey-2 dark:fill-grey"
                                />
                            </SheetClose>
                        </div>
                    </div>
                    <div className="relative">
                        <Icon
                            name="search"
                            className="absolute left-4 top-3 size-6 fill-black dark:fill-white"
                        />
                        <Input
                            placeholder="Search chats ..."
                            value={searchTerm}
                            className="pl-[56px]"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button
                        className="bg-firefly dark:bg-sky-blue w-full h-12 font-semibold !text-sky-blue dark:!text-black rounded-xl"
                        onClick={handleNewChat}
                    >
                        <Icon
                            name="edit"
                            className="fill-sky-blue dark:fill-black size-6"
                        />
                        New Chat
                    </Button>
                </SheetHeader>
                <div
                    ref={scrollContainerRef}
                    className="space-y-6 dark:text-white overflow-auto pb-12"
                >
                    {Object.entries(groupedSessions)
                        ?.filter(([key, value]) => {
                            return key && value.length > 0
                        })
                        .map(([key, value]) => (
                            <div key={key}>
                                <p className="text-lg font-semibold">
                                    {key === 'today'
                                        ? 'Today'
                                        : key === 'yesterday'
                                          ? 'Yesterday'
                                          : key === 'last_7_days'
                                            ? 'Last 7 days'
                                            : 'Last 30 days'}
                                </p>
                                <div className="space-y-3 mt-3">
                                    {value.map((session) => (
                                        <Link
                                            key={session.id}
                                            to={
                                                session.agent_type === 'chat'
                                                    ? `/chat?id=${session.id}`
                                                    : `/${session.id}`
                                            }
                                            onClick={() => {
                                                dispatch(setMessages([]))
                                                dispatch(setCompleted(false))
                                            }}
                                            className={cn(
                                                'flex text-sm md:text-base items-center gap-x-2 line-clamp-1 hover:dark:text-sky-blue'
                                            )}
                                        >
                                            {session.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    {loadingMore && (
                        <div className="text-center py-2 text-gray-500">
                            Loading more...
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default SearchHistory
