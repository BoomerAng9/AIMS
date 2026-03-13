import { redirect } from 'next/navigation';
import { LibreChatUnavailable } from '@/components/chat/LibreChatUnavailable';
import { buildLibreChatLaunchUrl } from '@/lib/librechat';

interface LibreChatEntryProps {
  source: string;
  entryLabel: string;
}

export function LibreChatEntry({ source, entryLabel }: LibreChatEntryProps) {
  const targetUrl = buildLibreChatLaunchUrl(source);

  if (targetUrl) {
    redirect(targetUrl);
  }

  return <LibreChatUnavailable entryLabel={entryLabel} />;
}
