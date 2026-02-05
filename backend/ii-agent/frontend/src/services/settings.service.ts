import axiosInstance from '@/lib/axios'
import {
    GetAvailableModelsResponse,
    GetMcpSettingsResponse,
    IMcpSettings,
    IModel,
    UpdateMcpSettingsPayload
} from '@/typings/settings'

class SettingsService {
    async createModel(payload: IModel): Promise<IModel> {
        const response = await axiosInstance.post<IModel>(
            '/user-settings/models',
            payload
        )
        return response.data
    }

    async updateModel(id: string, payload: Partial<IModel>): Promise<IModel> {
        const response = await axiosInstance.put<IModel>(
            `/user-settings/models/${id}`,
            payload
        )
        return response.data
    }

    async deleteModel(id: string): Promise<void> {
        await axiosInstance.delete(`/user-settings/models/${id}`)
    }

    async getAvailableModels(): Promise<GetAvailableModelsResponse> {
        const response = await axiosInstance.get<GetAvailableModelsResponse>(
            `/user-settings/models`
        )
        return response.data
    }

    async getModelById(id: string): Promise<IModel> {
        const response = await axiosInstance.get<IModel>(
            `/user-settings/models/${id}`
        )
        return response.data
    }

    async getMcpSettings(): Promise<GetMcpSettingsResponse> {
        const response =
            await axiosInstance.get<GetMcpSettingsResponse>(
                '/user-settings/mcp'
            )
        return response.data
    }

    async createMcpSettings(
        payload: UpdateMcpSettingsPayload
    ): Promise<IMcpSettings> {
        const response = await axiosInstance.post<IMcpSettings>(
            '/user-settings/mcp',
            payload
        )
        return response.data
    }

    async updateMcpSettings(
        id: string,
        payload: UpdateMcpSettingsPayload
    ): Promise<IMcpSettings> {
        const response = await axiosInstance.put<IMcpSettings>(
            `/user-settings/mcp/${id}`,
            payload
        )
        return response.data
    }

    async deleteMcpSettings(id: string): Promise<void> {
        await axiosInstance.delete(`/user-settings/mcp/${id}`)
    }

    async getCodexSettings(): Promise<IMcpSettings | null> {
        const response = await axiosInstance.get<IMcpSettings | null>(
            '/user-settings/mcp/codex'
        )
        return response.data
    }

    async getClaudeCodeSettings(): Promise<IMcpSettings | null> {
        const response = await axiosInstance.get<IMcpSettings | null>(
            '/user-settings/mcp/claude-code'
        )
        return response.data
    }

    async configureCodex(payload: {
        auth_json?: object
        model?: string
        apikey?: string
        model_reasoning_effort?: string
        search?: boolean
    }): Promise<IMcpSettings> {
        const response = await axiosInstance.post<IMcpSettings>(
            '/user-settings/mcp/codex',
            payload
        )
        return response.data
    }

    async configureClaudeCode(payload: {
        authorization_code?: string
    }): Promise<IMcpSettings> {
        const response = await axiosInstance.post<IMcpSettings>(
            '/user-settings/mcp/claude-code',
            payload
        )
        return response.data
    }
}

export const settingsService = new SettingsService()
