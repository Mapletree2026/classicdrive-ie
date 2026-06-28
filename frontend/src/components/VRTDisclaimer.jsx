import { useState } from "react";
import { Info, ChevronDown } from "lucide-react";

export default function VRTDisclaimer() {
    const [open, setOpen] = useState(false);

    return (
        <div
            className="mt-6 border border-[color:var(--sa-border)] bg-[color:var(--sa-surface)]"
            data-testid="vrt-disclaimer"
        >
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white transition"
                data-testid="vrt-disclaimer-toggle"
            >
                <span className="inline-flex items-center gap-2">
                    <Info size={14} style={{ color: "var(--sa-brg)" }} />
                    <span className="font-mono-tech text-[10px] tracking-widest text-[color:var(--sa-text-2)]">
                        VRT, CUSTOMS &amp; VAT — REGIONAL IMPORT GUIDE
                    </span>
                </span>
                <ChevronDown
                    size={16}
                    className={`text-[color:var(--sa-text-2)] transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <div
                    className="px-5 pb-5 pt-1 border-t border-[color:var(--sa-border)] space-y-4"
                    data-testid="vrt-disclaimer-body"
                >
                    <div>
                        <div className="font-heading font-bold uppercase text-sm text-[color:var(--sa-brg)] mb-1">
                            VRT Note
                        </div>
                        <p className="font-mono-tech text-xs leading-relaxed text-[color:var(--sa-text)]">
                            All 30+ year old vehicles qualify for a flat{" "}
                            <span className="font-bold text-[color:var(--sa-brg)]">€200 Category C VRT</span>{" "}
                            and <span className="font-bold text-[color:var(--sa-brg)]">zero NOx levy</span>.
                        </p>
                    </div>

                    <div>
                        <div className="font-heading font-bold uppercase text-sm mb-1" style={{ color: "var(--sa-amber)" }}>
                            Customs &amp; VAT Warning
                        </div>
                        <ul className="font-mono-tech text-xs leading-relaxed text-[color:var(--sa-text)] space-y-2 list-none">
                            <li className="flex gap-2">
                                <span className="text-[color:var(--sa-brg)] font-bold shrink-0">•</span>
                                <span>
                                    <span className="font-bold text-[color:var(--sa-brg)]">From Great Britain (GB):</span>{" "}
                                    Subject to <span className="font-bold">10% Customs Duty</span> and Irish Import VAT
                                    (standard <span className="font-bold">23%</span>, or reduced{" "}
                                    <span className="font-bold">13.5%</span> for eligible historic items).
                                </span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-[color:var(--sa-brg)] font-bold shrink-0">•</span>
                                <span>
                                    <span className="font-bold text-[color:var(--sa-brg)]">From Northern Ireland (NI):</span>{" "}
                                    Exempt from Customs Duty and Import VAT provided you can supply an{" "}
                                    <span className="font-bold">NI V5C document</span> proving private ownership in NI,
                                    or proof of import under the{" "}
                                    <span className="font-bold">Windsor Framework</span>. Lacking this proof will
                                    result in full GB customs rates.
                                </span>
                            </li>
                        </ul>
                    </div>

                    <p className="font-mono-tech text-[10px] text-[color:var(--sa-text-2)] italic pt-2 border-t border-[color:var(--sa-border)]">
                        Indicative guidance only. Always confirm current rates with Revenue.ie before purchase.
                    </p>
                </div>
            )}
        </div>
    );
}
