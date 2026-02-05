import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const EmailSchema = z.object({
    email: z.email({ error: 'Invalid email address' })
})

const PasswordSchema = z
    .object({
        password: z.string({ error: 'Password is required' }).min(6, {
            message: 'Password must be at least 6 characters'
        }),
        confirmPassword: z.string({ error: 'Please confirm your password' })
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword']
    })

export function ForgotPasswordPage() {
    const navigate = useNavigate()
    const [step, setStep] = useState<'email' | 'password'>('email')
    const [email, setEmail] = useState('')

    const emailForm = useForm<z.infer<typeof EmailSchema>>({
        resolver: zodResolver(EmailSchema),
        defaultValues: {
            email: ''
        }
    })

    const passwordForm = useForm<z.infer<typeof PasswordSchema>>({
        resolver: zodResolver(PasswordSchema),
        defaultValues: {
            password: '',
            confirmPassword: ''
        }
    })

    const onEmailSubmit = async (data: z.infer<typeof EmailSchema>) => {
        console.log('Email step:', data)
        setEmail(data.email)
        setStep('password')
    }

    const onPasswordSubmit = async (data: z.infer<typeof PasswordSchema>) => {
        console.log('Password step:', { email, ...data })
        // Handle password reset logic here
        navigate('/login')
    }

    // Reset form when switching to password step
    useEffect(() => {
        if (step === 'password') {
            passwordForm.reset({
                password: '',
                confirmPassword: ''
            })
        }
    }, [step, passwordForm])

    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
            <h1 className="text-[32px] font-semibold dark:text-sky-blue">
                {step === 'email'
                    ? 'Forgot your password?'
                    : 'Create New Password'}
            </h1>
            <p className="text-[28px] dark:text-sky-blue mb-12">
                {`Don't worry, we help you get it back`}
            </p>

            <div className="flex flex-col w-full justify-center max-w-[510px]">
                {step === 'email' ? (
                    <Form {...emailForm}>
                        <form
                            onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                            className="flex flex-col gap-10"
                        >
                            <div className="space-y-6">
                                <FormField
                                    control={emailForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="space-y-2 relative">
                                                    <Icon
                                                        name="email"
                                                        className="absolute top-3 left-4 fill-black dark:fill-white"
                                                    />
                                                    <Input
                                                        id="email"
                                                        className="pl-[56px]"
                                                        type="text"
                                                        placeholder="Enter your email address"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="w-full flex justify-center">
                                <Button
                                    type="submit"
                                    size="xl"
                                    className="bg-firefly text-sky-blue-2 dark:bg-sky-blue dark:text-black font-semibold w-full max-w-[247px]"
                                    disabled={!emailForm.formState.isValid}
                                >
                                    Continue
                                </Button>
                            </div>
                        </form>
                    </Form>
                ) : (
                    <>
                        <Form {...passwordForm}>
                            <form
                                onSubmit={passwordForm.handleSubmit(
                                    onPasswordSubmit
                                )}
                                className="flex flex-col gap-10"
                            >
                                <div className="space-y-6">
                                    <FormField
                                        control={passwordForm.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <div className="space-y-2 relative">
                                                        <Icon
                                                            name="key"
                                                            className="absolute top-3 left-4 fill-black dark:fill-white"
                                                        />
                                                        <Input
                                                            id="reset-password"
                                                            className="pl-[56px]"
                                                            type="password"
                                                            placeholder="New password"
                                                            autoComplete="off"
                                                            data-form-type="other"
                                                            {...field}
                                                            value={
                                                                field.value ||
                                                                ''
                                                            }
                                                        />
                                                    </div>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={passwordForm.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <div className="space-y-2 relative">
                                                        <Icon
                                                            name="key"
                                                            className="absolute top-3 left-4 fill-black dark:fill-white"
                                                        />
                                                        <Input
                                                            id="reset-confirm-password"
                                                            className="pl-[56px]"
                                                            type="password"
                                                            placeholder="Confirm your new password"
                                                            autoComplete="off"
                                                            data-form-type="other"
                                                            {...field}
                                                            value={
                                                                field.value ||
                                                                ''
                                                            }
                                                        />
                                                    </div>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="w-full flex justify-center">
                                    <Button
                                        type="submit"
                                        size="xl"
                                        className="bg-firefly text-sky-blue-2 dark:bg-sky-blue dark:text-black font-semibold w-full max-w-[247px]"
                                        disabled={
                                            !passwordForm.formState.isValid
                                        }
                                    >
                                        Reset Password
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </>
                )}

                <div className="flex justify-center items-center gap-2 dark:text-white text-sm mt-8">
                    <span>You remember your password?</span>
                    <Link
                        to="/login"
                        className="dark:text-white text-sm font-semibold"
                    >
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    )
}

export const Component = ForgotPasswordPage
