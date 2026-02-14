import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'

import App from '@/app'
import store, { persistor } from '@/state/store'

// SECURITY: Sentry telemetry DISABLED — was sending PII (IPs, browser data)
// to external Sentry servers. Killed per AIMS security policy.
// If error tracking is needed, use self-hosted Sentry on VPS or GCP.

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <App />
            </PersistGate>
        </Provider>
    </React.StrictMode>
)
