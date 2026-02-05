import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router'

export function GoogleDriveCallback() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    useEffect(() => {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        // Check if this is a mobile redirect flow
        const authPending = sessionStorage.getItem('google_drive_auth_pending')
        const isMobileRedirect = authPending !== null

        if (isMobileRedirect) {
            // Mobile redirect flow - post message to self and navigate back
            const authData = JSON.parse(authPending)
            sessionStorage.removeItem('google_drive_auth_pending')

            if (error) {
                window.postMessage(
                    {
                        type: 'google-drive-auth',
                        error,
                        errorDescription
                    },
                    window.location.origin
                )
            } else if (code && state) {
                window.postMessage(
                    {
                        type: 'google-drive-auth',
                        code,
                        state
                    },
                    window.location.origin
                )
            }

            // Navigate back to the original URL or home
            const returnUrl = authData.returnUrl || '/'
            navigate(returnUrl, { replace: true })
        } else if (window.opener) {
            // Desktop popup flow - post message to opener window
            if (error) {
                window.opener.postMessage(
                    {
                        type: 'google-drive-auth',
                        error,
                        errorDescription
                    },
                    window.location.origin
                )
            } else if (code && state) {
                window.opener.postMessage(
                    {
                        type: 'google-drive-auth',
                        code,
                        state
                    },
                    window.location.origin
                )
            }
            window.close()
        } else {
            // Fallback: close window or show error
            window.close()
        }
    }, [searchParams, navigate])

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">
                    Google Drive Authorization
                </h2>
                <p className="text-gray-600">
                    Processing authorization... This window will close
                    automatically.
                </p>
            </div>
        </div>
    )
}
