'use client';

import { useState, useCallback } from 'react';
import type { PropertyFilters, PropertyType, DealStatus } from '@/lib/types';

interface FilterPanelProps {
  onFilterChange: (filters: PropertyFilters) => void;
}

// ── Property Type Options ──

const PROPERTY_TYPE_OPTIONS: Array<{ value: PropertyType; label: string }> = [
  { value: 'single_family', label: 'Single Family' },
  { value: 'multi_family', label: 'Multi Family' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
];

// ── Deal Status Options ──

const DEAL_STATUS_OPTIONS: Array<{ value: DealStatus; label: string; color: string }> = [
  { value: 'excellent', label: 'Excellent', color: '#22c55e' },
  { value: 'good', label: 'Good', color: '#D4A843' },
  { value: 'marginal', label: 'Marginal', color: '#f97316' },
  { value: 'pass', label: 'Pass', color: '#ef4444' },
];

// ── Bedroom Options ──

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5] as const;

// ── Chevron Icon ──

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ── Magnifying Glass Icon ──

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-zinc-500"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// ── Collapsible Section ──

function FilterSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 px-1 text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
      >
        {title}
        <ChevronIcon open={open} />
      </button>
      {open && <div className="pb-4 px-1">{children}</div>}
    </div>
  );
}

// ── Main Component ──

export function FilterPanel({ onFilterChange }: FilterPanelProps) {
  // Filter values
  const [location, setLocation] = useState('');
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [bedrooms, setBedrooms] = useState<number | null>(null);
  const [arvMin, setArvMin] = useState<string>('');
  const [arvMax, setArvMax] = useState<string>('');
  const [dealStatuses, setDealStatuses] = useState<DealStatus[]>([]);

  // Section collapse state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    location: true,
    price: true,
    propertyType: true,
    bedrooms: true,
    arv: false,
    dealStatus: true,
  });

  const toggleSection = useCallback((key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Toggle property type checkbox
  const togglePropertyType = useCallback((type: PropertyType) => {
    setPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  // Toggle deal status checkbox
  const toggleDealStatus = useCallback((status: DealStatus) => {
    setDealStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  }, []);

  // Build and emit filters
  const handleSearch = useCallback(() => {
    const filters: PropertyFilters = {
      location,
    };

    if (priceMin) filters.priceMin = Number(priceMin);
    if (priceMax) filters.priceMax = Number(priceMax);
    if (arvMin) filters.arvMin = Number(arvMin);
    if (arvMax) filters.arvMax = Number(arvMax);
    if (propertyTypes.length > 0) filters.propertyType = propertyTypes;
    if (bedrooms !== null) filters.bedroomsMin = bedrooms;
    if (dealStatuses.length > 0) filters.dealStatus = dealStatuses;

    onFilterChange(filters);
  }, [location, priceMin, priceMax, arvMin, arvMax, propertyTypes, bedrooms, dealStatuses, onFilterChange]);

  // Handle Enter key in location input
  const handleLocationKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  return (
    <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 space-y-0">
      <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3 px-1">
        Filters
      </h2>

      {/* ── 1. Location ── */}
      <FilterSection
        title="Location"
        open={openSections.location}
        onToggle={() => toggleSection('location')}
      >
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={handleLocationKeyDown}
            placeholder="City, ZIP, or address..."
            className="
              w-full pl-10 pr-3 py-2.5 rounded-lg text-sm
              bg-white/5 border border-white/10 text-white
              placeholder:text-zinc-500
              focus:outline-none focus:border-[#D4A843] focus:ring-1 focus:ring-[#D4A843]/30
              transition-colors
            "
          />
        </div>
      </FilterSection>

      {/* ── 2. Price Range ── */}
      <FilterSection
        title="Price Range"
        open={openSections.price}
        onToggle={() => toggleSection('price')}
      >
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            placeholder="Min"
            min={0}
            className="
              flex-1 px-3 py-2 rounded-lg text-sm
              bg-white/5 border border-white/10 text-white
              placeholder:text-zinc-500
              focus:outline-none focus:border-[#D4A843] focus:ring-1 focus:ring-[#D4A843]/30
              transition-colors
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            "
          />
          <span className="text-zinc-500 text-xs">to</span>
          <input
            type="number"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            placeholder="Max"
            min={0}
            className="
              flex-1 px-3 py-2 rounded-lg text-sm
              bg-white/5 border border-white/10 text-white
              placeholder:text-zinc-500
              focus:outline-none focus:border-[#D4A843] focus:ring-1 focus:ring-[#D4A843]/30
              transition-colors
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            "
          />
        </div>
      </FilterSection>

      {/* ── 3. Property Type ── */}
      <FilterSection
        title="Property Type"
        open={openSections.propertyType}
        onToggle={() => toggleSection('propertyType')}
      >
        <div className="space-y-2">
          {PROPERTY_TYPE_OPTIONS.map(({ value, label }) => {
            const checked = propertyTypes.includes(value);
            return (
              <label
                key={value}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div
                  className={`
                    w-4 h-4 rounded border flex items-center justify-center transition-colors
                    ${checked
                      ? 'bg-[#D4A843] border-[#D4A843]'
                      : 'bg-white/5 border-white/20 group-hover:border-white/40'
                    }
                  `}
                >
                  {checked && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm ${checked ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-300'} transition-colors`}>
                  {label}
                </span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* ── 4. Bedrooms ── */}
      <FilterSection
        title="Bedrooms"
        open={openSections.bedrooms}
        onToggle={() => toggleSection('bedrooms')}
      >
        <div className="flex items-center gap-2">
          {BEDROOM_OPTIONS.map((num) => {
            const isSelected = bedrooms === num;
            const displayLabel = num === 5 ? '5+' : String(num);
            return (
              <button
                key={num}
                type="button"
                onClick={() => setBedrooms(isSelected ? null : num)}
                className={`
                  flex-1 py-2 rounded-lg text-sm font-semibold transition-colors
                  ${isSelected
                    ? 'bg-[#D4A843] text-black'
                    : 'bg-white/5 text-zinc-400 border border-white/10 hover:text-white hover:border-white/20'
                  }
                `}
              >
                {displayLabel}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* ── 5. ARV Range ── */}
      <FilterSection
        title="ARV Range"
        open={openSections.arv}
        onToggle={() => toggleSection('arv')}
      >
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={arvMin}
            onChange={(e) => setArvMin(e.target.value)}
            placeholder="Min ARV"
            min={0}
            className="
              flex-1 px-3 py-2 rounded-lg text-sm
              bg-white/5 border border-white/10 text-white
              placeholder:text-zinc-500
              focus:outline-none focus:border-[#D4A843] focus:ring-1 focus:ring-[#D4A843]/30
              transition-colors
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            "
          />
          <span className="text-zinc-500 text-xs">to</span>
          <input
            type="number"
            value={arvMax}
            onChange={(e) => setArvMax(e.target.value)}
            placeholder="Max ARV"
            min={0}
            className="
              flex-1 px-3 py-2 rounded-lg text-sm
              bg-white/5 border border-white/10 text-white
              placeholder:text-zinc-500
              focus:outline-none focus:border-[#D4A843] focus:ring-1 focus:ring-[#D4A843]/30
              transition-colors
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            "
          />
        </div>
      </FilterSection>

      {/* ── 6. Deal Status ── */}
      <FilterSection
        title="Deal Status"
        open={openSections.dealStatus}
        onToggle={() => toggleSection('dealStatus')}
      >
        <div className="space-y-2">
          {DEAL_STATUS_OPTIONS.map(({ value, label, color }) => {
            const checked = dealStatuses.includes(value);
            return (
              <label
                key={value}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div
                  className={`
                    w-4 h-4 rounded border flex items-center justify-center transition-colors
                    ${checked
                      ? 'border-transparent'
                      : 'bg-white/5 border-white/20 group-hover:border-white/40'
                    }
                  `}
                  style={checked ? { backgroundColor: color, borderColor: color } : undefined}
                >
                  {checked && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className={`text-sm ${checked ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-300'} transition-colors`}>
                    {label}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* ── 7. Search Button ── */}
      <div className="pt-4 px-1">
        <button
          type="button"
          onClick={handleSearch}
          className="
            w-full py-3 rounded-lg text-sm font-bold
            bg-[#D4A843] text-black
            hover:bg-[#c49a3a] active:bg-[#b8902f]
            transition-colors duration-150
          "
        >
          Search
        </button>
      </div>
    </div>
  );
}
