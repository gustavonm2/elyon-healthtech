import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { 
    ArrowRight, Activity, Heart, Shield, Sparkles, MessageSquare, 
    Calendar, CheckCircle2, ChevronRight, Zap, Stethoscope, 
    FileText, UserPlus, Users, Pill, Clock, Play, Star,
    Brain, Eye, Mic, TrendingUp, Lock, Smartphone
} from 'lucide-react';

/* ─── Animated Section Wrapper ─── */
const AnimatedSection: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({ children, className = '', delay = 0 }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

/* ─── Floating Particle Canvas ─── */
const ParticleCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        const particles: Array<{
            x: number; y: number; vx: number; vy: number; radius: number; alpha: number;
        }> = [];

        const count = Math.min(50, Math.floor(width / 30));
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                radius: Math.random() * 1.5 + 0.5,
                alpha: Math.random() * 0.3 + 0.1,
            });
        }

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        ctx.strokeStyle = `rgba(56, 189, 248, ${0.08 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[1] opacity-30" />;
};

/* ─── Glow Orb Background Element ─── */
const GlowOrb: React.FC<{ className?: string; color?: string }> = ({ className = '', color = 'rgba(56,189,248,0.08)' }) => (
    <div 
        className={`absolute rounded-full blur-[120px] pointer-events-none ${className}`} 
        style={{ background: color }} 
    />
);

/* ═══════════════════════════════════════════════ */
/*              HOME — ELYON LANDING               */
/* ═══════════════════════════════════════════════ */
const Home: React.FC = () => {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const [selectedOrbit, setSelectedOrbit] = useState<string>('LIZ (IA & Voz)');

    // Parallax
    const yHero = useTransform(scrollYProgress, [0, 0.3], ['0%', '15%']);
    const opacityHero = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

    // PWA redirect
    useEffect(() => {
        const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
        if (isStandalone) {
            navigate('/app-paciente', { replace: true });
        }
    }, [navigate]);

    // Orbit descriptions
    const orbitDescriptions: Record<string, string> = {
        'LIZ (IA & Voz)': 'Coordenadora de cuidado por IA que monitora sinais vitais, lembra dos medicamentos e oferece acolhimento contínuo por áudio e texto 24/7.',
        'Telemedicina': 'Teleconsulta instantânea com especialistas direto pelo celular, sem baixar aplicativos extras.',
        'Sinais Vitais': 'Monitoramento contínuo de pressão, glicemia, frequência cardíaca e SpO2 com alertas inteligentes.',
        'Prescrições': 'Receitas digitais integradas ao prontuário com lembretes automáticos de horários de medicamentos.',
        'Prontuário Único': 'Histórico completo e longitudinal de todos os atendimentos, exames e prescrições em um só lugar.',
        'Central de Exames': 'Resultados centralizados com análise de tendências de biomarcadores ao longo do tempo.',
    };

    return (
        <div className="min-h-screen bg-elyon-bg text-elyon-text font-sans relative overflow-x-hidden selection:bg-elyon-blue/30 selection:text-white">
            <ParticleCanvas />

            {/* ══════ NAVBAR ══════ */}
            <motion.nav
                initial={{ y: -80 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="fixed top-0 left-0 w-full z-50 bg-elyon-bg/70 backdrop-blur-2xl border-b border-white/[0.04]"
            >
                <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="w-9 h-9 rounded-xl overflow-hidden border border-elyon-blue/30 shadow-[0_0_20px_rgba(56,189,248,0.15)]">
                            <img src="/elyon-logo.jpg" alt="ELYON" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-lg tracking-[0.2em] text-white">ELYON</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-elyon-muted">
                        {[
                            { label: 'Solução', href: '#solucao' },
                            { label: 'Ecossistema', href: '#ecossistema' },
                            { label: 'LIZ', href: '#liz' },
                            { label: 'Jornada', href: '#jornada' },
                        ].map((link) => (
                            <a key={link.href} href={link.href} className="hover:text-white transition-colors duration-300 relative group">
                                {link.label}
                                <span className="absolute -bottom-1 left-0 w-0 h-px bg-elyon-blue group-hover:w-full transition-all duration-300" />
                            </a>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/login')}
                            className="hidden sm:inline-flex px-4 py-2 rounded-lg border border-white/8 text-elyon-muted text-xs font-medium hover:text-white hover:border-white/20 hover:bg-white/[0.03] transition-all duration-300"
                        >
                            Acesso Clínico
                        </button>
                        <button
                            onClick={() => navigate('/app-paciente')}
                            className="px-4 py-2 rounded-lg bg-white text-elyon-bg text-xs font-bold hover:bg-elyon-text transition-all duration-200 shadow-[0_2px_15px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_25px_rgba(255,255,255,0.18)] flex items-center gap-1.5"
                        >
                            <Heart className="w-3 h-3 text-elyon-blue-deep fill-elyon-blue-deep" />
                            App Paciente
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* ══════ HERO ══════ */}
            <section className="relative min-h-screen flex items-center z-10">
                <GlowOrb className="w-[600px] h-[600px] -top-40 -right-40" color="rgba(56,189,248,0.06)" />
                <GlowOrb className="w-[400px] h-[400px] top-1/2 -left-40" color="rgba(2,132,199,0.05)" />

                <motion.div 
                    style={{ y: yHero, opacity: opacityHero }} 
                    className="max-w-7xl mx-auto px-6 md:px-12 pt-24 pb-20 w-full"
                >
                    <div className="max-w-3xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-elyon-blue text-[11px] font-medium uppercase tracking-[0.15em] mb-8"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-elyon-blue animate-glow-pulse" />
                            Cuidado em saúde conectado
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.4 }}
                            className="text-[clamp(2.5rem,6vw,5rem)] font-extrabold leading-[1.05] tracking-tight mb-6"
                        >
                            <span className="text-white">Consultas, exames e </span>
                            <br className="hidden sm:block" />
                            <span className="text-white">cuidado contínuo. </span>
                            <span className="bg-gradient-to-r from-elyon-blue via-sky-300 to-white bg-clip-text text-transparent">
                                Tudo em um só lugar.
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            className="text-elyon-muted text-base sm:text-lg leading-relaxed mb-10 max-w-2xl font-normal"
                        >
                            A ELYON integra telemedicina, prontuário longitudinal e a LIZ — sua coordenadora de saúde por inteligência artificial para antecipar riscos e cuidar de você 24h por dia.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.8 }}
                            className="flex flex-wrap items-center gap-4"
                        >
                            <button
                                onClick={() => navigate('/app-paciente')}
                                className="group px-7 py-3.5 rounded-xl bg-white text-elyon-bg font-bold text-sm transition-all duration-300 shadow-[0_8px_30px_rgba(255,255,255,0.12)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 flex items-center gap-2.5"
                            >
                                Experimentar App
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-elyon-blue-deep" />
                            </button>
                            <button
                                onClick={() => navigate('/cadastro')}
                                className="px-6 py-3.5 rounded-xl border border-white/10 text-elyon-muted font-medium text-sm hover:text-white hover:border-white/25 hover:bg-white/[0.03] transition-all duration-300 flex items-center gap-2"
                            >
                                <UserPlus className="w-4 h-4 text-elyon-blue" />
                                Criar Conta Gratuita
                            </button>
                        </motion.div>

                        {/* Metrics */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 1.1 }}
                            className="flex flex-wrap gap-10 pt-14 mt-14 border-t border-white/[0.06]"
                        >
                            {[
                                { value: '100%', label: 'Jornada Integrada', color: 'text-white' },
                                { value: '24/7', label: 'Monitoramento IA', color: 'text-elyon-blue' },
                                { value: '< 1 min', label: 'Triagem Digital', color: 'text-emerald-400' },
                            ].map((m, i) => (
                                <div key={i}>
                                    <p className={`text-2xl sm:text-3xl font-bold tracking-tight ${m.color}`}>{m.value}</p>
                                    <p className="text-xs text-elyon-muted mt-1 font-medium">{m.label}</p>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* ══════ SEÇÃO COMPARATIVA ══════ */}
            <section id="solucao" className="relative z-10 py-28 px-6 md:px-12">
                <GlowOrb className="w-[500px] h-[500px] top-0 left-1/2 -translate-x-1/2" color="rgba(56,189,248,0.04)" />

                <div className="max-w-7xl mx-auto">
                    <AnimatedSection className="text-center max-w-3xl mx-auto mb-20">
                        <p className="text-elyon-blue text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">A evolução do cuidado</p>
                        <h2 className="text-3xl sm:text-[2.75rem] font-bold tracking-tight text-white leading-tight mb-5">
                            A saúde hoje é fragmentada.<br />
                            <span className="text-elyon-muted">A ELYON conecta cada etapa.</span>
                        </h2>
                    </AnimatedSection>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Tradicional */}
                        <AnimatedSection delay={0.1}>
                            <div className="h-full p-8 rounded-2xl bg-elyon-surface/80 border border-elyon-border/50 backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-[11px] font-semibold text-red-400/80 uppercase tracking-[0.15em] mb-7">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400/60" />
                                    Modelo Tradicional
                                </div>
                                <div className="space-y-3">
                                    {[
                                        'Histórico preso no prontuário de cada clínica.',
                                        'Exames impressos ou perdidos em portais separados.',
                                        'Ninguém acompanha o paciente entre consultas.',
                                        'Riscos só descobertos no pronto-socorro.',
                                    ].map((text, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                                            <span className="w-5 h-5 rounded-full bg-red-500/10 text-red-400/70 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">{i + 1}</span>
                                            <p className="text-sm text-elyon-muted leading-relaxed">{text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </AnimatedSection>

                        {/* ELYON */}
                        <AnimatedSection delay={0.2}>
                            <div className="h-full p-8 rounded-2xl bg-gradient-to-b from-elyon-surface to-elyon-bg border border-elyon-blue/20 shadow-[0_0_60px_rgba(56,189,248,0.06)]">
                                <div className="flex items-center gap-2 text-[11px] font-semibold text-elyon-blue uppercase tracking-[0.15em] mb-7">
                                    <span className="w-1.5 h-1.5 rounded-full bg-elyon-blue shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
                                    Ecossistema ELYON
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { title: 'Prontuário Longitudinal', desc: 'Todos os atendimentos sincronizados.' },
                                        { title: 'Central de Exames', desc: 'Resultados com análise de tendências.' },
                                        { title: 'LIZ Coordenadora', desc: 'Lembretes e acolhimento contínuo.' },
                                        { title: 'Telemedicina 1 Toque', desc: 'Consulta rápida direto pelo celular.' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-elyon-blue/[0.04] border border-elyon-blue/10">
                                            <span className="w-5 h-5 rounded-full bg-elyon-blue-deep text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <CheckCircle2 className="w-3 h-3" />
                                            </span>
                                            <p className="text-sm leading-relaxed">
                                                <strong className="text-white font-semibold">{item.title}:</strong>{' '}
                                                <span className="text-elyon-muted">{item.desc}</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </AnimatedSection>
                    </div>
                </div>
            </section>

            {/* ══════ ECOSSISTEMA ORBITAL ══════ */}
            <section id="ecossistema" className="relative z-10 py-28 px-6 md:px-12">
                <div className="max-w-7xl mx-auto">
                    <AnimatedSection className="text-center max-w-2xl mx-auto mb-16">
                        <p className="text-elyon-blue text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">Hub Central de Saúde</p>
                        <h2 className="text-3xl sm:text-[2.75rem] font-bold tracking-tight text-white leading-tight mb-4">
                            Um organismo vivo centrado no paciente
                        </h2>
                        <p className="text-elyon-muted text-sm">
                            Toque nos pilares para explorar como as especialidades e tecnologias se conectam.
                        </p>
                    </AnimatedSection>

                    <AnimatedSection delay={0.2}>
                        <div className="relative h-[500px] sm:h-[560px] rounded-2xl border border-elyon-border/50 bg-gradient-to-b from-elyon-surface via-elyon-bg to-elyon-bg flex items-center justify-center overflow-hidden">
                            {/* Orbital rings */}
                            <div className="absolute w-[260px] h-[260px] rounded-full border border-dashed border-white/10 pointer-events-none animate-[spin_60s_linear_infinite]" />
                            <div className="absolute w-[420px] h-[420px] rounded-full border border-dashed border-elyon-blue/10 pointer-events-none animate-[spin_90s_linear_infinite_reverse]" />

                            {/* Center */}
                            <div className="w-32 h-32 rounded-full bg-white text-elyon-bg flex flex-col items-center justify-center z-20 shadow-[0_0_80px_rgba(255,255,255,0.2)] text-center p-2">
                                <img src="/elyon-logo.jpg" alt="ELYON" className="w-9 h-9 rounded-lg mb-1 object-cover" />
                                <span className="font-black text-xs tracking-widest">ELYON</span>
                                <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider mt-0.5">Você no Centro</span>
                            </div>

                            {/* Nodes */}
                            {[
                                { label: 'LIZ (IA & Voz)', pos: 'top-8 left-1/2 -translate-x-1/2', icon: MessageSquare },
                                { label: 'Telemedicina', pos: 'bottom-10 left-1/2 -translate-x-1/2', icon: Activity },
                                { label: 'Sinais Vitais', pos: 'top-1/2 -translate-y-1/2 left-4 sm:left-14', icon: Heart },
                                { label: 'Prescrições', pos: 'top-1/2 -translate-y-1/2 right-4 sm:right-14', icon: Pill },
                                { label: 'Prontuário Único', pos: 'top-20 left-14 sm:left-28', icon: FileText },
                                { label: 'Central de Exames', pos: 'bottom-20 right-14 sm:right-28', icon: Stethoscope },
                            ].map((node, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedOrbit(node.label)}
                                    className={`absolute ${node.pos} px-3.5 py-2 rounded-full backdrop-blur-md border text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors duration-300 z-30 ${
                                        selectedOrbit === node.label
                                            ? 'bg-elyon-blue-deep text-white border-elyon-blue shadow-[0_0_30px_rgba(56,189,248,0.4)]'
                                            : 'bg-elyon-surface/90 text-slate-300 border-white/10 hover:border-elyon-blue/40'
                                    }`}
                                >
                                    <node.icon className="w-3.5 h-3.5 text-elyon-blue" />
                                    <span>{node.label}</span>
                                </motion.div>
                            ))}

                            {/* Description panel */}
                            <motion.div
                                key={selectedOrbit}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute bottom-6 left-6 right-6 bg-elyon-surface/95 backdrop-blur-xl rounded-xl border border-elyon-border/50 px-5 py-4 z-40"
                            >
                                <p className="text-[11px] font-bold text-elyon-blue uppercase tracking-wider mb-1">{selectedOrbit}</p>
                                <p className="text-sm text-elyon-muted leading-relaxed">{orbitDescriptions[selectedOrbit]}</p>
                            </motion.div>
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* ══════ LIZ AI ══════ */}
            <section id="liz" className="relative z-10 py-28 px-6 md:px-12">
                <GlowOrb className="w-[500px] h-[500px] top-1/4 right-0" color="rgba(56,189,248,0.04)" />

                <div className="max-w-7xl mx-auto">
                    <AnimatedSection>
                        <div className="grid lg:grid-cols-2 gap-10 items-center bg-elyon-surface/60 border border-elyon-border/50 rounded-2xl p-8 sm:p-12 backdrop-blur-sm">
                            {/* Left: Info */}
                            <div>
                                <p className="text-elyon-blue text-[11px] font-semibold uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Inteligência Clínica Conversacional
                                </p>

                                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight mb-5">
                                    Conheça a LIZ.<br />
                                    <span className="text-elyon-muted">Sua parceira contínua de saúde.</span>
                                </h2>

                                <p className="text-elyon-muted text-[15px] leading-relaxed mb-8">
                                    A LIZ analisa em tempo real sua pressão, glicemia, horários dos medicamentos e consultas agendadas, oferecendo orientações humanizadas por áudio e texto.
                                </p>

                                <div className="space-y-3">
                                    {[
                                        { icon: Shield, text: 'Monitora sinais vitais e alerta sobre desvios' },
                                        { icon: Clock, text: 'Lembretes de medicamentos no horário certo' },
                                        { icon: Calendar, text: 'Avisa sobre consultas e prepara você' },
                                        { icon: Mic, text: 'Respostas instantâneas por texto e áudio 24/7' },
                                    ].map((item, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.1 }}
                                            className="flex items-center gap-3 text-sm text-slate-300"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-elyon-blue/8 border border-elyon-blue/15 flex items-center justify-center flex-shrink-0">
                                                <item.icon className="w-3.5 h-3.5 text-elyon-blue" />
                                            </div>
                                            <span>{item.text}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Right: Simulated Chat */}
                            <div className="bg-elyon-bg rounded-xl border border-elyon-border/50 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.05]">
                                    <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-elyon-blue/30">
                                        <img src="/liz-avatar.jpg" alt="LIZ" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">LIZ</p>
                                        <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                            Online agora
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {/* LIZ */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.3 }}
                                        className="flex gap-2.5"
                                    >
                                        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-elyon-blue/20">
                                            <img src="/liz-avatar.jpg" alt="LIZ" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="bg-elyon-surface rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] border border-white/[0.04]">
                                            <p className="text-[13px] text-slate-200 leading-relaxed">
                                                Bom dia! 🌅 Sua pressão de ontem ficou em <strong className="text-elyon-blue">14/9</strong>.
                                                Lembre-se do Losartana 50mg às 8h. Sua consulta com Dr. Silva é amanhã às 10h.
                                            </p>
                                            <p className="text-[10px] text-slate-600 mt-2">07:15</p>
                                        </div>
                                    </motion.div>

                                    {/* User */}
                                    <motion.div
                                        initial={{ opacity: 0, x: 10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.5 }}
                                        className="flex justify-end"
                                    >
                                        <div className="bg-elyon-blue-deep rounded-2xl rounded-tr-sm px-4 py-3 max-w-[70%]">
                                            <p className="text-[13px] text-white">Obrigado, LIZ! Já tomei o remédio.</p>
                                            <p className="text-[10px] text-white/40 mt-2 text-right">07:18</p>
                                        </div>
                                    </motion.div>

                                    {/* LIZ */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.7 }}
                                        className="flex gap-2.5"
                                    >
                                        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-elyon-blue/20">
                                            <img src="/liz-avatar.jpg" alt="LIZ" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="bg-elyon-surface rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] border border-white/[0.04]">
                                            <p className="text-[13px] text-slate-200 leading-relaxed">
                                                Ótimo! ✅ Registrei a adesão. Sua próxima dose é às 20h. Quer que eu te avise? 💊
                                            </p>
                                            <p className="text-[10px] text-slate-600 mt-2">07:18</p>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Input bar */}
                                <div className="mt-5 flex items-center gap-2 bg-elyon-surface rounded-xl px-4 py-2.5 border border-white/[0.05]">
                                    <input
                                        type="text"
                                        placeholder="Fale com a LIZ..."
                                        className="flex-1 bg-transparent text-sm text-slate-300 placeholder:text-slate-600 outline-none"
                                        readOnly
                                    />
                                    <button className="w-7 h-7 rounded-lg bg-elyon-blue-deep flex items-center justify-center flex-shrink-0 hover:bg-elyon-blue transition-colors">
                                        <ArrowRight className="w-3.5 h-3.5 text-white" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* ══════ FUNCIONALIDADES ══════ */}
            <section className="relative z-10 py-28 px-6 md:px-12">
                <div className="max-w-7xl mx-auto">
                    <AnimatedSection className="text-center max-w-2xl mx-auto mb-16">
                        <p className="text-elyon-blue text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">Plataforma Completa</p>
                        <h2 className="text-3xl sm:text-[2.75rem] font-bold tracking-tight text-white leading-tight mb-4">
                            Tudo que você precisa em um único ecossistema
                        </h2>
                    </AnimatedSection>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { icon: Stethoscope, title: 'Teleconsulta em Vídeo', desc: 'Médico e paciente conectados diretamente, sem app externo.' },
                            { icon: FileText, title: 'Prontuário Digital', desc: 'Histórico, prescrições e exames em um só lugar.' },
                            { icon: Brain, title: 'IA Clínica (LIZ)', desc: 'Triagem, monitoramento e acolhimento por IA.' },
                            { icon: TrendingUp, title: 'Dashboard de Saúde', desc: 'Tendências de sinais vitais e biomarcadores.' },
                            { icon: Lock, title: 'Segurança Total', desc: 'Dados criptografados e conformidade LGPD.' },
                            { icon: Smartphone, title: 'App do Paciente', desc: 'PWA responsivo que funciona como app nativo.' },
                        ].map((item, i) => (
                            <AnimatedSection key={i} delay={i * 0.08}>
                                <div className="group h-full p-6 rounded-xl bg-elyon-surface/50 border border-elyon-border/40 hover:border-elyon-blue/25 transition-all duration-300 hover:bg-elyon-surface/80">
                                    <div className="w-10 h-10 rounded-lg bg-elyon-blue/8 border border-elyon-blue/15 flex items-center justify-center mb-4 group-hover:bg-elyon-blue/15 transition-colors">
                                        <item.icon className="w-4.5 h-4.5 text-elyon-blue" strokeWidth={1.8} />
                                    </div>
                                    <h3 className="text-[15px] font-bold text-white mb-1.5">{item.title}</h3>
                                    <p className="text-sm text-elyon-muted leading-relaxed">{item.desc}</p>
                                </div>
                            </AnimatedSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════ JORNADA ══════ */}
            <section id="jornada" className="relative z-10 py-28 px-6 md:px-12">
                <GlowOrb className="w-[600px] h-[400px] bottom-0 left-1/4" color="rgba(56,189,248,0.03)" />

                <div className="max-w-7xl mx-auto">
                    <AnimatedSection className="text-center max-w-2xl mx-auto mb-16">
                        <p className="text-elyon-blue text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">Como Funciona</p>
                        <h2 className="text-3xl sm:text-[2.75rem] font-bold tracking-tight text-white leading-tight mb-4">
                            Sua jornada de saúde em 4 passos
                        </h2>
                        <p className="text-elyon-muted text-sm">
                            Do primeiro acesso ao acompanhamento contínuo — cada etapa conectada.
                        </p>
                    </AnimatedSection>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { step: '01', title: 'Crie sua conta', desc: 'Cadastre-se gratuitamente e preencha seu perfil de saúde em menos de 2 minutos.', icon: UserPlus },
                            { step: '02', title: 'Triagem Inteligente', desc: 'A LIZ faz uma triagem inicial, avalia seus sintomas e define a prioridade.', icon: MessageSquare },
                            { step: '03', title: 'Consulta & Prescrição', desc: 'Teleconsulta com especialista. Prescrição digital salva automaticamente.', icon: Stethoscope },
                            { step: '04', title: 'Cuidado Contínuo', desc: 'A LIZ monitora sinais vitais, lembra dos remédios e alerta sobre riscos.', icon: Heart },
                        ].map((item, i) => (
                            <AnimatedSection key={i} delay={i * 0.1}>
                                <div className="group relative h-full p-6 rounded-xl bg-elyon-surface/50 border border-elyon-border/40 hover:border-elyon-blue/25 transition-all duration-300 overflow-hidden">
                                    <div className="absolute top-3 right-4 text-[56px] font-black text-white/[0.02] leading-none select-none group-hover:text-elyon-blue/[0.06] transition-colors">
                                        {item.step}
                                    </div>
                                    <div className="w-10 h-10 rounded-lg bg-elyon-blue/8 border border-elyon-blue/15 flex items-center justify-center mb-4">
                                        <item.icon className="w-4 h-4 text-elyon-blue" />
                                    </div>
                                    <h3 className="text-[15px] font-bold text-white mb-1.5">{item.title}</h3>
                                    <p className="text-sm text-elyon-muted leading-relaxed">{item.desc}</p>
                                </div>
                            </AnimatedSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════ CTA FINAL ══════ */}
            <section className="relative z-10 py-28 px-6 md:px-12">
                <div className="max-w-4xl mx-auto">
                    <AnimatedSection>
                        <div className="relative text-center bg-gradient-to-b from-elyon-surface to-elyon-bg border border-elyon-border/50 rounded-2xl p-10 sm:p-16 overflow-hidden">
                            <GlowOrb className="w-[400px] h-[400px] -top-40 -right-40" color="rgba(56,189,248,0.06)" />
                            <GlowOrb className="w-[300px] h-[300px] -bottom-20 -left-20" color="rgba(2,132,199,0.05)" />

                            <div className="relative z-10">
                                <div className="w-14 h-14 rounded-xl overflow-hidden border border-elyon-blue/20 shadow-[0_0_40px_rgba(56,189,248,0.15)] mx-auto mb-8">
                                    <img src="/elyon-logo.jpg" alt="ELYON" className="w-full h-full object-cover" />
                                </div>

                                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
                                    Comece sua jornada de saúde conectada
                                </h2>
                                <p className="text-elyon-muted text-sm sm:text-base mb-10 max-w-xl mx-auto">
                                    Crie sua conta gratuita e tenha acesso ao app do paciente, à LIZ e a todo o ecossistema ELYON.
                                </p>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                    <button
                                        onClick={() => navigate('/app-paciente')}
                                        className="group px-7 py-3.5 rounded-xl bg-white text-elyon-bg font-bold text-sm transition-all duration-300 shadow-[0_8px_30px_rgba(255,255,255,0.12)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 flex items-center gap-2"
                                    >
                                        <Heart className="w-4 h-4 text-elyon-blue-deep fill-elyon-blue-deep" />
                                        Abrir App do Paciente
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-elyon-blue-deep" />
                                    </button>
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="px-6 py-3.5 rounded-xl border border-white/10 text-elyon-muted font-medium text-sm hover:text-white hover:border-white/25 hover:bg-white/[0.03] transition-all duration-300 flex items-center gap-2"
                                    >
                                        <Users className="w-4 h-4 text-elyon-blue" />
                                        Acesso para Clínicas
                                    </button>
                                </div>
                            </div>
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* ══════ FOOTER ══════ */}
            <footer className="relative z-10 border-t border-white/[0.04] py-8 px-6 md:px-12">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg overflow-hidden border border-elyon-blue/15">
                            <img src="/elyon-logo.jpg" alt="ELYON" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-xs tracking-[0.18em] text-white/70">ELYON</span>
                    </div>
                    <p className="text-slate-600 text-xs">© 2026 ELYON Health Technologies — Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
