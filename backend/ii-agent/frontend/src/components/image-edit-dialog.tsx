import { useState, useRef, useCallback, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Icon } from './ui/icon'
import { useUploadFiles } from '@/hooks/use-upload-files'

interface ImageEditDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentImageSrc: string
    onImageUpdate: (newSrc: string) => void
}

export function ImageEditDialog({
    open,
    onOpenChange,
    currentImageSrc,
    onImageUpdate
}: ImageEditDialogProps) {
    const [previewSrc, setPreviewSrc] = useState(currentImageSrc)
    const [urlInput, setUrlInput] = useState(currentImageSrc)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { uploadFileWithSignedUrl } = useUploadFiles()

    useEffect(() => {
        setPreviewSrc(currentImageSrc)
        setUrlInput(currentImageSrc)
    }, [currentImageSrc])

    const handleFileUpload = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0]
            if (!file) return

            // Check if it's an image file
            if (!file.type.startsWith('image/')) {
                setUploadError('Please select an image file')
                return
            }

            // Check file size limit (100MB)
            const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB in bytes
            if (file.size > MAX_FILE_SIZE) {
                const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
                setUploadError(`File is too large (${fileSizeMB}MB). Maximum size is 100MB.`)
                return
            }

            setIsUploading(true)
            setUploadError(null)

            try {
                // Show preview immediately for better UX
                const reader = new FileReader()
                reader.onload = (e) => {
                    const dataUrl = e.target?.result as string
                    if (dataUrl) {
                        setPreviewSrc(dataUrl)
                    }
                }
                reader.readAsDataURL(file)

                // Upload to server
                const uploadResult = await uploadFileWithSignedUrl(file)
                
                if (uploadResult) {
                    // Use the uploaded file URL
                    setPreviewSrc(uploadResult.fileUrl)
                    setUrlInput(uploadResult.fileUrl)
                } else {
                    setUploadError('Failed to upload image')
                    // Revert preview on upload failure
                    setPreviewSrc(currentImageSrc)
                }
            } catch (error) {
                console.error('Upload error:', error)
                setUploadError('Failed to upload image')
                // Revert preview on error
                setPreviewSrc(currentImageSrc)
            } finally {
                setIsUploading(false)
                // Clear the file input
                if (event.target) {
                    event.target.value = ''
                }
            }
        },
        [uploadFileWithSignedUrl, currentImageSrc]
    )

    const handlePasteFromClipboard = useCallback(async () => {
        setUploadError(null)
        
        try {
            const clipboardItems = await navigator.clipboard.read()
            for (const item of clipboardItems) {
                if (item.types.some((type) => type.startsWith('image/'))) {
                    const imageType = item.types.find((type) => type.startsWith('image/')) || 'image/png'
                    const blob = await item.getType(imageType)
                    
                    // Convert blob to File for upload
                    const file = new File([blob], `pasted-image-${Date.now()}.${imageType.split('/')[1]}`, { type: imageType })
                    
                    // Check file size limit
                    const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
                    if (file.size > MAX_FILE_SIZE) {
                        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
                        setUploadError(`Image is too large (${fileSizeMB}MB). Maximum size is 100MB.`)
                        return
                    }
                    
                    setIsUploading(true)
                    
                    try {
                        // Show preview immediately
                        const reader = new FileReader()
                        reader.onload = (e) => {
                            const dataUrl = e.target?.result as string
                            if (dataUrl) {
                                setPreviewSrc(dataUrl)
                            }
                        }
                        reader.readAsDataURL(file)
                        
                        // Upload to server
                        const uploadResult = await uploadFileWithSignedUrl(file)
                        
                        if (uploadResult) {
                            setPreviewSrc(uploadResult.fileUrl)
                            setUrlInput(uploadResult.fileUrl)
                        } else {
                            setUploadError('Failed to upload pasted image')
                            setPreviewSrc(currentImageSrc)
                        }
                    } catch (error) {
                        console.error('Upload error:', error)
                        setUploadError('Failed to upload pasted image')
                        setPreviewSrc(currentImageSrc)
                    } finally {
                        setIsUploading(false)
                    }
                    
                    return // Exit after processing first image
                }
            }
            
            // Fallback: try text paste for URLs
            const text = await navigator.clipboard.readText()
            if (text && (text.startsWith('http') || text.startsWith('data:'))) {
                setPreviewSrc(text)
                setUrlInput(text)
            }
        } catch (error) {
            console.error('Clipboard access failed:', error)
            setUploadError('Failed to access clipboard')
        }
    }, [uploadFileWithSignedUrl, currentImageSrc])

    const handleUrlChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const url = event.target.value
            setUrlInput(url)
            if (url && (url.startsWith('http') || url.startsWith('data:'))) {
                setPreviewSrc(url)
            }
        },
        []
    )

    const handleApply = useCallback(() => {
        if (urlInput.trim()) {
            onImageUpdate(urlInput.trim())
        }
        onOpenChange(false)
    }, [urlInput, onImageUpdate, onOpenChange])

    const handleCancel = useCallback(() => {
        setPreviewSrc(currentImageSrc)
        setUrlInput(currentImageSrc)
        setIsUploading(false)
        setUploadError(null)
        onOpenChange(false)
    }, [currentImageSrc, onOpenChange])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Image</DialogTitle>
                    <DialogDescription>
                        Upload a new image, paste from clipboard, or enter an
                        image URL.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Image Preview */}
                    <div className="flex justify-center">
                        <img
                            src={previewSrc}
                            alt="Image preview"
                            className="image-preview"
                            style={{
                                width: '100%',
                                maxHeight: '200px',
                                objectFit: 'contain',
                                border: '2px dashed #e5e7eb',
                                borderRadius: '8px',
                                background: '#f9fafb'
                            }}
                            onError={(e) => {
                                ;(e.target as HTMLImageElement).style.display =
                                    'none'
                            }}
                        />
                    </div>

                    {/* Upload Options */}
                    <div className="flex gap-3">
                        <Button
                            size="xl"
                            variant="outline"
                            className="flex-1 border-black text-black"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            <Icon
                                name="link-2"
                                className="size-5 fill-black -rotate-45"
                            />
                            {isUploading ? 'Uploading...' : 'Upload File'}
                        </Button>
                        <Button
                            size="xl"
                            variant="outline"
                            className="flex-1 border-black text-black"
                            onClick={handlePasteFromClipboard}
                            disabled={isUploading}
                        >
                            <Icon
                                name="clipboard"
                                className="size-5 fill-black"
                            />
                            {isUploading ? 'Processing...' : 'Paste'}
                        </Button>
                    </div>

                    {/* Error Message */}
                    {uploadError && (
                        <div className="text-red-600 text-sm bg-red-50 p-2 rounded border">
                            {uploadError}
                        </div>
                    )}

                    {/* URL Input */}
                    <div className="space-y-2 text-black">
                        <Label htmlFor="image-url">Or enter image URL:</Label>
                        <div className="space-y-2 relative">
                            <Icon
                                name="link-2"
                                className={`absolute top-3 left-4 fill-black`}
                            />
                            <Input
                                id="image-url"
                                className="pl-[56px] !bg-grey-3 !border-grey"
                                type="text"
                                placeholder="https://example.com/image.jpg"
                                value={urlInput}
                                onChange={handleUrlChange}
                            />
                        </div>
                    </div>

                    {/* Hidden File Input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                </div>

                <DialogFooter className="flex justify-between">
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            className="rounded-xl text-base border-[#8b8b8b] text-[#8b8b8b]"
                            onClick={handleCancel}
                            disabled={isUploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="lg"
                            className="rounded-xl bg-sky-blue text-black"
                            onClick={handleApply}
                            disabled={isUploading}
                        >
                            {isUploading ? 'Uploading...' : 'Apply'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
