import { AGENT_TYPE } from '@/typings'
import { Button } from './ui/button'

interface SuggestionsProps {
    hidden?: boolean
    onSelect: (text: string) => void
    suggestions?: string[]
    agentType?: string | null
}

const DEFAULT_SUGGESTIONS: Partial<Record<AGENT_TYPE, string[]>> = {
    [AGENT_TYPE.GENERAL]: [
        'Build a landing page comparing AI coding assistants',
        'Design cyberpunk mech poster with brand markings',
        'Develop a responsive portfolio for generative art',
        'Design an interactive climate metrics dashboard site'
    ],
    [AGENT_TYPE.MEDIA]: [
        'Render cinematic perfume visuals on frosted glass',
        'Design cyberpunk mech poster with brand markings',
        'Shoot stop-motion clip highlighting product assembly',
        'Film 15s hairstyle demo with bold lighting shifts',
        'Draft surreal poster art for new headphones drop'
    ],
    [AGENT_TYPE.SLIDE]: [
        'Build a B2B software sales deck',
        'Create cybersecurity training slides',
        'Draft a startup funding pitch deck',
        'Explain AI impact on future work',
        'Outline a product launch update deck'
    ],
    [AGENT_TYPE.WEBSITE_BUILD]: [
        'Design an interactive climate metrics dashboard site',
        'Build a landing page comparing AI coding assistants',
        'Develop a responsive portfolio for generative art',
        'Build a searchable support workflow knowledge base'
    ]
}

const Suggestions = ({
    hidden,
    onSelect,
    suggestions,
    agentType = AGENT_TYPE.GENERAL
}: SuggestionsProps) => {
    const fallbackSuggestions = DEFAULT_SUGGESTIONS[AGENT_TYPE.GENERAL] ?? []
    const suggestionsToRender =
        suggestions ??
        DEFAULT_SUGGESTIONS[(agentType as AGENT_TYPE) ?? AGENT_TYPE.GENERAL] ??
        fallbackSuggestions

    if (hidden) return null
    return (
        <div className="hidden md:flex items-center flex-wrap max-h-[50px] overflow-auto gap-x-2 gap-y-[6px]">
            {suggestionsToRender.map((item) => (
                <Button
                    key={item}
                    className="text-xs bg-grey px-2 py-[3px] h-[22px] rounded-full text-black"
                    onClick={() => onSelect(item)}
                >
                    {item}
                </Button>
            ))}
        </div>
    )
}

export default Suggestions
