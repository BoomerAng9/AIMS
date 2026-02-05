import axiosInstance from '@/lib/axios'
import {
    ISession,
    PresentationListResponse,
    UpdateSlideRequest,
    UpdateSlideResponse
} from '@/typings/agent'
import {
    SessionsResponse,
    SessionEventsResponse,
    CreateSessionRequest,
    UpdateSessionRequest,
    SessionFile
} from '@/typings/session'

class SessionService {
    async getSessions({
        page = 1,
        limit = 20,
        public_only = false
    }): Promise<ISession[]> {
        const response = await axiosInstance.get<SessionsResponse>(
            `/sessions`,
            {
                params: { page, per_page: limit, public_only }
            }
        )
        return response.data.sessions || []
    }
    async getSession(sessionId: string): Promise<ISession> {
        const response = await axiosInstance.get<ISession>(
            `/sessions/${sessionId}`
        )
        return response.data
    }

    async getPublicSession(sessionId: string): Promise<ISession> {
        const response = await axiosInstance.get<ISession>(
            `/sessions/${sessionId}/public`
        )
        return response.data
    }

    async getSessionEvents(sessionId: string): Promise<SessionEventsResponse> {
        const response = await axiosInstance.get<SessionEventsResponse>(
            `/sessions/${sessionId}/events`
        )
        return response.data
    }

    async getPublicSessionEvents(
        sessionId: string
    ): Promise<SessionEventsResponse> {
        const response = await axiosInstance.get<SessionEventsResponse>(
            `/sessions/${sessionId}/public/events`
        )
        return response.data
    }

    async getSessionFiles(sessionId: string): Promise<SessionFile[]> {
        const response = await axiosInstance.get<SessionFile[]>(
            `/sessions/${sessionId}/files`
        )
        return response.data
    }

    async createSession(data: CreateSessionRequest): Promise<ISession> {
        const response = await axiosInstance.post<ISession>('/sessions', data)
        return response.data
    }

    async deleteSession(sessionId: string): Promise<void> {
        await axiosInstance.delete(`/sessions/${sessionId}`)
    }

    async updateSession(
        sessionId: string,
        data: UpdateSessionRequest
    ): Promise<ISession> {
        const response = await axiosInstance.patch<ISession>(
            `/sessions/${sessionId}`,
            data
        )
        return response.data
    }

    async getSessionSlides(
        sessionId: string
    ): Promise<PresentationListResponse> {
        const response = await axiosInstance.get<PresentationListResponse>(
            `/slides?session_id=${sessionId}`
        )
        return response.data
    }

    async getPublicSessionSlides(
        sessionId: string
    ): Promise<PresentationListResponse> {
        const response = await axiosInstance.get<PresentationListResponse>(
            `/slides/public?session_id=${sessionId}`
        )
        return response.data
    }

    async updateSlide(
        sessionId: string,
        data: UpdateSlideRequest
    ): Promise<UpdateSlideResponse> {
        const response = await axiosInstance.post<UpdateSlideResponse>(
            `/slides?session_id=${sessionId}`,
            data
        )
        return response.data
    }

    async publishSession(sessionId: string): Promise<void> {
        await axiosInstance.post(`/sessions/${sessionId}/publish`)
    }

    async unpublishSession(sessionId: string): Promise<void> {
        await axiosInstance.post(`/sessions/${sessionId}/unpublish`)
    }
}

export const sessionService = new SessionService()
