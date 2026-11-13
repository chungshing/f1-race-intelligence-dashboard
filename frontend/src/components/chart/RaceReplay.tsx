'use client';

import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useSessionLaps } from '@/hooks/useSessionLaps';
import { DriverResult, PitStop, RaceControlEvent, Stint } from '@/types/results';
import { RaceStatus, ReplayDriverState, ReplayEvent, buildReplay } from '@/utils/replay';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Pause,
    Play,
    RotateCcw,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface Lookup {
    name: string;
    team: string;
    teamColor: string;
}

interface Props {
    sessionKey: number;
    driversList: DriverResult[];
    grid: { driverNumber: number; position: number | null }[];
    stints?: Stint[] | null;
    pitStops?: PitStop[] | null;
    raceControl?: RaceControlEvent[] | null;
    lookup: Record<number, Lookup>;
}

const ROW_HEIGHT = 36;

const SPEEDS = [
    { key: '1', label: '1x' },
    { key: '2', label: '2x' },
    { key: '4', label: '4x' },
    { key: '8', label: '8x' },
] as const;

const TYRE_STYLE: Record<string, { letter: string; color: string }> = {
    SOFT: { letter: 'S', color: '#ef4444' },
    MEDIUM: { letter: 'M', color: '#eab308' },
    HARD: { letter: 'H', color: '#e4e4e7' },
    INTERMEDIATE: { letter: 'I', color: '#22c55e' },
    WET: { letter: 'W', color: '#3b82f6' },
};

const STATUS_STYLE: Record<RaceStatus, { label: string; className: string }> = {
    green: { label: 'Green flag', className: 'border-zinc-800 bg-zinc-950/60 text-zinc-400' },
    SC: { label: 'Safety car', className: 'border-yellow-500/40 bg-yellow-500/15 text-yellow-300' },
    VSC: {
        label: 'Virtual safety car',
        className: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
    },
    red: { label: 'Red flag', className: 'border-red-500/40 bg-red-500/15 text-red-300' },
};

const EVENT_DOT: Record<ReplayEvent['kind'], string> = {
    pit: 'bg-zinc-400',
    sc: 'bg-yellow-400',
    vsc: 'bg-yellow-600',
    red: 'bg-red-500',
    out: 'bg-red-400',
};

function driverCode(name: string, number: number) {
    if (name.startsWith('Driver ')) return `#${number}`;
    const last = name.trim().split(' ').slice(-1)[0] ?? '';
    return last.slice(0, 3).toUpperCase();
}

function formatLap(seconds: number | null) {
    if (seconds == null) return '—';
    const minutes = Math.floor(seconds / 60);
    const rest = seconds - minutes * 60;
    return `${minutes}:${rest.toFixed(3).padStart(6, '0')}`;
}

function gapLabel(state: ReplayDriverState, mode: 'gap' | 'interval') {
    if (state.out) return 'OUT';
    if (state.position === 1) return 'Leader';
    if (state.lapsDown > 0) return `+${state.lapsDown} LAP${state.lapsDown > 1 ? 'S' : ''}`;

    const value = mode === 'gap' ? state.gapSeconds : state.intervalSeconds;
    return value == null ? '—' : `+${value.toFixed(3)}`;
}

export function RaceReplay({
    sessionKey,
    driversList,
    grid,
    stints,
    pitStops,
    raceControl,
    lookup,
}: Props) {
    const { data: rawLaps, loading } = useSessionLaps(sessionKey);

    const replay = useMemo(() => {
        const retired = new Set(
            driversList.filter((d) => d.dnf || d.dns || d.dsq).map((d) => d.driverNumber)
        );
        return buildReplay(rawLaps, grid, stints ?? [], pitStops ?? [], raceControl ?? [], retired);
    }, [rawLaps, grid, stints, pitStops, raceControl, driversList]);

    const [lap, setLap] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [speed, setSpeed] = useState<(typeof SPEEDS)[number]['key']>('2');
    const [gapMode, setGapMode] = useState<'gap' | 'interval'>('gap');

    const lapsPerSecond = Number(speed);
    const isPlaying = playing && lap < replay.maxLap;

    useEffect(() => {
        if (!playing || lap >= replay.maxLap) return;

        const id = setInterval(() => {
            setLap((current) => Math.min(current + 1, replay.maxLap));
        }, 1000 / lapsPerSecond);

        return () => clearInterval(id);
    }, [playing, lap, lapsPerSecond, replay.maxLap]);

    if (loading) {
        return (
            <div className='text-zinc-400 text-xs py-20 text-center animate-pulse tracking-wider uppercase font-semibold'>
                Building Race Replay...
            </div>
        );
    }

    if (replay.frames.length < 2) return null;

    const currentLap = Math.min(lap, replay.maxLap);
    const frame = replay.frames[currentLap];
    const rowIndex = new Map(frame.drivers.map((d, i): [number, number] => [d.driverNumber, i]));
    const stateByDriver = new Map(
        frame.drivers.map((d): [number, ReplayDriverState] => [d.driverNumber, d])
    );
    const status = STATUS_STYLE[frame.status];
    const fastest = frame.fastestLap;
    const feed = replay.events
        .filter((e) => e.lap <= currentLap)
        .slice(-12)
        .reverse();
    const transitionMs = Math.round(Math.min(500, 800 / lapsPerSecond));

    const nameOf = (driverNumber: number) => lookup[driverNumber]?.name ?? `Driver ${driverNumber}`;

    const togglePlay = () => {
        if (currentLap >= replay.maxLap) setLap(0);
        setPlaying((value) => !value || currentLap >= replay.maxLap);
    };

    return (
        <Card>
            <CardHeader
                icon={Play}
                title='Race Replay'
                subtitle='Lap by lap'
                right={
                    <SegmentedControl
                        options={[...SPEEDS]}
                        value={speed}
                        onChange={setSpeed}
                        label='Playback speed, laps per second'
                        className='w-full sm:w-auto'
                    />
                }
            />

            <CardBody className='space-y-4'>
                {/* Transport */}
                <div className='flex items-center gap-3'>
                    <button
                        onClick={togglePlay}
                        aria-label={
                            isPlaying ? 'Pause' : currentLap >= replay.maxLap ? 'Replay' : 'Play'
                        }
                        className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 transition-colors hover:bg-zinc-800'
                    >
                        {isPlaying ? (
                            <Pause className='h-4 w-4' />
                        ) : currentLap >= replay.maxLap ? (
                            <RotateCcw className='h-4 w-4' />
                        ) : (
                            <Play className='h-4 w-4' />
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setPlaying(false);
                            setLap(Math.max(currentLap - 1, 0));
                        }}
                        aria-label='Previous lap'
                        className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 transition-colors hover:text-zinc-100'
                    >
                        <ChevronLeft className='h-4 w-4' />
                    </button>
                    <button
                        onClick={() => {
                            setPlaying(false);
                            setLap(Math.min(currentLap + 1, replay.maxLap));
                        }}
                        aria-label='Next lap'
                        className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 transition-colors hover:text-zinc-100'
                    >
                        <ChevronRight className='h-4 w-4' />
                    </button>

                    <div className='min-w-0 flex-1'>
                        {/* Safety car and virtual safety car periods along the timeline */}
                        <div className='relative mb-1 h-1.5 rounded-full bg-zinc-900'>
                            {replay.statusWindows.map((window, index) => (
                                <span
                                    key={index}
                                    className={`absolute top-0 h-1.5 rounded-full ${
                                        window.kind === 'SC'
                                            ? 'bg-yellow-400/70'
                                            : 'bg-yellow-600/60'
                                    }`}
                                    style={{
                                        left: `${(window.start / replay.maxLap) * 100}%`,
                                        width: `${Math.max(((window.end - window.start + 1) / replay.maxLap) * 100, 1)}%`,
                                    }}
                                />
                            ))}
                        </div>
                        <input
                            type='range'
                            min={0}
                            max={replay.maxLap}
                            value={currentLap}
                            onChange={(e) => setLap(Number(e.target.value))}
                            aria-label='Lap'
                            className='w-full accent-red-500'
                        />
                    </div>

                    <div className='w-24 shrink-0 text-right font-mono'>
                        <span className='text-xl font-black text-zinc-100 tabular-nums'>
                            {currentLap === 0 ? 'GRID' : currentLap}
                        </span>
                        {currentLap > 0 && (
                            <span className='text-xs text-zinc-400'> / {replay.maxLap}</span>
                        )}
                    </div>
                </div>

                {/* Race status and fastest lap */}
                <div className='flex flex-wrap items-center justify-between gap-2'>
                    <span
                        className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${status.className}`}
                    >
                        {status.label}
                    </span>
                    {fastest && (
                        <span className='text-[11px] text-zinc-400'>
                            Fastest lap{' '}
                            <span className='font-mono font-bold text-purple-400'>
                                {formatLap(fastest.time)}
                            </span>{' '}
                            · {driverCode(nameOf(fastest.driverNumber), fastest.driverNumber)} (lap{' '}
                            {fastest.lap})
                        </span>
                    )}
                </div>

                <div className='grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
                    {/* Timing tower */}
                    <div>
                        <div className='mb-2 flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400'>
                            <span>Driver</span>
                            <div className='flex items-center gap-4'>
                                <span className='hidden sm:inline'>Tyre</span>
                                <span className='hidden sm:inline'>Last lap</span>
                                <button
                                    onClick={() =>
                                        setGapMode((mode) => (mode === 'gap' ? 'interval' : 'gap'))
                                    }
                                    className='rounded border border-zinc-800 px-2 py-0.5 text-zinc-300 transition-colors hover:bg-zinc-900'
                                    title='Switch between the gap to the leader and the gap to the car ahead'
                                >
                                    {gapMode === 'gap' ? 'Gap to leader' : 'Interval'}
                                </button>
                            </div>
                        </div>

                        <div
                            className='relative'
                            style={{ height: replay.driverNumbers.length * ROW_HEIGHT }}
                        >
                            {replay.driverNumbers.map((driverNumber) => {
                                const state = stateByDriver.get(driverNumber);
                                if (!state) return null;

                                const info = lookup[driverNumber];
                                const name = info?.name ?? `Driver ${driverNumber}`;
                                const tyre = state.compound
                                    ? TYRE_STYLE[state.compound.toUpperCase()]
                                    : null;
                                const index = rowIndex.get(driverNumber) ?? 0;

                                return (
                                    <div
                                        key={driverNumber}
                                        className={`absolute inset-x-0 flex items-center gap-2 rounded-md border px-2 text-xs ${
                                            state.out
                                                ? 'border-transparent opacity-40'
                                                : 'border-zinc-900 bg-zinc-950/60'
                                        }`}
                                        style={{
                                            height: ROW_HEIGHT - 4,
                                            transform: `translateY(${index * ROW_HEIGHT}px)`,
                                            transition: `transform ${transitionMs}ms ease`,
                                        }}
                                    >
                                        <span className='w-6 text-right font-mono font-bold text-zinc-100 tabular-nums'>
                                            {state.position ?? '—'}
                                        </span>
                                        <span className='flex w-3 justify-center'>
                                            {state.positionChange > 0 && (
                                                <ChevronUp className='h-3 w-3 text-emerald-400' />
                                            )}
                                            {state.positionChange < 0 && (
                                                <ChevronDown className='h-3 w-3 text-red-400' />
                                            )}
                                        </span>
                                        <span
                                            className='h-4 w-1 shrink-0 rounded-full'
                                            style={{
                                                backgroundColor: info?.teamColor ?? '#3f3f46',
                                            }}
                                        />
                                        <span className='w-9 font-mono font-bold text-zinc-100'>
                                            {driverCode(name, driverNumber)}
                                        </span>
                                        <span className='hidden min-w-0 flex-1 truncate text-zinc-400 md:inline'>
                                            {name}
                                        </span>
                                        <span className='flex-1 md:hidden' />

                                        <div className='ml-auto flex items-center gap-4'>
                                            {state.pittedThisLap && (
                                                <span className='rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-200'>
                                                    Pit
                                                </span>
                                            )}
                                            <span className='hidden w-11 items-center justify-end gap-1.5 sm:flex'>
                                                {tyre && (
                                                    <>
                                                        <span
                                                            className='flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-black'
                                                            style={{
                                                                borderColor: tyre.color,
                                                                color: tyre.color,
                                                            }}
                                                        >
                                                            {tyre.letter}
                                                        </span>
                                                        <span className='w-4 text-right font-mono text-[10px] text-zinc-400 tabular-nums'>
                                                            {state.tyreAge}
                                                        </span>
                                                    </>
                                                )}
                                            </span>
                                            <span
                                                className={`hidden w-20 text-right font-mono tabular-nums sm:inline ${
                                                    state.isFastestSoFar
                                                        ? 'font-bold text-purple-400'
                                                        : 'text-zinc-300'
                                                }`}
                                            >
                                                {formatLap(state.lastLap)}
                                            </span>
                                            <span className='w-20 text-right font-mono tabular-nums text-zinc-100'>
                                                {gapLabel(state, gapMode)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Event feed */}
                    <div className='min-w-0'>
                        <p className='mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400'>
                            What just happened
                        </p>
                        {feed.length === 0 ? (
                            <p className='px-1 text-xs text-zinc-400'>Nothing yet. Press play.</p>
                        ) : (
                            <ul className='space-y-1.5'>
                                {feed.map((event, index) => (
                                    <li
                                        key={`${event.lap}-${event.kind}-${event.driverNumber ?? 'x'}-${index}`}
                                        className='flex items-start gap-2.5 rounded-md border border-zinc-900 bg-zinc-950/60 px-2.5 py-1.5 text-xs'
                                    >
                                        <span className='mt-0.5 w-8 shrink-0 font-mono text-[10px] text-zinc-400 tabular-nums'>
                                            L{event.lap}
                                        </span>
                                        <span
                                            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${EVENT_DOT[event.kind]}`}
                                        />
                                        <span className='text-zinc-300'>
                                            {event.driverNumber != null && (
                                                <span className='font-bold text-zinc-100'>
                                                    {driverCode(
                                                        nameOf(event.driverNumber),
                                                        event.driverNumber
                                                    )}{' '}
                                                </span>
                                            )}
                                            {event.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}
