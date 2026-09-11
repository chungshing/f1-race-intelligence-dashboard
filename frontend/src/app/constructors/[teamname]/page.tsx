'use client';

import AppLayout from '@/components/layout/AppLayout';
import { useConstructorProfile } from '@/hooks/useConstructorProfile';
import { formatHexColor } from '@/utils/sessions';
import { getPositionColor, TABLE_CONTAINER_CLASS, TABLE_THEAD_CLASS } from '@/utils/styles';
import Link from 'next/link';
import { use } from 'react';

export default function ConstructorProfilePage({
    params,
}: {
    params: Promise<{ teamname: string }>;
}) {
    const { teamname } = use(params);
    const teamName = decodeURIComponent(teamname);
    const { data: profile, loading, error } = useConstructorProfile(teamName);

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
                    {error || 'Team not found.'}
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
                    <div>
                        <span
                            className='text-[10px] font-bold tracking-widest uppercase'
                            style={{ color: teamColor }}
                        >
                            Constructor
                        </span>
                        <h1 className='text-3xl font-black text-white tracking-tight mt-0.5'>
                            {profile.teamName}
                        </h1>
                        <div className='flex gap-3 mt-1'>
                            {profile.drivers.map((d) => (
                                <Link
                                    key={d.driverNumber}
                                    href={`/drivers/${d.driverNumber}`}
                                    className='text-xs text-zinc-400 hover:text-red-400 transition-colors'
                                >
                                    {d.driverName}
                                </Link>
                            ))}
                        </div>
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
                                    <th className='p-3'>Drivers</th>
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
                                        <td className='p-3'>
                                            <div className='flex gap-3'>
                                                {r.driverBreakdown.map((d) => (
                                                    <span
                                                        key={d.driverNumber}
                                                        className='text-xs text-zinc-400'
                                                    >
                                                        {d.driverName}:{' '}
                                                        <span
                                                            className={getPositionColor(
                                                                d.position ?? 99
                                                            )}
                                                        >
                                                            {d.dsq
                                                                ? 'DSQ'
                                                                : d.dnf
                                                                  ? 'DNF'
                                                                  : d.dns
                                                                    ? 'DNS'
                                                                    : `P${d.position}`}
                                                        </span>
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className='p-3 text-right font-mono text-zinc-300'>
                                            {r.teamPoints}
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
            </div>
        </AppLayout>
    );
}
