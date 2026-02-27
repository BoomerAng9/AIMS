'use client';

/**
 * IntakeForm — Multi-step intake form for HBM verticals
 *
 * Collects data matching the vertical chain_steps. Features:
 * - Multi-section form with progress indicator
 * - Section-by-section navigation
 * - Input types: text, textarea, select, multi-select, radio
 * - Real-time validation
 * - Submission to ACHEEVY vertical pipeline
 * - Paper form aesthetic with functional design
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp } from '@/lib/motion';
import {
  ChevronLeft, ChevronRight, Send, CheckCircle2,
  FileText, Loader2,
} from 'lucide-react';

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'radio';
  placeholder?: string;
  options?: string[];
  required?: boolean;
  helpText?: string;
}

export interface FormSection {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
}

interface IntakeFormProps {
  title: string;
  sections: FormSection[];
  onSubmit: (data: Record<string, any>) => Promise<void>;
  accentColor?: string;
  submitLabel?: string;
}

export function IntakeForm({ title, sections, onSubmit, accentColor = 'blue', submitLabel = 'Submit & Execute' }: IntakeFormProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const section = sections[currentSection];
  const isFirst = currentSection === 0;
  const isLast = currentSection === sections.length - 1;
  const progress = ((currentSection + 1) / sections.length) * 100;

  const updateField = useCallback((fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[fieldId]; return n; });
  }, []);

  const toggleMultiSelect = useCallback((fieldId: string, option: string) => {
    setFormData(prev => {
      const current = prev[fieldId] || [];
      const next = current.includes(option)
        ? current.filter((o: string) => o !== option)
        : [...current, option];
      return { ...prev, [fieldId]: next };
    });
  }, []);

  const validateSection = useCallback(() => {
    const newErrors: Record<string, string> = {};
    for (const field of section.fields) {
      if (field.required) {
        const val = formData[field.id];
        if (!val || (Array.isArray(val) && val.length === 0) || (typeof val === 'string' && !val.trim())) {
          newErrors[field.id] = 'Required';
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [section, formData]);

  const handleNext = useCallback(() => {
    if (validateSection()) {
      setCurrentSection(prev => Math.min(prev + 1, sections.length - 1));
    }
  }, [validateSection, sections.length]);

  const handleSubmit = useCallback(async () => {
    if (!validateSection()) return;
    setSubmitting(true);
    try {
      await onSubmit(formData);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }, [validateSection, formData, onSubmit]);

  if (submitted) {
    return (
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center space-y-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
        <h3 className="text-lg font-medium text-zinc-200">Assessment Submitted</h3>
        <p className="text-sm text-zinc-500">ACHEEVY has received your intake data and is dispatching the agent pipeline.</p>
      </motion.div>
    );
  }

  return (
    <div className="rounded-xl border border-wireframe-stroke bg-[#111113] overflow-hidden">
      {/* Header with progress */}
      <div className="px-5 py-3 border-b border-wireframe-stroke">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <FileText className={`w-4 h-4 text-${accentColor}-400`} />
            <span className="text-sm font-mono font-bold uppercase tracking-[0.15em] text-zinc-400">{title}</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-600">
            Section {currentSection + 1} of {sections.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full bg-[#0A0A0B] overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-${accentColor}-400`}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>

        {/* Section pills */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1">
          {sections.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { if (i < currentSection) setCurrentSection(i); }}
              className={`text-[10px] font-mono px-2.5 py-1 rounded-full border whitespace-nowrap transition-all ${
                i === currentSection
                  ? `bg-${accentColor}-500/10 border-${accentColor}-500/20 text-${accentColor}-400`
                  : i < currentSection
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-pointer'
                    : 'bg-[#0A0A0B] border-wireframe-stroke text-zinc-600'
              }`}
            >
              {i < currentSection ? '✓' : ''} {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Form Section */}
      <AnimatePresence mode="wait">
        <motion.div
          key={section.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="p-5 space-y-5"
        >
          <div>
            <h3 className="text-lg font-medium text-zinc-200">{section.title}</h3>
            <p className="text-xs text-zinc-500 mt-1">{section.description}</p>
          </div>

          <div className="space-y-4">
            {section.fields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-zinc-400 flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-red-400">*</span>}
                </label>

                {field.helpText && (
                  <p className="text-[10px] text-zinc-600">{field.helpText}</p>
                )}

                {field.type === 'text' && (
                  <input
                    type="text"
                    value={formData[field.id] || ''}
                    onChange={(e) => updateField(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full px-3 py-2.5 text-sm bg-[#0A0A0B] border rounded-lg text-zinc-300 placeholder:text-zinc-700 focus:outline-none transition-colors ${
                      errors[field.id] ? 'border-red-500/40 focus:border-red-500/60' : 'border-wireframe-stroke focus:border-blue-500/30'
                    }`}
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    value={formData[field.id] || ''}
                    onChange={(e) => updateField(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className={`w-full px-3 py-2.5 text-sm bg-[#0A0A0B] border rounded-lg text-zinc-300 placeholder:text-zinc-700 focus:outline-none resize-y transition-colors ${
                      errors[field.id] ? 'border-red-500/40 focus:border-red-500/60' : 'border-wireframe-stroke focus:border-blue-500/30'
                    }`}
                  />
                )}

                {field.type === 'select' && (
                  <select
                    value={formData[field.id] || ''}
                    onChange={(e) => updateField(field.id, e.target.value)}
                    className={`w-full px-3 py-2.5 text-sm bg-[#0A0A0B] border rounded-lg text-zinc-300 focus:outline-none transition-colors ${
                      errors[field.id] ? 'border-red-500/40' : 'border-wireframe-stroke focus:border-blue-500/30'
                    }`}
                  >
                    <option value="">Select...</option>
                    {field.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}

                {field.type === 'radio' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {field.options?.map(opt => (
                      <button
                        key={opt}
                        onClick={() => updateField(field.id, opt)}
                        className={`px-3 py-2.5 text-sm rounded-lg border text-left transition-all ${
                          formData[field.id] === opt
                            ? `bg-${accentColor}-500/10 border-${accentColor}-500/30 text-${accentColor}-400`
                            : 'bg-[#0A0A0B] border-wireframe-stroke text-zinc-400 hover:border-white/10'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {field.type === 'multiselect' && (
                  <div className="flex flex-wrap gap-2">
                    {field.options?.map(opt => {
                      const selected = (formData[field.id] || []).includes(opt);
                      return (
                        <button
                          key={opt}
                          onClick={() => toggleMultiSelect(field.id, opt)}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                            selected
                              ? `bg-${accentColor}-500/10 border-${accentColor}-500/30 text-${accentColor}-400`
                              : 'bg-[#0A0A0B] border-wireframe-stroke text-zinc-500 hover:border-white/10'
                          }`}
                        >
                          {selected ? '✓ ' : ''}{opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {errors[field.id] && (
                  <p className="text-[10px] text-red-400">{errors[field.id]}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="px-5 py-3 border-t border-wireframe-stroke flex items-center justify-between">
        <button
          onClick={() => setCurrentSection(prev => Math.max(prev - 1, 0))}
          disabled={isFirst}
          className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back
        </button>

        {isLast ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`px-4 py-2 rounded-lg bg-${accentColor}-500/10 border border-${accentColor}-500/20 text-${accentColor}-400 text-xs font-mono hover:bg-${accentColor}-500/20 disabled:opacity-40 transition-all flex items-center gap-1.5`}
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {submitLabel}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className={`px-4 py-2 rounded-lg bg-${accentColor}-500/10 border border-${accentColor}-500/20 text-${accentColor}-400 text-xs font-mono hover:bg-${accentColor}-500/20 transition-all flex items-center gap-1.5`}
          >
            Continue
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
