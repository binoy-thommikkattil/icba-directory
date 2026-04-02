'use client';
import { useState, useEffect } from 'react';
import { MapPin, Navigation, Loader2, Map as MapIcon, X } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('./MapPicker'), { 
  ssr: false, 
  loading: () => <div className="flex h-full items-center justify-center bg-slate-100 text-slate-500 rounded-xl">Loading map...</div>
});

// FIX 1: Ensure strict typing to fix the Vercel error
interface LocationPickerProps {
  label: string;
  type: 'Current' | 'Native';
  isAdmin: boolean;
  address: string;
  mapAddress: string;
  lat: number | null;
  lng: number | null;
  onChange: (data: { address: string; mapAddress: string; lat: number | null; lng: number | null }) => void;
}

// We assign default values directly in the destructured props so they are NEVER undefined
export default function LocationPicker({ 
  label, 
  type,
  isAdmin,
  address, 
  mapAddress = '', 
  lat = null, 
  lng = null, 
  onChange 
}: LocationPickerProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState('');
  const [isMapOpen, setIsMapOpen] = useState(false);
  
  const [tempLat, setTempLat] = useState<number | null>(null);
  const [tempLng, setTempLng] = useState<number | null>(null);
  const [tempMapAddress, setTempMapAddress] = useState('');

  useEffect(() => {
    if (isMapOpen) {
      setTempLat(lat);
      setTempLng(lng);
      setTempMapAddress(mapAddress || '');
    }
  }, [isMapOpen, lat, lng, mapAddress]);

  const handleGetLocation = () => {
    setIsLocating(true);
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setTempLat(position.coords.latitude);
        setTempLng(position.coords.longitude);
        setTempMapAddress(`GPS Location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
        setIsLocating(false);
      },
      () => {
        setError('Location access denied.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleConfirmMap = () => {
    onChange({ address, mapAddress: tempMapAddress, lat: tempLat, lng: tempLng });
    setIsMapOpen(false);
  };

  return (
    <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-bold text-slate-700">{label}</label>
      </div>

      {/* 1. MANUAL ENTRY (Apartment, Floor, etc.) - ALWAYS EDITABLE */}
      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Apartment, Floor, Building Name</label>
        <textarea
          value={address}
          onChange={(e) => onChange({ address: e.target.value, mapAddress, lat, lng })}
          placeholder="e.g. Flat 204, Blue Skies Apartments..."
          className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none text-sm text-slate-700"
          rows={2}
        />
      </div>

      {/* 2. MAP ADDRESS ENTRY - Readonly for Members, Editable for Admins */}
      <div className="flex flex-col gap-2">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pinned Street Address</label>
        <div className="flex gap-2 items-start">
          <textarea
            value={mapAddress}
            onChange={(e) => onChange({ address, mapAddress: e.target.value, lat, lng })}
            readOnly={!isAdmin}
            placeholder={isAdmin ? "Admins can edit this map address directly..." : "Use the map to set this address..."}
            className={`flex-1 p-3 rounded-lg border text-sm outline-none ${isAdmin ? 'border-teal-300 bg-white focus:ring-2 focus:ring-teal-500' : 'border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed'}`}
            rows={2}
          />
        </div>
        
        {/* SET LOCATION BUTTON */}
        <button
          type="button"
          onClick={() => setIsMapOpen(true)}
          className="self-start text-xs flex items-center bg-white px-4 py-2 rounded-lg border border-slate-300 text-teal-700 font-bold hover:bg-teal-50 shadow-sm transition"
        >
          <MapIcon size={14} className="mr-2" />
          Set {type} Address on Map
        </button>
      </div>

      {/* THE MAP MODAL */}
      {isMapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-slate-800">Set {type} Location</h3>
              <button onClick={() => setIsMapOpen(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="p-4 flex-1 flex flex-col gap-3">
              <div className="flex gap-2">
                <input type="text" readOnly value={tempMapAddress} placeholder="Drag map or click GPS..." className="flex-1 px-3 py-2 text-sm border bg-slate-50 rounded-lg outline-none" />
                <button onClick={handleGetLocation} className="bg-slate-100 p-2 rounded-lg text-slate-600 border"><Navigation size={18} /></button>
              </div>
              <div className="flex-1 w-full bg-slate-100 rounded-xl relative overflow-hidden border">
                <MapPicker 
                  initialLat={tempLat} 
                  initialLng={tempLng} 
                  onPinDrop={(newLat, newLng, fetchedAddress) => {
                    setTempLat(newLat);
                    setTempLng(newLng);
                    setTempMapAddress(fetchedAddress);
                  }} 
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-3">
              <button onClick={() => setIsMapOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
              <button onClick={handleConfirmMap} disabled={!tempLat} className="px-5 py-2 text-sm font-bold text-white bg-teal-600 rounded-lg disabled:opacity-50">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}