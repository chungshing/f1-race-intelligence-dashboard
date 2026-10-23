'use client';

import {
    DriverResult,
    RaceResult,
    StartingGridEntry,
    SupabaseRaceResultRow,
} from '@/types/results';
import { parseJsonField } from '@/utils/form';
import {
    buildGridRaceRows,
    findGridRacePairs,
    isGrandPrixSession,
    summarizeGridRace,
} from '@/utils/gridVsRace';
import Link from 'next/link';
import { useMemo } from 'react';

interface Lookup {
    name: string;
    team: string;
    teamColor: string;
}

interface Props {
    meetingKey: number;
    country: string;
    rows: SupabaseRaceResultRow[];
    lookup: Record<number, Lookup>;
}

const CARD = 'bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3.5';
const LABEL = 'text-[10px] font-bold uppercase tracking-wider text-zinc-400';

function driverInfo(driverNumber: number, lookup: Record<number, Lookup>): Lookup {
    return (
        lookup[driverNumber] ?? {
            name: `Driver ${driverNumber}`,
            team: 'Unknown',
            teamColor: '#3f3f46',
        }
    );
}

export function LastRaceRecap({ meetingKey, country, rows, lookup }: Props) {
    const recap = useMemo(() => {
        const sessions: RaceResult[] = rows
            .filter((r) => r.meeting_key === meetingKey)
            .map((r) => ({
                sessionKey: r.session_key,
                meetingKey: r.meeting_key,
                country: r.country,
                sessionName: r.session_name,
                classification: parseJsonField<DriverResult>(r.classification_json),
                pitStops: parseJsonField(r.pit_stops_json),
                stints: parseJsonField(r.stints_json),
                weather: [],
                raceControl: [],
                startingGrid: parseJsonField<StartingGridEntry>(r.starting_grid_json),
            }));

        const race = sessions.find((s) => isGrandPrixSession(s.sessionName));
        if (!race) return null;

        const podium = race.classification
            .filter((d) => d.position != null && d.position <= 3 && !d.dnf && !d.dns && !d.dsq)
            .sort((a, b) => (a.position ?? 99) - (b.position ?? 99));

        const pair = findGridRacePairs(sessions).find((p) => p.kind === 'race');
        const gainer = pair
            ? summarizeGridRace(buildGridRaceRows(pair.grid, race.classification)).biggestGainer
            : null;

        const stops = race.pitStops ?? [];
        const useStopDuration = stops.some((s) => s.stop_duration > 0);
        let fastestPit: { driverNumber: number; duration: number; lap: number } | null = null;
        for (const stop of stops) {
            const duration = useStopDuration ? stop.stop_duration : stop.lane_duration;
            if (duration > 0 && (!fastestPit || duration < fastestPit.duration)) {
                fastestPit = {
                    driverNumber: stop.driver_number,
                    duration,
                    lap: stop.lap_number,
                };
            }
        }

        return {
            podium,
            gainer: gainer && (gainer.delta ?? 0) > 0 ? gainer : null,
            gainerVsQualifying: pair ? !pair.isOfficialGrid : false,
            fastestPit,
        };
    }, [rows, meetingKey]);

    if (!recap || recap.podium.length === 0) return null;

    return (
        <div className={`${CARD} space-y-4 p-4`}>
            <div className='flex items-start justify-between gap-4'>
                <div>
                    <p className='text-[10px] font-bold text-red-500 tracking-widest uppercase'>
                        Last Race
                    </p>
                    <h2 className='text-xl font-black text-zinc-100 tracking-tight mt-0.5'>
                        {country} Grand Prix
                    </h2>
                </div>
                <Link
                    href={`/races/${meetingKey}`}
                    className='text-[11px] font-bold text-zinc-400 hover:text-zinc-200 transition-colors tracking-tight whitespace-nowrap'
                >
                    Full Breakdown →
                </Link>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                {recap.podium.map((entry) => {
                    const info = driverInfo(entry.driverNumber, lookup);
                    return (
                        <div
                            key={entry.driverNumber}
                            className='flex items-center gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/60 px-3 py-2.5 min-w-0'
                            style={{ borderLeft: `3px solid ${info.teamColor}` }}
                        >
                            <span className='font-mono text-lg font-black text-zinc-100 tabular-nums'>
                                P{entry.position}
                            </span>
                            <div className='min-w-0'>
                                <p className='text-sm font-bold text-zinc-100 truncate'>
                                    {info.name}
                                </p>
                                <p className='text-[10px] text-zinc-400 truncate'>{info.team}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {(recap.gainer || recap.fastestPit) && (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    {recap.gainer && (
                        <div className='rounded-lg border border-zinc-800/80 bg-zinc-950/60 px-3 py-2.5'>
                            <p className={LABEL}>
                                Biggest gainer{recap.gainerVsQualifying ? ' (vs qualifying)' : ''}
                            </p>
                            <div className='mt-1 flex items-baseline justify-between gap-3'>
                                <div className='min-w-0'>
                                    <p className='text-sm font-bold text-zinc-100 truncate'>
                                        {driverInfo(recap.gainer.driverNumber, lookup).name}
                                    </p>
                                    <p className='text-[11px] text-zinc-400 font-mono'>
                                        P{recap.gainer.gridPosition ?? '—'} → P
                                        {recap.gainer.finishPosition ?? '—'}
                                    </p>
                                </div>
                                <span className='font-mono text-2xl font-black text-emerald-400 tabular-nums'>
                                    +{recap.gainer.delta}
                                </span>
                            </div>
                        </div>
                    )}

                    {recap.fastestPit && (
                        <div className='rounded-lg border border-zinc-800/80 bg-zinc-950/60 px-3 py-2.5'>
                            <p className={LABEL}>Fastest pit stop</p>
                            <div className='mt-1 flex items-baseline justify-between gap-3'>
                                <div className='min-w-0'>
                                    <p className='text-sm font-bold text-zinc-100 truncate'>
                                        {driverInfo(recap.fastestPit.driverNumber, lookup).name}
                                    </p>
                                    <p className='text-[11px] text-zinc-400 font-mono'>
                                        Lap {recap.fastestPit.lap}
                                    </p>
                                </div>
                                <span className='font-mono text-2xl font-black text-zinc-100 tabular-nums'>
                                    {recap.fastestPit.duration.toFixed(2)}s
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
