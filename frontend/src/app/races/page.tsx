'use client';

import SeasonList from '@/components/dashboard/SeasonList';
import SeasonMap from '@/components/dashboard/SeasonMap';
import AppLayout from '@/components/layout/AppLayout';
import RaceWeekendCard from '@/components/table/RaceWeekendCard';
import { Card, CardBody, CardHeader, CardMeta } from '@/components/ui/Card';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRaceWeekends } from '@/hooks/useRaceWeekends';
import { getNextRaceWeekend } from '@/utils/race';
import { ChevronLeft, ChevronRight, Globe, Map as MapIcon, ZoomIn } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

export default function RacesPage() {
    usePageTitle('Races');
    const { data, loading, error } = useRaceWeekends();
    const [now] = useState(() => Date.now());
    const [picked, setPicked] = useState<number | null>(null);
    const [zoomed, setZoomed] = useState(true);
    const mapRef = useRef<HTMLDivElement | null>(null);

    const weekends = useMemo(
        () =>
            (data ?? [])
                .filter((w) => w.sessions?.length)
                .sort(
                    (a, b) =>
                        Math.min(...a.sessions.map((s) => Date.parse(s.dateStart))) -
                        Math.min(...b.sessions.map((s) => Date.parse(s.dateStart)))
                ),
        [data]
    );

    const nextRace = useMemo(() => getNextRaceWeekend(data || []), [data]);
    const nextKey = nextRace?.meetingKey ?? null;

    const pastKeys = useMemo(() => {
        const keys = new Set<number>();
        for (const w of weekends) {
            const race = w.sessions.find((s) => s.sessionName === 'Race');
            const end = Date.parse(race?.dateEnd || race?.dateStart || '');
            if (Number.isFinite(end) && end < now) keys.add(w.meetingKey);
        }
        return keys;
    }, [weekends, now]);

    const selectedKey = picked ?? nextKey ?? weekends[weekends.length - 1]?.meetingKey ?? null;
    const selectedIndex = weekends.findIndex((w) => w.meetingKey === selectedKey);
    const selected = selectedIndex >= 0 ? weekends[selectedIndex] : null;

    const step = (delta: number) => {
        if (weekends.length === 0) return;
        const next = (Math.max(selectedIndex, 0) + delta + weekends.length) % weekends.length;
        setPicked(weekends[next].meetingKey);
    };

    const selectFromList = (meetingKey: number) => {
        setPicked(meetingKey);
        mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (loading) {
        return (
            <AppLayout>
                <div className='flex items-center justify-center min-h-[50vh]'>
                    <div className='flex flex-col items-center gap-3 text-zinc-400'>
                        <div className='w-6 h-6 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin' />
                        <p className='text-xs font-semibold uppercase tracking-wider animate-pulse'>
                            Loading Race Calendar
                        </p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (error || !data?.length) {
        return (
            <AppLayout>
                <div className='max-w-md mx-auto text-center py-20 px-4 space-y-3'>
                    <p className='text-red-400 font-bold tracking-tight text-sm uppercase'>
                        Connection Error
                    </p>
                    <p className='text-zinc-400 text-xs'>
                        Failed to fetch the current season timeline. Please check your network
                        connection.
                    </p>
                </div>
            </AppLayout>
        );
    }

    const status = selected
        ? pastKeys.has(selected.meetingKey)
            ? 'Completed'
            : selected.meetingKey === nextKey
              ? 'Next race'
              : 'Upcoming'
        : '';

    const controlClass =
        'min-h-9 min-w-9 px-2.5 flex items-center justify-center gap-1.5 text-[11px] font-bold bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 rounded-lg transition-colors';

    return (
        <AppLayout>
            {/* Sticky Next Race Callout Block */}
            <RaceWeekendCard variant='sticky' data={nextRace} />

            <div className='space-y-6'>
                <div className='relative pl-4 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-blue-500 before:rounded-full'>
                    <h1 className='text-2xl font-black text-white tracking-tight uppercase'>
                        Race Calendar
                    </h1>
                </div>

                <div
                    ref={mapRef}
                    className='grid grid-cols-1 lg:grid-cols-3 gap-6 items-start scroll-mt-24'
                >
                    <div className='lg:col-span-2'>
                        <Card>
                            <CardHeader
                                icon={MapIcon}
                                title='Season Map'
                                subtitle={`${weekends.length} rounds`}
                                right={
                                    <div className='flex items-center gap-2'>
                                        <CardMeta>
                                            {selected ? `Round ${selectedIndex + 1}` : ''}
                                        </CardMeta>
                                        <button
                                            onClick={() => step(-1)}
                                            aria-label='Previous race'
                                            className={controlClass}
                                        >
                                            <ChevronLeft className='w-4 h-4' />
                                        </button>
                                        <button
                                            onClick={() => step(1)}
                                            aria-label='Next race'
                                            className={controlClass}
                                        >
                                            <ChevronRight className='w-4 h-4' />
                                        </button>
                                        <button
                                            onClick={() => setZoomed((z) => !z)}
                                            className={controlClass}
                                        >
                                            {zoomed ? (
                                                <Globe className='w-3.5 h-3.5' />
                                            ) : (
                                                <ZoomIn className='w-3.5 h-3.5' />
                                            )}
                                            {zoomed ? 'World' : 'Zoom'}
                                        </button>
                                    </div>
                                }
                            />
                            <CardBody className='p-2 sm:p-3'>
                                <SeasonMap
                                    weekends={weekends}
                                    selectedKey={selectedKey}
                                    nextKey={nextKey}
                                    pastKeys={pastKeys}
                                    zoomed={zoomed}
                                    onSelect={setPicked}
                                />
                            </CardBody>
                        </Card>
                    </div>

                    <RaceWeekendCard
                        variant='card'
                        data={selected}
                        label={selected ? `Round ${selectedIndex + 1} · ${status}` : undefined}
                    />
                </div>

                <SeasonList
                    weekends={weekends}
                    selectedKey={selectedKey}
                    nextKey={nextKey}
                    pastKeys={pastKeys}
                    onSelect={selectFromList}
                />
            </div>
        </AppLayout>
    );
}
