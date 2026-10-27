'use client';

import { RaceSummary } from '@/utils/raceSummary';

const CHIP =
    'inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider';

const TONES = {
    yellow: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
    red: 'border-red-500/30 bg-red-500/10 text-red-400',
    sky: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
    zinc: 'border-zinc-700 bg-zinc-900 text-zinc-300',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
};

const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
    `${count} ${count === 1 ? singular : pluralForm}`;

export function RaceSummaryChips({ summary }: { summary: RaceSummary }) {
    const chips: { label: string; tone: keyof typeof TONES }[] = [];

    if (summary.safetyCars > 0) {
        chips.push({ label: plural(summary.safetyCars, 'Safety Car'), tone: 'yellow' });
    }
    if (summary.virtualSafetyCars > 0) {
        chips.push({ label: `${summary.virtualSafetyCars} VSC`, tone: 'yellow' });
    }
    if (summary.redFlags > 0) {
        chips.push({ label: plural(summary.redFlags, 'Red Flag'), tone: 'red' });
    }
    if (summary.safetyCars + summary.virtualSafetyCars + summary.redFlags === 0) {
        chips.push({ label: 'No interruptions', tone: 'emerald' });
    }
    if (summary.dnfs > 0) {
        chips.push({ label: plural(summary.dnfs, 'DNF'), tone: 'zinc' });
    }
    if (summary.wet) {
        chips.push({ label: 'Rain', tone: 'sky' });
    }

    return (
        <div className='flex flex-wrap gap-1.5'>
            {chips.map((chip) => (
                <span key={chip.label} className={`${CHIP} ${TONES[chip.tone]}`}>
                    {chip.label}
                </span>
            ))}
        </div>
    );
}
