'use client';
import { useState } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

interface Coordinates {
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  label: string;
  address: string;
  coordinates?: Coordinates | null;
  onChange: (data: { address: string; coordinates: Coordinates | null }) => void;
}

export default function LocationPicker({ label, address, coordinates, onChange }: LocationPickerProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState('');

  const handleGetLocation = () => {
    setIsLocating(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          address, // Keep whatever they already typed
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        });
        setIsLocating(false);
      },
      (err) => {
        console.error(err);
        setError('Could not get location. Please ensure location services are enabled.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true } // Forces the GPS hardware to get an exact pin
    );
  };

  return (
    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-bold text-slate-700">{label}</label>
        
        {/* The Magic GPS Button */}
        <button
          type="button"
          onClick={handleGetLocation}
          disabled={isLocating}
          className="text-xs flex items-center bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-teal-700 font-bold hover:bg-teal-50 hover:border-teal-200 transition shadow-sm"
        >
          {isLocating ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Navigation size={14} className="mr-1.5" />}
          {isLocating ? 'Locating...' : 'Set Current GPS Location'}
        </button>
      </div>

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

      {/* Visual Indicator of Saved Coordinates */}
      {coordinates && (
        <div className="flex items-center text-xs font-medium text-teal-700 bg-teal-50 px-3 py-2 rounded-lg border border-teal-100">
          <MapPin size={14} className="mr-1.5" />
          Exact GPS Coordinates Saved ({coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)})
        </div>
      )}

      {/* Manual Text Input for Apartment Details */}
      <textarea
        value={address}
        onChange={(e) => onChange({ address: e.target.value, coordinates })}
        placeholder="Enter flat number, floor, building name, street..."
        className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition text-sm text-slate-700"
        rows={3}
      />
    </div>
  );
}