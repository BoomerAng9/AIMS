'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { GenerativeBlock } from '@/lib/bridge/types';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'toggle' | 'textarea';
  required?: boolean;
  default?: string | number | boolean;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  description?: string;
}

interface ConfigFormData {
  title: string;
  description?: string;
  fields: FormField[];
  submitLabel?: string;
}

interface Props {
  block: GenerativeBlock;
  onAction?: (action: string, data?: Record<string, unknown>) => void;
}

export default function ConfigForm({ block, onAction }: Props) {
  const data = block.data as unknown as ConfigFormData;
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const defaults: Record<string, unknown> = {};
    data.fields.forEach((f) => {
      if (f.default !== undefined) defaults[f.name] = f.default;
    });
    return defaults;
  });

  const updateField = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onAction?.('form_submit', values);
  };

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-zinc-100">
          ⚙️ {data.title}
        </CardTitle>
        {data.description && (
          <p className="text-sm text-slate-500 mt-1">{data.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {data.fields.map((field) => (
          <div key={field.name} className="space-y-1">
            <label className="text-sm font-medium text-zinc-300">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.description && (
              <p className="text-xs text-slate-400">{field.description}</p>
            )}
            {field.type === 'text' && (
              <input
                type="text"
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
                placeholder={field.placeholder}
                value={(values[field.name] as string) || ''}
                onChange={(e) => updateField(field.name, e.target.value)}
              />
            )}
            {field.type === 'number' && (
              <input
                type="number"
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
                placeholder={field.placeholder}
                value={(values[field.name] as number) ?? ''}
                onChange={(e) => updateField(field.name, Number(e.target.value))}
              />
            )}
            {field.type === 'textarea' && (
              <textarea
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300 min-h-[80px]"
                placeholder={field.placeholder}
                value={(values[field.name] as string) || ''}
                onChange={(e) => updateField(field.name, e.target.value)}
              />
            )}
            {field.type === 'select' && field.options && (
              <select
                aria-label={field.label}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
                value={(values[field.name] as string) || ''}
                onChange={(e) => updateField(field.name, e.target.value)}
              >
                <option value="">Select...</option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
            {field.type === 'toggle' && (
              <button
                type="button"
                role="switch"
                title={field.label}
                aria-checked={values[field.name] ? 'true' : 'false'}
                aria-label={field.label}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  values[field.name] ? 'bg-blue-600' : 'bg-white/10'
                }`}
                onClick={() => updateField(field.name, !values[field.name])}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    values[field.name] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            )}
          </div>
        ))}
      </CardContent>
      {block.interactive && (
        <CardFooter className="gap-2">
          <Button variant="acheevy" size="sm" onClick={handleSubmit}>
            {data.submitLabel || 'Submit'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction?.('cancel', {})}
          >
            Cancel
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
