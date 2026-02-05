import axiosInstance from '@/lib/axios'
import {
    SessionWishlistResponse,
    WishlistActionResponse
} from '@/typings/wishlist'

class WishlistService {
    async getWishlistSessions(): Promise<SessionWishlistResponse> {
        const response = await axiosInstance.get<SessionWishlistResponse>(
            '/wishlist/sessions'
        )
        return response.data
    }

    async addToWishlist(sessionId: string): Promise<WishlistActionResponse> {
        const response = await axiosInstance.post<WishlistActionResponse>(
            `/wishlist/sessions/${sessionId}`
        )
        return response.data
    }

    async removeFromWishlist(sessionId: string): Promise<WishlistActionResponse> {
        const response = await axiosInstance.delete<WishlistActionResponse>(
            `/wishlist/sessions/${sessionId}`
        )
        return response.data
    }
}

export const wishlistService = new WishlistService()