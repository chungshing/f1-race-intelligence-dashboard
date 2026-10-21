'use client';

import { TeamPitSummary } from '@/lib/pitStops';
import { TABLE_CONTAINER_CLASS } from '@/utils/styles';
import { Timer } from 'lucide-react';

const STAT_CARD = 'rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5';
const STAT_LABEL = 'text-[10px] font-bold uppercase tracking-wider text-zinc-400';
const STAT_VALUE = 'mt-1 font-mono text-3xl font-bold text-zinc-100';

interface Props {
    summary: TeamPitSummary;
    teamColor: string;
}

const seconds = (value: number | null) => (value == null ? '—' : `${value.toFixed(2)}s`);

export function ConstructorPitStops({ summary, teamColor }: Props) {
    if (summary.totalStops === 0) return null;

    const seasonBest = Math.min(...summary.rounds.map((r) => r.best));

    return (
        <div className='space-y-3'>
            <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
                <div className={STAT_CARD}>
                    <p className={STAT_LABEL}>Pit crew rank</p>
                    <h2 className={STAT_VALUE}>
                        {summary.rank != null ? `P${summary.rank}` : '—'}
                        <span className='ml-1.5 text-sm font-medium text-zinc-400'>
                            of {summary.teamsRanked}
                        </span>
                    </h2>
                </div>
                <div className={STAT_CARD}>
                    <p className={STAT_LABEL}>Typical stop</p>
                    <h2 className={STAT_VALUE}>{seconds(summary.medianStop)}</h2>
                </div>
                <div className={STAT_CARD}>
                    <p className={STAT_LABEL}>Best stop</p>
                    <h2 className={STAT_VALUE}>{seconds(summary.bestStop)}</h2>
                </div>
                <div className={STAT_CARD}>
                    <p className={STAT_LABEL}>Total stops</p>
                    <h2 className={STAT_VALUE}>{summary.totalStops}</h2>
                </div>
            </div>

            <div className={TABLE_CONTAINER_CLASS}>
                <div className='p-4 pl-5 border-b border-zinc-900 bg-zinc-900/20 flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-2'>
                        <Timer className='w-4 h-4 text-zinc-400' />
                        <h3 className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>
                            Pit Stops by Race
                        </h3>
                        {summary.usingLaneDuration && (
                            <span
                                className='text-[9px] font-bold text-amber-500/60 border border-amber-500/30 px-1.5 py-0.5 rounded cursor-help'
                                title='Stop duration unavailable from OpenF1 — showing pit lane duration instead'
                            >
                                LANE
                            </span>
                        )}
                    </div>
                    <span className='text-[10px] text-zinc-400 font-medium uppercase tracking-wider'>
                        Ranked by median stop
                    </span>
                </div>

                <div className='overflow-x-auto'>
                    <table className='w-full text-xs'>
                        <thead>
                            <tr className='border-b border-zinc-900'>
                                <th className='text-left py-2.5 px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider'>
                                    Race
                                </th>
                                <th className='text-right py-2.5 px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider'>
                                    Best
                                </th>
                                <th className='text-right py-2.5 px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider'>
                                    Median
                                </th>
                                <th className='text-right py-2.5 px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider'>
                                    Stops
                                </th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-zinc-900'>
                            {summary.rounds.map((round) => {
                                const isBest = round.best === seasonBest;
                                return (
                                    <tr
                                        key={round.meetingKey}
                                        className='hover:bg-zinc-900/50 transition-colors'
                                    >
                                        <td className='py-2.5 px-4 font-semibold text-zinc-200'>
                                            {round.country}
                                        </td>
                                        <td
                                            className='py-2.5 px-4 text-right font-mono tabular-nums'
                                            style={isBest ? { color: teamColor } : undefined}
                                        >
                                            <span
                                                className={isBest ? 'font-bold' : 'text-zinc-300'}
                                            >
                                                {seconds(round.best)}
                                            </span>
                                        </td>
                                        <td className='py-2.5 px-4 text-right font-mono tabular-nums text-zinc-300'>
                                            {seconds(round.median)}
                                        </td>
                                        <td className='py-2.5 px-4 text-right font-mono tabular-nums text-zinc-400'>
                                            {round.stops}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
