'use client';

import { RaceWeekend } from '@/types/race';
import Image from 'next/image';

interface Props {
    weekends: RaceWeekend[];
    selectedKey: number | null;
    nextKey: number | null;
    pastKeys: Set<number>;
    onSelect: (meetingKey: number) => void;
}

export default function SeasonList({ weekends, selectedKey, nextKey, pastKeys, onSelect }: Props) {
    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2'>
            {weekends.map((w, i) => {
                const race = w.sessions.find((s) => s.sessionName === 'Race') ?? w.sessions[0];
                const isSelected = w.meetingKey === selectedKey;
                const isPast = pastKeys.has(w.meetingKey);
                const isNext = w.meetingKey === nextKey;

                return (
                    <button
                        key={w.meetingKey}
                        onClick={() => onSelect(w.meetingKey)}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors min-h-14 ${
                            isSelected
                                ? 'border-red-500/40 bg-red-950/10'
                                : 'border-zinc-900 bg-zinc-900/20 hover:border-zinc-800 hover:bg-zinc-900/40'
                        }`}
                    >
                        <span className='w-6 shrink-0 text-center font-mono text-[11px] text-zinc-500'>
                            {i + 1}
                        </span>
                        {w.countryFlag && (
                            <span className='relative w-5 h-3.5 rounded-xs overflow-hidden border border-zinc-800/60 shrink-0'>
                                <Image
                                    src={w.countryFlag}
                                    alt=''
                                    fill
                                    sizes='20px'
                                    className='object-cover'
                                />
                            </span>
                        )}
                        <span className='min-w-0 flex-1'>
                            <span className='block text-sm font-bold text-zinc-100 truncate'>
                                {w.country}
                            </span>
                            <span className='block text-xs text-zinc-400 truncate'>
                                {w.circuit}
                            </span>
                        </span>
                        <span className='text-right shrink-0'>
                            <span className='block font-mono text-xs text-zinc-400'>
                                {race
                                    ? new Date(race.dateStart).toLocaleDateString('en-GB', {
                                          day: '2-digit',
                                          month: 'short',
                                      })
                                    : ''}
                            </span>
                            <span
                                className={`block text-[9px] font-bold uppercase tracking-wider ${
                                    isNext
                                        ? 'text-red-400'
                                        : isPast
                                          ? 'text-emerald-500'
                                          : 'text-zinc-500'
                                }`}
                            >
                                {isNext ? 'Next' : isPast ? 'Done' : 'Upcoming'}
                            </span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
