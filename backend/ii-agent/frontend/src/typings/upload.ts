import { AxiosProgressEvent } from 'axios'

export interface UploadFileRequest {
    session_id?: string
    file: {
        path: string
        content: string
    }
}

export interface UploadFileResponse {
    file: {
        path: string
        url?: string
        size?: number
    }
    success: boolean
    message?: string
}

export interface RemoveFileRequest {
    session_id?: string
    file_path: string
}

export interface UploadMultipleFilesRequest {
    session_id?: string
    files: Array<{
        path: string
        content: string
    }>
}

export interface UploadMultipleFilesResponse {
    results: Array<{
        path: string
        success: boolean
        message?: string
    }>
    totalSuccess: number
    totalFailed: number
}

export interface UploadProgressCallback {
    (progressEvent: AxiosProgressEvent): void
}

export interface UploadFromUrlRequest {
    url: string
    session_id?: string
    file_name?: string
}

export interface GetUploadedFilesResponse {
    files: string[]
}

export interface CheckFileExistsRequest {
    path: string
    session_id?: string
}

export interface CheckFileExistsResponse {
    exists: boolean
}

export interface ValidateFileResponse {
    valid: boolean
    message?: string
}

export interface GenerateUploadUrlRequest {
    file_name: string
    content_type: string
    file_size: number
}

export interface GenerateUploadUrlResponse {
    id: string
    upload_url: string
}

export interface UploadCompleteRequest {
    id: string
    file_name: string
    file_size: number
    content_type: string
}

export interface UploadCompleteResponse {
    file_url: string
}