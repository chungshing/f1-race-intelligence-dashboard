'use client';

import AppLayout from '@/components/layout/AppLayout';
import { TeamTable } from '@/components/table/TeamTable';
import { useTeamStandings } from '@/hooks/useStandings';

export default function ConstructorsPage() {
    const { data: teams = [], loading } = useTeamStandings();

    return (
        <AppLayout>
            <div className='relative pl-5 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-blue-500 before:rounded-full mb-6'>
                <span className='text-[10px] font-bold text-blue-500 tracking-widest uppercase'>
                    2026 Season
                </span>
                <h1 className='text-3xl font-black text-white tracking-tight mt-0.5'>
                    Constructor Standings
                </h1>
            </div>
            {loading ? (
                <div className='h-96 bg-zinc-900/40 border border-zinc-800/50 rounded-xl animate-pulse' />
            ) : (
                <TeamTable standings={teams} />
            )}
        </AppLayout>
    );
}