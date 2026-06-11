import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { ScoreHistoryPoint } from '../../types/dashboard.types';

interface ScoreHistoryChartProps {
  data: ScoreHistoryPoint[];
}

const formatDate = (dateString: string) => {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateString;
  }
};

export const ScoreHistoryChart: React.FC<ScoreHistoryChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/40 text-sm text-zinc-500">
        No score history available.
      </div>
    );
  }

  // Format data for display
  const formattedData = data.map((item) => ({
    ...item,
    formattedDate: formatDate(item.date),
  }));

  return (
    <div className="w-full rounded-xl border border-zinc-850 bg-zinc-900/30 backdrop-blur-md p-4">
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
        Quality Score Evolution
      </h3>
      {/* Fixed pixel height avoids Recharts getting width/height = -1 during layout */}
      <ResponsiveContainer width="100%" height={200} minWidth={0}>
        <AreaChart
          data={formattedData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="formattedDate"
            stroke="#71717a"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#71717a"
            fontSize={10}
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              borderColor: '#27272a',
              borderRadius: '8px',
              color: '#f4f4f5',
              fontSize: '11px',
            }}
            labelStyle={{ fontWeight: 'bold', color: '#a1a1aa' }}
          />
          <Area
            type="monotone"
            dataKey="score"
            name="Quality Score"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorScore)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
