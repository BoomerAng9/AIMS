'use client';

/**
 * FileDownload — Inline Chat File Deliverable Component
 *
 * Renders download buttons for agent-generated files directly in chat.
 * Supports markdown, JSON, CSV, HTML, and text exports.
 *
 * Features:
 * - Server-side download via /api/files/generate with client-side fallback
 * - Inline content preview (expandable)
 * - Copy-to-clipboard for text-based content
 * - Download progress animation
 * - Multi-file download group
 * - Framer Motion entrance animations
 *
 * Closes Gap G4: File Generation & Download
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Check,
  Copy,
  Eye,
  EyeOff,
  FileText,
  FileCode,
  FileSpreadsheet,
  File,
  AlertCircle,
  Loader2,
  ChevronDown,
  Package,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface FileDownloadProps {
  content: string;
  filename?: string;
  format?: 'md' | 'json' | 'csv' | 'txt' | 'html';
  label?: string;
  metadata?: Record<string, unknown>;
}

interface FormatConfig {
  icon: React.ElementType;
  label: string;
  badgeColor: string;
  mimeType: string;
}

// ─────────────────────────────────────────────────────────────
// Format configuration
// ─────────────────────────────────────────────────────────────

const FORMAT_CONFIG: Record<string, FormatConfig> = {
  md: {
    icon: FileText,
    label: 'MD',
    badgeColor: 'text-blue-500 bg-blue-50 border-blue-200',
    mimeType: 'text/markdown',
  },
  json: {
    icon: FileCode,
    label: 'JSON',
    badgeColor: 'text-emerald-500 bg-emerald-50 border-emerald-200',
    mimeType: 'application/json',
  },
  csv: {
    icon: FileSpreadsheet,
    label: 'CSV',
    badgeColor: 'text-orange-500 bg-orange-50 border-orange-200',
    mimeType: 'text/csv',
  },
  txt: {
    icon: File,
    label: 'TXT',
    badgeColor: 'text-slate-500 bg-slate-50 border-slate-200',
    mimeType: 'text/plain',
  },
  html: {
    icon: FileCode,
    label: 'HTML',
    badgeColor: 'text-amber-500 bg-amber-50 border-amber-200',
    mimeType: 'text/html',
  },
};

// ─────────────────────────────────────────────────────────────
// Client-side download fallback
// ─────────────────────────────────────────────────────────────

function downloadViaBlob(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────
// FileDownload Component
// ─────────────────────────────────────────────────────────────

export function FileDownload({
  content,
  filename,
  format = 'md',
  label,
  metadata,
}: FileDownloadProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const config = FORMAT_CONFIG[format] || FORMAT_CONFIG.txt;
  const FormatIcon = config.icon;

  const resolvedFilename = filename || `aims-export.${format}`;
  const sizeKB = useMemo(
    () => Math.round(new Blob([content]).size / 1024),
    [content]
  );
  const lineCount = useMemo(
    () => content.split('\n').length,
    [content]
  );

  // Try server-side download, fall back to client-side Blob
  const handleDownload = useCallback(async () => {
    setDownloading(true);
    setError(null);

    try {
      // Attempt server-side generation first
      const res = await fetch('/api/files/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, format, filename: resolvedFilename, metadata }),
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download =
          res.headers
            .get('content-disposition')
            ?.split('filename=')[1]
            ?.replace(/"/g, '') || resolvedFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Server failed — use client-side fallback
        downloadViaBlob(content, resolvedFilename, config.mimeType);
      }

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch {
      // Network or timeout error — use client-side fallback
      try {
        downloadViaBlob(content, resolvedFilename, config.mimeType);
        setDownloaded(true);
        setTimeout(() => setDownloaded(false), 3000);
      } catch (fallbackErr) {
        setError('Download failed. Please try again.');
        setTimeout(() => setError(null), 4000);
      }
    } finally {
      setDownloading(false);
    }
  }, [content, format, resolvedFilename, metadata, config.mimeType]);

  // Copy content to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [content]);

  // Truncated preview content
  const previewContent = useMemo(() => {
    const maxLines = 12;
    const lines = content.split('\n');
    if (lines.length <= maxLines) return content;
    return lines.slice(0, maxLines).join('\n') + '\n...';
  }, [content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
    >
      {/* Main download row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* File type badge */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center ${config.badgeColor}`}
        >
          <FormatIcon size={18} />
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700 truncate">
            {label || resolvedFilename}
          </p>
          <p className="text-sm text-slate-400 flex items-center gap-1.5">
            <span>{config.label}</span>
            <span className="text-slate-200">&middot;</span>
            <span>{sizeKB < 1 ? '<1' : sizeKB}KB</span>
            <span className="text-slate-200">&middot;</span>
            <span>{lineCount} lines</span>
            {downloaded && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-emerald-500 font-medium"
              >
                Downloaded
              </motion.span>
            )}
            {error && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-red-400 font-medium flex items-center gap-1"
              >
                <AlertCircle size={10} />
                {error}
              </motion.span>
            )}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Preview toggle */}
          <button
            onClick={() => setShowPreview((s) => !s)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            title={showPreview ? 'Hide preview' : 'Preview content'}
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className={`p-2 rounded-lg transition-colors ${
              copied
                ? 'text-emerald-500 bg-emerald-50'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
            title={copied ? 'Copied!' : 'Copy to clipboard'}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className={`p-2 rounded-lg transition-colors ${
              downloaded
                ? 'text-emerald-500 bg-emerald-50'
                : downloading
                  ? 'text-gold bg-gold/10 cursor-wait'
                  : 'text-slate-400 hover:text-gold hover:bg-gold/10'
            }`}
            title={
              downloaded ? 'Downloaded' : downloading ? 'Downloading...' : 'Download file'
            }
          >
            {downloading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : downloaded ? (
              <Check size={16} />
            ) : (
              <Download size={16} />
            )}
          </button>
        </div>
      </div>

      {/* Inline preview panel */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-4 py-3 bg-[#F8FAFC]">
              <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap break-all max-h-64 overflow-y-auto leading-relaxed">
                {previewContent}
              </pre>
              {lineCount > 12 && (
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <ChevronDown size={10} />
                  Showing first 12 of {lineCount} lines. Download to see full
                  content.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Multi-file download group
// ─────────────────────────────────────────────────────────────

export function FileDownloadGroup({ files }: { files: FileDownloadProps[] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (files.length === 0) return null;

  const totalSizeKB = files.reduce(
    (sum, f) => sum + Math.round(new Blob([f.content]).size / 1024),
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-2 mt-3"
    >
      {/* Group header */}
      <button
        onClick={() => setIsExpanded((e) => !e)}
        className="flex items-center gap-2 w-full group"
      >
        <Package
          size={12}
          className="text-slate-400 group-hover:text-gold transition-colors"
        />
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider group-hover:text-slate-600 transition-colors">
          Deliverables
        </span>
        <span className="text-xs font-mono text-slate-300">
          {files.length} file{files.length !== 1 ? 's' : ''} &middot;{' '}
          {totalSizeKB < 1 ? '<1' : totalSizeKB}KB total
        </span>
        <motion.div
          animate={{ rotate: isExpanded ? 0 : -90 }}
          transition={{ duration: 0.15 }}
          className="ml-auto"
        >
          <ChevronDown size={12} className="text-slate-300" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2 overflow-hidden"
          >
            {files.map((file, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <FileDownload {...file} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
