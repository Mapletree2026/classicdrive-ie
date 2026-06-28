export default function StatBar({ stats }) {
    if (!stats) return null;
    const items = [
        { label: "VEHICLES TRACKED", value: stats.total, color: "var(--sa-brg)" },
        { label: "VRT ELIGIBLE NOW", value: stats.eligible, color: "var(--sa-eligible)" },
        { label: "COUNTDOWN ACTIVE", value: stats.pending, color: "var(--sa-amber)" },
    ];
    return (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-px bg-[color:var(--sa-border)] border border-[color:var(--sa-border)]" data-testid="stat-bar">
            {items.map((it) => (
                <div key={it.label} className="bg-[color:var(--sa-surface)] px-6 py-5">
                    <div className="font-mono-tech text-[10px] tracking-widest text-[color:var(--sa-text-2)] mb-2">{it.label}</div>
                    <div className="font-heading font-black text-4xl" style={{ color: it.color }} data-testid={`stat-${it.label.toLowerCase().replace(/\s+/g, '-')}`}>{it.value}</div>
                </div>
            ))}
        </div>
    );
}
