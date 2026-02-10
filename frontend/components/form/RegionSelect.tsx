'use client';

/**
 * Region Selection Components
 * Modern typeahead auto-complete for country, state, city, postal code
 * 2026 standards: Fast, accessible, mobile-friendly
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COUNTRIES,
  searchCountries,
  searchAdminAreas,
  getAdminAreas,
  type Country,
} from '@/lib/region/types';

// ─────────────────────────────────────────────────────────────
// Typeahead Dropdown Base Component
// ─────────────────────────────────────────────────────────────

interface TypeaheadOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: string;
}

interface TypeaheadDropdownProps {
  isOpen: boolean;
  options: TypeaheadOption[];
  selectedValue?: string;
  onSelect: (option: TypeaheadOption) => void;
  loading?: boolean;
  emptyMessage?: string;
}

function TypeaheadDropdown({
  isOpen,
  options,
  selectedValue,
  onSelect,
  loading,
  emptyMessage = 'No results found',
}: TypeaheadDropdownProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="absolute z-50 w-full mt-1 bg-black/95 backdrop-blur-xl border border-wireframe-stroke rounded-xl shadow-2xl overflow-hidden"
        >
          {loading ? (
            <div className="px-4 py-3 text-sm text-white/40">
              <span className="inline-block animate-pulse">Searching...</span>
            </div>
          ) : options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-white/40">
              {emptyMessage}
            </div>
          ) : (
            <ul className="max-h-60 overflow-y-auto py-1">
              {options.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => onSelect(option)}
                    className={`
                      w-full px-4 py-2.5 text-left flex items-center gap-3
                      transition-colors
                      ${option.value === selectedValue
                        ? 'bg-gold/10 text-white'
                        : 'hover:bg-white/5 text-white/70'
                      }
                    `}
                  >
                    {option.icon && (
                      <span className="text-lg">{option.icon}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {option.label}
                      </p>
                      {option.sublabel && (
                        <p className="text-xs text-white/40 truncate">
                          {option.sublabel}
                        </p>
                      )}
                    </div>
                    {option.value === selectedValue && (
                      <span className="text-gold">✓</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────
// Country Select Component
// ─────────────────────────────────────────────────────────────

interface CountrySelectProps {
  value?: string;
  onChange: (country: Country | null) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export function CountrySelect({
  value,
  onChange,
  placeholder = 'Select country',
  label,
  error,
  disabled,
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<TypeaheadOption[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCountry = COUNTRIES.find(c => c.code === value);

  // Search countries as user types
  useEffect(() => {
    const results = searchCountries(query);
    setOptions(
      results.map(c => ({
        value: c.code,
        label: c.name,
        sublabel: c.code,
        icon: c.flag,
      }))
    );
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((option: TypeaheadOption) => {
    const country = COUNTRIES.find(c => c.code === option.value) || null;
    onChange(country);
    setQuery('');
    setIsOpen(false);
  }, [onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (selectedCountry) {
      setQuery(selectedCountry.name);
      inputRef.current?.select();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
    if (e.key === 'Enter' && options.length > 0) {
      e.preventDefault();
      handleSelect(options[0]);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs text-white/50 mb-1.5">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Selected flag indicator */}
        {selectedCountry && !isOpen && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">
            {selectedCountry.flag}
          </span>
        )}

        <input
          ref={inputRef}
          type="text"
          value={isOpen ? query : selectedCountry?.name || ''}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full h-11 rounded-xl border bg-black/60 px-3 text-sm text-white
            outline-none transition-all placeholder:text-white/20
            ${selectedCountry && !isOpen ? 'pl-10' : ''}
            ${error
              ? 'border-red-500/50 focus:border-red-500'
              : 'border-wireframe-stroke focus:border-gold/30'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />

        {/* Dropdown arrow */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50"
        >
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▼
          </motion.span>
        </button>
      </div>

      {/* Dropdown */}
      <TypeaheadDropdown
        isOpen={isOpen}
        options={options}
        selectedValue={value}
        onSelect={handleSelect}
        emptyMessage="No countries found"
      />

      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// State/Province Select Component
// ─────────────────────────────────────────────────────────────

interface StateSelectProps {
  countryCode: string;
  value?: string;
  onChange: (value: string | null) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export function StateSelect({
  countryCode,
  value,
  onChange,
  placeholder = 'Select state/province',
  label,
  error,
  disabled,
}: StateSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<TypeaheadOption[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const adminAreas = getAdminAreas(countryCode);
  const selectedArea = adminAreas.find(a => a.code === value || a.name === value);
  const hasAreas = adminAreas.length > 0;

  // Search admin areas as user types
  useEffect(() => {
    if (!countryCode) {
      setOptions([]);
      return;
    }

    const results = searchAdminAreas(countryCode, query);
    setOptions(
      results.map(a => ({
        value: a.code,
        label: a.name,
        sublabel: a.code,
      }))
    );
  }, [countryCode, query]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((option: TypeaheadOption) => {
    onChange(option.value);
    setQuery('');
    setIsOpen(false);
  }, [onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (!isOpen && hasAreas) setIsOpen(true);
    // For freeform input (countries without predefined areas)
    if (!hasAreas) {
      onChange(e.target.value || null);
    }
  };

  const handleFocus = () => {
    if (hasAreas) {
      setIsOpen(true);
      if (selectedArea) {
        setQuery(selectedArea.name);
        inputRef.current?.select();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
    if (e.key === 'Enter' && options.length > 0) {
      e.preventDefault();
      handleSelect(options[0]);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs text-white/50 mb-1.5">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? query : selectedArea?.name || value || ''}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || !countryCode}
          className={`
            w-full h-11 rounded-xl border bg-black/60 px-3 text-sm text-white
            outline-none transition-all placeholder:text-white/20
            ${error
              ? 'border-red-500/50 focus:border-red-500'
              : 'border-wireframe-stroke focus:border-gold/30'
            }
            ${disabled || !countryCode ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />

        {hasAreas && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50"
          >
            <motion.span
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              ▼
            </motion.span>
          </button>
        )}
      </div>

      {/* Dropdown (only for countries with predefined areas) */}
      {hasAreas && (
        <TypeaheadDropdown
          isOpen={isOpen}
          options={options}
          selectedValue={value}
          onSelect={handleSelect}
          emptyMessage="No states/provinces found"
        />
      )}

      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// City Input Component (freeform with optional suggestions)
// ─────────────────────────────────────────────────────────────

interface CityInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export function CityInput({
  value = '',
  onChange,
  placeholder = 'Enter city',
  label,
  error,
  disabled,
}: CityInputProps) {
  return (
    <div>
      {label && (
        <label className="block text-xs text-white/50 mb-1.5">
          {label}
        </label>
      )}

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full h-11 rounded-xl border bg-black/60 px-3 text-sm text-white
          outline-none transition-all placeholder:text-white/20
          ${error
            ? 'border-red-500/50 focus:border-red-500'
            : 'border-wireframe-stroke focus:border-gold/30'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      />

      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Postal Code Input Component
// ─────────────────────────────────────────────────────────────

interface PostalCodeInputProps {
  countryCode?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export function PostalCodeInput({
  countryCode,
  value = '',
  onChange,
  placeholder,
  label,
  error,
  disabled,
}: PostalCodeInputProps) {
  // Format placeholder and validation based on country
  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    switch (countryCode) {
      case 'US':
        return '12345 or 12345-6789';
      case 'CA':
        return 'A1A 1A1';
      case 'GB':
        return 'SW1A 1AA';
      default:
        return 'Postal code';
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-xs text-white/50 mb-1.5">
          {label}
        </label>
      )}

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        placeholder={getPlaceholder()}
        disabled={disabled}
        className={`
          w-full h-11 rounded-xl border bg-black/60 px-3 text-sm text-white
          outline-none transition-all placeholder:text-white/20
          ${error
            ? 'border-red-500/50 focus:border-red-500'
            : 'border-wireframe-stroke focus:border-gold/30'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      />

      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Combined Region Form Component
// ─────────────────────────────────────────────────────────────

interface RegionFormData {
  country: Country | null;
  state: string | null;
  city: string;
  postalCode: string;
}

interface RegionFormProps {
  value: Partial<RegionFormData>;
  onChange: (data: RegionFormData) => void;
  showFullAddress?: boolean;
  errors?: Partial<Record<keyof RegionFormData, string>>;
}

export function RegionForm({
  value,
  onChange,
  showFullAddress = false,
  errors = {},
}: RegionFormProps) {
  const handleChange = (field: keyof RegionFormData, fieldValue: any) => {
    const newData = {
      country: value.country || null,
      state: value.state || null,
      city: value.city || '',
      postalCode: value.postalCode || '',
      [field]: fieldValue,
    };

    // Reset state when country changes
    if (field === 'country') {
      newData.state = null;
    }

    onChange(newData);
  };

  return (
    <div className="space-y-4">
      {/* Country */}
      <CountrySelect
        label="Country"
        value={value.country?.code}
        onChange={(country) => handleChange('country', country)}
        error={errors.country}
      />

      {/* State/Province + City (side by side on desktop) */}
      {showFullAddress && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StateSelect
            label="State / Province"
            countryCode={value.country?.code || ''}
            value={value.state || undefined}
            onChange={(state) => handleChange('state', state)}
            error={errors.state}
            disabled={!value.country}
          />

          <CityInput
            label="City"
            value={value.city}
            onChange={(city) => handleChange('city', city)}
            error={errors.city}
          />
        </div>
      )}

      {/* Postal Code */}
      {showFullAddress && (
        <div className="w-full md:w-1/2">
          <PostalCodeInput
            label="Postal Code"
            countryCode={value.country?.code}
            value={value.postalCode}
            onChange={(postalCode) => handleChange('postalCode', postalCode)}
            error={errors.postalCode}
          />
        </div>
      )}
    </div>
  );
}

export default CountrySelect;
