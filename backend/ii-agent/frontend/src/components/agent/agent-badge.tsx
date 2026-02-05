'use client'

import { Bot, Cpu } from 'lucide-react'
import { AgentContext } from '@/typings/agent'

interface AgentBadgeProps {
    agentContext: AgentContext
    size?: 'sm' | 'md' | 'lg'
}

const AgentBadge = ({
    agentContext,
    size = 'sm'
}: AgentBadgeProps) => {
    // Size configurations
    const sizeConfig = {
        sm: {
            badge: 'px-2 py-1 text-xs leading-none',
            icon: 'size-3',
            gap: 'gap-1'
        },
        md: {
            badge: 'px-3 py-1 text-sm',
            icon: 'size-4',
            gap: 'gap-1.5'
        },
        lg: {
            badge: 'px-4 py-1.5 text-base',
            icon: 'size-5',
            gap: 'gap-2'
        }
    }

    // Consistent color scheme for all agent types
    const getColorScheme = () => {
        if (agentContext.agentType === 'main') {
            return 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
        }

        // Consistent color for all subagents
        return 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
    }

    const config = sizeConfig[size]
    const colorScheme = getColorScheme()
    const Icon = agentContext.agentType === 'main' ? Cpu : Bot

    return (
        <div
            className={`
                inline-flex items-center justify-center ${config.gap} ${config.badge} ${colorScheme}
                rounded-full font-medium shadow-sm
            `}
        >
            <Icon className={config.icon} />
            <span>
                {agentContext.agentName ||
                 (agentContext.agentType === 'main' ? 'Main Agent' : 'Sub Agent')}
            </span>
        </div>
    )
}

export default AgentBadge