import React from 'react';
import { MapPin, ChevronDown } from 'lucide-react';

export function LocationSelector({ locations, selectedLocationId, onSelectLocation }) {
  const selectedLoc = locations.find((l) => l.id === selectedLocationId) || locations[0];

  return (
    <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl text-slate-200">
      <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
      <span className="text-xs text-slate-400 font-semibold">Location:</span>
      <div className="relative">
        <select
          value={selectedLocationId}
          onChange={(e) => onSelectLocation(e.target.value)}
          className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-6 appearance-none"
        >
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id} className="bg-slate-900 text-white">
              {loc.name} ({loc.zone_count || 4} Zones)
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 top-0.5 pointer-events-none" />
      </div>
    </div>
  );
}
