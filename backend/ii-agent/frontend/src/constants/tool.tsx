import { AGENT_TYPE } from '@/typings'

export const INIT_TOOLS = [
    {
        name: 'Deep Research',
        description: 'Enable in-depth research capabilities',
        icon: 'search-status',
        isFill: true,
        isActive: false,
        isRequireKey: false
    },
    {
        name: 'Design Document',
        description:
            'Enable to make requirement and design documents before developing for full-stack web development',
        icon: 'note-2',
        isFill: false,
        isActive: false,
        isRequireKey: false
    },
    {
        name: 'Media Generation',
        description: 'Generate images and videos',
        icon: 'image',
        isFill: false,
        isActive: false,
        isRequireKey: false
    },
    {
        name: 'Browser',
        description:
            'Enable web browsing capabilities. Note: Available only for vision models.',
        icon: 'browser',
        isFill: false,
        isActive: true,
        isRequireKey: false
    },
    {
        name: 'Codex',
        description:
            'Enable OpenAI Codex for autonomous code generation and review',
        icon: 'codex',
        isFill: false,
        isActive: false,
        isRequireKey: true
    },
    {
        name: 'Claude Code',
        description: 'Enable Claude Code for autonomous code generation',
        icon: 'claude',
        isFill: false,
        isActive: false,
        isRequireKey: true
    }
]

export const CHAT_TOOLS = [
    {
        name: 'Web Search',
        description: 'Search the web for information',
        icon: 'search-status',
        isFill: true,
        isActive: false,
        isRequireKey: false
    },
    {
        name: 'Web Visit',
        description: 'Visit and browse web pages',
        icon: 'browser',
        isFill: false,
        isActive: false,
        isRequireKey: false
    },
    {
        name: 'Image Search',
        description: 'Search for images on the web',
        icon: 'image',
        isFill: false,
        isActive: false,
        isRequireKey: false
    },
    {
        name: 'Code Interpreter',
        description: 'Execute code for calculations, data analysis, and visualizations',
        icon: 'code',
        isFill: false,
        isActive: false,
        isRequireKey: false
    }
]

export const FEATURES = [
    {
        icon: 'gallery',
        name: 'Generate Image / Video',
        type: AGENT_TYPE.MEDIA
    },
    {
        icon: 'note-2',
        name: 'Create Slide',
        type: AGENT_TYPE.SLIDE
    },
    {
        icon: 'monitor',
        name: 'Create a Website',
        type: AGENT_TYPE.WEBSITE_BUILD
    },
    {
        icon: 'codex',
        name: 'Codex',
        type: AGENT_TYPE.CODEX
    },
    {
        icon: 'claude',
        name: 'Claude Code',
        type: AGENT_TYPE.CLAUDE_CODE
    }
]
