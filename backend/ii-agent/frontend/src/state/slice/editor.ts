import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ActionStep } from '@/typings/agent'

interface EditorState {
    activeFileCodeEditor: string
    currentActionData?: ActionStep
    requestAction?: ActionStep
    currentBuildStep: number
}

const initialState: EditorState = {
    activeFileCodeEditor: '',
    currentActionData: undefined,
    currentBuildStep: 0
}

const editorSlice = createSlice({
    name: 'editor',
    initialState,
    reducers: {
        setActiveFile: (state, action: PayloadAction<string>) => {
            state.activeFileCodeEditor = action.payload
        },
        setCurrentActionData: (
            state,
            action: PayloadAction<ActionStep | undefined>
        ) => {
            state.currentActionData = action.payload
        },
        setCurrentBuildStep: (state, action: PayloadAction<number>) => {
            state.currentBuildStep = action.payload
        },
        requestAction: (
            state,
            action: PayloadAction<ActionStep | undefined>
        ) => {
            state.requestAction = action.payload
        }
    }
})

export const {
    setActiveFile,
    setCurrentActionData,
    setCurrentBuildStep,
    requestAction
} = editorSlice.actions
export const editorReducer = editorSlice.reducer

// Selectors
export const selectActiveFileCodeEditor = (state: { editor: EditorState }) =>
    state.editor.activeFileCodeEditor
export const selectCurrentActionData = (state: { editor: EditorState }) =>
    state.editor.currentActionData
export const selectCurrentBuildStep = (state: { editor: EditorState }) =>
    state.editor.currentBuildStep
export const selectRequestedAction = (state: { editor: EditorState }) =>
    state.editor.requestAction
