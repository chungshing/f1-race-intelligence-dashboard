interface Option<T extends string> {
    key: T;
    label: string;
}

interface Props<T extends string> {
    options: Option<T>[];
    value: T;
    onChange: (key: T) => void;
    label: string;
    className?: string;
}

export function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
    label,
    className = '',
}: Props<T>) {
    return (
        <div
            role='group'
            aria-label={label}
            className={`flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 ${className}`}
        >
            {options.map((option) => (
                <button
                    key={option.key}
                    aria-pressed={value === option.key}
                    onClick={() => onChange(option.key)}
                    className={`flex-1 px-3 py-1 text-[11px] font-bold uppercase rounded-md transition-all whitespace-nowrap ${
                        value === option.key
                            ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                            : 'text-zinc-400 hover:text-zinc-300'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
