import React from 'react';
import { Bell, ShieldAlert, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';

export function AlertPanel({ alerts = [], onResolveAlert }) {
  const alertIcons = {
    HIGH_OCCUPANCY: AlertTriangle,
    CAPACITY_EXCEEDED: ShieldAlert,
    RAPID_GROWTH: TrendingUp
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-400 animate-pulse" />
          <h3 className="text-sm font-bold text-white tracking-wide">SMART CROWD ALERTS</h3>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
          alerts.length > 0
            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
            : 'bg-slate-950 text-slate-500 border-slate-800'
        }`}>
          {alerts.length} Active Alerts
        </span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[340px] space-y-3 pr-1">
        {alerts.length > 0 ? (
          alerts.map((alt) => {
            const IconComponent = alertIcons[alt.alert_type] || AlertTriangle;
            const isCritical = alt.severity === 'critical' || alt.alert_type === 'CAPACITY_EXCEEDED';

            return (
              <div
                key={alt.id}
                className={`p-3.5 rounded-xl border backdrop-blur-md transition-all flex items-start justify-between gap-3 ${
                  isCritical
                    ? 'bg-rose-950/40 border-rose-500/50 text-rose-200 shadow-lg shadow-rose-900/20'
                    : 'bg-amber-950/40 border-amber-500/50 text-amber-200 shadow-lg shadow-amber-900/20'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-lg shrink-0 ${isCritical ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide">{alt.title}</h4>
                    <p className="text-xs opacity-90 leading-snug mt-0.5 font-medium">{alt.message}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Zone: <strong>{alt.zone_name || alt.zone_id}</strong>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onResolveAlert(alt.id)}
                  title="Mark alert as resolved"
                  className="px-2 py-1 rounded-lg bg-slate-900/80 hover:bg-emerald-950/60 hover:text-emerald-400 text-slate-400 border border-slate-700/80 hover:border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 transition-all shrink-0"
                >
                  <CheckCircle className="w-3 h-3" />
                  <span>Resolve</span>
                </button>
              </div>
            );
          })
        ) : (
          <div className="h-full min-h-[140px] flex items-center justify-center text-xs text-slate-500 font-medium text-center">
            No active alerts. All monitoring zones operating within safe capacity limits.
          </div>
        )}
      </div>
    </div>
  );
}
