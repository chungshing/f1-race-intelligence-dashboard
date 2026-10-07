'use client';

import { ComparisonRound } from '@/lib/driverComparison';
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

interface ComparisonPointsChartProps {
    rounds: ComparisonRound[];
    driverAName: string;
    driverBName: string;
    driverAColor: string;
    driverBColor: string;
}

export function ComparisonPointsChart({
    rounds,
    driverAName,
    driverBName,
    driverAColor,
    driverBColor,
}: ComparisonPointsChartProps) {
    if (rounds.length === 0) {
        return (
            <div className='h-48 flex items-center justify-center text-sm text-zinc-500'>
                No shared race data available.
            </div>
        );
    }

    return (
        <ResponsiveContainer width='100%' height={200}>
            <LineChart data={rounds} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
                <Line
                    type='monotone'
                    dataKey='driverACumulative'
                    name={driverAName}
                    stroke={formatHexColor(driverAColor)}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                />
                <Line
                    type='monotone'
                    dataKey='driverBCumulative'
                    name={driverBName}
                    stroke={formatHexColor(driverBColor)}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
