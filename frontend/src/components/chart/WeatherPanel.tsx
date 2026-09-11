'use client';

import { WeatherSnapshot } from '@/types/results';
import { TABLE_CONTAINER_CLASS } from '@/utils/styles';
import { Droplets, Gauge, Thermometer, Wind } from 'lucide-react';

interface Props {
    weather?: WeatherSnapshot[] | null;
}

function avg(values: (number | null | undefined)[]): number | null {
    const valid = values.filter((v): v is number => typeof v === 'number');
    if (!valid.length) return null;
    return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function fmt(value: number | null, decimals = 1): string {
    return value === null ? '—' : value.toFixed(decimals);
}

export function WeatherPanel({ weather }: Props) {
    const snapshots = Array.isArray(weather) ? weather : [];

    if (snapshots.length === 0) {
        return null;
    }

    const latest = snapshots.at(-1);

    const avgAir = avg(snapshots.map((w) => w.airTemperature));
    const avgTrack = avg(snapshots.map((w) => w.trackTemperature));
    const avgHumidity = avg(snapshots.map((w) => w.humidity));
    const avgWind = avg(snapshots.map((w) => w.windSpeed));
    const avgPressure = avg(snapshots.map((w) => w.pressure));

    const hadRain = snapshots.some((w) => (w.rainfall ?? 0) > 0);

    const stats = [
        {
            icon: Thermometer,
            label: 'Air Temp',
            value: `${fmt(avgAir)}°C`,
            sub: `Track ${fmt(avgTrack)}°C`,
            highlight: false,
        },
        {
            icon: Droplets,
            label: 'Humidity',
            value: `${fmt(avgHumidity, 0)}%`,
            sub: hadRain ? 'Rain detected' : 'Dry',
            highlight: hadRain,
        },
        {
            icon: Wind,
            label: 'Wind Speed',
            value: `${fmt(avgWind)} m/s`,
            sub: latest?.windDirection != null ? `${latest.windDirection}°` : '—',
            highlight: false,
        },
        {
            icon: Gauge,
            label: 'Pressure',
            value: `${fmt(avgPressure, 0)} hPa`,
            sub: 'Avg session',
            highlight: false,
        },
    ];

    return (
        <div className={TABLE_CONTAINER_CLASS}>
            <div className='p-4 pl-5 border-b border-zinc-900 bg-zinc-900/20 flex items-center justify-between'>
                <h3 className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>
                    Session Weather
                </h3>
                <span className='text-[10px] text-zinc-400 font-medium uppercase tracking-wider'>
                    Avg across session
                </span>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-900'>
                {stats.map(({ icon: Icon, label, value, sub, highlight }) => (
                    <div key={label} className='bg-zinc-950/60 p-4 space-y-2'>
                        <div className='flex items-center gap-2'>
                            <Icon
                                className={`w-3.5 h-3.5 ${
                                    highlight ? 'text-blue-400' : 'text-zinc-400'
                                }`}
                            />
                            <span className='text-[10px] font-bold text-zinc-400 uppercase tracking-wider'>
                                {label}
                            </span>
                        </div>

                        <p
                            className={`text-lg font-black font-mono ${
                                highlight ? 'text-blue-400' : 'text-zinc-100'
                            }`}
                        >
                            {value}
                        </p>

                        <p
                            className={`text-[10px] font-medium ${
                                highlight ? 'text-blue-400/70' : 'text-zinc-400'
                            }`}
                        >
                            {sub}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
