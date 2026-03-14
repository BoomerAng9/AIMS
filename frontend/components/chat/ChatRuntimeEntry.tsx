import { redirect } from 'next/navigation';
import { ChatRuntimeUnavailable } from '@/components/chat/ChatRuntimeUnavailable';
import { buildChatRuntimeLaunchUrl } from '@/lib/chat-runtime';

export interface ChatRuntimeEntryProps {
  source: string;
  entryLabel: string;
}

export function ChatRuntimeEntry({ source, entryLabel }: ChatRuntimeEntryProps) {
  const targetUrl = buildChatRuntimeLaunchUrl(source);

  if (targetUrl) {
    redirect(targetUrl);
  }

  return <ChatRuntimeUnavailable entryLabel={entryLabel} />;
}