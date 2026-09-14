/**
 * ELYON Landing Page — CENA 01
 * Scroll-driven cinematic experience
 *
 * Architecture: Single sticky viewport (100vh) inside a tall scroll
 * container. scrollYProgress (0→1) drives all transforms.
 *
 * States (conceptual, not separate sections):
 *   0.00–0.14  Entrada      — Clean white canvas, Liz, title
 *   0.14–0.28  Aproximação  — Liz gains presence, label emerges
 *   0.28–0.44  Revelação    — First UI fragments + red thread
 *   0.44–0.58  Complexidade — More fragments, dispersion
 *   0.58–0.72  Convergência — Elements begin drawing together
 *   0.72–0.88  A Pergunta   — "Mas para quem…"
 *   0.88–1.00  Transição    — Bridge to Scene 02
 */

import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';

/* ────────────────────────────────────────────── */
/*                   COMPONENT                    */
/* ────────────────────────────────────────────── */

const Home: React.FC = () => {
    const navigate = useNavigate();
    const sceneRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);

    /* ── PWA standalone redirect ── */
    useEffect(() => {
        const isStandalone =
            (window.navigator as any).standalone ||
            window.matchMedia('(display-mode: standalone)').matches;
        if (isStandalone) navigate('/app-paciente', { replace: true });
    }, [navigate]);

    /* ── Responsive check ── */
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    /* ── Scroll progress ── */
    const { scrollYProgress } = useScroll({
        target: sceneRef,
        offset: ['start start', 'end end'],
    });

    /* ═══════════════════════════════════════════ */
    /*              SCROLL TRANSFORMS              */
    /* ═══════════════════════════════════════════ */

    // ── LIZ PHOTO ──
    const lizScale = useTransform(
        scrollYProgress,
        [0, 0.14, 0.32, 0.52, 0.72, 0.90],
        isMobile
            ? [1, 1.03, 1.07, 1.04, 1, 0.97]
            : [1, 1.05, 1.12, 1.08, 1.03, 1],
    );
    const lizX = useTransform(
        scrollYProgress,
        [0, 0.14, 0.32, 0.52, 0.72, 0.90],
        isMobile
            ? ['0%', '0%', '-4%', '-8%', '-14%', '-18%']
            : ['0%', '-4%', '-12%', '-26%', '-42%', '-52%'],
    );
    const lizY = useTransform(
        scrollYProgress,
        [0, 0.18, 0.38, 0.60, 0.82],
        isMobile
            ? ['0%', '-1%', '-3%', '-1%', '2%']
            : ['0%', '-2%', '-5%', '-2%', '3%'],
    );
    const lizOpacity = useTransform(
        scrollYProgress,
        [0, 0.62, 0.80, 0.94],
        [1, 1, 0.55, 0.25],
    );

    // ── MAIN TITLE "O cuidado não deveria ser fragmentado." ──
    const titleOpacity = useTransform(scrollYProgress, [0, 0.02, 0.14, 0.24], [0, 1, 1, 0]);
    const titleY = useTransform(scrollYProgress, [0, 0.02, 0.14, 0.24], [50, 0, 0, -60]);

    // ── LIZ label ──
    const lizLabelOpacity = useTransform(scrollYProgress, [0, 0.03, 0.22, 0.30], [0, 1, 1, 0]);

    // ── Tagline "Conecta. Coordena. Eleva." ──
    const taglineOpacity = useTransform(scrollYProgress, [0, 0.05, 0.16, 0.23], [0, 0.55, 0.55, 0]);

    // ── ELYON bottom center (initial) ──
    const elyonBottomOpacity = useTransform(scrollYProgress, [0, 0.03, 0.10, 0.16], [0, 0.4, 0.4, 0]);

    // ── Scroll indicator ──
    const scrollIndicatorOpacity = useTransform(scrollYProgress, [0, 0.04], [1, 0]);

    // ── RED THREAD ──
    const threadOpacity = useTransform(scrollYProgress, [0.18, 0.25, 0.86, 0.94], [0, 0.75, 0.75, 0]);
    const threadLength = useTransform(scrollYProgress, [0.20, 0.84], [0, 1]);

    // ── UI FRAGMENT 1: Prontuário panel ──
    const f1Opacity = useTransform(scrollYProgress, [0.26, 0.32, 0.58, 0.68], [0, 1, 1, 0]);
    const f1X = useTransform(scrollYProgress, [0.26, 0.32, 0.56, 0.68], [60, 0, 0, 120]);
    const f1Y = useTransform(scrollYProgress, [0.26, 0.32, 0.56, 0.68], [30, 0, 0, 80]);

    // ── UI FRAGMENT 2: Sinais vitais ──
    const f2Opacity = useTransform(scrollYProgress, [0.32, 0.38, 0.58, 0.68], [0, 1, 1, 0]);
    const f2X = useTransform(scrollYProgress, [0.32, 0.38, 0.56, 0.68], [-50, 0, 0, 70]);
    const f2Y = useTransform(scrollYProgress, [0.32, 0.38, 0.56, 0.68], [35, 0, 0, -50]);

    // ── UI FRAGMENT 3: Teleconsulta ──
    const f3Opacity = useTransform(scrollYProgress, [0.37, 0.43, 0.58, 0.68], [0, 1, 1, 0]);
    const f3X = useTransform(scrollYProgress, [0.37, 0.43, 0.56, 0.68], [-35, 0, 0, -80]);

    // ── UI FRAGMENT 4: Medicamentos ──
    const f4Opacity = useTransform(scrollYProgress, [0.42, 0.48, 0.58, 0.68], [0, 1, 1, 0]);
    const f4X = useTransform(scrollYProgress, [0.42, 0.48, 0.56, 0.68], [45, 0, 0, -60]);
    const f4Y = useTransform(scrollYProgress, [0.42, 0.48, 0.56, 0.68], [-25, 0, 0, 40]);

    // ── TEXT: "Por trás de cada atendimento…" ──
    const text2Opacity = useTransform(scrollYProgress, [0.35, 0.41, 0.50, 0.56], [0, 1, 1, 0]);
    const text2Y = useTransform(scrollYProgress, [0.35, 0.41], [28, 0]);

    // ── TEXT: "Muitos profissionais…" ──
    const text3Opacity = useTransform(scrollYProgress, [0.49, 0.55, 0.61, 0.66], [0, 1, 1, 0]);

    // ── THE QUESTION: "Mas para quem…" ──
    const questionOpacity = useTransform(scrollYProgress, [0.70, 0.77, 0.86, 0.92], [0, 1, 1, 0.85]);
    const questionY = useTransform(scrollYProgress, [0.70, 0.77], [40, 0]);

    // ── FINAL: "A resposta está no centro de tudo." ──
    const finalOpacity = useTransform(scrollYProgress, [0.85, 0.93], [0, 1]);
    const finalY = useTransform(scrollYProgress, [0.85, 0.93], [30, 0]);

    // ── End ELYON branding ──
    const endBrandOpacity = useTransform(scrollYProgress, [0.87, 0.95], [0, 0.7]);

    /* ═══════════════════════════════════════════ */
    /*                   RENDER                    */
    /* ═══════════════════════════════════════════ */

    return (
        <div
            className="bg-white overflow-x-hidden"
            style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: '#0a1526' }}
        >
            {/* ════════════════════════════════════ */}
            {/*              NAVBAR                  */}
            {/* ════════════════════════════════════ */}
            <nav className="fixed top-0 left-0 w-full z-[100] px-6 md:px-14 py-5 flex items-center justify-between pointer-events-none">
                <span
                    className="font-semibold text-[15px] tracking-[0.28em] pointer-events-auto cursor-pointer select-none"
                    style={{ color: '#0a1526' }}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    ELYON
                </span>

                <span className="hidden md:block text-[10px] tracking-[0.18em] uppercase font-medium" style={{ color: '#94a3b8' }}>
                    Sistema Operacional do Cuidado em Saúde
                </span>

                <button
                    onClick={() => navigate('/login')}
                    className="text-[12px] font-medium pointer-events-auto transition-colors duration-300"
                    style={{ color: '#94a3b8' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#0a1526')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                    Entrar
                </button>
            </nav>

            {/* ════════════════════════════════════ */}
            {/*             SCENE 01                 */}
            {/* ════════════════════════════════════ */}
            <section ref={sceneRef} style={{ height: isMobile ? '430vh' : '560vh' }}>
                <div className="sticky top-0 h-screen w-full overflow-hidden">

                    {/* ─── BACKGROUND ─── */}
                    <div className="absolute inset-0 bg-white" />

                    {/* ─── LIZ PHOTO LAYER ─── */}
                    <motion.div
                        className="absolute z-[5]
                            left-[6%] top-[6%] w-[88%] h-[44%]
                            md:left-auto md:right-0 md:top-0 md:w-[50%] md:h-full"
                        style={{
                            scale: lizScale,
                            x: lizX,
                            y: lizY,
                            opacity: lizOpacity,
                        }}
                    >
                        <img
                            src="/liz-front.jpg"
                            alt="LIZ — Coordenadora do Cuidado"
                            className="w-full h-full object-cover select-none"
                            style={{ objectPosition: 'center 18%' }}
                            draggable={false}
                            loading="eager"
                        />
                        {/* Edge fades — blend photo into white canvas */}
                        <div
                            className="absolute left-0 top-0 h-full pointer-events-none"
                            style={{
                                width: '50%',
                                background: 'linear-gradient(to right, white 0%, rgba(255,255,255,0.65) 40%, transparent 100%)',
                            }}
                        />
                        <div
                            className="absolute bottom-0 left-0 w-full pointer-events-none"
                            style={{
                                height: '35%',
                                background: 'linear-gradient(to top, white 0%, rgba(255,255,255,0.3) 60%, transparent 100%)',
                            }}
                        />
                        <div
                            className="absolute top-0 left-0 w-full pointer-events-none"
                            style={{
                                height: '12%',
                                background: 'linear-gradient(to bottom, rgba(255,255,255,0.35) 0%, transparent 100%)',
                            }}
                        />
                        {/* Right edge fade (mobile only, desktop extends to edge) */}
                        <div
                            className="absolute right-0 top-0 h-full pointer-events-none md:hidden"
                            style={{
                                width: '25%',
                                background: 'linear-gradient(to left, white 0%, transparent 100%)',
                            }}
                        />
                    </motion.div>

                    {/* ─── LIZ LABEL ─── */}
                    <motion.div
                        className="absolute z-[12]
                            left-[58%] top-[42%]
                            md:left-auto md:right-[14%] md:top-[22%]"
                        style={{ opacity: lizLabelOpacity }}
                    >
                        <p
                            className="text-[14px] md:text-[15px] font-semibold tracking-[0.22em] uppercase"
                            style={{ color: '#0a1526' }}
                        >
                            LIZ
                        </p>
                        <p
                            className="text-[10px] md:text-[11px] tracking-[0.06em] mt-0.5 font-medium"
                            style={{ color: '#94a3b8' }}
                        >
                            Coordenadora do Cuidado
                        </p>
                    </motion.div>

                    {/* ─── MAIN TITLE ─── */}
                    <motion.div
                        className="absolute z-[20]
                            left-6 bottom-[18%] max-w-[92%]
                            md:left-14 md:bottom-auto md:top-1/2 md:max-w-[42%]"
                        style={{
                            opacity: titleOpacity,
                            y: titleY,
                        }}
                    >
                        <h1
                            className="text-[2.2rem] leading-[1.08] tracking-[-0.02em]
                                       sm:text-[2.8rem]
                                       md:text-[3.4rem]
                                       lg:text-[4.2rem]"
                            style={{ color: '#0a1526' }}
                        >
                            <span className="font-light">
                                O cuidado
                                <br />
                                não deveria ser
                            </span>
                            <br />
                            <span className="font-bold">fragmentado.</span>
                        </h1>
                    </motion.div>

                    {/* ─── TAGLINE ─── */}
                    <motion.div
                        className="absolute z-[20]
                            left-6 bottom-[10%]
                            md:left-14 md:bottom-[14%]"
                        style={{ opacity: taglineOpacity }}
                    >
                        <p
                            className="text-[9px] md:text-[10px] tracking-[0.35em] uppercase font-medium"
                            style={{ color: '#94a3b8' }}
                        >
                            Conecta.&nbsp; Coordena.&nbsp; Eleva.
                        </p>
                    </motion.div>

                    {/* ─── ELYON (bottom center, initial state) ─── */}
                    <motion.div
                        className="absolute z-[20] bottom-6 left-1/2 -translate-x-1/2 text-center hidden md:block"
                        style={{ opacity: elyonBottomOpacity }}
                    >
                        <p
                            className="text-[11px] tracking-[0.25em] font-medium"
                            style={{ color: '#b0bec5' }}
                        >
                            ELYON
                        </p>
                    </motion.div>

                    {/* ─── RED THREAD — Desktop: SVG path ─── */}
                    <motion.svg
                        className="absolute inset-0 w-full h-full z-[8] pointer-events-none hidden md:block"
                        viewBox="0 0 1440 900"
                        preserveAspectRatio="xMidYMid slice"
                        fill="none"
                        style={{ opacity: threadOpacity }}
                    >
                        <motion.path
                            d="M 110 810 C 130 690 195 620 280 560 C 365 500 310 340 250 210 C 190 80 490 95 720 155 C 950 215 980 370 1080 400 C 1180 430 1260 340 1350 290"
                            stroke="#B91C2E"
                            strokeWidth="1.3"
                            strokeLinecap="round"
                            style={{ pathLength: threadLength }}
                        />
                        {/* Connection nodes */}
                        <motion.circle cx="280" cy="560" r="2.5" fill="#B91C2E" style={{ opacity: f1Opacity }} />
                        <motion.circle cx="250" cy="210" r="2.5" fill="#B91C2E" style={{ opacity: f2Opacity }} />
                        <motion.circle cx="720" cy="155" r="2.5" fill="#B91C2E" style={{ opacity: f3Opacity }} />
                        <motion.circle cx="1080" cy="400" r="2.5" fill="#B91C2E" style={{ opacity: f4Opacity }} />
                    </motion.svg>

                    {/* ─── RED THREAD — Mobile: vertical line ─── */}
                    <motion.div
                        className="absolute z-[8] pointer-events-none md:hidden"
                        style={{
                            left: 24,
                            top: '18%',
                            width: 1,
                            height: '64%',
                            opacity: threadOpacity,
                        }}
                    >
                        <motion.div
                            style={{
                                width: '100%',
                                height: '100%',
                                background: '#B91C2E',
                                transformOrigin: 'top',
                                scaleY: threadLength,
                            }}
                        />
                    </motion.div>

                    {/* ─── UI FRAGMENT 1: Prontuário ─── */}
                    <motion.div
                        className="absolute z-[15]
                            left-[4%] top-[56%]
                            md:left-[7%] md:top-[16%]"
                        style={{ opacity: f1Opacity, x: f1X, y: f1Y }}
                    >
                        <div
                            className="w-[170px] md:w-[190px] rounded-xl p-4 backdrop-blur-sm overflow-hidden"
                            style={{
                                background: 'rgba(255,255,255,0.92)',
                                border: '1px solid rgba(226,232,240,0.6)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
                            }}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-[6px] h-[6px] rounded-full" style={{ background: '#0a1526' }} />
                                <span className="text-[11px] font-semibold tracking-wide" style={{ color: '#0a1526' }}>
                                    Prontuário
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full" style={{ background: '#f1f5f9' }} />
                                    <div>
                                        <p className="text-[10px] font-semibold" style={{ color: '#0a1526' }}>Carlos Henrique</p>
                                        <p className="text-[9px]" style={{ color: '#94a3b8' }}>58 anos</p>
                                    </div>
                                </div>
                                <div className="space-y-1.5 mt-2">
                                    <div className="h-[5px] rounded-full" style={{ width: '82%', background: '#f1f5f9' }} />
                                    <div className="h-[5px] rounded-full" style={{ width: '64%', background: '#f1f5f9' }} />
                                    <div className="h-[5px] rounded-full" style={{ width: '73%', background: '#f8fafc' }} />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* ─── UI FRAGMENT 2: Sinais Vitais ─── */}
                    <motion.div
                        className="absolute z-[15]
                            left-[8%] bottom-[16%]
                            md:left-[22%] md:bottom-[22%]"
                        style={{ opacity: f2Opacity, x: f2X, y: f2Y }}
                    >
                        <div
                            className="w-[155px] md:w-[168px] rounded-xl p-3.5 backdrop-blur-sm"
                            style={{
                                background: 'rgba(255,255,255,0.92)',
                                border: '1px solid rgba(226,232,240,0.6)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
                            }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>
                                    PA
                                </span>
                                <span className="text-[13px] font-bold" style={{ color: '#0a1526' }}>138/88</span>
                            </div>
                            <svg viewBox="0 0 120 28" className="w-full" style={{ height: 22 }}>
                                <polyline
                                    points="0,20 12,17 24,22 36,14 48,10 60,16 72,8 84,12 96,15 108,11 120,14"
                                    fill="none"
                                    stroke="#B91C2E"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <div className="flex items-center justify-between mt-1.5">
                                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>
                                    FC
                                </span>
                                <span className="text-[11px] font-semibold" style={{ color: '#64748b' }}>72 bpm</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* ─── UI FRAGMENT 3: Teleconsulta (desktop only) ─── */}
                    {!isMobile && (
                        <motion.div
                            className="absolute z-[15] left-[40%] top-[10%]"
                            style={{ opacity: f3Opacity, x: f3X }}
                        >
                            <div
                                className="w-[148px] rounded-xl p-3 backdrop-blur-sm"
                                style={{
                                    background: 'rgba(255,255,255,0.92)',
                                    border: '1px solid rgba(226,232,240,0.6)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
                                }}
                            >
                                <div
                                    className="w-full rounded-lg mb-2 flex items-center justify-center"
                                    style={{ height: 56, background: '#f8fafc' }}
                                >
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#ecfdf5' }}>
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} />
                                    </div>
                                </div>
                                <p className="text-[10px] font-semibold" style={{ color: '#0a1526' }}>
                                    Dr. Silva
                                </p>
                                <p className="text-[9px]" style={{ color: '#94a3b8' }}>
                                    Cardiologia · Conectado
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── UI FRAGMENT 4: Medicamentos (desktop only) ─── */}
                    {!isMobile && (
                        <motion.div
                            className="absolute z-[15] right-[10%] bottom-[28%]"
                            style={{ opacity: f4Opacity, x: f4X, y: f4Y }}
                        >
                            <div
                                className="w-[156px] rounded-xl p-3 backdrop-blur-sm"
                                style={{
                                    background: 'rgba(255,255,255,0.92)',
                                    border: '1px solid rgba(226,232,240,0.6)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
                                }}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <div
                                        className="w-5 h-5 rounded-md flex items-center justify-center text-[9px]"
                                        style={{ background: '#eff6ff' }}
                                    >
                                        💊
                                    </div>
                                    <span className="text-[11px] font-semibold" style={{ color: '#0a1526' }}>
                                        Losartana
                                    </span>
                                </div>
                                <p className="text-[10px] ml-7" style={{ color: '#94a3b8' }}>50mg · 08:00</p>
                                <div className="flex items-center gap-1 ml-7 mt-1">
                                    <div className="w-3 h-3 rounded-full flex items-center justify-center" style={{ background: '#ecfdf5' }}>
                                        <span className="text-[7px]" style={{ color: '#10b981' }}>✓</span>
                                    </div>
                                    <span className="text-[9px] font-medium" style={{ color: '#10b981' }}>Tomado</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── TEXT 2: "Por trás de cada atendimento…" ─── */}
                    <motion.div
                        className="absolute z-[22]
                            right-[6%] top-[58%] max-w-[180px]
                            md:right-[12%] md:top-[38%] md:max-w-[210px]"
                        style={{ opacity: text2Opacity, y: text2Y }}
                    >
                        <div style={{ borderLeft: '2px solid #B91C2E', paddingLeft: 14 }}>
                            <p
                                className="text-[12px] md:text-[14px] font-medium leading-relaxed"
                                style={{ color: '#0a1526' }}
                            >
                                Por trás de cada
                                <br />
                                atendimento, existe
                                <br />
                                uma jornada.
                            </p>
                        </div>
                    </motion.div>

                    {/* ─── TEXT 3: "Muitos profissionais…" ─── */}
                    <motion.div
                        className="absolute z-[22]
                            left-6 bottom-[10%] max-w-[200px]
                            md:left-14 md:bottom-[12%] md:max-w-[220px]"
                        style={{ opacity: text3Opacity }}
                    >
                        <p
                            className="text-[11px] md:text-[12px] leading-relaxed font-light"
                            style={{ color: '#94a3b8' }}
                        >
                            Muitos profissionais.
                            <br />
                            Diversos sistemas.
                            <br />
                            Informações espalhadas.
                        </p>
                    </motion.div>

                    {/* ─── THE QUESTION ─── */}
                    <motion.div
                        className="absolute z-[25] inset-0 flex items-center
                            justify-center px-8
                            md:justify-end md:pr-[10%] md:px-0"
                        style={{ opacity: questionOpacity, y: questionY }}
                    >
                        <div
                            className="max-w-[280px] md:max-w-[300px]"
                            style={{ borderLeft: '2.5px solid #B91C2E', paddingLeft: 18 }}
                        >
                            <p
                                className="text-[1.15rem] md:text-[1.35rem] font-medium leading-snug"
                                style={{ color: '#0a1526' }}
                            >
                                Mas para quem todo esse cuidado está sendo{' '}
                                <span className="font-bold">coordenado?</span>
                            </p>
                        </div>
                    </motion.div>

                    {/* ─── FINAL: ELYON branding (bottom-left) ─── */}
                    <motion.div
                        className="absolute z-[27] bottom-[10%] left-6 md:left-14"
                        style={{ opacity: endBrandOpacity, y: finalY }}
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-px mt-1 flex-shrink-0" style={{ height: 36, background: '#B91C2E' }} />
                            <div>
                                <p
                                    className="font-semibold text-[14px] tracking-[0.22em]"
                                    style={{ color: '#0a1526' }}
                                >
                                    ELYON
                                </p>
                                <p className="text-[10px] tracking-wide mt-0.5" style={{ color: '#94a3b8' }}>
                                    Sistema Operacional do Cuidado em Saúde
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* ─── FINAL: "A resposta…" (bottom-right) ─── */}
                    <motion.div
                        className="absolute z-[27]
                            bottom-[10%] right-6
                            md:right-[10%]"
                        style={{ opacity: finalOpacity, y: finalY }}
                    >
                        <div style={{ borderLeft: '2px solid #B91C2E', paddingLeft: 14 }}>
                            <p
                                className="text-[13px] md:text-[14px] font-medium leading-snug"
                                style={{ color: '#0a1526' }}
                            >
                                A resposta está
                                <br />
                                no centro de tudo.
                            </p>
                        </div>
                    </motion.div>

                    {/* ─── SCROLL INDICATOR ─── */}
                    <motion.div
                        className="absolute z-[30] bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center"
                        style={{ opacity: scrollIndicatorOpacity }}
                    >
                        <motion.div
                            className="w-px rounded-full"
                            style={{
                                height: 32,
                                background: 'linear-gradient(to bottom, transparent, #cbd5e1)',
                            }}
                            animate={{ y: [0, 6, 0] }}
                            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                        />
                        <span
                            className="text-[8px] tracking-[0.35em] uppercase font-medium mt-2"
                            style={{ color: '#94a3b8' }}
                        >
                            scroll
                        </span>
                    </motion.div>
                </div>
            </section>

            {/* ════════════════════════════════════ */}
            {/*        SCENE 02 — PLACEHOLDER        */}
            {/* ════════════════════════════════════ */}
            <section className="relative min-h-[60vh] bg-white flex items-center justify-center">
                {/* Red thread continuation — bridge element */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-px"
                    style={{
                        height: 80,
                        background: 'linear-gradient(to bottom, #B91C2E, transparent)',
                    }}
                />

                <div className="text-center mt-16">
                    <p className="text-[10px] tracking-[0.2em] uppercase font-medium" style={{ color: '#cbd5e1' }}>
                        Cena 02 · Em breve
                    </p>
                </div>
            </section>

            {/* ══════ MINIMAL ACCESS ══════ */}
            <div className="fixed bottom-6 right-6 z-[90]">
                <button
                    onClick={() => navigate('/app-paciente')}
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
                    style={{
                        background: '#0a1526',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}
                    title="App do Paciente"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Home;
