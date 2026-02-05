import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ACCESS_TOKEN } from '@/constants/auth'
import { authService } from '@/services/auth.service'
import { useAppDispatch } from '@/state/store'
import { setUser } from '@/state/slice/user'
import { fetchWishlist } from '@/state/slice/favorites'
import { toast } from 'sonner'

// Check if Google OAuth is available
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const FormSchema = z.object({
    email: z.email({ error: 'Invalid email address' }),
    password: z.string({ error: 'Password is required' }).min(6, {
        message: 'Password must be at least 6 characters'
    })
})

type IiAuthPayload = {
    access_token: string
    refresh_token?: string
    token_type?: string
    expires_in?: number
}

// Separate Google Login Button component - only rendered when Google OAuth is available
function GoogleLoginButton({ onSuccess, onError }: { 
    onSuccess: (code: string) => Promise<void>
    onError: (error: unknown) => void 
}) {
    try {
        const { useGoogleLogin } = require('@react-oauth/google')
        
        const googleLogin = useGoogleLogin({
            flow: 'auth-code',
            onSuccess: async (codeResponse: { code: string }) => {
                await onSuccess(codeResponse.code)
            },
            onError: onError
        })

        return (
            <Button
                size="xl"
                onClick={() => googleLogin()}
                className="w-full bg-white/10 backdrop-blur-sm border border-amber-500/30 text-white font-semibold hover:bg-amber-500/20 transition-all duration-300"
            >
                <Icon name="google" className="size-[22px]" />
                Continue with Google
            </Button>
        )
    } catch {
        return null
    }
}

export function LoginPage() {
    const navigate = useNavigate()
    const { loginWithAuthCode } = useAuth()
    const dispatch = useAppDispatch()
    const [showEmailForm, setShowEmailForm] = useState(false)

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            email: '',
            password: ''
        }
    })

    const handleGoogleSuccess = useCallback(async (code: string) => {
        try {
            await loginWithAuthCode(code)
            navigate('/')
        } catch (error: unknown) {
            const apiError = error as {
                response: { data: { detail: string } }
            }
            const errorMessage =
                typeof apiError?.response?.data?.detail === 'string'
                    ? apiError.response.data.detail
                    : 'Login failed. Please try again.'
            if (errorMessage?.includes('beta')) {
                toast.info(errorMessage)
            } else {
                toast.error(errorMessage)
            }
        }
    }, [loginWithAuthCode, navigate])

    const handleGoogleError = useCallback((errorResponse: unknown) => {
        console.log('Login Failed:', errorResponse)
    }, [])

    const apiBaseUrl = useMemo(
        () => import.meta.env.VITE_API_URL || 'http://localhost:8000',
        []
    )
    const apiOrigin = useMemo(() => {
        try {
            return new URL(apiBaseUrl).origin
        } catch (error) {
            console.error('Invalid API base URL:', error)
            return apiBaseUrl
        }
    }, [apiBaseUrl])

    const authHandledRef = useRef(false)

    const handleAuthSuccess = useCallback(
        async (payload: IiAuthPayload | null | undefined) => {
            if (!payload || typeof payload.access_token !== 'string') {
                authHandledRef.current = false
                return
            }

            if (authHandledRef.current) {
                return
            }
            authHandledRef.current = true

            try {
                localStorage.setItem(ACCESS_TOKEN, payload.access_token)
                window.dispatchEvent(new CustomEvent('auth-token-set'))

                const userRes = await authService.getCurrentUser()
                dispatch(setUser(userRes))
                dispatch(fetchWishlist())

                navigate('/')
            } catch (error) {
                console.error('Failed to finalize login:', error)
                authHandledRef.current = false
            }
        },
        [dispatch, navigate]
    )

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.origin !== apiOrigin) {
                return
            }

            const data = event.data as {
                type?: string
                payload?: IiAuthPayload
            }

            if (!data || data.type !== 'ii-auth-success') {
                return
            }

            void handleAuthSuccess(data.payload)
        }

        window.addEventListener('message', handler)
        return () => window.removeEventListener('message', handler)
    }, [apiOrigin, handleAuthSuccess])

    useEffect(() => {
        const hash = window.location.hash
        if (!hash || !hash.includes('ii-auth=')) {
            return
        }

        const params = new URLSearchParams(hash.slice(1))
        const encoded = params.get('ii-auth')
        params.delete('ii-auth')

        const cleanHash = params.toString()
        const cleanUrl = `${window.location.pathname}${window.location.search}${cleanHash ? `#${cleanHash}` : ''}`
        window.history.replaceState(null, '', cleanUrl)

        if (!encoded) {
            return
        }

        try {
            const payload = JSON.parse(
                decodeURIComponent(encoded)
            ) as IiAuthPayload
            void handleAuthSuccess(payload)
        } catch (error) {
            console.error('Failed to parse auth payload from hash:', error)
            authHandledRef.current = false
        }
    }, [handleAuthSuccess])

    const loginWithAcheevy = useCallback(() => {
        authHandledRef.current = false

        const url = new URL('/auth/oauth/ii/login', apiBaseUrl)
        url.searchParams.set('return_to', window.location.href)

        const width = 500
        const height = 700
        const left = window.screenX + (window.outerWidth - width) / 2
        const top = window.screenY + (window.outerHeight - height) / 2

        const features = [
            `width=${Math.max(400, Math.floor(width))}`,
            `height=${Math.max(500, Math.floor(height))}`,
            `left=${Math.max(0, Math.floor(left))}`,
            `top=${Math.max(0, Math.floor(top))}`,
            'resizable=yes',
            'scrollbars=yes'
        ].join(',')

        const popup = window.open(url.toString(), 'acheevy-login', features)

        if (!popup) {
            window.location.href = url.toString()
            return
        }

        popup.focus()
    }, [apiBaseUrl])

    const onSubmit = async (data: z.infer<typeof FormSchema>) => {
        console.log(data)
        // TODO: Implement email/password login
    }

    return (
        <div className="min-h-screen w-full flex">
            {/* Left Panel - Hero Image */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
                {/* Background Image */}
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('/images/acheevy-hero.png')" }}
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-slate-950/90" />
                
                {/* Bottom Gradient */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
                
                {/* Floating Elements */}
                <div className="absolute bottom-8 left-8 z-10">
                    <p 
                        className="text-amber-400 text-sm font-medium mb-1"
                        style={{ fontFamily: '"Doto", sans-serif' }}
                    >
                        POWERED BY A.I.M.S.
                    </p>
                    <p 
                        className="text-white/60 text-xs"
                        style={{ fontFamily: '"Caveat", cursive' }}
                    >
                        AI-Managed Infrastructure Services
                    </p>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col justify-center px-8 md:px-16 lg:px-12 xl:px-20 bg-slate-950 relative">
                {/* Mobile Background */}
                <div 
                    className="lg:hidden absolute inset-0 bg-cover bg-center opacity-20"
                    style={{ backgroundImage: "url('/images/acheevy-hero.png')" }}
                />
                <div className="lg:hidden absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

                {/* Content */}
                <div className="relative z-10 max-w-md mx-auto w-full">
                    {/* Logo & Branding */}
                    <div className="text-center mb-10">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <img
                                src="/images/logo-only.png"
                                className="size-14"
                                alt="ACHEEVY Logo"
                            />
                        </div>
                        <h1 
                            className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight"
                            style={{ fontFamily: '"Permanent Marker", cursive' }}
                        >
                            ACHEEVY
                        </h1>
                        <p 
                            className="text-amber-400/90 text-xl"
                            style={{ fontFamily: '"Caveat", cursive' }}
                        >
                            Your AI-Powered Achievement Partner
                        </p>
                        <p 
                            className="text-white/50 text-sm mt-2"
                            style={{ fontFamily: '"Doto", sans-serif' }}
                        >
                            Transform ideas into reality with intelligent automation
                        </p>
                    </div>

                    {/* Decorative Line */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                    </div>

                    {/* Login Buttons */}
                    <div className="space-y-4">
                        {/* Primary ACHEEVY Login */}
                        <Button
                            size="xl"
                            onClick={loginWithAcheevy}
                            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-amber-500/40 hover:scale-[1.02]"
                        >
                            <img
                                src="/images/logo-charcoal.png"
                                alt="ACHEEVY"
                                className="size-6 mr-2"
                            />
                            Sign in with ACHEEVY
                        </Button>

                        {/* Divider */}
                        <div className="flex items-center gap-4 my-6">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-white/40 text-xs uppercase tracking-wider">or continue with</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        {/* Google OAuth - only if available */}
                        {googleClientId && (
                            <GoogleLoginButton 
                                onSuccess={handleGoogleSuccess} 
                                onError={handleGoogleError} 
                            />
                        )}

                        {/* Email Login Toggle */}
                        <Button
                            size="xl"
                            variant="outline"
                            onClick={() => setShowEmailForm(!showEmailForm)}
                            className="w-full bg-transparent border border-white/20 text-white/80 hover:bg-white/5 hover:border-white/30 transition-all duration-300"
                        >
                            <Icon name="email" className="size-5 mr-2" />
                            Continue with Email
                        </Button>
                    </div>

                    {/* Email/Password Form - Expandable */}
                    {showEmailForm && (
                        <div className="mt-6 p-6 rounded-xl bg-white/5 border border-white/10 animate-in slide-in-from-top-4 duration-300">
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(onSubmit)}
                                    className="flex flex-col gap-4"
                                >
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Icon
                                                            name="email"
                                                            className="absolute top-3 left-4 fill-white/50"
                                                        />
                                                        <Input
                                                            id="email"
                                                            className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                                                            type="email"
                                                            placeholder="Email address"
                                                            {...field}
                                                        />
                                                    </div>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Icon
                                                            name="key"
                                                            className="absolute top-3 left-4 fill-white/50"
                                                        />
                                                        <Input
                                                            id="password"
                                                            className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                                                            type="password"
                                                            placeholder="Password"
                                                            {...field}
                                                        />
                                                    </div>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex justify-between items-center text-sm">
                                        <Link
                                            to="/forgot-password"
                                            className="text-amber-400/80 hover:text-amber-400 transition-colors"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold mt-2"
                                        disabled={!form.formState.isValid}
                                    >
                                        Sign In
                                    </Button>
                                </form>
                            </Form>
                        </div>
                    )}

                    {/* Sign Up Link */}
                    <div className="mt-8 text-center">
                        <span className="text-white/50 text-sm">Don't have an account? </span>
                        <Link
                            to="/signup"
                            className="text-amber-400 hover:text-amber-300 text-sm font-semibold transition-colors"
                        >
                            Create one
                        </Link>
                    </div>

                    {/* Footer */}
                    <div className="mt-12 text-center">
                        <p className="text-white/30 text-xs">
                            By continuing, you agree to our{' '}
                            <Link to="/terms" className="text-white/50 hover:text-amber-400 transition-colors">
                                Terms of Service
                            </Link>
                            {' '}and{' '}
                            <Link to="/privacy" className="text-white/50 hover:text-amber-400 transition-colors">
                                Privacy Policy
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-8 right-8 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-8 left-8 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
            </div>
        </div>
    )
}

export const Component = LoginPage
