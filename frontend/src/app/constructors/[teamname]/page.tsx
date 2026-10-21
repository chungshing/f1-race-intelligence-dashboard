'use client';

import AppLayout from '@/components/layout/AppLayout';
import { ConstructorSeasonSection } from '@/components/dashboard/ConstructorSeasonSection';
import { useConstructorProfile } from '@/hooks/useConstructorProfile';
import { driverColorMap } from '@/utils/seasonCells';
import { formatHexColor } from '@/utils/sessions';
import { getPositionColor } from '@/utils/styles';
import NextImage from 'next/image';
import Link from 'next/link';
import { use } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ConstructorPitStops } from '@/components/dashboard/ConstructorPitStops';

const STAT_CARD = 'rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5';
const STAT_LABEL = 'text-[10px] font-bold uppercase tracking-wider text-zinc-400';
const STAT_VALUE = 'mt-1 font-mono text-3xl font-bold text-zinc-100';

export default function ConstructorProfilePage({
    params,
}: {
    params: Promise<{ teamname: string }>;
}) {
    const { teamname } = use(params);
    const teamName = decodeURIComponent(teamname);
    const { data: profile, loading, error } = useConstructorProfile(teamName);
    usePageTitle(teamName);

    if (loading) {
        return (
            <AppLayout>
                <div className='h-96 animate-pulse rounded-xl border border-zinc-800/50 bg-zinc-900/40' />
            </AppLayout>
        );
    }

    if (error || !profile) {
        return (
            <AppLayout>
                <p className='rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400'>
                    {error || 'Team not found.'}
                </p>
            </AppLayout>
        );
    }

    const teamColor = formatHexColor(profile.teamColor);
    const colors = driverColorMap(profile.drivers);
    const contributionTotal = profile.driverContributions.reduce(
        (sum, c) => sum + c.totalPoints,
        0
    );

    return (
        <AppLayout>
            <div className='space-y-4'>
                <div
                    className='overflow-hidden rounded-xl border border-zinc-800'
                    style={{
                        background: `linear-gradient(90deg, ${teamColor}1A, transparent 60%)`,
                    }}
                >
                    <div className='flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between'>
                        <div className='flex min-w-0 items-center gap-5'>
                            <div className='flex shrink-0 gap-2.5'>
                                {profile.drivers.map((d) => (
                                    <Link
                                        key={d.driverNumber}
                                        href={`/drivers/${d.driverNumber}`}
                                        className='group text-center'
                                    >
                                        <div
                                            className='relative h-20 w-20 overflow-hidden rounded-xl border sm:h-22 sm:w-22'
                                            style={{
                                                borderColor: `${teamColor}59`,
                                                backgroundColor: `${teamColor}1F`,
                                            }}
                                        >
                                            <span
                                                className='absolute bottom-0 right-1 select-none font-mono text-4xl font-medium leading-none'
                                                style={{ color: `${teamColor}47` }}
                                            >
                                                {d.driverNumber}
                                            </span>
                                            {d.headshotUrl && (
                                                <NextImage
                                                    src={d.headshotUrl}
                                                    alt={d.driverName}
                                                    fill
                                                    sizes='88px'
                                                    className='object-cover object-top'
                                                />
                                            )}
                                        </div>
                                        <p className='mt-1.5 max-w-20 truncate text-[11px] text-zinc-400 transition-colors group-hover:text-red-400 sm:max-w-22'>
                                            {d.driverName.split(' ').pop()}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                            <div className='min-w-0'>
                                <span
                                    className='text-[11px] font-bold uppercase tracking-widest'
                                    style={{ color: teamColor }}
                                >
                                    Constructor
                                </span>
                                <h1 className='mt-1 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl'>
                                    {profile.teamName}
                                </h1>
                            </div>
                        </div>

                        <div className='flex gap-7 sm:text-right'>
                            <div>
                                <p className={STAT_LABEL}>Position</p>
                                <p
                                    className={`mt-0.5 font-mono text-4xl font-bold leading-none ${getPositionColor(
                                        profile.currentPosition
                                    )}`}
                                >
                                    P{profile.currentPosition}
                                </p>
                            </div>
                            <div>
                                <p className={STAT_LABEL}>Points</p>
                                <p className='mt-0.5 font-mono text-4xl font-bold leading-none text-zinc-100'>
                                    {profile.currentPoints}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='grid grid-cols-2 gap-3 lg:grid-cols-[repeat(4,1fr)_2fr]'>
                    <div className={STAT_CARD}>
                        <p className={STAT_LABEL}>Wins</p>
                        <h2 className={STAT_VALUE}>{profile.stats.wins}</h2>
                    </div>
                    <div className={STAT_CARD}>
                        <p className={STAT_LABEL}>Podiums</p>
                        <h2 className={STAT_VALUE}>{profile.stats.podiums}</h2>
                    </div>
                    <div className={STAT_CARD}>
                        <p className={STAT_LABEL}>DNFs</p>
                        <h2 className={STAT_VALUE}>{profile.stats.dnfCount}</h2>
                    </div>
                    <div className={STAT_CARD}>
                        <p className={STAT_LABEL}>Best finish</p>
                        <h2 className={STAT_VALUE}>
                            {profile.stats.bestFinish !== null
                                ? `P${profile.stats.bestFinish}`
                                : '—'}
                        </h2>
                    </div>

                    <div className={`${STAT_CARD} col-span-2 lg:col-span-1`}>
                        <p className={STAT_LABEL}>Points contribution</p>
                        <div className='my-3 flex h-1.5 gap-0.5 overflow-hidden rounded-full'>
                            {profile.driverContributions.map((c) => (
                                <div
                                    key={c.driverNumber}
                                    style={{
                                        width: `${
                                            contributionTotal > 0
                                                ? (c.totalPoints / contributionTotal) * 100
                                                : 100 / profile.driverContributions.length
                                        }%`,
                                        backgroundColor: colors.get(c.driverNumber) ?? teamColor,
                                    }}
                                />
                            ))}
                        </div>
                        <div className='flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-zinc-300'>
                            {profile.driverContributions.map((c) => (
                                <span key={c.driverNumber} className='flex items-center gap-1.5'>
                                    <span
                                        className='h-1.75 w-1.75 rounded-sm'
                                        style={{
                                            backgroundColor:
                                                colors.get(c.driverNumber) ?? teamColor,
                                        }}
                                    />
                                    {c.driverName.split(' ').pop()}
                                    <b className='font-mono font-bold text-zinc-100'>
                                        {c.totalPoints}
                                    </b>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <ConstructorSeasonSection
                    results={profile.seasonResults}
                    drivers={profile.drivers}
                />
                <ConstructorPitStops summary={profile.pitStops} teamColor={teamColor} />
            </div>
        </AppLayout>
    );
}
