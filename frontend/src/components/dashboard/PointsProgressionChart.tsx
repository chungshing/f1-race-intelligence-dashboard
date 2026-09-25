'use client';

import { PointsProgressionPoint, PointsProgressionSeries } from '@/lib/pointsProgression';
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface PointsProgressionChartProps {
    series: PointsProgressionSeries[];
    points: PointsProgressionPoint[];
}

export function PointsProgressionChart({ series, points }: PointsProgressionChartProps) {
    if (points.length === 0) {
        return (
            <div className='h-64 flex items-center justify-center text-sm text-zinc-500'>
                No season data available yet.
            </div>
        );
    }

    return (
        <ResponsiveContainer width='100%' height={280}>
            <LineChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke='#27272a' strokeDasharray='3 3' vertical={false} />
                <XAxis
                    dataKey='round'
                    stroke='#71717a'
                    tick={{ fontSize: 11, fill: '#a1a1aa' }}
                    tickFormatter={(round) => `R${round}`}
                    axisLine={{ stroke: '#27272a' }}
                    tickLine={false}
                />
                <YAxis
                    stroke='#71717a'
                    tick={{ fontSize: 11, fill: '#a1a1aa' }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#09090b',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        fontSize: '12px',
                    }}
                    labelFormatter={(round, payload) =>
                        `Round ${round} — ${payload?.[0]?.payload?.country ?? ''}`
                    }
                />
                {series.map((s) => (
                    <Line
                        key={s.driverNumber}
                        type='monotone'
                        dataKey={`driver_${s.driverNumber}`}
                        name={s.driverName}
                        stroke={s.teamColor}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}
