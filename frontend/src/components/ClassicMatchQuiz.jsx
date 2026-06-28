import { useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { QUIZ_QUESTIONS } from "@/lib/quizData";
import { getCarImage } from "@/lib/images";
import { ChevronRight, Sparkles, RotateCcw, Timer, ArrowRight } from "lucide-react";

export default function ClassicMatchQuiz() {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [matches, setMatches] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const q = QUIZ_QUESTIONS[step];
    const isLast = step === QUIZ_QUESTIONS.length - 1;
    const progress = ((step + (matches ? 1 : 0)) / (QUIZ_QUESTIONS.length + 1)) * 100;

    const pick = async (option) => {
        const nextAnswers = { ...answers, [q.id]: option.value };
        setAnswers(nextAnswers);
        if (!isLast) {
            setStep(step + 1);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.post("/quiz/match", nextAnswers, { params: { limit: 6 } });
            setMatches(data.matches || []);
        } catch (e) {
            setError(e?.response?.data?.detail || e.message);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setStep(0);
        setAnswers({});
        setMatches(null);
        setError(null);
    };

    return (
        <section
            className="border-y border-[color:var(--sa-border)] bg-[color:var(--sa-surface)]"
            data-testid="classic-match-quiz"
        >
            <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16">
                <div className="grid md:grid-cols-[280px_1fr] gap-10 items-start">
                    <div>
                        <div className="inline-flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-[color:var(--sa-text-2)] mb-3">
                            <Sparkles size={12} style={{ color: "var(--sa-amber)" }} />
                            INTERACTIVE FINDER
                        </div>
                        <h2 className="font-heading font-black text-3xl md:text-4xl uppercase text-[color:var(--sa-brg)] leading-[0.95]" data-testid="quiz-title">
                            What classic<br />suits you?
                        </h2>
                        <p className="font-mono-tech text-xs text-[color:var(--sa-text-2)] mt-4 leading-relaxed">
                            Five rapid questions. Instant matches from 217 hand-picked future classics. No sign-up.
                        </p>
                        <div className="mt-6 h-1 bg-[color:var(--sa-border)] overflow-hidden">
                            <div
                                className="h-full bg-[color:var(--sa-brg)] transition-all duration-300"
                                style={{ width: `${progress}%` }}
                                data-testid="quiz-progress"
                            />
                        </div>
                        <div className="font-mono-tech text-[10px] text-[color:var(--sa-text-2)] mt-2">
                            {matches ? "MATCHES" : `STEP ${step + 1} / ${QUIZ_QUESTIONS.length}`}
                        </div>
                    </div>

                    <div className="min-h-[280px]">
                        {!matches && !loading && (
                            <div data-testid={`quiz-step-${step}`}>
                                <div className="font-mono-tech text-[10px] tracking-widest text-[color:var(--sa-text-2)] mb-2">
                                    QUESTION {step + 1} OF {QUIZ_QUESTIONS.length}
                                </div>
                                <h3 className="font-heading font-bold text-2xl md:text-3xl text-[color:var(--sa-brg)] mb-1">
                                    {q.title}
                                </h3>
                                <p className="font-mono-tech text-xs text-[color:var(--sa-text-2)] mb-6">{q.subtitle}</p>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {q.options.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => pick(opt)}
                                            className="text-left px-4 py-4 bg-white border border-[color:var(--sa-border)] hover:border-[color:var(--sa-brg)] hover:bg-[color:var(--sa-surface-2)] transition group"
                                            data-testid={`quiz-option-${q.id}-${opt.value}`}
                                        >
                                            <div className="font-heading font-bold text-sm md:text-base text-[color:var(--sa-brg)] flex items-center justify-between gap-2">
                                                <span>{opt.label}</span>
                                                <ChevronRight size={16} className="text-[color:var(--sa-text-2)] group-hover:text-[color:var(--sa-brg)] group-hover:translate-x-0.5 transition" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                {step > 0 && (
                                    <button
                                        onClick={() => setStep(step - 1)}
                                        className="mt-6 font-mono-tech text-[11px] text-[color:var(--sa-text-2)] hover:text-[color:var(--sa-brg)] underline"
                                        data-testid="quiz-back-button"
                                    >
                                        ← Back
                                    </button>
                                )}
                            </div>
                        )}

                        {loading && (
                            <div className="font-mono-tech text-sm text-[color:var(--sa-text-2)] py-20" data-testid="quiz-loading">
                                MATCHING YOUR PROFILE TO THE REGISTRY...
                            </div>
                        )}

                        {error && (
                            <div className="font-mono-tech text-sm py-20" style={{ color: "var(--sa-sell)" }} data-testid="quiz-error">
                                {error}
                            </div>
                        )}

                        {matches && !loading && (
                            <div data-testid="quiz-results">
                                <div className="flex items-baseline justify-between mb-5">
                                    <div>
                                        <div className="font-mono-tech text-[10px] tracking-widest text-[color:var(--sa-text-2)] mb-1">
                                            TOP {matches.length} MATCHES
                                        </div>
                                        <h3 className="font-heading font-black text-2xl md:text-3xl text-[color:var(--sa-brg)] uppercase">
                                            Your shortlist
                                        </h3>
                                    </div>
                                    <button
                                        onClick={reset}
                                        className="inline-flex items-center gap-1.5 font-mono-tech text-[11px] text-[color:var(--sa-text-2)] hover:text-[color:var(--sa-brg)]"
                                        data-testid="quiz-reset"
                                    >
                                        <RotateCcw size={12} /> Retake
                                    </button>
                                </div>

                                {matches.length === 0 ? (
                                    <div className="font-mono-tech text-xs text-[color:var(--sa-text-2)]" data-testid="quiz-empty">
                                        No close matches. Try retaking with broader preferences.
                                    </div>
                                ) : (
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {matches.map((m, idx) => (
                                            <Link
                                                to={`/car/${m.id}`}
                                                key={m.id}
                                                className="bg-white border border-[color:var(--sa-border)] hover:border-[color:var(--sa-brg)] transition group flex flex-col"
                                                data-testid={`quiz-match-${idx}`}
                                                style={{ animation: `sa-fade-up 0.4s ease both`, animationDelay: `${idx * 60}ms` }}
                                            >
                                                <div className="aspect-[16/10] overflow-hidden bg-[color:var(--sa-surface-2)]">
                                                    <img
                                                        src={getCarImage(m)}
                                                        alt={m.car_name}
                                                        className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-300"
                                                        loading="lazy"
                                                    />
                                                </div>
                                                <div className="p-4 flex flex-col gap-2 flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-mono-tech text-[9px] uppercase tracking-widest text-[color:var(--sa-text-2)]">
                                                            {m.category}
                                                        </span>
                                                        <span
                                                            className="font-mono-tech text-[10px] font-bold px-2 py-0.5"
                                                            style={{ background: "var(--sa-amber-soft)", color: "var(--sa-amber)" }}
                                                            data-testid={`quiz-match-score-${idx}`}
                                                        >
                                                            {m.match_score} pts
                                                        </span>
                                                    </div>
                                                    <div className="font-heading font-bold text-base text-[color:var(--sa-brg)] leading-snug" data-testid={`quiz-match-name-${idx}`}>
                                                        {m.car_name}
                                                    </div>
                                                    <div className="mt-auto pt-2 flex items-center justify-between text-[11px] font-mono-tech">
                                                        <span className="inline-flex items-center gap-1" style={{ color: m.is_eligible ? "var(--sa-eligible)" : "var(--sa-amber)" }}>
                                                            <Timer size={11} />
                                                            {m.is_eligible ? "VRT eligible" : m.countdown_display}
                                                        </span>
                                                        <ArrowRight size={12} className="text-[color:var(--sa-text-2)] group-hover:text-[color:var(--sa-brg)] group-hover:translate-x-0.5 transition" />
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
