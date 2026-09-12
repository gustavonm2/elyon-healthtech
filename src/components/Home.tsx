import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowRight, Activity, Heart, Shield, Sparkles, MessageSquare, 
    Calendar, CheckCircle2, ChevronRight, Zap, Stethoscope, 
    FileText, UserPlus, Users, Pill, Clock
} from 'lucide-react';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [selectedOrbit, setSelectedOrbit] = useState<string>('LIZ (IA & Voz)');

    // Redirecionamento automático se aberto em modo PWA/Standalone no iPhone
    useEffect(() => {
        const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
        if (isStandalone) {
            navigate('/app-paciente', { replace: true });
        }
    }, [navigate]);

    // Canvas Interativo de Partículas Futuristas
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
            x: number;
            y: number;
            vx: number;
            vy: number;
            radius: number;
            alpha: number;
        }> = [];

        const count = Math.min(45, Math.floor(width / 35));
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35,
                radius: Math.random() * 2 + 1,
                alpha: Math.random() * 0.4 + 0.2,
            });
        }

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // Conexões neurais
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 130) {
                        ctx.strokeStyle = `rgba(56, 189, 248, ${0.15 * (1 - dist / 130)})`;
                        ctx.lineWidth = 0.75;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            // Partículas
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

    return (
        <div className="min-h-screen bg-[#050811] text-[#f8fafc] font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#38bdf8] selection:text-[#050811] relative overflow-x-hidden">
            {/* Canvas de Fundo */}
            <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[1] opacity-40" />

            {/* ===== 1. NAVBAR ===== */}
            <nav className="fixed top-0 left-0 w-full z-50 py-4 px-6 md:px-12 bg-[#050811]/75 backdrop-blur-2xl border-b border-white/[0.06] transition-all">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Brand */}
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="w-10 h-10 rounded-2xl overflow-hidden border border-[#38bdf8]/30 shadow-[0_0_20px_rgba(56,189,248,0.25)] flex items-center justify-center bg-[#0a0f1d]">
                            <img src="/elyon-logo.jpg" alt="ELYON" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-['Space_Grotesk',monospace] font-bold text-xl tracking-[0.18em] text-white">
                            ELYON
                        </span>
                    </div>

                    {/* Links de Navegação */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <a href="#solucao" className="hover:text-white transition-colors">A Solução</a>
                        <a href="#ecossistema" className="hover:text-white transition-colors">Ecossistema</a>
                        <a href="#liz" className="hover:text-white transition-colors">LIZ (IA)</a>
                        <a href="#jornada" className="hover:text-white transition-colors">Jornada</a>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/login')}
                            className="hidden sm:inline-flex px-5 py-2.5 rounded-full border border-white/10 hover:border-white/30 bg-white/[0.02] text-slate-200 text-xs font-semibold hover:bg-white/[0.06] transition-all"
                        >
                            Acesso Clínico
                        </button>
                        <button
                            onClick={() => navigate('/app-paciente')}
                            className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 text-[#050811] text-xs font-bold transition-all shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <Heart className="w-3.5 h-3.5 text-[#0284c7] fill-[#0284c7]" />
                            Abrir App Paciente
                        </button>
                    </div>
                </div>
            </nav>

            {/* ===== 2. HERO SECTION ===== */}
            <section className="relative min-h-screen pt-36 pb-20 px-6 md:px-12 flex flex-col justify-center z-10 max-w-7xl mx-auto">
                <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#38bdf8]/[0.08] border border-[#38bdf8]/25 text-[#38bdf8] text-xs font-['Space_Grotesk',monospace] uppercase tracking-wider mb-6">
                        <span className="w-2 h-2 rounded-full bg-[#38bdf8] shadow-[0_0_10px_#38bdf8] animate-pulse" />
                        CUIDADO EM SAÚDE CONECTADO
                    </div>

                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 text-white">
                        Consultas, exames e cuidado contínuo. <br />
                        <span className="bg-gradient-to-r from-white via-slate-100 to-[#38bdf8] bg-clip-text text-transparent">
                            Tudo em um só lugar.
                        </span>
                    </h1>

                    <p className="text-base sm:text-xl text-slate-400 font-normal leading-relaxed mb-10 max-w-2xl">
                        A ELYON integra telemedicina instantânea, prontuário longitudinal e a LIZ — sua coordenadora de saúde por inteligência artificial para antecipar riscos e cuidar de você 24h por dia.
                    </p>

                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            onClick={() => navigate('/app-paciente')}
                            className="px-8 py-4 rounded-full bg-white hover:bg-slate-100 text-[#050811] font-bold text-sm transition-all shadow-[0_10px_30px_rgba(255,255,255,0.18)] hover:-translate-y-0.5 flex items-center gap-2.5 group"
                        >
                            <span>Experimentar App do Paciente</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#0284c7]" />
                        </button>

                        <button
                            onClick={() => navigate('/cadastro')}
                            className="px-7 py-4 rounded-full border border-white/15 hover:border-white/40 bg-white/[0.03] text-slate-200 font-semibold text-sm hover:bg-white/[0.08] transition-all flex items-center gap-2"
                        >
                            <UserPlus className="w-4 h-4 text-[#38bdf8]" />
                            Criar Conta Gratuita
                        </button>
                    </div>

                    {/* Métricas do Hero */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-12 mt-12 border-t border-white/[0.08]">
                        <div>
                            <p className="text-2xl sm:text-3xl font-bold font-['Space_Grotesk',monospace] text-white">100%</p>
                            <p className="text-xs text-slate-400 mt-1">Jornada Clínica Integrada</p>
                        </div>
                        <div>
                            <p className="text-2xl sm:text-3xl font-bold font-['Space_Grotesk',monospace] text-[#38bdf8]">24 / 7</p>
                            <p className="text-xs text-slate-400 mt-1">Acompanhamento com a LIZ</p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <p className="text-2xl sm:text-3xl font-bold font-['Space_Grotesk',monospace] text-emerald-400">&lt; 1 min</p>
                            <p className="text-xs text-slate-400 mt-1">Triagem e Acolhimento</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== 3. SEÇÃO COMPARATIVA: FRAGMENTAÇÃO VS ELYON ===== */}
            <section id="solucao" className="relative z-10 py-24 px-6 md:px-12 max-w-7xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-[#38bdf8] text-xs font-['Space_Grotesk',monospace] uppercase tracking-wider mb-4">
                        A EVOLUÇÃO DO CUIDADO
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
                        A saúde hoje é fragmentada. A ELYON conecta cada etapa.
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-base">
                        Veja a diferença entre o modelo tradicional isolado e uma experiência contínua com IA e prontuário integrado.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Modelo Tradicional */}
                    <div className="p-8 rounded-3xl bg-[#0a0f1d]/80 border border-red-500/20 backdrop-blur-xl relative">
                        <div className="flex items-center gap-2 text-xs font-bold font-['Space_Grotesk',monospace] text-red-400 uppercase tracking-wider mb-6">
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                            Modelo Tradicional Fragmentado
                        </div>

                        <div className="space-y-4 text-sm text-slate-400">
                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                                <span className="w-6 h-6 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center font-bold text-xs flex-shrink-0">1</span>
                                <p>Paciente consulta com um médico, mas o histórico fica preso no prontuário daquela clínica específica.</p>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                                <span className="w-6 h-6 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center font-bold text-xs flex-shrink-0">2</span>
                                <p>Exames são impressos em papel ou perdidos em múltiplos portais de laboratórios diferentes.</p>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                                <span className="w-6 h-6 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center font-bold text-xs flex-shrink-0">3</span>
                                <p>Ninguém acompanha o paciente em casa entre as consultas; adesão a medicamentos fica esquecida.</p>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                                <span className="w-6 h-6 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center font-bold text-xs flex-shrink-0">4</span>
                                <p>Sinais de descompensação e riscos só são descobertos quando o quadro já se agravou no pronto-socorro.</p>
                            </div>
                        </div>
                    </div>

                    {/* Modelo ELYON */}
                    <div className="p-8 rounded-3xl bg-gradient-to-b from-[#0f172a]/90 to-[#0a1428]/95 border border-[#38bdf8]/40 shadow-[0_20px_50px_rgba(2,132,199,0.15)] relative">
                        <div className="flex items-center gap-2 text-xs font-bold font-['Space_Grotesk',monospace] text-[#38bdf8] uppercase tracking-wider mb-6">
                            <span className="w-2 h-2 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" />
                            Ecossistema Integrado ELYON
                        </div>

                        <div className="space-y-4 text-sm text-slate-300">
                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#38bdf8]/[0.06] border border-[#38bdf8]/20">
                                <span className="w-6 h-6 rounded-full bg-[#0284c7] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">✓</span>
                                <p><strong className="text-white">Prontuário Longitudinal:</strong> Todos os atendimentos, teleconsultas e prescrições sincronizados no seu perfil.</p>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#38bdf8]/[0.06] border border-[#38bdf8]/20">
                                <span className="w-6 h-6 rounded-full bg-[#0284c7] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">✓</span>
                                <p><strong className="text-white">Central de Exames Inteligente:</strong> Resultados centralizados com análise de tendências de biomarcadores.</p>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#38bdf8]/[0.06] border border-[#38bdf8]/20">
                                <span className="w-6 h-6 rounded-full bg-[#0284c7] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">✓</span>
                                <p><strong className="text-white">LIZ (Coordenadora de Cuidado):</strong> Lembretes de remédios no horário, avisos de consulta e acolhimento contínuo.</p>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#38bdf8]/[0.06] border border-[#38bdf8]/20">
                                <span className="w-6 h-6 rounded-full bg-[#0284c7] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">✓</span>
                                <p><strong className="text-white">Telemedicina com 1 Toque:</strong> Triagem ágil e consulta médica rápida direto pelo celular.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== 4. ECOSSISTEMA ORBITAL ===== */}
            <section id="ecossistema" className="relative z-10 py-24 px-6 md:px-12 max-w-7xl mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-[#38bdf8] text-xs font-['Space_Grotesk',monospace] uppercase tracking-wider mb-4">
                        HUB CENTRAL DE SAÚDE
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
                        Um organismo vivo centrado no paciente
                    </h2>
                    <p className="text-slate-400 text-sm">
                        Toque nos pilares para explorar como as especialidades e tecnologias se conectam na ELYON.
                    </p>
                </div>

                {/* Stage do Ecossistema */}
                <div className="relative h-[480px] sm:h-[540px] rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0f1c3a] via-[#060a16] to-[#050811] flex items-center justify-center overflow-hidden shadow-2xl">
                    {/* Anéis Orbitais */}
                    <div className="absolute w-[280px] h-[280px] rounded-full border border-dashed border-white/15 pointer-events-none animate-[spin_60s_linear_infinite]" />
                    <div className="absolute w-[440px] h-[440px] rounded-full border border-dashed border-[#38bdf8]/15 pointer-events-none animate-[spin_90s_linear_infinite_reverse]" />

                    {/* Centro: Paciente / ELYON */}
                    <div className="w-36 h-36 rounded-full bg-white text-[#050811] flex flex-col items-center justify-center z-20 shadow-[0_0_60px_rgba(255,255,255,0.35)] text-center p-2">
                        <img src="/elyon-logo.jpg" alt="ELYON" className="w-10 h-10 rounded-xl mb-1 object-cover shadow-sm" />
                        <span className="font-['Space_Grotesk',monospace] font-black text-sm tracking-wider">ELYON</span>
                        <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider">Você no Centro</span>
                    </div>

                    {/* Nós Orbitais */}
                    {[
                        { label: 'LIZ (IA & Voz)', pos: 'top-10 left-1/2 -translate-x-1/2', icon: MessageSquare },
                        { label: 'Telemedicina', pos: 'bottom-12 left-1/2 -translate-x-1/2', icon: Activity },
                        { label: 'Sinais Vitais', pos: 'top-1/2 -translate-y-1/2 left-6 sm:left-16', icon: Heart },
                        { label: 'Prescrições', pos: 'top-1/2 -translate-y-1/2 right-6 sm:right-16', icon: Pill },
                        { label: 'Prontuário Único', pos: 'top-24 left-16 sm:left-32', icon: FileText },
                        { label: 'Central de Exames', pos: 'bottom-24 right-16 sm:right-32', icon: Stethoscope },
                    ].map((node, i) => (
                        <div
                            key={i}
                            onClick={() => setSelectedOrbit(node.label)}
                            className={`absolute ${node.pos} px-4 py-2.5 rounded-full backdrop-blur-md border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all duration-300 z-30 hover:scale-110 active:scale-95 ${
                                selectedOrbit === node.label 
                                    ? 'bg-[#0284c7] text-white border-[#38bdf8] shadow-[0_0_25px_rgba(56,189,248,0.5)]' 
                                    : 'bg-[#0f172a]/90 text-slate-200 border-white/15 hover:border-[#38bdf8]/60 hover:bg-[#0284c7]/20'
                            }`}
                        >
                            <node.icon className="w-4 h-4 text-[#38bdf8]" />
                            <span>{node.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ===== 5. LIZ: A COORDENADORA DE CUIDADO IA ===== */}
            <section id="liz" className="relative z-10 py-24 px-6 md:px-12 max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 items-center bg-[#0a0f1d]/90 border border-white/[0.08] rounded-3xl p-8 sm:p-14 shadow-2xl">
                    {/* Coluna 1: Apresentação */}
                    <div>
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-[#38bdf8] text-xs font-['Space_Grotesk',monospace] uppercase tracking-wider mb-6">
                            <Sparkles className="w-3.5 h-3.5" />
                            INTELIGÊNCIA CLÍNICA CONVERSACIONAL
                        </div>

                        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-6">
                            Conheça a LIZ. Sua parceira contínua de saúde.
                        </h2>

                        <p className="text-slate-400 text-base leading-relaxed mb-8">
                            A LIZ não é um chatbot genérico. Ela analisa em tempo real sua pressão, glicemia, horários dos medicamentos e consultas agendadas, oferecendo orientações humanizadas por áudio e texto.
                        </p>

                        <div className="space-y-4">
                            {[
                                { icon: Shield, text: 'Monitora sinais vitais e alerta sobre desvios críticos' },
                                { icon: Clock, text: 'Lembretes personalizados de medicamentos no horário certo' },
                                { icon: Calendar, text: 'Avisa sobre consultas próximas e prepara você para elas' },
                                { icon: Zap, text: 'Respostas instantâneas por texto e áudio 24/7' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                                    <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/10 flex items-center justify-center flex-shrink-0">
                                        <item.icon className="w-4 h-4 text-[#38bdf8]" />
                                    </div>
                                    <span>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Coluna 2: Chat Simulado da LIZ */}
                    <div className="bg-[#050811] rounded-2xl border border-white/[0.08] p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.06]">
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#38bdf8]/40">
                                <img src="/liz-avatar.jpg" alt="LIZ" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">LIZ</p>
                                <p className="text-[10px] text-emerald-400 font-medium">● Online agora</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* LIZ message */}
                            <div className="flex gap-3">
                                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-[#38bdf8]/30">
                                    <img src="/liz-avatar.jpg" alt="LIZ" className="w-full h-full object-cover" />
                                </div>
                                <div className="bg-[#0f172a] rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%] border border-white/[0.06]">
                                    <p className="text-sm text-slate-200">
                                        Bom dia! 🌅 Sua pressão de ontem ficou em <strong className="text-[#38bdf8]">14/9</strong>. 
                                        Lembre-se do Losartana 50mg às 8h. Sua consulta com Dr. Silva é amanhã às 10h.
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-2">07:15</p>
                                </div>
                            </div>

                            {/* User message */}
                            <div className="flex justify-end">
                                <div className="bg-[#0284c7] rounded-2xl rounded-tr-md px-4 py-3 max-w-[75%]">
                                    <p className="text-sm text-white">Obrigado, LIZ! Já tomei o remédio.</p>
                                    <p className="text-[10px] text-white/50 mt-2 text-right">07:18</p>
                                </div>
                            </div>

                            {/* LIZ response */}
                            <div className="flex gap-3">
                                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-[#38bdf8]/30">
                                    <img src="/liz-avatar.jpg" alt="LIZ" className="w-full h-full object-cover" />
                                </div>
                                <div className="bg-[#0f172a] rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%] border border-white/[0.06]">
                                    <p className="text-sm text-slate-200">
                                        Ótimo! ✅ Registrei a adesão. Sua próxima dose é às 20h. Quer que eu te avise?
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-2">07:18</p>
                                </div>
                            </div>
                        </div>

                        {/* Input bar */}
                        <div className="mt-6 flex items-center gap-2 bg-[#0f172a] rounded-full px-4 py-3 border border-white/[0.08]">
                            <input 
                                type="text" 
                                placeholder="Fale com a LIZ..." 
                                className="flex-1 bg-transparent text-sm text-slate-300 placeholder:text-slate-600 outline-none" 
                                readOnly 
                            />
                            <button className="w-8 h-8 rounded-full bg-[#0284c7] flex items-center justify-center flex-shrink-0">
                                <ArrowRight className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== 6. JORNADA EM 4 PASSOS ===== */}
            <section id="jornada" className="relative z-10 py-24 px-6 md:px-12 max-w-7xl mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-[#38bdf8] text-xs font-['Space_Grotesk',monospace] uppercase tracking-wider mb-4">
                        COMO FUNCIONA
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
                        Sua jornada de saúde em 4 passos
                    </h2>
                    <p className="text-slate-400 text-sm">
                        Do primeiro acesso ao acompanhamento contínuo — cada etapa conectada.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        {
                            step: '01',
                            title: 'Crie sua conta',
                            desc: 'Cadastre-se gratuitamente e preencha seu perfil de saúde em menos de 2 minutos.',
                            icon: UserPlus,
                        },
                        {
                            step: '02',
                            title: 'Triagem Inteligente',
                            desc: 'A LIZ faz uma triagem inicial por conversa, avalia seus sintomas e define a prioridade.',
                            icon: MessageSquare,
                        },
                        {
                            step: '03',
                            title: 'Consulta & Prescrição',
                            desc: 'Teleconsulta instantânea com especialista. Prescrição digital salva automaticamente.',
                            icon: Stethoscope,
                        },
                        {
                            step: '04',
                            title: 'Cuidado Contínuo',
                            desc: 'A LIZ monitora sinais vitais, lembra dos remédios e alerta sobre desvios de saúde.',
                            icon: Heart,
                        },
                    ].map((item, i) => (
                        <div
                            key={i}
                            className="group p-6 rounded-3xl bg-[#0a0f1d]/80 border border-white/[0.08] hover:border-[#38bdf8]/40 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(2,132,199,0.1)] relative overflow-hidden"
                        >
                            <div className="absolute top-4 right-4 text-[64px] font-['Space_Grotesk',monospace] font-black text-white/[0.03] leading-none select-none group-hover:text-[#38bdf8]/[0.08] transition-colors">
                                {item.step}
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-[#38bdf8]/10 flex items-center justify-center mb-5">
                                <item.icon className="w-5 h-5 text-[#38bdf8]" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                            {i < 3 && (
                                <ChevronRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-[#38bdf8]/30" />
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* ===== 7. CTA FINAL ===== */}
            <section className="relative z-10 py-24 px-6 md:px-12">
                <div className="max-w-4xl mx-auto text-center bg-gradient-to-b from-[#0f172a] to-[#0a1428] border border-white/[0.08] rounded-3xl p-12 sm:p-16 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-[#0284c7]/10 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-[#38bdf8]/5 blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[#38bdf8]/30 shadow-[0_0_30px_rgba(56,189,248,0.3)] mx-auto mb-8">
                            <img src="/elyon-logo.jpg" alt="ELYON" className="w-full h-full object-cover" />
                        </div>

                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
                            Comece sua jornada de saúde conectada
                        </h2>
                        <p className="text-slate-400 text-sm sm:text-base mb-10 max-w-xl mx-auto">
                            Crie sua conta gratuita e tenha acesso ao app do paciente, à LIZ e a todo o ecossistema ELYON.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => navigate('/app-paciente')}
                                className="px-8 py-4 rounded-full bg-white hover:bg-slate-100 text-[#050811] font-bold text-sm transition-all shadow-[0_10px_30px_rgba(255,255,255,0.15)] hover:-translate-y-0.5 flex items-center gap-2.5 group"
                            >
                                <Heart className="w-4 h-4 text-[#0284c7] fill-[#0284c7]" />
                                <span>Abrir App do Paciente</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#0284c7]" />
                            </button>

                            <button
                                onClick={() => navigate('/login')}
                                className="px-7 py-4 rounded-full border border-white/15 hover:border-white/40 bg-white/[0.03] text-slate-200 font-semibold text-sm hover:bg-white/[0.08] transition-all flex items-center gap-2"
                            >
                                <Users className="w-4 h-4 text-[#38bdf8]" />
                                Acesso para Clínicas
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="relative z-10 border-t border-white/[0.06] py-10 px-6 md:px-12">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl overflow-hidden border border-[#38bdf8]/20">
                            <img src="/elyon-logo.jpg" alt="ELYON" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-['Space_Grotesk',monospace] font-bold text-sm tracking-[0.15em] text-white">ELYON</span>
                    </div>
                    <p className="text-slate-500 text-xs">© 2026 ELYON Health Technologies — Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
