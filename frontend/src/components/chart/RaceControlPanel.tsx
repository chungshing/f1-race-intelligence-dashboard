'use client';

import { RaceControlEvent } from '@/types/results';
import { TABLE_CONTAINER_CLASS } from '@/utils/styles';

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
    SessionStatus: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    CarEvent: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export function RaceControlPanel({ raceControl }: Props) {
    const events = Array.isArray(raceControl) ? raceControl : [];

    if (events.length === 0) return null;

    return (
        <div className={TABLE_CONTAINER_CLASS}>
            <div className='p-4 pl-5 border-b border-zinc-900 bg-zinc-900/20 flex items-center justify-between'>
                <h3 className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>
                    Race Control
                </h3>
                <span className='text-[10px] text-zinc-600 font-medium uppercase tracking-wider'>
                    {events.length} events
                </span>
            </div>

            <div className='divide-y divide-zinc-900'>
                {events.map((event, i) => {
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
                            className='flex items-start gap-4 px-5 py-3 hover:bg-zinc-900/30 transition-colors'
                        >
                            <span className='text-[10px] font-mono text-zinc-600 w-8 pt-0.5 shrink-0'>
                                {event.lapNumber != null ? `L${event.lapNumber}` : '—'}
                            </span>

                            <div className='flex-1 min-w-0 space-y-1'>
                                <div className='flex items-center gap-2 flex-wrap'>
                                    {event.category && (
                                        <span
                                            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${badgeClass}`}
                                        >
                                            {event.category}
                                        </span>
                                    )}
                                    {event.flag && (
                                        <span
                                            className={`text-[10px] font-bold uppercase tracking-wider ${flagColor}`}
                                        >
                                            {event.flag}
                                        </span>
                                    )}
                                    {event.driverNumber && (
                                        <span className='text-[10px] font-mono text-zinc-500'>
                                            #{event.driverNumber}
                                        </span>
                                    )}
                                </div>
                                {event.message && (
                                    <p className='text-xs text-zinc-300 leading-relaxed'>
                                        {event.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
