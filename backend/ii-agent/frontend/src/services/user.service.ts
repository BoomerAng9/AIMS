import axiosInstance from '@/lib/axios'
import { CreditBalanceResponse, CreditUsageResponse } from '@/typings/user'

class UserService {
    async getCreditBalance(): Promise<CreditBalanceResponse> {
        const response =
            await axiosInstance.get<CreditBalanceResponse>('/credits/balance')
        return response.data
    }
    async getCreditUsage({
        page,
        perPage
    }: {
        page: number
        perPage: number
    }): Promise<CreditUsageResponse> {
        const response = await axiosInstance.get<CreditUsageResponse>(
            '/credits/usage',
            {
                params: { page, per_page: perPage }
            }
        )
        return response.data
    }
}

export const userService = new UserService()
