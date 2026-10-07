'use client';

import { ComparisonPointsChart } from '@/components/dashboard/ComparisonPointsChart';
import AppLayout from '@/components/layout/AppLayout';
import { useDriverComparison } from '@/hooks/useDriverComparison';
import { formatHexColor } from '@/utils/sessions';
import { getPositionColor, TABLE_CONTAINER_CLASS, TABLE_THEAD_CLASS } from '@/utils/styles';
import NextImage from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

function DriverPickerRow({
    label,
    drivers,
    selected,
    otherSelected,
    onSelect,
}: {
    label: string;
    drivers: { driverNumber: number; driverName: string; teamName: string; teamColor: string }[];
    selected: number | null;
    otherSelected: number | null;
    onSelect: (num: number) => void;
}) {
    return (
        <div>
            <h4 className='text-[10px] font-bold text-zinc-400 tracking-widest uppercase mb-2'>
                {label}
            </h4>
            <div className='flex flex-wrap gap-1.5'>
                {drivers.map((d) => {
                    const isSelected = selected === d.driverNumber;
                    const isDisabled = otherSelected === d.driverNumber;
                    return (
                        <button
                            key={d.driverNumber}
                            disabled={isDisabled}
                            onClick={() => onSelect(d.driverNumber)}
                            className={`px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap border ${
                                isSelected
                                    ? 'bg-zinc-800 text-zinc-100 font-bold border-zinc-700'
                                    : isDisabled
                                      ? 'text-zinc-700 border-zinc-900 cursor-not-allowed'
                                      : 'text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-900/50'
                            }`}
                        >
                            <span
                                className='w-1.5 h-1.5 rounded-full shrink-0'
                                style={{ backgroundColor: formatHexColor(d.teamColor) }}
                            />
                            {d.driverName}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function DriverComparePage() {
    const [driverA, setDriverA] = useState<number | null>(null);
    const [driverB, setDriverB] = useState<number | null>(null);
    const { data: comparison, allDrivers, loading } = useDriverComparison(driverA, driverB);

    return (
        <AppLayout>
            <div className='space-y-6'>
                <div className='mb-2 border-b border-zinc-800/40 pb-4'>
                    <h1 className='text-2xl font-bold text-zinc-100'>Driver Comparison</h1>
                    <p className='text-xs text-zinc-400 mt-1'>
                        Pick any two drivers to compare their season head-to-head.
                    </p>
                </div>

                {loading ? (
                    <div className='h-24 bg-zinc-900/40 border border-zinc-800/50 rounded-xl animate-pulse' />
                ) : (
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                        <DriverPickerRow
                            label='Driver A'
                            drivers={allDrivers}
                            selected={driverA}
                            otherSelected={driverB}
                            onSelect={setDriverA}
                        />
                        <DriverPickerRow
                            label='Driver B'
                            drivers={allDrivers}
                            selected={driverB}
                            otherSelected={driverA}
                            onSelect={setDriverB}
                        />
                    </div>
                )}

                {!comparison && driverA !== null && driverB !== null && (
                    <p className='text-sm text-zinc-500'>
                        No shared race data between these drivers.
                    </p>
                )}

                {comparison && (
                    <div className={TABLE_CONTAINER_CLASS}>
                        <div className='flex items-center justify-center gap-7 py-5 border-b border-zinc-900'>
                            <div className='text-center'>
                                {comparison.driverA.headshotUrl && (
                                    <div
                                        className='relative w-12 h-12 rounded-full overflow-hidden bg-zinc-800 mx-auto mb-2'
                                        style={{
                                            border: `2px solid ${formatHexColor(comparison.driverA.teamColor)}`,
                                        }}
                                    >
                                        <NextImage
                                            src={comparison.driverA.headshotUrl}
                                            alt={comparison.driverA.driverName}
                                            fill
                                            sizes='48px'
                                            className='object-cover'
                                        />
                                    </div>
                                )}
                                <Link
                                    href={`/drivers/${comparison.driverA.driverNumber}`}
                                    className='text-sm font-bold text-zinc-100 hover:text-red-400 transition-colors'
                                >
                                    {comparison.driverA.driverName}
                                </Link>
                                <p className='text-[10px] text-zinc-500'>
                                    {comparison.driverA.teamName}
                                </p>
                            </div>
                            <div className='text-center'>
                                <h2 className='text-3xl font-mono font-bold text-zinc-100'>
                                    {comparison.driverAWins}–{comparison.driverBWins}
                                </h2>
                                <p className='text-[10px] text-zinc-500 uppercase tracking-wider'>
                                    {comparison.roundsCompared} rounds
                                </p>
                            </div>
                            <div className='text-center'>
                                {comparison.driverB.headshotUrl && (
                                    <div
                                        className='relative w-12 h-12 rounded-full overflow-hidden bg-zinc-800 mx-auto mb-2'
                                        style={{
                                            border: `2px solid ${formatHexColor(comparison.driverB.teamColor)}`,
                                        }}
                                    >
                                        <NextImage
                                            src={comparison.driverB.headshotUrl}
                                            alt={comparison.driverB.driverName}
                                            fill
                                            sizes='48px'
                                            className='object-cover'
                                        />
                                    </div>
                                )}
                                <Link
                                    href={`/drivers/${comparison.driverB.driverNumber}`}
                                    className='text-sm font-bold text-zinc-100 hover:text-red-400 transition-colors'
                                >
                                    {comparison.driverB.driverName}
                                </Link>
                                <p className='text-[10px] text-zinc-500'>
                                    {comparison.driverB.teamName}
                                </p>
                            </div>
                        </div>

                        <div className='p-4 border-b border-zinc-900'>
                            <div className='flex items-center justify-between mb-2'>
                                <h3 className='text-[10px] font-bold text-zinc-400 tracking-widest uppercase'>
                                    Cumulative Points
                                </h3>
                                <div className='flex items-center gap-4 text-[11px] text-zinc-400'>
                                    <span className='flex items-center gap-1.5'>
                                        <span
                                            className='w-2 h-2 rounded-sm'
                                            style={{
                                                backgroundColor: formatHexColor(
                                                    comparison.driverA.teamColor
                                                ),
                                            }}
                                        />
                                        {comparison.driverA.driverName.split(' ').pop()}{' '}
                                        {comparison.driverATotalPoints}
                                    </span>
                                    <span className='flex items-center gap-1.5'>
                                        <span
                                            className='w-2 h-2 rounded-sm'
                                            style={{
                                                backgroundColor: formatHexColor(
                                                    comparison.driverB.teamColor
                                                ),
                                            }}
                                        />
                                        {comparison.driverB.driverName.split(' ').pop()}{' '}
                                        {comparison.driverBTotalPoints}
                                    </span>
                                </div>
                            </div>
                            <ComparisonPointsChart
                                rounds={comparison.rounds}
                                driverAName={comparison.driverA.driverName}
                                driverBName={comparison.driverB.driverName}
                                driverAColor={comparison.driverA.teamColor}
                                driverBColor={comparison.driverB.teamColor}
                            />
                        </div>

                        <table className='w-full text-left border-collapse text-sm'>
                            <thead>
                                <tr className={TABLE_THEAD_CLASS}>
                                    <th className='p-3 w-16 text-center'>Rd</th>
                                    <th className='p-3'>Race</th>
                                    <th className='p-3 text-center w-24'>
                                        {comparison.driverA.driverName.split(' ').pop()}
                                    </th>
                                    <th className='p-3 text-center w-24'>
                                        {comparison.driverB.driverName.split(' ').pop()}
                                    </th>
                                    <th className='p-3 text-right w-24'>Gap</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-zinc-800/50'>
                                {comparison.rounds.map((r) => (
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
                                        <td
                                            className={`p-3 text-center font-bold ${getPositionColor(r.driverAPosition ?? 99)}`}
                                        >
                                            {r.driverAOut ? 'DNF' : `P${r.driverAPosition}`}
                                        </td>
                                        <td
                                            className={`p-3 text-center font-bold ${getPositionColor(r.driverBPosition ?? 99)}`}
                                        >
                                            {r.driverBOut ? 'DNF' : `P${r.driverBPosition}`}
                                        </td>
                                        <td className='p-3 text-right font-mono'>
                                            {r.pointsLeader === null ? (
                                                <span className='text-zinc-600'>—</span>
                                            ) : (
                                                <span
                                                    className={
                                                        r.pointsLeader === 'A'
                                                            ? 'text-emerald-400'
                                                            : 'text-amber-400'
                                                    }
                                                >
                                                    +{r.pointsGap}{' '}
                                                    {r.pointsLeader === 'A'
                                                        ? comparison.driverA.driverName
                                                              .split(' ')
                                                              .pop()
                                                        : comparison.driverB.driverName
                                                              .split(' ')
                                                              .pop()}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
