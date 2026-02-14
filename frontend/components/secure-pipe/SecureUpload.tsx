// frontend/components/secure-pipe/SecureUpload.tsx
'use client';

/**
 * SecureUpload — Module 1: "The Vault" (Secure Drop Zone)
 *
 * Drag-and-drop zone with encryption visuals.
 * Users drop raw PDFs; Analyst_Ang OCRs and extracts data.
 *
 * Ref: aims-skills/skills/design/frontend-design-spec.md — Module 1
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { Upload, Lock, FileText, CheckCircle, Loader2, ShieldCheck, X } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type FileStatus = 'queued' | 'encrypting' | 'parsing' | 'done' | 'error';

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  status: FileStatus;
  progress: number;
  agentMessage?: string;
  extractedFields?: number;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function SecureUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([
    {
      id: 'f1',
      name: 'Invoice_1024.pdf',
      size: '2.4 MB',
      status: 'done',
      progress: 100,
      agentMessage: 'Analyst_Ang extracted 24 fields',
      extractedFields: 24,
    },
    {
      id: 'f2',
      name: 'BankStatement_Jan2026.pdf',
      size: '5.1 MB',
      status: 'parsing',
      progress: 67,
      agentMessage: 'Analyst_Ang is parsing BankStatement_Jan2026.pdf...',
    },
  ]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles: UploadedFile[] = droppedFiles.map((f, i) => ({
      id: `f-${Date.now()}-${i}`,
      name: f.name,
      size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      status: 'encrypting' as FileStatus,
      progress: 0,
    }));
    setFiles((prev) => [...newFiles, ...prev]);

    // Simulate progression
    newFiles.forEach((newFile) => {
      setTimeout(() => {
        setFiles((prev) => prev.map((f) =>
          f.id === newFile.id ? { ...f, status: 'parsing', progress: 45, agentMessage: `Analyst_Ang is parsing ${f.name}...` } : f,
        ));
      }, 1500);
      setTimeout(() => {
        setFiles((prev) => prev.map((f) =>
          f.id === newFile.id ? { ...f, status: 'done', progress: 100, agentMessage: `Analyst_Ang extracted 18 fields`, extractedFields: 18 } : f,
        ));
      }, 4000);
    });
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const statusConfig: Record<FileStatus, { icon: React.ReactNode; color: string; label: string }> = {
    queued: { icon: <Upload className="w-4 h-4" />, color: 'text-white/40', label: 'Queued' },
    encrypting: { icon: <Lock className="w-4 h-4 animate-pulse" />, color: 'text-gold', label: 'Encrypting' },
    parsing: { icon: <Loader2 className="w-4 h-4 animate-spin" />, color: 'text-cb-cyan', label: 'Parsing' },
    done: { icon: <CheckCircle className="w-4 h-4" />, color: 'text-cb-green', label: 'Complete' },
    error: { icon: <X className="w-4 h-4" />, color: 'text-cb-red', label: 'Error' },
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gold">The Vault</h3>
          <p className="text-xs text-white/40">Secure document drop zone — encrypted on upload</p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 cursor-pointer
          ${isDragging
            ? 'border-gold bg-gold/10 shadow-[0_0_40px_rgba(212,175,55,0.15)]'
            : 'border-wireframe-stroke bg-black/30 hover:border-gold/30 hover:bg-gold/5'
          }
        `}
      >
        {/* Padlock animation */}
        <motion.div
          animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="flex flex-col items-center gap-3"
        >
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
            isDragging ? 'bg-gold/20 border border-gold/40' : 'bg-white/5 border border-wireframe-stroke'
          }`}>
            <Lock className={`w-8 h-8 transition-colors ${isDragging ? 'text-gold' : 'text-white/20'}`} />
          </div>
          <div>
            <p className={`text-sm font-semibold transition-colors ${isDragging ? 'text-gold' : 'text-white/50'}`}>
              {isDragging ? 'Release to encrypt & upload' : 'Drop files here to begin secure processing'}
            </p>
            <p className="text-[11px] text-white/25 mt-1">
              PDF, CSV, XLSX — Bank statements, invoices, payroll docs
            </p>
          </div>
        </motion.div>

        {/* Corner lock indicators */}
        {isDragging && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute top-3 left-3">
              <Lock className="w-4 h-4 text-gold/40" />
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute top-3 right-3">
              <Lock className="w-4 h-4 text-gold/40" />
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute bottom-3 left-3">
              <Lock className="w-4 h-4 text-gold/40" />
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute bottom-3 right-3">
              <Lock className="w-4 h-4 text-gold/40" />
            </motion.div>
          </>
        )}
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <AnimatePresence>
            {files.map((file) => {
              const sc = statusConfig[file.status];
              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlassCard className={`!p-3 ${
                    file.status === 'done' ? 'border-cb-green/20' :
                    file.status === 'parsing' ? 'border-cb-cyan/20' :
                    file.status === 'encrypting' ? 'border-gold/20' :
                    'border-wireframe-stroke'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 ${sc.color}`}>
                        {sc.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                          <span className="text-sm font-medium text-white truncate">{file.name}</span>
                          <span className="text-[10px] text-white/20">{file.size}</span>
                        </div>
                        {file.agentMessage && (
                          <p className={`text-[11px] mt-0.5 font-mono ${
                            file.status === 'done' ? 'text-cb-green/70' : 'text-cb-cyan/70'
                          }`}>
                            {file.agentMessage}
                          </p>
                        )}
                        {/* Progress bar */}
                        {file.status !== 'done' && file.status !== 'error' && (
                          <div className="w-full h-1 rounded-full bg-black/50 mt-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${file.progress}%` }}
                              transition={{ duration: 0.5 }}
                              className={`h-full rounded-full ${
                                file.status === 'encrypting' ? 'bg-gold' : 'bg-cb-cyan'
                              }`}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-mono uppercase tracking-wider ${sc.color}`}>
                          {sc.label}
                        </span>
                        {file.extractedFields && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-cb-green/10 text-cb-green font-bold">
                            {file.extractedFields} fields
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="p-1 rounded hover:bg-white/10 transition-colors"
                        >
                          <X className="w-3 h-3 text-white/20" />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default SecureUpload;
