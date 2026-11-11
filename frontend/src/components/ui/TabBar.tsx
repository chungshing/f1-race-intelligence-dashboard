'use client';

import { KeyboardEvent, useRef } from 'react';

interface Tab<T extends string> {
    key: T;
    label: string;
}

interface Props<T extends string> {
    tabs: Tab<T>[];
    active: T;
    onChange: (key: T) => void;
    label: string;
    idPrefix: string;
    className?: string;
}

export function TabBar<T extends string>({
    tabs,
    active,
    onChange,
    label,
    idPrefix,
    className = '',
}: Props<T>) {
    const refs = useRef<(HTMLButtonElement | null)[]>([]);

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
        let next = index;

        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;

        event.preventDefault();
        onChange(tabs[next].key);
        refs.current[next]?.focus();
    };

    return (
        <div
            role='tablist'
            aria-label={label}
            className={`flex space-x-6 border-b border-zinc-800/80 text-xs font-bold uppercase tracking-wider pb-px overflow-x-auto scrollbar-none ${className}`}
        >
            {tabs.map((tab, index) => {
                const selected = tab.key === active;

                return (
                    <button
                        key={tab.key}
                        ref={(element) => {
                            refs.current[index] = element;
                        }}
                        role='tab'
                        id={`${idPrefix}-tab-${tab.key}`}
                        aria-selected={selected}
                        aria-controls={`${idPrefix}-panel`}
                        tabIndex={selected ? 0 : -1}
                        onClick={() => onChange(tab.key)}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                        className={`pb-3 whitespace-nowrap transition-colors ${
                            selected
                                ? 'text-red-500 border-b-2 border-red-500 font-black'
                                : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
