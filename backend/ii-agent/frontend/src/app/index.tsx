import './global.css'

import AppProvider from '@/app/provider'
import AppRouter from '@/app/router'
import { Toaster } from '@/components/ui/sonner'

export default function App() {
    return (
        <AppProvider>
            <AppRouter />
            <Toaster richColors />
        </AppProvider>
    )
}
