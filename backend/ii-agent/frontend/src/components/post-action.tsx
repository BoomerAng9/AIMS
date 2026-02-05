import {
    CopyIcon,
    RefreshCcwIcon,
    ShareIcon,
    ThumbsDownIcon,
    ThumbsUpIcon
} from 'lucide-react'
import { Action, Actions } from './ai-elements/actions'

const PostAction = () => {
    const handleRetry = () => {}
    const handleCopy = () => {}
    const handleShare = () => {}
    const handleLike = () => {}
    const handleDislike = () => {}

    const actions = [
        {
            icon: RefreshCcwIcon,
            label: 'Retry',
            onClick: () => handleRetry()
        },
        {
            icon: ThumbsUpIcon,
            label: 'Like',
            onClick: () => handleLike()
        },
        {
            icon: ThumbsDownIcon,
            label: 'Dislike',
            onClick: () => handleDislike()
        },
        {
            icon: CopyIcon,
            label: 'Copy',
            onClick: () => handleCopy()
        },
        {
            icon: ShareIcon,
            label: 'Share',
            onClick: () => handleShare()
        }
    ]

    return (
        <Actions className="mt-2 -ml-2">
            {actions.map((action) => (
                <Action key={action.label} label={action.label}>
                    <action.icon className="size-4" />
                </Action>
            ))}
        </Actions>
    )
}

export default PostAction
