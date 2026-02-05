import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'

import App from '@/app'
import store, { persistor } from '@/state/store'

import * as Sentry from '@sentry/react'

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN

if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,
        // Setting this option to true will send default PII data to Sentry.
        // For example, automatic IP address collection on events
        sendDefaultPii: true,
        beforeSend: function (event: Sentry.ErrorEvent) {
            // filter out UnhandledRejection errors that have no information
            if (
                event !== undefined &&
                event.exception !== undefined &&
                event.exception.values !== undefined &&
                event.exception.values.length == 1
            ) {
                const e = event.exception.values[0]
                if (
                    e.type === 'UnhandledRejection' &&
                    e.value ===
                        'Non-Error promise rejection captured with value: '
                ) {
                    return null
                }
            }
            return event
        }
    })
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <App />
            </PersistGate>
        </Provider>
    </React.StrictMode>
)
