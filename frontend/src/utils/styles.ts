export const getPositionColor = (position: number): string => {
    if (position === 1) return 'text-amber-400';
    if (position === 2) return 'text-zinc-300';
    if (position === 3) return 'text-amber-600';
    return 'text-zinc-100';
};

export const TABLE_CONTAINER_CLASS =
    'border border-zinc-800 rounded-xl overflow-x-auto bg-linear-to-b from-zinc-900 to-zinc-950 shadow-2xl';

export const TABLE_THEAD_CLASS =
    'border-b border-zinc-800 bg-zinc-900/40 text-xs font-semibold tracking-wider text-zinc-400 uppercase';
