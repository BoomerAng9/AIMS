# Agentic UI Component API Reference

## ChatInput Props

```typescript
interface ChatInputProps {
  onSendMessage: (
    content: string,
    files?: UploadedFile[],
    tools?: Tool[],
    businessFunction?: BusinessFunction,
    deepResearch?: boolean
  ) => void;
  placeholder?: string;
  disabled?: boolean;
  isStreaming?: boolean;
  showAttachment?: boolean;
  showVoice?: boolean;
  showTools?: boolean;
  showDeepResearch?: boolean;
  tools?: Tool[];
  businessFunctions?: BusinessFunction[];
  maxFiles?: number;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
  className?: string;
  isDeepResearch?: boolean;
  onDeepResearchChange?: (value: boolean) => void;
  enableSlashTools?: boolean;
  toolsLabel?: string;
  deepResearchLabel?: string;
}
```

## ChatMessage Props (CVA Variants)

```typescript
// Variants: role → user | assistant | system
// Size: sm | md | lg
interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  avatar?: string;
  className?: string;
}
```

## AgentCard Props (CVA Variants)

```typescript
// Variants: variant → default | compact | detailed
// Status: online | offline | thinking | busy
interface AgentCardProps {
  agent: Agent;
  variant?: 'default' | 'compact' | 'detailed';
  onClick?: () => void;
  className?: string;
}

interface Agent {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'thinking' | 'busy';
  model?: string;
  capabilities?: string[];
}
```

## StreamingText Props

```typescript
interface StreamingTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}
```

## UsageMetrics Props

```typescript
interface UsageMetricsProps {
  data: UsageMetricsData;
  variant?: 'compact' | 'detailed';
  className?: string;
}

interface UsageMetricsData {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  cost?: number;
  requestCount?: number;
  averageResponseTime?: number;
}
```

## PromptComposer Props

```typescript
interface PromptComposerProps {
  templates?: PromptTemplate[];
  onSubmit: (prompt: string) => void;
  className?: string;
}

interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: Variable[];
  category?: string;
}
```

## Badge Props (CVA Variants)

```typescript
// Variants: default | secondary | destructive | outline
interface BadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
  children: React.ReactNode;
}
```

## Button Props (CVA Variants)

```typescript
// Variants: default | destructive | outline | secondary | ghost | link
// Sizes: default | sm | lg | icon
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}
```

## Core Types

```typescript
interface Tool {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

interface BusinessFunction {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  topic?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  status?: 'uploading' | 'complete' | 'error';
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}

interface StreamingState {
  isStreaming: boolean;
  currentText?: string;
  tokensGenerated?: number;
}

interface ConversationContext {
  messages: Message[];
  systemPrompt?: string;
  metadata?: Record<string, unknown>;
}

interface ContextItem {
  id: string;
  type: string;
  content: string;
  relevance?: number;
  source?: string;
}
```
