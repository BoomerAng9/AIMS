'use client';

import { useState, useCallback } from 'react';
import { PropertyMap } from '@/components/PropertyMap';
import { PropertyCard } from '@/components/PropertyCard';
import { FilterPanel } from '@/components/FilterPanel';
import { ChatPanel } from '@/components/ChatPanel';
import { NavBar } from '@/components/NavBar';
import type { Property, PropertyFilters } from '@/lib/types';

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const selectedProperty = selectedId
    ? properties.find((p) => p.id === selectedId) ?? null
    : null;

  const handleFilterChange = useCallback(async (filters: PropertyFilters) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setProperties(data.properties ?? []);
      setSelectedId(null);
    } catch {
      // Search errors handled silently for now
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleBoundsChange = useCallback(
    (_bounds: { north: number; south: number; east: number; west: number }) => {
      // Could trigger a bounds-based search here
    },
    []
  );

  return (
    <div className="h-screen flex flex-col bg-[#0A0A0F]">
      <NavBar>
        <button
          type="button"
          onClick={() => setChatOpen(!chatOpen)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            chatOpen
              ? 'bg-[#D4A843] text-black'
              : 'bg-white/10 text-white hover:bg-white/15'
          }`}
        >
          {chatOpen ? 'Close Chat' : 'Ask ACHEEVY'}
        </button>
      </NavBar>

      {/* ── Main Layout ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left — Filters + Results */}
        <aside className="w-80 flex-shrink-0 border-r border-white/10 flex flex-col overflow-hidden">
          <div className="p-4 overflow-y-auto flex-shrink-0 max-h-[50%]">
            <FilterPanel onFilterChange={handleFilterChange} />
          </div>

          {/* Property List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-[#D4A843] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!isLoading && properties.length === 0 && (
              <div className="text-center py-12">
                <p className="text-zinc-500 text-sm">
                  Search for properties to get started
                </p>
              </div>
            )}

            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                selected={property.id === selectedId}
                onClick={() =>
                  setSelectedId(property.id === selectedId ? null : property.id)
                }
              />
            ))}
          </div>
        </aside>

        {/* Center — Map */}
        <main className="flex-1 relative">
          <PropertyMap
            properties={properties}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onBoundsChange={handleBoundsChange}
          />
        </main>

        {/* Right — Chat Panel (conditional) */}
        {chatOpen && (
          <aside className="w-96 flex-shrink-0 border-l border-white/10">
            <ChatPanel
              selectedProperty={selectedProperty}
              onClose={() => setChatOpen(false)}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
