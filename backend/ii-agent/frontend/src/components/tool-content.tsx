import { useMemo } from 'react'

import {
    ChainOfThoughtSearchResult,
    ChainOfThoughtSearchResults,
    ChainOfThoughtStep
} from '@/components/ai-elements/chain-of-thought'
import { Response } from '@/components/ai-elements/response'
import { ToolInput } from '@/components/ai-elements/tool'
import { parseJson } from '@/lib/utils'
import { ContentPart } from '@/utils/chat-events'
import { parseJSON } from '@/utils/string'
import {
    AlertCircleIcon,
    CodeIcon,
    GlobeIcon,
    ImageIcon,
    SearchIcon,
    WrenchIcon
} from 'lucide-react'

const getToolIcon = (toolName: string) => {
    switch (toolName) {
        case 'web_search':
            return SearchIcon
        case 'web_visit':
            return GlobeIcon
        case 'image_search':
            return ImageIcon
        case 'code_interpreter':
        case 'code_execution':
            return CodeIcon
        default:
            return WrenchIcon
    }
}

const getToolLabel = (
    toolName: string,
    parsedInput: Record<string, unknown>
) => {
    switch (toolName) {
        case 'web_search':
            return `Searching for ${parsedInput?.query || ''}`
        case 'web_visit':
            return `Visiting ${parsedInput?.url || ''}`
        case 'image_search':
            return `Searching images for ${parsedInput?.query || ''}`
        default:
            return `Using ${toolName}`
    }
}

interface ToolContentComponentProps {
    toolCall: ContentPart
    toolResult?: ContentPart
}

export const ToolContentComponent = ({
    toolCall,
    toolResult
}: ToolContentComponentProps) => {
    const parsedInput = useMemo(() => {
        try {
            if (toolCall.input) {
                return parseJSON(toolCall.input)
            }
        } catch {
            // If parsing fails, keep empty object
        }
        return {}
    }, [toolCall.input])

    const status = useMemo(
        () =>
            toolResult
                ? toolResult.is_error
                    ? 'complete'
                    : 'complete'
                : 'active',
        [toolResult]
    )

    const icon = useMemo(
        () =>
            toolResult?.is_error
                ? AlertCircleIcon
                : getToolIcon(toolCall.name || ''),
        [toolResult, toolCall.name]
    )

    const label = useMemo(
        () => getToolLabel(toolCall.name || '', parsedInput),
        [toolCall.name, parsedInput]
    )

    const output = useMemo(() => {
        const content =
            toolResult?.output || parseJSON(toolResult?.content || '')
        const result = content?.value

        if (toolCall.name === 'web_search') {
            if (!result) return null
            const search_results = parseJson(result)

            return (
                <ChainOfThoughtSearchResults>
                    {Array.isArray(search_results) &&
                        search_results?.map((item, index) => (
                            <ChainOfThoughtSearchResult key={index}>
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline"
                                >
                                    {item.title || new URL(item.url).hostname}
                                </a>
                            </ChainOfThoughtSearchResult>
                        ))}
                </ChainOfThoughtSearchResults>
            )
        }
        if (toolCall.name === 'web_visit') {
            if (!result) return null
            return (
                <Response className="text-black/56 dark:text-grey-2">
                    {result?.substring(0, 400)}
                </Response>
            )
        }
        if (toolCall.name === 'image_search') {
            if (!result) return null
            const search_results = parseJson(result)
            return (
                <div className="flex flex-wrap gap-2">
                    {Array.isArray(search_results) &&
                        search_results?.map((item, index) => (
                            <img
                                key={index}
                                src={item.image_url}
                                alt={`Image ${index + 1}`}
                                className="size-[200px] object-cover rounded-xl"
                            />
                        ))}
                </div>
            )
        }
        if (toolCall.name === 'code_interpreter') {
            if (!result) return null
            const code_result = parseJson(result)
            return <Response>{code_result?.answer}</Response>
        }
        if (toolCall.name === 'code_execution') {
            return <ToolInput className="p-0" input={parsedInput || {}} />
        }
        if (!result) return null
        return <Response>{result}</Response>
    }, [toolResult, toolCall.name, parsedInput])

    return (
        <ChainOfThoughtStep
            icon={icon}
            label={label}
            status={status}
            description={
                toolResult?.is_error ? 'Tool execution failed' : undefined
            }
        >
            {output}
        </ChainOfThoughtStep>
    )
}
