'use client';

import { CellStatus, MatrixRound, ResultsMatrix as ResultsMatrixData } from '@/lib/resultsMatrix';
import { TABLE_CONTAINER_CLASS } from '@/utils/styles';
import { LayoutGrid } from 'lucide-react';

const SPRINT_BAND = 'bg-amber-500/[0.06]';

function toHex(color: string) {
    return color.startsWith('#') ? color : `#${color}`;
}

function resultClass(position: number | null, status: CellStatus | null, present: boolean) {
    if (!present) return 'text-zinc-700';
    if (status === 'DNS') return 'bg-amber-500/15 text-amber-400';
    if (status) return 'bg-red-500/15 text-red-400';

    if (position === 1) return 'bg-yellow-400/20 text-yellow-300 font-bold';
    if (position === 2) return 'bg-zinc-300/15 text-zinc-200 font-bold';
    if (position === 3) return 'bg-amber-700/25 text-amber-500 font-bold';
    if (position != null && position <= 10) return 'bg-emerald-500/10 text-emerald-400';
    return 'text-zinc-400';
}

function ResultCell({
    position,
    status,
    present,
    title,
    sprintBand,
}: {
    position: number | null;
    status: CellStatus | null;
    present: boolean;
    title: string;
    sprintBand: boolean;
}) {
    return (
        <td
            title={title}
            className={`border-t border-zinc-900 p-0.5 ${sprintBand ? SPRINT_BAND : ''}`}
        >
            <div
                className={`w-8 h-7 mx-auto rounded flex items-center justify-center font-mono tabular-nums text-[11px] ${resultClass(position, status, present)}`}
            >
                {present ? (status ?? position ?? '—') : '·'}
            </div>
        </td>
    );
}

const LEGEND = [
    { label: 'Win', className: 'bg-yellow-400/20 text-yellow-300' },
    { label: 'P2', className: 'bg-zinc-300/15 text-zinc-200' },
    { label: 'P3', className: 'bg-amber-700/25 text-amber-500' },
    { label: 'Points', className: 'bg-emerald-500/10 text-emerald-400' },
    { label: 'No points', className: 'bg-zinc-900 text-zinc-400' },
    { label: 'DNF/DSQ', className: 'bg-red-500/15 text-red-400' },
];

function HeaderCell({ round }: { round: MatrixRound }) {
    return (
        <th
            colSpan={round.hasSprint ? 2 : 1}
            title={`Round ${round.round}: ${round.country}${round.hasSprint ? ' (sprint weekend)' : ''}`}
            className={`px-0.5 pt-2 align-bottom ${round.hasSprint ? SPRINT_BAND : ''}`}
        >
            <span
                className={`block mx-auto h-24 text-[10px] font-semibold whitespace-nowrap ${
                    round.hasSprint ? 'text-amber-400' : 'text-zinc-400'
                }`}
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
                {round.country}
            </span>
        </th>
    );
}

export function ResultsMatrix({ matrix }: { matrix: ResultsMatrixData }) {
    if (matrix.rounds.length === 0 || matrix.rows.length === 0) return null;

    const sprintWeekends = matrix.rounds.filter((r) => r.hasSprint).length;

    return (
        <div className={TABLE_CONTAINER_CLASS}>
            <div className='p-4 pl-5 border-b border-zinc-900 bg-zinc-900/20 flex items-center gap-2 flex-wrap'>
                <LayoutGrid className='w-4 h-4 text-zinc-400' />
                <h3 className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>
                    Season Results
                </h3>
                <span className='text-[10px] font-medium text-zinc-400'>
                    Finishing positions
                    {sprintWeekends > 0 &&
                        ` · ${sprintWeekends} sprint ${sprintWeekends === 1 ? 'weekend' : 'weekends'} highlighted`}
                </span>
            </div>

            <div className='overflow-x-auto'>
                <table className='border-separate border-spacing-0 text-xs'>
                    <thead>
                        <tr>
                            <th
                                rowSpan={2}
                                className='sticky left-0 z-10 bg-zinc-950 py-2 px-4 text-left align-bottom text-[10px] font-bold text-zinc-400 uppercase tracking-wider min-w-44'
                            >
                                Driver
                            </th>
                            {matrix.rounds.map((round) => (
                                <HeaderCell key={round.meetingKey} round={round} />
                            ))}
                            <th
                                rowSpan={2}
                                className='py-2 px-4 text-right align-bottom text-[10px] font-bold text-zinc-400 uppercase tracking-wider'
                            >
                                Pts
                            </th>
                        </tr>
                        <tr>
                            {matrix.rounds.map((round) =>
                                round.hasSprint ? (
                                    <FragmentLabels key={round.meetingKey} />
                                ) : (
                                    <th key={round.meetingKey} className='h-4' />
                                )
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {matrix.rows.map((row) => (
                            <tr key={row.driverNumber}>
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
                                {row.cells.flatMap((cell, index) => {
                                    const round = matrix.rounds[index];
                                    const cells = [];

                                    if (round.hasSprint) {
                                        cells.push(
                                            <ResultCell
                                                key={`${round.meetingKey}-s`}
                                                position={cell?.sprintPosition ?? null}
                                                status={cell?.sprintStatus ?? null}
                                                present={!!cell?.tookPartInSprint}
                                                sprintBand
                                                title={`${row.name}, ${round.country} Sprint: ${
                                                    cell?.tookPartInSprint
                                                        ? (cell.sprintStatus ??
                                                          `P${cell.sprintPosition}`)
                                                        : 'did not take part'
                                                }`}
                                            />
                                        );
                                    }

                                    cells.push(
                                        <ResultCell
                                            key={`${round.meetingKey}-r`}
                                            position={cell?.position ?? null}
                                            status={cell?.status ?? null}
                                            present={!!cell}
                                            sprintBand={round.hasSprint}
                                            title={`${row.name}, ${round.country}${
                                                round.hasSprint ? ' Race' : ''
                                            }: ${cell ? (cell.status ?? `P${cell.position}`) : 'did not take part'}`}
                                        />
                                    );

                                    return cells;
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
                {sprintWeekends > 0 && (
                    <span className='flex items-center gap-1.5 text-[10px] text-zinc-400'>
                        <span className='w-3.5 h-3.5 rounded bg-amber-500/20 border border-amber-500/30' />
                        Sprint weekend (S = Sprint, R = Race)
                    </span>
                )}
            </div>
        </div>
    );
}

function FragmentLabels() {
    return (
        <>
            <th
                className={`h-4 pb-1 text-[9px] font-bold text-amber-400 text-center ${SPRINT_BAND}`}
            >
                S
            </th>
            <th
                className={`h-4 pb-1 text-[9px] font-bold text-zinc-400 text-center ${SPRINT_BAND}`}
            >
                R
            </th>
        </>
    );
}
