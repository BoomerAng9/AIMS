import { ISession, IEvent } from './agent'

export interface SessionsResponse {
    sessions: ISession[]
}

export interface SessionEventsResponse {
    events: IEvent[]
}

export interface CreateSessionRequest {
    deviceId: string
    name?: string
}

export interface UpdateSessionRequest {
    name?: string
    status?: string
}

export interface SessionFile {
    id: string
    name: string
    content_type?: string
    url: string
    size: number
}

export interface SessionFilesResponse {
    files: SessionFile[]
}
