import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, UserPlus, Building2, MessageSquare, Video, RefreshCw, BarChart2, LifeBuoy, Heart, Stethoscope, ClipboardList } from 'lucide-react';

const Home: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F0F4F8] font-['Inter',sans-serif] text-slate-900">

            {/* ===== NAVBAR ===== */}
            <nav className="bg-white fixed w-full z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <img
                            src="/src/assets/sci-logo-clean.png"
                            alt="SCI Logo"
                            className="w-12 h-12 object-contain"
                            style={{ mixBlendMode: 'multiply' }}
                        />
                        <span className="font-bold text-base text-[#1D3461] tracking-wide">Pareceres Médicos</span>
                    </div>

                    {/* Nav Links */}
                    <div className="hidden md:flex items-center gap-10 font-semibold text-sm text-[#1E293B]">
                        <a href="#como-funciona" className="hover:text-[#1D3461] transition-colors">Como funciona</a>
                        <a href="#solucoes" className="hover:text-[#1D3461] transition-colors">Soluções</a>
                        <a href="#contato" className="hover:text-[#1D3461] transition-colors">Contato</a>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-[#1D3461] hover:bg-[#162749] text-white font-bold px-5 py-2.5 rounded-full text-sm transition-all"
                        >
                            Acesso Restrito <ArrowRight className="inline w-4 h-4 ml-1" />
                        </button>
                    </div>

                    {/* Mobile access button */}
                    <button
                        onClick={() => navigate('/login')}
                        className="md:hidden bg-[#1D3461] text-white font-bold px-4 py-2 rounded-full text-sm"
                    >
                        Acessar
                    </button>
                </div>
            </nav>

            {/* ===== HERO SECTION ===== */}
            <section className="pt-20 bg-white">
                <div className="flex flex-col lg:flex-row" style={{ minHeight: '480px' }}>
                        {/* Left: Image */}
                        <div className="lg:w-1/2 relative min-h-[380px]">
                            <img
                                src="/doctor_hero.png"
                                alt="Médico usando o SCI"
                                className="w-full h-full object-cover object-top"
                                style={{ minHeight: '480px' }}
                            />
                        </div>

                        {/* Right: Text */}
                        <div className="lg:w-1/2 px-12 py-16 flex flex-col justify-center bg-white">
                            <p className="text-[#1D3461] text-xs font-bold tracking-widest uppercase mb-3">
                                SCI — SISTEMA DE CUIDADO INTEGRADO
                            </p>
                            <h1 className="text-3xl lg:text-4xl font-extrabold text-[#0F172A] leading-tight mb-5">
                                Agilidade que acelera decisões.<br />
                                <span className="text-[#1D3461]">Segurança que sustenta cada conduta clínica.</span>
                            </h1>
                            <p className="text-base text-slate-500 leading-relaxed mb-8">
                                Uma plataforma completa para gestão de interconsultas médicas — assíncronas, por vídeo ou presenciais — integrando prontuário, histórico clínico e rastreabilidade total em cada etapa do cuidado.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => navigate('/cadastro-clinica')}
                                    className="border-2 border-[#1D3461] text-[#1D3461] hover:bg-[#EEF4FA] font-bold px-8 py-4 rounded-full flex items-center gap-2 transition-all"
                                >
                                    <Users className="w-5 h-5" /> Criar minha Clínica Virtual
                                </button>
                                <button
                                    onClick={() => navigate('/cadastro')}
                                    className="bg-[#9B1C2E] hover:bg-[#7A1525] text-white font-bold px-8 py-4 rounded-full flex items-center gap-2 transition-all shadow-lg shadow-red-900/25"
                                >
                                    <UserPlus className="w-5 h-5" /> Sou Paciente – Cadastrar-me
                                </button>
                            </div>
                        </div>
                </div>
            </section>

            {/* ===== SECTION 2: Para quem é o SCI ===== */}
            <section className="py-20 bg-[#F0F4F8]">
                <div className="px-8 lg:px-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl lg:text-4xl font-extrabold text-[#0F172A]">
                            Uma solução para <span className="text-[#1D3461]">cada perfil</span>
                        </h2>
                        <p className="text-slate-500 mt-3 text-base max-w-xl mx-auto">
                            Profissionais de saúde e pacientes em um único ecossistema digital.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Card 1 — Clínicas */}
                        <div className="bg-[#1E40AF] rounded-2xl p-8 relative flex flex-col justify-between min-h-[200px]">
                            <div className="absolute -top-6 left-8">
                                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                    <img src="/testimonial_1.png" alt="Gestor de clínica" className="w-full h-full object-cover object-top" />
                                </div>
                            </div>
                            <div className="mt-14">
                                <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">Para clínicas, hospitais e profissionais autônomos</p>
                                <p className="text-white text-lg font-bold leading-snug">
                                    Crie sua clínica virtual, adicione pareceristas e triadores, configure a agenda de disponibilidade e acompanhe KPIs de resolutividade e tempo de resposta — tudo no Painel do Gestor.
                                </p>
                            </div>
                            <div className="mt-6">
                                <div className="w-9 h-9 rounded-full border-2 border-white/40 flex items-center justify-center">
                                    <Building2 className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Card 2 — Pacientes */}
                        <div className="bg-[#0369A1] rounded-2xl p-8 relative flex flex-col justify-between min-h-[200px]">
                            <div className="absolute -top-6 left-8">
                                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                    <img src="/testimonial_2.png" alt="Paciente" className="w-full h-full object-cover object-top" />
                                </div>
                            </div>
                            <div className="mt-14">
                                <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">Para o paciente</p>
                                <p className="text-white text-lg font-bold leading-snug">
                                    Acesse seu prontuário digital, veja pareceres médicos emitidos, prescrições, solicitações de exames e o histórico completo de saúde — diretamente pelo Portal do Paciente.
                                </p>
                            </div>
                            <div className="mt-6">
                                <div className="w-9 h-9 rounded-full border-2 border-white/40 flex items-center justify-center">
                                    <Heart className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== SECTION 3: COMO FUNCIONA ===== */}
            <section id="como-funciona" className="py-20 bg-white">
                <div className="px-8 lg:px-20">
                    <h2 className="text-3xl font-extrabold text-[#0F172A] text-center mb-20">Como funciona?</h2>

                    {/* Steps grid – zigzag layout like reference */}
                    <div className="flex flex-col gap-24">

                        {/* Row 1 – Step 1 left, Step 2 right */}
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            {/* Step 1 */}
                            <div className="flex flex-col items-center text-center relative">
                                {/* Decorative shapes */}
                                <div className="absolute -top-6 right-4 w-12 h-12 rounded-full bg-[#A8C4DA] opacity-70"></div>
                                <div className="absolute -top-2 right-0 w-8 h-8 rounded bg-[#1D3461] opacity-50 rotate-12"></div>
                                <div className="absolute top-8 -left-4 w-10 h-10 rounded-full bg-[#0EA5E9] opacity-40"></div>

                                {/* Circle image */}
                                <div className="relative mb-4">
                                    <div className="w-52 h-52 rounded-full overflow-hidden border-8 border-[#EEF4FA] shadow-xl">
                                        <img src="/doctor_hero.png" alt="IA Médica" className="w-full h-full object-cover object-top" />
                                    </div>
                                    {/* Number badge */}
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#1D3461] text-white font-extrabold text-lg flex items-center justify-center shadow-lg">
                                        1
                                    </div>
                                </div>
                                <h3 className="font-extrabold text-[#0F172A] mt-6 text-lg">Triagem & Cadastro</h3>
                                <p className="text-slate-500 text-sm mt-2 max-w-xs">
                                    O paciente se cadastra no portal e acessa a fila de espera. O triador recebe o caso, analisa o quadro clínico e encaminha para o especialista correto.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col items-center text-center relative">
                                {/* Decorative shapes */}
                                <div className="absolute -top-6 left-4 w-12 h-12 rounded-full bg-[#7DD3FC] opacity-60"></div>
                                <div className="absolute top-4 -right-2 w-8 h-16 rounded-full bg-[#A8C4DA] opacity-60"></div>

                                {/* Circle image */}
                                <div className="relative mb-4">
                                    <div className="w-52 h-52 rounded-full overflow-hidden border-8 border-[#EEF4FA] shadow-xl">
                                        <img src="/doctor_phone.png" alt="Solicitação de parecer" className="w-full h-full object-cover object-center" />
                                    </div>
                                    {/* Number badge */}
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#1D3461] text-white font-extrabold text-lg flex items-center justify-center shadow-lg">
                                        2
                                    </div>
                                </div>
                                <h3 className="font-extrabold text-[#0F172A] mt-6 text-lg">Solicitação de Parecer</h3>
                                <p className="text-slate-500 text-sm mt-2 max-w-xs">
                                    O profissional solicitante abre um pedido de interconsulta com descrição clínica, prioridade (urgente / eletivo) e prazo. O parecerista recebe na Central de Pareceres.
                                </p>
                            </div>
                        </div>

                        {/* Divider arrow */}
                        <div className="flex justify-center -my-10">
                            <div className="w-8 h-8 flex items-center justify-center">
                                <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#1D3461] fill-[#1D3461]">
                                    <path d="M12 2L2 12h5v10h10V12h5z" />
                                </svg>
                            </div>
                        </div>

                        {/* Row 2 – Step 4 left, Step 3 right */}
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            {/* Step 4 */}
                            <div className="flex flex-col items-center text-center relative">
                                {/* Decorative shapes */}
                                <div className="absolute -top-6 right-2 w-16 h-8 rounded-full bg-[#A8C4DA] opacity-60"></div>
                                <div className="absolute top-12 right-0 w-8 h-8 rounded-full bg-[#7DD3FC] opacity-50"></div>
                                <div className="absolute -top-4 left-6 w-10 h-10 rounded bg-[#1E40AF] opacity-30 rotate-6"></div>

                                {/* Circle image */}
                                <div className="relative mb-4">
                                    <div className="w-52 h-52 rounded-full overflow-hidden border-8 border-[#EEF4FA] shadow-xl">
                                        <img src="/patient_happy.png" alt="Desfecho clínico" className="w-full h-full object-cover object-top" />
                                    </div>
                                    {/* Number badge */}
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#1D3461] text-white font-extrabold text-lg flex items-center justify-center shadow-lg">
                                        4
                                    </div>
                                </div>
                                <h3 className="font-extrabold text-[#0F172A] mt-6 text-lg">Desfecho Clínico & Prontuário</h3>
                                <p className="text-slate-500 text-sm mt-2 max-w-xs">
                                    O parecer fica registrado no prontuário do paciente. Prescrições e exames são emitidos digitalmente e disponibilizados diretamente no Portal do Paciente.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col items-center text-center relative">
                                {/* Decorative shapes */}
                                <div className="absolute -top-4 left-2 w-10 h-10 rounded-full bg-[#1D3461] opacity-20"></div>
                                <div className="absolute top-0 right-6 w-14 h-7 rounded-full bg-[#7DD3FC] opacity-50"></div>

                                {/* Circle image */}
                                <div className="relative mb-4">
                                    <div className="w-52 h-52 rounded-full overflow-hidden border-8 border-[#EEF4FA] shadow-xl">
                                        <img src="/doctors_consulting.png" alt="Parecer assíncrono ou teleconsulta" className="w-full h-full object-cover object-center" />
                                    </div>
                                    {/* Number badge */}
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#1D3461] text-white font-extrabold text-lg flex items-center justify-center shadow-lg">
                                        3
                                    </div>
                                </div>
                                <h3 className="font-extrabold text-[#0F172A] mt-6 text-lg">Parecer Assíncrono ou Teleconsulta</h3>
                                <p className="text-slate-500 text-sm mt-2 max-w-xs">
                                    O parecerista responde por chat, já incluindo condutas e hipóteses diagnósticas nos resultados do parecer — sem necessidade de reunião em tempo real. O parecer é automaticamente registrado no prontuário e repassado ao paciente. Quando necessário, pode iniciar uma teleconsulta em vídeo.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CTA button below steps */}
                    <div className="flex justify-center mt-16">
                        <button
                            onClick={() => navigate('/cadastro-clinica')}
                            className="bg-[#1D3461] hover:bg-[#162749] text-white font-bold px-10 py-4 rounded-full text-base transition-all shadow-lg shadow-[#1D3461]/25"
                        >
                            Criar minha Clínica Virtual
                        </button>
                    </div>
                </div>
            </section>

            {/* ===== SECTION 4: Funcionalidades reais ===== */}
            <section id="solucoes" className="py-16 bg-[#1E40AF]">
                <div className="px-8 lg:px-20">
                    <h2 className="text-2xl font-extrabold text-white text-center mb-4">
                        Tudo que sua clínica precisa em uma plataforma
                    </h2>
                    <p className="text-white/60 text-center text-sm mb-14 max-w-xl mx-auto">
                        Funcionalidades desenvolvidas para o fluxo real de interconsultas médicas.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                        {/* Feature 1 */}
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                                <Building2 className="w-7 h-7 text-white" strokeWidth={1.5} />
                            </div>
                            <p className="text-white font-bold text-sm">Clínica Virtual</p>
                            <p className="text-white/60 text-xs leading-snug">
                                Crie seu grupo, adicione membros e configure tudo em minutos.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                                <ClipboardList className="w-7 h-7 text-white" strokeWidth={1.5} />
                            </div>
                            <p className="text-white font-bold text-sm">Central de Pareceres</p>
                            <p className="text-white/60 text-xs leading-snug">
                                Gerencie solicitações com prioridade, prazo e status em tempo real.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                                <MessageSquare className="w-7 h-7 text-white" strokeWidth={1.5} />
                            </div>
                            <p className="text-white font-bold text-sm">Parecer por Chat</p>
                            <p className="text-white/60 text-xs leading-snug">
                                Resposta assíncrona com condutas salvas no prontuário e repassadas ao paciente.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                                <Video className="w-7 h-7 text-white" strokeWidth={1.5} />
                            </div>
                            <p className="text-white font-bold text-sm">Teleconsulta em Vídeo</p>
                            <p className="text-white/60 text-xs leading-snug">
                                Médico e paciente se conectam diretamente, sem app externo.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                                <RefreshCw className="w-7 h-7 text-white" strokeWidth={1.5} />
                            </div>
                            <p className="text-white font-bold text-sm">Repasse de Caso</p>
                            <p className="text-white/60 text-xs leading-snug">
                                Transfira um caso a outro colega com justificativa obrigatória.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                                <BarChart2 className="w-7 h-7 text-white" strokeWidth={1.5} />
                            </div>
                            <p className="text-white font-bold text-sm">Dashboard de Gestão</p>
                            <p className="text-white/60 text-xs leading-snug">
                                KPIs de resolutividade, tempo de resposta e ocupação de agenda.
                            </p>
                        </div>

                        {/* Feature 7 */}
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                                <Stethoscope className="w-7 h-7 text-white" strokeWidth={1.5} />
                            </div>
                            <p className="text-white font-bold text-sm">Prontuário Digital</p>
                            <p className="text-white/60 text-xs leading-snug">
                                Histórico, prescrições e exames acessíveis no portal do paciente.
                            </p>
                        </div>

                        {/* Feature 8 */}
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                                <LifeBuoy className="w-7 h-7 text-white" strokeWidth={1.5} />
                            </div>
                            <p className="text-white font-bold text-sm">Suporte Técnico</p>
                            <p className="text-white/60 text-xs leading-snug">
                                Qualquer usuário pode abrir tickets. O Gestor Master responde diretamente.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== SECTION 5: Depoimentos ===== */}
            <section className="py-20 bg-[#F0F4F8]">
                <div className="px-8 lg:px-20">
                    <h2 className="text-3xl font-extrabold text-[#0F172A] text-center mb-12">
                        O que dizem os <span className="text-[#1D3461]">especialistas</span>
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Card 1 */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 relative">
                            <div className="text-[64px] font-serif text-[#A8C4DA] absolute top-4 left-6 leading-none select-none">"</div>
                            <p className="text-slate-500 text-base italic relative z-10 mb-8 pt-6">
                                Com o SCI, nosso fluxo de triagem ficou completamente digital. O parecerista recebe o caso na hora, o histórico está sempre disponível e nunca mais perdemos uma solicitação urgente.
                            </p>
                            <div className="flex items-center border-t border-slate-100 pt-6">
                                <img src="/testimonial_1.png" alt="Enf. Renata Braga" className="w-14 h-14 rounded-full object-cover mr-4" />
                                <div>
                                    <h4 className="font-bold text-[#0F172A]">Enf. Renata Braga</h4>
                                    <p className="text-sm text-slate-400">Coordenadora de UTI, Hospital São Marcos</p>
                                </div>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 relative">
                            <div className="text-[64px] font-serif text-[#A8C4DA] absolute top-4 left-6 leading-none select-none">"</div>
                            <p className="text-slate-500 text-base italic relative z-10 mb-8 pt-6">
                                O painel de gestão nos permite ver em tempo real quantos pareceres estão pendentes, qual é o tempo médio de resposta e a taxa de resolutividade da equipe. É governança clínica de verdade.
                            </p>
                            <div className="flex items-center border-t border-slate-100 pt-6">
                                <img src="/testimonial_2.png" alt="Dr. Felipe Andrade" className="w-14 h-14 rounded-full object-cover object-top mr-4" />
                                <div>
                                    <h4 className="font-bold text-[#0F172A]">Dr. Felipe Andrade</h4>
                                    <p className="text-sm text-slate-400">Gestor Assistencial, Clínica Integrada SP</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== CTA FINAL ===== */}
            <section id="contato" className="py-24 bg-[#0F172A] relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-[#1D3461]/20 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-[#1E40AF]/30 blur-3xl pointer-events-none"></div>

                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">
                        Comece agora. É gratuito para criar sua clínica.
                    </h2>
                    <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
                        Configure sua clínica virtual, adicione sua equipe e comece a gerenciar pareceres hoje mesmo. Sem contrato, sem custo inicial.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => navigate('/cadastro-clinica')}
                            className="bg-[#1D3461] hover:bg-[#162749] text-white font-bold text-base px-9 py-4 rounded-full transition-all shadow-xl shadow-[#1D3461]/20"
                        >
                            Criar minha Clínica Virtual
                        </button>
                        <button
                            onClick={() => navigate('/cadastro')}
                            className="bg-[#9B1C2E] hover:bg-[#7A1525] text-white font-bold text-base px-9 py-4 rounded-full transition-all shadow-xl shadow-red-900/20"
                        >
                            <UserPlus className="inline w-4 h-4 mr-2" />Sou Paciente – Cadastrar-me
                        </button>
                    </div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="bg-slate-900 border-t border-slate-800 py-8">
                <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                            <img
                                src="/src/assets/sci-logo-clean.png"
                                alt="SCI Logo"
                                className="w-10 h-10 object-contain"
                                style={{ mixBlendMode: 'multiply' }}
                            />
                        </div>
                        <span className="font-bold text-sm text-white leading-tight">Pareceres <span className="text-[#60A5FA] font-medium">Médicos</span></span>
                    </div>
                    <p className="text-slate-500 text-sm">© 2026 EXÔNIA — Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
