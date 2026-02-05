'use client'

import { cn } from '@/lib/utils'
import { type ComponentProps, memo } from 'react'
import { Streamdown, defaultRehypePlugins } from 'streamdown'
import { CustomCode } from './custom-code'

type ResponseProps = ComponentProps<typeof Streamdown>

export const Response = memo(
    ({ className, ...props }: ResponseProps) => (
        <Streamdown
            className={cn(
                'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-black dark:text-white',
                className
            )}
            rehypePlugins={[
                defaultRehypePlugins.raw,
                defaultRehypePlugins.katex
            ]}
            components={{
                code: CustomCode
            }}
            {...props}
        />
    ),
    (prevProps, nextProps) => prevProps.children === nextProps.children
)

Response.displayName = 'Response'
