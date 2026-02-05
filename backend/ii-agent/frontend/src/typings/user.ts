export interface CreditBalanceResponse {
    user_id: string
    credits: number
    bonus_credits?: number
    updated_at: string
}

export interface CreditUsageSession {
    session_id: string
    session_title: string
    credits: number
    bonus_credits: number
    updated_at: string
}

export interface CreditUsageResponse {
    sessions: CreditUsageSession[]
    total: number
}
