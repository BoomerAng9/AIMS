'use client';

/**
 * FileDownload — Inline Chat File Deliverable Component
 *
 * Renders download buttons for agent-generated files directly in chat.
 * Supports markdown, JSON, CSV, HTML, and text exports.
 *
 * Closes Gap G4: File Generation & Download
 */

import { useState, useCallback } from 'react';

interface FileDownloadProps {
  content: string;
  filename?: string;
  format?: 'md' | 'json' | 'csv' | 'txt' | 'html';
  label?: string;
  metadata?: Record<string, unknown>;
}

const FORMAT_ICONS: Record<string, { icon: string; color: string }> = {
  md:   { icon: 'MD',   color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  json: { icon: 'JSON', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  csv:  { icon: 'CSV',  color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  txt:  { icon: 'TXT',  color: 'text-slate-500 bg-slate-50 border-slate-200' },
  html: { icon: 'HTML', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
};

export function FileDownload({ content, filename, format = 'md', label, metadata }: FileDownloadProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const config = FORMAT_ICONS[format] || FORMAT_ICONS.txt;

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/files/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, format, filename, metadata }),
      });

      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '')
        || `${filename || 'aims-export'}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  }, [content, format, filename, metadata]);

  const sizeKB = Math.round(new Blob([content]).size / 1024);

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
        ${downloaded
          ? 'border-green-500/30 bg-green-500/5'
          : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-200'
        }
        ${downloading ? 'opacity-60 cursor-wait' : 'cursor-pointer'}
      `}
    >
      {/* File type badge */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center ${config.color}`}>
        <span className="text-[10px] font-bold">{config.icon}</span>
      </div>

      {/* File info */}
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">
          {label || filename || `Export.${format}`}
        </p>
        <p className="text-[11px] text-slate-400">
          {format.toUpperCase()} &middot; {sizeKB}KB
          {downloaded && <span className="text-green-400 ml-2">Downloaded</span>}
        </p>
      </div>

      {/* Download icon */}
      <div className="flex-shrink-0">
        {downloading ? (
          <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        ) : downloaded ? (
          <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        )}
      </div>
    </button>
  );
}

/**
 * Multi-file download group — for when agents produce multiple deliverables
 */
export function FileDownloadGroup({ files }: { files: FileDownloadProps[] }) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-2 mt-3">
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Deliverables</p>
      {files.map((file, i) => (
        <FileDownload key={i} {...file} />
      ))}
    </div>
  );
}
