import { TABLE_CONTAINER_CLASS } from '@/utils/styles';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

// One look for every panel: same border, background, header strip and spacing.

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <div className={`${TABLE_CONTAINER_CLASS} ${className}`}>{children}</div>;
}

interface CardHeaderProps {
    title: string;
    icon?: LucideIcon;
    /** Muted text next to the title */
    subtitle?: string;
    /** Controls or a short label on the right */
    right?: ReactNode;
}

export function CardHeader({ title, icon: Icon, subtitle, right }: CardHeaderProps) {
    return (
        <div className='p-4 pl-5 border-b border-zinc-900 bg-zinc-900/20 flex flex-wrap items-center justify-between gap-x-4 gap-y-2'>
            <div className='flex flex-wrap items-center gap-x-2.5 gap-y-1 min-w-0'>
                {Icon && <Icon className='w-4 h-4 text-zinc-400 shrink-0' />}
                <h3 className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>
                    {title}
                </h3>
                {subtitle && (
                    <span className='text-[10px] font-medium text-zinc-400'>{subtitle}</span>
                )}
            </div>
            {right}
        </div>
    );
}

/** Small uppercase label for the right side of a CardHeader */
export function CardMeta({ children }: { children: ReactNode }) {
    return (
        <span className='text-[10px] text-zinc-400 font-medium uppercase tracking-wider'>
            {children}
        </span>
    );
}

export function CardBody({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    return <div className={`p-4 sm:p-5 ${className}`}>{children}</div>;
}

/** Footnote strip at the bottom of a card */
export function CardNote({ children }: { children: ReactNode }) {
    return (
        <p className='px-4 sm:px-5 py-3 border-t border-zinc-900 text-[10px] text-zinc-400 leading-relaxed'>
            {children}
        </p>
    );
}

/** Small tile for a single figure inside a card */
export function StatTile({
    label,
    children,
    className = '',
}: {
    label: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`rounded-lg border border-zinc-800/80 bg-zinc-950/60 px-3 py-2.5 min-w-0 ${className}`}
        >
            <p className='text-[10px] font-bold uppercase tracking-wider text-zinc-400'>{label}</p>
            {children}
        </div>
    );
}
