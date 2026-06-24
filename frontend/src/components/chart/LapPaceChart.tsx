'use client';

import { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Label,
} from 'recharts';
import { getSessionChartData } from '@/lib/app';
import { ChartLapData } from '@/types/laps';
import { Activity } from 'lucide-react';
import { TABLE_CONTAINER_CLASS } from '@/utils/styles';

interface ClassificationRow {
    driverNumber?: string | number;
    driver_number?: string | number;
}

interface LapPaceChartProps {
    sessionKey: number;
    driversList: ClassificationRow[];
    lookup: Record<number, { name: string; team: string; teamColor: string }>;
}

export function LapPaceChart({ sessionKey, driversList, lookup }: LapPaceChartProps) {
    const [chartData, setChartData] = useState<ChartLapData[]>([]);
    const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);
    const [prevSessionKey, setPrevSessionKey] = useState<number>(sessionKey);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    if (sessionKey !== prevSessionKey) {
        setPrevSessionKey(sessionKey);
        setLoading(true);
        setChartData([]);
    }

    useEffect(() => {
        let active = true;

        const timeoutId = setTimeout(() => {
            if (active) setIsMounted(true);
        }, 0);

        getSessionChartData(sessionKey)
            .then((data) => {
                if (!active) return;
                setChartData(data);

                if (driversList && driversList.length > 1) {
                    setSelectedDrivers([
                        Number(driversList[0].driverNumber || driversList[0].driver_number),
                        Number(driversList[1].driverNumber || driversList[1].driver_number),
                    ]);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                if (active) setLoading(false);
            });

        return () => {
            active = false;
            clearTimeout(timeoutId);
        };
    }, [sessionKey, driversList]);

    const toggleDriver = (driverNum: number) => {
        setSelectedDrivers((prev) =>
            prev.includes(driverNum) ? prev.filter((id) => id !== driverNum) : [...prev, driverNum],
        );
    };

    const maxLap = chartData.length > 0 ? Math.max(...chartData.map((d) => d.lap || 0)) : 0;

    if (loading || !isMounted) {
        return (
            <div className='text-zinc-500 text-xs py-20 text-center animate-pulse tracking-wider uppercase font-semibold'>
                Processing Lap Telemetry...
            </div>
        );
    }

    return (
        <div className={TABLE_CONTAINER_CLASS}>
            {/* Header section */}
            <div className='p-4 pl-5 border-b border-zinc-900 bg-zinc-900/20 flex items-center gap-2'>
                <Activity className='w-4 h-4 text-zinc-500' />
                <h3 className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>
                    Lap Telemetry & Pace Analysis
                </h3>
            </div>

            <div className='p-5 flex flex-col gap-6 min-w-0'>
                {/* 1. Top-aligned Compact Horizontal Driver List */}
                <div className='w-full min-w-0'>
                    <h4 className='text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-2.5'>
                        Filter Drivers
                    </h4>
                    <div className='flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 scrollbar-none'>
                        {driversList.map((driver, idx) => {
                            const num = Number(driver.driverNumber || driver.driver_number);
                            if (isNaN(num)) return null;

                            const meta = lookup[num] || {
                                name: `Driver ${num}`,
                                teamColor: '#71717a',
                            };
                            const isSelected = selectedDrivers.includes(num);

                            return (
                                <button
                                    key={`${num}-${idx}`}
                                    onClick={() => toggleDriver(num)}
                                    className={`px-2 py-1 text-[11px] font-medium rounded transition-colors flex items-center gap-2 whitespace-nowrap ${
                                        isSelected
                                            ? 'bg-zinc-900 text-zinc-100 font-bold'
                                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
                                    }`}
                                >
                                    <span
                                        className='w-1.5 h-1.5 rounded-full shrink-0 transition-transform'
                                        style={{
                                            backgroundColor: meta.teamColor,
                                            transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                                        }}
                                    />
                                    <span>{meta.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Patched Responsive Chart Layout Target Frame */}
                <div className='w-full min-w-0 h-100 flex flex-col justify-between'>
                    <div
                        className='w-full h-full min-w-0 min-h-0 relative'
                        id='telemetry-chart-frame'
                    >
                        <ResponsiveContainer width='100%' height='100%'>
                            <LineChart
                                data={chartData}
                                margin={{ top: 15, right: 15, left: 10, bottom: 20 }}
                            >
                                <CartesianGrid
                                    strokeDasharray='3 3'
                                    stroke='#161619'
                                    vertical={false}
                                />

                                {/* X-AXIS */}
                                <XAxis
                                    dataKey='lap'
                                    type='number'
                                    domain={[1, maxLap > 0 ? maxLap : 'dataMax']}
                                    stroke='#71717a'
                                    fontSize={10}
                                    tickLine={false}
                                    dy={10}
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

                                {/* Y-AXIS */}
                                <YAxis
                                    stroke='#71717a'
                                    fontSize={10}
                                    tickLine={false}
                                    domain={['dataMin - 0.3', 'dataMax + 0.3']}
                                    dx={-5}
                                >
                                    <Label
                                        value='Lap Duration (Seconds)'
                                        angle={-90}
                                        position='insideLeft'
                                        offset={-5}
                                        style={{
                                            fill: '#a1a1aa',
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            letterSpacing: '0.05em',
                                            textTransform: 'uppercase',
                                            textAnchor: 'middle',
                                        }}
                                    />
                                </YAxis>

                                {/* Tooltip config */}
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
                                />

                                {selectedDrivers.map((num) => {
                                    const meta = lookup[num] || {
                                        name: num.toString(),
                                        teamColor: '#ffffff',
                                    };
                                    return (
                                        <Line
                                            key={num}
                                            type='monotone'
                                            dataKey={num.toString()}
                                            name={meta.name}
                                            stroke={meta.teamColor}
                                            strokeWidth={2.5}
                                            dot={false}
                                            activeDot={{ r: 4, strokeWidth: 0 }}
                                            connectNulls
                                        />
                                    );
                                })}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
