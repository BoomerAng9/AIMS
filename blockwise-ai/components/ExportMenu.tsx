'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ExportOptions } from '@/lib/types';

interface ExportMenuProps {
  title: string;
  data: Record<string, unknown>;
  className?: string;
}

const EXPORT_OPTIONS: Array<{
  format: ExportOptions['format'];
  label: string;
  icon: string;
  description: string;
}> = [
  { format: 'pdf', label: 'Download PDF', icon: '📄', description: 'Save as PDF document' },
  { format: 'google_doc', label: 'Google Docs', icon: '📝', description: 'Export to Google Docs' },
  { format: 'google_sheet', label: 'Google Sheets', icon: '📊', description: 'Export as spreadsheet' },
  { format: 'email', label: 'Email to CPA', icon: '📧', description: 'Send to your accountant' },
];

export function ExportMenu({ title, data, className = '' }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = useCallback(
    async (format: ExportOptions['format']) => {
      setIsExporting(true);
      setStatus(null);
      setIsOpen(false);

      try {
        if (format === 'pdf') {
          // For PDF, fetch the HTML and trigger print dialog
          const res = await fetch('/api/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ format, title, data }),
          });
          const result = await res.json();
          if (result.html) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.write(result.html);
              printWindow.document.close();
              printWindow.print();
            }
          }
          setStatus({ type: 'success', message: 'PDF opened in print dialog' });
        } else if (format === 'email') {
          const email = window.prompt('Enter recipient email address:');
          if (!email) {
            setIsExporting(false);
            return;
          }
          const res = await fetch('/api/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ format, title, data, recipientEmail: email }),
          });
          const result = await res.json();
          if (result.error) throw new Error(result.error);
          setStatus({ type: 'success', message: result.message });
        } else {
          // Google Doc/Sheet — would need OAuth token in production
          const res = await fetch('/api/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ format, title, data }),
          });
          const result = await res.json();
          if (result.error) throw new Error(result.error);
          if (result.url) window.open(result.url, '_blank');
          setStatus({ type: 'success', message: 'Exported successfully' });
        }
      } catch (err) {
        setStatus({
          type: 'error',
          message: err instanceof Error ? err.message : 'Export failed',
        });
      } finally {
        setIsExporting(false);
      }
    },
    [title, data]
  );

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isExporting
            ? 'bg-zinc-700 text-zinc-400 cursor-wait'
            : 'bg-white/10 text-white hover:bg-white/20'
        }`}
      >
        {isExporting ? 'Exporting...' : 'Export'}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 rounded-xl bg-zinc-900 border border-white/10 shadow-xl overflow-hidden z-50"
          >
            {EXPORT_OPTIONS.map((option) => (
              <button
                key={option.format}
                type="button"
                onClick={() => handleExport(option.format)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-lg">{option.icon}</span>
                <div>
                  <div className="text-sm font-medium text-white">{option.label}</div>
                  <div className="text-xs text-zinc-500">{option.description}</div>
                </div>
              </button>
            ))}

            {/* Visual Card option */}
            <div className="border-t border-white/10">
              <button
                type="button"
                onClick={async () => {
                  setIsOpen(false);
                  setIsExporting(true);
                  try {
                    const res = await fetch('/api/visual', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ type: 'property_card', data }),
                    });
                    const result = await res.json();
                    if (result.error) throw new Error(result.error);
                    // Open the image in a new tab
                    if (result.image) {
                      const w = window.open('');
                      if (w) {
                        w.document.write(`<img src="${result.image}" alt="Property Card" style="max-width:100%"/>`);
                      }
                    }
                    setStatus({ type: 'success', message: 'Visual card generated' });
                  } catch (err) {
                    setStatus({
                      type: 'error',
                      message: err instanceof Error ? err.message : 'Visual generation failed',
                    });
                  } finally {
                    setIsExporting(false);
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-lg">🎨</span>
                <div>
                  <div className="text-sm font-medium text-[#D4A843]">Generate Visual Card</div>
                  <div className="text-xs text-zinc-500">AI-generated property report card</div>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Toast */}
      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onAnimationComplete={() => {
              setTimeout(() => setStatus(null), 3000);
            }}
            className={`absolute right-0 mt-2 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap z-50 ${
              status.type === 'success'
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {status.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
