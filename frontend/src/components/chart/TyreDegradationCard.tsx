'use client';

import { Card, CardBody, CardHeader, CardNote, StatTile } from '@/components/ui/Card';
import { useSessionLaps } from '@/hooks/useSessionLaps';
import { RaceControlEvent, Stint } from '@/types/results';
import { getSafetyCarWindows } from '@/utils/raceControl';
import { DryCompound, buildTyreDegradation } from '@/utils/tyres';
import { CircleDot } from 'lucide-react';
import { useMemo } from 'react';
import {
    CartesianGrid,
    Label,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface Props {
    sessionKey: number;
    stints?: Stint[] | null;
    raceControl?: RaceControlEvent[] | null;
}

const COMPOUND_STYLE: Record<DryCompound, { label: string; color: string }> = {
    SOFT: { label: 'Soft', color: '#ef4444' },
    MEDIUM: { label: 'Medium', color: '#eab308' },
    HARD: { label: 'Hard', color: '#e4e4e7' },
};

const signed = (value: number, digits = 3) => `${value > 0 ? '+' : ''}${value.toFixed(digits)}`;

export function TyreDegradationCard({ sessionKey, stints, raceControl }: Props) {
    const { data: rawLaps, loading } = useSessionLaps(sessionKey);

    const safetyCarWindows = useMemo(() => getSafetyCarWindows(raceControl ?? []), [raceControl]);

    const degradation = useMemo(
        () => buildTyreDegradation(stints ?? [], rawLaps, safetyCarWindows),
        [stints, rawLaps, safetyCarWindows]
    );

    if (loading) {
        return (
            <div className='text-zinc-400 text-xs py-12 text-center animate-pulse tracking-wider uppercase font-semibold'>
                Analysing Tyre Wear...
            </div>
        );
    }

    if (degradation.summaries.length === 0 || degradation.curve.length < 2) return null;

    return (
        <Card>
            <CardHeader
                icon={CircleDot}
                title='Tyre Degradation'
                subtitle='Lap time change as the tyre ages'
            />

            <CardBody className='space-y-6'>
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                    {degradation.summaries.map((summary) => {
                        const style = COMPOUND_STYLE[summary.compound];
                        return (
                            <StatTile key={summary.compound} label={style.label}>
                                <div className='mt-1 flex items-center gap-2'>
                                    <span
                                        className='w-2.5 h-2.5 rounded-full shrink-0'
                                        style={{ backgroundColor: style.color }}
                                    />
                                    <p className='font-mono text-2xl font-black text-zinc-100 tabular-nums'>
                                        {signed(summary.degPerLap)}
                                        <span className='ml-1 text-xs font-medium text-zinc-400'>
                                            s/lap
                                        </span>
                                    </p>
                                </div>
                                <p className='text-[11px] text-zinc-400 font-mono'>
                                    {summary.stints} {summary.stints === 1 ? 'stint' : 'stints'} ·{' '}
                                    {Math.round(summary.avgStintLaps)} laps avg
                                </p>
                            </StatTile>
                        );
                    })}
                </div>

                <div className='w-full min-w-0 h-72 sm:h-96'>
                    <ResponsiveContainer width='100%' height='100%'>
                        <LineChart
                            data={degradation.curve}
                            margin={{ top: 10, right: 15, left: 10, bottom: 20 }}
                        >
                            <CartesianGrid
                                strokeDasharray='3 3'
                                stroke='#161619'
                                vertical={false}
                            />
                            <ReferenceLine y={0} stroke='#3f3f46' />

                            <XAxis
                                dataKey='lapIntoStint'
                                type='number'
                                domain={['dataMin', 'dataMax']}
                                stroke='#71717a'
                                fontSize={10}
                                tickLine={false}
                                dy={10}
                            >
                                <Label
                                    value='Laps into stint'
                                    offset={-10}
                                    position='insideBottom'
                                    style={{
                                        fill: '#a1a1aa',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        letterSpacing: '0.05em',
                                        textTransform: 'uppercase',
                                    }}
                                />
                            </XAxis>

                            <YAxis
                                stroke='#71717a'
                                fontSize={10}
                                tickLine={false}
                                dx={-5}
                                tickFormatter={(value: number) => `${signed(value, 1)}s`}
                            />

                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#09090b',
                                    borderColor: '#27272a',
                                    borderRadius: '8px',
                                    padding: '10px',
                                }}
                                labelStyle={{
                                    color: '#f4f4f5',
                                    fontWeight: 'bold',
                                    fontSize: '11px',
                                }}
                                itemStyle={{ fontSize: '11px', padding: '2px 0' }}
                                labelFormatter={(lap) => `Lap ${lap} of the stint`}
                                formatter={(value) =>
                                    typeof value === 'number' ? `${signed(value)}s` : value
                                }
                            />

                            {degradation.compounds.map((compound) => (
                                <Line
                                    key={compound}
                                    type='monotone'
                                    dataKey={compound}
                                    name={COMPOUND_STYLE[compound].label}
                                    stroke={COMPOUND_STYLE[compound].color}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4, strokeWidth: 0 }}
                                    connectNulls
                                    isAnimationActive={false}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardBody>

            <CardNote>
                The curve is the average lap time against the first three clean laps of each stint.
                Lap 1, pit in and out laps, safety car laps and slow outliers are left out. It&apos;s
                not fuel-corrected: cars get lighter and quicker as fuel burns off, so real tyre wear
                is steeper than shown. Stints with under six clean laps are skipped.
            </CardNote>
        </Card>
    );
}
