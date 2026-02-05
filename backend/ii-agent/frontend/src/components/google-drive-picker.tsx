import { useCallback, useEffect } from 'react'

declare global {
    interface Window {
        gapi?: {
            load: (
                api: string,
                options: {
                    callback: () => void
                    onerror?: () => void
                    timeout?: number
                    ontimeout?: () => void
                }
            ) => void
        }
        google?: {
            picker?: GooglePickerApi
        }
    }
}

interface GoogleDocsView {
    setIncludeFolders: (include: boolean) => GoogleDocsView
    setSelectFolderEnabled: (enabled: boolean) => GoogleDocsView
    setEnableDrives: (enabled: boolean) => GoogleDocsView
}

interface GooglePickerBuilder {
    addView: (view: GoogleDocsView) => GooglePickerBuilder
    setOAuthToken: (token: string) => GooglePickerBuilder
    setDeveloperKey: (key: string) => GooglePickerBuilder
    setAppId: (appId: string) => GooglePickerBuilder
    setCallback: (
        callback: (data: GooglePickerCallbackData) => void
    ) => GooglePickerBuilder
    enableFeature: (feature: string) => GooglePickerBuilder
    build: () => GooglePickerInstance
}

interface GooglePickerApi {
    Action: {
        PICKED: string
        CANCEL: string
    }
    Response: {
        DOCUMENTS: string
    }
    Document: {
        ID: string
    }
    Feature: {
        MULTISELECT_ENABLED: string
        SUPPORT_DRIVES: string
    }
    DocsView: new () => GoogleDocsView
    PickerBuilder: new () => GooglePickerBuilder
}

interface GoogleDrivePickerConfig {
    accessToken: string
    developerKey: string
    appId: string
}

interface GoogleDrivePickerProps {
    isOpen: boolean
    onClose: () => void
    onFilesPicked: (fileIds: string[]) => void
    config: GoogleDrivePickerConfig | null
}

interface GooglePickerCallbackData {
    action: string
    [key: string]: unknown
}

interface GooglePickerInstance {
    setVisible: (visible: boolean) => void
    dispose?: () => void
}

const PICKER_SDK_URL = 'https://apis.google.com/js/api.js'

let pickerApiPromise: Promise<GooglePickerApi> | null = null

const loadPickerSdk = () => {
    if (window.google?.picker) {
        return Promise.resolve(window.google.picker)
    }

    if (pickerApiPromise) {
        return pickerApiPromise
    }

    pickerApiPromise = new Promise((resolve, reject) => {
        const loadPickerModule = () => {
            if (!window.gapi) {
                reject(new Error('Google API client failed to load'))
                return
            }

            window.gapi.load('picker', {
                callback: () => {
                    if (window.google?.picker) {
                        resolve(window.google.picker)
                    } else {
                        reject(
                            new Error(
                                'Google Picker is unavailable after loading'
                            )
                        )
                    }
                },
                onerror: () =>
                    reject(new Error('Failed to load the Google Picker API')),
                timeout: 5000,
                ontimeout: () =>
                    reject(new Error('Loading the Google Picker API timed out'))
            })
        }

        if (window.gapi) {
            loadPickerModule()
            return
        }

        const existingScript = document.querySelector<HTMLScriptElement>(
            `script[src="${PICKER_SDK_URL}"]`
        )

        if (existingScript) {
            existingScript.addEventListener('load', loadPickerModule, {
                once: true
            })
            existingScript.addEventListener(
                'error',
                () => reject(new Error('Failed to load the Google API script')),
                {
                    once: true
                }
            )
            return
        }

        const script = document.createElement('script')
        script.src = PICKER_SDK_URL
        script.async = true
        script.onload = loadPickerModule
        script.onerror = () =>
            reject(new Error('Failed to load the Google API script'))
        document.body.appendChild(script)
    })

    return pickerApiPromise.catch((error) => {
        pickerApiPromise = null
        throw error
    })
}

const GoogleDrivePicker = ({
    isOpen,
    onClose,
    onFilesPicked,
    config
}: GoogleDrivePickerProps) => {
    const pickerCallback = useCallback(
        (data: GooglePickerCallbackData) => {
            if (!window.google?.picker || !data) return

            const { Action, Response, Document } = window.google.picker

            if (data.action === Action.PICKED) {
                const documents = (data[Response.DOCUMENTS] || []) as Record<
                    string,
                    unknown
                >[]
                const fileIds = documents
                    .map((doc) => {
                        return doc[Document.ID] as string
                    })
                    .filter(Boolean) as string[]

                if (fileIds.length) {
                    onFilesPicked(fileIds)
                }

                onClose()
            }

            if (data.action === Action.CANCEL) {
                onClose()
            }
        },
        [onClose, onFilesPicked]
    )

    useEffect(() => {
        if (!isOpen) return

        if (!config) {
            console.error('Missing Google Drive picker configuration')
            onClose()
            return
        }

        const { accessToken, developerKey, appId } = config

        if (!accessToken || !developerKey || !appId) {
            console.error('Incomplete Google Drive picker configuration')
            onClose()
            return
        }

        let pickerInstance: GooglePickerInstance | null = null
        let isCancelled = false

        const openPicker = async () => {
            try {
                await loadPickerSdk()
                if (isCancelled) return

                if (!window.google?.picker) {
                    throw new Error('Google Picker API failed to initialize')
                }

                // Create and render a Picker object
                const myDriveView = new window.google.picker.DocsView()
                    .setIncludeFolders(true)
                    .setSelectFolderEnabled(true)

                const sharedDriveView = new window.google.picker.DocsView()
                    .setIncludeFolders(true)
                    .setSelectFolderEnabled(true)
                    .setEnableDrives(true)

                const picker = new window.google.picker.PickerBuilder()
                    .addView(myDriveView)
                    .addView(sharedDriveView)
                    .setOAuthToken(accessToken)
                    .setDeveloperKey(developerKey)
                    .setAppId(appId)
                    .setCallback(pickerCallback)
                    .enableFeature(
                        window.google.picker.Feature.MULTISELECT_ENABLED
                    )
                    .enableFeature(window.google.picker.Feature.SUPPORT_DRIVES)
                    .build()

                pickerInstance = picker
                picker.setVisible(true)
            } catch (error) {
                console.error('Failed to open Google Drive picker', error)
                onClose()
            }
        }

        openPicker()

        return () => {
            isCancelled = true
            if (pickerInstance) {
                pickerInstance.setVisible(false)
                if (typeof pickerInstance.dispose === 'function') {
                    pickerInstance.dispose()
                }
            }
        }
    }, [config, isOpen, onClose, pickerCallback])

    return null
}

export default GoogleDrivePicker
