'use client'

import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import { type CSSProperties, type ElementType, type JSX, memo } from 'react'

export type TextShimmerProps = {
    children: string
    as?: ElementType
    className?: string
    duration?: number
    spread?: number
}

const ShimmerComponent = ({
    children,
    as: Component = 'span',
    className,
    duration = 2
}: TextShimmerProps) => {
    const MotionComponent = motion.create(
        Component as keyof JSX.IntrinsicElements
    )

    return (
        <MotionComponent
            animate={{ backgroundPosition: '200% center' }}
            className={cn(
                'relative inline-block bg-clip-text text-transparent',
                className
            )}
            initial={{ backgroundPosition: '0% center' }}
            style={
                {
                    backgroundImage:
                        'linear-gradient(90deg, #999999 0%, #999999 40%, #ffffff 50%, #999999 60%, #999999 100%)',
                    backgroundSize: '200% 100%',
                    backgroundRepeat: 'repeat'
                } as CSSProperties
            }
            transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration,
                ease: 'linear'
            }}
        >
            {children}
        </MotionComponent>
    )
}

export const Shimmer = memo(ShimmerComponent)
