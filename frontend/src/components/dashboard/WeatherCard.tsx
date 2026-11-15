'use client';

import { Card, CardBody, CardHeader, CardMeta, StatTile } from '@/components/ui/Card';
import { useRaceWeather } from '@/hooks/useRaceWeather';
import { RainRisk, WeatherKind } from '@/lib/weather';
import { RaceWeekend } from '@/types/race';
import {
    Cloud,
    CloudDrizzle,
    CloudFog,
    CloudLightning,
    CloudRain,
    CloudSnow,
    CloudSun,
    Sun,
    type LucideIcon,
} from 'lucide-react';

const ICONS: Record<WeatherKind, LucideIcon> = {
    clear: Sun,
    partly: CloudSun,
    cloud: Cloud,
    fog: CloudFog,
    drizzle: CloudDrizzle,
    rain: CloudRain,
    snow: CloudSnow,
    storm: CloudLightning,
};

const RISK_STYLE: Record<RainRisk, string> = {
    Low: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    Medium: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    High: 'text-red-400 border-red-500/30 bg-red-500/10',
};

export function WeatherCard({ race }: { race: RaceWeekend }) {
    const { data, isPending } = useRaceWeather(race);

    if (isPending) {
        return (
            <div className='h-52 bg-zinc-900/40 border border-zinc-800/50 rounded-xl animate-pulse' />
        );
    }
    if (!data) return null;

    return (
        <Card>
            <CardHeader
                icon={CloudSun}
                title='Weather Forecast'
                right={<CardMeta>{data.place}</CardMeta>}
            />

            <CardBody className='space-y-4'>
                {data.status === 'too-far' ? (
                    <p className='text-xs text-zinc-400'>
                        The forecast opens on{' '}
                        {new Date(`${data.availableFrom}T12:00:00Z`).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            timeZone: 'UTC',
                        })}
                        , about 15 days before the race.
                    </p>
                ) : (
                    <>
                        {data.race && (
                            <div className='space-y-2'>
                                <div className='flex items-center justify-between'>
                                    <p className='text-[10px] font-bold uppercase tracking-wider text-zinc-400'>
                                        Race start · {data.race.localTime} local
                                    </p>
                                    <span
                                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${RISK_STYLE[data.race.risk]}`}
                                    >
                                        {data.race.risk} wet risk
                                    </span>
                                </div>
                                <div className='grid grid-cols-3 gap-2'>
                                    <StatTile label='Temp'>
                                        <p className='font-mono text-xl font-black text-zinc-100 tabular-nums'>
                                            {Math.round(data.race.temp)}°
                                        </p>
                                    </StatTile>
                                    <StatTile label='Rain'>
                                        <p className='font-mono text-xl font-black text-zinc-100 tabular-nums'>
                                            {data.race.rainChance}%
                                        </p>
                                    </StatTile>
                                    <StatTile label='Wind'>
                                        <p className='font-mono text-xl font-black text-zinc-100 tabular-nums'>
                                            {Math.round(data.race.wind)}
                                            <span className='ml-0.5 text-xs font-medium text-zinc-400'>
                                                km/h
                                            </span>
                                        </p>
                                    </StatTile>
                                </div>
                            </div>
                        )}

                        <div className='divide-y divide-zinc-900 border border-zinc-800/80 rounded-lg'>
                            {data.days.map((day) => {
                                const Icon = ICONS[day.kind];
                                return (
                                    <div
                                        key={day.date}
                                        className={`flex items-center gap-3 px-3 py-2 text-xs ${
                                            day.isRaceDay ? 'bg-zinc-900/60' : ''
                                        }`}
                                    >
                                        <span className='w-20 shrink-0 font-medium text-zinc-300'>
                                            {day.label}
                                        </span>
                                        <Icon
                                            className='w-4 h-4 text-zinc-400 shrink-0'
                                            aria-label={day.description}
                                        />
                                        <span className='font-mono text-zinc-200 tabular-nums'>
                                            {Math.round(day.tempMax)}° / {Math.round(day.tempMin)}°
                                        </span>
                                        <span className='ml-auto font-mono text-zinc-400 tabular-nums'>
                                            {day.rainChance}%
                                        </span>
                                        {day.isRaceDay && (
                                            <span className='text-[9px] font-bold uppercase tracking-wider text-red-400'>
                                                Race
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </CardBody>
        </Card>
    );
}
