'use client';

import AppLayout from '@/components/layout/AppLayout';
import { useDriverProfile } from '@/hooks/useDriverProfile';
import { formatHexColor } from '@/utils/sessions';
import { getPositionColor, TABLE_CONTAINER_CLASS, TABLE_THEAD_CLASS } from '@/utils/styles';
import NextImage from 'next/image';
import Link from 'next/link';
import { use } from 'react';

export default function DriverProfilePage({ params }: { params: Promise<{ number: string }> }) {
    const { number } = use(params);
    const driverNumber = Number(number);
    const { data: profile, loading, error } = useDriverProfile(driverNumber);

    if (loading) {
        return (
            <AppLayout>
                <div className='h-96 bg-zinc-900/40 border border-zinc-800/50 rounded-xl animate-pulse' />
            </AppLayout>
        );
    }

    if (error || !profile) {
        return (
            <AppLayout>
                <p className='text-sm text-zinc-400 p-4 border border-zinc-800 rounded-lg bg-zinc-950'>
                    {error || 'Driver not found.'}
                </p>
            </AppLayout>
        );
    }

    const teamColor = formatHexColor(profile.teamColor);

    return (
        <AppLayout>
            <div className='space-y-6'>
                <div
                    className='flex items-center gap-4 pb-4 border-b border-zinc-800/40'
                    style={{ borderLeft: `4px solid ${teamColor}`, paddingLeft: '1rem' }}
                >
                    {profile.headshotUrl && (
                        <div className='relative w-16 h-16 rounded-full border border-zinc-700 overflow-hidden bg-zinc-800 shrink-0'>
                            <NextImage
                                src={profile.headshotUrl}
                                alt={profile.driverName}
                                fill
                                unoptimized
                                className='object-cover'
                            />
                        </div>
                    )}
                    <div>
                        <span
                            className='text-[10px] font-bold tracking-widest uppercase'
                            style={{ color: teamColor }}
                        >
                            {profile.teamName}
                        </span>
                        <h1 className='text-3xl font-black text-white tracking-tight mt-0.5'>
                            {profile.driverName}
                        </h1>
                    </div>
                    <div className='ml-auto flex items-baseline gap-6'>
                        <div className='text-right'>
                            <p className='text-[10px] font-bold uppercase tracking-wider text-zinc-400'>
                                Position
                            </p>
                            <h2
                                className={`text-3xl font-mono font-bold ${getPositionColor(profile.currentPosition)}`}
                            >
                                P{profile.currentPosition}
                            </h2>
                        </div>
                        <div className='text-right'>
                            <p className='text-[10px] font-bold uppercase tracking-wider text-zinc-400'>
                                Points
                            </p>
                            <h2 className='text-3xl font-mono font-bold text-zinc-100'>
                                {profile.currentPoints}
                            </h2>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className='text-sm font-bold text-zinc-300 mb-3'>Season Results</h3>
                    <div className={TABLE_CONTAINER_CLASS}>
                        <table className='w-full text-left border-collapse text-sm'>
                            <thead>
                                <tr className={TABLE_THEAD_CLASS}>
                                    <th className='p-3 w-16 text-center'>Rd</th>
                                    <th className='p-3'>Race</th>
                                    <th className='p-3 text-center w-20'>Pos</th>
                                    <th className='p-3 text-right w-24'>Points</th>
                                    <th className='p-3 text-right w-28'>Cumulative</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-zinc-800/50'>
                                {profile.seasonResults.map((r) => (
                                    <tr
                                        key={r.meetingKey}
                                        className='hover:bg-zinc-800/20 transition-colors'
                                    >
                                        <td className='p-3 text-center font-mono text-zinc-400'>
                                            {r.round}
                                        </td>
                                        <td className='p-3 text-zinc-200'>
                                            <Link
                                                href={`/races/${r.meetingKey}`}
                                                className='hover:text-red-400 transition-colors'
                                            >
                                                {r.country}
                                            </Link>
                                        </td>
                                        <td
                                            className={`p-3 text-center font-bold ${getPositionColor(r.position ?? 99)}`}
                                        >
                                            {r.dsq
                                                ? 'DSQ'
                                                : r.dnf
                                                  ? 'DNF'
                                                  : r.dns
                                                    ? 'DNS'
                                                    : `P${r.position}`}
                                        </td>
                                        <td className='p-3 text-right font-mono text-zinc-300'>
                                            {r.roundPoints}
                                        </td>
                                        <td className='p-3 text-right font-mono font-bold text-zinc-100'>
                                            {r.cumulativePoints}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {profile.teammateH2H.length > 0 && (
                    <div>
                        <h3 className='text-sm font-bold text-zinc-300 mb-3'>Teammate H2H</h3>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                            {profile.teammateH2H.map((h2h) => (
                                <div
                                    key={h2h.teammateDriverNumber}
                                    className='bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center justify-between'
                                >
                                    <div>
                                        <p className='text-xs text-zinc-400'>
                                            vs {h2h.teammateName}
                                        </p>
                                        <p className='text-[10px] text-zinc-500 mt-0.5'>
                                            {h2h.roundsCompared} rounds compared
                                        </p>
                                    </div>
                                    <p className='text-2xl font-mono font-bold text-zinc-100'>
                                        {h2h.driverWins}–{h2h.teammateWins}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {profile.tyreTendencies.length > 0 && (
                    <div>
                        <h3 className='text-sm font-bold text-zinc-300 mb-3'>Tyre Usage</h3>
                        <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                            {profile.tyreTendencies.map((t) => (
                                <div
                                    key={t.compound}
                                    className='bg-zinc-950 border border-zinc-800 rounded-xl p-4'
                                >
                                    <p className='text-[10px] font-bold uppercase tracking-wider text-zinc-400'>
                                        {t.compound}
                                    </p>
                                    <p className='text-xl font-mono font-bold text-zinc-100 mt-1'>
                                        {t.stintCount} stints
                                    </p>
                                    <p className='text-xs text-zinc-400 mt-0.5'>
                                        avg {t.averageStintLength.toFixed(1)} laps
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
