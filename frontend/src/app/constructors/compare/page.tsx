'use client';

import AppLayout from '@/components/layout/AppLayout';
import { TeamComparisonChart } from '@/components/dashboard/TeamComparisonChart';
import { useConstructorComparison } from '@/hooks/useConstructorComparison';
import { usePageTitle } from '@/hooks/usePageTitle';
import { DriverContribution } from '@/lib/constructorProfile';
import { formatHexColor } from '@/utils/sessions';
import { getPositionColor, TABLE_CONTAINER_CLASS, TABLE_THEAD_CLASS } from '@/utils/styles';
import Link from 'next/link';
import { useState } from 'react';

const PLACEHOLDER_TEAMS = new Set(['', 'Unknown']);

function lastName(name: string): string {
    return name.split(' ').pop() ?? name;
}

function finishLabel(d: DriverContribution): string {
    if (d.dsq) return 'DSQ';
    if (d.dnf) return 'DNF';
    if (d.dns) return 'DNS';
    return d.position === null ? '—' : `P${d.position}`;
}

function finishClass(d: DriverContribution): string {
    if (d.dsq) return 'text-red-500';
    if (d.dnf) return 'text-zinc-400';
    if (d.dns) return 'text-amber-500';
    return d.position === null ? 'text-zinc-500' : getPositionColor(d.position);
}

function Finishes({ drivers }: { drivers: DriverContribution[] }) {
    if (drivers.length === 0) return <span className='text-zinc-500'>—</span>;
    return (
        <div className='flex flex-col items-center gap-0.5'>
            {drivers.map((d) => (
                <span key={d.driverNumber} className='text-xs whitespace-nowrap'>
                    <span className='text-zinc-500'>{lastName(d.driverName)} </span>
                    <span className={`font-bold ${finishClass(d)}`}>{finishLabel(d)}</span>
                </span>
            ))}
        </div>
    );
}

function TeamPickerRow({
    label,
    teams,
    selected,
    otherSelected,
    onSelect,
}: {
    label: string;
    teams: { teamName: string; teamColor: string }[];
    selected: string | null;
    otherSelected: string | null;
    onSelect: (name: string) => void;
}) {
    return (
        <div>
            <h4 className='text-[10px] font-bold text-zinc-400 tracking-widest uppercase mb-2'>
                {label}
            </h4>
            <div className='flex flex-wrap gap-1.5'>
                {teams.map((t) => {
                    const isSelected = selected === t.teamName;
                    const isDisabled = otherSelected === t.teamName;
                    return (
                        <button
                            key={t.teamName}
                            disabled={isDisabled}
                            onClick={() => onSelect(t.teamName)}
                            className={`min-h-9 px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap border ${
                                isSelected
                                    ? 'bg-zinc-800 text-zinc-100 font-bold border-zinc-700'
                                    : isDisabled
                                      ? 'text-zinc-700 border-zinc-900 cursor-not-allowed'
                                      : 'text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-900/50'
                            }`}
                        >
                            <span
                                className='w-1.5 h-1.5 rounded-full shrink-0'
                                style={{ backgroundColor: formatHexColor(t.teamColor) }}
                            />
                            {t.teamName}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function StatRow({
    label,
    a,
    b,
    lowerIsBetter = false,
    decimals = 0,
    unit = '',
}: {
    label: string;
    a: number | null;
    b: number | null;
    lowerIsBetter?: boolean;
    decimals?: number;
    unit?: string;
}) {
    const fmt = (v: number | null) => (v === null ? '—' : `${v.toFixed(decimals)}${unit}`);
    const aWins = a !== null && b !== null && a !== b && (lowerIsBetter ? a < b : a > b);
    const bWins = a !== null && b !== null && a !== b && (lowerIsBetter ? b < a : b > a);

    return (
        <div className='grid grid-cols-3 items-center py-2 border-b border-zinc-900 last:border-0'>
            <span
                className={`text-right font-mono text-sm ${aWins ? 'text-emerald-400 font-bold' : 'text-zinc-300'}`}
            >
                {fmt(a)}
            </span>
            <span className='text-center text-[10px] text-zinc-500 uppercase tracking-wider'>
                {label}
            </span>
            <span
                className={`text-left font-mono text-sm ${bWins ? 'text-emerald-400 font-bold' : 'text-zinc-300'}`}
            >
                {fmt(b)}
            </span>
        </div>
    );
}

function ChartSection({
    title,
    children,
    className = 'border-b border-zinc-900',
}: {
    title: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`p-4 min-w-0 ${className}`}>
            <h3 className='text-[10px] font-bold text-zinc-400 tracking-widest uppercase mb-2'>
                {title}
            </h3>
            {children}
        </div>
    );
}

export default function ConstructorComparePage() {
    usePageTitle('Compare Constructors');
    const [teamA, setTeamA] = useState<string | null>(null);
    const [teamB, setTeamB] = useState<string | null>(null);
    const { data, allTeams, loading, error } = useConstructorComparison(teamA, teamB);

    const teams = allTeams.filter((t) => !PLACEHOLDER_TEAMS.has(t.teamName));

    return (
        <AppLayout>
            <div className='space-y-6'>
                <div className='mb-2 border-b border-zinc-800/40 pb-4'>
                    <h1 className='text-2xl font-bold text-zinc-100'>Constructor Comparison</h1>
                    <p className='text-xs text-zinc-400 mt-1'>
                        Pick any two teams to compare their season head-to-head.
                    </p>
                </div>

                {error && <p className='text-sm text-red-400'>{error}</p>}

                {loading ? (
                    <div className='h-24 bg-zinc-900/40 border border-zinc-800/50 rounded-xl animate-pulse' />
                ) : (
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                        <TeamPickerRow
                            label='Team A'
                            teams={teams}
                            selected={teamA}
                            otherSelected={teamB}
                            onSelect={setTeamA}
                        />
                        <TeamPickerRow
                            label='Team B'
                            teams={teams}
                            selected={teamB}
                            otherSelected={teamA}
                            onSelect={setTeamB}
                        />
                    </div>
                )}

                {!data && !loading && teamA !== null && teamB !== null && (
                    <p className='text-sm text-zinc-500'>No race data for these teams.</p>
                )}

                {data && (
                    <div className={TABLE_CONTAINER_CLASS}>
                        <div className='flex items-center justify-center gap-7 py-5 border-b border-zinc-900'>
                            <div className='text-center'>
                                <span
                                    className='block w-8 h-1 rounded-full mx-auto mb-2'
                                    style={{
                                        backgroundColor: formatHexColor(data.teamA.teamColor),
                                    }}
                                />
                                <Link
                                    href={`/constructors/${encodeURIComponent(data.teamA.teamName)}`}
                                    className='text-sm font-bold text-zinc-100 hover:text-red-400 transition-colors'
                                >
                                    {data.teamA.teamName}
                                </Link>
                                <p className='text-[10px] text-zinc-500'>P{data.teamA.position}</p>
                            </div>
                            <div className='text-center'>
                                <h2 className='text-3xl font-mono font-bold text-zinc-100'>
                                    {data.summary.pointsRoundsWon[0]}–
                                    {data.summary.pointsRoundsWon[1]}
                                </h2>
                                <p className='text-[10px] text-zinc-500 uppercase tracking-wider'>
                                    {data.summary.roundsCompared} rounds
                                </p>
                            </div>
                            <div className='text-center'>
                                <span
                                    className='block w-8 h-1 rounded-full mx-auto mb-2'
                                    style={{
                                        backgroundColor: formatHexColor(data.teamB.teamColor),
                                    }}
                                />
                                <Link
                                    href={`/constructors/${encodeURIComponent(data.teamB.teamName)}`}
                                    className='text-sm font-bold text-zinc-100 hover:text-red-400 transition-colors'
                                >
                                    {data.teamB.teamName}
                                </Link>
                                <p className='text-[10px] text-zinc-500'>P{data.teamB.position}</p>
                            </div>
                        </div>

                        <div className='px-6 py-3 border-b border-zinc-900'>
                            <StatRow
                                label='Points'
                                a={data.summary.points[0]}
                                b={data.summary.points[1]}
                            />
                            <StatRow
                                label='Wins'
                                a={data.summary.wins[0]}
                                b={data.summary.wins[1]}
                            />
                            <StatRow
                                label='Podiums'
                                a={data.summary.podiums[0]}
                                b={data.summary.podiums[1]}
                            />
                            <StatRow
                                label='DNFs'
                                a={data.summary.dnfs[0]}
                                b={data.summary.dnfs[1]}
                                lowerIsBetter
                            />
                            <StatRow
                                label='Avg quali gap to pole'
                                a={data.summary.avgQualiGap[0]}
                                b={data.summary.avgQualiGap[1]}
                                lowerIsBetter
                                decimals={3}
                                unit='s'
                            />
                            <StatRow
                                label='Median pit lane time'
                                a={data.summary.medianPit[0]}
                                b={data.summary.medianPit[1]}
                                lowerIsBetter
                                decimals={2}
                                unit='s'
                            />
                        </div>

                        <ChartSection title='Cumulative Points'>
                            <TeamComparisonChart
                                data={data.rounds}
                                keyA='aCumulative'
                                keyB='bCumulative'
                                nameA={data.teamA.teamName}
                                nameB={data.teamB.teamName}
                                colorA={data.teamA.teamColor}
                                colorB={data.teamB.teamColor}
                            />
                        </ChartSection>

                        <div className='grid grid-cols-1 sm:grid-cols-2 border-b border-zinc-900'>
                            <ChartSection
                                title='Qualifying Gap to Pole (s)'
                                className='border-b sm:border-b-0 sm:border-r border-zinc-900'
                            >
                                <TeamComparisonChart
                                    data={data.rounds}
                                    keyA='aQualiGap'
                                    keyB='bQualiGap'
                                    nameA={data.teamA.teamName}
                                    nameB={data.teamB.teamName}
                                    colorA={data.teamA.teamColor}
                                    colorB={data.teamB.teamColor}
                                    decimals={3}
                                    unit='s'
                                />
                            </ChartSection>
                            <ChartSection title='Median Pit Lane Time (s)' className=''>
                                <TeamComparisonChart
                                    data={data.rounds}
                                    keyA='aPit'
                                    keyB='bPit'
                                    nameA={data.teamA.teamName}
                                    nameB={data.teamB.teamName}
                                    colorA={data.teamA.teamColor}
                                    colorB={data.teamB.teamColor}
                                    decimals={2}
                                    unit='s'
                                />
                            </ChartSection>
                        </div>

                        <div className='overflow-x-auto'>
                            <table className='w-full min-w-140 text-left border-collapse text-sm'>
                                <thead>
                                    <tr className={TABLE_THEAD_CLASS}>
                                        <th className='p-3 w-12 text-center'>Rd</th>
                                        <th className='p-3'>Race</th>
                                        <th className='p-3 text-center'>{data.teamA.teamName}</th>
                                        <th className='p-3 text-right w-14'>Pts</th>
                                        <th className='p-3 text-center'>{data.teamB.teamName}</th>
                                        <th className='p-3 text-right w-14'>Pts</th>
                                        <th className='p-3 text-right w-28'>Gap</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-zinc-800/50'>
                                    {data.rounds.map((r) => {
                                        const diff = r.aPoints - r.bPoints;
                                        return (
                                            <tr
                                                key={r.meetingKey}
                                                className='hover:bg-zinc-800/20 transition-colors'
                                            >
                                                <td className='p-3 text-center font-mono text-zinc-500'>
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
                                                <td className='p-3 text-center'>
                                                    <Finishes drivers={r.aDrivers} />
                                                </td>
                                                <td className='p-3 text-right font-mono font-bold text-zinc-200'>
                                                    {r.aPoints}
                                                </td>
                                                <td className='p-3 text-center'>
                                                    <Finishes drivers={r.bDrivers} />
                                                </td>
                                                <td className='p-3 text-right font-mono font-bold text-zinc-200'>
                                                    {r.bPoints}
                                                </td>
                                                <td className='p-3 text-right font-mono'>
                                                    {diff === 0 ? (
                                                        <span className='text-zinc-500'>—</span>
                                                    ) : (
                                                        <span
                                                            className={
                                                                diff > 0
                                                                    ? 'text-emerald-400'
                                                                    : 'text-amber-400'
                                                            }
                                                        >
                                                            +{Math.abs(diff)}{' '}
                                                            {diff > 0
                                                                ? data.teamA.teamName
                                                                : data.teamB.teamName}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
