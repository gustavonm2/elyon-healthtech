import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Palette } from 'lucide-react';
import ColorPalettePanel from './ColorPalettePanel';
import { useAuth } from '../contexts/AuthContext';
import sciLoginBg from '../assets/sci-login-bg.jpg';


// ─── Main Component ───────────────────────────────────────────────────────────
const Login: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { loginUser } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPalettePanel, setShowPalettePanel] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [loading, setLoading] = useState(false);

    const justRegistered = (location.state as { registered?: boolean; clinicName?: string } | null)?.registered;
    const registeredClinicName = (location.state as { registered?: boolean; clinicName?: string } | null)?.clinicName;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        const lowerEmail = email.toLowerCase().trim();

        // Demo & Test Account Shortcuts
        if (lowerEmail.includes('simulador')) {
            await loginUser('simulador@elyon.ai', '1');
            navigate('/simulador');
            return;
        } else if (lowerEmail.includes('recepcao')) {
            await loginUser('recepcaoupa@elyon.ai', '1');
            navigate('/recepcao-upa');
            return;
        } else if (lowerEmail.includes('triagem')) {
            await loginUser('triagemupa@elyon.ai', '1');
            navigate('/triagem-upa');
            return;
        } else if (lowerEmail.includes('usuario 1')) {
            localStorage.setItem('userRole', 'triador');
            navigate('/dashboard');
            return;
        } else if (lowerEmail.includes('usuario 2')) {
            localStorage.setItem('userRole', 'parecerista');
            navigate('/dashboard');
            return;
        } else if (lowerEmail.includes('usuario 3')) {
            localStorage.setItem('userRole', 'paciente');
            navigate('/portal-paciente');
            return;
        } else if (lowerEmail.includes('gestor') || lowerEmail.includes('master')) {
            localStorage.setItem('userRole', 'gestor_master');
            navigate('/gestao-master');
            return;
        }

        setLoading(true);
        try {
            const role = await loginUser(email, password);
            if (role) {
                if (role === 'simulador') navigate('/simulador');
                else if (role === 'gestor_master') navigate('/gestao-master');
                else if (role === 'paciente') navigate('/portal-paciente');
                else if (role === 'recepcao_upa') navigate('/recepcao-upa');
                else if (role === 'triagem_upa') navigate('/triagem-upa');
                else navigate('/dashboard');
                return;
            }
            setLoginError('E-mail ou senha incorretos. Verifique suas credenciais.');
        } catch {
            setLoginError('Erro ao conectar. Verifique sua conexão e tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleGestorMasterAccess = () => {
        setShowPalettePanel(false);
        localStorage.setItem('userRole', 'gestor_master');
        navigate('/gestao-master');
    };

    return (
        <div className="min-h-screen flex" style={{ fontFamily: 'Inter, sans-serif' }}>

            {/* ── LEFT PANEL — Imagem de fundo ── */}
            <div
                className="hidden lg:flex lg:w-[42%] xl:w-[40%] relative overflow-hidden"
            >
                <img
                    src={sciLoginBg}
                    alt="SCI Pareceres Médicos"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Bottom bar */}
                <div
                    className="absolute bottom-6 left-0 right-0 text-center text-[11px] font-medium z-10"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                    © 2026 EXÔNIA — Todos os direitos reservados
                </div>
            </div>

            {/* ── RIGHT PANEL — Form ── */}
            <div className="flex-1 relative flex items-center justify-center bg-[#F5F5F0] overflow-hidden">

                {/* Botão Voltar */}
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-5 left-5 z-20 flex items-center gap-1.5 text-[13px] font-semibold text-[#1D3461] hover:text-[#162749] transition-colors group"
                >
                    <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    Voltar ao início
                </button>

                {/* Card */}
                <div className="relative z-10 w-full max-w-[400px] mx-6">

                    {/* Success banner */}
                    {justRegistered && (
                        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-semibold text-center">
                            ✅ Clínica <strong>{registeredClinicName}</strong> cadastrada! Faça login para acessar.
                        </div>
                    )}

                    <div
                        className="bg-white rounded-[20px] shadow-[0_8px_40px_rgba(0,0,0,0.10)] border border-[#E8E8E4] px-8 py-9"
                    >
                        {/* Mobile logo */}
                        <div className="lg:hidden flex justify-center mb-5">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center shadow"
                                style={{ background: 'linear-gradient(135deg, #8B1A2A, #4D0C18)' }}
                            >
                                <span className="text-white font-black text-xl">S</span>
                            </div>
                        </div>

                        <h1 className="text-[22px] font-extrabold text-[#1A1A1A] tracking-tight mb-1">
                            Entre na sua conta
                        </h1>
                        <p className="text-[13px] text-[#888] font-medium mb-7">
                            Bem-vindo de volta ao SCI
                        </p>

                        <form className="space-y-4" onSubmit={handleLogin}>
                            {/* E-mail */}
                            <div>
                                <label htmlFor="email" className="block text-[13px] font-semibold text-[#444] mb-1.5">
                                    E-mail
                                </label>
                                <input
                                    id="email"
                                    type="text"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="w-full px-4 py-3 rounded-[12px] border border-[#E0E0DC] bg-[#FAFAF8] text-[14px] text-[#1A1A1A] font-medium placeholder-[#BBBBB5] focus:outline-none focus:border-[#C0392B] focus:ring-2 focus:ring-[#C0392B]/20 transition-all"
                                />
                            </div>

                            {/* Senha */}
                            <div>
                                <label htmlFor="password" className="block text-[13px] font-semibold text-[#444] mb-1.5">
                                    Senha
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-4 pr-11 py-3 rounded-[12px] border border-[#E0E0DC] bg-[#FAFAF8] text-[14px] text-[#1A1A1A] font-medium placeholder-[#BBBBB5] focus:outline-none focus:border-[#C0392B] focus:ring-2 focus:ring-[#C0392B]/20 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(p => !p)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#AAA] hover:text-[#555] transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Esqueceu */}
                            <div className="flex justify-end">
                                <a href="#" className="text-[13px] font-semibold text-[#C0392B] hover:text-[#922B21] transition-colors">
                                    Esqueceu sua senha?
                                </a>
                            </div>

                            {/* Erro */}
                            {loginError && (
                                <div className="bg-red-50 border border-red-200 rounded-[10px] px-4 py-2.5 text-[13px] text-red-600 font-semibold text-center">
                                    {loginError}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 rounded-[12px] text-white text-[14px] font-bold tracking-wide transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60 shadow-lg mt-1 flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #1D3461 0%, #162749 100%)' }}
                            >
                                {loading ? (
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                                ) : null}
                                {loading ? 'Entrando...' : 'Entrar'}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-5">
                            <div className="flex-1 h-px bg-[#E8E8E4]" />
                            <span className="text-[11px] font-medium text-[#BBBBB5] uppercase tracking-wide">ou</span>
                            <div className="flex-1 h-px bg-[#E8E8E4]" />
                        </div>

                        {/* Secondary actions */}
                        <div className="space-y-2.5">
                            <button
                                onClick={() => navigate('/cadastro-clinica')}
                                className="w-full py-2.5 rounded-[12px] text-[13px] font-bold border-2 border-[#1D3461] text-[#1D3461] hover:bg-[#EEF4FA] transition-colors"
                            >
                                Criar minha Clínica
                            </button>
                            <button
                                onClick={() => navigate('/cadastro-membro')}
                                className="w-full py-2.5 rounded-[12px] text-[13px] font-bold border border-[#E0E0DC] text-[#666] hover:bg-[#F8F8F5] transition-colors"
                            >
                                Entrar em uma Clínica existente
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Hidden palette trigger ── */}
            <button
                id="sci-palette-trigger"
                onClick={() => setShowPalettePanel(prev => !prev)}
                className="fixed bottom-4 right-4 w-11 h-11 rounded-full flex items-center justify-center z-50 transition-all duration-300"
                style={{
                    background: showPalettePanel ? '#8B1A2A' : 'transparent',
                    border: '2px solid transparent',
                }}
                onMouseEnter={e => { if (!showPalettePanel) (e.currentTarget as HTMLElement).style.background = '#8B1A2A'; }}
                onMouseLeave={e => { if (!showPalettePanel) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                title="Configurações de Aparência"
            >
                <Palette className="w-5 h-5 transition-all duration-300" style={{ color: showPalettePanel ? 'white' : 'transparent' }} />
            </button>

            {showPalettePanel && (
                <ColorPalettePanel
                    onClose={() => setShowPalettePanel(false)}
                    onGestorMasterAccess={handleGestorMasterAccess}
                />
            )}
        </div>
    );
};

export default Login;
