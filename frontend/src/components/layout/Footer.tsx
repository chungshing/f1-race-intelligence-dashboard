export default function Footer() {
    return (
        <footer className='border-t border-zinc-900 py-4 px-6'>
            <div className='max-w-7xl mx-auto flex items-center justify-between'>
                <span className='text-[10px] font-mono text-zinc-600 uppercase tracking-widest'>
                    F1 Pitwall · Data via OpenF1
                </span>
                <span className='text-[10px] font-mono text-zinc-700'>
                    Not affiliated with Formula 1
                </span>
            </div>
        </footer>
    );
}