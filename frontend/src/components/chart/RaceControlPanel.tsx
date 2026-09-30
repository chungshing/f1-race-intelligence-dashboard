/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useMemo, useState } from 'react';
import { RaceControlEvent } from '@/types/results';
import { TABLE_CONTAINER_CLASS } from '@/utils/styles';
import { classifyImportance } from '@/utils/raceControl';

interface Props {
    raceControl?: RaceControlEvent[] | null;
}

const FLAG_DOT_COLORS: Record<string, string> = {
    YELLOW: 'bg-yellow-400',
    'DOUBLE YELLOW': 'bg-yellow-300',
    RED: 'bg-red-500',
    GREEN: 'bg-green-400',
    CHEQUERED: 'bg-zinc-100',
    'BLACK AND WHITE': 'bg-zinc-400',
    BLUE: 'bg-blue-400',
    CLEAR: 'bg-zinc-600',
};

const CATEGORY_LABEL: Record<string, string> = {
    SafetyCar: 'Safety Car',
    Flag: 'Flag',
    Drs: 'DRS',
    SessionStatus: 'Session',
    CarEvent: 'Car Event',
    Other: 'Note',
};

const CATEGORY_BADGE: Record<string, string> = {
    SafetyCar: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Flag: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    Drs: 'bg-green-500/10 text-green-400 border-green-500/20',
    SessionStatus: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    CarEvent: 'bg-red-500/10 text-red-400 border-red-500/20',
    Other: 'bg-zinc-800 text-zinc-300 border-zinc-700',
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
                {visible.map(({ event }, i) => {
                    const dotColor = event.flag
                        ? (FLAG_DOT_COLORS[event.flag] ?? 'bg-zinc-500')
                        : null;
                    const categoryKey = event.category ?? 'Other';
                    const badgeClass = CATEGORY_BADGE[categoryKey] ?? CATEGORY_BADGE.Other;
                    const categoryLabel = CATEGORY_LABEL[categoryKey] ?? categoryKey;

                    return (
                        <div
                            key={i}
                            className='flex items-start gap-3 px-5 py-3.5 hover:bg-zinc-900/30 transition-colors'
                        >
                            <span className='text-[10px] font-mono font-bold text-zinc-500 w-9 pt-0.5 shrink-0'>
                                {event.lapNumber != null ? `L${event.lapNumber}` : '—'}
                            </span>

                            <span
                                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border shrink-0 flex items-center gap-1.5 mt-px ${badgeClass}`}
                            >
                                {dotColor && (
                                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                                )}
                                {categoryLabel}
                            </span>

                            <p className='text-xs text-zinc-300 leading-relaxed flex-1 pt-0.5'>
                                {event.message}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}