export default function StatBar({ stats }) {
    if (!stats) return null;

    const items = [
        { label: "VEHICLES TRACKED", value: stats.total, color: "text-white" },
        { label: "VRT ELIGIBLE NOW", value: stats.eligible, color: "text-[#00ff66]" },
        { label: "COUNTDOWN ACTIVE", value: stats.pending, color: "text-[#ff5500]" },
    ];

    return (
        <div
            className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/10 border border-white/10"
            data-testid="stat-bar"
        >
            {items.map((it) => (
                <div key={it.label} className="bg-[#0a0a0a] px-6 py-5">
                    <div className="font-mono-tech text-[10px] tracking-widest text-white/40 mb-2">
                        {it.label}
                    </div>
                    <div className={`font-heading font-black text-4xl ${it.color}`} data-testid={`stat-${it.label.toLowerCase().replace(/\s+/g, '-')}`}>
                        {it.value}
                    </div>
                </div>
            ))}
        </div>
    );
}
