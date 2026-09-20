import React from 'react';
import { ZoneCard } from './ZoneCard';
import { Layers } from 'lucide-react';

export function ZoneList({ zones = [], selectedZoneId, onSelectZone, onUpdateCapacity, onDeleteZone }) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">MONITORING ZONES</h3>
        </div>
        <span className="text-xs font-semibold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          {zones.length} Active Zones
        </span>
      </div>

      {zones.length === 0 ? (
        <div className="p-6 border border-dashed border-slate-800 rounded-xl text-center bg-slate-950/40">
          <p className="text-sm font-semibold text-slate-400 mb-1">No monitoring zones created yet.</p>
          <p className="text-xs text-slate-500">Click anywhere on the interactive map below to place a monitoring zone!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {zones.map((zone) => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              isSelected={selectedZoneId === zone.id}
              onSelect={onSelectZone}
              onUpdateCapacity={onUpdateCapacity}
              onDeleteZone={onDeleteZone}
            />
          ))}
        </div>
      )}
    </div>
  );
}
