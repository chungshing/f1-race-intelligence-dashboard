'use client';

import { PointsProgressionPoint, PointsProgressionSeries } from '@/lib/pointsProgression';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    CartesianGrid,
} from 'recharts';

interface PointsProgressionChartProps {
    series: PointsProgressionSeries[];
    points: PointsProgressionPoint[];
}

interface CustomTooltipProps {
    active?: boolean;
    label?: string | number;
    payload?: {
        dataKey?: string | number;
        name?: string;
        value?: number;
        color?: string;
        payload?: { country?: string };
    }[];
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
    if (!active || !payload || payload.length === 0) return null;

    const sorted = [...payload].sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));
    const country = payload[0]?.payload?.country;

    return (
        <div
            style={{
                backgroundColor: '#09090b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '12px',
            }}
        >
            <p style={{ color: '#f4f4f5', fontWeight: 600, marginBottom: '4px' }}>
                Round {label} — {country}
            </p>
            {sorted.map((entry) => (
                <p key={entry.dataKey as string} style={{ color: entry.color, margin: '2px 0' }}>
                    {entry.name} : {entry.value}
                </p>
            ))}
        </div>
    );
}

function CustomLegend({ series }: { series: PointsProgressionSeries[] }) {
    return (
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                paddingTop: '8px',
                justifyContent: 'center',
            }}
        >
            {series.map((s) => (
                <div
                    key={s.driverNumber}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                    <span
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: s.teamColor,
                            display: 'inline-block',
                        }}
                    />
                    <span style={{ fontSize: '11px', color: '#a1a1aa' }}>{s.driverName}</span>
                </div>
            ))}
        </div>
    );
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
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend series={series} />} />
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
