'use client';

import { Card, CardBody, CardHeader, CardNote } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { buildQualiPace } from '@/lib/qualiPace';
import { SupabaseRaceResultRow } from '@/types/results';
import { DriverStanding } from '@/types/standing';
import { Gauge } from 'lucide-react';
import { useMemo, useState } from 'react';

type Range = 'season' | 'recent';

const RECENT_RACES = 5;

const RANGES: { key: Range; label: string }[] = [
    { key: 'season', label: 'Season' },
    { key: 'recent', label: `Last ${RECENT_RACES}` },
];

function toHex(color: string) {
    return color.startsWith('#') ? color : `#${color}`;
}

interface Props {
    rows: SupabaseRaceResultRow[];
    drivers: DriverStanding[];
    meetingOrder: number[];
}

export function QualiPaceCard({ rows, drivers, meetingOrder }: Props) {
    const [range, setRange] = useState<Range>('season');

    const pace = useMemo(
        () =>
            buildQualiPace(rows, drivers, meetingOrder, range === 'recent' ? RECENT_RACES : undefined),
        [rows, drivers, meetingOrder, range]
    );

    if (pace.length === 0) return null;

    const maxGap = Math.max(...pace.map((t) => t.avgGapPct), 0.01);

    return (
        <Card>
            <CardHeader
                icon={Gauge}
                title='Qualifying Pace'
                subtitle='Average gap to pole'
                right={
                    <SegmentedControl
                        options={RANGES}
                        value={range}
                        onChange={setRange}
                        label='Qualifying pace range'
                        className='w-full sm:w-auto'
                    />
                }
            />

            <CardBody className='space-y-3'>
                {pace.map((team, index) => {
                    const width = Math.max(2, (team.avgGapPct / maxGap) * 100);
                    return (
                        <div key={team.teamName} className='space-y-1'>
                            <div className='flex items-center justify-between gap-3'>
                                <div className='flex items-center gap-2.5 min-w-0'>
                                    <span className='font-mono text-[11px] text-zinc-400 w-5 tabular-nums'>
                                        {index + 1}
                                    </span>
                                    <p className='text-xs font-semibold text-zinc-200 truncate'>
                                        {team.teamName}
                                    </p>
                                </div>
                                <span className='font-mono text-xs font-bold text-zinc-100 tabular-nums shrink-0'>
                                    +{team.avgGapPct.toFixed(2)}%
                                </span>
                            </div>
                            <div className='h-1.5 rounded-full bg-zinc-900'>
                                <div
                                    className='h-1.5 rounded-full'
                                    style={{
                                        width: `${width}%`,
                                        backgroundColor: toHex(team.teamColor),
                                        opacity: 0.8,
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </CardBody>

            <CardNote>
                Each driver&apos;s best qualifying lap against pole, as a percentage of the pole
                time, averaged across the team&apos;s drivers. Drivers knocked out early set their
                lap in an earlier session, so treat gaps as a rough guide.
            </CardNote>
        </Card>
    );
}
