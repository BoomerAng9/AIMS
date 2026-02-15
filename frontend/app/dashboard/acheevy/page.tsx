import { redirect } from 'next/navigation';

// ACHEEVY tab removed — FloatingACHEEVY is the unified chat interface
export default function AcheevyRedirect() {
  redirect('/dashboard');
}
