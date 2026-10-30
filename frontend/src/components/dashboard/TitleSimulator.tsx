'use client';

import { RACE_POINTS, RemainingRound, SPRINT_POINTS, TitleContender } from '@/utils/titleFight';
import { useMemo, useState } from 'react';

interface Props {
    contenders: TitleContender[];
    rounds: RemainingRound[];
}

const pointsTable = (round: RemainingRound) =>
    round.type === 'race' ? RACE_POINTS : SPRINT_POINTS;

export function TitleSimulator({ contenders, rounds }: Props) {
    // picks["<roundId>:<driverKey>"] = finishing position (absent = outside the points)
    const [picks, setPicks] = useState<Record<string, number>>({});

    const setPick = (roundId: string, driverKey: string, position: number) => {
        setPicks((prev) => {
            const next = { ...prev };
            const key = `${roundId}:${driverKey}`;
            if (position === 0) delete next[key];
            else next[key] = position;
            return next;
        });
    };

    const projected = useMemo(() => {
        return contenders
            .map((contender) => {
                let extra = 0;
                for (const round of rounds) {
                    const position = picks[`${round.id}:${contender.key}`];
                    if (position) extra += pointsTable(round)[position - 1] ?? 0;
                }
                return { ...contender, extra, total: contender.points + extra };
            })
            .sort((a, b) => b.total - a.total);
    }, [contenders, rounds, picks]);

    // A finishing position picked by two drivers in the same round is impossible.
    const duplicates = useMemo(() => {
        const clashes = new Set<string>();
        for (const round of rounds) {
            const seen = new Map<number, string>();
            for (const contender of contenders) {
                const position = picks[`${round.id}:${contender.key}`];
                if (!position) continue;

                const other = seen.get(position);
                if (other) {
                    clashes.add(`${round.id}:${other}`);
                    clashes.add(`${round.id}:${contender.key}`);
                }
                seen.set(position, contender.key);
            }
        }
        return clashes;
    }, [contenders, rounds, picks]);

    const hasPicks = Object.keys(picks).length > 0;
    const [first, second] = projected;
    const margin = first && second ? first.total - second.total : 0;

    return (
        <div className='space-y-3 border-t border-zinc-800/80 pt-4'>
            <div className='flex items-center justify-between gap-3'>
                <p className='text-[10px] font-bold uppercase tracking-wider text-zinc-400'>
                    Pick finishing positions for the races left
                </p>
                {hasPicks && (
                    <button
                        onClick={() => setPicks({})}
                        className='text-[10px] font-bold text-zinc-400 hover:text-zinc-200 uppercase tracking-wider transition-colors'
                    >
                        Reset
                    </button>
                )}
            </div>

            <div className='overflow-x-auto'>
                <table className='w-full text-xs'>
                    <thead>
                        <tr className='border-b border-zinc-900'>
                            <th className='py-2 pr-3 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-wider'>
                                Driver
                            </th>
                            {rounds.map((round) => (
                                <th
                                    key={round.id}
                                    className='py-2 px-1.5 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap'
                                >
                                    {round.label}
                                </th>
                            ))}
                            <th className='py-2 pl-3 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-wider'>
                                Projected
                            </th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-zinc-900'>
                        {contenders.map((contender) => {
                            const total = projected.find((p) => p.key === contender.key);
                            return (
                                <tr key={contender.key}>
                                    <td className='py-2 pr-3'>
                                        <div className='flex items-center gap-2 min-w-0'>
                                            <span
                                                className='w-1 h-4 rounded-full shrink-0'
                                                style={{ backgroundColor: contender.color }}
                                            />
                                            <span className='font-semibold text-zinc-200 truncate'>
                                                {contender.name}
                                            </span>
                                        </div>
                                    </td>
                                    {rounds.map((round) => {
                                        const key = `${round.id}:${contender.key}`;
                                        const clash = duplicates.has(key);
                                        return (
                                            <td key={round.id} className='py-2 px-1.5 text-center'>
                                                <select
                                                    value={picks[key] ?? 0}
                                                    onChange={(e) =>
                                                        setPick(
                                                            round.id,
                                                            contender.key,
                                                            Number(e.target.value)
                                                        )
                                                    }
                                                    className={`bg-zinc-950 border rounded-md px-1.5 py-1 text-[11px] font-mono text-zinc-200 ${
                                                        clash
                                                            ? 'border-red-500/60'
                                                            : 'border-zinc-800'
                                                    }`}
                                                >
                                                    <option value={0}>—</option>
                                                    {pointsTable(round).map((points, index) => (
                                                        <option key={index} value={index + 1}>
                                                            P{index + 1} (+{points})
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                        );
                                    })}
                                    <td className='py-2 pl-3 text-right font-mono tabular-nums'>
                                        <span className='font-bold text-zinc-100'>
                                            {total?.total ?? contender.points}
                                        </span>
                                        {total && total.extra > 0 && (
                                            <span className='ml-1.5 text-[10px] text-emerald-400'>
                                                +{total.extra}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {duplicates.size > 0 && (
                <p className='text-[10px] text-red-400'>
                    Two drivers can&apos;t finish in the same position. Highlighted picks clash.
                </p>
            )}

            {hasPicks && first && (
                <div className='flex items-center justify-between gap-3 border border-zinc-800 rounded-lg bg-zinc-950/60 px-4 py-3'>
                    <div className='flex items-center gap-2.5 min-w-0'>
                        <span
                            className='w-1 h-5 rounded-full shrink-0'
                            style={{ backgroundColor: first.color }}
                        />
                        <p className='text-sm font-bold text-zinc-100 truncate'>{first.name}</p>
                    </div>
                    <span className='text-[10px] font-bold text-zinc-300 uppercase tracking-widest shrink-0'>
                        {margin > 0
                            ? `Champion by ${margin} pts`
                            : 'Level on points, decided on countback'}
                    </span>
                </div>
            )}

            <p className='text-[10px] text-zinc-400 leading-relaxed'>
                Only the drivers listed are simulated. A blank pick means no points for that round.
            </p>
        </div>
    );
}
