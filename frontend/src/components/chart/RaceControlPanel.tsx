/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useMemo, useState } from 'react';
import { RaceControlEvent } from '@/types/results';
import { TABLE_CONTAINER_CLASS } from '@/utils/styles';
import { classifyImportance } from '@/utils/raceControl';

interface Props {
    raceControl?: RaceControlEvent[] | null;
}

const FLAG_COLORS: Record<string, string> = {
    YELLOW: 'text-yellow-400',
    'DOUBLE YELLOW': 'text-yellow-300',
    RED: 'text-red-500',
    GREEN: 'text-green-400',
    CHEQUERED: 'text-zinc-100',
    'BLACK AND WHITE': 'text-zinc-400',
    BLUE: 'text-blue-400',
};

const CATEGORY_BADGE: Record<string, string> = {
    SafetyCar: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Flag: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    Drs: 'bg-green-500/10 text-green-400 border-green-500/20',
    SessionStatus: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    CarEvent: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export function RaceControlPanel({ raceControl }: Props) {
    const events = Array.isArray(raceControl) ? raceControl : [];
    const [showAll, setShowAll] = useState(false);

    const classified = useMemo(
        () => events.map((event) => ({ event, importance: classifyImportance(event) })),
        [events]
    );

    const visible = showAll
        ? classified
        : classified.filter((e) => e.importance === 'high' || e.importance === 'milestone');

    const hiddenCount = classified.length - visible.length;

    if (events.length === 0) return null;

    return (
        <div className={TABLE_CONTAINER_CLASS}>
            <div className='p-4 pl-5 border-b border-zinc-900 bg-zinc-900/20 flex items-center justify-between'>
                <h3 className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>
                    Race Control
                </h3>
                <div className='flex items-center gap-3'>
                    <span className='text-[10px] text-zinc-400 font-medium uppercase tracking-wider'>
                        {visible.length} of {events.length} events
                    </span>
                    <button
                        onClick={() => setShowAll((prev) => !prev)}
                        className='text-[10px] font-bold text-zinc-400 hover:text-zinc-200 uppercase tracking-wider transition-colors'
                    >
                        {showAll ? 'Show Key Events' : `Show All (${hiddenCount} hidden)`}
                    </button>
                </div>
            </div>

            <div className='divide-y divide-zinc-900'>
                {visible.map(({ event, importance }, i) => {
                    const flagColor = event.flag
                        ? (FLAG_COLORS[event.flag] ?? 'text-zinc-400')
                        : null;
                    const badgeClass = event.category
                        ? (CATEGORY_BADGE[event.category] ??
                          'bg-zinc-800 text-zinc-300 border-zinc-700')
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700';

                    return (
                        <div
                            key={i}
                            className={`flex items-start gap-4 px-5 py-3 hover:bg-zinc-900/30 transition-colors ${
                                importance === 'high' ? 'border-l-2 border-red-500/60' : ''
                            }`}
                        >
                            <span className='text-[10px] font-mono text-zinc-400 w-8 pt-0.5 shrink-0'>
                                {event.lapNumber != null ? `L${event.lapNumber}` : '—'}
                            </span>
                            <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${badgeClass}`}
                            >
                                {event.category ?? 'Event'}
                            </span>
                            <p className={`text-xs flex-1 ${flagColor ?? 'text-zinc-300'}`}>
                                {event.message}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
