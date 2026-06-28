import { ExternalLink } from "lucide-react";

function formatDate(iso) {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString("en-IE", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).toUpperCase();
    } catch {
        return iso;
    }
}

export default function CarCard({ car, index }) {
    const eligible = car.is_eligible;
    const delay = `${Math.min(index, 16) * 35}ms`;

    return (
        <article
            className="sa-fade-up group flex flex-col h-full bg-[#111111] border border-white/10 hover:border-white/30 hover:bg-[#1a1a1a] transition-colors duration-150 ease-out"
            style={{ animationDelay: delay }}
            data-testid={`car-card-${car.id}`}
        >
            {/* Top bar — index + freedom date */}
            <div className="flex items-center justify-between px-5 pt-5 font-mono-tech text-[10px] text-white/40">
                <span data-testid="car-index">№ {String(index + 1).padStart(3, "0")}</span>
                <span data-testid="car-vrt-date">FREEDOM · {formatDate(car.vrt_freedom_date)}</span>
            </div>

            {/* Body */}
            <div className="flex-1 px-5 py-4">
                <h3
                    className="font-heading font-black text-2xl leading-[1.05] text-white mb-3"
                    data-testid="car-name"
                >
                    {car.car_name}
                </h3>
                <div className="font-mono-tech text-[11px] text-white/40 flex items-center gap-2" data-testid="car-category">
                    <span className="inline-block w-1.5 h-1.5 bg-white/40" />
                    {car.category.toUpperCase()}
                </div>
            </div>

            {/* Status footer */}
            <div className="border-t border-white/10 px-5 py-4">
                {eligible ? (
                    <div
                        className="inline-flex items-center gap-2 px-2 py-1 text-xs font-heading font-bold uppercase bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30"
                        data-testid="badge-eligible"
                    >
                        <span>👑 €200 FLAT VRT ELIGIBLE</span>
                    </div>
                ) : (
                    <>
                        <div
                            className="inline-flex items-center gap-2 px-2 py-1 text-xs font-heading font-bold uppercase bg-[#ff5500]/10 text-[#ff5500] border border-[#ff5500]/30"
                            data-testid="badge-active"
                        >
                            <span>⏳ COUNTDOWN ACTIVE</span>
                        </div>
                        <div
                            className={[
                                "mt-3 font-mono-tech",
                                car.time_left_days <= 30
                                    ? "text-base font-bold text-[#ff5500]"
                                    : "text-sm text-white/80",
                            ].join(" ")}
                            data-testid="countdown-display"
                        >
                            {car.countdown_display}
                        </div>
                    </>
                )}

                {car.external_link && (
                    <a
                        href={car.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 font-mono-tech text-[10px] text-white/50 hover:text-white"
                        data-testid="car-external-link"
                    >
                        <ExternalLink size={11} /> SOURCE
                    </a>
                )}
            </div>
        </article>
    );
}
