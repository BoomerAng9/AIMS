import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface WorkspaceState {
    workspaceInfo: string
    browserUrl: string
    vscodeUrl: string
    currentQuestion: string
}

const initialState: WorkspaceState = {
    workspaceInfo: '',
    browserUrl: '',
    vscodeUrl: '',
    currentQuestion: ''
}

const workspaceSlice = createSlice({
    name: 'workspace',
    initialState,
    reducers: {
        setWorkspaceInfo: (state, action: PayloadAction<string>) => {
            state.workspaceInfo = action.payload
        },
        setBrowserUrl: (state, action: PayloadAction<string>) => {
            state.browserUrl = action.payload
        },
        setVscodeUrl: (state, action: PayloadAction<string>) => {
            state.vscodeUrl = action.payload
        },
        setCurrentQuestion: (state, action: PayloadAction<string>) => {
            state.currentQuestion = action.payload
        }
    }
})

export const { setWorkspaceInfo, setBrowserUrl, setVscodeUrl, setCurrentQuestion } = workspaceSlice.actions
export const workspaceReducer = workspaceSlice.reducer

// Selectors
export const selectWorkspaceInfo = (state: { workspace: WorkspaceState }) => state.workspace.workspaceInfo
export const selectBrowserUrl = (state: { workspace: WorkspaceState }) => state.workspace.browserUrl
export const selectVscodeUrl = (state: { workspace: WorkspaceState }) => state.workspace.vscodeUrl
export const selectCurrentQuestion = (state: { workspace: WorkspaceState }) => state.workspace.currentQuestion