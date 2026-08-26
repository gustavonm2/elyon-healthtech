import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2, Users, Activity, Clock, AlertTriangle,
    UserPlus, ArrowRight, Search, Filter, ChevronRight,
    Megaphone, Heart, Thermometer, Droplets, AlertCircle,
    Construction, Tv, ChevronDown, ChevronUp, RotateCcw,
    Volume2, CheckCircle2, Monitor, Scale
} from 'lucide-react';
import {
    getTriagedQueue, callPatient, resetUpaQueue,
    registerUpaCheckIn, RISK_COLORS, type TriagedPatient
} from '../utils/upaQueueStore';

// ── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
    'aguardando':      { bg: '#FEF3C7', text: '#92400E', label: 'Aguardando' },
    'chamado':         { bg: '#DBEAFE', text: '#1E40AF', label: 'Chamado' },
    'em_atendimento':  { bg: '#D1FAE5', text: '#065F46', label: 'Em Atendimento' },
    'finalizado':      { bg: '#F1F5F9', text: '#64748B', label: 'Finalizado' },
};

const RecepcaoUPA: React.FC = () => {
    const navigate = useNavigate();
    const [queue, setQueue] = useState<TriagedPatient[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRisk, setFilterRisk] = useState<string>('Todos');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [justCalled, setJustCalled] = useState<number | null>(null);

    // Check-in modal states
    const [showCheckIn, setShowCheckIn] = useState(false);
    const [checkInName, setCheckInName] = useState('');
    const [checkInAge, setCheckInAge] = useState('');
    const [checkInCpf, setCheckInCpf] = useState('');
    const [checkInComplaint, setCheckInComplaint] = useState('');

    const handleCheckInSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!checkInName || !checkInAge || !checkInCpf || !checkInComplaint) return;
        registerUpaCheckIn(checkInName, Number(checkInAge), checkInCpf, checkInComplaint);
        setShowCheckIn(false);
        setCheckInName('');
        setCheckInAge('');
        setCheckInCpf('');
        setCheckInComplaint('');
        refresh();
    };

    const refresh = useCallback(() => {
        setQueue(getTriagedQueue());
    }, []);

    useEffect(() => {
        refresh();
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, [refresh]);

    const handleCall = (id: number) => {
        callPatient(id);
        setJustCalled(id);
        refresh();
        setTimeout(() => setJustCalled(null), 3000);
    };

    const handleReset = () => {
        resetUpaQueue();
        refresh();
    };

    const filteredQueue = queue.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.complaint.toLowerCase().includes(searchTerm.toLowerCase());
        const matchRisk = filterRisk === 'Todos' || p.riskClassification === filterRisk;
        return matchSearch && matchRisk;
    });

    const stats = {
        total: queue.length,
        aguardando: queue.filter(p => p.status === 'aguardando').length,
        chamados: queue.filter(p => p.status === 'chamado').length,
        emergencias: queue.filter(p => p.riskClassification === 'Vermelho').length,
    };

    return (
        <div className="w-full bg-[#F1F5F9] min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">

                {/* ── Dev Mode Banner ── */}
                <div
                    className="mb-6 rounded-xl px-4 py-3 flex items-center gap-3 border"
                    style={{
                        background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                        borderColor: '#F59E0B',
                    }}
                >
                    <Construction className="w-5 h-5 text-[#92400E] flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-[12px] font-bold text-[#92400E]">
                            🚧 Modo Desenvolvimento — Recepção UPA
                        </p>
                        <p className="text-[11px] text-[#A16207] font-medium mt-0.5">
                            Este módulo está em fase de desenvolvimento. Clique em "Chamar" para simular a chamada na TV.
                        </p>
                    </div>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/60 hover:bg-white/80 text-[11px] font-bold text-[#92400E] transition-colors border border-[#F59E0B]/30"
                        title="Resetar fila de simulação"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Resetar Fila
                    </button>
                </div>

                {/* ── Header ── */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-[22px] font-extrabold text-[#0F172A] flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #1D3461, #2C4E6E)' }}
                            >
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                            Recepção UPA
                        </h1>
                        <p className="text-[#64748B] text-[13px] font-medium mt-1.5 ml-[52px]">
                            Gerencie a fila de triagem e chame pacientes pela TV.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#64748B]">
                            <Clock className="w-4 h-4" />
                            {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                            {' · '}
                            {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <button
                            onClick={() => navigate('/painel-tv')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #1D3461, #2C4E6E)' }}
                        >
                            <Monitor className="w-4 h-4" />
                            Abrir Painel TV
                        </button>
                    </div>
                </div>

                {/* ── Stats Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Total */}
                    <div className="rounded-2xl p-5 border bg-white border-[#E2E8F0] transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EEF4FA' }}>
                                <Users className="w-5 h-5 text-[#1D3461]" />
                            </div>
                        </div>
                        <p className="text-[28px] font-extrabold text-[#0F172A]">{stats.total}</p>
                        <p className="text-[11px] font-semibold text-[#64748B] mt-0.5">Total na Fila</p>
                    </div>

                    {/* Aguardando */}
                    <div className="rounded-2xl p-5 border bg-white border-[#E2E8F0] transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
                                <Clock className="w-5 h-5 text-[#D97706]" />
                            </div>
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#FEF3C7] text-[#92400E]">Pendente</span>
                        </div>
                        <p className="text-[28px] font-extrabold text-[#0F172A]">{stats.aguardando}</p>
                        <p className="text-[11px] font-semibold text-[#64748B] mt-0.5">Aguardando Chamada</p>
                    </div>

                    {/* Chamados */}
                    <div className="rounded-2xl p-5 border bg-white border-[#E2E8F0] transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#DBEAFE' }}>
                                <Megaphone className="w-5 h-5 text-[#2563EB]" />
                            </div>
                        </div>
                        <p className="text-[28px] font-extrabold text-[#0F172A]">{stats.chamados}</p>
                        <p className="text-[11px] font-semibold text-[#64748B] mt-0.5">Chamados pela TV</p>
                    </div>

                    {/* Emergências */}
                    <div
                        className="rounded-2xl p-5 border bg-white transition-all duration-200 hover:shadow-md"
                        style={{ borderColor: stats.emergencias > 0 ? '#FECACA' : '#E2E8F0' }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FEF2F2' }}>
                                <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
                            </div>
                            {stats.emergencias > 0 && (
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                                </span>
                            )}
                        </div>
                        <p className="text-[28px] font-extrabold text-[#0F172A]">{stats.emergencias}</p>
                        <p className="text-[11px] font-semibold text-[#64748B] mt-0.5">Emergências (Vermelho)</p>
                    </div>
                </div>

                {/* ── Quick Actions ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <button
                        onClick={() => setShowCheckIn(true)}
                        className="group rounded-2xl p-5 border border-[#E2E8F0] bg-white hover:border-[#1D3461] hover:shadow-lg transition-all duration-300 flex items-center gap-4 text-left"
                    >
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                            style={{ background: 'linear-gradient(135deg, #1D3461, #2C4E6E)' }}
                        >
                            <UserPlus className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[14px] font-bold text-[#0F172A]">Registrar Check-In</p>
                            <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Entrada de paciente na UPA</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#94A3B8] group-hover:text-[#1D3461] transition-colors" />
                    </button>

                    <button
                        onClick={() => navigate('/atendimentos')}
                        className="group rounded-2xl p-5 border border-[#E2E8F0] bg-white hover:border-[#059669] hover:shadow-lg transition-all duration-300 flex items-center gap-4 text-left"
                    >
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                            style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
                        >
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[14px] font-bold text-[#0F172A]">Atendimentos</p>
                            <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Acompanhar em tempo real</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#94A3B8] group-hover:text-[#059669] transition-colors" />
                    </button>

                    <button
                        onClick={() => navigate('/painel-tv')}
                        className="group rounded-2xl p-5 border border-[#E2E8F0] bg-white hover:border-[#7C3AED] hover:shadow-lg transition-all duration-300 flex items-center gap-4 text-left"
                    >
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                            style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
                        >
                            <Tv className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[14px] font-bold text-[#0F172A]">Painel TV</p>
                            <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Tela da sala de espera</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#94A3B8] group-hover:text-[#7C3AED] transition-colors" />
                    </button>
                </div>

                {/* ── Triaged Queue ── */}
                <div className="rounded-2xl border border-[#E2E8F0] bg-white overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h2 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
                                <Megaphone className="w-4 h-4 text-[#1D3461]" />
                                Fila de Pacientes Triados
                            </h2>
                            <p className="text-[11px] text-[#64748B] font-medium mt-0.5">
                                Clique em "Chamar" para enviar à TV da sala de espera
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                                <input
                                    type="text"
                                    placeholder="Buscar paciente..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[12px] font-medium text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D3461]/20 focus:border-[#1D3461] transition-all w-[200px]"
                                />
                            </div>
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                                <select
                                    value={filterRisk}
                                    onChange={e => setFilterRisk(e.target.value)}
                                    className="pl-8 pr-8 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[12px] font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1D3461]/20 focus:border-[#1D3461] transition-all appearance-none cursor-pointer"
                                >
                                    <option value="Todos">Todas as cores</option>
                                    <option value="Vermelho">🔴 Vermelho</option>
                                    <option value="Laranja">🟠 Laranja</option>
                                    <option value="Amarelo">🟡 Amarelo</option>
                                    <option value="Verde">🟢 Verde</option>
                                    <option value="Azul">🔵 Azul</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Manchester Legend Bar */}
                    <div className="px-6 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center gap-4 overflow-x-auto">
                        <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Manchester:</span>
                        {Object.entries(RISK_COLORS).map(([key, val]) => (
                            <div key={key} className="flex items-center gap-1.5 whitespace-nowrap">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: val.solid }} />
                                <span className="text-[10px] font-bold" style={{ color: val.text }}>{key} — {val.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Patient Rows */}
                    <div className="divide-y divide-[#F1F5F9]">
                        {filteredQueue.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <AlertCircle className="w-8 h-8 text-[#CBD5E1] mx-auto mb-3" />
                                <p className="text-[13px] font-semibold text-[#94A3B8]">Nenhum paciente encontrado</p>
                            </div>
                        ) : (
                            filteredQueue.map((patient) => {
                                const rc = RISK_COLORS[patient.riskClassification];
                                const sc = STATUS_CONFIG[patient.status];
                                const isExpanded = expandedId === patient.id;
                                const wasCalled = justCalled === patient.id;
                                const canCall = patient.status === 'aguardando';

                                return (
                                    <div key={patient.id}>
                                        {/* Main Row */}
                                        <div
                                            className="px-6 py-4 flex flex-col md:flex-row md:items-center gap-3 hover:bg-[#F8FAFC] transition-all cursor-pointer"
                                            style={{
                                                borderLeft: `4px solid ${rc.solid}`,
                                                backgroundColor: wasCalled ? '#EFF6FF' : undefined,
                                            }}
                                            onClick={() => setExpandedId(isExpanded ? null : patient.id)}
                                        >
                                            {/* Risk Color Indicator */}
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                                style={{
                                                    backgroundColor: rc.solid,
                                                    boxShadow: `0 0 12px ${rc.solid}40`,
                                                }}
                                            >
                                                <AlertTriangle className="w-5 h-5 text-white" />
                                            </div>

                                            {/* Patient Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-[13px] font-bold text-[#0F172A] truncate">{patient.name}</p>
                                                    <span className="text-[11px] font-medium text-[#94A3B8]">{patient.age} anos</span>
                                                </div>
                                                <p className="text-[11px] font-medium text-[#64748B] truncate">{patient.complaint}</p>
                                            </div>

                                            {/* Arrival */}
                                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#64748B]">
                                                <Clock className="w-3.5 h-3.5" />
                                                {patient.arrivalTime}
                                            </div>

                                            {/* Risk Badge */}
                                            <span
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border"
                                                style={{
                                                    backgroundColor: rc.bg,
                                                    color: rc.text,
                                                    borderColor: `${rc.solid}30`,
                                                }}
                                            >
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: rc.solid }} />
                                                {patient.riskClassification}
                                            </span>

                                            {/* Status Badge */}
                                            <span
                                                className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold"
                                                style={{ backgroundColor: sc.bg, color: sc.text }}
                                            >
                                                {sc.label}
                                            </span>

                                            {/* Destination */}
                                            <span className="text-[11px] font-bold text-[#1D3461] bg-[#EEF4FA] px-2.5 py-1 rounded-lg whitespace-nowrap">
                                                {patient.destination}
                                            </span>

                                            {/* Call Button */}
                                            {canCall ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleCall(patient.id); }}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold text-white transition-all hover:opacity-90 active:scale-95 shadow-md whitespace-nowrap"
                                                    style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
                                                >
                                                    <Volume2 className="w-3.5 h-3.5" />
                                                    Chamar
                                                </button>
                                            ) : (
                                                <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold text-[#059669] bg-[#D1FAE5] whitespace-nowrap">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Chamado
                                                </span>
                                            )}

                                            {/* Expand */}
                                            {isExpanded
                                                ? <ChevronUp className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
                                                : <ChevronDown className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
                                            }
                                        </div>

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <div
                                                className="px-6 py-5 bg-[#F8FAFC] border-t border-[#E2E8F0]"
                                                style={{ borderLeft: `4px solid ${rc.solid}` }}
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    {/* Patient Data */}
                                                    <div className="rounded-xl bg-white border border-[#E2E8F0] p-4">
                                                        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-3">Dados do Paciente</p>
                                                        <div className="space-y-2">
                                                            <div>
                                                                <span className="text-[10px] font-bold text-[#94A3B8]">Nome</span>
                                                                <p className="text-[12px] font-bold text-[#0F172A]">{patient.name}</p>
                                                            </div>
                                                            <div className="flex gap-4">
                                                                <div>
                                                                    <span className="text-[10px] font-bold text-[#94A3B8]">Idade</span>
                                                                    <p className="text-[12px] font-bold text-[#0F172A]">{patient.age} anos</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-[10px] font-bold text-[#94A3B8]">CPF</span>
                                                                    <p className="text-[12px] font-bold text-[#0F172A]">{patient.cpf}</p>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] font-bold text-[#94A3B8]">Chegada</span>
                                                                <p className="text-[12px] font-bold text-[#0F172A]">{patient.arrivalTime}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Risk Classification */}
                                                    <div className="rounded-xl bg-white border border-[#E2E8F0] p-4">
                                                        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-3">Classificação de Risco</p>
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div
                                                                className="w-12 h-12 rounded-xl flex items-center justify-center"
                                                                style={{ backgroundColor: rc.solid, boxShadow: `0 0 16px ${rc.solid}40` }}
                                                            >
                                                                <AlertTriangle className="w-6 h-6 text-white" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[16px] font-black" style={{ color: rc.solid }}>
                                                                    {patient.riskClassification}
                                                                </p>
                                                                <p className="text-[11px] font-semibold text-[#64748B]">
                                                                    {patient.riskLabel}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] font-bold text-[#94A3B8]">Destino</span>
                                                            <p className="text-[12px] font-bold text-[#1D3461]">{patient.destination}</p>
                                                        </div>
                                                    </div>

                                                    {/* Vitals */}
                                                    <div className="rounded-xl bg-white border border-[#E2E8F0] p-4">
                                                        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-3">Sinais Vitais</p>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                            <div className="flex items-center gap-2">
                                                                <Heart className="w-4 h-4 text-[#EF4444]" />
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-[#94A3B8]">PA</p>
                                                                    <p className="text-[13px] font-extrabold text-[#0F172A]">{patient.bloodPressure}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Activity className="w-4 h-4 text-[#F97316]" />
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-[#94A3B8]">FC</p>
                                                                    <p className="text-[13px] font-extrabold text-[#0F172A]">{patient.heartRate}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Thermometer className="w-4 h-4 text-[#EAB308]" />
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-[#94A3B8]">Temp</p>
                                                                    <p className="text-[13px] font-extrabold text-[#0F172A]">{patient.temperature}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Droplets className="w-4 h-4 text-[#3B82F6]" />
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-[#94A3B8]">SpO₂</p>
                                                                    <p className="text-[13px] font-extrabold text-[#0F172A]">{patient.oxygenSaturation}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Activity className="w-4 h-4 text-rose-500" />
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-[#94A3B8]">Glicemia</p>
                                                                    <p className="text-[13px] font-extrabold text-[#0F172A]">{patient.glicemia || 'N/A'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Scale className="w-4 h-4 text-indigo-500" />
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-[#94A3B8]">Peso</p>
                                                                    <p className="text-[13px] font-extrabold text-[#0F172A]">{patient.weight || 'N/A'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Complaint + Action */}
                                                    <div className="rounded-xl bg-white border border-[#E2E8F0] p-4 flex flex-col">
                                                        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-3">Queixa Principal</p>
                                                        <p className="text-[12px] font-medium text-[#334155] flex-1 leading-relaxed">
                                                            {patient.complaint}
                                                        </p>
                                                        {canCall && (
                                                            <button
                                                                onClick={() => handleCall(patient.id)}
                                                                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[12px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
                                                                style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
                                                            >
                                                                <Megaphone className="w-4 h-4" />
                                                                Chamar na TV
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>

            {/* Check-In Modal */}
            {showCheckIn && (
                <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[16px] shadow-[0_16px_40px_rgba(0,0,0,0.12)] w-full max-w-[500px] overflow-hidden flex flex-col border border-[#E2E8F0]">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#1D3461] flex items-center justify-center">
                                    <UserPlus className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-[13px] font-black text-[#0F172A]">Registrar Entrada (Check-In)</h3>
                                    <p className="text-[10px] font-medium text-[#64748B]">Adicione o paciente à fila de espera para triagem</p>
                                </div>
                            </div>
                        </div>

                        {/* Body / Form */}
                        <form onSubmit={handleCheckInSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-[#334155] mb-1.5">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Nome completo do paciente"
                                    value={checkInName}
                                    onChange={e => setCheckInName(e.target.value)}
                                    className="w-full px-3 py-2.5 text-[11px] font-medium text-[#0F172A] border border-[#CBD5E1] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#1D3461] bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-[11px] font-bold text-[#334155] mb-1.5">CPF</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="000.000.000-00"
                                        value={checkInCpf}
                                        onChange={e => setCheckInCpf(e.target.value)}
                                        className="w-full px-3 py-2.5 text-[11px] font-medium text-[#0F172A] border border-[#CBD5E1] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#1D3461] bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-[#334155] mb-1.5">Idade</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="Idade"
                                        value={checkInAge}
                                        onChange={e => setCheckInAge(e.target.value)}
                                        className="w-full px-3 py-2.5 text-[11px] font-medium text-[#0F172A] border border-[#CBD5E1] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#1D3461] bg-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-[#334155] mb-1.5">Queixa Principal / Sintomas</label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Descreva brevemente o sintoma ou motivo da vinda..."
                                    value={checkInComplaint}
                                    onChange={e => setCheckInComplaint(e.target.value)}
                                    className="w-full px-3 py-2.5 text-[11px] font-medium text-[#0F172A] border border-[#CBD5E1] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#1D3461] bg-white resize-none"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                                <button
                                    type="button"
                                    onClick={() => setShowCheckIn(false)}
                                    className="px-5 py-2.5 rounded-[10px] text-[11px] font-bold border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-[10px] text-[11px] font-bold text-white bg-[#1D3461] hover:bg-[#162749] shadow-md transition-all hover:scale-[1.01]"
                                >
                                    Registrar Entrada
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecepcaoUPA;
