'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { Activity } from 'lucide-react';

interface ChartData {
  date: string;
  count: number;
}

interface ActivityChartProps {
  data: ChartData[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  // Format dates for display (e.g. "Jul 11")
  const formattedData = data.map((item) => ({
    ...item,
    formattedDate: formatDate(new Date(item.date), 'MMM d'),
  }));

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-xl p-2.5 bg-blue-500/10 border border-blue-500/20">
          <Activity className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">System Activity</h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Overall actions and operations performed over the last 7 days</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="formattedDate"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] px-3 py-2 rounded-lg shadow-lg">
                      <p className="text-xs font-semibold text-[hsl(var(--foreground))]">
                        {payload[0].payload.formattedDate}
                      </p>
                      <p className="text-sm font-bold text-blue-400 mt-1">
                        {payload[0].value} operations
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCount)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
