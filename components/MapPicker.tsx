'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useJsApiLoader, GoogleMap, useGoogleMap } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';

declare global {
  interface Window {
    gm_authFailure: () => void;
  }
}

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';

// @ts-ignore
import 'leaflet/dist/leaflet.css';

let L: any;
if (typeof window !== 'undefined') {
  L = require('leaflet');
  const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });
  L.Marker.prototype.options.icon = DefaultIcon;
}

// CRITICAL: Must exactly match the libraries array in LocationPicker.tsx
const libraries: any = ['places', 'marker'];

interface MapPickerProps {
  initialLat: number | null;
  initialLng: number | null;
  onPinDrop: (lat: number, lng: number, address: string) => void;
}

function MapUpdater({ lat, lng }: { lat: number | null, lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat !== null && lng !== null) {
      map.flyTo([lat, lng], 16, { animate: true, duration: 1 });
    }
  }, [lat, lng, map]);
  return null;
}

function LeafletEvents({ onPinDrop }: { onPinDrop: (lat: number, lng: number, address: string) => void }) {
  useMapEvents({
    async click(e: any) {
      const { lat, lng } = e.latlng;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        onPinDrop(lat, lng, data.display_name || 'Selected map pin');
      } catch (err) {
        onPinDrop(lat, lng, 'Selected map pin');
      }
    },
  });
  return null;
}

function AdvancedGoogleMarker({ lat, lng }: { lat: number; lng: number }) {
  const map = useGoogleMap();
  const markerRef = useRef<any>(null);

  useEffect(() => {
    const AdvancedMarkerElement = (window.google?.maps as any)?.marker?.AdvancedMarkerElement;
    if (!map || !AdvancedMarkerElement) return;

    markerRef.current = new AdvancedMarkerElement({
      map,
      position: { lat, lng },
      title: 'Pinned location',
    });

    return () => {
      if (markerRef.current) {
        markerRef.current.map = null;
        markerRef.current = null;
      }
    };
  }, [map, lat, lng]);

  return null;
}

export default function MapPicker({ initialLat, initialLng, onPinDrop }: MapPickerProps) {
  const defaultLat = initialLat || 20.5937;
  const defaultLng = initialLng || 78.9629;
  const googleMapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || '';
  
  const [mapProvider, setMapProvider] = useState<'google' | 'leaflet'>('google');

  // MATCHES LocationPicker.tsx
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries
  });

  useEffect(() => {
    if (loadError || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      setMapProvider('leaflet');
    }
    window.gm_authFailure = () => {
      console.warn("Google Maps quota exceeded or auth failed. Falling back to Leaflet.");
      setMapProvider('leaflet');
    };
  }, [loadError]);

  const handleGoogleClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        onPinDrop(lat, lng, results[0].formatted_address);
      } else {
        onPinDrop(lat, lng, 'Selected map pin');
      }
    });
  }, [onPinDrop]);

  if (mapProvider === 'leaflet') {
    return (
      <MapContainer center={[defaultLat, defaultLng]} zoom={initialLat ? 16 : 5} style={{ height: '100%', width: '100%', zIndex: 10 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {initialLat !== null && initialLng !== null && <Marker position={[initialLat, initialLng]} />}
        <LeafletEvents onPinDrop={onPinDrop} />
        <MapUpdater lat={initialLat} lng={initialLng} />
      </MapContainer>
    );
  }

  if (!isLoaded) return <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">Loading Map...</div>;

  return (
    <div className="relative h-full w-full">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={{ lat: defaultLat, lng: defaultLng }}
        zoom={initialLat !== null && initialLng !== null ? 16 : 5}
        onClick={handleGoogleClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          ...(googleMapId ? { mapId: googleMapId } : {}),
        }}
      >
        {initialLat !== null && initialLng !== null && googleMapId && <AdvancedGoogleMarker lat={initialLat} lng={initialLng} />}
      </GoogleMap>
      {initialLat !== null && initialLng !== null && !googleMapId && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-full rounded-full bg-white p-1 text-red-600 shadow-lg ring-2 ring-white">
          <MapPin size={28} fill="currentColor" />
        </div>
      )}
    </div>
  );
}
