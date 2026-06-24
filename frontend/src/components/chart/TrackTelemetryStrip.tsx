'use client';

import { useState, useEffect } from 'react';
import { getTelemetryStripSummary } from '@/lib/app';

interface TelemetrySummary {
    topSpeed: number;
    avgThrottle: number;
    drsZonesCount: number;
    trackTemp: number;
}

interface TelemetryStripProps {
    sessionKey: number;
}

export function TelemetryStrip({ sessionKey }: TelemetryStripProps) {
    const [summary, setSummary] = useState<TelemetrySummary | null>(null);
    const [prevSessionKey, setPrevSessionKey] = useState<number>(sessionKey);
    const [loading, setLoading] = useState(true);

    if (sessionKey !== prevSessionKey) {
        setPrevSessionKey(sessionKey);
        setLoading(true);
        setSummary(null);
    }

    useEffect(() => {
        let active = true;

        getTelemetryStripSummary(sessionKey)
            .then((data) => {
                if (!active) return;
                setSummary(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [sessionKey]);

    if (loading || !summary) {
        return (
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 w-full'>
                {[...Array(4)].map((_, idx) => (
                    <div key={idx} className='bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 animate-pulse h-20' />
                ))}
            </div>
        );
    }

    const metrics = [
        { label: 'Top Speed', value: `${summary.topSpeed} km/h`, color: 'text-white' },
        { label: 'Avg Throttle', value: `${summary.avgThrottle}%`, color: 'text-emerald-400' },
        { label: 'DRS Deployments', value: summary.drsZonesCount, color: 'text-blue-500' },
        { label: 'Track Temp', value: `${summary.trackTemp}°C`, color: 'text-orange-400' },
    ];

    return (
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 w-full'>
            {metrics.map((metric, idx) => (
                <div 
                    key={idx} 
                    className='bg-zinc-950/40 border border-zinc-900/60 rounded-xl p-4 flex flex-col justify-between shadow-sm backdrop-blur-sm'
                >
                    <span className='text-[10px] font-bold text-zinc-500 tracking-widest uppercase'>
                        {metric.label}
                    </span>
                    <span className={`text-xl font-black tracking-tight mt-1 ${metric.color}`}>
                        {metric.value}
                    </span>
                </div>
            ))}
        </div>
    );
}