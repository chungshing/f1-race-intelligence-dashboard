'use client';

import AppLayout from '@/components/layout/AppLayout';
import { DriverTable } from '@/components/table/DriverTable';
import { useStandings } from '@/hooks/useStandings';
import { getRaceResults } from '@/lib/app';
import { buildRecentForm } from '@/utils/form';
import { SupabaseRaceResultRow } from '@/types/results';
import { useState, useEffect, useMemo } from 'react';

export default function DriversPage() {
    const { data: standings = [], loading } = useStandings();
    const [allRaceRows, setAllRaceRows] = useState<SupabaseRaceResultRow[]>([]);

    useEffect(() => {
        let isMounted = true;
        getRaceResults()
            .then((data) => {
                if (isMounted) setAllRaceRows(data);
            })
            .catch(console.error);
        return () => {
            isMounted = false;
        };
    }, []);

    const formMap = useMemo(() => {
        const rows = buildRecentForm(
            allRaceRows,
            standings.map((s) => s.driverNumber),
        );
        return Object.fromEntries(rows.map((r) => [r.driverNumber, r.results]));
    }, [allRaceRows, standings]);

    return (
        <AppLayout>
            <div className='relative pl-5 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-blue-500 before:rounded-full mb-6'>
                <span className='text-[10px] font-bold text-blue-500 tracking-widest uppercase'>
                    2026 Season
                </span>
                <h1 className='text-3xl font-black text-white tracking-tight mt-0.5'>
                    Driver Standings
                </h1>
            </div>
            {loading ? (
                <div className='h-96 bg-zinc-900/40 border border-zinc-800/50 rounded-xl animate-pulse' />
            ) : (
                <DriverTable standings={standings} formMap={formMap} />
            )}
        </AppLayout>
    );
}
