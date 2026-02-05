import { useState } from 'react'

import { MCP_TOOLS } from '@/constants/mcp'
import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { IMCPTool } from '@/typings/agent'
import MCPTool from './mcp-tool'

interface McpSettingProps {
    className?: string
}

const McpSetting = ({ className }: McpSettingProps) => {
    const [selectedTool, setSelectedTool] = useState<IMCPTool>()
    const [isOpenMCPTool, setIsOpenMCPTool] = useState(false)

    return (
        <div className={`flex flex-col ${className}`}>
            <div>
                <p className="text-lg font-semibold dark:text-white">
                    MCP Integration Hub
                </p>
                <p className="mt-1 dark:text-white/[0.56] text-sm">
                    Connect all your third-party tools in the easiest way.
                </p>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4 flex-1">
                {MCP_TOOLS.map((tool) => (
                    <div
                        key={tool.name}
                        className="border-2 border-firefly dark:border-sky-blue rounded-xl p-[14px] cursor-pointer"
                        onClick={() => {
                            setSelectedTool(tool)
                            setIsOpenMCPTool(true)
                        }}
                    >
                        <img src={tool.logo} className="size-12" />
                        <p className="dark:text-white text-sm font-semibold mt-2">
                            {tool.name}
                        </p>
                        <p className="dark:text-white text-xs mt-1">
                            {tool.author}
                        </p>
                        <p className="text-black/[0.56] dark:text-white/[0.56] line-clamp-3 text-xs mt-2">
                            {tool.description}
                        </p>
                        <Button
                            className="h-[22px] bg-firefly dark:bg-sky-blue-2 text-sky-blue-2 dark:text-black gap-x-[6px] mt-3 text-xs rounded-full !font-normal"
                            onClick={() => window.open(tool.url, '_blank')}
                        >
                            <Icon
                                name="global"
                                className="size-4 fill-sky-blue-2 dark:fill-black"
                            />
                            Remote
                        </Button>
                    </div>
                ))}
            </div>
            <MCPTool
                open={isOpenMCPTool}
                onOpenChange={setIsOpenMCPTool}
                tool={selectedTool}
            />
        </div>
    )
}

export default McpSetting
