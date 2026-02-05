import type { AttachmentMeta, AttachmentType } from '@/typings/agent'

const CODE_EXTENSIONS = new Set([
    'py',
    'js',
    'ts',
    'tsx',
    'jsx',
    'java',
    'rb',
    'go',
    'rs',
    'c',
    'cpp',
    'cs',
    'swift',
    'kt',
    'php',
    'html',
    'css',
    'json',
    'yaml',
    'yml',
    'toml',
    'sh',
    'md'
])

const SPREADSHEET_EXTENSIONS = new Set(['xls', 'xlsx', 'csv', 'tsv'])
const ARCHIVE_EXTENSIONS = new Set(['zip', 'tar', 'gz', 'tgz', 'bz2', 'xz', 'rar', '7z'])
const DOCUMENT_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'txt', 'rtf', 'ppt', 'pptx'])

const ATTACHMENT_TYPES: AttachmentType[] = ['code', 'xlsx', 'documents', 'archive']

export const isAttachmentType = (value: unknown): value is AttachmentType =>
    typeof value === 'string' && ATTACHMENT_TYPES.includes(value as AttachmentType)

export const inferAttachmentType = (filename: string): AttachmentType => {
    const extension = filename.split('.').pop()?.toLowerCase() || ''

    if (CODE_EXTENSIONS.has(extension)) return 'code'
    if (SPREADSHEET_EXTENSIONS.has(extension)) return 'xlsx'
    if (ARCHIVE_EXTENSIONS.has(extension)) return 'archive'
    if (DOCUMENT_EXTENSIONS.has(extension)) return 'documents'
    return 'documents'
}

export const guessNameFromUrl = (url: string): string => {
    try {
        const parsed = new URL(url)
        const pathname = decodeURIComponent(parsed.pathname)
        const segments = pathname.split('/').filter(Boolean)
        if (segments.length > 0) {
            return segments[segments.length - 1]
        }
        return url
    } catch (error) {
        const parts = url.split('/').filter(Boolean)
        return parts.length > 0 ? parts[parts.length - 1] : 'attachment'
    }
}

export const normalizeAttachment = (item: unknown): AttachmentMeta | null => {
    if (typeof item === 'string') {
        const name = guessNameFromUrl(item)
        return {
            name,
            url: item,
            file_type: inferAttachmentType(name)
        }
    }

    if (item && typeof item === 'object') {
        const meta = item as Record<string, unknown>
        const url = typeof meta.url === 'string' ? meta.url : ''
        if (!url) {
            return null
        }
        const rawName = meta.name
        const name =
            typeof rawName === 'string' && rawName ? rawName : guessNameFromUrl(url)
        const rawType = meta.file_type
        const fileType = isAttachmentType(rawType)
            ? rawType
            : inferAttachmentType(name)
        return {
            name,
            url,
            file_type: fileType
        }
    }

    return null
}
