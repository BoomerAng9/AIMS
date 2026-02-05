import { useCallback } from 'react'
import { toast } from 'sonner'

import { isImageFile } from '@/lib/utils'
import { uploadService } from '@/services/upload.service'
import {
    addUploadedFiles,
    removeUploadedFile,
    addToCurrentMessageFileIds
} from '@/state/slice/files'
import { selectWorkspaceInfo } from '@/state/slice/workspace'
import { useAppDispatch, useAppSelector } from '@/state/store'

export interface FileUploadStatus {
    name: string
    loading: boolean
    error?: string
    preview?: string
    isImage: boolean
    googleDriveId?: string
    isFolder?: boolean
    fileCount?: number
}

export function useUploadFiles() {
    const dispatch = useAppDispatch()
    const workspaceInfo = useAppSelector(selectWorkspaceInfo)

    // New upload function using signed URLs
    const uploadFileWithSignedUrl = useCallback(
        async (
            file: File
        ): Promise<{ fileUrl: string; fileId: string } | null> => {
            try {
                // Step 1: Generate upload URL
                const generateUrlResponse =
                    await uploadService.generateUploadUrl({
                        file_name: file.name,
                        content_type: file.type || 'application/octet-stream',
                        file_size: file.size
                    })

                // Step 2: Upload file to the signed URL using XMLHttpRequest
                await new Promise<void>((resolve, reject) => {
                    const xhr = new XMLHttpRequest()

                    xhr.open('PUT', generateUrlResponse.upload_url, true)
                    xhr.setRequestHeader(
                        'Content-Type',
                        file.type || 'application/octet-stream'
                    )

                    xhr.onload = function () {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            resolve()
                        } else {
                            reject(
                                new Error(
                                    `Failed to upload file: ${xhr.status} ${xhr.statusText}`
                                )
                            )
                        }
                    }

                    xhr.onerror = function () {
                        reject(
                            new Error(
                                'Network error occurred during file upload'
                            )
                        )
                    }

                    xhr.ontimeout = function () {
                        reject(new Error('Upload timeout'))
                    }

                    // Set timeout to 5 minutes
                    xhr.timeout = 300000

                    xhr.send(file)
                })

                // Step 3: Call upload complete
                const completeResponse = await uploadService.uploadComplete({
                    id: generateUrlResponse.id,
                    file_name: file.name,
                    file_size: file.size,
                    content_type: file.type || 'application/octet-stream'
                })

                return {
                    fileUrl: completeResponse.file_url,
                    fileId: generateUrlResponse.id
                }
            } catch (error) {
                console.error('Upload error:', error)
                return null
            }
        },
        []
    )

    const handleRemoveFile = useCallback(
        async (fileName: string) => {
            // try {
            //     const workspacePath = workspaceInfo || ''
            //     const connectionId = workspacePath.split('/').pop()

            //     // Call API to remove file from server
            //     const response = await fetch(
            //         `${import.meta.env.VITE_API_URL}/api/remove-file`,
            //         {
            //             method: 'POST',
            //             headers: {
            //                 'Content-Type': 'application/json'
            //             },
            //             body: JSON.stringify({
            //                 session_id: connectionId,
            //                 file_path: fileName
            //             })
            //         }
            //     )

            //     if (response.ok) {
            //         // Remove file from Redux state
            //         dispatch(removeUploadedFile(fileName))
            //         toast.success(`File "${fileName}" removed successfully`)
            //     } else {
            //         const result = await response.json()
            //         console.error(`Error removing ${fileName}:`, result.error)
            //         toast.error(`Failed to remove file "${fileName}"`)
            //     }
            // } catch (error) {
            //     console.error('Error removing file:', error)
            //     toast.error(`Failed to remove file "${fileName}"`)
            // }
            dispatch(removeUploadedFile(fileName))
        },
        [dispatch, workspaceInfo]
    )

    // New function to handle file uploads with signed URLs
    const handleFileUploadWithSignedUrl = useCallback(
        async (
            files: File[],
            setFilesState?: (
                updater: (prev: FileUploadStatus[]) => FileUploadStatus[]
            ) => void
        ) => {
            if (!files.length) return

            // Check file size limit (100MB)
            const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB in bytes
            const oversizedFiles = files.filter(
                (file) => file.size > MAX_FILE_SIZE
            )

            if (oversizedFiles.length > 0) {
                oversizedFiles.forEach((file) => {
                    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
                    toast.error(
                        `File "${file.name}" is too large (${fileSizeMB}MB). Maximum size is 100MB.`
                    )
                })
                // Filter out oversized files
                files = files.filter((file) => file.size <= MAX_FILE_SIZE)
                if (!files.length) return
            }

            // Create file status objects
            const newFiles = files.map((file) => {
                const isImage = isImageFile(file.name)
                const preview = isImage ? URL.createObjectURL(file) : undefined

                return {
                    name: file.name,
                    loading: true,
                    isImage,
                    preview
                }
            })

            // Update files state if provided
            if (setFilesState) {
                setFilesState((prev) => [...prev, ...newFiles])
            }

            // Upload files using signed URL flow
            const uploadedFileObjects: {
                id: string
                name: string
                path: string
                size: number
            }[] = []
            for (const file of files) {
                try {
                    const uploadResult = await uploadFileWithSignedUrl(file)

                    if (uploadResult) {
                        // Successfully uploaded
                        uploadedFileObjects.push({
                            id: uploadResult.fileId,
                            name: file.name,
                            path: uploadResult.fileUrl,
                            size: file.size
                        })
                        if (setFilesState) {
                            setFilesState((prev) =>
                                prev.map((f) =>
                                    f.name === file.name
                                        ? { ...f, loading: false }
                                        : f
                                )
                            )
                        }
                    } else {
                        // Upload failed
                        if (setFilesState) {
                            setFilesState((prev) =>
                                prev.map((f) =>
                                    f.name === file.name
                                        ? {
                                              ...f,
                                              loading: false,
                                              error: 'Upload failed'
                                          }
                                        : f
                                )
                            )
                        }
                        toast.error(`Failed to upload file "${file.name}"`)
                    }
                } catch (error) {
                    console.error(`Error uploading ${file.name}:`, error)
                    if (setFilesState) {
                        setFilesState((prev) =>
                            prev.map((f) =>
                                f.name === file.name
                                    ? {
                                          ...f,
                                          loading: false,
                                          error: 'Upload failed'
                                      }
                                    : f
                            )
                        )
                    }
                    toast.error(`Failed to upload file "${file.name}"`)
                }
            }

            // Save file objects to Redux
            if (uploadedFileObjects.length > 0) {
                dispatch(addUploadedFiles(uploadedFileObjects))
                // Also add to current message file IDs
                dispatch(
                    addToCurrentMessageFileIds(
                        uploadedFileObjects.map((f) => f.id)
                    )
                )
            }
        },
        [uploadFileWithSignedUrl]
    )

    // Function to handle pasted images with signed URL
    const handlePastedImageUpload = useCallback(
        async (
            file: File,
            fileName: string,
            setFilesState?: (
                updater: (prev: FileUploadStatus[]) => FileUploadStatus[]
            ) => void
        ): Promise<boolean> => {
            // Check file size limit (100MB)
            const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB in bytes
            if (file.size > MAX_FILE_SIZE) {
                const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
                toast.error(
                    `Image is too large (${fileSizeMB}MB). Maximum size is 100MB.`
                )
                return false
            }

            // Create file status object for UI
            const preview = URL.createObjectURL(file)
            const newFile: FileUploadStatus = {
                name: fileName,
                loading: true,
                isImage: true,
                preview
            }

            if (setFilesState) {
                setFilesState((prev) => [...prev, newFile])
            }

            try {
                const uploadResult = await uploadFileWithSignedUrl(file)

                if (uploadResult) {
                    // Successfully uploaded
                    const fileObject = {
                        id: uploadResult.fileId,
                        name: fileName,
                        path: uploadResult.fileUrl,
                        size: file.size
                    }
                    dispatch(addUploadedFiles([fileObject]))
                    // Also add to current message file IDs
                    dispatch(addToCurrentMessageFileIds([fileObject.id]))
                    if (setFilesState) {
                        setFilesState((prev) =>
                            prev.map((f) =>
                                f.name === fileName
                                    ? { ...f, loading: false }
                                    : f
                            )
                        )
                    }
                    toast.success(`Image uploaded successfully`)
                    return true
                } else {
                    // Upload failed
                    if (setFilesState) {
                        setFilesState((prev) =>
                            prev.map((f) =>
                                f.name === fileName
                                    ? {
                                          ...f,
                                          loading: false,
                                          error: 'Upload failed'
                                      }
                                    : f
                            )
                        )
                    }
                    toast.error(`Failed to upload image`)
                    return false
                }
            } catch (error) {
                console.error(`Error uploading ${fileName}:`, error)
                if (setFilesState) {
                    setFilesState((prev) =>
                        prev.map((f) =>
                            f.name === fileName
                                ? {
                                      ...f,
                                      loading: false,
                                      error: 'Upload failed'
                                  }
                                : f
                        )
                    )
                }
                toast.error(`Failed to upload image`)
                return false
            }
        },
        [uploadFileWithSignedUrl]
    )

    return {
        handleRemoveFile,
        uploadFileWithSignedUrl,
        handleFileUploadWithSignedUrl,
        handlePastedImageUpload
    }
}
