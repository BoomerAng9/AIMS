import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Message } from '@/typings/agent'
import { uniqBy } from 'lodash'

interface MessagesState {
    messages: Message[]
    editingMessage?: Message
}

const initialState: MessagesState = {
    messages: [],
    editingMessage: undefined
}

const messagesSlice = createSlice({
    name: 'messages',
    initialState,
    reducers: {
        setMessages: (state, action: PayloadAction<Message[]>) => {
            state.messages = action.payload
        },
        addMessage: (state, action: PayloadAction<Message>) => {
            const messages = uniqBy([...state.messages, action.payload], 'id')
            state.messages = messages
        },
        updateMessage: (state, action: PayloadAction<Message>) => {
            const index = state.messages.findIndex(
                (msg) => msg.id === action.payload.id
            )
            if (index !== -1) {
                state.messages[index] = action.payload
            }
        },
        setEditingMessage: (
            state,
            action: PayloadAction<Message | undefined>
        ) => {
            state.editingMessage = action.payload
        }
    }
})

export const { setMessages, addMessage, updateMessage, setEditingMessage } =
    messagesSlice.actions
export const messagesReducer = messagesSlice.reducer

// Selectors
export const selectMessages = (state: { messages: MessagesState }) =>
    state.messages.messages
export const selectEditingMessage = (state: { messages: MessagesState }) =>
    state.messages.editingMessage
