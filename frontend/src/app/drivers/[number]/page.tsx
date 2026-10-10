'use client';

import AppLayout from '@/components/layout/AppLayout';
import { SeasonSection } from '@/components/dashboard/SeasonSection';
import { useDriverProfile } from '@/hooks/useDriverProfile';
import { formatHexColor } from '@/utils/sessions';
import { getPositionColor } from '@/utils/styles';
import NextImage from 'next/image';
import Link from 'next/link';
import { use } from 'react';

const compoundTone = (compound: string) => {
    const c = compound.toUpperCase();
    if (c.includes('SOFT')) return 'text-red-400';
    if (c.includes('MEDIUM')) return 'text-yellow-400';
    if (c.includes('HARD')) return 'text-zinc-200';
    if (c.includes('INTER')) return 'text-green-400';
    if (c.includes('WET')) return 'text-blue-400';
    return 'text-zinc-400';
};

const STAT_CARD = 'rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5';
const STAT_LABEL = 'text-[10px] font-bold uppercase tracking-wider text-zinc-400';
const STAT_VALUE = 'mt-1 font-mono text-3xl font-bold text-zinc-100';

export default function DriverProfilePage({ params }: { params: Promise<{ number: string }> }) {
    const { number } = use(params);
    const driverNumber = Number(number);
    const { data: profile, loading, error } = useDriverProfile(driverNumber);

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
                    {error || 'Driver not found.'}
                </p>
            </AppLayout>
        );
    }

    const teamColor = formatHexColor(profile.teamColor);

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
                            <div
                                className='relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border sm:h-32 sm:w-32'
                                style={{
                                    borderColor: `${teamColor}59`,
                                    backgroundColor: `${teamColor}1F`,
                                }}
                            >
                                <span
                                    className='absolute bottom-0 right-1.5 select-none font-mono text-6xl font-medium leading-none'
                                    style={{ color: `${teamColor}47` }}
                                >
                                    {profile.driverNumber}
                                </span>
                                {profile.headshotUrl && (
                                    <NextImage
                                        src={profile.headshotUrl}
                                        alt={profile.driverName}
                                        fill
                                        sizes='128px'
                                        className='object-cover object-top'
                                    />
                                )}
                            </div>
                            <div className='min-w-0'>
                                <Link
                                    href={`/constructors/${encodeURIComponent(profile.teamName)}`}
                                    className='inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest transition-opacity hover:opacity-80'
                                    style={{ color: teamColor }}
                                >
                                    <span
                                        className='h-1.5 w-1.5 rounded-full'
                                        style={{ backgroundColor: teamColor }}
                                    />
                                    {profile.teamName}
                                </Link>
                                <h1 className='mt-1 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl'>
                                    {profile.driverName}
                                </h1>
                                <p className='mt-1.5 font-mono text-xs text-zinc-400'>
                                    #{profile.driverNumber}
                                </p>
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

                    <div className='col-span-2 space-y-3 lg:col-span-1'>
                        {profile.teammateH2H.map((h2h) => {
                            const total = h2h.driverWins + h2h.teammateWins;
                            const driverShare = total > 0 ? (h2h.driverWins / total) * 100 : 50;
                            return (
                                <div key={h2h.teammateDriverNumber} className={STAT_CARD}>
                                    <div className='flex items-baseline justify-between gap-2'>
                                        <p className={`${STAT_LABEL} truncate`}>
                                            vs {h2h.teammateName}
                                        </p>
                                        <p className='shrink-0 text-[10px] text-zinc-400'>
                                            {h2h.roundsCompared} races
                                        </p>
                                    </div>
                                    <h2 className={STAT_VALUE}>
                                        {h2h.driverWins}–{h2h.teammateWins}
                                    </h2>
                                    <div className='mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full'>
                                        <div
                                            style={{
                                                width: `${driverShare}%`,
                                                backgroundColor: teamColor,
                                            }}
                                        />
                                        <div className='flex-1 bg-zinc-700' />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <SeasonSection results={profile.seasonResults} teamColor={profile.teamColor} />

                {profile.tyreTendencies.length > 0 && (
                    <div>
                        <h3 className='mb-3 text-[11px] font-bold uppercase tracking-widest text-zinc-400'>
                            Tyre usage
                        </h3>
                        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
                            {profile.tyreTendencies.map((t) => (
                                <div key={t.compound} className={STAT_CARD}>
                                    <p
                                        className={`text-[10px] font-bold uppercase tracking-wider ${compoundTone(
                                            t.compound
                                        )}`}
                                    >
                                        {t.compound}
                                    </p>
                                    <p className='mt-1 font-mono text-xl font-bold text-zinc-100'>
                                        {t.stintCount} stints
                                    </p>
                                    <p className='mt-0.5 text-xs text-zinc-400'>
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