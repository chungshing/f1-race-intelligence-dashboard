export const getPositionColor = (position: number): string => {
    if (position === 1) return 'text-amber-400';
    if (position === 2) return 'text-zinc-300';
    if (position === 3) return 'text-amber-600';
    return 'text-zinc-100';
};

export const TABLE_CONTAINER_CLASS =
    'border border-zinc-800 rounded-xl overflow-x-auto bg-linear-to-b from-zinc-900 to-zinc-950';

export const TABLE_THEAD_CLASS =
    'border-b border-zinc-800 bg-zinc-900/40 text-xs font-semibold tracking-wider text-zinc-400 uppercase';

// Fixed-height scroll area with a pinned table header. Desktop only; phones just scroll the page.
export const SCROLL_PANEL_CLASS =
    'overflow-x-auto md:max-h-[38rem] md:overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent md:[&_thead_th]:sticky md:[&_thead_th]:top-0 md:[&_thead_th]:z-10 md:[&_thead_th]:bg-zinc-900';
