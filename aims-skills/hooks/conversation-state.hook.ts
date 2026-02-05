/**
 * @hook conversation-state
 * @version 1.0.0
 * @description Manages persistent conversation memory for ACHEEVY
 */

import { HookDefinition, HookContext, ConversationMessage } from '../types/hooks';
import { db, FieldValue } from '../lib/firebase';

export const ConversationStateHook: HookDefinition = {
  metadata: {
    name: 'conversation_state_manager',
    version: '1.0.0',
    description: 'Persists and retrieves conversation state for continuity',
    attached_to: ['ACHEEVY.conversation_loop'],
    priority: 90
  },

  lifecycle_points: {
    before_acheevy_response: {
      async execute(context: HookContext) {
        // Load conversation history
        const conversationRef = db
          .collection('users')
          .doc(context.user.id)
          .collection('conversations')
          .doc(context.conversation_id || 'default');

        const conversationHistory = await conversationRef.get();

        if (conversationHistory.exists) {
          const history = conversationHistory.data() as {
            messages: ConversationMessage[];
            metadata: Record<string, any>;
          };
          context.conversation_history = history.messages || [];
          context.conversation_metadata = history.metadata || {};
        } else {
          // Initialize new conversation
          context.conversation_history = [];
          context.conversation_metadata = {
            started_at: new Date(),
            message_count: 0
          };
        }

        return context;
      }
    },

    after_acheevy_response: {
      async execute(context: HookContext, acheevyResponse: string) {
        // Save conversation state
        const conversationRef = db
          .collection('users')
          .doc(context.user.id)
          .collection('conversations')
          .doc(context.conversation_id || 'default');

        const newMessage: ConversationMessage = {
          role: 'assistant',
          content: acheevyResponse,
          timestamp: new Date()
        };

        await conversationRef.set({
          messages: [
            ...(context.conversation_history || []),
            newMessage
          ],
          metadata: {
            ...context.conversation_metadata,
            message_count: FieldValue.increment(1),
            last_updated: new Date()
          }
        }, { merge: true });

        return context;
      }
    },

    after_user_message: {
      async execute(context: HookContext, userMessage: string) {
        // Save user message to conversation history
        const conversationRef = db
          .collection('users')
          .doc(context.user.id)
          .collection('conversations')
          .doc(context.conversation_id || 'default');

        const newMessage: ConversationMessage = {
          role: 'user',
          content: userMessage,
          timestamp: new Date()
        };

        // Add to local context
        context.conversation_history = [
          ...(context.conversation_history || []),
          newMessage
        ];

        // Persist to Firebase
        await conversationRef.set({
          messages: context.conversation_history,
          metadata: {
            ...context.conversation_metadata,
            message_count: FieldValue.increment(1),
            last_updated: new Date()
          }
        }, { merge: true });

        return context;
      }
    }
  }
};

export default ConversationStateHook;
