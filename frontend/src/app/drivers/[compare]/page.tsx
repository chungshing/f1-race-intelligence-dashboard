'use client';

import AppLayout from '@/components/layout/AppLayout';
import { useDriverComparison } from '@/hooks/useDriverComparison';
import { formatHexColor } from '@/utils/sessions';
import { getPositionColor, TABLE_CONTAINER_CLASS, TABLE_THEAD_CLASS } from '@/utils/styles';
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
    drivers: { driverNumber: number; driverName: string; teamColor: string }[];
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
                    <>
                        <div className='flex items-center justify-center gap-8 py-4'>
                            <div className='text-center'>
                                <Link
                                    href={`/drivers/${comparison.driverA.driverNumber}`}
                                    className='text-lg font-black text-zinc-100 hover:text-red-400 transition-colors'
                                >
                                    {comparison.driverA.driverName}
                                </Link>
                                <p className='text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5'>
                                    {comparison.driverA.teamName}
                                </p>
                            </div>
                            <div className='text-center'>
                                <h2 className='text-4xl font-mono font-black text-zinc-100'>
                                    {comparison.driverAWins}–{comparison.driverBWins}
                                </h2>
                                <p className='text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5'>
                                    {comparison.roundsCompared} rounds
                                </p>
                            </div>
                            <div className='text-center'>
                                <Link
                                    href={`/drivers/${comparison.driverB.driverNumber}`}
                                    className='text-lg font-black text-zinc-100 hover:text-red-400 transition-colors'
                                >
                                    {comparison.driverB.driverName}
                                </Link>
                                <p className='text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5'>
                                    {comparison.driverB.teamName}
                                </p>
                            </div>
                        </div>

                        <div className='grid grid-cols-2 gap-4'>
                            <div className='bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3.5 text-center'>
                                <p className='text-[10px] font-bold uppercase tracking-wider text-zinc-400'>
                                    {comparison.driverA.driverName.split(' ').pop()} Points
                                </p>
                                <h2 className='text-3xl font-mono font-bold text-zinc-100 mt-1'>
                                    {comparison.driverATotalPoints}
                                </h2>
                            </div>
                            <div className='bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3.5 text-center'>
                                <p className='text-[10px] font-bold uppercase tracking-wider text-zinc-400'>
                                    {comparison.driverB.driverName.split(' ').pop()} Points
                                </p>
                                <h2 className='text-3xl font-mono font-bold text-zinc-100 mt-1'>
                                    {comparison.driverBTotalPoints}
                                </h2>
                            </div>
                        </div>

                        <div>
                            <h3 className='text-sm font-bold text-zinc-300 mb-3'>Round by Round</h3>
                            <div className={TABLE_CONTAINER_CLASS}>
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
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
