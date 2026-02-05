import { ISetting } from './agent'

export interface SettingsResponse {
    settings: ISetting
}

export interface ValidateApiKeyRequest {
    provider: string
    apiKey: string
}

export interface ValidateApiKeyResponse {
    valid: boolean
}

export interface IModel {
    id: string
    model: string
    api_type: 'openai' | 'anthropic' | 'gemini' | 'custom'
    base_url?: string
    api_key?: string
    context_length?: number
    input_price_per_token?: number
    output_price_per_token?: number
    supports_function_calling?: boolean
    supports_vision?: boolean
    description?: string
    source?: 'user' | 'system'
    created_at?: string
    updated_at?: string
}

export interface GetAvailableModelsResponse {
    models: IModel[]
}

interface MCPServerConfig {
    command?: string
    args?: string[]
    capabilities?: string[]
    env?: Record<string, string>
    url?: string
    headers?: Record<string, string>
}

interface MCPConfig {
    mcpServers?: Record<string, MCPServerConfig>
    servers?: Record<string, MCPServerConfig>
}

interface MCPMetadata {
    auth_json?: Record<string, any>
    model?: string
    apikey?: string
    model_reasoning_effort?: string
    search?: boolean
}

export interface IMcpSettings {
    id: string
    mcp_config: MCPConfig
    metadata?: MCPMetadata
    is_active?: boolean
    created_at?: string
    updated_at?: string
}

export interface UpdateMcpSettingsPayload {
    mcp_config?: MCPConfig
    is_active?: boolean
}

export interface GetMcpSettingsResponse {
    settings: IMcpSettings[]
}
