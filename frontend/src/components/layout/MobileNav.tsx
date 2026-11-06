'use client';

import { isNavActive, navItems } from '@/components/layout/navItems';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileNav() {
    const pathname = usePathname();

    return (
        <nav
            aria-label='Main'
            className='md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-zinc-900/80 bg-zinc-950/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]'
        >
            <div className='grid grid-cols-4'>
                {navItems.map((item) => {
                    const isActive = isNavActive(pathname, item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={isActive ? 'page' : undefined}
                            className={`relative flex min-h-14 flex-col items-center justify-center gap-1 transition-colors active:bg-zinc-900/60 ${
                                isActive ? 'text-red-500' : 'text-zinc-400'
                            }`}
                        >
                            {isActive && (
                                <span className='absolute top-0 h-0.5 w-8 rounded-full bg-red-500' />
                            )}
                            <Icon className='h-5 w-5' />
                            <span className='text-[10px] font-medium tracking-wide'>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
