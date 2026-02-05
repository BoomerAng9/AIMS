import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import { wishlistService } from '@/services/wishlist.service'

interface FavoritesState {
    favoriteSessionIds: string[]
    isLoading: boolean
    error: string | null
    isInitialized: boolean
}

const initialState: FavoritesState = {
    favoriteSessionIds: [],
    isLoading: false,
    error: null,
    isInitialized: false
}

// Async thunks
export const fetchWishlist = createAsyncThunk(
    'favorites/fetchWishlist',
    async () => {
        const response = await wishlistService.getWishlistSessions()
        return response.sessions.map(item => item.session_id)
    }
)

export const addToWishlistAsync = createAsyncThunk(
    'favorites/addToWishlist',
    async (sessionId: string) => {
        await wishlistService.addToWishlist(sessionId)
        return sessionId
    }
)

export const removeFromWishlistAsync = createAsyncThunk(
    'favorites/removeFromWishlist',
    async (sessionId: string) => {
        await wishlistService.removeFromWishlist(sessionId)
        return sessionId
    }
)

export const toggleFavoriteAsync = createAsyncThunk(
    'favorites/toggleFavorite',
    async (sessionId: string, { getState }) => {
        const state = getState() as RootState
        const isFavorite = state.favorites.favoriteSessionIds.includes(sessionId)
        
        if (isFavorite) {
            await wishlistService.removeFromWishlist(sessionId)
        } else {
            await wishlistService.addToWishlist(sessionId)
        }
        
        return { sessionId, isFavorite }
    }
)

const favoritesSlice = createSlice({
    name: 'favorites',
    initialState,
    reducers: {
        toggleFavorite: (state, action: PayloadAction<string>) => {
            const sessionId = action.payload
            const index = state.favoriteSessionIds.indexOf(sessionId)
            
            if (index > -1) {
                state.favoriteSessionIds.splice(index, 1)
            } else {
                state.favoriteSessionIds.push(sessionId)
            }
        },
        addFavorite: (state, action: PayloadAction<string>) => {
            const sessionId = action.payload
            if (!state.favoriteSessionIds.includes(sessionId)) {
                state.favoriteSessionIds.push(sessionId)
            }
        },
        removeFavorite: (state, action: PayloadAction<string>) => {
            const sessionId = action.payload
            state.favoriteSessionIds = state.favoriteSessionIds.filter(
                id => id !== sessionId
            )
        },
        clearFavorites: (state) => {
            state.favoriteSessionIds = []
        },
        setFavorites: (state, action: PayloadAction<string[]>) => {
            state.favoriteSessionIds = action.payload
        },
        clearError: (state) => {
            state.error = null
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch wishlist
            .addCase(fetchWishlist.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(fetchWishlist.fulfilled, (state, action) => {
                state.isLoading = false
                state.favoriteSessionIds = action.payload
                state.isInitialized = true
            })
            .addCase(fetchWishlist.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Failed to fetch wishlist'
                state.isInitialized = true
            })
            // Add to wishlist
            .addCase(addToWishlistAsync.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(addToWishlistAsync.fulfilled, (state, action) => {
                state.isLoading = false
                if (!state.favoriteSessionIds.includes(action.payload)) {
                    state.favoriteSessionIds.push(action.payload)
                }
            })
            .addCase(addToWishlistAsync.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Failed to add to wishlist'
            })
            // Remove from wishlist
            .addCase(removeFromWishlistAsync.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(removeFromWishlistAsync.fulfilled, (state, action) => {
                state.isLoading = false
                state.favoriteSessionIds = state.favoriteSessionIds.filter(
                    id => id !== action.payload
                )
            })
            .addCase(removeFromWishlistAsync.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Failed to remove from wishlist'
            })
            // Toggle favorite
            .addCase(toggleFavoriteAsync.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(toggleFavoriteAsync.fulfilled, (state, action) => {
                state.isLoading = false
                const { sessionId, isFavorite } = action.payload
                if (isFavorite) {
                    // Was favorite, now removed
                    state.favoriteSessionIds = state.favoriteSessionIds.filter(
                        id => id !== sessionId
                    )
                } else {
                    // Was not favorite, now added
                    if (!state.favoriteSessionIds.includes(sessionId)) {
                        state.favoriteSessionIds.push(sessionId)
                    }
                }
            })
            .addCase(toggleFavoriteAsync.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Failed to toggle favorite'
            })
    }
})

export const { toggleFavorite, addFavorite, removeFavorite, clearFavorites, setFavorites, clearError } = favoritesSlice.actions

export const selectFavoriteSessionIds = (state: RootState) => state.favorites.favoriteSessionIds
export const selectIsFavorite = (sessionId: string) => (state: RootState) => 
    state.favorites.favoriteSessionIds.includes(sessionId)
export const selectFavoritesLoading = (state: RootState) => state.favorites.isLoading
export const selectFavoritesError = (state: RootState) => state.favorites.error
export const selectFavoritesInitialized = (state: RootState) => state.favorites.isInitialized

export const favoritesReducer = favoritesSlice.reducer