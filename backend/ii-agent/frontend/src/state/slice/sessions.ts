import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { ISession } from '@/typings/agent'
import store from '../store'
import { sessionApi } from '../api/session.api'

interface SessionsState {
    sessions: ISession[]
    activeSessionId: string | null
    isLoading: boolean
    error: string | null
    page: number
    hasMore: boolean
    limit: number
}

const initialState: SessionsState = {
    sessions: [],
    activeSessionId: null,
    isLoading: false,
    error: null,
    page: 1,
    hasMore: true,
    limit: 20
}

export const fetchSessions = createAsyncThunk(
    'sessions/fetchSessions',
    async ({
        page = 1,
        limit = 20
    }: { page?: number; limit?: number } = {}) => {
        // Use RTK Query to fetch sessions
        const result = await store.dispatch(
            sessionApi.endpoints.getSessions.initiate({ page, limit })
        )
        return result.data || []
    }
)

export const deleteSession = createAsyncThunk(
    'sessions/deleteSession',
    async (sessionId: string) => {
        // Use RTK Query mutation to delete session
        await store.dispatch(
            sessionApi.endpoints.deleteSession.initiate(sessionId)
        ).unwrap()
        return sessionId
    }
)

const sessionsSlice = createSlice({
    name: 'sessions',
    initialState,
    reducers: {
        setActiveSessionId: (state, action: PayloadAction<string | null>) => {
            state.activeSessionId = action.payload
        },
        clearSessions: (state) => {
            state.sessions = []
            state.activeSessionId = null
            state.error = null
            state.page = 1
            state.hasMore = true
        },
        clearError: (state) => {
            state.error = null
        },
        resetPagination: (state) => {
            state.page = 1
            state.hasMore = true
            state.sessions = []
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSessions.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(fetchSessions.fulfilled, (state, action) => {
                state.isLoading = false
                const newSessions = action.payload

                // For first page, replace sessions
                if (action.meta.arg?.page === 1) {
                    state.sessions = newSessions
                } else {
                    // For subsequent pages, append sessions
                    state.sessions = [...state.sessions, ...newSessions]
                }

                // Update pagination state
                state.page = action.meta.arg?.page || 1
                state.hasMore =
                    newSessions.length === (action.meta.arg?.limit || 20)
            })
            .addCase(fetchSessions.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Failed to fetch sessions'
            })
            .addCase(deleteSession.pending, (state) => {
                state.error = null
            })
            .addCase(deleteSession.fulfilled, (state, action) => {
                // Remove the deleted session from the list
                state.sessions = state.sessions.filter(
                    (session) => session.id !== action.payload
                )
                // Clear active session if it was deleted
                if (state.activeSessionId === action.payload) {
                    state.activeSessionId = null
                }
            })
            .addCase(deleteSession.rejected, (state, action) => {
                state.error = action.error.message || 'Failed to delete session'
            })
    }
})

export const {
    setActiveSessionId,
    clearSessions,
    clearError,
    resetPagination
} = sessionsSlice.actions
export const sessionsReducer = sessionsSlice.reducer

export const selectSessions = (state: { sessions: SessionsState }) =>
    state.sessions.sessions
export const selectActiveSessionId = (state: { sessions: SessionsState }) =>
    state.sessions.activeSessionId
export const selectSessionsLoading = (state: { sessions: SessionsState }) =>
    state.sessions.isLoading
export const selectSessionsError = (state: { sessions: SessionsState }) =>
    state.sessions.error
export const selectSessionsPage = (state: { sessions: SessionsState }) =>
    state.sessions.page
export const selectSessionsHasMore = (state: { sessions: SessionsState }) =>
    state.sessions.hasMore
export const selectSessionsLimit = (state: { sessions: SessionsState }) =>
    state.sessions.limit
