import { Link, Outlet } from 'react-router'
import { useAuth } from '@/contexts/auth-context'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { ENABLE_BETA } from '@/constants/features'

export function AuthLayout() {
    const { isAuthenticated } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/')
        }
    }, [isAuthenticated, navigate])

    return (
        <div className="flex flex-col h-screen justify-between px-3 md:px-6 pt-8 pb-12 overflow-auto">
            <Link to="/" className="flex items-center gap-x-2 md:gap-x-3">
                <img
                    src="/images/logo-only.png"
                    className="size-8 md:size-10 hidden dark:inline"
                    alt="Logo"
                />
                <img
                    src="/images/logo-charcoal.svg"
                    className="soze-8 md:size-10 inline dark:hidden"
                    alt="Logo"
                />
                <div className="relative">
                    <span className="text-black dark:text-white text-lg md:text-2xl font-semibold">
                        ACHEEVY
                    </span>
                    {ENABLE_BETA && (
                        <span className="text-[10px] absolute -right-8 -top-1">
                            BETA
                        </span>
                    )}
                </div>
            </Link>
            <div className="flex-1">
                <Outlet />
            </div>
            <div className="flex justify-center gap-x-10">
                <Link
                    to="/terms"
                    className="dark:text-white text-sm font-semibold"
                >
                    Terms of Use
                </Link>
                <Link
                    to="/privacy"
                    className="dark:text-white text-sm font-semibold"
                >
                    Privacy Policy
                </Link>
            </div>
        </div>
    )
}
