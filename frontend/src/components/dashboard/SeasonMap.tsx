'use client';

import { findVenue } from '@/lib/venues';
import { RaceWeekend } from '@/types/race';
import { geoNaturalEarth1, geoPath, type GeoPermissibleObjects } from 'd3-geo';
import { useEffect, useMemo, useRef, useState } from 'react';
import { feature } from 'topojson-client';

const W = 680;
const H = 330;
const ZOOM = 4;

const projection = geoNaturalEarth1().fitExtent(
    [
        [10, 6],
        [670, 324],
    ],
    { type: 'Sphere' }
);
const pathGen = geoPath(projection);

interface Props {
    weekends: RaceWeekend[];
    selectedKey: number | null;
    nextKey: number | null;
    pastKeys: Set<number>;
    zoomed: boolean;
    onSelect: (meetingKey: number) => void;
}

interface View {
    cx: number;
    cy: number;
    k: number;
}

export default function SeasonMap({
    weekends,
    selectedKey,
    nextKey,
    pastKeys,
    zoomed,
    onSelect,
}: Props) {
    const [landPath, setLandPath] = useState('');

    useEffect(() => {
        let alive = true;
        import('@/data/land-110m.json').then((mod) => {
            if (!alive) return;
            const topo = (mod.default ?? mod) as unknown as { objects: { land: unknown } };
            const land = feature(topo as never, topo.objects.land as never);
            setLandPath(pathGen(land as unknown as GeoPermissibleObjects) ?? '');
        });
        return () => {
            alive = false;
        };
    }, []);

    const pins = useMemo(
        () =>
            weekends.flatMap((w) => {
                const venue = findVenue(w);
                const point = venue ? projection([venue.lon, venue.lat]) : null;
                return venue && point
                    ? [
                          {
                              key: w.meetingKey,
                              country: w.country,
                              lat: venue.lat,
                              lon: venue.lon,
                              x: point[0],
                              y: point[1],
                          },
                      ]
                    : [];
            }),
        [weekends]
    );

    const legs = useMemo(
        () =>
            pins.slice(0, -1).map((from, i) => {
                const to = pins[i + 1];
                return {
                    key: `${from.key}-${to.key}`,
                    done: pastKeys.has(to.key),
                    d:
                        pathGen({
                            type: 'LineString',
                            coordinates: [
                                [from.lon, from.lat],
                                [to.lon, to.lat],
                            ],
                        }) ?? '',
                };
            }),
        [pins, pastKeys]
    );

    const target = useMemo<View>(() => {
        const selected = pins.find((p) => p.key === selectedKey);
        return zoomed && selected
            ? { cx: selected.x, cy: selected.y, k: ZOOM }
            : { cx: W / 2, cy: H / 2, k: 1 };
    }, [pins, selectedKey, zoomed]);

    const [view, setView] = useState<View>(target);
    const viewRef = useRef<View>(view);

    useEffect(() => {
        const from = viewRef.current;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const start = performance.now();
        let frame = 0;

        const step = (now: number) => {
            const progress = reduceMotion ? 1 : Math.min(1, (now - start) / 700);
            const ease = 1 - Math.pow(1 - progress, 3);
            const next = {
                cx: from.cx + (target.cx - from.cx) * ease,
                cy: from.cy + (target.cy - from.cy) * ease,
                k: from.k + (target.k - from.k) * ease,
            };
            viewRef.current = next;
            setView(next);
            if (progress < 1) frame = requestAnimationFrame(step);
        };

        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
    }, [target]);

    const w = W / view.k;
    const h = H / view.k;
    const x = Math.min(Math.max(view.cx - w / 2, 0), W - w);
    const y = Math.min(Math.max(view.cy - h / 2, 0), H - h);
    const showLabels = view.k > 1.5;

    return (
        <svg
            viewBox={`${x} ${y} ${w} ${h}`}
            className='w-full h-auto block'
            role='img'
            aria-label='World map of the race calendar'
        >
            <path d={landPath} fill='#18181b' stroke='#27272a' strokeWidth={0.5 / view.k} />

            {legs.map((leg) => (
                <path
                    key={leg.key}
                    d={leg.d}
                    fill='none'
                    stroke={leg.done ? 'rgba(16,185,129,0.45)' : '#3f3f46'}
                    strokeWidth={0.8}
                    strokeDasharray={leg.done ? undefined : '3 3'}
                    vectorEffect='non-scaling-stroke'
                />
            ))}

            {pins.map((pin) => {
                const isSelected = pin.key === selectedKey;
                const isPast = pastKeys.has(pin.key);
                const isNext = pin.key === nextKey;
                const fill = isSelected ? '#ef4444' : isPast ? '#10b981' : '#52525b';

                return (
                    <g
                        key={pin.key}
                        transform={`translate(${pin.x} ${pin.y})`}
                        role='button'
                        tabIndex={0}
                        aria-label={pin.country}
                        className='cursor-pointer outline-none'
                        onClick={() => onSelect(pin.key)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onSelect(pin.key);
                            }
                        }}
                    >
                        <circle r={12 / view.k} fill='transparent' />
                        {isSelected && (
                            <circle
                                r={11 / view.k}
                                fill='none'
                                stroke='#ef4444'
                                strokeOpacity={0.35}
                                strokeWidth={2 / view.k}
                            />
                        )}
                        <circle
                            r={(isSelected ? 6 : 3.5) / view.k}
                            fill={fill}
                            stroke={isNext && !isSelected ? '#e4e4e7' : '#09090b'}
                            strokeWidth={1.2 / view.k}
                        />
                        {showLabels && (
                            <text
                                x={8 / view.k}
                                y={3 / view.k}
                                fontSize={10 / view.k}
                                fill={isSelected ? '#f4f4f5' : '#a1a1aa'}
                                fontWeight={isSelected ? 700 : 400}
                                style={{ pointerEvents: 'none' }}
                            >
                                {pin.country}
                            </text>
                        )}
                    </g>
                );
            })}
        </svg>
    );
}
