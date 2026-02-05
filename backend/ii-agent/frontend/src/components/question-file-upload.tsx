import { useRef, useState } from 'react'
import ButtonIcon from './button-icon'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from './ui/dropdown-menu'
import { Icon } from './ui/icon'

interface QuestionFileUploadProps {
    onFileChange: (files: File[]) => void
    onGoogleDriveClick?: () => void
    isDisabled?: boolean
    isGoogleDriveConnected?: boolean
    isGoogleDriveAuthLoading?: boolean
}

const QuestionFileUpload = ({
    onFileChange,
    onGoogleDriveClick,
    isDisabled,
    isGoogleDriveConnected = false,
    isGoogleDriveAuthLoading = false
}: QuestionFileUploadProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isOpen, setIsOpen] = useState(false)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return

        const filesToUpload = Array.from(e.target.files)
        onFileChange(filesToUpload)

        // Clear the input
        e.target.value = ''
    }

    const handleLocalUpload = () => {
        fileInputRef.current?.click()
        setIsOpen(false)
    }

    const handleGoogleDrive = () => {
        setIsOpen(false)
        if (!onGoogleDriveClick) return
        onGoogleDriveClick()
    }

    return (
        <>
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <ButtonIcon name="plus" disabled={isDisabled} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuItem
                        onClick={handleLocalUpload}
                        disabled={isDisabled}
                        className="cursor-pointer"
                    >
                        <Icon name="link" className="size-5 fill-black" />
                        Add images and files
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={handleGoogleDrive}
                        disabled={
                            isDisabled ||
                            isGoogleDriveAuthLoading ||
                            !onGoogleDriveClick
                        }
                        className="cursor-pointer"
                    >
                        {isGoogleDriveAuthLoading ? (
                            <Icon
                                name="spinner"
                                className="size-5 animate-spin fill-black"
                            />
                        ) : (
                            <Icon
                                name="google-drive"
                                className="size-5 fill-black"
                            />
                        )}
                        {isGoogleDriveConnected
                            ? 'Add from Google Drive'
                            : 'Connect with Google Drive'}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={isDisabled}
            />
        </>
    )
}

export default QuestionFileUpload
