import NextImage from 'next/image';
import { DriverStanding } from '@/types/standing';
import { formatHexColor } from '@/utils/sessions';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { getPositionColor, TABLE_CONTAINER_CLASS, TABLE_THEAD_CLASS } from '@/utils/styles';

interface DriverTableProps {
    standings: DriverStanding[];
    limit?: number;
    formMap?: Record<number, (number | string | null)[]>;
}
function getFormColor(result: number | string | null): string {
    // 1. Handle non-finishes and missing data first
    if (result === null) return 'bg-zinc-800/30 text-zinc-600';
    if (typeof result === 'string') return 'bg-red-500/10 text-red-400 border border-red-500/20'; // DNF/DNS/DSQ

    // 2. Podium Finishes (P1, P2, P3)
    if (result === 1) return 'bg-amber-500/20 text-amber-400 font-bold'; // P1: Gold
    if (result === 2) return 'bg-slate-300/20 text-slate-300 font-bold'; // P2: Silver
    if (result === 3) return 'bg-orange-600/20 text-orange-400 font-bold'; // P3: Bronze

    // 3. The Rest of the Top 5
    if (result <= 5) return 'bg-emerald-500/20 text-emerald-400 font-semibold'; // P4-P5: Elite Points

    // 4. Lower Points Positions
    if (result <= 10) return 'bg-cyan-500/15 text-cyan-400'; // P6-P10: Standard Points

    return 'bg-zinc-800/50 text-zinc-500'; // Very back of the grid
}

function getFormLabel(result: number | string | null): string {
    if (result === null) return '—';
    if (typeof result === 'string') return result.slice(0, 1);
    return String(result);
}

export function DriverTable({ standings, limit, formMap }: DriverTableProps) {
    if (standings.length === 0) {
        return (
            <p className='text-sm text-zinc-400 p-4 border border-zinc-800 rounded-lg bg-zinc-950'>
                No driver data available.
            </p>
        );
    }

    const displayedStandings = limit ? standings.slice(0, limit) : standings;

    return (
        <div className={TABLE_CONTAINER_CLASS}>
            <table className='w-full text-left border-collapse text-sm min-w-162.5'>
                <thead>
                    <tr className={TABLE_THEAD_CLASS}>
                        <th className='p-4 w-16 text-center'>Pos</th>
                        <th className='p-4 w-16 text-center'>No</th>
                        <th className='p-4'>Driver</th>
                        <th className='p-4'>Team</th>
                        {formMap && (
                            <th className='p-4 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider'>
                                Last 5
                            </th>
                        )}
                        <th className='p-4 text-center w-24'>Change</th>
                        <th className='p-4 text-right w-28'>Points</th>
                    </tr>
                </thead>
                <tbody className='divide-y divide-zinc-800/50'>
                    {displayedStandings.map((row, index) => {
                        const rowKey = row.driverNumber
                            ? `driver-${row.driverNumber}`
                            : `driver-${row.driverName}-${index}`;

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
                                <td className='p-4 text-zinc-500 text-center font-mono font-bold group-hover:text-zinc-300 transition-colors'>
                                    {row.driverNumber}
                                </td>
                                <td
                                    className='p-4 font-semibold text-zinc-100'
                                    style={{
                                        borderLeft: `4px solid ${formatHexColor(row.teamColor)}`,
                                    }}
                                >
                                    <div className='flex items-center gap-3 pl-1'>
                                        {row.headshotUrl && (
                                            <div className='relative w-8 h-8 rounded-full border border-zinc-700 overflow-hidden bg-zinc-800 shrink-0 shadow-inner'>
                                                <NextImage
                                                    src={row.headshotUrl}
                                                    alt={row.driverName || 'Driver'}
                                                    fill
                                                    unoptimized
                                                    className='object-cover group-hover:scale-105 transition-transform'
                                                />
                                            </div>
                                        )}
                                        <span className='tracking-tight'>{row.driverName}</span>
                                    </div>
                                </td>
                                <td className='p-4 text-zinc-400 font-medium'>{row.teamName}</td>
                                {formMap && (
                                    <td className='p-4'>
                                        <div className='flex gap-1 justify-center'>
                                            {(formMap[row.driverNumber] ?? []).map((result, i) => (
                                                <span
                                                    key={i}
                                                    className={
                                                        'w-5 h-5 rounded text-[8px] font-black flex items-center justify-center ' +
                                                        getFormColor(result)
                                                    }
                                                    title={String(result ?? '—')}
                                                >
                                                    {getFormLabel(result)}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                )}
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
                                <td className='p-4 text-right'>
                                    <div className='flex flex-col items-end justify-center'>
                                        <span className='font-bold text-zinc-100 text-sm tracking-tight'>
                                            {row.points}
                                        </span>
                                        {row.pointsEarned > 0 && (
                                            <span className='text-[10px] font-bold text-emerald-400 mt-0.5 bg-emerald-500/10 px-1 rounded'>
                                                +{row.pointsEarned}
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
