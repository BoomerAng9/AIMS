import { useEffect, useState } from 'react'

import { settingsService } from '@/services/settings.service'
import { useAppSelector } from '@/state'
import { ISetting } from '@/typings'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { Input } from '../ui/input'
import { Sheet, SheetClose, SheetContent, SheetHeader } from '../ui/sheet'
import dayjs from 'dayjs'

interface ClaudeCodeSettingProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSaveConfig: (data: ISetting) => void
}

const ClaudeCodeSetting = ({
    open,
    onOpenChange,
    onSaveConfig
}: ClaudeCodeSettingProps) => {
    const isSavingSetting = useAppSelector(
        (state) => state.settings.isSavingSetting
    )
    const currentSettingData = useAppSelector(
        (state) => state.settings.currentSettingData
    )
    const claudeCodeConfig = useAppSelector(
        (state) => state.settings.claudeCodeConfig
    )

    const [authCode, setAuthCode] = useState('')

    const handleCancel = () => {
        onOpenChange(false)
    }

    // Generate PKCE challenge
    const generatePKCE = () => {
        const verifier = Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')

        return verifier
    }

    const handleLoginWithClaude = () => {
        // Generate PKCE verifier
        const codeVerifier = generatePKCE()

        // Store the verifier for later use (you'll need this when handling the callback)
        sessionStorage.setItem('claude_pkce_verifier', codeVerifier)

        // Create SHA256 hash for code challenge
        const encoder = new TextEncoder()
        const data = encoder.encode(codeVerifier)

        crypto.subtle.digest('SHA-256', data).then((hashBuffer) => {
            const hashArray = Array.from(new Uint8Array(hashBuffer))
            const codeChallenge = btoa(String.fromCharCode(...hashArray))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '')

            // Build OAuth URL (using console mode)
            const oauthParams = new URLSearchParams({
                code: 'true',
                client_id: '9d1c250a-e61b-44d9-88ed-5944d1962f5e',
                response_type: 'code',
                redirect_uri:
                    'https://console.anthropic.com/oauth/code/callback',
                scope: 'org:create_api_key user:profile user:inference',
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
                state: codeVerifier
            })

            const oauthUrl = `https://claude.ai/oauth/authorize?${oauthParams.toString()}`

            // Open OAuth URL in new window
            window.open(oauthUrl, '_blank')
        })
    }

    const handleSaveConfig = async () => {
        // Require authorization code
        if (!authCode.trim()) {
            toast.warning('Please provide Authorization Code')
            return
        }

        try {
            // Get the stored PKCE verifier
            const verifier = sessionStorage.getItem('claude_pkce_verifier')
            if (!verifier) {
                toast.error(
                    'PKCE verifier not found. Please login with Claude again.'
                )
                return
            }

            // Build authorization code with verifier in format: code#verifier
            const authorizationCode = `${authCode.trim()}`

            // Use the settings service with the new configureClaudeCode method
            // This will create or update the Claude Code configuration and set is_active to true
            await settingsService.configureClaudeCode({
                authorization_code: authorizationCode
            })

            toast.success(
                'Claude Code configuration saved and activated successfully'
            )
            onOpenChange(false)

            // Clear the verifier from session storage
            sessionStorage.removeItem('claude_pkce_verifier')

            // Update the settings with claude_code enabled
            const newSettings = {
                ...currentSettingData,
                claude_code: true // Set to true since we just activated it
            }
            onSaveConfig(newSettings)
        } catch (error: unknown) {
            const apiError = error as {
                response?: { data?: { detail?: string } }
            }
            const errorMessage =
                apiError.response?.data?.detail ||
                'Failed to save Claude Code configuration'
            toast.error(errorMessage)
        }
    }

    useEffect(() => {
        // Clear auth code when dialog opens
        if (open) {
            setAuthCode('')
        }
    }, [open])

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="px-3 md:px-6 pt-3 md:pt-12 w-full !max-w-[560px]">
                <SheetHeader className="p-0 gap-6 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-x-2">
                            <Icon name="claude" className="size-9 md:size-12" />
                            <div className="space-y-1">
                                <p className="text-xl md:text-2xl font-semibold dark:text-white">
                                    Claude Code
                                </p>
                                <p className="text-sm md:text-base dark:text-white/[0.56]">
                                    Anthropic
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
                        Enable Claude Code for autonomous code generation and
                        review
                    </p>
                    <Button
                        className="h-[22px] bg-firefly dark:bg-sky-blue-2 text-sky-blue-2 dark:text-black gap-x-[6px] mt-4 text-xs rounded-full !font-normal"
                        onClick={() =>
                            window.open(
                                `https://www.anthropic.com/claude/code`,
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

                    <p className="dark:text-white text-lg font-semibold mt-6">
                        Credentials
                    </p>

                    <Button
                        type="button"
                        className="h-10 rounded-xl text-sm mt-3 bg-[#191918] dark:bg-white text-white dark:text-black border-0 gap-x-2"
                        onClick={handleLoginWithClaude}
                    >
                        <Icon name="claude" className="size-5" />
                        Login with Claude
                    </Button>

                    <div className="space-y-2 relative mt-3">
                        <Icon
                            name="key-square"
                            className={`absolute top-3 left-4 fill-black dark:fill-white ${authCode ? '' : 'opacity-30'}`}
                        />
                        <Input
                            id="auth-code"
                            className="pl-[56px]"
                            placeholder="Paste the authorization code here"
                            value={authCode}
                            onChange={(e) => setAuthCode(e.target.value)}
                        />
                    </div>
                    {claudeCodeConfig?.updated_at && (
                        <div className="mt-2 flex gap-x-2 items-center text-sm italic">
                            <span className="font-semibold">
                                Latest update:
                            </span>
                            <span>
                                {dayjs(claudeCodeConfig?.updated_at).format(
                                    'DD/MM/YYYY -- hh:mmA'
                                )}
                            </span>
                        </div>
                    )}
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

export default ClaudeCodeSetting
