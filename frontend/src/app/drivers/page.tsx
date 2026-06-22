'use client';

import AppLayout from '@/components/layout/AppLayout';
import { DriverTable } from '@/components/table/DriverTable';
import { useStandings } from '@/hooks/useStandings';

export default function DriversPage() {
    const { data: standings = [], loading } = useStandings();

    return (
        <AppLayout>
            <h1 className='text-2xl font-bold mb-6 text-zinc-100'>Drivers</h1>
            {loading ? (
                <p className='text-sm text-zinc-400 font-mono animate-pulse'>
                    Loading standings...
                </p>
            ) : (
                <DriverTable standings={standings} />
            )}
        </AppLayout>
    );
}
