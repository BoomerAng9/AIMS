import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AGENT_TYPE, QUESTION_MODE, TAB, VIEW_MODE } from '@/typings/agent'
import { type SlideTemplate } from '@/services/slide.service'

interface UIState {
    activeTab: TAB
    viewMode: VIEW_MODE
    isLoading: boolean
    isGeneratingPrompt: boolean
    isFromNewQuestion: boolean
    isCreatingSession: boolean
    selectedFeature: string | null
    shouldFocusInput: boolean
    selectedSlideTemplate: SlideTemplate | null
    isMobileChatVisible: boolean
    questionMode: QUESTION_MODE
}

const initialState: UIState = {
    activeTab: TAB.BUILD,
    viewMode: VIEW_MODE.CHAT,
    isLoading: false,
    isGeneratingPrompt: false,
    isFromNewQuestion: false,
    isCreatingSession: false,
    selectedFeature: AGENT_TYPE.GENERAL,
    shouldFocusInput: false,
    selectedSlideTemplate: null,
    isMobileChatVisible: true,
    questionMode: QUESTION_MODE.CHAT
}

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setActiveTab: (state, action: PayloadAction<TAB>) => {
            state.activeTab = action.payload
        },
        setViewMode: (state, action: PayloadAction<VIEW_MODE>) => {
            state.viewMode = action.payload
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload
        },
        setGeneratingPrompt: (state, action: PayloadAction<boolean>) => {
            state.isGeneratingPrompt = action.payload
        },
        setIsFromNewQuestion: (state, action: PayloadAction<boolean>) => {
            state.isFromNewQuestion = action.payload
        },
        setIsCreatingSession: (state, action: PayloadAction<boolean>) => {
            state.isCreatingSession = action.payload
        },
        setSelectedFeature: (state, action: PayloadAction<string | null>) => {
            state.selectedFeature = action.payload
        },
        setShouldFocusInput: (state, action: PayloadAction<boolean>) => {
            state.shouldFocusInput = action.payload
        },
        setSelectedSlideTemplate: (
            state,
            action: PayloadAction<SlideTemplate | null>
        ) => {
            state.selectedSlideTemplate = action.payload
        },
        resetSlideTemplate: (state) => {
            state.selectedSlideTemplate = null
        },
        setIsMobileChatVisible: (state, action: PayloadAction<boolean>) => {
            state.isMobileChatVisible = action.payload
        },
        setQuestionMode: (state, action: PayloadAction<QUESTION_MODE>) => {
            state.questionMode = action.payload
        }
    }
})

export const {
    setActiveTab,
    setViewMode,
    setLoading,
    setGeneratingPrompt,
    setIsFromNewQuestion,
    setIsCreatingSession,
    setSelectedFeature,
    setShouldFocusInput,
    setSelectedSlideTemplate,
    resetSlideTemplate,
    setIsMobileChatVisible,
    setQuestionMode
} = uiSlice.actions
export const uiReducer = uiSlice.reducer

// Selectors
export const selectActiveTab = (state: { ui: UIState }) => state.ui.activeTab
export const selectViewMode = (state: { ui: UIState }) => state.ui.viewMode
export const selectIsLoading = (state: { ui: UIState }) => state.ui.isLoading
export const selectIsGeneratingPrompt = (state: { ui: UIState }) =>
    state.ui.isGeneratingPrompt
export const selectIsFromNewQuestion = (state: { ui: UIState }) =>
    state.ui.isFromNewQuestion
export const selectIsCreatingSession = (state: { ui: UIState }) =>
    state.ui.isCreatingSession
export const selectSelectedFeature = (state: { ui: UIState }) =>
    state.ui.selectedFeature
export const selectShouldFocusInput = (state: { ui: UIState }) =>
    state.ui.shouldFocusInput
export const selectSelectedSlideTemplate = (state: { ui: UIState }) =>
    state.ui.selectedSlideTemplate
export const selectIsMobileChatVisible = (state: { ui: UIState }) =>
    state.ui.isMobileChatVisible
export const selectQuestionMode = (state: { ui: UIState }) =>
    state.ui.questionMode
