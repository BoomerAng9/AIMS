import { FinishReason } from '@/typings/chat'
import reverse from 'lodash/reverse'

export type AgentStatusState = 'ready' | 'running'

export type FileMetadata = {
    id: string
    file_name: string
    file_size: number
    content_type: string
    created_at: string
}

export type ChatMessage = {
    id: string
    role: 'user' | 'assistant' | 'system' | 'tool'
    content: string
    model: string
    createdAt?: string
    isError?: boolean
    files?: FileMetadata[]
    fileContents?: Record<string, string>
    parts?: ContentPart[]
    finish_reason?: FinishReason | null
}

export type ContentPart = {
    message_id?: string
    role?: 'user' | 'assistant' | 'system' | 'tool'
    model?: string
    createdAt?: string
    id?: string
    text?: string
    type: string
    thinking?: string
    signature?: string
    started_at?: number | null
    finished_at?: number | null
    stream_active?: boolean
    tool_call_id?: string
    name?: string
    input?: string
    finished?: boolean
    finish_reason?: FinishReason | null
    content?: string
    output?: {
        type: string
        value?: string
    }
    metadata?: string
    is_error?: boolean
    files?: FileMetadata[]
    isLastOfTurn?: boolean
}

export type GroupedPart = {
    parts: ContentPart[]
    files?: FileMetadata[]
    fileContents?: Record<string, string>
}

export function groupMessageParts(allMessages: ChatMessage[]): GroupedPart[] {
    // Step 1: Create a map to track message metadata (files, fileContents)
    const messageMetadataMap = new Map<
        string,
        { files?: FileMetadata[]; fileContents?: Record<string, string> }
    >()
    allMessages.forEach((message) => {
        if (message.files || message.fileContents) {
            messageMetadataMap.set(message.id, {
                files: message.files,
                fileContents: message.fileContents
            })
        }
    })

    // Step 2: Merge all parts from message into a single array
    const allPartsFromMessage: ContentPart[] = allMessages
        .map((message) => {
            // If message has parts, use them
            if (message.parts && message.parts.length > 0) {
                return message.parts.map(
                    (part, index) =>
                        ({
                            ...part,
                            message_id: message.id,
                            role: message.role,
                            model: message.model,
                            createdAt: message.createdAt,
                            isLastOfTurn:
                                index === (message.parts?.length || 0) - 1,
                            finish_reason: message.finish_reason
                        }) as ContentPart
                )
            }

            // If message has content but no parts, create a text part from content
            if (message.content) {
                return [
                    {
                        type: 'text',
                        text: message.content,
                        message_id: message.id,
                        role: message.role,
                        model: message.model,
                        createdAt: message.createdAt,
                        finish_reason: message.finish_reason
                        // files: message.files
                    } as ContentPart
                ]
            }

            // No parts and no content
            return []
        })
        .flat()

    // Step 3: Group parts - when encountering 'text', start a new group; otherwise add to latest group
    const reversedParts = reverse(allPartsFromMessage)
    const groups: GroupedPart[] = []
    for (const part of reversedParts) {
        if (part.type === 'text') {
            // Get metadata from the message this part belongs to
            const metadata = messageMetadataMap.get(part.message_id || '')
            groups.push({ parts: [part], ...metadata }, { parts: [] })
        } else {
            // Ensure there's at least one group to add to
            if (groups.length === 0) {
                groups.push({ parts: [] })
            }
            groups[groups.length - 1].parts.push(part)
        }
    }

    return reverse(groups?.filter((group) => group.parts.length > 0))?.map(
        (group) => ({
            ...group,
            parts: reverse(group.parts)
        })
    )
}
