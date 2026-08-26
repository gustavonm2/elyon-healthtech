import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Eye, EyeOff, ClipboardList, Stethoscope, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { ProfessionalRole } from '../types';

const MemberRegistration: React.FC = () => {
    const navigate = useNavigate();
    const { addMember, getGroup } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [role, setRole] = useState<ProfessionalRole>('triador');
    const [groupCode, setGroupCode] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const inputCls =
        'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D3461] focus:border-transparent transition-all';

    const handleSubmit = async () => {
        setError('');
        if (!name.trim() || !email.trim() || !password || !groupCode.trim()) {
            setError('Preencha todos os campos obrigatórios.');
            return;
        }
        if (password !== passwordConfirm) {
            setError('As senhas não coincidem.');
            return;
        }
        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        try {
            const group = await getGroup(groupCode.trim());
            if (!group) {
                setError('Código do grupo inválido. Verifique com o administrador.');
                return;
            }

            const emailNorm = email.trim().toLowerCase();
            const alreadyExists =
                group.adminEmail.toLowerCase() === emailNorm ||
                group.members.some(m => m.email.toLowerCase() === emailNorm);

            if (alreadyExists) {
                setError('Este e-mail já está cadastrado neste grupo.');
                return;
            }

            const ok = await addMember(groupCode.trim(), {
                name: name.trim(),
                email: emailNorm,
                password,
                role,
            });

            if (ok === null) {
                setSuccess(true);
            } else {
                setError('Não foi possível cadastrar o membro. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F0F4F8] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Navbar */}
            <nav className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-500 hover:text-[#1D3461] transition-colors font-semibold text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" /> Voltar ao início
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8">
                            <div className="w-8 h-8 rounded-full border-[2.5px] border-[#1D3461] absolute left-0" />
                            <div className="w-8 h-8 rounded-full border-[2.5px] border-[#0EA5E9] absolute left-3" />
                        </div>
                        <div className="ml-4">
                            <span className="font-extrabold text-lg text-[#0F172A] leading-none block">SCI</span>
                            <span className="text-[#60A5FA] text-xs">Pareceres médicos</span>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex-1 flex items-center justify-center py-12 px-4">
                <div className="w-full max-w-md">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1D3461] shadow-lg shadow-[#1D3461]/30 mb-4">
                            <UserPlus className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-extrabold text-[#0F172A]">Entrar em uma Clínica</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Use o código fornecido pelo administrador da clínica
                        </p>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">

                        {success ? (
                            <div className="text-center py-8 space-y-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-2">
                                    <Check className="w-8 h-8 text-green-600" />
                                </div>
                                <h2 className="text-xl font-extrabold text-slate-700">Cadastro realizado!</h2>
                                <p className="text-slate-500 text-sm">
                                    Seu acesso foi criado com sucesso. Você já pode fazer login.
                                </p>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="mt-4 w-full bg-[#1D3461] hover:bg-[#162749] text-white font-bold py-3 rounded-xl transition-all"
                                >
                                    Ir para o login
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Nome completo *</label>
                                    <input className={inputCls} placeholder="Dr. Carlos Lima" value={name} onChange={e => setName(e.target.value)} />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Código do grupo *</label>
                                    <input
                                        className={inputCls}
                                        placeholder="Cole aqui o código enviado pelo administrador"
                                        value={groupCode}
                                        onChange={e => setGroupCode(e.target.value)}
                                    />
                                    <p className="text-xs text-slate-400 mt-1">
                                        O administrador da clínica fornece esse código ao convidar você.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">E-mail *</label>
                                    <input className={inputCls} type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Perfil de acesso *</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {(['triador', 'parecerista'] as ProfessionalRole[]).map(r => (
                                            <button
                                                key={r}
                                                onClick={() => setRole(r)}
                                                className="flex flex-col items-center gap-2 border-2 rounded-xl p-3 transition-all"
                                                style={{
                                                    borderColor: role === r ? '#1D3461' : '#e2e8f0',
                                                    background: role === r ? '#eff6ff' : '#fff',
                                                }}
                                            >
                                                {r === 'triador'
                                                    ? <ClipboardList className="w-5 h-5" style={{ color: role === r ? '#1D3461' : '#94a3b8' }} />
                                                    : <Stethoscope className="w-5 h-5" style={{ color: role === r ? '#1D3461' : '#94a3b8' }} />
                                                }
                                                <span
                                                    className="text-xs font-bold capitalize"
                                                    style={{ color: role === r ? '#1D3461' : '#94a3b8' }}
                                                >
                                                    {r === 'triador' ? 'Triador' : 'Parecerista'}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Senha *</label>
                                    <div className="relative">
                                        <input
                                            className={inputCls + ' pr-10'}
                                            type={showPwd ? 'text' : 'password'}
                                            placeholder="Mín. 6 caracteres"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                        />
                                        <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Confirmar senha *</label>
                                    <input
                                        className={inputCls}
                                        type="password"
                                        placeholder="Repita a senha"
                                        value={passwordConfirm}
                                        onChange={e => setPasswordConfirm(e.target.value)}
                                    />
                                </div>

                                {error && (
                                    <p className="text-red-500 text-sm font-semibold bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                                        {error}
                                    </p>
                                )}

                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full bg-[#1D3461] hover:bg-[#162749] disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-[#1D3461]/20 mt-2"
                                >
                                    {loading ? (
                                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                                    ) : (
                                        <UserPlus className="w-4 h-4" />
                                    )}
                                    {loading ? 'Cadastrando...' : 'Cadastrar como Membro'}
                                </button>
                            </div>
                        )}
                    </div>

                    <p className="text-center text-slate-400 text-xs mt-6">
                        Quer criar uma nova clínica?{' '}
                        <button onClick={() => navigate('/cadastro-clinica')} className="text-[#1D3461] font-bold hover:underline">
                            Criar clínica
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MemberRegistration;
