'use client';

import { useEffect, useState } from 'react';
import { getNextSession, getTimeRemaining, getWeekendLabel } from '@/utils/race';
import { RaceWeekend } from '@/types/race';
import { Check, Play, Circle, Timer, MapPin, Calendar, Trophy } from 'lucide-react';
import Image from 'next/image';

type Props = {
    variant?: 'card' | 'sticky';
    data: RaceWeekend | null;
};

export default function RaceWeekendCard({ variant = 'card', data }: Props) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    if (!data) {
        return (
            <div className='text-sm text-zinc-400 p-4 border border-zinc-800 rounded-xl bg-zinc-950'>
                No upcoming races found
            </div>
        );
    }

    const sortedSessions = [...data.sessions].sort(
        (a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime(),
    );

    const nextSession = getNextSession(sortedSessions);
    const timeLeft = nextSession ? getTimeRemaining(new Date(nextSession.dateStart)) : null;
    const hasWeekendStarted = sortedSessions.some((s) => new Date(s.dateStart).getTime() < now);

    /* Sticky Compact Mode */
    if (variant === 'sticky') {
        return (
            <div className='sticky top-16 left-0 right-0 z-50 w-full bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 px-6 py-3 flex justify-between items-center shadow-lg gap-4'>
                <div className='flex items-center gap-3'>
                    {data.countryFlag && (
                        <div className='relative w-7 h-5 rounded-sm overflow-hidden border border-zinc-800 shrink-0'>
                            <Image
                                src={data.countryFlag}
                                alt={data.country}
                                fill
                                sizes='28px'
                                className='object-cover'
                            />
                        </div>
                    )}
                    <div>
                        <span className='text-[10px] font-bold text-red-500 uppercase tracking-widest'>
                            Next Grand Prix
                        </span>
                        <p className='text-zinc-100 font-bold text-sm tracking-tight'>
                            {data.country}
                        </p>
                        <p className='text-zinc-500 text-xs font-medium flex items-center gap-1 mt-0.5'>
                            <MapPin className='w-3 h-3 shrink-0' /> {data.circuit}
                        </p>
                    </div>
                </div>

                <div className='flex items-center gap-4'>
                    {nextSession && (
                        <div className='text-right'>
                            <span className='text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center justify-end gap-1'>
                                <Play className='w-2.5 h-2.5 fill-current text-red-500' /> Next Up:{' '}
                                {nextSession.sessionName}
                            </span>
                            {timeLeft && (
                                <p className='text-red-400 font-mono font-bold text-sm flex items-center justify-end gap-1 mt-0.5'>
                                    <Timer className='w-3.5 h-3.5' />
                                    {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
                                </p>
                            )}
                        </div>
                    )}

                    {hasWeekendStarted && (
                        <a
                            href={`/races/${data.meetingKey}`}
                            className='text-xs font-bold px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 rounded-lg transition-colors shrink-0 flex items-center gap-1.5'
                        >
                            <Trophy className='w-3.5 h-3.5 text-zinc-400 shrink-0' />
                            Dashboard
                        </a>
                    )}
                </div>
            </div>
        );
    }

    /* Full Card Mode */
    /* Full Card Mode */
    return (
        <div className='border border-zinc-800 rounded-xl p-5 bg-linear-to-b from-zinc-900 to-zinc-950 shadow-2xl space-y-5'>
            <div className='border-b border-zinc-800/60 pb-3'>
                <div className='flex items-center justify-between'>
                    <span className='text-[10px] font-bold text-red-500 uppercase tracking-widest'>
                        Next Grand Prix
                    </span>
                    {data.circuitType && (
                        <span className='text-[9px] font-bold px-2 py-0.5 rounded-full border border-zinc-800 text-zinc-400 bg-zinc-900/40 tracking-wider uppercase'>
                            {data.circuitType} Layout
                        </span>
                    )}
                </div>

                {/* Header Layer: Country and Flag */}
                <div className='flex items-center gap-3 mt-1'>
                    {data.countryFlag && (
                        <div className='relative w-6 h-4 rounded-sm overflow-hidden border border-zinc-800/80 shrink-0'>
                            <Image
                                src={data.countryFlag}
                                alt={data.country}
                                fill
                                sizes='24px'
                                className='object-cover'
                            />
                        </div>
                    )}
                    <h2 className='text-xl font-black text-zinc-100 tracking-tight'>
                        {data.country}
                    </h2>
                </div>

                {/* Sub-Header Layer: Split Location + Track Vector Group */}
                <div className='flex justify-between items-end mt-3 gap-4'>
                    <div className='space-y-1'>
                        <p className='text-zinc-400 text-xs font-medium flex items-center gap-1'>
                            <MapPin className='w-3 h-3 text-zinc-500 shrink-0' /> {data.circuit}
                        </p>
                        <p className='text-zinc-500 font-mono text-[11px] font-semibold flex items-center gap-1'>
                            <Calendar className='w-3 h-3 text-zinc-600' />{' '}
                            {getWeekendLabel(sortedSessions)}
                        </p>
                    </div>

                    {/* Integrated Track Map Outline next to location */}
                    {data.circuitImage && (
                        <div className='relative w-24 h-16 opacity-40 hover:opacity-80 transition-opacity select-none shrink-0'>
                            <Image
                                src={data.circuitImage}
                                alt={data.circuit}
                                fill
                                sizes='96px'
                                loading='eager'
                                priority
                                className='object-contain inverted'
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Countdown Banner Block */}
            {nextSession && timeLeft && (
                <div className='flex justify-between items-center bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl shadow-inner'>
                    <div>
                        <p className='text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1'>
                            <Play className='w-2.5 h-2.5 fill-current text-red-500' /> Next up
                        </p>
                        <p className='text-zinc-100 font-bold tracking-tight text-sm mt-0.5'>
                            {nextSession.sessionName}
                        </p>
                    </div>
                    <div className='text-right'>
                        <p className='text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center justify-end gap-1'>
                            <Timer className='w-3 h-3' /> Starts In
                        </p>
                        <p className='text-red-400 font-mono font-black text-base mt-0.5'>
                            {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
                        </p>
                    </div>
                </div>
            )}

            {/* Session Schedule List */}
            <div className='space-y-2.5 pt-1'>
                {sortedSessions.map((s) => {
                    const sessionTime = new Date(s.dateStart).getTime();
                    const isDone = sessionTime < now;
                    const isNext = nextSession && s.dateStart === nextSession.dateStart;

                    return (
                        <div
                            key={s.sessionName}
                            className='flex justify-between items-center text-sm group'
                        >
                            <div className='flex items-center gap-3'>
                                <span
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors border
                                    ${
                                        isDone
                                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800/30'
                                            : isNext
                                              ? 'bg-red-950 text-red-400 border-red-800/50 animate-pulse'
                                              : 'bg-zinc-800/50 text-zinc-500 border-transparent'
                                    }`}
                                >
                                    {isDone ? (
                                        <Check className='w-2.5 h-2.5 stroke-3' />
                                    ) : isNext ? (
                                        <Play className='w-2.5 h-2.5 fill-current ml-0.5' />
                                    ) : (
                                        <Circle className='w-1.5 h-1.5 fill-current' />
                                    )}
                                </span>

                                <span
                                    className={`font-medium tracking-tight transition-colors
                                    ${isNext ? 'text-zinc-100 font-bold' : isDone ? 'text-zinc-500 line-through decoration-zinc-800' : 'text-zinc-400'}`}
                                >
                                    {s.sessionName}
                                </span>
                            </div>

                            <span className='text-zinc-500 font-mono text-xs font-medium group-hover:text-zinc-400 transition-colors'>
                                {new Date(s.dateStart).toLocaleString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false,
                                })}
                            </span>
                        </div>
                    );
                })}
            </div>

            {hasWeekendStarted && (
                <a
                    href={`/races/${data.meetingKey}`}
                    className='flex w-full items-center justify-center gap-2 text-xs font-bold py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 rounded-lg transition-colors'
                >
                    <Trophy className='w-4 h-4 text-zinc-400 shrink-0' />
                    View Results Dashboard
                </a>
            )}
        </div>
    );
}
