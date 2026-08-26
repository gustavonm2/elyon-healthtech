import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, Building2, UserPlus, Trash2,
    Check, Shield, Stethoscope, ClipboardList, Eye, EyeOff,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { ProfessionalRole } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemberDraft {
    id: string;
    name: string;
    email: string;
    password: string;
    role: ProfessionalRole;
}

// ─── Steps Indicator ──────────────────────────────────────────────────────────

const StepIndicator: React.FC<{ step: number }> = ({ step }) => {
    const steps = [
        { label: 'Dados do Admin', icon: Shield },
        { label: 'Membros', icon: UserPlus },
        { label: 'Revisão', icon: Check },
    ];
    return (
        <div className="flex items-center gap-0 justify-center mb-10">
            {steps.map((s, i) => {
                const active = i === step;
                const done = i < step;
                const Icon = s.icon;
                return (
                    <React.Fragment key={i}>
                        <div className="flex flex-col items-center gap-1">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300"
                                style={{
                                    background: done ? '#16a34a' : active ? '#1D3461' : '#e2e8f0',
                                    color: done || active ? '#fff' : '#94a3b8',
                                }}
                            >
                                {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                            </div>
                            <span
                                className="text-xs font-semibold whitespace-nowrap"
                                style={{ color: active ? '#1D3461' : done ? '#16a34a' : '#94a3b8' }}
                            >
                                {s.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div
                                className="h-0.5 w-16 mb-4 mx-1 transition-all duration-300"
                                style={{ background: done ? '#16a34a' : '#e2e8f0' }}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// ─── Role Badge ───────────────────────────────────────────────────────────────

const RoleBadge: React.FC<{ role: ProfessionalRole }> = ({ role }) => (
    <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
        style={{
            background: role === 'triador' ? '#dbeafe' : '#f3e8ff',
            color: role === 'triador' ? '#1d4ed8' : '#7c3aed',
        }}
    >
        {role === 'triador' ? <ClipboardList className="w-3 h-3" /> : <Stethoscope className="w-3 h-3" />}
        {role === 'triador' ? 'Triador' : 'Parecerista'}
    </span>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const ClinicRegistration: React.FC = () => {
    const navigate = useNavigate();
    const { registerGroup, addMember } = useAuth();

    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Step 0 — Admin data
    const [adminName, setAdminName] = useState('');
    const [clinicName, setClinicName] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('');
    const [showAdminPwd, setShowAdminPwd] = useState(false);
    const [step0Error, setStep0Error] = useState('');

    // Step 1 — Members
    const [members, setMembers] = useState<MemberDraft[]>([]);
    const [memberName, setMemberName] = useState('');
    const [memberEmail, setMemberEmail] = useState('');
    const [memberPassword, setMemberPassword] = useState('');
    const [memberRole, setMemberRole] = useState<ProfessionalRole>('triador');
    const [showMemberPwd, setShowMemberPwd] = useState(false);
    const [memberError, setMemberError] = useState('');

    // ── Validation Step 0 ───────────────────────────────────────────────────
    const handleStep0Next = () => {
        if (!adminName.trim() || !clinicName.trim() || !specialty.trim() || !adminEmail.trim() || !adminPassword) {
            setStep0Error('Preencha todos os campos obrigatórios.');
            return;
        }
        if (adminPassword !== adminPasswordConfirm) {
            setStep0Error('As senhas não coincidem.');
            return;
        }
        if (adminPassword.length < 6) {
            setStep0Error('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        setStep0Error('');
        setStep(1);
    };

    // ── Add Member ──────────────────────────────────────────────────────────
    const handleAddMember = () => {
        if (!memberName.trim() || !memberEmail.trim() || !memberPassword) {
            setMemberError('Preencha nome, e-mail e senha do membro.');
            return;
        }
        if (memberPassword.length < 6) {
            setMemberError('A senha do membro deve ter pelo menos 6 caracteres.');
            return;
        }
        const alreadyExists =
            members.some(m => m.email.toLowerCase() === memberEmail.toLowerCase().trim()) ||
            adminEmail.toLowerCase() === memberEmail.toLowerCase().trim();
        if (alreadyExists) {
            setMemberError('Este e-mail já está cadastrado.');
            return;
        }
        setMemberError('');
        setMembers(prev => [
            ...prev,
            {
                id: `draft-${Date.now()}`,
                name: memberName.trim(),
                email: memberEmail.trim().toLowerCase(),
                password: memberPassword,
                role: memberRole,
            },
        ]);
        setMemberName('');
        setMemberEmail('');
        setMemberPassword('');
        setMemberRole('triador');
    };

    const removeMember = (id: string) => setMembers(prev => prev.filter(m => m.id !== id));

    // ── Final Submit ────────────────────────────────────────────────────────
    const handleFinish = async () => {
        setSubmitError('');
        setLoading(true);
        try {
            const groupId = await registerGroup({
                name: clinicName.trim(),
                specialty: specialty.trim(),
                adminName: adminName.trim(),
                adminEmail: adminEmail.trim().toLowerCase(),
                adminPassword,
            });
            for (const m of members) {
                await addMember(groupId, { name: m.name, email: m.email, password: m.password, role: m.role });
            }
            navigate('/login', { state: { registered: true, clinicName } });
        } catch (err) {
            setSubmitError('Erro ao finalizar o cadastro. Tente novamente.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // ── Input style helper ──────────────────────────────────────────────────
    const inputCls =
        'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D3461] focus:border-transparent transition-all';

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
                <div className="w-full max-w-2xl">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1D3461] shadow-lg shadow-[#1D3461]/30 mb-4">
                            <Building2 className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-extrabold text-[#0F172A]">Criar minha Clínica</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Configure seu grupo de profissionais no SCI em poucos passos
                        </p>
                    </div>

                    <StepIndicator step={step} />

                    {/* Card */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">

                        {/* ─── STEP 0: Admin data ─────────────────────────── */}
                        {step === 0 && (
                            <div className="space-y-5">
                                <h2 className="text-base font-bold text-slate-700 mb-1 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-[#1D3461]" /> Dados do Administrador
                                </h2>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Nome completo *</label>
                                        <input className={inputCls} placeholder="Dr. João Silva" value={adminName} onChange={e => setAdminName(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Nome da Clínica / Grupo *</label>
                                        <input className={inputCls} placeholder="Clínica Saúde Integrada" value={clinicName} onChange={e => setClinicName(e.target.value)} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Especialidade principal *</label>
                                    <select
                                        className={inputCls}
                                        value={specialty}
                                        onChange={e => setSpecialty(e.target.value)}
                                    >
                                        <option value="">Selecione...</option>
                                        {[
                                            'Clínica Geral', 'Cardiologia', 'Neurologia', 'Ortopedia',
                                            'Pediatria', 'Ginecologia', 'Oncologia', 'Psiquiatria',
                                            'Dermatologia', 'Endocrinologia', 'Outra',
                                        ].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">E-mail do administrador *</label>
                                    <input className={inputCls} type="email" placeholder="admin@clinica.com" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Senha *</label>
                                        <div className="relative">
                                            <input
                                                className={inputCls + ' pr-10'}
                                                type={showAdminPwd ? 'text' : 'password'}
                                                placeholder="Mín. 6 caracteres"
                                                value={adminPassword}
                                                onChange={e => setAdminPassword(e.target.value)}
                                            />
                                            <button type="button" onClick={() => setShowAdminPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                {showAdminPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Confirmar senha *</label>
                                        <input
                                            className={inputCls}
                                            type="password"
                                            placeholder="Repita a senha"
                                            value={adminPasswordConfirm}
                                            onChange={e => setAdminPasswordConfirm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {step0Error && (
                                    <p className="text-red-500 text-sm font-semibold bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                                        {step0Error}
                                    </p>
                                )}

                                <button
                                    onClick={handleStep0Next}
                                    className="w-full bg-[#1D3461] hover:bg-[#162749] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-[#1D3461]/20"
                                >
                                    Próximo: Adicionar Membros <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* ─── STEP 1: Members ────────────────────────────── */}
                        {step === 1 && (
                            <div className="space-y-5">
                                <h2 className="text-base font-bold text-slate-700 mb-1 flex items-center gap-2">
                                    <UserPlus className="w-4 h-4 text-[#1D3461]" /> Adicionar Membros da Equipe
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Opcional — você também pode adicionar membros depois de criar a clínica.
                                </p>

                                {/* Add member form */}
                                <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50 space-y-4">
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Nome do membro</label>
                                            <input className={inputCls} placeholder="Dra. Maria Costa" value={memberName} onChange={e => setMemberName(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">E-mail</label>
                                            <input className={inputCls} type="email" placeholder="membro@clinica.com" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Senha do membro</label>
                                            <div className="relative">
                                                <input
                                                    className={inputCls + ' pr-10'}
                                                    type={showMemberPwd ? 'text' : 'password'}
                                                    placeholder="Mín. 6 caracteres"
                                                    value={memberPassword}
                                                    onChange={e => setMemberPassword(e.target.value)}
                                                />
                                                <button type="button" onClick={() => setShowMemberPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                    {showMemberPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Papel / Perfil</label>
                                            <select className={inputCls} value={memberRole} onChange={e => setMemberRole(e.target.value as ProfessionalRole)}>
                                                <option value="triador">Triador</option>
                                                <option value="parecerista">Parecerista</option>
                                            </select>
                                        </div>
                                    </div>

                                    {memberError && (
                                        <p className="text-red-500 text-sm font-semibold">{memberError}</p>
                                    )}

                                    <button
                                        onClick={handleAddMember}
                                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1D3461] hover:bg-[#162749] text-white text-sm font-bold transition-all"
                                    >
                                        <UserPlus className="w-4 h-4" /> Adicionar à Lista
                                    </button>
                                </div>

                                {/* Member list */}
                                {members.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                            Membros adicionados ({members.length})
                                        </p>
                                        {members.map(m => (
                                            <div
                                                key={m.id}
                                                className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm"
                                            >
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700">{m.name}</p>
                                                    <p className="text-xs text-slate-400">{m.email}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <RoleBadge role={m.role} />
                                                    <button
                                                        onClick={() => removeMember(m.id)}
                                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setStep(0)}
                                        className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Voltar
                                    </button>
                                    <button
                                        onClick={() => setStep(2)}
                                        className="flex-1 bg-[#1D3461] hover:bg-[#162749] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-[#1D3461]/20"
                                    >
                                        Revisar Cadastro <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ─── STEP 2: Review ──────────────────────────────── */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-600" /> Revisão do Cadastro
                                </h2>

                                {/* Clinic summary */}
                                <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50 space-y-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Clínica / Grupo</p>
                                    <div className="grid sm:grid-cols-2 gap-2 text-sm">
                                        <div><span className="text-slate-500">Nome da Clínica:</span> <span className="font-bold text-slate-700">{clinicName}</span></div>
                                        <div><span className="text-slate-500">Especialidade:</span> <span className="font-bold text-slate-700">{specialty}</span></div>
                                        <div><span className="text-slate-500">Administrador:</span> <span className="font-bold text-slate-700">{adminName}</span></div>
                                        <div><span className="text-slate-500">E-mail admin:</span> <span className="font-bold text-slate-700">{adminEmail}</span></div>
                                    </div>
                                </div>

                                {/* Members summary */}
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
                                        Membros ({members.length})
                                    </p>
                                    {members.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic">Nenhum membro adicionado ainda.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {members.map(m => (
                                                <div key={m.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-4 py-3">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700">{m.name}</p>
                                                        <p className="text-xs text-slate-400">{m.email}</p>
                                                    </div>
                                                    <RoleBadge role={m.role} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Voltar
                                    </button>
                                    {submitError && (
                                        <p className="text-red-500 text-sm font-semibold bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                                            {submitError}
                                        </p>
                                    )}
                                    <button
                                        onClick={handleFinish}
                                        disabled={loading}
                                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-green-500/20"
                                    >
                                        {loading ? (
                                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                                        ) : (
                                            <Check className="w-4 h-4" />
                                        )}
                                        {loading ? 'Salvando...' : 'Finalizar Cadastro'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <p className="text-center text-slate-400 text-xs mt-6">
                        Já tem conta?{' '}
                        <button onClick={() => navigate('/login')} className="text-[#1D3461] font-bold hover:underline">
                            Fazer login
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ClinicRegistration;
