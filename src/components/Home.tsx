/**
 * ELYON Landing Page — CENA 01 + CENA 02
 * Scroll-driven cinematic experience
 *
 * CENA 01: Liz, coordenação, fragmentação → "Mas para quem?"
 * CENA 02: O paciente no centro → camadas do cuidado → telemedicina hint
 *
 * Architecture: Two sticky viewports in sequence, each with independent
 * scrollYProgress (0→1). The transition between scenes is seamless — the
 * red thread bridges them visually.
 */

import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';

/* ────────────────────────────────────────────── */
/*                   COMPONENT                    */
/* ────────────────────────────────────────────── */

const Home: React.FC = () => {
    const navigate = useNavigate();
    const scene01Ref = useRef<HTMLDivElement>(null);
    const scene02Ref = useRef<HTMLDivElement>(null);
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

    /* ═══════════════════════════════════════════════ */
    /*          SCENE 01 — SCROLL TRANSFORMS           */
    /* ═══════════════════════════════════════════════ */

    const { scrollYProgress: s1 } = useScroll({
        target: scene01Ref,
        offset: ['start start', 'end end'],
    });

    // ── LIZ PHOTO ──
    const lizScale = useTransform(s1,
        [0, 0.14, 0.32, 0.52, 0.72, 0.90],
        isMobile ? [1, 1.03, 1.07, 1.04, 1, 0.97] : [1, 1.05, 1.12, 1.08, 1.03, 1],
    );
    const lizX = useTransform(s1,
        [0, 0.14, 0.32, 0.52, 0.72, 0.90],
        isMobile ? ['0%', '0%', '-4%', '-8%', '-14%', '-18%'] : ['0%', '-4%', '-12%', '-26%', '-42%', '-52%'],
    );
    const lizY = useTransform(s1,
        [0, 0.18, 0.38, 0.60, 0.82],
        isMobile ? ['0%', '-1%', '-3%', '-1%', '2%'] : ['0%', '-2%', '-5%', '-2%', '3%'],
    );
    const lizOpacity = useTransform(s1, [0, 0.62, 0.80, 0.94], [1, 1, 0.55, 0.25]);

    // ── MAIN TITLE ──
    const titleOpacity = useTransform(s1, [0, 0.14, 0.24], [1, 1, 0]);
    const titleY = useTransform(s1, [0, 0.14, 0.24], [0, 0, -60]);

    // ── LIZ label ──
    const lizLabelOpacity = useTransform(s1, [0, 0.22, 0.30], [1, 1, 0]);

    // ── Tagline ──
    const taglineOpacity = useTransform(s1, [0, 0.16, 0.23], [0.55, 0.55, 0]);

    // ── ELYON bottom center ──
    const elyonBottomOpacity = useTransform(s1, [0, 0.10, 0.16], [0.4, 0.4, 0]);

    // ── Scroll indicator ──
    const scrollIndicatorOpacity = useTransform(s1, [0, 0.04], [1, 0]);

    // ── RED THREAD ──
    const threadOpacity = useTransform(s1, [0.18, 0.25, 0.86, 0.94], [0, 0.75, 0.75, 0]);
    const threadLength = useTransform(s1, [0.20, 0.84], [0, 1]);

    // ── UI FRAGMENT 1: Prontuário ──
    const f1Opacity = useTransform(s1, [0.26, 0.32, 0.58, 0.68], [0, 1, 1, 0]);
    const f1X = useTransform(s1, [0.26, 0.32, 0.56, 0.68], [60, 0, 0, 120]);
    const f1Y = useTransform(s1, [0.26, 0.32, 0.56, 0.68], [30, 0, 0, 80]);

    // ── UI FRAGMENT 2: Sinais vitais ──
    const f2Opacity = useTransform(s1, [0.32, 0.38, 0.58, 0.68], [0, 1, 1, 0]);
    const f2X = useTransform(s1, [0.32, 0.38, 0.56, 0.68], [-50, 0, 0, 70]);
    const f2Y = useTransform(s1, [0.32, 0.38, 0.56, 0.68], [35, 0, 0, -50]);

    // ── UI FRAGMENT 3: Teleconsulta ──
    const f3Opacity = useTransform(s1, [0.37, 0.43, 0.58, 0.68], [0, 1, 1, 0]);
    const f3X = useTransform(s1, [0.37, 0.43, 0.56, 0.68], [-35, 0, 0, -80]);

    // ── UI FRAGMENT 4: Medicamentos ──
    const f4Opacity = useTransform(s1, [0.42, 0.48, 0.58, 0.68], [0, 1, 1, 0]);
    const f4X = useTransform(s1, [0.42, 0.48, 0.56, 0.68], [45, 0, 0, -60]);
    const f4Y = useTransform(s1, [0.42, 0.48, 0.56, 0.68], [-25, 0, 0, 40]);

    // ── TEXT: "Por trás de cada atendimento…" ──
    const text2Opacity = useTransform(s1, [0.35, 0.41, 0.50, 0.56], [0, 1, 1, 0]);
    const text2Y = useTransform(s1, [0.35, 0.41], [28, 0]);

    // ── TEXT: "Muitos profissionais…" ──
    const text3Opacity = useTransform(s1, [0.49, 0.55, 0.61, 0.66], [0, 1, 1, 0]);

    // ── THE QUESTION ──
    const questionOpacity = useTransform(s1, [0.70, 0.77, 0.86, 0.92], [0, 1, 1, 0.85]);
    const questionY = useTransform(s1, [0.70, 0.77], [40, 0]);

    // ── FINAL: "A resposta…" ──
    const finalOpacity = useTransform(s1, [0.85, 0.93], [0, 1]);
    const finalY = useTransform(s1, [0.85, 0.93], [30, 0]);

    // ── End ELYON branding ──
    const endBrandOpacity = useTransform(s1, [0.87, 0.95], [0, 0.7]);

    /* ═══════════════════════════════════════════════ */
    /*          SCENE 02 — SCROLL TRANSFORMS           */
    /* ═══════════════════════════════════════════════ */

    const { scrollYProgress: s2 } = useScroll({
        target: scene02Ref,
        offset: ['start start', 'end end'],
    });

    // ── Bridge red thread (top of scene 02) ──
    const bridgeOpacity = useTransform(s2, [0, 0.06, 0.12], [0.8, 0.5, 0]);

    // ── Convergence dot ──
    const dotScale = useTransform(s2, [0, 0.08, 0.18], [0, 1, 0]);
    const dotOpacity = useTransform(s2, [0, 0.04, 0.14, 0.20], [0, 0.6, 0.6, 0]);

    // ── PATIENT PHOTO ──
    const patientScale = useTransform(s2,
        [0.06, 0.18, 0.35, 0.55, 0.75, 0.92],
        isMobile ? [0.6, 0.85, 1, 1.04, 1, 0.96] : [0.5, 0.8, 1, 1.06, 1.02, 0.98],
    );
    const patientOpacity = useTransform(s2,
        [0.06, 0.16, 0.30, 0.85, 0.95],
        [0, 0.4, 1, 1, 0.7],
    );
    const patientX = useTransform(s2,
        [0.06, 0.30, 0.55, 0.80, 0.95],
        isMobile ? ['0%', '0%', '0%', '-5%', '-8%'] : ['0%', '0%', '0%', '-10%', '-18%'],
    );
    const patientY = useTransform(s2,
        [0.06, 0.30, 0.55, 0.80],
        isMobile ? ['8%', '0%', '-2%', '0%'] : ['5%', '0%', '-3%', '0%'],
    );

    // ── TEXT: "E no centro de tudo," ──
    const centerText1Opacity = useTransform(s2, [0.38, 0.45, 0.58, 0.72], [0, 1, 1, 0]);
    const centerText1Y = useTransform(s2, [0.38, 0.45], [35, 0]);

    // ── TEXT: "uma pessoa." ──
    const centerText2Opacity = useTransform(s2, [0.46, 0.54, 0.62, 0.72], [0, 1, 1, 0]);
    const centerText2Y = useTransform(s2, [0.46, 0.54], [30, 0]);

    // ── "Paciente" label ──
    const patientLabelOpacity = useTransform(s2, [0.28, 0.35, 0.68, 0.76], [0, 0.8, 0.8, 0]);

    // ── CARE LAYER 1: Consulta notification ──
    const cl1Opacity = useTransform(s2, [0.58, 0.64, 0.82, 0.90], [0, 1, 1, 0]);
    const cl1X = useTransform(s2, [0.58, 0.64, 0.82, 0.90], isMobile ? [30, 0, 0, 40] : [50, 0, 0, 60]);
    const cl1Y = useTransform(s2, [0.58, 0.64, 0.82, 0.90], [20, 0, 0, 15]);

    // ── CARE LAYER 2: Medicamento ──
    const cl2Opacity = useTransform(s2, [0.63, 0.69, 0.82, 0.90], [0, 1, 1, 0]);
    const cl2X = useTransform(s2, [0.63, 0.69, 0.82, 0.90], isMobile ? [-25, 0, 0, -35] : [-40, 0, 0, -50]);

    // ── CARE LAYER 3: Exame (desktop only) ──
    const cl3Opacity = useTransform(s2, [0.67, 0.73, 0.82, 0.90], [0, 1, 1, 0]);
    const cl3X = useTransform(s2, [0.67, 0.73, 0.82, 0.90], [35, 0, 0, 40]);

    // ── CARE LAYER 4: Liz subtle reference ──
    const cl4Opacity = useTransform(s2, [0.70, 0.76, 0.84, 0.90], [0, 0.8, 0.8, 0]);

    // ── Red thread (scene 02) ──
    const thread2Opacity = useTransform(s2, [0.55, 0.62, 0.90, 0.97], [0, 0.6, 0.6, 0]);
    const thread2Length = useTransform(s2, [0.58, 0.88], [0, 1]);

    // ── TELEMEDICINE HINT ──
    const teleHintOpacity = useTransform(s2, [0.82, 0.89, 0.97], [0, 1, 1]);
    const teleHintScale = useTransform(s2, [0.82, 0.92], [0.85, 1]);
    const teleHintY = useTransform(s2, [0.82, 0.92], [25, 0]);

    // ── End text: "Como esse cuidado começa?" ──
    const endQuestionOpacity = useTransform(s2, [0.88, 0.95], [0, 1]);
    const endQuestionY = useTransform(s2, [0.88, 0.95], [20, 0]);

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

            {/* ══════════════════════════════════════════ */}
            {/*                 SCENE 01                   */}
            {/* ══════════════════════════════════════════ */}
            <section ref={scene01Ref} style={{ height: isMobile ? '430vh' : '560vh' }}>
                <div className="sticky top-0 h-screen w-full overflow-hidden">

                    <div className="absolute inset-0 bg-white" />

                    {/* ─── LIZ PHOTO LAYER ─── */}
                    <motion.div
                        className="absolute z-[5]
                            left-[6%] top-[6%] w-[88%] h-[44%]
                            md:left-auto md:right-0 md:top-0 md:w-[50%] md:h-full"
                        style={{ scale: lizScale, x: lizX, y: lizY, opacity: lizOpacity }}
                    >
                        <img src="/liz-front.jpg" alt="LIZ — Coordenadora do Cuidado"
                            className="w-full h-full object-cover select-none" style={{ objectPosition: 'center 18%' }}
                            draggable={false} loading="eager" />
                        <div className="absolute left-0 top-0 h-full pointer-events-none" style={{ width: '50%', background: 'linear-gradient(to right, white 0%, rgba(255,255,255,0.65) 40%, transparent 100%)' }} />
                        <div className="absolute bottom-0 left-0 w-full pointer-events-none" style={{ height: '35%', background: 'linear-gradient(to top, white 0%, rgba(255,255,255,0.3) 60%, transparent 100%)' }} />
                        <div className="absolute top-0 left-0 w-full pointer-events-none" style={{ height: '12%', background: 'linear-gradient(to bottom, rgba(255,255,255,0.35) 0%, transparent 100%)' }} />
                        <div className="absolute right-0 top-0 h-full pointer-events-none md:hidden" style={{ width: '25%', background: 'linear-gradient(to left, white 0%, transparent 100%)' }} />
                    </motion.div>

                    {/* ─── LIZ LABEL ─── */}
                    <motion.div className="absolute z-[12] left-[58%] top-[42%] md:left-auto md:right-[14%] md:top-[22%]" style={{ opacity: lizLabelOpacity }}>
                        <p className="text-[14px] md:text-[15px] font-semibold tracking-[0.22em] uppercase" style={{ color: '#0a1526' }}>LIZ</p>
                        <p className="text-[10px] md:text-[11px] tracking-[0.06em] mt-0.5 font-medium" style={{ color: '#94a3b8' }}>Coordenadora do Cuidado</p>
                    </motion.div>

                    {/* ─── MAIN TITLE ─── */}
                    <motion.div className="absolute z-[20] left-6 bottom-[18%] max-w-[92%] md:left-14 md:bottom-auto md:top-1/2 md:max-w-[42%]" style={{ opacity: titleOpacity, y: titleY }}>
                        <h1 className="text-[2.2rem] leading-[1.08] tracking-[-0.02em] sm:text-[2.8rem] md:text-[3.4rem] lg:text-[4.2rem]" style={{ color: '#0a1526' }}>
                            <span className="font-light">O cuidado<br />não deveria ser</span><br />
                            <span className="font-bold">fragmentado.</span>
                        </h1>
                    </motion.div>

                    {/* ─── TAGLINE ─── */}
                    <motion.div className="absolute z-[20] left-6 bottom-[10%] md:left-14 md:bottom-[14%]" style={{ opacity: taglineOpacity }}>
                        <p className="text-[9px] md:text-[10px] tracking-[0.35em] uppercase font-medium" style={{ color: '#94a3b8' }}>Conecta.&nbsp; Coordena.&nbsp; Eleva.</p>
                    </motion.div>

                    {/* ─── ELYON bottom ─── */}
                    <motion.div className="absolute z-[20] bottom-6 left-1/2 -translate-x-1/2 text-center hidden md:block" style={{ opacity: elyonBottomOpacity }}>
                        <p className="text-[11px] tracking-[0.25em] font-medium" style={{ color: '#b0bec5' }}>ELYON</p>
                    </motion.div>

                    {/* ─── RED THREAD — Desktop SVG ─── */}
                    <motion.svg className="absolute inset-0 w-full h-full z-[8] pointer-events-none hidden md:block" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none" style={{ opacity: threadOpacity }}>
                        <motion.path d="M 110 810 C 130 690 195 620 280 560 C 365 500 310 340 250 210 C 190 80 490 95 720 155 C 950 215 980 370 1080 400 C 1180 430 1260 340 1350 290" stroke="#B91C2E" strokeWidth="1.3" strokeLinecap="round" style={{ pathLength: threadLength }} />
                        <motion.circle cx="280" cy="560" r="2.5" fill="#B91C2E" style={{ opacity: f1Opacity }} />
                        <motion.circle cx="250" cy="210" r="2.5" fill="#B91C2E" style={{ opacity: f2Opacity }} />
                        <motion.circle cx="720" cy="155" r="2.5" fill="#B91C2E" style={{ opacity: f3Opacity }} />
                        <motion.circle cx="1080" cy="400" r="2.5" fill="#B91C2E" style={{ opacity: f4Opacity }} />
                    </motion.svg>

                    {/* ─── RED THREAD — Mobile vertical ─── */}
                    <motion.div className="absolute z-[8] pointer-events-none md:hidden" style={{ left: 24, top: '18%', width: 1, height: '64%', opacity: threadOpacity }}>
                        <motion.div style={{ width: '100%', height: '100%', background: '#B91C2E', transformOrigin: 'top', scaleY: threadLength }} />
                    </motion.div>

                    {/* ─── UI FRAGMENT 1: Prontuário ─── */}
                    <motion.div className="absolute z-[15] left-[4%] top-[56%] md:left-[7%] md:top-[16%]" style={{ opacity: f1Opacity, x: f1X, y: f1Y }}>
                        <div className="w-[170px] md:w-[190px] rounded-xl p-4 backdrop-blur-sm overflow-hidden" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(226,232,240,0.6)', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-[6px] h-[6px] rounded-full" style={{ background: '#0a1526' }} />
                                <span className="text-[11px] font-semibold tracking-wide" style={{ color: '#0a1526' }}>Prontuário</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full" style={{ background: '#f1f5f9' }} /><div><p className="text-[10px] font-semibold" style={{ color: '#0a1526' }}>Carlos Henrique</p><p className="text-[9px]" style={{ color: '#94a3b8' }}>58 anos</p></div></div>
                                <div className="space-y-1.5 mt-2"><div className="h-[5px] rounded-full" style={{ width: '82%', background: '#f1f5f9' }} /><div className="h-[5px] rounded-full" style={{ width: '64%', background: '#f1f5f9' }} /><div className="h-[5px] rounded-full" style={{ width: '73%', background: '#f8fafc' }} /></div>
                            </div>
                        </div>
                    </motion.div>

                    {/* ─── UI FRAGMENT 2: Sinais Vitais ─── */}
                    <motion.div className="absolute z-[15] left-[8%] bottom-[16%] md:left-[22%] md:bottom-[22%]" style={{ opacity: f2Opacity, x: f2X, y: f2Y }}>
                        <div className="w-[155px] md:w-[168px] rounded-xl p-3.5 backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(226,232,240,0.6)', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
                            <div className="flex items-center justify-between mb-2"><span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>PA</span><span className="text-[13px] font-bold" style={{ color: '#0a1526' }}>138/88</span></div>
                            <svg viewBox="0 0 120 28" className="w-full" style={{ height: 22 }}><polyline points="0,20 12,17 24,22 36,14 48,10 60,16 72,8 84,12 96,15 108,11 120,14" fill="none" stroke="#B91C2E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <div className="flex items-center justify-between mt-1.5"><span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>FC</span><span className="text-[11px] font-semibold" style={{ color: '#64748b' }}>72 bpm</span></div>
                        </div>
                    </motion.div>

                    {/* ─── UI FRAGMENT 3: Teleconsulta (desktop) ─── */}
                    {!isMobile && (
                        <motion.div className="absolute z-[15] left-[40%] top-[10%]" style={{ opacity: f3Opacity, x: f3X }}>
                            <div className="w-[148px] rounded-xl p-3 backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(226,232,240,0.6)', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
                                <div className="w-full rounded-lg mb-2 flex items-center justify-center" style={{ height: 56, background: '#f8fafc' }}><div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#ecfdf5' }}><div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} /></div></div>
                                <p className="text-[10px] font-semibold" style={{ color: '#0a1526' }}>Dr. Silva</p>
                                <p className="text-[9px]" style={{ color: '#94a3b8' }}>Cardiologia · Conectado</p>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── UI FRAGMENT 4: Medicamentos (desktop) ─── */}
                    {!isMobile && (
                        <motion.div className="absolute z-[15] right-[10%] bottom-[28%]" style={{ opacity: f4Opacity, x: f4X, y: f4Y }}>
                            <div className="w-[156px] rounded-xl p-3 backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(226,232,240,0.6)', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
                                <div className="flex items-center gap-2 mb-1"><div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px]" style={{ background: '#eff6ff' }}>💊</div><span className="text-[11px] font-semibold" style={{ color: '#0a1526' }}>Losartana</span></div>
                                <p className="text-[10px] ml-7" style={{ color: '#94a3b8' }}>50mg · 08:00</p>
                                <div className="flex items-center gap-1 ml-7 mt-1"><div className="w-3 h-3 rounded-full flex items-center justify-center" style={{ background: '#ecfdf5' }}><span className="text-[7px]" style={{ color: '#10b981' }}>✓</span></div><span className="text-[9px] font-medium" style={{ color: '#10b981' }}>Tomado</span></div>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── TEXT 2 ─── */}
                    <motion.div className="absolute z-[22] right-[6%] top-[58%] max-w-[180px] md:right-[12%] md:top-[38%] md:max-w-[210px]" style={{ opacity: text2Opacity, y: text2Y }}>
                        <div style={{ borderLeft: '2px solid #B91C2E', paddingLeft: 14 }}>
                            <p className="text-[12px] md:text-[14px] font-medium leading-relaxed" style={{ color: '#0a1526' }}>Por trás de cada<br />atendimento, existe<br />uma jornada.</p>
                        </div>
                    </motion.div>

                    {/* ─── TEXT 3 ─── */}
                    <motion.div className="absolute z-[22] left-6 bottom-[10%] max-w-[200px] md:left-14 md:bottom-[12%] md:max-w-[220px]" style={{ opacity: text3Opacity }}>
                        <p className="text-[11px] md:text-[12px] leading-relaxed font-light" style={{ color: '#94a3b8' }}>Muitos profissionais.<br />Diversos sistemas.<br />Informações espalhadas.</p>
                    </motion.div>

                    {/* ─── THE QUESTION ─── */}
                    <motion.div className="absolute z-[25] inset-0 flex items-center justify-center px-8 md:justify-end md:pr-[10%] md:px-0" style={{ opacity: questionOpacity, y: questionY }}>
                        <div className="max-w-[280px] md:max-w-[300px]" style={{ borderLeft: '2.5px solid #B91C2E', paddingLeft: 18 }}>
                            <p className="text-[1.15rem] md:text-[1.35rem] font-medium leading-snug" style={{ color: '#0a1526' }}>Mas para quem todo esse cuidado está sendo{' '}<span className="font-bold">coordenado?</span></p>
                        </div>
                    </motion.div>

                    {/* ─── FINAL: ELYON branding ─── */}
                    <motion.div className="absolute z-[27] bottom-[10%] left-6 md:left-14" style={{ opacity: endBrandOpacity, y: finalY }}>
                        <div className="flex items-start gap-3"><div className="w-px mt-1 flex-shrink-0" style={{ height: 36, background: '#B91C2E' }} /><div><p className="font-semibold text-[14px] tracking-[0.22em]" style={{ color: '#0a1526' }}>ELYON</p><p className="text-[10px] tracking-wide mt-0.5" style={{ color: '#94a3b8' }}>Sistema Operacional do Cuidado em Saúde</p></div></div>
                    </motion.div>

                    {/* ─── FINAL: "A resposta…" ─── */}
                    <motion.div className="absolute z-[27] bottom-[10%] right-6 md:right-[10%]" style={{ opacity: finalOpacity, y: finalY }}>
                        <div style={{ borderLeft: '2px solid #B91C2E', paddingLeft: 14 }}><p className="text-[13px] md:text-[14px] font-medium leading-snug" style={{ color: '#0a1526' }}>A resposta está<br />no centro de tudo.</p></div>
                    </motion.div>

                    {/* ─── SCROLL INDICATOR ─── */}
                    <motion.div className="absolute z-[30] bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ opacity: scrollIndicatorOpacity }}>
                        <motion.div className="w-px rounded-full" style={{ height: 32, background: 'linear-gradient(to bottom, transparent, #cbd5e1)' }} animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }} />
                        <span className="text-[8px] tracking-[0.35em] uppercase font-medium mt-2" style={{ color: '#94a3b8' }}>scroll</span>
                    </motion.div>
                </div>
            </section>

            {/* ══════════════════════════════════════════ */}
            {/*                 SCENE 02                   */}
            {/*       O PACIENTE NO CENTRO DE TUDO          */}
            {/* ══════════════════════════════════════════ */}
            <section ref={scene02Ref} style={{ height: isMobile ? '450vh' : '520vh' }}>
                <div className="sticky top-0 h-screen w-full overflow-hidden">

                    <div className="absolute inset-0 bg-white" />

                    {/* ─── BRIDGE: Red thread from Scene 01 ─── */}
                    <motion.div
                        className="absolute z-[6] left-1/2 -translate-x-1/2 top-0"
                        style={{ opacity: bridgeOpacity }}
                    >
                        <div style={{ width: 1, height: 100, background: 'linear-gradient(to bottom, #B91C2E 0%, transparent 100%)' }} />
                    </motion.div>

                    {/* ─── CONVERGENCE DOT ─── */}
                    <motion.div
                        className="absolute z-[7] left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2"
                        style={{ scale: dotScale, opacity: dotOpacity }}
                    >
                        <div className="w-3 h-3 rounded-full" style={{ background: '#B91C2E' }} />
                    </motion.div>

                    {/* ─── PATIENT PHOTO LAYER ─── */}
                    <motion.div
                        className="absolute z-[5] left-1/2 -translate-x-1/2 top-[8%]
                            w-[82%] h-[75%]
                            md:top-[5%] md:w-[44%] md:h-[85%]"
                        style={{
                            scale: patientScale,
                            opacity: patientOpacity,
                            x: patientX,
                            y: patientY,
                        }}
                    >
                        <img
                            src="/patient.png"
                            alt="Paciente — No centro do cuidado"
                            className="w-full h-full object-cover select-none"
                            style={{ objectPosition: 'center 22%' }}
                            draggable={false}
                            loading="eager"
                        />
                        {/* Edge fading — soft integration with white */}
                        <div className="absolute left-0 top-0 h-full pointer-events-none" style={{ width: '35%', background: 'linear-gradient(to right, white 0%, rgba(255,255,255,0.4) 50%, transparent 100%)' }} />
                        <div className="absolute right-0 top-0 h-full pointer-events-none" style={{ width: '35%', background: 'linear-gradient(to left, white 0%, rgba(255,255,255,0.4) 50%, transparent 100%)' }} />
                        <div className="absolute bottom-0 left-0 w-full pointer-events-none" style={{ height: '40%', background: 'linear-gradient(to top, white 0%, rgba(255,255,255,0.25) 60%, transparent 100%)' }} />
                        <div className="absolute top-0 left-0 w-full pointer-events-none" style={{ height: '15%', background: 'linear-gradient(to bottom, rgba(255,255,255,0.25) 0%, transparent 100%)' }} />
                    </motion.div>

                    {/* ─── PATIENT LABEL ─── */}
                    <motion.div
                        className="absolute z-[12]
                            right-[8%] top-[18%]
                            md:right-[22%] md:top-[16%]"
                        style={{ opacity: patientLabelOpacity }}
                    >
                        <p className="text-[13px] md:text-[14px] font-semibold tracking-[0.2em] uppercase" style={{ color: '#0a1526' }}>Paciente</p>
                        <p className="text-[10px] tracking-[0.06em] mt-0.5 font-medium" style={{ color: '#94a3b8' }}>No centro de tudo.</p>
                    </motion.div>

                    {/* ─── TEXT: "E no centro de tudo," ─── */}
                    <motion.div
                        className="absolute z-[20]
                            left-6 bottom-[28%] max-w-[88%]
                            md:left-[8%] md:bottom-auto md:top-[38%] md:max-w-[30%]"
                        style={{ opacity: centerText1Opacity, y: centerText1Y }}
                    >
                        <p
                            className="text-[1.6rem] md:text-[2.4rem] lg:text-[3rem] font-light leading-[1.1] tracking-[-0.02em]"
                            style={{ color: '#0a1526' }}
                        >
                            E no centro de tudo,
                        </p>
                    </motion.div>

                    {/* ─── TEXT: "uma pessoa." ─── */}
                    <motion.div
                        className="absolute z-[20]
                            left-6 bottom-[20%] max-w-[88%]
                            md:left-[8%] md:bottom-auto md:top-[50%] md:max-w-[30%]"
                        style={{ opacity: centerText2Opacity, y: centerText2Y }}
                    >
                        <p
                            className="text-[2rem] md:text-[3rem] lg:text-[3.8rem] font-bold leading-[1.05] tracking-[-0.03em]"
                            style={{ color: '#0a1526' }}
                        >
                            uma pessoa.
                        </p>
                    </motion.div>

                    {/* ─── RED THREAD (Scene 02 internal) ─── */}
                    <motion.svg
                        className="absolute inset-0 w-full h-full z-[8] pointer-events-none hidden md:block"
                        viewBox="0 0 1440 900"
                        preserveAspectRatio="xMidYMid slice"
                        fill="none"
                        style={{ opacity: thread2Opacity }}
                    >
                        <motion.path
                            d="M 720 120 C 680 200 600 280 480 340 C 360 400 320 500 350 600 C 380 700 500 720 620 680 C 740 640 850 560 950 520 C 1050 480 1150 520 1200 600"
                            stroke="#B91C2E"
                            strokeWidth="1.1"
                            strokeLinecap="round"
                            style={{ pathLength: thread2Length }}
                        />
                        <motion.circle cx="480" cy="340" r="2" fill="#B91C2E" style={{ opacity: cl1Opacity }} />
                        <motion.circle cx="350" cy="600" r="2" fill="#B91C2E" style={{ opacity: cl2Opacity }} />
                        <motion.circle cx="950" cy="520" r="2" fill="#B91C2E" style={{ opacity: cl3Opacity }} />
                    </motion.svg>

                    {/* ─── Mobile red thread ─── */}
                    <motion.div className="absolute z-[8] pointer-events-none md:hidden" style={{ left: 24, top: '20%', width: 1, height: '60%', opacity: thread2Opacity }}>
                        <motion.div style={{ width: '100%', height: '100%', background: '#B91C2E', transformOrigin: 'top', scaleY: thread2Length }} />
                    </motion.div>

                    {/* ─── CARE LAYER 1: Consulta ─── */}
                    <motion.div
                        className="absolute z-[15]
                            left-[4%] top-[55%]
                            md:left-[10%] md:top-[35%]"
                        style={{ opacity: cl1Opacity, x: cl1X, y: cl1Y }}
                    >
                        <div className="w-[165px] md:w-[180px] rounded-xl p-3 backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(226,232,240,0.6)', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-[5px] h-[5px] rounded-full" style={{ background: '#B91C2E' }} />
                                <span className="text-[10px] font-semibold tracking-wide" style={{ color: '#0a1526' }}>Consulta agendada</span>
                            </div>
                            <p className="text-[10px] ml-[13px]" style={{ color: '#64748b' }}>Dr. Silva · Cardiologia</p>
                            <p className="text-[9px] ml-[13px] mt-0.5" style={{ color: '#94a3b8' }}>Hoje, 10:00</p>
                        </div>
                    </motion.div>

                    {/* ─── CARE LAYER 2: Medicamento ─── */}
                    <motion.div
                        className="absolute z-[15]
                            right-[4%] bottom-[28%]
                            md:right-[12%] md:bottom-[25%]"
                        style={{ opacity: cl2Opacity, x: cl2X }}
                    >
                        <div className="w-[155px] md:w-[166px] rounded-xl p-3 backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(226,232,240,0.6)', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px]" style={{ background: '#eff6ff' }}>💊</div>
                                <span className="text-[10px] font-semibold" style={{ color: '#0a1526' }}>Medicamento</span>
                            </div>
                            <p className="text-[9px] ml-7" style={{ color: '#94a3b8' }}>Losartana 50mg · 08:00 ✓</p>
                        </div>
                    </motion.div>

                    {/* ─── CARE LAYER 3: Exame (desktop only) ─── */}
                    {!isMobile && (
                        <motion.div
                            className="absolute z-[15] right-[8%] top-[40%]"
                            style={{ opacity: cl3Opacity, x: cl3X }}
                        >
                            <div className="w-[158px] rounded-xl p-3 backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(226,232,240,0.6)', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: '#fef2f2' }}>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#B91C2E" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                    </div>
                                    <span className="text-[10px] font-semibold" style={{ color: '#0a1526' }}>Exame laboratorial</span>
                                </div>
                                <p className="text-[9px] ml-7" style={{ color: '#94a3b8' }}>Amanhã, 06:30</p>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── CARE LAYER 4: Liz subtle reference ─── */}
                    <motion.div
                        className="absolute z-[15]
                            left-[6%] bottom-[14%]
                            md:left-[18%] md:bottom-[12%]"
                        style={{ opacity: cl4Opacity }}
                    >
                        <div className="flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(226,232,240,0.5)', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
                            <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0" style={{ background: '#f1f5f9' }}>
                                <img src="/liz-front.jpg" alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 15%' }} />
                            </div>
                            <div>
                                <p className="text-[9px] font-semibold" style={{ color: '#0a1526' }}>Liz</p>
                                <p className="text-[8px]" style={{ color: '#94a3b8' }}>Seu cuidado está em dia.</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* ─── TELEMEDICINE HINT ─── */}
                    <motion.div
                        className="absolute z-[18]
                            right-[6%] bottom-[18%]
                            md:right-[8%] md:bottom-[20%]"
                        style={{ opacity: teleHintOpacity, scale: teleHintScale, y: teleHintY }}
                    >
                        <div className="w-[140px] md:w-[160px] rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.94)', border: '1px solid rgba(226,232,240,0.6)', boxShadow: '0 12px 40px rgba(0,0,0,0.06)' }}>
                            {/* Video call frame */}
                            <div className="relative" style={{ height: 72, background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(10,21,38,0.08)' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0a1526" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="23 7 16 12 23 17 23 7" />
                                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                        </svg>
                                    </div>
                                </div>
                                {/* Pulsing connection indicator */}
                                <div className="absolute top-2 right-2">
                                    <div className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
                                </div>
                            </div>
                            <div className="p-2.5">
                                <p className="text-[10px] font-semibold" style={{ color: '#0a1526' }}>Teleconsulta</p>
                                <p className="text-[9px] mt-0.5" style={{ color: '#94a3b8' }}>Conectar ao cuidado</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* ─── END QUESTION: "Como esse cuidado começa?" ─── */}
                    <motion.div
                        className="absolute z-[22]
                            left-6 bottom-[6%]
                            md:left-14 md:bottom-[8%]"
                        style={{ opacity: endQuestionOpacity, y: endQuestionY }}
                    >
                        <div style={{ borderLeft: '2px solid #B91C2E', paddingLeft: 14 }}>
                            <p className="text-[12px] md:text-[13px] font-medium leading-snug" style={{ color: '#64748b' }}>
                                Como esse cuidado<br />começa?
                            </p>
                        </div>
                    </motion.div>

                </div>
            </section>

            {/* ══════════════════════════════════════════ */}
            {/*          SCENE 03 — PLACEHOLDER            */}
            {/* ══════════════════════════════════════════ */}
            <section className="relative min-h-[40vh] bg-white flex items-center justify-center">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px" style={{ height: 60, background: 'linear-gradient(to bottom, #B91C2E, transparent)' }} />
                <div className="text-center mt-12">
                    <p className="text-[10px] tracking-[0.2em] uppercase font-medium" style={{ color: '#cbd5e1' }}>Cena 03 · Em breve</p>
                </div>
            </section>

            {/* ══════ MINIMAL ACCESS ══════ */}
            <div className="fixed bottom-6 right-6 z-[90]">
                <button
                    onClick={() => navigate('/app-paciente')}
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
                    style={{ background: '#0a1526', border: '1px solid rgba(255,255,255,0.1)' }}
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
