import { configureStore } from '@reduxjs/toolkit'
import type { TypedUseSelectorHook } from 'react-redux'
import { useDispatch, useSelector } from 'react-redux'
import { persistReducer, persistStore } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

import rootReducer from './reducer'
import { userApi } from './api/user.api'
import { sessionApi } from './api/session.api'

const persistConfig = {
    key: 'root',
    whitelist: ['settings', 'favorites'],
    storage,
    version: 1,
    migrate: (state: any) => {
        // Ensure chatToolSettings has default values if undefined
        if (state?.settings && !state.settings.chatToolSettings) {
            state.settings.chatToolSettings = {
                web_search: true,
                web_visit: true,
                image_search: true,
                code_interpreter: true
            }
        }
        return Promise.resolve(state)
    }
}
const persistedReducer = persistReducer(persistConfig, rootReducer)

const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }).concat(
            userApi.middleware,
            sessionApi.middleware
        ),
    devTools: !import.meta.env.PROD
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export default store

export const persistor = persistStore(store)
