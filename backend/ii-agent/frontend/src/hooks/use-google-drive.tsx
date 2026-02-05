import { useState, useCallback, useEffect } from 'react'
import {
    connectorService,
    type DownloadedFile
} from '@/services/connector.service'
import { toast } from 'sonner'
import { AxiosError } from 'axios'

interface GoogleDrivePickerConfig {
    accessToken: string
    developerKey: string
    appId: string
}

interface ErrorResponse {
    detail?: string
}

const isUnauthorizedError = (error: unknown): boolean => {
    return error instanceof AxiosError && error.response?.status === 401
}

const getErrorDetail = (error: unknown): string => {
    if (error instanceof AxiosError) {
        const detail = (error.response?.data as ErrorResponse)?.detail
        return detail || 'Google Drive authorization needs to be updated. Please reconnect.'
    }
    return 'Google Drive authorization needs to be updated. Please reconnect.'
}

const handleAuthError = (
    error: unknown,
    setIsConnected: (connected: boolean) => void,
    toastId?: string | number
) => {
    if (isUnauthorizedError(error)) {
        setIsConnected(false)
        const detail = getErrorDetail(error)
        toast.error(detail, toastId ? { id: toastId, duration: 5000 } : { duration: 5000 })
        return true
    }
    return false
}

export const useGoogleDrive = () => {
    const [isConnected, setIsConnected] = useState(false)
    const [isAuthLoading, setIsAuthLoading] = useState(false)
    const [isPickerOpen, setIsPickerOpen] = useState(false)
    const [pickerConfig, setPickerConfig] =
        useState<GoogleDrivePickerConfig | null>(null)
    const [downloadedFiles, setDownloadedFiles] = useState<DownloadedFile[]>([])

    const checkConnectionStatus = useCallback(async () => {
        try {
            const status = await connectorService.getGoogleDriveStatus()
            setIsConnected(status.is_connected)
        } catch (error: unknown) {
            console.error('Failed to check Google Drive status:', error)
            handleAuthError(error, setIsConnected)
        }
    }, [])

    useEffect(() => {
        checkConnectionStatus()
    }, [checkConnectionStatus])

    const handleOpenPicker = useCallback(async () => {
        try {
            const config = await connectorService.getGoogleDrivePickerConfig()

            if (!config.is_connected || !config.access_token) {
                throw new Error('Google Drive is not connected')
            }

            if (!config.developer_key || !config.app_id) {
                throw new Error('Google Drive picker is not configured')
            }

            setPickerConfig({
                accessToken: config.access_token,
                developerKey: config.developer_key,
                appId: config.app_id
            })
            setIsPickerOpen(true)
        } catch (error: unknown) {
            console.error('Failed to open Google Drive picker:', error)
            if (!handleAuthError(error, setIsConnected)) {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : 'Failed to open Google Drive picker'
                )
            }
        }
    }, [])

    const handleGoogleDriveAuth = useCallback(async () => {
        setIsAuthLoading(true)
        try {
            const { auth_url } = await connectorService.getGoogleDriveAuthUrl()

            const { code, state } =
                await connectorService.openAuthPopup(auth_url)

            const result = await connectorService.handleGoogleDriveCallback(
                code,
                state
            )

            if (result.success) {
                setIsConnected(true)
                toast.success('Google Drive connected successfully')
                await handleOpenPicker()
            }
        } catch (error) {
            console.error('Google Drive auth failed:', error)
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to connect Google Drive'
            )
        } finally {
            setIsAuthLoading(false)
        }
    }, [handleOpenPicker])

    const handleFilesPicked = async (fileIds: string[]) => {
        const toastId = toast.loading('Downloading files from Google Drive...')
        try {
            const result =
                await connectorService.downloadGoogleDriveFiles(fileIds)

            if (result.success) {
                const files = result.files ?? []
                setDownloadedFiles(files)
                toast.success(
                    `Successfully downloaded ${files.length} file${
                        files.length === 1 ? '' : 's'
                    }`,
                    { id: toastId }
                )
            } else {
                toast.error('Failed to download files', { id: toastId })
            }
        } catch (error: unknown) {
            console.error('Failed to download files:', error)
            if (!handleAuthError(error, setIsConnected, toastId)) {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : 'Failed to download files',
                    { id: toastId }
                )
            }
        }
    }

    const clearDownloadedFiles = useCallback(() => {
        setDownloadedFiles([])
    }, [])

    const handlePickerClose = useCallback(() => {
        setIsPickerOpen(false)
        setPickerConfig(null)
    }, [])

    const handleGoogleDriveClick = useCallback(() => {
        if (isConnected) {
            handleOpenPicker()
        } else {
            handleGoogleDriveAuth()
        }
    }, [handleGoogleDriveAuth, handleOpenPicker, isConnected])

    return {
        isConnected,
        isAuthLoading,
        isPickerOpen,
        pickerConfig,
        handlePickerClose,
        handleGoogleDriveClick,
        handleFilesPicked,
        downloadedFiles,
        clearDownloadedFiles
    }
}
