import { Folder, Loader2 } from 'lucide-react'
import { Icon } from './ui/icon'
import { getFileIconAndColor } from '@/utils/file-utils'
import type { FileUploadStatus } from '@/hooks/use-upload-files'

interface FilesPreviewProps {
    files: FileUploadStatus[]
    isUploading: boolean
    onRemove: (fileName: string) => void
}

const FilesPreview = ({ files, isUploading, onRemove }: FilesPreviewProps) => {
    if (files.length === 0) return null

    return (
        <div className="absolute top-4 left-4 right-2 flex items-center overflow-auto gap-2 z-10">
            {files.map((file) => {
                if (file.isImage && file.preview) {
                    return (
                        <div key={file.name} className="relative">
                            <div className="size-12 rounded-lg overflow-hidden">
                                <img
                                    src={file.preview}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {(isUploading || file.loading) && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                                    <Loader2 className="size-5 text-black animate-spin" />
                                </div>
                            )}
                            <button
                                onClick={() => onRemove(file.name)}
                                className="absolute right-1 top-1 cursor-pointer"
                            >
                                <Icon name="close-circle" className="size-4" />
                            </button>
                        </div>
                    )
                }

                if (file.isFolder) {
                    return (
                        <div
                            key={file.name}
                            className="relative flex items-center gap-2 dark:bg-grey bg-white text-black rounded-lg px-3 py-2 pr-8 border border-grey dark:border-grey-4 shadow-sm"
                        >
                            <div className="flex items-center justify-center w-8 h-8 bg-firefly dark:bg-sky-blue rounded-full">
                                {isUploading || file.loading ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Folder className="size-4" />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold truncate max-w-[145px]">
                                    {file.name}
                                </span>
                                <span className="text-xs">
                                    {file.fileCount ? `${file.fileCount} file${file.fileCount === 1 ? '' : 's'}` : 'Folder'}
                                </span>
                            </div>
                            <button
                                onClick={() => onRemove(file.name)}
                                className="absolute right-1 top-1 cursor-pointer"
                            >
                                <Icon name="close-circle" className="size-4" />
                            </button>
                        </div>
                    )
                }

                const { label } = getFileIconAndColor(file.name)
                return (
                    <div
                        key={file.name}
                        className="relative flex items-center gap-2 dark:bg-grey text-white rounded-lg p-2 pr-7"
                    >
                        {(isUploading || file.loading) && (
                            <div
                                className={`flex items-center justify-center w-10 h-10 rounded-full`}
                            >
                                <Loader2 className="size-5 text-black animate-spin" />
                            </div>
                        )}
                        <div className="flex flex-col text-black">
                            <span className="text-xs font-semibold truncate max-w-[145px]">
                                {file.name}
                            </span>
                            <span className="text-xs">{label}</span>
                        </div>
                        <button
                            onClick={() => onRemove(file.name)}
                            className="absolute right-1 top-1 cursor-pointer"
                        >
                            <Icon name="close-circle" className="size-4" />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}

export default FilesPreview
