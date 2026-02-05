// Export store and hooks
export {
    default as store,
    useAppDispatch,
    useAppSelector,
    persistor
} from './store'
export type { RootState, AppDispatch } from './store'

// Export all action creators
export * from './slice/messages'
export * from './slice/ui'
export * from './slice/editor'
export * from './slice/agent'
export * from './slice/files'
export * from './slice/workspace'
export * from './slice/settings'

// Export sessions slice with explicit re-exports to avoid naming conflicts
export {
    fetchSessions,
    setActiveSessionId,
    clearSessions,
    resetPagination,
    sessionsReducer,
    selectSessions,
    selectActiveSessionId,
    selectSessionsLoading,
    selectSessionsError,
    selectSessionsPage,
    selectSessionsHasMore,
    selectSessionsLimit,
    clearError as clearSessionsError
} from './slice/sessions'

// Export favorites slice with explicit re-exports to avoid naming conflicts
export {
    fetchWishlist,
    addToWishlistAsync,
    removeFromWishlistAsync,
    toggleFavoriteAsync,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
    setFavorites,
    selectFavoriteSessionIds,
    selectIsFavorite,
    selectFavoritesLoading,
    selectFavoritesError,
    selectFavoritesInitialized,
    favoritesReducer,
    clearError as clearFavoritesError
} from './slice/favorites'

// Export RTK Query API
export { userApi, useGetCreditBalanceQuery, useGetCreditUsageQuery } from './api/user.api'
export { sessionApi, useGetSessionsQuery, useDeleteSessionMutation } from './api/session.api'
