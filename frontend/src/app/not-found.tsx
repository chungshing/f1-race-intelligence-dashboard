import AppLayout from '@/components/layout/AppLayout';
import Link from 'next/link';

export default function NotFound() {
    return (
        <AppLayout>
            <div className='flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 px-4'>
                <div className='w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-mono text-xl'>
                    ?
                </div>
                <div className='space-y-1.5'>
                    <p className='text-zinc-200 font-bold tracking-tight'>Page not found</p>
                    <p className='text-zinc-400 text-xs leading-relaxed max-w-sm'>
                        This page doesn&apos;t exist or has moved. Head back to the dashboard.
                    </p>
                </div>
                <Link
                    href='/'
                    className='text-xs font-bold px-3 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 rounded-lg transition-colors'
                >
                    Back to Dashboard
                </Link>
            </div>
        </AppLayout>
    );
}
