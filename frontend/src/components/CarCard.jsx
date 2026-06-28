import { Link } from "react-router-dom";
import { ArrowUpRight, Timer } from "lucide-react";

function formatDate(iso) {
    try { return new Date(iso).toLocaleDateString("en-IE", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase(); }
    catch { return iso; }
}

export default function CarCard({ car, index }) {
    const eligible = car.is_eligible;
    const delay = `${Math.min(index, 16) * 35}ms`;
    return (
        <Link to={`/car/${car.id}`}
            className="sa-fade-up group flex flex-col h-full bg-[color:var(--sa-surface)] border border-[color:var(--sa-border)] hover:border-[color:var(--sa-brg)] transition-colors duration-150"
            style={{ animationDelay: delay }} data-testid={`car-card-${car.id}`}>
            <div className="flex items-center justify-between px-5 pt-5 font-mono-tech text-[10px] text-[color:var(--sa-text-2)]">
                <span data-testid="car-index">№ {String(index + 1).padStart(3, "0")}</span>
                <span data-testid="car-vrt-date">FREEDOM · {formatDate(car.vrt_freedom_date)}</span>
            </div>
            <div className="flex-1 px-5 py-4">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading font-black text-2xl leading-[1.05] text-[color:var(--sa-brg)] mb-3" data-testid="car-name">{car.car_name}</h3>
                    <ArrowUpRight size={16} className="text-[color:var(--sa-text-2)] group-hover:text-[color:var(--sa-brg)] shrink-0 transition-colors" />
                </div>
                <div className="font-mono-tech text-[11px] text-[color:var(--sa-text-2)] flex items-center gap-2" data-testid="car-category">
                    <span className="inline-block w-1.5 h-1.5 bg-[color:var(--sa-brg)]" />
                    {car.category.toUpperCase()}
                </div>
            </div>
            <div className="border-t border-[color:var(--sa-border)] px-5 py-4 bg-[color:var(--sa-surface-2)]">
                {eligible ? (
                    <div className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-heading font-bold uppercase"
                        style={{ background: 'var(--sa-eligible-soft)', color: 'var(--sa-eligible)', border: '1px solid var(--sa-eligible)' }}
                        data-testid="badge-eligible">
                        <span>👑 €200 FLAT VRT ELIGIBLE</span>
                    </div>
                ) : (
                    <>
                        <div className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-heading font-black uppercase sa-stopwatch tracking-wider"
                            style={{ background: 'var(--sa-amber-soft)', color: 'var(--sa-amber)', border: '1.5px solid var(--sa-amber)' }}
                            data-testid="badge-active">
                            <Timer size={13} />
                            <span>COUNTDOWN ACTIVE</span>
                        </div>
                        <div className={["mt-3 font-mono-tech",
                            car.time_left_days <= 30 ? "text-base font-bold" : "text-sm"
                        ].join(" ")} style={{ color: car.time_left_days <= 30 ? 'var(--sa-amber)' : 'var(--sa-text)' }} data-testid="countdown-display">
                            {car.countdown_display}
                        </div>
                    </>
                )}
            </div>
        </Link>
    );
}
