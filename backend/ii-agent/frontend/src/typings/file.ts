export interface FileStructure {
    name: string
    type: 'file' | 'folder'
    children?: FileStructure[]
    language?: string
    content?: string
    path: string
    size?: number
    lastModified?: number
}

export interface FileListResponse {
    files: FileStructure[]
}

export interface FileContentResponse {
    content: string
    path: string
    language?: string
}

export interface FileOperationRequest {
    path: string
    content?: string
}

export interface FileRenameRequest {
    oldPath: string
    newPath: string
}

export interface FileMoveRequest {
    sourcePath: string
    destinationPath: string
}

export interface FileCopyRequest {
    sourcePath: string
    destinationPath: string
}

export interface FileSearchRequest {
    query: string
    path?: string
}