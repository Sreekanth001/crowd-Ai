import React from 'react';
import { AlertTriangle, ShieldAlert, BellRing } from 'lucide-react';

export function AlertBox({ alert }) {
  if (!alert) {
    return (
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3 text-slate-500 text-xs">
        <BellRing className="w-4 h-4 text-slate-600 shrink-0" />
        <span>No active crowd alerts. Capacity levels within normal thresholds.</span>
      </div>
    );
  }

  const isCritical = alert.alert_type === 'CRITICAL';

  return (
    <div
      className={`rounded-2xl p-4 border backdrop-blur-md transition-all shadow-xl flex items-start gap-3.5 ${
        isCritical
          ? 'bg-rose-950/40 border-rose-500/50 text-rose-200 shadow-rose-900/20 animate-pulse'
          : 'bg-amber-950/40 border-amber-500/50 text-amber-200 shadow-amber-900/20'
      }`}
    >
      <div
        className={`p-2 rounded-xl shrink-0 ${
          isCritical ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
        }`}
      >
        {isCritical ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between mb-0.5">
          <h4 className="text-sm font-extrabold tracking-wide uppercase">{alert.title}</h4>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-black/40 border border-current">
            {alert.alert_type}
          </span>
        </div>
        <p className="text-xs opacity-90 leading-relaxed font-medium">{alert.message}</p>
      </div>
    </div>
  );
}
