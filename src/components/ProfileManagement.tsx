import React, { useState } from 'react';
import {
    Users, Plus, Shield, Check, X, Search, Edit2, Trash2,
    Eye, EyeOff, ClipboardList, Stethoscope, UserCog, Zap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: 'Master' | 'Triador_Enfermeiro' | 'Triador_Medico' | 'Especialista' | 'Telemedicina';
    status: 'Ativo' | 'Inativo';
    createdAt: string;
}

const ROLE_LABELS: Record<UserProfile['role'], string> = {
    Master: 'Gestor Master',
    Triador_Enfermeiro: 'Triador / Solicitante (Enfermeiro)',
    Triador_Medico: 'Triador / Solicitante (Médico)',
    Especialista: 'Parecerista / Especialista',
    Telemedicina: 'Telemedicina',
};

interface PatientProfile {
    id: string;
    name: string;
    cpf: string;
    status: 'Ativo' | 'Inativo';
    createdAt: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const seedProfiles: UserProfile[] = [
    { id: '1', name: 'Gestor Principal',   email: 'admin@pareceres.io',          role: 'Master',            status: 'Ativo', createdAt: '10/01/2026' },
    { id: '2', name: 'Dra. Ana Silva',     email: 'ana.silva@clinica.com',        role: 'Triador_Medico',    status: 'Ativo', createdAt: '15/02/2026' },
    { id: '3', name: 'Enf. Carlos Santos', email: 'carlos.s@posto.saude.gov',     role: 'Triador_Enfermeiro', status: 'Ativo', createdAt: '20/02/2026' },
    { id: '4', name: 'Dr. Roberto Costa',  email: 'roberto.cardio@hospital.com',  role: 'Especialista',      status: 'Ativo', createdAt: '01/03/2026' },
];

const seedPatients: PatientProfile[] = [
    { id: '1', name: 'João Silva Oliveira',    cpf: '123.456.789-00', status: 'Ativo', createdAt: '16/03/2026' },
    { id: '2', name: 'Maria Souza Barbosa',    cpf: '987.654.321-11', status: 'Ativo', createdAt: '15/03/2026' },
    { id: '3', name: 'Carlos Santos Ferreira', cpf: '456.123.789-22', status: 'Ativo', createdAt: '10/03/2026' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maskCPF(v: string): string {
    const d = v.replace(/\D/g, '').slice(0, 11);
    return d
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3}\.\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3}\.\d{3}\.\d{3})(\d)/, '$1-$2');
}

type ProfileRole = 'triador' | 'parecerista' | 'telemedicina' | 'gestor_master';

const PROFILE_OPTIONS: { value: ProfileRole; label: string; desc: string; icon: React.ReactNode }[] = [
    { value: 'triador',       label: 'Triador / Solicitante',     desc: 'Realiza triagem e solicita pareceres',    icon: <ClipboardList className="w-5 h-5" /> },
    { value: 'parecerista',   label: 'Parecerista / Especialista', desc: 'Responde interconsultas e pareceres',     icon: <Stethoscope   className="w-5 h-5" /> },
    { value: 'telemedicina',  label: 'Telemedicina',               desc: 'Atendimentos por videochamada',           icon: <Zap           className="w-5 h-5" /> },
    { value: 'gestor_master', label: 'Gestor Master',              desc: 'Acesso total ao sistema',                 icon: <UserCog       className="w-5 h-5" /> },
];

const inputCls =
    'w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11px] text-[#0F172A] ' +
    'placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D3461] focus:border-transparent transition-all';

// ─── Componente ───────────────────────────────────────────────────────────────

const ProfileManagement: React.FC = () => {
    const { addMember, currentUser } = useAuth();

    const [profiles, setProfiles]     = useState<UserProfile[]>(seedProfiles);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm]   = useState('');
    const [activeTab, setActiveTab]     = useState<'system' | 'patients'>('system');

    // ── Form state ────────────────────────────────────────────────────────────
    const [formName,      setFormName]      = useState('');
    const [formCPF,       setFormCPF]       = useState('');
    const [formConselho,  setFormConselho]  = useState('');
    const [formEmail,     setFormEmail]     = useState('');
    const [formPassword,  setFormPassword]  = useState('');
    const [formRole,      setFormRole]      = useState<ProfileRole | ''>('');
    const [showPwd,       setShowPwd]       = useState(false);
    const [formError,     setFormError]     = useState('');
    const [formLoading,   setFormLoading]   = useState(false);
    const [formSuccess,   setFormSuccess]   = useState(false);

    const resetForm = () => {
        setFormName(''); setFormCPF(''); setFormConselho('');
        setFormEmail(''); setFormPassword(''); setFormRole('');
        setFormError(''); setFormSuccess(false); setShowPwd(false);
    };

    const closeModal = () => { setIsModalOpen(false); resetForm(); };

    const handleSave = async () => {
        setFormError('');
        if (!formName.trim() || !formCPF.trim() || !formConselho.trim() || !formEmail.trim() || !formPassword || !formRole) {
            setFormError('Preencha todos os campos obrigatórios.');
            return;
        }
        if (formPassword.length < 6) {
            setFormError('A senha deve ter no mínimo 6 caracteres.');
            return;
        }
        if (formCPF.replace(/\D/g, '').length !== 11) {
            setFormError('CPF inválido. Digite os 11 dígitos.');
            return;
        }

        setFormLoading(true);
        try {
            // addMember resolve o groupId automaticamente se vier vazio
            const groupId = currentUser?.groupId ?? '';
            const err = await addMember(groupId, {
                name:     formName.trim(),
                email:    formEmail.trim().toLowerCase(),
                password: formPassword,
                role:     formRole as 'triador' | 'parecerista' | 'telemedicina' | 'gestor_master',
                cpf:      formCPF,
                conselho: formConselho.trim(),
            });

            if (err === null) {
                setFormSuccess(true);
                const displayRole: UserProfile['role'] =
                    formRole === 'triador'       ? 'Triador_Medico' :
                    formRole === 'parecerista'   ? 'Especialista'   :
                    formRole === 'telemedicina'  ? 'Telemedicina'   : 'Master';

                setProfiles(prev => [{
                    id:        Date.now().toString(),
                    name:      formName.trim(),
                    email:     formEmail.trim().toLowerCase(),
                    role:      displayRole,
                    status:    'Ativo',
                    createdAt: new Date().toLocaleDateString('pt-BR'),
                }, ...prev]);
            } else {
                // Mostra o erro real do Supabase para facilitar o debug
                setFormError(`Erro ao salvar: ${err}`);
            }

        } finally {
            setFormLoading(false);
        }
    };

    // ── Filtered lists ────────────────────────────────────────────────────────
    const filteredProfiles = profiles.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredPatients = seedPatients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cpf.includes(searchTerm)
    );

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="w-full bg-[#F1F5F9] min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">

                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-[12px] font-bold text-[#0F172A] flex items-center">
                            <Shield className="w-6 h-6 mr-3 text-[#1D3461]" />
                            Gestão de Perfis & Acessos
                        </h1>
                        <p className="text-[#64748B] text-[11px] font-medium mt-1">
                            Administre os usuários do sistema e perfis de pacientes.
                        </p>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="btn-primary px-5 py-2.5 text-[11px]">
                        <Plus className="w-[18px] h-[18px] mr-2" />
                        {activeTab === 'system' ? 'Novo Usuário' : 'Novo Paciente'}
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-[#E2E8F0]">
                    {(['system', 'patients'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 px-2 text-[12px] font-bold transition-colors border-b-2 ${
                                activeTab === tab
                                    ? 'border-[#1D3461] text-[#1D3461]'
                                    : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                            }`}
                        >
                            {tab === 'system' ? 'Usuários do Sistema (Profissionais)' : 'Gerenciar Pacientes'}
                        </button>
                    ))}
                </div>

                {/* Table card */}
                <div className="bg-white rounded-[12px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#E2E8F0] overflow-hidden">

                    {/* Search + filter bar */}
                    <div className="p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
                        <div className="relative w-full sm:w-96">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                            <input
                                type="text"
                                placeholder="Buscar por nome ou e-mail..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11px] focus:outline-none focus:ring-2 focus:ring-[#1D3461] focus:border-transparent transition-all"
                            />
                        </div>
                        <select className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] text-[11px] font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#1D3461]">
                            {activeTab === 'system' ? (
                                <>
                                    <option value="all">Todos os Papéis</option>
                                    <option value="Master">Gestor Master</option>
                                    <option value="Especialista">Especialistas</option>
                                    <option value="Triador">Triadores / Solicitantes</option>
                                </>
                            ) : (
                                <>
                                    <option value="all">Todos os Status</option>
                                    <option value="ativo">Ativos</option>
                                    <option value="inativo">Inativos</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div className="overflow-x-auto">
                        {activeTab === 'system' ? (
                            <table className="table-container">
                                <thead className="bg-[#F8FAFC]">
                                    <tr>
                                        <th className="table-title text-[11px] whitespace-nowrap">USUÁRIO</th>
                                        <th className="table-title text-[11px] whitespace-nowrap">PAPEL / PERFIL</th>
                                        <th className="table-title text-[11px] whitespace-nowrap">DATA CADASTRO</th>
                                        <th className="table-title text-[11px] whitespace-nowrap">STATUS</th>
                                        <th className="table-title text-[11px] text-right whitespace-nowrap">AÇÕES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProfiles.map(user => (
                                        <tr key={user.id} className="table-row-hover">
                                            <td className="table-text whitespace-nowrap">
                                                <p className="text-[11px] font-bold text-[#0F172A]">{user.name}</p>
                                                <p className="text-[11px] font-medium text-[#64748B]">{user.email}</p>
                                            </td>
                                            <td className="table-text whitespace-nowrap">
                                                <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] capitalize font-bold bg-[#F1F5F9] text-[#475569]">
                                                    {ROLE_LABELS[user.role]}
                                                </span>
                                            </td>
                                            <td className="table-text whitespace-nowrap text-[11px] font-medium text-[#475569]">{user.createdAt}</td>
                                            <td className="table-text whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold ${
                                                    user.status === 'Ativo'
                                                        ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
                                                        : 'bg-[#FEF2F2] text-[#C0392B] border border-[#FECACA]'
                                                }`}>{user.status}</span>
                                            </td>
                                            <td className="table-text whitespace-nowrap text-right">
                                                <button className="w-8 h-8 inline-flex items-center justify-center text-[#94A3B8] hover:text-[#1D3461] hover:bg-[#EEF4FA] rounded-lg transition-colors mr-1"><Edit2 className="w-4 h-4" /></button>
                                                <button className="w-8 h-8 inline-flex items-center justify-center text-[#94A3B8] hover:text-[#C0392B] hover:bg-[#FEF2F2] rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <table className="table-container">
                                <thead className="bg-[#F8FAFC]">
                                    <tr>
                                        <th className="table-title text-[11px] whitespace-nowrap">PACIENTE</th>
                                        <th className="table-title text-[11px] whitespace-nowrap">CPF</th>
                                        <th className="table-title text-[11px] whitespace-nowrap">DATA CADASTRO</th>
                                        <th className="table-title text-[11px] whitespace-nowrap">STATUS</th>
                                        <th className="table-title text-[11px] text-right whitespace-nowrap">AÇÕES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPatients.map(patient => (
                                        <tr key={patient.id} className="table-row-hover">
                                            <td className="table-text whitespace-nowrap">
                                                <p className="text-[11px] font-bold text-[#0F172A]">{patient.name}</p>
                                            </td>
                                            <td className="table-text whitespace-nowrap text-[11px] font-medium text-[#475569]">{patient.cpf}</td>
                                            <td className="table-text whitespace-nowrap text-[11px] font-medium text-[#475569]">{patient.createdAt}</td>
                                            <td className="table-text whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold ${
                                                    patient.status === 'Ativo'
                                                        ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
                                                        : 'bg-[#FEF2F2] text-[#C0392B] border border-[#FECACA]'
                                                }`}>{patient.status}</span>
                                            </td>
                                            <td className="table-text whitespace-nowrap text-right">
                                                <button className="w-8 h-8 inline-flex items-center justify-center text-[#94A3B8] hover:text-[#1D3461] hover:bg-[#EEF4FA] rounded-lg transition-colors mr-1"><Edit2 className="w-4 h-4" /></button>
                                                <button className="w-8 h-8 inline-flex items-center justify-center text-[#94A3B8] hover:text-[#C0392B] hover:bg-[#FEF2F2] rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {(activeTab === 'system' ? filteredProfiles : filteredPatients).length === 0 && (
                            <div className="p-12 text-center flex flex-col items-center">
                                <div className="w-12 h-12 bg-[#F1F5F9] rounded-full flex items-center justify-center mb-3">
                                    <Users className="w-6 h-6 text-[#94A3B8]" />
                                </div>
                                <p className="text-[11px] font-medium text-[#64748B]">Nenhum registro encontrado com os filtros atuais.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                Modal – Cadastrar Novo Profissional
            ══════════════════════════════════════════════════════════════════ */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.14)] max-w-lg w-full overflow-hidden flex flex-col">

                        {/* ── Modal header ── */}
                        <div className="px-6 py-5 border-b border-[#E2E8F0] flex justify-between items-center">
                            <h3 className="font-black text-[13px] text-[#0F172A] flex items-center gap-2">
                                <span className="w-8 h-8 rounded-xl bg-[#1D3461] flex items-center justify-center">
                                    <Users className="w-4 h-4 text-white" />
                                </span>
                                Cadastrar Novo Profissional
                            </h3>
                            <button onClick={closeModal} className="p-2 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {formSuccess ? (
                            /* ── Tela de sucesso ── */
                            <div className="p-10 flex flex-col items-center text-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-[#F0FDF4] flex items-center justify-center">
                                    <Check className="w-8 h-8 text-[#16A34A]" />
                                </div>
                                <p className="font-black text-[14px] text-[#0F172A]">Usuário criado com sucesso!</p>
                                <p className="text-[12px] text-[#64748B]">
                                    <strong>{formName}</strong> já pode acessar o sistema com o e-mail e senha cadastrados.
                                </p>
                                <button onClick={closeModal} className="mt-2 btn-primary px-8 py-2.5 text-[11px]">
                                    Fechar
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* ── Form ── */}
                                <div className="p-6 overflow-y-auto max-h-[65vh] space-y-4">

                                    {/* Nome */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#475569] mb-1.5">
                                            Nome do Profissional *
                                        </label>
                                        <input
                                            type="text"
                                            className={inputCls}
                                            placeholder="Ex: Dra. Maria Fernanda Silva"
                                            value={formName}
                                            onChange={e => setFormName(e.target.value)}
                                        />
                                    </div>

                                    {/* CPF + Conselho */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-bold text-[#475569] mb-1.5">CPF *</label>
                                            <input
                                                type="text"
                                                className={inputCls}
                                                placeholder="000.000.000-00"
                                                value={formCPF}
                                                onChange={e => setFormCPF(maskCPF(e.target.value))}
                                                maxLength={14}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-[#475569] mb-1.5">Nº Conselho de Classe *</label>
                                            <input
                                                type="text"
                                                className={inputCls}
                                                placeholder="CRM-SP 123456"
                                                value={formConselho}
                                                onChange={e => setFormConselho(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* E-mail */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#475569] mb-1.5">E-mail de Acesso *</label>
                                        <input
                                            type="email"
                                            className={inputCls}
                                            placeholder="maria.silva@clinica.com"
                                            value={formEmail}
                                            onChange={e => setFormEmail(e.target.value)}
                                        />
                                    </div>

                                    {/* Senha */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#475569] mb-1.5">Senha de Acesso *</label>
                                        <div className="relative">
                                            <input
                                                type={showPwd ? 'text' : 'password'}
                                                className={inputCls + ' pr-10'}
                                                placeholder="Mínimo 6 caracteres"
                                                value={formPassword}
                                                onChange={e => setFormPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPwd(p => !p)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors"
                                            >
                                                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tipo de Perfil */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#475569] mb-2">Tipo de Perfil *</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {PROFILE_OPTIONS.map(opt => {
                                                const active = formRole === opt.value;
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => setFormRole(opt.value)}
                                                        className="flex flex-col items-start gap-1 border-2 rounded-xl p-3 text-left transition-all"
                                                        style={{
                                                            borderColor: active ? '#1D3461' : '#E2E8F0',
                                                            background:  active ? '#EEF4FA' : '#F8FAFC',
                                                        }}
                                                    >
                                                        <span style={{ color: active ? '#1D3461' : '#94A3B8' }}>{opt.icon}</span>
                                                        <span className="text-[11px] font-black leading-tight" style={{ color: active ? '#1D3461' : '#0F172A' }}>
                                                            {opt.label}
                                                        </span>
                                                        <span className="text-[10px] font-medium text-[#94A3B8] leading-tight">{opt.desc}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Error */}
                                    {formError && (
                                        <div className="flex items-start gap-2 px-4 py-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl">
                                            <p className="text-[11px] font-semibold text-[#C0392B]">{formError}</p>
                                        </div>
                                    )}
                                </div>

                                {/* ── Footer ── */}
                                <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-end gap-3">
                                    <button onClick={closeModal} className="btn-secondary px-5 py-2.5 text-[11px]">
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={formLoading}
                                        className="btn-primary px-5 py-2.5 text-[11px] disabled:opacity-60 flex items-center"
                                    >
                                        {formLoading ? (
                                            <svg className="animate-spin w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                            </svg>
                                        ) : (
                                            <Check className="w-[18px] h-[18px] mr-2" />
                                        )}
                                        {formLoading ? 'Cadastrando...' : 'Cadastrar Usuário'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileManagement;
