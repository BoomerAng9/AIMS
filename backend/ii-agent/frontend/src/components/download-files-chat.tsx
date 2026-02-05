import { useState, useEffect } from 'react'
import { FileMetadata } from '@/utils/chat-events'
import { Icon } from '@/components/ui/icon'
import { chatService } from '@/services/chat.service'

interface DownloadFilesChatProps {
    files: FileMetadata[]
    sessionId: string
}

const DownloadFilesChat = ({ files, sessionId }: DownloadFilesChatProps) => {
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
    const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({})
    const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null)

    const getFileExtension = (fileName: string): string => {
        return fileName.split('.').pop()?.toLowerCase() || ''
    }

    const isImageFile = (fileName: string): boolean => {
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico', 'heic']
        const extension = getFileExtension(fileName)
        return imageExtensions.includes(extension)
    }

    const getFileTypeCategory = (fileName: string): number => {
        // Image files should appear at the bottom (higher sort value)
        if (isImageFile(fileName)) return 2
        return 1
    }

    useEffect(() => {
        if (!files || !sessionId) return

        const fetchedUrls: string[] = []

        const fetchImageFiles = async () => {
            for (const file of files) {
                // Skip if not an image or already loaded
                if (!isImageFile(file.file_name) || imageUrls[file.id]) {
                    continue
                }

                // Set loading state
                setLoadingImages(prev => ({ ...prev, [file.id]: true }))

                try {
                    const blob = await chatService.getFileContent({
                        fileId: file.id,
                        sessionId
                    })
                    const url = URL.createObjectURL(blob)
                    fetchedUrls.push(url)
                    setImageUrls(prev => ({ ...prev, [file.id]: url }))
                } catch (error) {
                    console.error(`Error fetching image ${file.file_name}:`, error)
                } finally {
                    setLoadingImages(prev => ({ ...prev, [file.id]: false }))
                }
            }
        }

        fetchImageFiles()

        // Cleanup function to revoke object URLs
        return () => {
            fetchedUrls.forEach(url => {
                URL.revokeObjectURL(url)
            })
        }
    }, [files, sessionId, imageUrls])

    const handleDownload = async (file: FileMetadata) => {
        try {
            const blob = await chatService.getFileContent({
                fileId: file.id,
                sessionId
            })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = file.file_name
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Error downloading file:', error)
        }
    }

    if (!files || files.length === 0) {
        return null
    }

    // Sort files: non-images first, then images at the bottom
    const sortedFiles = [...files].sort((a, b) => {
        return getFileTypeCategory(a.file_name) - getFileTypeCategory(b.file_name)
    })

    return (
        <div className="flex flex-wrap gap-3 my-3">
            {sortedFiles.map((file) => {
                const extension = getFileExtension(file.file_name)
                const isImage = isImageFile(file.file_name)
                const imageUrl = imageUrls[file.id]
                const isLoading = loadingImages[file.id]

                // Render image preview if it's an image file
                if (isImage && imageUrl) {
                    return (
                        <div
                            key={file.id}
                            className="inline-block rounded-xl overflow-hidden max-w-[320px] cursor-pointer"
                            onClick={() => setPreviewImage({ url: imageUrl, name: file.file_name })}
                        >
                            <div className="w-40 h-40 rounded-xl overflow-hidden hover:opacity-80 transition-opacity">
                                <img
                                    src={imageUrl}
                                    alt={file.file_name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    )
                }

                // Show loading state for images
                if (isImage && isLoading) {
                    return (
                        <div
                            key={file.id}
                            className="inline-block rounded-xl overflow-hidden max-w-[320px]"
                        >
                            <div className="w-40 h-40 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <span className="text-gray-500 text-sm">Loading...</span>
                            </div>
                        </div>
                    )
                }

                // Render file card for non-image files
                return (
                    <div
                        key={file.id}
                        className="flex items-center justify-between gap-3 px-3 py-2 bg-firefly dark:bg-[#000000]/50 rounded-lg w-full shadow-btn"
                    >
                        <div className="flex items-center gap-2">
                            <Icon
                                name="code-3"
                                className="size-5 stroke-white"
                            />
                            <div className="text-xs uppercase">{extension}</div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="text-xs font-semibold text-white line-clamp-1">
                                {file.file_name}
                            </div>
                            <button
                                onClick={() => handleDownload(file)}
                                className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Download"
                            >
                                <Icon
                                    name="download"
                                    className="size-5 fill-white"
                                />
                            </button>
                        </div>
                    </div>
                )
            })}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-[90vw] max-h-[90vh]">
                        <button
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
                            onClick={() => setPreviewImage(null)}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                        <img
                            src={previewImage.url}
                            alt={previewImage.name}
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <div className="absolute -bottom-10 left-0 text-white text-sm">
                            {previewImage.name}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DownloadFilesChat
