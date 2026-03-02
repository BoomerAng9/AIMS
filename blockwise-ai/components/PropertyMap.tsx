'use client';

import { useState, useCallback } from 'react';
import { Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import type { Property, DealStatus } from '@/lib/types';
import { getStreetViewUrl } from '@/lib/google-maps';

interface PropertyMapProps {
  properties: Property[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onBoundsChange: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
}

const DEAL_STATUS_COLORS: Record<DealStatus, string> = {
  excellent: '#22c55e',
  good: '#D4A843',
  marginal: '#f97316',
  pass: '#ef4444',
  unknown: '#71717a',
};

const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  excellent: 'Excellent Deal',
  good: 'Good Deal',
  marginal: 'Marginal',
  pass: 'Pass',
  unknown: 'Unknown',
};

function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    return `$${(price / 1_000_000).toFixed(1)}M`;
  }
  if (price >= 1_000) {
    return `$${(price / 1_000).toFixed(0)}K`;
  }
  return `$${price.toLocaleString()}`;
}

function formatFullPrice(price: number): string {
  return `$${price.toLocaleString()}`;
}

const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a0f' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#71717a' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#27273a' }],
  },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#52525b' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#1e1e30' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#52525b' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#1a2e1a' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#27273a' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1a1a2e' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#2d2d44' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1a1a2e' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#1e1e30' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0d1b2a' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3a3a5c' }],
  },
];

export function PropertyMap({
  properties,
  selectedId,
  onSelect,
  onBoundsChange,
}: PropertyMapProps) {
  const [infoOpen, setInfoOpen] = useState(true);

  const selectedProperty = selectedId
    ? properties.find((p) => p.id === selectedId) ?? null
    : null;

  const handleCameraChanged = useCallback(
    (event: { detail: { bounds: { north: number; south: number; east: number; west: number } } }) => {
      const { bounds } = event.detail;
      if (bounds) {
        onBoundsChange({
          north: bounds.north,
          south: bounds.south,
          east: bounds.east,
          west: bounds.west,
        });
      }
    },
    [onBoundsChange]
  );

  const handleMarkerClick = useCallback(
    (id: string) => {
      onSelect(id);
      setInfoOpen(true);
    },
    [onSelect]
  );

  return (
    <div className="w-full h-full bg-[#0A0A0F] rounded-xl overflow-hidden">
      <Map
        defaultCenter={{ lat: 39.8, lng: -98.5 }}
        defaultZoom={4}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapId="blockwise-dark-map"
        styles={DARK_MAP_STYLES}
        onCameraChanged={handleCameraChanged}
        style={{ width: '100%', height: '100%' }}
      >
        {properties.map((property) => {
          const isSelected = property.id === selectedId;
          const pinColor = isSelected ? '#D4A843' : '#71717a';

          return (
            <AdvancedMarker
              key={property.id}
              position={{ lat: property.lat, lng: property.lng }}
              onClick={() => handleMarkerClick(property.id)}
            >
              <div
                className="flex flex-col items-center cursor-pointer"
                style={{ transform: isSelected ? 'scale(1.15)' : 'scale(1)' }}
              >
                <div
                  className="px-2 py-1 rounded-md text-xs font-bold text-white shadow-lg whitespace-nowrap"
                  style={{
                    backgroundColor: pinColor,
                    border: isSelected ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                    boxShadow: isSelected
                      ? '0 0 12px rgba(212, 168, 67, 0.5)'
                      : '0 2px 6px rgba(0,0,0,0.4)',
                  }}
                >
                  {formatPrice(property.price)}
                </div>
                <div
                  className="w-0 h-0"
                  style={{
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: `6px solid ${pinColor}`,
                  }}
                />
              </div>
            </AdvancedMarker>
          );
        })}

        {selectedProperty && infoOpen && (
          <InfoWindow
            position={{ lat: selectedProperty.lat, lng: selectedProperty.lng }}
            onCloseClick={() => setInfoOpen(false)}
            pixelOffset={[0, -40]}
          >
            <div className="w-72 font-sans" style={{ color: '#e4e4e7' }}>
              <div className="overflow-hidden rounded-t-lg">
                <img
                  src={getStreetViewUrl(selectedProperty.lat, selectedProperty.lng, 400, 200)}
                  alt={`Street view of ${selectedProperty.address}`}
                  className="w-full h-36 object-cover"
                  style={{ display: 'block' }}
                />
              </div>

              <div
                className="p-3 rounded-b-lg"
                style={{ backgroundColor: '#1a1a2e' }}
              >
                <p
                  className="text-sm font-medium leading-snug mb-1"
                  style={{ color: '#e4e4e7' }}
                >
                  {selectedProperty.address}
                </p>

                <p
                  className="text-lg font-bold mb-2"
                  style={{ color: '#D4A843' }}
                >
                  {formatFullPrice(selectedProperty.price)}
                </p>

                <div
                  className="flex items-center gap-3 text-xs mb-2"
                  style={{ color: '#a1a1aa' }}
                >
                  <span>{selectedProperty.bedrooms} bd</span>
                  <span
                    style={{ width: '1px', height: '12px', backgroundColor: '#3f3f46' }}
                  />
                  <span>{selectedProperty.bathrooms} ba</span>
                  <span
                    style={{ width: '1px', height: '12px', backgroundColor: '#3f3f46' }}
                  />
                  <span>{selectedProperty.sqft.toLocaleString()} sqft</span>
                </div>

                <div className="flex items-center">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: `${DEAL_STATUS_COLORS[selectedProperty.dealStatus]}20`,
                      color: DEAL_STATUS_COLORS[selectedProperty.dealStatus],
                      border: `1px solid ${DEAL_STATUS_COLORS[selectedProperty.dealStatus]}40`,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full mr-1.5"
                      style={{
                        backgroundColor: DEAL_STATUS_COLORS[selectedProperty.dealStatus],
                      }}
                    />
                    {DEAL_STATUS_LABELS[selectedProperty.dealStatus]}
                  </span>
                </div>
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>
    </div>
  );
}
