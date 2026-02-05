import axiosInstance from '@/lib/axios'

export interface ConnectorAuthUrlResponse {
    auth_url: string
    state: string
}

export interface ConnectorStatusResponse {
    is_connected: boolean
    connector_type: string
    metadata?: {
        email?: string
        name?: string
    }
    access_token?: string
}

export interface GoogleDriveCallbackRequest {
    code: string
    state: string
}

export interface GoogleDriveFilePickRequest {
    file_ids: string[]
}

export interface DownloadedFile {
    id: string
    name: string
    size: number
    mime_type: string
    file_url?: string
    is_folder?: boolean
    file_ids?: number[]
    file_count?: number
}

export interface GoogleDriveFilesResponse {
    success: boolean
    files: DownloadedFile[]
}

export interface GoogleDrivePickerConfigResponse {
    is_connected: boolean
    access_token?: string
    developer_key?: string
    app_id?: string
}

class ConnectorService {
    async getGoogleDriveAuthUrl(): Promise<ConnectorAuthUrlResponse> {
        // Pass frontend URL for OAuth callback redirect
        const frontendUrl = window.location.origin
        const response = await axiosInstance.get<ConnectorAuthUrlResponse>(
            '/connectors/google-drive/auth-url',
            {
                params: { frontend_url: frontendUrl }
            }
        )
        return response.data
    }

    async handleGoogleDriveCallback(
        code: string,
        state: string
    ): Promise<{ success: boolean; message: string }> {
        const response = await axiosInstance.post<{
            success: boolean
            message: string
        }>('/connectors/google-drive/callback', {
            code,
            state
        })
        return response.data
    }

    async getGoogleDriveStatus(): Promise<ConnectorStatusResponse> {
        const response = await axiosInstance.get<ConnectorStatusResponse>(
            '/connectors/google-drive/status'
        )
        return response.data
    }

    async getGoogleDrivePickerConfig(): Promise<GoogleDrivePickerConfigResponse> {
        const response =
            await axiosInstance.get<GoogleDrivePickerConfigResponse>(
                '/connectors/google-drive/picker-config'
            )
        return response.data
    }

    async downloadGoogleDriveFiles(
        fileIds: string[]
    ): Promise<GoogleDriveFilesResponse> {
        const response = await axiosInstance.post<GoogleDriveFilesResponse>(
            '/connectors/google-drive/files',
            { file_ids: fileIds }
        )
        return response.data
    }

    async disconnectGoogleDrive(): Promise<{
        success: boolean
        message: string
    }> {
        const response = await axiosInstance.delete<{
            success: boolean
            message: string
        }>('/connectors/google-drive')
        return response.data
    }

    openAuthPopup(authUrl: string): Promise<{ code: string; state: string }> {
        return new Promise((resolve, reject) => {
            // Detect if we're on a mobile device
            const isMobile = /iPhone|iPad|iPod|Android/i.test(
                navigator.userAgent
            )

            if (isMobile) {
                // On mobile, use full-page redirect instead of popup
                // Store the current intent in sessionStorage
                sessionStorage.setItem(
                    'google_drive_auth_pending',
                    JSON.stringify({
                        timestamp: Date.now(),
                        returnUrl: window.location.href
                    })
                )

                // Set up message listener before redirect
                const allowedOrigins = new Set<string>([
                    window.location.origin
                ])
                try {
                    const apiUrl = import.meta.env.VITE_API_URL
                    if (apiUrl) {
                        allowedOrigins.add(new URL(apiUrl).origin)
                    }
                } catch (error) {
                    console.warn(
                        'Invalid API URL provided in VITE_API_URL:',
                        error
                    )
                }

                window.addEventListener('message', function handler(event) {
                    if (!allowedOrigins.has(event.origin)) return

                    const data = event.data
                    if (data && data.type === 'google-drive-auth') {
                        window.removeEventListener('message', handler)
                        sessionStorage.removeItem('google_drive_auth_pending')

                        if (data.error) {
                            const description =
                                typeof data.errorDescription === 'string' &&
                                data.errorDescription.length
                                    ? data.errorDescription
                                    : typeof data.error === 'string'
                                      ? data.error
                                      : 'Authorization failed'
                            reject(new Error(description))
                            return
                        }

                        if (data.code && data.state) {
                            resolve({
                                code: data.code,
                                state: data.state
                            })
                        } else {
                            reject(new Error('Authorization failed'))
                        }
                    }
                })

                // Redirect to auth URL
                window.location.href = authUrl
                return
            }

            // Desktop: use popup window
            const width = 600
            const height = 700
            const left = window.screen.width / 2 - width / 2
            const top = window.screen.height / 2 - height / 2

            const popup = window.open(
                authUrl,
                'Google Drive Authorization',
                `width=${width},height=${height},left=${left},top=${top}`
            )

            if (!popup) {
                reject(new Error('Failed to open popup window'))
                return
            }

            const checkClosed = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkClosed)
                    reject(new Error('Authorization cancelled'))
                }
            }, 1000)

            const allowedOrigins = new Set<string>([window.location.origin])
            try {
                const apiUrl = import.meta.env.VITE_API_URL
                if (apiUrl) {
                    allowedOrigins.add(new URL(apiUrl).origin)
                }
            } catch (error) {
                console.warn('Invalid API URL provided in VITE_API_URL:', error)
            }

            window.addEventListener('message', function handler(event) {
                if (!allowedOrigins.has(event.origin)) return

                const data = event.data
                if (data && data.type === 'google-drive-auth') {
                    clearInterval(checkClosed)
                    window.removeEventListener('message', handler)
                    try {
                        popup.close()
                    } catch (error) {
                        console.warn('Failed to close popup window:', error)
                    }

                    if (data.error) {
                        const description =
                            typeof data.errorDescription === 'string' &&
                            data.errorDescription.length
                                ? data.errorDescription
                                : typeof data.error === 'string'
                                  ? data.error
                                  : 'Authorization failed'
                        reject(new Error(description))
                        return
                    }

                    if (data.code && data.state) {
                        resolve({
                            code: data.code,
                            state: data.state
                        })
                    } else {
                        reject(new Error('Authorization failed'))
                    }
                }
            })
        })
    }
}

export const connectorService = new ConnectorService()
