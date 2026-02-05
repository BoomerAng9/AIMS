import axiosInstance from '@/lib/axios'
import { 
    UploadFileRequest,
    UploadFileResponse,
    RemoveFileRequest,
    UploadMultipleFilesRequest,
    UploadMultipleFilesResponse,
    UploadProgressCallback,
    UploadFromUrlRequest,
    GetUploadedFilesResponse,
    CheckFileExistsRequest,
    CheckFileExistsResponse,
    ValidateFileResponse,
    GenerateUploadUrlRequest,
    GenerateUploadUrlResponse,
    UploadCompleteRequest,
    UploadCompleteResponse
} from '@/typings/upload'

class UploadService {
    async uploadFile(data: UploadFileRequest, onProgress?: UploadProgressCallback): Promise<UploadFileResponse> {
        const response = await axiosInstance.post<UploadFileResponse>('/api/upload', data, {
            onUploadProgress: onProgress
        })
        return response.data
    }

    async uploadMultipleFiles(data: UploadMultipleFilesRequest, onProgress?: UploadProgressCallback): Promise<UploadMultipleFilesResponse> {
        const response = await axiosInstance.post<UploadMultipleFilesResponse>('/api/upload/multiple', data, {
            onUploadProgress: onProgress
        })
        return response.data
    }

    async removeFile(data: RemoveFileRequest): Promise<void> {
        await axiosInstance.post('/api/remove-file', data)
    }

    async uploadFromUrl(data: UploadFromUrlRequest): Promise<UploadFileResponse> {
        const response = await axiosInstance.post<UploadFileResponse>('/api/upload/from-url', data)
        return response.data
    }

    async getUploadedFiles(sessionId: string): Promise<GetUploadedFilesResponse> {
        const response = await axiosInstance.get<GetUploadedFilesResponse>(`/api/upload/files/${sessionId}`)
        return response.data
    }

    async checkFileExists(data: CheckFileExistsRequest): Promise<CheckFileExistsResponse> {
        const response = await axiosInstance.post<CheckFileExistsResponse>('/api/upload/check-exists', data)
        return response.data
    }

    async validateFile(file: File): Promise<ValidateFileResponse> {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await axiosInstance.post<ValidateFileResponse>('/api/upload/validate', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return response.data
    }

    async uploadWithFormData(file: File, sessionId?: string, onProgress?: UploadProgressCallback): Promise<UploadFileResponse> {
        const formData = new FormData()
        formData.append('file', file)
        if (sessionId) {
            formData.append('session_id', sessionId)
        }

        const response = await axiosInstance.post<UploadFileResponse>('/api/upload/form-data', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: onProgress
        })
        return response.data
    }

    async generateUploadUrl(data: GenerateUploadUrlRequest): Promise<GenerateUploadUrlResponse> {
        const response = await axiosInstance.post<GenerateUploadUrlResponse>('/chat/generate-upload-url', data)
        return response.data
    }

    async uploadComplete(data: UploadCompleteRequest): Promise<UploadCompleteResponse> {
        const response = await axiosInstance.post<UploadCompleteResponse>('/chat/upload-complete', data)
        return response.data
    }
}

export const uploadService = new UploadService()