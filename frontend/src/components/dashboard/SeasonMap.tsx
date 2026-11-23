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

interface Pin {
    key: number;
    country: string;
    lat: number;
    lon: number;
    x: number;
    y: number;
}

interface Placement {
    dx: number;
    dy: number;
    anchor: 'start' | 'end';
}

interface Box {
    l: number;
    r: number;
    t: number;
    b: number;
}

// Label offsets in screen pixels, tried in order until one doesn't collide.
const CHAR_W = 5.6;
const CANDIDATES: Placement[] = [
    { dx: 8, dy: 3, anchor: 'start' },
    { dx: -8, dy: 3, anchor: 'end' },
    { dx: 6, dy: -8, anchor: 'start' },
    { dx: -6, dy: -8, anchor: 'end' },
    { dx: 6, dy: 16, anchor: 'start' },
    { dx: -6, dy: 16, anchor: 'end' },
    { dx: 8, dy: -20, anchor: 'start' },
    { dx: -8, dy: -20, anchor: 'end' },
    { dx: 8, dy: 28, anchor: 'start' },
    { dx: -8, dy: 28, anchor: 'end' },
];

const overlaps = (a: Box, b: Box) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;

function placeLabels(pins: Pin[], k: number, cx: number, cy: number, selectedKey: number | null) {
    const out = new Map<number, Placement>();
    const halfW = W / (2 * k);
    const halfH = H / (2 * k);

    const visible = pins.filter((p) => Math.abs(p.x - cx) <= halfW && Math.abs(p.y - cy) <= halfH);

    const dots: Box[] = visible.map((p) => {
        const r = p.key === selectedKey ? 12 : 5;
        return { l: p.x * k - r, r: p.x * k + r, t: p.y * k - r, b: p.y * k + r };
    });

    // Selected pin first, then outward from the centre of the view.
    const order = [...visible].sort(
        (a, b) =>
            (a.key === selectedKey ? -1 : b.key === selectedKey ? 1 : 0) ||
            Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy)
    );

    const placed: Box[] = [];
    for (const pin of order) {
        const width = pin.country.length * CHAR_W;
        const px = pin.x * k;
        const py = pin.y * k;

        let best = CANDIDATES[0];
        let bestBox: Box | null = null;
        let bestScore = Infinity;

        for (const c of CANDIDATES) {
            const left = c.anchor === 'start' ? px + c.dx : px + c.dx - width;
            const box: Box = { l: left, r: left + width, t: py + c.dy - 9, b: py + c.dy + 2 };
            const score =
                placed.filter((p) => overlaps(box, p)).length * 2 +
                dots.filter((d) => overlaps(box, d)).length;

            if (score < bestScore) {
                best = c;
                bestBox = box;
                bestScore = score;
                if (score === 0) break;
            }
        }

        if (bestBox) placed.push(bestBox);
        out.set(pin.key, best);
    }

    return out;
}

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

    const pins = useMemo<Pin[]>(
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

    // Labels are placed for the view we're heading to, so they don't jump during the zoom.
    const placements = useMemo(
        () => placeLabels(pins, target.k, target.cx, target.cy, selectedKey),
        [pins, target, selectedKey]
    );

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
                const label = placements.get(pin.key) ?? CANDIDATES[0];

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
                                x={label.dx / view.k}
                                y={label.dy / view.k}
                                textAnchor={label.anchor}
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
