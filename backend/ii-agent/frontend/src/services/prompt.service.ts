import axiosInstance from '@/lib/axios'

interface EnhancePromptPayload {
    prompt: string
    context?: string
}

interface EnhancePromptResponse {
    original_prompt: string
    enhanced_prompt: string
    reasoning?: string
}

class PromptService {
    async enhancePrompt(
        payload: EnhancePromptPayload
    ): Promise<EnhancePromptResponse> {
        const response = await axiosInstance.post<EnhancePromptResponse>(
            `/enhance-prompt`,
            payload
        )
        return response.data
    }
}

export const promptService = new PromptService()
