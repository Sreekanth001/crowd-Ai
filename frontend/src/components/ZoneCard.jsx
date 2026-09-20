import React, { useState } from 'react';
import { Users, AlertTriangle, Video, Settings, Check, Trash2 } from 'lucide-react';

export function ZoneCard({ zone, isSelected, onSelect, onUpdateCapacity, onDeleteZone }) {
  const [isEditing, setIsEditing] = useState(false);
  const [capVal, setCapVal] = useState(zone.capacity);

  const statusStyles = {
    LOW: { border: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', bar: 'bg-emerald-500' },
    MODERATE: { border: 'border-blue-500/20 bg-blue-500/5 text-blue-400', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30', bar: 'bg-blue-500' },
    HIGH: { border: 'border-amber-500/20 bg-amber-500/5 text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30', bar: 'bg-amber-500' },
    CRITICAL: { border: 'border-rose-500/30 bg-rose-500/10 text-rose-400', badge: 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse', bar: 'bg-rose-500' }
  };

  const currentStyle = statusStyles[zone.status] || statusStyles.LOW;

  const handleSaveCap = (e) => {
    e.stopPropagation();
    const val = parseInt(capVal, 10);
    if (!isNaN(val) && val > 0) {
      onUpdateCapacity(zone.id, val);
      setIsEditing(false);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete zone '${zone.name}'?`)) {
      onDeleteZone(zone.id);
    }
  };

  return (
    <div
      onClick={() => onSelect(zone.id)}
      className={`p-5 rounded-2xl border backdrop-blur-sm transition-all duration-300 cursor-pointer shadow-lg hover:border-slate-700/80 relative group ${
        isSelected ? 'bg-slate-900 border-blue-500 ring-2 ring-blue-500/30' : 'bg-slate-900/70 border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700/50">
            <Video className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">{zone.name}</h3>
            <span className="text-[10px] text-slate-400">ID: {zone.id}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${currentStyle.badge}`}>
            {zone.status}
          </span>
          {onDeleteZone && (
            <button
              onClick={handleDelete}
              title="Delete Zone"
              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-baseline justify-between my-3">
        <div>
          <span className="text-xs text-slate-400 font-semibold block uppercase">People Count</span>
          <span className="text-2xl font-extrabold text-white tracking-tight">{zone.people_count}</span>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 font-semibold block uppercase">Capacity</span>
          {isEditing ? (
            <div className="flex items-center gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
              <input
                type="number"
                min="1"
                value={capVal}
                onChange={(e) => setCapVal(e.target.value)}
                className="w-16 bg-slate-950 border border-slate-700 text-white text-xs font-bold rounded px-1.5 py-0.5"
              />
              <button
                onClick={handleSaveCap}
                className="p-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="text-lg font-bold text-slate-200 hover:text-blue-400 transition-colors flex items-center justify-end gap-1"
            >
              {zone.capacity}
              <Settings className="w-3 h-3 text-slate-500" />
            </span>
          )}
        </div>
      </div>

      {/* Meter Bar */}
      <div className="w-full bg-slate-950 rounded-full h-2.5 p-0.5 border border-slate-800 overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${currentStyle.bar}`}
          style={{ width: `${Math.min(100, zone.occupancy)}%` }}
        ></div>
      </div>

      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
        <span>Occupancy</span>
        <span className="text-white font-extrabold">{zone.occupancy.toFixed(1)}%</span>
      </div>
    </div>
  );
}
