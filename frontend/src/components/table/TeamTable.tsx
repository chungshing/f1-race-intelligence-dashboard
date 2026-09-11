import { Team } from '@/types/standing';
import { formatHexColor } from '@/utils/sessions';
import { getPositionColor, TABLE_CONTAINER_CLASS, TABLE_THEAD_CLASS } from '@/utils/styles';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import Link from 'next/link';

interface TeamTableProps {
    standings: Team[];
    limit?: number;
}

export function TeamTable({ standings, limit }: TeamTableProps) {
    if (standings.length === 0) {
        return (
            <p className='text-sm text-zinc-400 p-4 border border-zinc-800 rounded-lg bg-zinc-950'>
                No constructor data available.
            </p>
        );
    }

    const displayedStandings = limit ? standings.slice(0, limit) : standings;

    return (
        <div className={TABLE_CONTAINER_CLASS}>
            <table className='w-full text-left border-collapse text-sm'>
                <thead>
                    <tr className={TABLE_THEAD_CLASS}>
                        <th className='p-4 w-16 text-center'>Pos</th>
                        <th className='p-4 w-2'></th>
                        <th className='p-4'>Team</th>
                        <th className='p-4 text-center w-24'>Change</th>
                        <th className='p-4 text-right w-28'>Points</th>
                    </tr>
                </thead>
                <tbody className='divide-y divide-zinc-800/50'>
                    {displayedStandings.map((row, index) => {
                        const rowKey = row.teamName ? `team-${row.teamName}` : `team-${index}`;

                        return (
                            <tr
                                key={rowKey}
                                className='group hover:bg-zinc-800/20 transition-all duration-150'
                            >
                                <td
                                    className={`p-4 font-black text-center text-base ${getPositionColor(row.position)}`}
                                >
                                    {row.position}
                                </td>
                                <td className='p-0'>
                                    <div
                                        className='w-1 h-8 rounded-full'
                                        style={{ backgroundColor: formatHexColor(row.teamColor) }}
                                    />
                                </td>
                                <td className='p-4 font-bold text-zinc-100 tracking-tight text-sm'>
                                    <Link
                                        href={`/constructors/${encodeURIComponent(row.teamName)}`}
                                        className='hover:text-red-400 transition-colors'
                                    >
                                        {row.teamName}
                                    </Link>
                                </td>
                                <td className='p-4 text-center'>
                                    <div className='flex items-center justify-center'>
                                        {row.positionsGained > 0 ? (
                                            <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'>
                                                <ArrowUp className='w-3 h-3 stroke-3' />{' '}
                                                {row.positionsGained}
                                            </span>
                                        ) : row.positionsGained < 0 ? (
                                            <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20'>
                                                <ArrowDown className='w-3 h-3 stroke-3' />{' '}
                                                {Math.abs(row.positionsGained)}
                                            </span>
                                        ) : (
                                            <Minus className='w-3 h-3 text-zinc-600 stroke-3' />
                                        )}
                                    </div>
                                </td>
                                <td className='p-4 text-right font-bold text-zinc-100 tracking-tight text-sm'>
                                    {row.points}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
