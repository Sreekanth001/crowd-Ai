import React from 'react';

export function StatCard({ title, value, description, icon: Icon, color = 'blue', badge }) {
  const colorMap = {
    blue: 'border-blue-500/20 bg-blue-500/5 text-blue-400',
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
    amber: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
    red: 'border-rose-500/20 bg-rose-500/5 text-rose-400',
    purple: 'border-purple-500/20 bg-purple-500/5 text-purple-400',
  };

  return (
    <div className={`relative p-5 rounded-2xl bg-slate-900/60 border backdrop-blur-sm transition-all duration-300 hover:border-slate-700/80 shadow-lg ${colorMap[color] || colorMap.blue}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700/50">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-3xl font-extrabold text-white tracking-tight">
          {value}
        </span>
        {badge && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${badge.className}`}>
            {badge.text}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-2 text-xs text-slate-400 font-medium flex items-center gap-1">
          {description}
        </p>
      )}
    </div>
  );
}
