import { useState, useEffect } from 'react'
import { toast } from 'sonner'

import { IMCPTool } from '@/typings/agent'
import { Icon } from '../ui/icon'
import { Sheet, SheetClose, SheetContent, SheetHeader } from '../ui/sheet'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

interface MCPServerConfig {
    command?: string
    args?: string[]
    capabilities?: string[]
    env?: Record<string, string>
    url?: string
    headers?: Record<string, string>
}

interface MCPConfig {
    mcpServers?: Record<string, MCPServerConfig>
    servers?: Record<string, MCPServerConfig>
}

enum STEP {
    CONFIG_ENV = 'config_env',
    SHOW_CONFIG = 'show_config'
}

interface MCPToolProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    tool: IMCPTool | undefined
}

const MCPTool = ({ open, onOpenChange, tool }: MCPToolProps) => {
    const [step, setStep] = useState(STEP.CONFIG_ENV)
    const [envVars, setEnvVars] = useState<Record<string, string>>({})
    const [updatedConfig, setUpdatedConfig] = useState<MCPConfig | null>(null)

    // Initialize step based on tool.isRequireKey
    useEffect(() => {
        if (tool) {
            setStep(tool.isRequireKey ? STEP.CONFIG_ENV : STEP.SHOW_CONFIG)

            // Initialize environment variables from tool config
            const config = tool.config as MCPConfig
            const mcpServers = config.mcpServers || config.servers
            if (mcpServers) {
                const serverKey = Object.keys(mcpServers)[0]
                const env = mcpServers[serverKey]?.env || {}
                setEnvVars(env)
            }
        }
    }, [tool])

    const handleEnvChange = (key: string, value: string) => {
        setEnvVars((prev) => ({
            ...prev,
            [key]: value
        }))
    }

    const handleSaveEnv = () => {
        if (!tool) return

        // Update the config with new environment variables
        const config = tool.config as MCPConfig
        const existingServers = config.mcpServers || config.servers || {}
        const serverKey = Object.keys(existingServers)[0]

        if (serverKey && existingServers[serverKey]) {
            const updatedServers = {
                ...existingServers,
                [serverKey]: {
                    ...existingServers[serverKey],
                    env: envVars
                }
            }

            const newConfig: MCPConfig = {
                ...config,
                ...(config.mcpServers
                    ? { mcpServers: updatedServers }
                    : { servers: updatedServers })
            }

            setUpdatedConfig(newConfig)
            setStep(STEP.SHOW_CONFIG)
        }
    }

    const handleCopy = () => {
        const configToUse = updatedConfig || tool?.config
        const config = JSON.stringify(configToUse, null, 2)
        if (!config) return
        navigator.clipboard.writeText(config)
        toast.success('Copied to clipboard')
    }

    if (!tool) return <></>

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="px-3 md:px-6 pt-3 md:pt-12 w-full !max-w-[560px]">
                <SheetHeader className="p-0 gap-6 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-x-2">
                            <img src={tool.logo} className="size-12" />
                            <div className="space-y-1">
                                <p className="text-2xl font-semibold dark:text-white">
                                    {tool.name}
                                </p>
                                <p className="text-base dark:text-white/[0.56]">
                                    {tool.author}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-x-4">
                            <SheetClose className="cursor-pointer">
                                <Icon
                                    name="arrow-right"
                                    className="dark:inline hidden"
                                />
                                <Icon
                                    name="arrow-right-dark"
                                    className="dark:hidden inline"
                                />
                            </SheetClose>
                        </div>
                    </div>
                </SheetHeader>
                <div className="overflow-auto pb-4 md:pb-12">
                    <p className="dark:text-white text-lg font-semibold">
                        About
                    </p>
                    <p className="dark:text-white text-sm mt-3">
                        {tool.description}
                    </p>
                    <Button
                        className="h-[22px] bg-firefly dark:bg-sky-blue-2 text-sky-blue-2 dark:text-black gap-x-[6px] mt-4 text-xs rounded-full !font-normal"
                        onClick={() => window.open(tool.url, '_blank')}
                    >
                        <Icon
                            name="global"
                            className="size-4 fill-sky-blue-2 dark:fill-black"
                        />
                        Remote
                    </Button>
                    <p className="dark:text-white text-lg font-semibold mt-6">
                        JSON Configuration
                    </p>
                    <p className="dark:text-white text-sm mt-3">
                        Add this configuration to your MCP client settings
                    </p>
                    {step === STEP.CONFIG_ENV && (
                        <div>
                            <div className="flex items-center gap-x-2 mt-6">
                                <img
                                    src="/images/logo-only.png"
                                    alt="Logo"
                                    width={40}
                                    height={40}
                                    className="rounded-sm hidden dark:inline"
                                />
                                <img
                                    src="/images/logo-charcoal.svg"
                                    alt="Logo"
                                    width={40}
                                    height={40}
                                    className="rounded-sm dark:hidden"
                                />
                                <Icon
                                    name="arrange-square"
                                    className="size-6 fill-black dark:fill-white"
                                />
                                <img
                                    src={tool.logo}
                                    className="size-10"
                                    alt={tool.name}
                                />
                            </div>
                            <p className="mt-3 dark:text-white font-semibold text-sm">
                                Connect to {tool.name}
                            </p>
                            <div className="mt-6 space-y-4">
                                <p className="dark:text-white text-sm">
                                    Configure the environment variables required
                                    for {tool.name}:
                                </p>
                                {Object.entries(envVars).map(([key, value]) => (
                                    <div key={key} className="space-y-2">
                                        <Label
                                            htmlFor={key}
                                            className="dark:text-white text-sm"
                                        >
                                            {key}
                                        </Label>
                                        <Input
                                            id={key}
                                            type={
                                                key
                                                    .toLowerCase()
                                                    .includes('key') ||
                                                key
                                                    .toLowerCase()
                                                    .includes('token')
                                                    ? 'password'
                                                    : 'text'
                                            }
                                            value={value}
                                            onChange={(e) =>
                                                handleEnvChange(
                                                    key,
                                                    e.target.value
                                                )
                                            }
                                            placeholder={`Enter ${key}`}
                                        />
                                    </div>
                                ))}
                                <Button
                                    onClick={handleSaveEnv}
                                    className="w-full max-w-[209px] rounded-xl bg-firefly dark:bg-sky-blue-2 text-sky-blue-2 dark:text-black mt-10 text-base font-semibold h-12"
                                >
                                    Connect
                                </Button>
                            </div>
                        </div>
                    )}
                    {step === STEP.SHOW_CONFIG && (
                        <div>
                            <div className="mt-4 border border-grey p-4 bg-grey-3 dark:bg-sky-blue-2/10 rounded-xl">
                                <div className="pb-4 flex items-center justify-between dark:text-white border-b border-black/30 dark:border-white/50">
                                    <div className="flex items-center gap-x-2">
                                        <Icon
                                            name="code-circle"
                                            className="fill-black dark:fill-white"
                                        />
                                        <span>
                                            {Object.keys(
                                                (
                                                    (updatedConfig ||
                                                        tool.config) as MCPConfig
                                                )?.mcpServers ||
                                                    (
                                                        (updatedConfig ||
                                                            tool.config) as MCPConfig
                                                    )?.servers ||
                                                    {}
                                            )}
                                        </span>
                                    </div>
                                    <Button
                                        className="h-6 bg-firefly dark:bg-sky-blue-2 text-sky-blue-2 dark:text-black gap-x-[6px] text-xs rounded-sm !font-normal"
                                        onClick={handleCopy}
                                    >
                                        <Icon
                                            name="copy"
                                            className="size-4 fill-sky-blue-2 dark:fill-black"
                                        />
                                        Copy
                                    </Button>
                                </div>
                                <div className="pt-4">
                                    <pre className="text-sm">
                                        {JSON.stringify(
                                            updatedConfig || tool.config,
                                            null,
                                            2
                                        )}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default MCPTool
