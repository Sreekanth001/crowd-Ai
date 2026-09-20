import React, { useState } from 'react';
import { Eye, Users, Settings, Activity } from 'lucide-react';

export function Header({ capacity, onUpdateCapacity, isConnected }) {
  const [inputCapacity, setInputCapacity] = useState(capacity || 50);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = parseInt(inputCapacity, 10);
    if (isNaN(val) || val <= 0) return;
    setIsUpdating(true);
    await onUpdateCapacity(val);
    setIsUpdating(false);
  };

  return (
    <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
            <Eye className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              CrowdVision <span className="text-blue-500 font-extrabold">AI</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                MVP Phase 1
              </span>
            </h1>
            <p className="text-xs text-slate-400">Real-Time Crowd Density Monitoring & Analytics</p>
          </div>
        </div>

        {/* Capacity Input & Connection Badge */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-slate-300 font-medium">
              {isConnected ? 'LIVE WS' : 'RECONNECTING'}
            </span>
          </div>

          {/* Capacity Config Form */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/80 p-1.5 rounded-xl">
            <div className="flex items-center gap-1.5 px-2 text-slate-400 text-xs font-medium">
              <Settings className="w-3.5 h-3.5 text-blue-400" />
              <span>Max Capacity:</span>
            </div>
            <input
              type="number"
              min="1"
              value={inputCapacity}
              onChange={(e) => setInputCapacity(e.target.value)}
              className="w-20 bg-slate-950 border border-slate-700 text-white text-sm font-semibold rounded-lg px-2.5 py-1 text-center focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isUpdating}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-50"
            >
              Set
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
