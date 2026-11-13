'use client';

import { formatHexColor } from '@/utils/sessions';
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface TeamComparisonChartProps<T extends { round: number; country: string }> {
    data: T[];
    keyA: keyof T & string;
    keyB: keyof T & string;
    nameA: string;
    nameB: string;
    colorA: string;
    colorB: string;
    decimals?: number;
    unit?: string;
}

export function TeamComparisonChart<T extends { round: number; country: string }>({
    data,
    keyA,
    keyB,
    nameA,
    nameB,
    colorA,
    colorB,
    decimals = 0,
    unit = '',
}: TeamComparisonChartProps<T>) {
    return (
        <ResponsiveContainer width='100%' height={200}>
            <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke='#27272a' strokeDasharray='3 3' vertical={false} />
                <XAxis
                    dataKey='round'
                    interval={0}
                    stroke='#71717a'
                    tick={{ fontSize: 10, fill: '#a1a1aa' }}
                    tickFormatter={(round) => `R${round}`}
                    axisLine={{ stroke: '#27272a' }}
                    tickLine={false}
                />
                <YAxis
                    stroke='#71717a'
                    tick={{ fontSize: 11, fill: '#a1a1aa' }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                    tickFormatter={(v) => Number(v).toFixed(decimals)}
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
                    formatter={(value) =>
                        typeof value === 'number' ? `${value.toFixed(decimals)}${unit}` : '—'
                    }
                />
                <Line
                    type='monotone'
                    dataKey={keyA}
                    name={nameA}
                    stroke={formatHexColor(colorA)}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    activeDot={{ r: 4 }}
                />
                <Line
                    type='monotone'
                    dataKey={keyB}
                    name={nameB}
                    stroke={formatHexColor(colorB)}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    activeDot={{ r: 4 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
