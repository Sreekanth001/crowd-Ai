import React from 'react';
import { ShieldAlert, ShieldCheck, AlertCircle, Zap } from 'lucide-react';

export function CrowdStatus({ status = 'LOW', occupancy = 0 }) {
  const statusConfigs = {
    LOW: {
      color: 'emerald',
      label: 'LOW DENSITY',
      desc: 'Safe capacity levels. Optimal mobility.',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      barColor: 'bg-emerald-500',
      icon: ShieldCheck
    },
    MODERATE: {
      color: 'blue',
      label: 'MODERATE DENSITY',
      desc: 'Normal crowd levels. Monitor entry flow.',
      badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      barColor: 'bg-blue-500',
      icon: ShieldCheck
    },
    HIGH: {
      color: 'amber',
      label: 'HIGH DENSITY',
      desc: 'Approaching maximum capacity. Prepare alerts.',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      barColor: 'bg-amber-500',
      icon: AlertCircle
    },
    CRITICAL: {
      color: 'rose',
      label: 'CRITICAL OVERCAPACITY',
      desc: 'Capacity exceeded! Immediate crowd dispersion required.',
      badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse',
      barColor: 'bg-rose-500',
      icon: ShieldAlert
    }
  };

  const activeConfig = statusConfigs[status] || statusConfigs.LOW;
  const StatusIcon = activeConfig.icon;
  const clampedOccupancy = Math.min(100, Math.max(0, occupancy));

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            CROWD CLASSIFICATION
          </span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${activeConfig.badgeClass} flex items-center gap-1.5`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{activeConfig.label}</span>
          </span>
        </div>

        <p className="text-xs text-slate-400 mb-5 font-medium">
          {activeConfig.desc}
        </p>

        {/* Occupancy Progress Bar */}
        <div className="mb-2 flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-400">Occupancy Meter</span>
          <span className="text-white font-extrabold">{occupancy.toFixed(1)}%</span>
        </div>

        <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-500 shadow-sm ${activeConfig.barColor}`}
            style={{ width: `${clampedOccupancy}%` }}
          ></div>
        </div>
      </div>

      {/* State Threshold Indicator Pills */}
      <div className="grid grid-cols-4 gap-2 pt-4 mt-4 border-t border-slate-800/80 text-center">
        {['LOW', 'MODERATE', 'HIGH', 'CRITICAL'].map((st) => {
          const isActive = status === st;
          return (
            <div
              key={st}
              className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition-all ${
                isActive
                  ? 'bg-slate-800 text-white border-blue-500/50 shadow-md'
                  : 'bg-slate-950/40 text-slate-600 border-slate-800/60'
              }`}
            >
              {st}
            </div>
          );
        })}
      </div>
    </div>
  );
}
