'use client';
import { useState, useEffect } from 'react';
import { MapPin, Navigation, Loader2, Map as MapIcon, X, Search } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useJsApiLoader } from '@react-google-maps/api';

const MapPicker = dynamic(() => import('./MapPicker'), { 
  ssr: false, 
  loading: () => <div className="flex h-full items-center justify-center bg-slate-100 text-slate-500 rounded-xl">Loading map...</div>
});

// CRITICAL: This array must be defined OUTSIDE the component to prevent infinite reloading
const libraries: any = ['places'];

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

  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load Google Maps API with the Places library
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries
  });

  useEffect(() => {
    if (isMapOpen) {
      setTempLat(lat);
      setTempLng(lng);
      setTempMapAddress(mapAddress || '');
      setSearchInput('');
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [isMapOpen, lat, lng, mapAddress]);

  // GOOGLE PLACES AUTOCOMPLETE EFFECT
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchInput.trim().length > 2 && isLoaded && window.google) {
        setIsSearching(true);
        const autocompleteService = new window.google.maps.places.AutocompleteService();
        
        autocompleteService.getPlacePredictions(
          { input: searchInput },
          (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              setSearchResults(predictions);
              setShowDropdown(true);
            } else {
              setSearchResults([]);
              setShowDropdown(false);
            }
            setIsSearching(false);
          }
        );
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 400); // 400ms debounce to save API calls

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput, isLoaded]);

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
        setError('Location access denied. Please enable it in your browser.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // HANDLE CLICKING A GOOGLE PREDICTION
  const handleSelectResult = (prediction: any) => {
    setSearchInput(prediction.description);
    setShowDropdown(false);
    setIsSearching(true);

    // Ask Google for the exact Lat/Lng of the selected place
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        setTempLat(location.lat());
        setTempLng(location.lng());
        // FIXED: Use the exact prediction description instead of the stripped formatted_address
        setTempMapAddress(prediction.description);
      } else {
        setError("Failed to locate that exact address on the map.");
      }
      setIsSearching(false);
    });
  };

  // HANDLE PRESSING ENTER (Fallback Geocoding)
  const handleManualSearch = () => {
    if (!searchInput.trim() || !isLoaded) return;
    setIsSearching(true);
    setError('');
    setShowDropdown(false);

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchInput }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        setTempLat(location.lat());
        setTempLng(location.lng());
        setTempMapAddress(results[0].formatted_address);
      } else {
        setError('Address not found. Please try selecting an option from the dropdown.');
      }
      setIsSearching(false);
    });
  };

  const handleConfirmMap = () => {
    onChange({ address, mapAddress: tempMapAddress, lat: tempLat, lng: tempLng });
    setIsMapOpen(false);
  };

  return (
    <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-slate-700">{label}</label>
      </div>

      <div className="space-y-2">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Apartment, Floor, Building Name</label>
        <div className="relative">
          <input
            type="text"
            value={address}
            onChange={(e) => onChange({ address: e.target.value, mapAddress, lat, lng })}
            placeholder="e.g. Flat 204, Blue Skies Apartments..."
            className="w-full pr-11 p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none text-sm text-slate-700"
          />
          <button
            type="button"
            onClick={() => setIsMapOpen(true)}
            title={`Set ${type} address on map`}
            aria-label={`Set ${type} address on map`}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-teal-700 shadow-sm transition hover:bg-teal-50"
          >
            <MapIcon size={15} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pinned Street Address</label>
        <input
          type="text"
          value={mapAddress}
          onChange={(e) => onChange({ address, mapAddress: e.target.value, lat, lng })}
          readOnly={!isAdmin}
          placeholder={isAdmin ? "Admins can edit this map address directly..." : "Use the map to set this address..."}
          className={`w-full p-2.5 rounded-lg border text-sm outline-none ${isAdmin ? 'border-teal-300 bg-white focus:ring-2 focus:ring-teal-500' : 'border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed'}`}
        />
      </div>

      {isMapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-slate-800">Set {type} Location</h3>
              <button type="button" onClick={() => setIsMapOpen(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            
            <div className="p-4 flex-1 flex flex-col gap-3">
              
              <div className="flex gap-2 relative">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {isSearching ? <Loader2 size={16} className="text-slate-400 animate-spin" /> : <Search size={16} className="text-slate-400" />}
                  </div>
                  <input 
                    type="text" 
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        handleManualSearch();
                      }
                    }}
                    placeholder="Search Google Maps..." 
                    className="w-full pl-9 pr-3 py-2.5 text-sm border bg-slate-50 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" 
                  />
                  
                  {showDropdown && searchResults.length > 0 && (
                    <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                      {searchResults.map((res, index) => (
                        <li 
                          key={index} 
                          onClick={() => handleSelectResult(res)}
                          className="px-4 py-2.5 text-xs text-slate-700 hover:bg-teal-50 border-b border-slate-100 last:border-0 cursor-pointer transition flex items-start gap-2"
                        >
                          <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                          <span className="leading-snug">{res.description}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <button type="button" onClick={handleManualSearch} disabled={isSearching || !isLoaded} className="bg-teal-600 p-2.5 rounded-lg text-white hover:bg-teal-700 transition shadow-sm">
                  {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                </button>
                <button type="button" onClick={handleGetLocation} className="bg-slate-100 p-2.5 rounded-lg text-slate-700 border hover:bg-slate-200 transition" title="Use my GPS location">
                  <Navigation size={18} />
                </button>
              </div>

              {error && <p className="text-xs text-amber-600 font-medium bg-amber-50 p-2 rounded border border-amber-100 leading-relaxed">{error}</p>}
              
              {tempMapAddress && (
                <p className="text-xs text-teal-700 font-medium bg-teal-50 p-2 rounded border border-teal-100">
                  📍 <strong>Pinned:</strong> {tempMapAddress}
                </p>
              )}

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

            <div className="p-4 border-t flex justify-end gap-3 bg-slate-50">
              <button type="button" onClick={() => setIsMapOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
              <button type="button" onClick={handleConfirmMap} disabled={!tempLat} className="px-5 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50 shadow-sm">Confirm Address</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}