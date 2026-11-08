'use client';

import { isNavActive, navItems } from '@/components/layout/navItems';
import { CONTENT_WIDTH } from '@/lib/layout';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Topbar() {
    const pathname = usePathname();
    const [time, setTime] = useState<string>('00:00:00 LCL');

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();

            // Format to visitor's local system time (e.g., 14:05:23)
            const timeString = now.toLocaleTimeString(undefined, {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });

            // Extract the local short timezone code (e.g., SGT, EST, BST)
            const tzString = now
                .toLocaleTimeString(undefined, { timeZoneName: 'short' })
                .split(' ')
                .pop();

            setTime(`${timeString} ${tzString || ''}`);
        };

        updateClock();
        const intervalId = setInterval(updateClock, 1000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <header className='w-full border-b border-zinc-900/60 bg-zinc-950/70 sticky top-0 z-50 backdrop-blur-xl select-none pt-[env(safe-area-inset-top)]'>
            {/* Fine Red Accent Top Track */}
            <div className='h-0.5 w-full bg-linear-to-r from-red-600/20 via-red-600 to-red-600/20' />

            <div
                className={`${CONTENT_WIDTH} mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between`}
            >
                {/* 1. Left Side: Brand Logo Mark */}
                <Link
                    href='/'
                    className='flex items-center gap-3 active:scale-95 transition-transform duration-150'
                >
                    <div className='h-6 w-1 bg-red-600 rounded-sm shadow-[0_0_12px_rgba(220,38,38,0.5)]' />
                    <h1 className='text-xl font-black text-white tracking-widest uppercase font-mono'>
                        F1
                        <span className='text-red-500 font-sans font-light tracking-normal lowercase ml-0.5'>
                            pitwall
                        </span>
                    </h1>
                </Link>

                {/* 2. Center: Modular Application Navigation Bar (desktop; phones use the bottom bar) */}
                <nav
                    aria-label='Main'
                    className='hidden md:flex items-center gap-1 bg-zinc-900/40 border border-zinc-800/50 p-1.5 rounded-full backdrop-blur-md'
                >
                    {navItems.map((item) => {
                        const isActive = isNavActive(pathname, item.href);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={isActive ? 'page' : undefined}
                                className={`flex items-center gap-2.5 px-5 py-2 rounded-full font-medium text-xs tracking-wide transition-all duration-300 relative ${
                                    isActive
                                        ? 'text-white font-semibold'
                                        : 'text-zinc-400 hover:text-zinc-100'
                                }`}
                            >
                                {/* Active Capsule Ambient Background Tracking */}
                                {isActive && (
                                    <span className='absolute inset-0 bg-zinc-800/80 rounded-full border border-zinc-700/50 -z-10 shadow-inner' />
                                )}

                                <Icon
                                    className={`w-3.5 h-3.5 transition-transform duration-300 ${
                                        isActive
                                            ? 'text-red-500 scale-105'
                                            : 'text-zinc-400 group-hover:text-zinc-400'
                                    }`}
                                />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* 3. Right Side: Synced Live Local User Clock */}
                <div className='flex items-center gap-3'>
                    <div className='flex items-center gap-2 text-[10px] font-mono bg-zinc-900/90 border border-zinc-800/80 rounded-full pl-3 pr-3.5 py-1.5 shadow-xs min-w-28.75 justify-center'>
                        <div className='relative flex h-1.5 w-1.5 shrink-0'>
                            <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75' />
                            <span className='relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500' />
                        </div>
                        <span className='text-zinc-200 font-bold tracking-tight text-[10px] whitespace-nowrap'>
                            {time || '00:00:00 LCL'}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
