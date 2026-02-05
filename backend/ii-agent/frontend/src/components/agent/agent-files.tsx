import { useEffect, useState } from 'react'

import { Icon } from '@/components/ui/icon'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { isImageFile } from '@/lib/utils'
import { sessionService } from '@/services/session.service'
import { SessionFile } from '@/typings/session'
import { selectUploadedFiles, useAppSelector } from '@/state'

const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    const typeMap: Record<string, string> = {
        tsx: 'TypeScript React',
        ts: 'TypeScript',
        js: 'JavaScript',
        jsx: 'JavaScript React',
        css: 'CSS',
        json: 'JSON',
        sql: 'SQL',
        md: 'Markdown',
        pdf: 'PDF Document',
        txt: 'Text File',
        png: 'PNG Image',
        jpg: 'JPEG Image',
        jpeg: 'JPEG Image',
        gif: 'GIF Image',
        svg: 'SVG Image'
    }
    return typeMap[extension || ''] || 'File'
}

const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const getFileIcon = (extension: string) => {
    const iconMap: Record<string, string> = {
        tsx: 'document-code',
        ts: 'document-code',
        js: 'document-code',
        jsx: 'document-code',
        css: 'document-code',
        json: 'document-code',
        sql: 'document-code',
        md: 'document-text-2',
        pdf: 'document-text-2',
        txt: 'document-text-2'
    }
    return iconMap[extension] || 'document-text-2'
}

interface AgentFilesProps {
    sessionId?: string
    isActive: boolean
}

const AgentFiles = ({ sessionId, isActive }: AgentFilesProps) => {
    const uploadedFiles = useAppSelector(selectUploadedFiles)
    const [sessionFiles, setSessionFiles] = useState<SessionFile[]>(
        uploadedFiles?.map((f) => {
            return {
                id: f.id,
                name: f.name,
                url: f.path,
                size: f.size
            }
        })
    )
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchSessionFiles = async () => {
            if (!sessionId || !isActive) return

            setLoading(true)
            try {
                const files = await sessionService.getSessionFiles(sessionId)
                setSessionFiles(files)
            } catch (error) {
                console.error('Error fetching session files:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchSessionFiles()
    }, [sessionId, isActive])

    const handlePreviewFile = (fileUrl: string) => {
        window.open(fileUrl, '_blank')
    }

    return (
        <div className="md:border-t border-white/30">
            <div></div>
            <div className="space-y-4 p-3 md:p-4">
                {loading ? (
                    <div className="text-center p-4 text-gray-500">
                        Loading files...
                    </div>
                ) : sessionFiles.length === 0 ? (
                    <div className="text-center p-4 text-gray-500">
                        No files uploaded to this session
                    </div>
                ) : (
                    sessionFiles.map((file) => {
                        const fileName = file.name
                        const extension =
                            fileName.split('.').pop()?.toLowerCase() || ''
                        const fileType = getFileType(fileName)

                        return (
                            <div
                                key={file.id}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <div className="flex items-center justify-center size-9 md:size-12 rounded-lg bg-sky-blue">
                                        {isImageFile(fileName) ? (
                                            <img
                                                src={file.url}
                                                alt={fileName}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <Icon
                                                name={getFileIcon(extension)}
                                                className="size-[30px] fill-firefly"
                                            />
                                        )}
                                    </div>

                                    <div className="flex-1 text-black dark:text-white">
                                        <div className="text-sm md:text-base font-semibold line-clamp-1">
                                            {fileName}
                                        </div>
                                        <div className="text-xs md:text-sm mt-1">
                                            {fileType} •{' '}
                                            {formatFileSize(file.size)}
                                        </div>
                                    </div>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                            <Icon
                                                name="more"
                                                className="size-6 fill-black dark:fill-white"
                                            />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="w-48"
                                    >
                                        <DropdownMenuItem
                                            onClick={() =>
                                                handlePreviewFile(file.url)
                                            }
                                        >
                                            <Icon
                                                name="preview"
                                                className="size-5 mr-[6px] stroke-black"
                                            />
                                            Preview
                                        </DropdownMenuItem>
                                        {/* <DropdownMenuItem>
                                        <Icon
                                            name="download"
                                            className="size-5 mr-[6px] fill-black"
                                        />
                                        Download
                                    </DropdownMenuItem> */}
                                        {/* <DropdownMenuItem
                                            onClick={() =>
                                                handleRemoveFile(file.id)
                                            }
                                            className="text-red-600 focus:text-red-600"
                                        >
                                            <Icon
                                                name="trash"
                                                className="size-5 mr-[6px] fill-red-600"
                                            />
                                            Remove
                                        </DropdownMenuItem> */}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

export default AgentFiles
