'use client';
import { useState, useEffect, useCallback } from 'react';
import { useJsApiLoader, GoogleMap, Marker as GoogleMarker } from '@react-google-maps/api';

// 1. Tell TypeScript about the Google Maps global fallback function
declare global {
  interface Window {
    gm_authFailure: () => void;
  }
}

// 2. Standard imports for react-leaflet 
// (Safe because LocationPicker dynamically imports this entire file with ssr: false)
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

// 3. Bypass the strict TypeScript check for the CSS import
// @ts-ignore
import 'leaflet/dist/leaflet.css';

// Fix Leaflet Icons for Next.js
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

interface MapPickerProps {
  initialLat: number | null;
  initialLng: number | null;
  onPinDrop: (lat: number, lng: number, address: string) => void;
}

// LEAFLET EVENT HANDLER
function LeafletEvents({ onPinDrop }: { onPinDrop: (lat: number, lng: number, address: string) => void }) {
  useMapEvents({
    async click(e: any) {
      const { lat, lng } = e.latlng;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        onPinDrop(lat, lng, data.display_name || `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      } catch (err) {
        onPinDrop(lat, lng, `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    },
  });
  return null;
}

export default function MapPicker({ initialLat, initialLng, onPinDrop }: MapPickerProps) {
  const defaultLat = initialLat || 20.5937;
  const defaultLng = initialLng || 78.9629;
  
  const [mapProvider, setMapProvider] = useState<'google' | 'leaflet'>('google');

  // LOAD GOOGLE MAPS SCRIPT
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  // FALLBACK LOGIC: If Google fails (quota, bad key, network), switch to Leaflet
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

    // Google Reverse Geocoding
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        onPinDrop(lat, lng, results[0].formatted_address);
      } else {
        onPinDrop(lat, lng, `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    });
  }, [onPinDrop]);

  if (mapProvider === 'leaflet') {
    return (
      <MapContainer center={[defaultLat, defaultLng]} zoom={initialLat ? 16 : 5} style={{ height: '100%', width: '100%', zIndex: 10 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {initialLat && initialLng && <Marker position={[initialLat, initialLng]} />}
        <LeafletEvents onPinDrop={onPinDrop} />
      </MapContainer>
    );
  }

  if (!isLoaded) return <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={{ lat: defaultLat, lng: defaultLng }}
      zoom={initialLat ? 16 : 5}
      onClick={handleGoogleClick}
      options={{ streetViewControl: false, mapTypeControl: false }}
    >
      {initialLat && initialLng && <GoogleMarker position={{ lat: initialLat, lng: initialLng }} />}
    </GoogleMap>
  );
}