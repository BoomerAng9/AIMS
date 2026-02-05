import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ChatToolSettings, ISetting, ToolSettings } from '@/typings/agent'
import { IModel } from '@/typings/settings'

interface SettingsState {
    toolSettings: ToolSettings
    chatToolSettings: ChatToolSettings
    selectedModel?: string
    availableModels: IModel[]
    currentSettingData?: ISetting
    isSavingSetting: boolean
    claudeCodeConfig?: {
        id: string
        is_active: boolean
        updated_at: string
    }
}

const initialState: SettingsState = {
    toolSettings: {
        deep_research: false,
        design_document: false,
        pdf: true,
        media_generation: false,
        audio_generation: false,
        browser: true,
        thinking_tokens: 10000,
        enable_reviewer: false,
        codex_tools: false,
        claude_code: false
    },
    chatToolSettings: {
        web_search: true,
        web_visit: true,
        image_search: true,
        code_interpreter: true
    },
    selectedModel: undefined,
    availableModels: [],
    currentSettingData: undefined,
    isSavingSetting: false,
    claudeCodeConfig: undefined
}

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setToolSettings: (state, action: PayloadAction<ToolSettings>) => {
            state.toolSettings = action.payload
        },
        setChatToolSettings: (
            state,
            action: PayloadAction<ChatToolSettings>
        ) => {
            state.chatToolSettings = action.payload
        },
        setCodexToolsStatus: (state, action: PayloadAction<boolean>) => {
            state.toolSettings.codex_tools = action.payload
        },
        setClaudeCodeToolsStatus: (state, action: PayloadAction<boolean>) => {
            state.toolSettings.claude_code = action.payload
        },
        setSelectedModel: (
            state,
            action: PayloadAction<string | undefined>
        ) => {
            state.selectedModel = action.payload
        },
        setAvailableModels: (state, action: PayloadAction<IModel[]>) => {
            state.availableModels = action.payload
        },
        setCurrentSettingData: (
            state,
            action: PayloadAction<ISetting | undefined>
        ) => {
            state.currentSettingData = action.payload
        },
        setIsSavingSetting: (state, action: PayloadAction<boolean>) => {
            state.isSavingSetting = action.payload
        },
        setClaudeCodeConfig: (
            state,
            action: PayloadAction<{
                id: string
                is_active: boolean
                updated_at: string
            }>
        ) => {
            state.claudeCodeConfig = action.payload
        }
    }
})

export const {
    setToolSettings,
    setChatToolSettings,
    setCodexToolsStatus,
    setClaudeCodeToolsStatus,
    setSelectedModel,
    setAvailableModels,
    setCurrentSettingData,
    setIsSavingSetting,
    setClaudeCodeConfig
} = settingsSlice.actions
export const settingsReducer = settingsSlice.reducer

// Selectors
export const selectToolSettings = (state: { settings: SettingsState }) =>
    state.settings.toolSettings
export const selectChatToolSettings = (state: { settings: SettingsState }) =>
    state.settings.chatToolSettings
export const selectSelectedModel = (state: { settings: SettingsState }) =>
    state.settings.selectedModel
export const selectAvailableModels = (state: { settings: SettingsState }) =>
    state.settings.availableModels
export const selectCurrentSettingData = (state: { settings: SettingsState }) =>
    state.settings.currentSettingData
export const selectIsSavingSetting = (state: { settings: SettingsState }) =>
    state.settings.isSavingSetting
export const selectClaudeCodeConfig = (state: { settings: SettingsState }) =>
    state.settings.claudeCodeConfig
