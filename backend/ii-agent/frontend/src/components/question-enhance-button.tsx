import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import ButtonIcon from './button-icon'
import { Icon } from './ui/icon'

interface EnhanceButtonProps {
  isGenerating: boolean
  disabled: boolean
  onClick?: () => void
}

const EnhanceButton = ({ isGenerating, disabled, onClick }: EnhanceButtonProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {isGenerating ? (
          <Icon name="loading" className="animate-spin size-7 fill-black dark:fill-white" />
        ) : (
          <ButtonIcon name="magic-pen" onClick={onClick} disabled={disabled} />
        )}
      </TooltipTrigger>
      <TooltipContent>Enhance Prompt</TooltipContent>
    </Tooltip>
  )
}

export default EnhanceButton

