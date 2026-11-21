'use client';

import { Card, CardBody, CardHeader, CardMeta } from '@/components/ui/Card';
import { useCircuitWinners } from '@/hooks/useCircuitWinners';
import { useRaceWeekends } from '@/hooks/useRaceWeekends';
import { History } from 'lucide-react';

export function PastWinnersCard({ meetingKey }: { meetingKey: number }) {
    const { data: weekends } = useRaceWeekends();
    const weekend = weekends.find((w) => w.meetingKey === meetingKey);
    const raceDate =
        weekend?.sessions.find((s) => s.sessionName === 'Race')?.dateStart.slice(0, 10) ?? null;

    const { data, isPending } = useCircuitWinners(raceDate);

    if (!raceDate) return null;
    if (isPending) {
        return (
            <div className='h-48 animate-pulse rounded-xl border border-zinc-800/50 bg-zinc-900/40' />
        );
    }
    if (!data || data.winners.length === 0) return null;

    return (
        <Card>
            <CardHeader
                icon={History}
                title='Past Winners'
                subtitle={weekend?.circuit}
                right={
                    <div className='flex items-center gap-3'>
                        <CardMeta>
                            From pole: {data.winners.filter((w) => w.grid === 1).length}/
                            {data.winners.length}
                        </CardMeta>
                        {data.mostWins && (
                            <CardMeta>
                                Most wins: {data.mostWins.driver.split(' ').pop()} (
                                {data.mostWins.wins})
                            </CardMeta>
                        )}
                    </div>
                }
            />
            <CardBody className='p-0'>
                <div className='divide-y divide-zinc-900'>
                    {data.winners.map((winner) => (
                        <div
                            key={winner.season}
                            className='flex items-center gap-4 px-4 py-2.5 text-sm'
                        >
                            <span className='w-12 shrink-0 font-mono text-xs text-zinc-500'>
                                {winner.season}
                            </span>
                            <span className='min-w-0 flex-1 truncate font-bold text-zinc-100'>
                                {winner.driver}
                            </span>
                            <span className='w-14 shrink-0 text-right font-mono text-xs text-zinc-500'>
                                {winner.grid > 0 ? `P${winner.grid}` : 'Pit'}
                            </span>
                            <span className='shrink-0 text-xs text-zinc-400'>{winner.team}</span>
                        </div>
                    ))}
                </div>
            </CardBody>
        </Card>
    );
}
