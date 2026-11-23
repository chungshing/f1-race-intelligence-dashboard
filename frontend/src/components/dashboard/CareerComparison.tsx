'use client';

import { useDriverCareer } from '@/hooks/useDriverCareer';

type Value = number | null | undefined;

function Row({
    label,
    a,
    b,
    decimals = 0,
    unit = '',
    highlight = true,
    pending,
}: {
    label: string;
    a: Value;
    b: Value;
    decimals?: number;
    unit?: string;
    highlight?: boolean;
    pending: boolean;
}) {
    const hasBoth = typeof a === 'number' && typeof b === 'number';
    const aWins = highlight && hasBoth && a > b;
    const bWins = highlight && hasBoth && b > a;

    const show = (v: Value) =>
        pending ? '…' : typeof v === 'number' ? `${v.toFixed(decimals)}${unit}` : '—';

    return (
        <div className='grid grid-cols-3 items-center border-b border-zinc-900 py-2 last:border-0'>
            <span
                className={`text-right font-mono text-sm ${aWins ? 'font-bold text-emerald-400' : 'text-zinc-300'}`}
            >
                {show(a)}
            </span>
            <span className='text-center text-[10px] uppercase tracking-wider text-zinc-500'>
                {label}
            </span>
            <span
                className={`text-left font-mono text-sm ${bWins ? 'font-bold text-emerald-400' : 'text-zinc-300'}`}
            >
                {show(b)}
            </span>
        </div>
    );
}

export function CareerComparison({
    driverAName,
    driverBName,
}: {
    driverAName: string;
    driverBName: string;
}) {
    const a = useDriverCareer(driverAName);
    const b = useDriverCareer(driverBName);

    if (a.isError && b.isError) return null;

    const pending = a.isPending || b.isPending;

    const rate = (value: Value, starts: Value) =>
        typeof value === 'number' && typeof starts === 'number' && starts > 0
            ? (value / starts) * 100
            : null;

    return (
        <div className='border-b border-zinc-900 px-6 py-3'>
            <h3 className='mb-1 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-400'>
                Career
            </h3>
            <Row label='Titles' a={a.data?.titles} b={b.data?.titles} pending={pending} />
            <Row label='Wins' a={a.data?.wins} b={b.data?.wins} pending={pending} />
            <Row label='Poles' a={a.data?.poles} b={b.data?.poles} pending={pending} />
            <Row label='Podiums' a={a.data?.podiums} b={b.data?.podiums} pending={pending} />
            <Row
                label='Win rate'
                a={rate(a.data?.wins, a.data?.starts)}
                b={rate(b.data?.wins, b.data?.starts)}
                decimals={1}
                unit='%'
                pending={pending}
            />
            <Row
                label='Race starts'
                a={a.data?.starts}
                b={b.data?.starts}
                highlight={false}
                pending={pending}
            />
        </div>
    );
}
