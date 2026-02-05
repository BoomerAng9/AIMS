import { useEffect, useState } from 'react'

import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { Sheet, SheetClose, SheetContent, SheetHeader } from '../ui/sheet'
import { Textarea } from '../ui/textarea'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../ui/select'
import { ISetting } from '@/typings'
import { useAppSelector } from '@/state'
import { settingsService } from '@/services/settings.service'
import { toast } from 'sonner'

interface CodexSettingProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSaveConfig: (data: ISetting) => void
}

const CodexSetting = ({
    open,
    onOpenChange,
    onSaveConfig
}: CodexSettingProps) => {
    const isSavingSetting = useAppSelector(
        (state) => state.settings.isSavingSetting
    )
    const currentSettingData = useAppSelector(
        (state) => state.settings.currentSettingData
    )

    const [authJson, setAuthJson] = useState('')
    const [model, setModel] = useState('gpt-5')
    const [apiKey, setApiKey] = useState('')
    const [reasoningEffort, setReasoningEffort] = useState<string>('medium')
    const [searchEnabled, setSearchEnabled] = useState<boolean>(false)

    const handleCancel = () => {
        onOpenChange(false)
    }

    const handleSaveConfig = async () => {
        // Require at least one of authJson or apiKey
        if (!authJson.trim() && !apiKey.trim()) {
            toast.warning('Please provide either Auth JSON or API Key')
            return
        }

        // Build payload conditionally
        const payload: {
            auth_json?: Record<string, unknown>
            model?: string
            apikey?: string
            model_reasoning_effort?: string
            search?: boolean
        } = {}

        // Validate and attach auth_json only if provided
        if (authJson.trim()) {
            try {
                payload.auth_json = JSON.parse(authJson)
            } catch {
                toast.warning('Invalid JSON format for auth configuration')
                return
            }
        }

        if (model.trim()) payload.model = model.trim()
        if (apiKey.trim()) payload.apikey = apiKey.trim()
        payload.model_reasoning_effort = reasoningEffort
        payload.search = searchEnabled

        try {
            // Use the settings service with the new configureCodex method
            // This will create or update the Codex configuration and set is_active to true
            await settingsService.configureCodex(payload)
            toast.success(
                'Codex configuration saved and activated successfully'
            )
            onOpenChange(false)

            // Update the settings with codex_tools enabled
            const newSettings = {
                ...currentSettingData,
                codex_tools: true // Set to true since we just activated it
            }
            onSaveConfig(newSettings)
        } catch (error: unknown) {
            console.error('Error saving Codex configuration:', error)
            const apiError = error as {
                response?: { data?: { detail?: string } }
            }
            const errorMessage =
                apiError.response?.data?.detail ||
                'Failed to save Codex configuration'
            toast.error(errorMessage)
        }
    }

    useEffect(() => {
        // Load existing Codex settings when component opens
        const loadCodexSettings = async () => {
            if (open) {
                try {
                    const codexSetting =
                        await settingsService.getCodexSettings()

                    if (codexSetting) {
                        if (codexSetting.metadata) {
                            if (codexSetting.metadata.auth_json) {
                                setAuthJson(
                                    JSON.stringify(
                                        codexSetting.metadata.auth_json,
                                        null,
                                        2
                                    )
                                )
                            } else {
                                setAuthJson('')
                            }

                            if (codexSetting.metadata.model) {
                                setModel(codexSetting.metadata.model)
                            }

                            if (codexSetting.metadata.apikey) {
                                setApiKey(codexSetting.metadata.apikey)
                            } else {
                                setApiKey('')
                            }

                            // Set reasoning effort and search from metadata
                            if (codexSetting.metadata.model_reasoning_effort) {
                                setReasoningEffort(
                                    codexSetting.metadata.model_reasoning_effort
                                )
                            } else {
                                setReasoningEffort('medium')
                            }

                            if (codexSetting.metadata.search !== undefined) {
                                setSearchEnabled(codexSetting.metadata.search)
                            } else {
                                setSearchEnabled(false)
                            }
                        } else {
                            setAuthJson('')
                            setApiKey('')
                            setReasoningEffort('medium')
                            setSearchEnabled(false)
                        }
                    } else {
                        // Clear fields if no existing settings
                        setAuthJson('')
                        setApiKey('')
                        setReasoningEffort('medium')
                        setSearchEnabled(false)
                    }
                } catch (error) {
                    console.error('Error loading Codex settings:', error)
                }
            }
        }

        loadCodexSettings()
    }, [open])

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="px-3 md:px-6 pt-3 md:pt-12 w-full !max-w-[560px]">
                <SheetHeader className="p-0 gap-6 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-x-2">
                            <Icon name="codex" className="size-12" />
                            <div className="md:space-y-1">
                                <p className="text-xl md:text-2xl font-semibold dark:text-white">
                                    Codex
                                </p>
                                <p className="text-sm md:text-base dark:text-white/[0.56]">
                                    OpenAI
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
                        Enable OpenAI Codex for autonomous code generation and
                        review
                    </p>
                    <Button
                        className="h-[22px] bg-firefly dark:bg-sky-blue-2 text-sky-blue-2 dark:text-black gap-x-[6px] mt-4 text-xs rounded-full !font-normal"
                        onClick={() =>
                            window.open(
                                `https://openai.com/vi-VN/codex/`,
                                '_blank'
                            )
                        }
                    >
                        <Icon
                            name="global"
                            className="size-4 fill-sky-blue-2 dark:fill-black"
                        />
                        Remote
                    </Button>
                    <div className="mt-6 space-y-4">
                        <div className="space-y-2">
                            <Label
                                htmlFor="codex-model"
                                className="dark:text-white text-sm"
                            >
                                Model
                            </Label>
                            <Select value={model} onValueChange={setModel}>
                                <SelectTrigger
                                    id="codex-model"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Select model" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gpt-5">gpt-5</SelectItem>
                                    <SelectItem value="gpt-5-codex">
                                        gpt-5-codex
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-2xl bg-firefly/10 dark:bg-sky-blue-2/5">
                            <div className="flex-1">
                                <p className="text-base font-semibold dark:text-white">
                                    Enable Search
                                </p>
                                <p className="mt-1 dark:text-white/[0.56] text-sm">
                                    Allow Codex to search for additional context
                                </p>
                            </div>
                            <Switch
                                checked={searchEnabled}
                                onCheckedChange={setSearchEnabled}
                            />
                        </div>
                    </div>

                    <p className="dark:text-white text-lg font-semibold mt-6">
                        Auth Json
                    </p>
                    <p className="text-sm mt-3">
                        Find your auth json at ~/.codex/auth.json (on Windows:
                        C://Users/USERNAME/.codex/auth.json)
                    </p>

                    <div className="space-y-2 relative mt-3">
                        <Icon
                            name="key-square"
                            className={`absolute top-3 left-4 fill-black dark:fill-white ${authJson ? '' : 'opacity-30'}`}
                        />
                        <Textarea
                            id="auth-json"
                            className="pl-[56px] min-h-[144px] mb-4"
                            placeholder="Enter Codex Auth Json"
                            value={authJson}
                            onChange={(e) => setAuthJson(e.target.value)}
                        />
                    </div>

                    <div className="mt-6 space-y-4">
                        <div className="space-y-2">
                            <Label
                                htmlFor="codex-apikey"
                                className="dark:text-white text-sm"
                            >
                                API Key
                            </Label>
                            <Input
                                id="codex-apikey"
                                type="password"
                                placeholder="Enter API Key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-4 grid grid-cols-2 gap-4 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-12 rounded-xl text-base"
                            onClick={handleCancel}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="h-12 rounded-xl bg-sky-blue text-black text-base"
                            disabled={isSavingSetting}
                            onClick={() => handleSaveConfig()}
                        >
                            {isSavingSetting ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default CodexSetting
