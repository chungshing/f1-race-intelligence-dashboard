'use client';

import { useSessionLaps } from '@/hooks/useSessionLaps';
import { DriverResult, RaceControlEvent } from '@/types/results';
import { GridEntry } from '@/utils/gridVsRace';
import { buildPositionByLap } from '@/utils/positions';
import { getSafetyCarWindows } from '@/utils/raceControl';
import { disambiguateTeamColors } from '@/utils/sessions';
import { TABLE_CONTAINER_CLASS } from '@/utils/styles';
import { Flag } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    CartesianGrid,
    Label,
    Line,
    LineChart,
    ReferenceArea,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface Props {
    sessionKey: number;
    driversList: DriverResult[];
    grid: GridEntry[];
    lookup: Record<number, { name: string; team: string; teamColor: string }>;
    raceControl?: RaceControlEvent[] | null;
}

export function PositionByLapChart({ sessionKey, driversList, grid, lookup, raceControl }: Props) {
    const { data: rawLaps, loading } = useSessionLaps(sessionKey);

    const chart = useMemo(() => buildPositionByLap(rawLaps, grid), [rawLaps, grid]);
    const safetyCarWindows = useMemo(() => getSafetyCarWindows(raceControl ?? []), [raceControl]);

    const [selectedDrivers, setSelectedDrivers] = useState<number[]>(() =>
        driversList.map((d) => d.driverNumber)
    );

    const teamColorMap = useMemo(() => {
        const entries = driversList
            .map((driver) => {
                const meta = lookup[driver.driverNumber];
                return meta
                    ? {
                          num: driver.driverNumber,
                          teamName: meta.team,
                          teamColor: meta.teamColor,
                      }
                    : null;
            })
            .filter((e): e is { num: number; teamName: string; teamColor: string } => e !== null);

        const colorMap = disambiguateTeamColors(entries);
        const result = new Map<number, string>();
        colorMap.forEach((color, entry) => result.set(entry.num, color));
        return result;
    }, [driversList, lookup]);

    const toggleDriver = (driverNumber: number) => {
        setSelectedDrivers((prev) =>
            prev.includes(driverNumber)
                ? prev.filter((n) => n !== driverNumber)
                : [...prev, driverNumber]
        );
    };

    const yTicks = useMemo(
        () => Array.from({ length: chart.maxPosition }, (_, i) => i + 1),
        [chart.maxPosition]
    );

    if (loading) {
        return (
            <div className='text-zinc-400 text-xs py-20 text-center animate-pulse tracking-wider uppercase font-semibold'>
                Processing Race Positions...
            </div>
        );
    }

    if (chart.rows.length < 2) return null;

    return (
        <div className={TABLE_CONTAINER_CLASS}>
            <div className='p-4 pl-5 border-b border-zinc-900 bg-zinc-900/20 flex items-center gap-2'>
                <Flag className='w-4 h-4 text-zinc-400' />
                <h3 className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>
                    Position by Lap
                </h3>
                {safetyCarWindows.length > 0 && (
                    <span className='ml-auto text-[9px] font-bold text-yellow-400/80 uppercase tracking-wider'>
                        Shaded = Safety Car
                    </span>
                )}
            </div>

            <div className='p-5 flex flex-col gap-6 min-w-0'>
                <div className='w-full min-w-0'>
                    <div className='flex items-center justify-between mb-2.5'>
                        <h4 className='text-[10px] font-bold text-zinc-400 tracking-widest uppercase mb-2.5'>
                            Filter Drivers
                        </h4>
                        <div className='flex gap-3'>
                            <button
                                onClick={() =>
                                    setSelectedDrivers(driversList.map((d) => d.driverNumber))
                                }
                                className='text-[10px] font-bold text-zinc-400 hover:text-zinc-300 uppercase tracking-wider transition-colors'
                            >
                                All
                            </button>
                            <button
                                onClick={() => setSelectedDrivers([])}
                                className='text-[10px] font-bold text-zinc-400 hover:text-zinc-300 uppercase tracking-wider transition-colors'
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                    <div className='flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 scrollbar-none'>
                        {driversList.map((driver) => {
                            const num = driver.driverNumber;
                            const meta = lookup[num] || {
                                name: `Driver ${num}`,
                                teamColor: '#71717a',
                            };
                            const dotColor = teamColorMap.get(num) ?? meta.teamColor;
                            const isSelected = selectedDrivers.includes(num);

                            return (
                                <button
                                    key={num}
                                    onClick={() => toggleDriver(num)}
                                    className={`px-2 py-1 text-[11px] font-medium rounded transition-colors flex items-center gap-2 whitespace-nowrap ${
                                        isSelected
                                            ? 'bg-zinc-900 text-zinc-100 font-bold'
                                            : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-900/30'
                                    }`}
                                >
                                    <span
                                        className='w-1.5 h-1.5 rounded-full shrink-0 transition-transform'
                                        style={{
                                            backgroundColor: dotColor,
                                            transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                                        }}
                                    />
                                    <span>{meta.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className='w-full min-w-0 h-120'>
                    <ResponsiveContainer width='100%' height='100%'>
                        <LineChart
                            data={chart.rows}
                            margin={{ top: 15, right: 15, left: 10, bottom: 20 }}
                        >
                            <CartesianGrid
                                strokeDasharray='3 3'
                                stroke='#161619'
                                vertical={false}
                            />

                            {safetyCarWindows.map((window, i) => (
                                <ReferenceArea
                                    key={i}
                                    x1={window.startLap}
                                    x2={window.endLap}
                                    fill='#eab308'
                                    fillOpacity={0.08}
                                    stroke='#eab308'
                                    strokeOpacity={0.2}
                                    ifOverflow='extendDomain'
                                />
                            ))}

                            <XAxis
                                dataKey='lap'
                                type='number'
                                domain={[chart.minLap, chart.maxLap]}
                                stroke='#71717a'
                                fontSize={10}
                                tickLine={false}
                                dy={10}
                                tickFormatter={(lap: number) => (lap === 0 ? 'Grid' : String(lap))}
                            >
                                <Label
                                    value='Lap Number'
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
                                reversed
                                domain={[1, chart.maxPosition]}
                                ticks={yTicks}
                                interval={0}
                                allowDecimals={false}
                                stroke='#71717a'
                                fontSize={10}
                                tickLine={false}
                                dx={-5}
                                tickFormatter={(pos: number) => `P${pos}`}
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
                                labelFormatter={(lap) => (lap === 0 ? 'Grid' : `Lap ${lap}`)}
                                itemSorter={(item) =>
                                    typeof item.value === 'number' ? item.value : 99
                                }
                            />

                            {selectedDrivers.map((num) => {
                                const meta = lookup[num] || {
                                    name: num.toString(),
                                    teamColor: '#ffffff',
                                };
                                return (
                                    <Line
                                        key={num}
                                        type='linear'
                                        dataKey={num.toString()}
                                        name={meta.name}
                                        stroke={teamColorMap.get(num) ?? meta.teamColor}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                        connectNulls={false}
                                    />
                                );
                            })}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
