import { redirect } from 'next/navigation';

// Chat page removed — FloatingACHEEVY is the unified chat interface
export default function ChatRedirect() {
  redirect('/dashboard');
}
