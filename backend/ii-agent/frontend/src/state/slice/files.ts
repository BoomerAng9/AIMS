import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UploadedFile {
    id: string
    name: string
    path: string
    size: number
    folderName?: string
    fileCount?: number
}

interface FilesState {
    isUploading: boolean
    uploadedFiles: UploadedFile[]
    filesContent: { [key: string]: string }
    requireClearFiles: boolean
    currentMessageFileIds: string[] // Files to be sent with the current message
}

const initialState: FilesState = {
    isUploading: false,
    uploadedFiles: [],
    filesContent: {},
    requireClearFiles: false,
    currentMessageFileIds: []
}

const filesSlice = createSlice({
    name: 'files',
    initialState,
    reducers: {
        setIsUploading: (state, action: PayloadAction<boolean>) => {
            state.isUploading = action.payload
        },
        setUploadedFiles: (state, action: PayloadAction<UploadedFile[]>) => {
            state.uploadedFiles = action.payload
        },
        addUploadedFiles: (state, action: PayloadAction<UploadedFile[]>) => {
            state.uploadedFiles.push(...action.payload)
        },
        setFilesContent: (
            state,
            action: PayloadAction<{ [key: string]: string }>
        ) => {
            state.filesContent = action.payload
        },
        addFileContent: (
            state,
            action: PayloadAction<{ path: string; content: string }>
        ) => {
            state.filesContent[action.payload.path] = action.payload.content
        },
        removeUploadedFile: (state, action: PayloadAction<string>) => {
            const fileToRemove = state.uploadedFiles.find(
                (file) => file.name === action.payload
            )

            state.uploadedFiles = state.uploadedFiles.filter(
                (file) => file.name !== action.payload
            )
            delete state.filesContent[action.payload]

            // Also remove from current message file IDs if it exists there
            if (fileToRemove) {
                if (fileToRemove.folderName && fileToRemove.id.includes(',')) {
                    // This is a folder - remove all file IDs that are part of this folder
                    const folderFileIds = fileToRemove.id.split(',')
                    state.currentMessageFileIds =
                        state.currentMessageFileIds.filter(
                            (fileId) => !folderFileIds.includes(fileId)
                        )
                } else {
                    // Regular file - remove single ID
                    state.currentMessageFileIds =
                        state.currentMessageFileIds.filter(
                            (fileId) => fileId !== fileToRemove.id
                        )
                }
            }
        },
        setRequireClearFiles: (state, action: PayloadAction<boolean>) => {
            state.requireClearFiles = action.payload
        },
        setCurrentMessageFileIds: (state, action: PayloadAction<string[]>) => {
            state.currentMessageFileIds = action.payload
        },
        clearCurrentMessageFileIds: (state) => {
            state.currentMessageFileIds = []
        },
        addToCurrentMessageFileIds: (
            state,
            action: PayloadAction<string[]>
        ) => {
            state.currentMessageFileIds.push(...action.payload)
        }
    }
})

export const {
    setIsUploading,
    setUploadedFiles,
    addUploadedFiles,
    setFilesContent,
    addFileContent,
    removeUploadedFile,
    setRequireClearFiles,
    setCurrentMessageFileIds,
    clearCurrentMessageFileIds,
    addToCurrentMessageFileIds
} = filesSlice.actions
export const filesReducer = filesSlice.reducer

// Selectors
export const selectIsUploading = (state: { files: FilesState }) =>
    state.files.isUploading
export const selectUploadedFiles = (state: { files: FilesState }) =>
    state.files.uploadedFiles
export const selectUploadedFilePaths = (state: { files: FilesState }) =>
    state.files.uploadedFiles.map((file) => file.path)
export const selectUploadedFileIds = (state: { files: FilesState }) =>
    state.files.uploadedFiles.map((file) => file.id)
export const selectFilesContent = (state: { files: FilesState }) =>
    state.files.filesContent
export const selectRequireClearFiles = (state: { files: FilesState }) =>
    state.files.requireClearFiles
export const selectCurrentMessageFileIds = (state: { files: FilesState }) =>
    state.files.currentMessageFileIds
