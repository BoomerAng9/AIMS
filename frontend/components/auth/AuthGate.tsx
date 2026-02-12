/**
 * AuthGate — Action-based auth modal component.
 *
 * Wraps interactive actions (chat, deploy, build) and prompts for
 * sign-in when the user has no session. Does NOT block page rendering.
 *
 * Usage:
 *   <AuthGate onAction={handleSend}>
 *     <button>Send Message</button>
 *   </AuthGate>
 */
'use client';

import { useSession, signIn } from 'next-auth/react';
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

interface AuthGateProps {
  children: ReactNode;
  /** Called when the user clicks and IS authenticated */
  onAction?: () => void;
  /** Message shown in the modal */
  message?: string;
}

export function AuthGate({ children, onAction, message }: AuthGateProps) {
  const { data: session, status } = useSession();
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    if (status === 'loading') return;

    if (session) {
      onAction?.();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <div onClick={handleClick} className="contents">
        {children}
      </div>

      <AnimatePresence>
        {showModal && (
          <AuthModal
            message={message}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Auth Modal ─────────────────────────────────────────────────
function AuthModal({
  message = 'Sign in to continue',
  onClose,
}: {
  message?: string;
  onClose: () => void;
}) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleOAuth = async (provider: string) => {
    setIsLoading(provider);
    try {
      await signIn(provider, { callbackUrl: window.location.href });
    } catch {
      setIsLoading(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-sm mx-4 rounded-2xl border border-gold/20 bg-[#0A0A0A]/95 backdrop-blur-xl p-8 shadow-2xl shadow-gold/5"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-gold text-xl">🔒</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">
            {message}
          </h3>
          <p className="text-xs text-white/40">
            Create a free account or sign in to access this feature.
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-4">
          <button
            onClick={() => handleOAuth('google')}
            disabled={isLoading !== null}
            className="group relative w-full h-11 overflow-hidden rounded-lg bg-white/5 border border-white/10 hover:border-gold/30 hover:bg-white/10 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isLoading === 'google' ? (
              <Loader2 className="w-4 h-4 text-gold animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#fff" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                </svg>
                <span className="text-sm text-white/80">Continue with Google</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleOAuth('discord')}
            disabled={isLoading !== null}
            className="group relative w-full h-11 overflow-hidden rounded-lg bg-white/5 border border-white/10 hover:border-[#5865F2]/40 hover:bg-[#5865F2]/10 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isLoading === 'discord' ? (
              <Loader2 className="w-4 h-4 text-[#5865F2] animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"/>
                </svg>
                <span className="text-sm text-white/80">Continue with Discord</span>
              </>
            )}
          </button>
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-2">
          <div className="flex items-center gap-3 text-[0.65rem] uppercase tracking-widest text-white/20">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span>or</span>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          <div className="flex justify-center gap-4 text-sm">
            <Link href="/sign-in" className="text-gold hover:text-gold-light transition-colors">
              Sign In
            </Link>
            <span className="text-white/10">|</span>
            <Link href="/sign-up" className="text-white/50 hover:text-white transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export { AuthModal };
