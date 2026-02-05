import { Button } from './ui/button'
import { Icon } from './ui/icon'
import { FEATURES } from '@/constants/tool'
import { AGENT_TYPE } from '@/typings'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from './ui/dropdown-menu'

interface FeatureSelectorProps {
    selectedFeature: string | null
    selectedTemplateName?: string | null
    hide?: boolean
    onRemove: () => void
    onSelect: (type: string) => void
}

const FeatureSelector = ({
    selectedFeature,
    selectedTemplateName,
    hide,
    onRemove,
    onSelect
}: FeatureSelectorProps) => {
    if (hide) return null

    if (selectedFeature && selectedFeature !== AGENT_TYPE.GENERAL) {
        return (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-[6px] bg-sky-blue text-black rounded-full text-xs px-2 h-7 pointer-events-none">
                    <span className="text-xs font-medium">
                        {
                            FEATURES.find(
                                (feature) => feature.type === selectedFeature
                            )?.name
                        }
                    </span>
                    <button
                        onClick={onRemove}
                        className="cursor-pointer pointer-events-auto"
                    >
                        <Icon name="cancel" className="size-4 fill-black" />
                    </button>
                </div>
                {selectedFeature === AGENT_TYPE.SLIDE && selectedTemplateName && (
                    <div className="flex items-center gap-1 bg-sky-blue text-black rounded-full text-xs px-2 h-7">
                        <Icon name="slide" className="size-3 fill-black" />
                        <span className="text-xs font-medium hidden lg:inline">
                            Using template: {selectedTemplateName}
                        </span>
                        <span className="text-xs font-medium lg:hidden">
                            Template
                        </span>
                    </div>
                )}
            </div>
        )
    }

    return null

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="secondary"
                    size="icon"
                    className={`size-7 bg-white dark:bg-sky-blue rounded-full cursor-pointer`}
                >
                    <Icon
                        name="dashboard-2"
                        className={`size-[18px] stroke-black`}
                    />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[233px]">
                {FEATURES.map((feature) => (
                    <DropdownMenuItem
                        key={feature.name}
                        onClick={() => onSelect(feature.type)}
                        className="cursor-pointer"
                    >
                        <Icon
                            name={feature.icon}
                            className="size-5 fill-black"
                        />
                        {feature.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default FeatureSelector
