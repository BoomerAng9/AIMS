import { Button } from './ui/button'
import { Icon } from './ui/icon'
import { QUESTION_MODE } from '@/typings'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from './ui/dropdown-menu'

interface ModeSelectorProps {
    selectedMode: QUESTION_MODE
    hide?: boolean
    onSelect: (mode: QUESTION_MODE) => void
}

const ModeSelector = ({ selectedMode, hide, onSelect }: ModeSelectorProps) => {
    if (hide) return null

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="secondary"
                    size="icon"
                    className={`text-xs px-2 w-auto h-7 bg-white dark:bg-sky-blue text-black rounded-full cursor-pointer`}
                >
                    {selectedMode === QUESTION_MODE.AGENT
                        ? 'Agent Mode'
                        : 'Chat Mode'}
                    <Icon name="arrow-down" className="fill-black" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[180px] p-2">
                <DropdownMenuItem
                    onClick={() => onSelect(QUESTION_MODE.AGENT)}
                    className="cursor-pointer"
                >
                    <Icon name="agent" className="size-6 stroke-black" />
                    Agent Mode
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => onSelect(QUESTION_MODE.CHAT)}
                    className="cursor-pointer"
                >
                    <Icon name="chat" className="size-5 fill-black ml-px" />
                    Chat Mode
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default ModeSelector
