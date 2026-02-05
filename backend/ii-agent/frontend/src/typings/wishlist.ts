export interface SessionWishlistItem {
    id: string
    session_id: string
    session_name: string | null
    created_at: string
    last_message_at: string | null
}

export interface SessionWishlistResponse {
    sessions: SessionWishlistItem[]
    total: number
}

export interface WishlistActionResponse {
    success: boolean
    message: string
    session_id: string
}