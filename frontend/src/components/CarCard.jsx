import { Link } from "react-router-dom";
import { ArrowUpRight, Timer } from "lucide-react";
import { getCarImage } from "@/lib/images";

function formatDate(iso) {
    try { return new Date(iso).toLocaleDateString("en-IE", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase(); }
    catch { return iso; }
}

export default function CarCard({ car, index }) {
    const eligible = car.is_eligible;
    const delay = `${Math.min(index, 16) * 35}ms`;
    return (
        <Link to={`/car/${car.id}`}
            className="sa-fade-up group flex flex-col h-full bg-[color:var(--sa-surface)] border border-[color:var(--sa-border)] hover:border-[color:var(--sa-brg)] transition-colors duration-150 overflow-hidden"
            style={{ animationDelay: delay }} data-testid={`car-card-${car.id}`}>
            <div className="aspect-[16/10] overflow-hidden bg-[color:var(--sa-surface-2)] relative">
                <img
                    src={getCarImage(car)}
                    alt={car.car_name}
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-500"
                    loading="lazy"
                    data-testid="car-card-image"
                />
                <div className="absolute top-3 left-3 font-mono-tech text-[10px] tracking-widest px-2 py-1 bg-[color:var(--sa-bg)] border border-[color:var(--sa-border)] text-[color:var(--sa-text-2)]">
                    № {String(index + 1).padStart(3, "0")}
                </div>
                {eligible ? (
                    <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 text-[10px] font-heading font-bold uppercase"
                        style={{ background: 'var(--sa-eligible-soft)', color: 'var(--sa-eligible)', border: '1px solid var(--sa-eligible)' }}
                        data-testid="badge-eligible">👑 €200 VRT</div>
                ) : (
                    <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 text-[10px] font-heading font-bold uppercase sa-stopwatch"
                        style={{ background: 'var(--sa-amber-soft)', color: 'var(--sa-amber)', border: '1px solid var(--sa-amber)' }}
                        data-testid="badge-active">
                        <Timer size={10} />COUNTING
                    </div>
                )}
            </div>
            <div className="flex-1 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading font-black text-lg leading-tight text-[color:var(--sa-brg)]" data-testid="car-name">{car.car_name}</h3>
                    <ArrowUpRight size={14} className="text-[color:var(--sa-text-2)] group-hover:text-[color:var(--sa-brg)] shrink-0 mt-0.5 transition-colors" />
                </div>
                <div className="font-mono-tech text-[10px] text-[color:var(--sa-text-2)] flex items-center gap-2 mt-1.5" data-testid="car-category">
                    <span className="inline-block w-1.5 h-1.5 bg-[color:var(--sa-brg)]" />
                    {car.category.toUpperCase()}
                </div>
            </div>
            <div className="border-t border-[color:var(--sa-border)] grid grid-cols-3" data-testid="car-metric-row">
                <div className="px-3 py-2 border-r border-[color:var(--sa-border)]">
                    <div className="font-mono-tech text-[9px] text-[color:var(--sa-text-2)] tracking-widest">YEAR</div>
                    <div className="font-heading font-bold text-sm text-[color:var(--sa-brg)]" data-testid="metric-year">{new Date(car.launch_date).getFullYear()}</div>
                </div>
                <div className="px-3 py-2 border-r border-[color:var(--sa-border)]">
                    <div className="font-mono-tech text-[9px] text-[color:var(--sa-text-2)] tracking-widest">FREEDOM</div>
                    <div className="font-heading font-bold text-sm text-[color:var(--sa-brg)]" data-testid="car-vrt-date">{formatDate(car.vrt_freedom_date).slice(0, 11)}</div>
                </div>
                <div className="px-3 py-2">
                    <div className="font-mono-tech text-[9px] text-[color:var(--sa-text-2)] tracking-widest">{eligible ? "STATUS" : "LEFT"}</div>
                    <div className="font-heading font-bold text-sm" style={{ color: eligible ? 'var(--sa-eligible)' : 'var(--sa-amber)' }} data-testid="countdown-display">
                        {eligible ? "READY" : (car.countdown_display || "—").split(",")[0]}
                    </div>
                </div>
            </div>
        </Link>
    );
}
