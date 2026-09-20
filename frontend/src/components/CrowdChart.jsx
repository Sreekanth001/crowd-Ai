import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';

export function CrowdChart({ data = [] }) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">CROWD DENSITY TREND (REAL-TIME)</h3>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          Last {data.length} Data Points
        </span>
      </div>

      <div className="w-full h-56 min-h-[200px]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#f8fafc',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              />
              <Line
                type="monotone"
                dataKey="people"
                name="People Count"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 3, fill: '#3b82f6', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#60a5fa' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-600 font-medium">
            Awaiting real-time stream data points...
          </div>
        )}
      </div>
    </div>
  );
}
