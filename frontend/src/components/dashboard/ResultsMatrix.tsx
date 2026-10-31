'use client';

import { MatrixCell, ResultsMatrix as ResultsMatrixData } from '@/lib/resultsMatrix';
import { TABLE_CONTAINER_CLASS } from '@/utils/styles';
import { LayoutGrid } from 'lucide-react';

function toHex(color: string) {
    return color.startsWith('#') ? color : `#${color}`;
}

function cellClass(cell: MatrixCell | null) {
    if (!cell) return 'text-zinc-700';
    if (cell.status === 'DNS') return 'bg-amber-500/15 text-amber-400';
    if (cell.status) return 'bg-red-500/15 text-red-400';

    const position = cell.position;
    if (position === 1) return 'bg-yellow-400/20 text-yellow-300 font-bold';
    if (position === 2) return 'bg-zinc-300/15 text-zinc-200 font-bold';
    if (position === 3) return 'bg-amber-700/25 text-amber-500 font-bold';
    if (position != null && position <= 10) return 'bg-emerald-500/10 text-emerald-400';
    return 'text-zinc-400';
}

function cellLabel(cell: MatrixCell | null) {
    if (!cell) return '·';
    return cell.status ?? cell.position ?? '—';
}

const LEGEND = [
    { label: 'Win', className: 'bg-yellow-400/20 text-yellow-300' },
    { label: 'P2', className: 'bg-zinc-300/15 text-zinc-200' },
    { label: 'P3', className: 'bg-amber-700/25 text-amber-500' },
    { label: 'Points', className: 'bg-emerald-500/10 text-emerald-400' },
    { label: 'No points', className: 'bg-zinc-900 text-zinc-400' },
    { label: 'DNF/DSQ', className: 'bg-red-500/15 text-red-400' },
];

export function ResultsMatrix({ matrix }: { matrix: ResultsMatrixData }) {
    if (matrix.rounds.length === 0 || matrix.rows.length === 0) return null;

    return (
        <div className={TABLE_CONTAINER_CLASS}>
            <div className='p-4 pl-5 border-b border-zinc-900 bg-zinc-900/20 flex items-center gap-2'>
                <LayoutGrid className='w-4 h-4 text-zinc-400' />
                <h3 className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>
                    Season Results
                </h3>
                <span className='text-[10px] font-medium text-zinc-400'>
                    Race finishing positions
                </span>
            </div>

            <div className='overflow-x-auto'>
                <table className='border-separate border-spacing-0 text-xs'>
                    <thead>
                        <tr>
                            <th className='sticky left-0 z-10 bg-zinc-950 py-2 px-4 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-wider min-w-44'>
                                Driver
                            </th>
                            {matrix.rounds.map((round) => (
                                <th
                                    key={round.meetingKey}
                                    title={`Round ${round.round}: ${round.country}`}
                                    className='px-0.5 pb-2 align-bottom'
                                >
                                    <span
                                        className='block mx-auto h-24 text-[10px] font-semibold text-zinc-400 whitespace-nowrap'
                                        style={{
                                            writingMode: 'vertical-rl',
                                            transform: 'rotate(180deg)',
                                        }}
                                    >
                                        {round.country}
                                    </span>
                                </th>
                            ))}
                            <th className='py-2 px-4 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-wider'>
                                Pts
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {matrix.rows.map((row) => (
                            <tr key={row.driverNumber} className='group'>
                                <td className='sticky left-0 z-10 bg-zinc-950 py-1 px-4 border-t border-zinc-900'>
                                    <div className='flex items-center gap-2.5 min-w-0'>
                                        <span
                                            className='w-1 h-4 rounded-full shrink-0'
                                            style={{ backgroundColor: toHex(row.teamColor) }}
                                        />
                                        <span className='font-semibold text-zinc-200 truncate'>
                                            {row.name}
                                        </span>
                                    </div>
                                </td>
                                {row.cells.map((cell, index) => {
                                    const round = matrix.rounds[index];
                                    const sprint =
                                        cell?.sprintPosition != null
                                            ? ` · Sprint P${cell.sprintPosition}`
                                            : '';
                                    return (
                                        <td
                                            key={round.meetingKey}
                                            title={`${row.name}, ${round.country}: ${cell ? (cell.status ?? `P${cell.position}`) : 'did not take part'}${sprint}`}
                                            className='border-t border-zinc-900 p-0.5'
                                        >
                                            <div
                                                className={`w-8 h-7 mx-auto rounded flex items-center justify-center font-mono tabular-nums text-[11px] ${cellClass(cell)}`}
                                            >
                                                {cellLabel(cell)}
                                            </div>
                                        </td>
                                    );
                                })}
                                <td className='border-t border-zinc-900 py-1 px-4 text-right font-mono font-bold text-zinc-100 tabular-nums'>
                                    {row.points}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className='px-4 py-3 border-t border-zinc-900 flex flex-wrap items-center gap-x-4 gap-y-2'>
                {LEGEND.map((item) => (
                    <span
                        key={item.label}
                        className='flex items-center gap-1.5 text-[10px] text-zinc-400'
                    >
                        <span className={`w-3.5 h-3.5 rounded ${item.className}`} />
                        {item.label}
                    </span>
                ))}
                <span className='text-[10px] text-zinc-400'>Hover a cell for sprint results</span>
            </div>
        </div>
    );
}
