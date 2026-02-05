'use client'

import { useControllableState } from '@radix-ui/react-use-controllable-state'
import { Badge } from '@/components/ui/badge'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { DotIcon, Loader2, type LucideIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { createContext, memo, useContext, useMemo } from 'react'
import { Icon } from '../ui/icon'
import { Shimmer } from './shimmer'

type ChainOfThoughtContextValue = {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    isStreaming: boolean
}

const ChainOfThoughtContext = createContext<ChainOfThoughtContextValue | null>(
    null
)

const useChainOfThought = () => {
    const context = useContext(ChainOfThoughtContext)
    if (!context) {
        throw new Error(
            'ChainOfThought components must be used within ChainOfThought'
        )
    }
    return context
}

export type ChainOfThoughtProps = ComponentProps<'div'> & {
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean) => void
    isStreaming?: boolean
}

export const ChainOfThought = memo(
    ({
        className,
        open,
        defaultOpen = false,
        onOpenChange,
        isStreaming = false,
        children,
        ...props
    }: ChainOfThoughtProps) => {
        const [isOpen, setIsOpen] = useControllableState({
            prop: open,
            defaultProp: defaultOpen,
            onChange: onOpenChange
        })

        const chainOfThoughtContext = useMemo(
            () => ({ isOpen, setIsOpen, isStreaming }),
            [isOpen, setIsOpen, isStreaming]
        )

        return (
            <ChainOfThoughtContext.Provider value={chainOfThoughtContext}>
                <div
                    className={cn('not-prose max-w-prose space-y-4', className)}
                    {...props}
                >
                    {children}
                </div>
            </ChainOfThoughtContext.Provider>
        )
    }
)

export type ChainOfThoughtHeaderProps = ComponentProps<
    typeof CollapsibleTrigger
>

export const ChainOfThoughtHeader = memo(
    ({ className, children, ...props }: ChainOfThoughtHeaderProps) => {
        const { isOpen, setIsOpen, isStreaming } = useChainOfThought()

        return (
            <Collapsible
                className={cn({ 'mb-0': !isOpen })}
                onOpenChange={setIsOpen}
                open={isOpen}
            >
                <CollapsibleTrigger
                    className={cn(
                        'flex w-fit items-center gap-2 text-sm rounded-full',
                        className
                    )}
                    {...props}
                >
                    <Icon
                        name="brain"
                        className="size-4 stroke-black/50 dark:stroke-white/50"
                    />
                    <span className="flex-1 text-left text-black/50 dark:text-white/50">
                        {children ??
                            (isStreaming ? (
                                <Shimmer duration={1}>Thinking...</Shimmer>
                            ) : (
                                'Thought'
                            ))}
                    </span>
                    <Icon
                        name="arrow-down"
                        className={cn(
                            'size-4 transition-transform stroke-black/50 dark:stroke-white/50',
                            isOpen ? 'rotate-0' : '-rotate-90'
                        )}
                    />
                </CollapsibleTrigger>
            </Collapsible>
        )
    }
)

export type ChainOfThoughtStepProps = ComponentProps<'div'> & {
    icon?: LucideIcon
    label: string
    description?: string
    status?: 'complete' | 'active' | 'pending'
}

export const ChainOfThoughtStep = memo(
    ({
        className,
        icon: Icon = DotIcon,
        label,
        description,
        status = 'complete',
        children,
        ...props
    }: ChainOfThoughtStepProps) => {
        const statusStyles = {
            complete: 'text-black/56 dark:text-grey-2',
            active: 'text-black/56 dark:text-grey-2',
            pending: 'text-black/56 dark:text-grey-2'
        }

        return (
            <div
                className={cn(
                    'flex gap-2 text-sm',
                    statusStyles[status],
                    'fade-in-0 slide-in-from-top-2 animate-in',
                    className
                )}
                {...props}
            >
                <div className="relative mt-0.5">
                    {status === 'active' ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <Icon className="size-4" />
                    )}
                    <div className="-mx-px absolute top-7 bottom-0 left-1/2 w-px bg-black dark:bg-grey-2" />
                </div>
                <div className="flex-1 space-y-2">
                    <div>{label}</div>
                    {description && (
                        <div className="text-xs">{description}</div>
                    )}
                    {children}
                </div>
            </div>
        )
    }
)

export type ChainOfThoughtSearchResultsProps = ComponentProps<'div'>

export const ChainOfThoughtSearchResults = memo(
    ({ className, ...props }: ChainOfThoughtSearchResultsProps) => (
        <div className={cn('flex flex-col gap-2', className)} {...props} />
    )
)

export type ChainOfThoughtSearchResultProps = ComponentProps<typeof Badge>

export const ChainOfThoughtSearchResult = memo(
    ({ className, children, ...props }: ChainOfThoughtSearchResultProps) => (
        <Badge
            className={cn('gap-1 px-2 py-0.5 font-normal text-xs', className)}
            variant="secondary"
            {...props}
        >
            {children}
        </Badge>
    )
)

export type ChainOfThoughtContentProps = ComponentProps<
    typeof CollapsibleContent
>

export const ChainOfThoughtContent = memo(
    ({ className, children, ...props }: ChainOfThoughtContentProps) => {
        const { isOpen } = useChainOfThought()

        return (
            <Collapsible open={isOpen}>
                <CollapsibleContent
                    className={cn(
                        'mt-2 space-y-3',
                        'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-red outline-none data-[state=closed]:animate-out data-[state=open]:animate-in',
                        className
                    )}
                    {...props}
                >
                    {children}
                </CollapsibleContent>
            </Collapsible>
        )
    }
)

export type ChainOfThoughtImageProps = ComponentProps<'div'> & {
    caption?: string
}

export const ChainOfThoughtImage = memo(
    ({ className, children, caption, ...props }: ChainOfThoughtImageProps) => (
        <div className={cn('mt-2 space-y-2', className)} {...props}>
            <div className="relative flex max-h-[22rem] items-center justify-center overflow-hidden rounded-lg bg-muted p-3">
                {children}
            </div>
            {caption && (
                <p className="text-muted-foreground text-xs">{caption}</p>
            )}
        </div>
    )
)

ChainOfThought.displayName = 'ChainOfThought'
ChainOfThoughtHeader.displayName = 'ChainOfThoughtHeader'
ChainOfThoughtStep.displayName = 'ChainOfThoughtStep'
ChainOfThoughtSearchResults.displayName = 'ChainOfThoughtSearchResults'
ChainOfThoughtSearchResult.displayName = 'ChainOfThoughtSearchResult'
ChainOfThoughtContent.displayName = 'ChainOfThoughtContent'
ChainOfThoughtImage.displayName = 'ChainOfThoughtImage'
