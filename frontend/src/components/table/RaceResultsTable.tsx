'use client';

import { DriverResult } from '@/types/results';
import { getPositionColor, TABLE_CONTAINER_CLASS, TABLE_THEAD_CLASS } from '@/utils/styles';
import { ListOrdered, Timer, Trophy } from 'lucide-react';

interface Props {
    classification: DriverResult[];
    lookup: Record<number, { name: string; team: string; teamColor: string }>;
    variant?: 'default' | 'landing';
    sessionName?: string;
}

export const RaceResultsTable = ({
    classification,
    lookup,
    variant = 'default',
    sessionName,
}: Props) => {
    const isLanding = variant === 'landing';
    const isQualifying =
        sessionName?.toLowerCase().includes('qualifying') ||
        sessionName?.toLowerCase().includes('sprint qualifying');

    const rows = (isLanding ? classification.slice(0, 3) : classification).map((r) => {
        const info = lookup[r.driverNumber] ?? {
            name: `Driver ${r.driverNumber}`,
            team: 'Unknown',
            teamColor: '#3f3f46',
        };
        const hasStatus = !!(r.dsq || r.dnf || r.dns);
        const statusText = r.dsq ? 'DSQ' : r.dnf ? 'DNF' : r.dns ? 'DNS' : '';

        return { r, info, hasStatus, statusText };
    });

    if (isLanding) {
        return (
            <div className={TABLE_CONTAINER_CLASS}>
                <div className='p-4 pl-5 border-b border-zinc-900 bg-zinc-900/20 flex items-center gap-2'>
                    <Trophy className='w-4 h-4 text-zinc-400' />
                    <h3 className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>
                        Podium
                    </h3>
                </div>

                <div className='divide-y divide-zinc-900'>
                    {rows.map(({ r, info }) => (
                        <div
                            key={r.driverNumber}
                            className='flex items-center justify-between p-4 hover:bg-zinc-900/30 transition-colors'
                            style={{ borderLeft: `4px solid ${info.teamColor}` }}
                        >
                            <div className='flex items-center gap-3 min-w-0'>
                                <span
                                    className={`font-mono font-black text-base w-5 shrink-0 ${getPositionColor(r.position || 0)}`}
                                >
                                    {r.position || '-'}
                                </span>
                                <div className='min-w-0'>
                                    <p className='font-bold text-zinc-200 text-sm truncate'>
                                        {info.name}
                                    </p>
                                    <p className='text-[10px] text-zinc-400 truncate'>
                                        {info.team}
                                    </p>
                                </div>
                            </div>
                            <div className='text-right font-mono text-zinc-400 text-[11px] flex items-center gap-1.5 shrink-0 pl-2'>
                                {r.position === 1 ? (
                                    <span className='inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-500/20'>
                                        <Trophy className='w-3 h-3 fill-amber-400/20' /> WINNER
                                    </span>
                                ) : r.gapToLeader != null ? (
                                    <>
                                        <Timer className='w-3 h-3 text-zinc-400' />
                                        <span>{r.gapToLeader}</span>
                                    </>
                                ) : (
                                    '-'
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={TABLE_CONTAINER_CLASS}>
            <div className='p-4 pl-5 border-b border-zinc-900 bg-zinc-900/20 flex items-center gap-2'>
                <ListOrdered className='w-4 h-4 text-zinc-400' />
                <h3 className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>
                    Official Classification
                </h3>
            </div>

            <table className='w-full text-left border-collapse'>
                <thead>
                    <tr className={TABLE_THEAD_CLASS}>
                        <th className='p-4 pl-5'>Pos</th>
                        <th className='p-4'>Driver</th>
                        <th className='p-4'>Team</th>
                        <th className='p-4 text-right'>{isQualifying ? 'Best Time' : 'Gap'}</th>
                    </tr>
                </thead>
                <tbody className='divide-y divide-zinc-900'>
                    {rows.map(({ r, info, hasStatus, statusText }) => (
                        <tr
                            key={r.driverNumber}
                            className='hover:bg-zinc-900/50 transition-colors group'
                        >
                            <td
                                className={`p-4 pl-5 font-black font-mono tracking-tight transition-all ${getPositionColor(r.position || 0)}`}
                                style={{ borderLeft: `4px solid ${info.teamColor}` }}
                            >
                                {hasStatus ? (
                                    <span
                                        className={
                                            r.dsq
                                                ? 'text-red-500'
                                                : r.dnf
                                                  ? 'text-zinc-400'
                                                  : 'text-amber-500'
                                        }
                                    >
                                        {statusText}
                                    </span>
                                ) : (
                                    r.position || '-'
                                )}
                            </td>
                            <td className='p-4 font-semibold text-zinc-200'>{info.name}</td>
                            <td className='p-4 text-zinc-400 text-xs tracking-tight'>
                                {info.team}
                            </td>
                            <td className='p-4 text-right font-mono text-zinc-400 tabular-nums'>
                                {hasStatus ? (
                                    statusText
                                ) : isQualifying ? (
                                    Array.isArray(r.formattedDuration) ? (
                                        <div className='flex flex-col items-end gap-0.5'>
                                            {r.formattedDuration.map((t, i) => (
                                                <span key={i} className='text-[10px]'>
                                                    <span className='text-zinc-400 mr-1'>
                                                        Q{i + 1}
                                                    </span>
                                                    {t || '—'}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span>{r.formattedDuration || '—'}</span>
                                    )
                                ) : r.position === 1 ? (
                                    <span className='inline-flex items-center gap-1 text-xs text-amber-400 font-bold'>
                                        <Trophy className='w-3.5 h-3.5 fill-amber-400/10' /> Winner
                                    </span>
                                ) : r.gapToLeader != null ? (
                                    `${r.gapToLeader}`
                                ) : (
                                    '-'
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
