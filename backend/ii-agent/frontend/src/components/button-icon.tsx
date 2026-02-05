import * as React from 'react'
import { Button } from './ui/button'
import { Icon } from './ui/icon'

interface ButtonIconProps extends React.ComponentProps<typeof Button> {
    name: string
    iconClassName?: string
}

const ButtonIcon = ({
    name,
    className,
    iconClassName,
    ...props
}: ButtonIconProps) => {
    return (
        <Button
            variant="secondary"
            size="icon"
            className={`size-7 bg-white dark:bg-sky-blue-3 rounded-full cursor-pointer ${className}`}
            {...props}
        >
            <Icon
                name={name}
                className={`size-[18px] fill-black ${iconClassName}`}
            />
        </Button>
    )
}

export default ButtonIcon
