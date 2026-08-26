import React, { useState, useEffect } from 'react';
import {
    MessageSquare, User, Clock, TrendingUp, Activity, Search,
    ArrowUpDown, ChevronRight, Mic, Volume2, Brain, BarChart3,
    Sparkles, Filter, RefreshCw, Eye
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────────
interface PatientInteraction {
    id: string;
    patientName: string;
    patientInitials: string;
    totalInteractions: number;
    voiceInteractions: number;
    textInteractions: number;
    proactiveAlerts: number;
    lastInteraction: string;
    averageResponseTime: string;
    satisfaction: number; // 1-5
    status: 'active' | 'idle' | 'new';
    topics: string[];
}

// ── Mock Data (realistic patient interactions with LIZ) ──────────────────────────
const MOCK_INTERACTIONS: PatientInteraction[] = [
    {
        id: 'p1', patientName: 'Carlos Eduardo Lima', patientInitials: 'CE',
        totalInteractions: 47, voiceInteractions: 32, textInteractions: 15, proactiveAlerts: 8,
        lastInteraction: 'Há 12 min', averageResponseTime: '1.2s', satisfaction: 5,
        status: 'active', topics: ['Cardiologia', 'Medicações', 'Exames Pendentes'],
    },
    {
        id: 'p2', patientName: 'Maria Fernanda Souza', patientInitials: 'MF',
        totalInteractions: 31, voiceInteractions: 18, textInteractions: 13, proactiveAlerts: 5,
        lastInteraction: 'Há 2h', averageResponseTime: '1.4s', satisfaction: 4,
        status: 'active', topics: ['Clínica Geral', 'Prescrições', 'Teleconsulta'],
    },
    {
        id: 'p3', patientName: 'João Pedro Almeida', patientInitials: 'JP',
        totalInteractions: 23, voiceInteractions: 20, textInteractions: 3, proactiveAlerts: 3,
        lastInteraction: 'Há 5h', averageResponseTime: '1.1s', satisfaction: 5,
        status: 'idle', topics: ['Ortopedia', 'Exames'],
    },
    {
        id: 'p4', patientName: 'Ana Clara Rodrigues', patientInitials: 'AC',
        totalInteractions: 18, voiceInteractions: 10, textInteractions: 8, proactiveAlerts: 4,
        lastInteraction: 'Há 1 dia', averageResponseTime: '1.6s', satisfaction: 4,
        status: 'idle', topics: ['Neurologia', 'Medicações'],
    },
    {
        id: 'p5', patientName: 'Roberto Silva Neto', patientInitials: 'RS',
        totalInteractions: 12, voiceInteractions: 8, textInteractions: 4, proactiveAlerts: 2,
        lastInteraction: 'Há 1 dia', averageResponseTime: '1.3s', satisfaction: 5,
        status: 'idle', topics: ['Endocrinologia', 'Check-up'],
    },
    {
        id: 'p6', patientName: 'Beatriz Oliveira', patientInitials: 'BO',
        totalInteractions: 5, voiceInteractions: 3, textInteractions: 2, proactiveAlerts: 1,
        lastInteraction: 'Há 3 dias', averageResponseTime: '1.5s', satisfaction: 4,
        status: 'new', topics: ['Dermatologia'],
    },
    {
        id: 'p7', patientName: 'Lucas Mendes Costa', patientInitials: 'LM',
        totalInteractions: 2, voiceInteractions: 2, textInteractions: 0, proactiveAlerts: 0,
        lastInteraction: 'Há 5 dias', averageResponseTime: '1.8s', satisfaction: 3,
        status: 'new', topics: ['Clínica Geral'],
    },
];

// ── Component ────────────────────────────────────────────────────────────────────
const LizInteractionsMonitor: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'interactions' | 'recent' | 'name'>('interactions');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'idle' | 'new'>('all');
    const [selectedPatient, setSelectedPatient] = useState<PatientInteraction | null>(null);

    const totals = {
        interactions: MOCK_INTERACTIONS.reduce((s, p) => s + p.totalInteractions, 0),
        voice: MOCK_INTERACTIONS.reduce((s, p) => s + p.voiceInteractions, 0),
        text: MOCK_INTERACTIONS.reduce((s, p) => s + p.textInteractions, 0),
        proactive: MOCK_INTERACTIONS.reduce((s, p) => s + p.proactiveAlerts, 0),
        patients: MOCK_INTERACTIONS.length,
    };

    const filtered = MOCK_INTERACTIONS
        .filter((p) => filterStatus === 'all' || p.status === filterStatus)
        .filter((p) => p.patientName.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'interactions') return b.totalInteractions - a.totalInteractions;
            if (sortBy === 'name') return a.patientName.localeCompare(b.patientName);
            return 0; // 'recent' keeps original order
        });

    const statusColor: Record<string, string> = {
        active: 'bg-emerald-500',
        idle: 'bg-amber-500',
        new: 'bg-blue-500',
    };
    const statusLabel: Record<string, string> = {
        active: 'Ativo Agora',
        idle: 'Inativo',
        new: 'Novo',
    };

    return (
        <div className="min-h-screen bg-[#0B1120] text-white p-6 font-['Inter',sans-serif]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Monitor de Interações LIZ</h1>
                        <p className="text-xs text-slate-500">Acompanhamento em tempo real das conversas entre a LIZ e os pacientes</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        LIZ ENGINE ONLINE
                    </span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {[
                    { label: 'Pacientes Ativos', value: totals.patients, icon: User, color: 'from-blue-600 to-blue-800' },
                    { label: 'Total Interações', value: totals.interactions, icon: MessageSquare, color: 'from-emerald-600 to-emerald-800' },
                    { label: 'Interações por Voz', value: totals.voice, icon: Mic, color: 'from-cyan-600 to-cyan-800' },
                    { label: 'Interações por Texto', value: totals.text, icon: MessageSquare, color: 'from-purple-600 to-purple-800' },
                    { label: 'Alertas Proativos', value: totals.proactive, icon: Sparkles, color: 'from-amber-600 to-amber-800' },
                ].map((kpi) => (
                    <div key={kpi.label} className={`bg-gradient-to-br ${kpi.color} rounded-2xl p-4 border border-white/5`}>
                        <div className="flex items-center justify-between mb-2">
                            <kpi.icon className="w-4 h-4 text-white/60" />
                            <TrendingUp className="w-3 h-3 text-white/40" />
                        </div>
                        <p className="text-2xl font-bold">{kpi.value}</p>
                        <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider mt-0.5">{kpi.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
                <div className="flex items-center gap-2 bg-[#111827] border border-slate-700/50 rounded-xl px-3 py-2 flex-1">
                    <Search className="w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar paciente..."
                        className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-[#111827] border border-slate-700/50 rounded-xl overflow-hidden">
                        {(['all', 'active', 'idle', 'new'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-3 py-2 text-[10px] font-bold uppercase transition-all ${
                                    filterStatus === s ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                {s === 'all' ? 'Todos' : statusLabel[s]}
                            </button>
                        ))}
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-[#111827] border border-slate-700/50 rounded-xl px-3 py-2 text-xs text-slate-400 outline-none cursor-pointer"
                    >
                        <option value="interactions">Mais Interações</option>
                        <option value="name">Nome A-Z</option>
                        <option value="recent">Mais Recente</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#111827] border border-slate-700/30 rounded-2xl overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-800/50 border-b border-slate-700/30 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-4">Paciente</div>
                    <div className="col-span-1 text-center">Total</div>
                    <div className="col-span-1 text-center">Voz</div>
                    <div className="col-span-1 text-center">Texto</div>
                    <div className="col-span-1 text-center">Alertas</div>
                    <div className="col-span-2 text-center">Última Interação</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-1 text-center">Ação</div>
                </div>

                {/* Table Body */}
                {filtered.length === 0 ? (
                    <div className="p-8 text-center text-slate-600 text-sm">Nenhum paciente encontrado.</div>
                ) : (
                    filtered.map((patient, idx) => (
                        <div
                            key={patient.id}
                            className={`grid grid-cols-12 gap-2 px-4 py-3.5 items-center transition-all hover:bg-slate-800/30 cursor-pointer ${
                                idx !== filtered.length - 1 ? 'border-b border-slate-700/20' : ''
                            } ${selectedPatient?.id === patient.id ? 'bg-slate-800/50 ring-1 ring-emerald-500/20' : ''}`}
                            onClick={() => setSelectedPatient(selectedPatient?.id === patient.id ? null : patient)}
                        >
                            {/* Patient */}
                            <div className="col-span-4 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1D3461] to-[#0F172A] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                                    {patient.patientInitials}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{patient.patientName}</p>
                                    <p className="text-[10px] text-slate-500 truncate">{patient.topics.join(' · ')}</p>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="col-span-1 text-center">
                                <span className="text-sm font-bold text-white">{patient.totalInteractions}</span>
                            </div>

                            {/* Voice */}
                            <div className="col-span-1 text-center flex items-center justify-center gap-1">
                                <Mic className="w-3 h-3 text-cyan-400" />
                                <span className="text-xs text-slate-300">{patient.voiceInteractions}</span>
                            </div>

                            {/* Text */}
                            <div className="col-span-1 text-center flex items-center justify-center gap-1">
                                <MessageSquare className="w-3 h-3 text-purple-400" />
                                <span className="text-xs text-slate-300">{patient.textInteractions}</span>
                            </div>

                            {/* Proactive Alerts */}
                            <div className="col-span-1 text-center flex items-center justify-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                <span className="text-xs text-slate-300">{patient.proactiveAlerts}</span>
                            </div>

                            {/* Last Interaction */}
                            <div className="col-span-2 text-center">
                                <span className="text-xs text-slate-400">{patient.lastInteraction}</span>
                            </div>

                            {/* Status */}
                            <div className="col-span-1 flex justify-center">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    patient.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : patient.status === 'new' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusColor[patient.status]} ${patient.status === 'active' ? 'animate-pulse' : ''}`} />
                                    {statusLabel[patient.status]}
                                </span>
                            </div>

                            {/* Action */}
                            <div className="col-span-1 flex justify-center">
                                <button className="p-1.5 hover:bg-slate-700 rounded-lg transition">
                                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Detail Panel (expandable) */}
            {selectedPatient && (
                <div className="mt-4 bg-[#111827] border border-emerald-500/20 rounded-2xl p-5 animate-fadeIn">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1D3461] to-[#0F172A] flex items-center justify-center text-sm font-bold">
                                {selectedPatient.patientInitials}
                            </div>
                            <div>
                                <h3 className="text-base font-bold">{selectedPatient.patientName}</h3>
                                <p className="text-[10px] text-slate-500">Detalhamento de interações com a LIZ</p>
                            </div>
                        </div>
                        <span className="text-xs text-slate-500">Tempo médio de resposta: <span className="text-emerald-400 font-bold">{selectedPatient.averageResponseTime}</span></span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30">
                            <p className="text-[10px] text-slate-500 font-semibold uppercase">Total</p>
                            <p className="text-lg font-bold text-white">{selectedPatient.totalInteractions}</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-3 border border-cyan-800/30">
                            <p className="text-[10px] text-cyan-400 font-semibold uppercase flex items-center gap-1"><Mic className="w-3 h-3" /> Voz</p>
                            <p className="text-lg font-bold text-cyan-300">{selectedPatient.voiceInteractions}</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-3 border border-purple-800/30">
                            <p className="text-[10px] text-purple-400 font-semibold uppercase flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Texto</p>
                            <p className="text-lg font-bold text-purple-300">{selectedPatient.textInteractions}</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-3 border border-amber-800/30">
                            <p className="text-[10px] text-amber-400 font-semibold uppercase flex items-center gap-1"><Sparkles className="w-3 h-3" /> Proativos</p>
                            <p className="text-lg font-bold text-amber-300">{selectedPatient.proactiveAlerts}</p>
                        </div>
                    </div>

                    {/* Topics */}
                    <div>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase mb-2">Tópicos mais frequentes</p>
                        <div className="flex flex-wrap gap-2">
                            {selectedPatient.topics.map((t) => (
                                <span key={t} className="px-2.5 py-1 bg-slate-800 border border-slate-700/50 rounded-full text-[10px] font-semibold text-slate-300">{t}</span>
                            ))}
                        </div>
                    </div>

                    {/* Satisfaction */}
                    <div className="mt-4 flex items-center gap-2">
                        <p className="text-[10px] text-slate-500 font-semibold uppercase">Satisfação:</p>
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className={`text-sm ${star <= selectedPatient.satisfaction ? 'text-amber-400' : 'text-slate-700'}`}>★</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer note */}
            <div className="mt-4 text-center">
                <p className="text-[10px] text-slate-600">Os dados são atualizados em tempo real conforme a LIZ interage com os pacientes via app ELYON.</p>
            </div>
        </div>
    );
};

export default LizInteractionsMonitor;
