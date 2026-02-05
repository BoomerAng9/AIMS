import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type {
    BaseQueryFn,
    FetchArgs,
    FetchBaseQueryError
} from '@reduxjs/toolkit/query'
import type { ISession } from '@/typings/agent'
import { ACCESS_TOKEN } from '@/constants/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const baseQuery = fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers) => {
        const token = localStorage.getItem(ACCESS_TOKEN)
        if (token) {
            headers.set('Authorization', `Bearer ${token}`)
        }
        headers.set('Content-Type', 'application/json')
        return headers
    }
})

const baseQueryWithReauth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    const result = await baseQuery(args, api, extraOptions)
    if (result.error && result.error.status === 401) {
        localStorage.removeItem(ACCESS_TOKEN)
        // Don't redirect to login if we're on a share route
        if (!window.location.pathname.startsWith('/share/')) {
            window.location.href = '/login'
        }
    }
    return result
}

export const sessionApi = createApi({
    reducerPath: 'sessionApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Sessions'],
    endpoints: (builder) => ({
        getSessions: builder.query<
            ISession[],
            { page?: number; limit?: number; public_only?: boolean }
        >({
            query: ({ page = 1, limit = 20, public_only = false }) => ({
                url: '/sessions',
                params: { page, per_page: limit, public_only }
            }),
            transformResponse: (response: { sessions: ISession[] }) =>
                response.sessions || [],
            providesTags: (result) =>
                result
                    ? [
                          ...result.map(({ id }) => ({
                              type: 'Sessions' as const,
                              id
                          })),
                          { type: 'Sessions', id: 'LIST' }
                      ]
                    : [{ type: 'Sessions', id: 'LIST' }]
        }),
        deleteSession: builder.mutation<void, string>({
            query: (sessionId) => ({
                url: `/sessions/${sessionId}`,
                method: 'DELETE'
            }),
            invalidatesTags: (_result, _error, sessionId) => [
                { type: 'Sessions', id: sessionId },
                { type: 'Sessions', id: 'LIST' }
            ]
        })
    })
})

export const { useGetSessionsQuery, useDeleteSessionMutation } = sessionApi
