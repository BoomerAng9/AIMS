'use client'

import type { ComponentType, SVGProps } from 'react'
import { memo } from 'react'
import {
    FileArchive,
    FileCode2,
    FileSpreadsheet,
    FileText
} from 'lucide-react'

import type { AttachmentMeta, AttachmentType } from '@/typings/agent'

interface AttachmentsListProps {
    attachments?: AttachmentMeta[]
}

const ATTACHMENT_STYLES: Record<AttachmentType, {
    Icon: ComponentType<SVGProps<SVGSVGElement>>
    buttonGradient: string
    buttonBorder: string
    hoverBorder: string
    hoverShadow: string
    iconBg: string
    iconBorder: string
    iconText: string
    accentText: string
}> = {
    code: {
        Icon: FileCode2,
        buttonGradient: 'from-[#161c24] via-[#11161d] to-[#0b1016]',
        buttonBorder: 'border-emerald-400/25',
        hoverBorder: 'hover:border-emerald-300/60',
        hoverShadow: 'hover:shadow-[0_12px_28px_rgba(52,211,153,0.22)]',
        iconBg: 'bg-emerald-500/15',
        iconBorder: 'border-emerald-400/30',
        iconText: 'text-emerald-300',
        accentText: 'text-emerald-300'
    },
    xlsx: {
        Icon: FileSpreadsheet,
        buttonGradient: 'from-[#14231b] via-[#0f1c15] to-[#0a140f]',
        buttonBorder: 'border-green-400/25',
        hoverBorder: 'hover:border-green-300/60',
        hoverShadow: 'hover:shadow-[0_12px_28px_rgba(74,222,128,0.22)]',
        iconBg: 'bg-green-500/15',
        iconBorder: 'border-green-400/30',
        iconText: 'text-green-300',
        accentText: 'text-green-300'
    },
    documents: {
        Icon: FileText,
        buttonGradient: 'from-[#1b1c22] via-[#15161c] to-[#101116]',
        buttonBorder: 'border-slate-400/20',
        hoverBorder: 'hover:border-sky-400/50',
        hoverShadow: 'hover:shadow-[0_12px_28px_rgba(56,189,248,0.20)]',
        iconBg: 'bg-sky-500/15',
        iconBorder: 'border-sky-400/30',
        iconText: 'text-sky-300',
        accentText: 'text-sky-300'
    },
    archive: {
        Icon: FileArchive,
        buttonGradient: 'from-[#231c14] via-[#1b1510] to-[#120e0a]',
        buttonBorder: 'border-amber-400/25',
        hoverBorder: 'hover:border-amber-300/60',
        hoverShadow: 'hover:shadow-[0_12px_28px_rgba(251,191,36,0.22)]',
        iconBg: 'bg-amber-500/15',
        iconBorder: 'border-amber-400/30',
        iconText: 'text-amber-300',
        accentText: 'text-amber-300'
    }
}

const baseButtonClass =
    'flex h-full items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60'

const AttachmentsList = memo(({ attachments }: AttachmentsListProps) => {
    if (!attachments || attachments.length === 0) {
        return null
    }

    return (
        <div className="mt-5">
            <ul className="grid gap-2 sm:grid-cols-2">
                {attachments.map((attachment, index) => {
                    const style =
                        ATTACHMENT_STYLES[attachment.file_type] ||
                        ATTACHMENT_STYLES.documents
                    const buttonClass = `${baseButtonClass} bg-gradient-to-br ${style.buttonGradient} ${style.buttonBorder} ${style.hoverBorder}`
                    const iconWrapperClass = `flex items-center justify-center w-9 h-9 rounded-xl border ${style.iconBorder} ${style.iconBg}`
                    const Icon = style.Icon

                    return (
                        <li key={`${attachment.url}-${index}`} className="m-1 min-w-[150px]">
                            <a
                                href={attachment.url}
                                target="_blank"
                                rel="noreferrer"
                                className={buttonClass}
                            >
                                <div className={iconWrapperClass}>
                                    <Icon className={`size-4 ${style.iconText}`} />
                                </div>
                                <div className="flex min-w-0 flex-col">
                                    <span className="truncate text-sm font-medium text-gray-100">
                                        {attachment.name}
                                    </span>
                                    <span className={`text-xs ${style.accentText}`}>
                                        Open attachment
                                    </span>
                                </div>
                            </a>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
})

AttachmentsList.displayName = 'AttachmentsList'

export default AttachmentsList
