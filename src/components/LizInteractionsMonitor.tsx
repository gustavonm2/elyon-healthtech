import React, { useState, useEffect } from 'react';
import {
    MessageSquare, User, Clock, TrendingUp, Activity, Search,
    ArrowUpDown, ChevronRight, Mic, Volume2, Brain, BarChart3,
    Sparkles, Filter, RefreshCw, Eye, Loader2, AlertCircle
} from 'lucide-react';
import { getMonitorData, type MonitorPatientRow } from '../services/patientService';

// ── Time helpers ─────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string | null): string {
    if (!dateStr) return '--';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Agora';
    if (mins < 60) return `Há ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Há ${days} dia${days > 1 ? 's' : ''}`;
}

function getStatus(lastAt: string | null): 'active' | 'idle' | 'new' {
    if (!lastAt) return 'new';
    const diff = Date.now() - new Date(lastAt).getTime();
    const hours = diff / (1000 * 60 * 60);
    if (hours < 1) return 'active';
    return 'idle';
}

// ── Component ────────────────────────────────────────────────────────────────────
const LizInteractionsMonitor: React.FC = () => {
    const [patients, setPatients] = useState<MonitorPatientRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'interactions' | 'recent' | 'name'>('interactions');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'idle' | 'new'>('all');
    const [selectedPatient, setSelectedPatient] = useState<MonitorPatientRow | null>(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const loadData = async () => {
        setLoading(true);
        const data = await getMonitorData();
        setPatients(data);
        setLoading(false);
        setLastRefresh(new Date());
    };

    useEffect(() => { loadData(); }, []);

    // Auto-refresh every 30s
    useEffect(() => {
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, []);

    const totals = {
        interactions: patients.reduce((s, p) => s + p.total, 0),
        voice: patients.reduce((s, p) => s + p.voice, 0),
        text: patients.reduce((s, p) => s + p.text, 0),
        proactive: patients.reduce((s, p) => s + p.proactive, 0),
        patients: patients.length,
    };

    const filtered = patients
        .filter((p) => filterStatus === 'all' || getStatus(p.last_interaction_at) === filterStatus)
        .filter((p) => p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'interactions') return b.total - a.total;
            if (sortBy === 'name') return a.patient_name.localeCompare(b.patient_name);
            if (sortBy === 'recent') {
                const aT = a.last_interaction_at ? new Date(a.last_interaction_at).getTime() : 0;
                const bT = b.last_interaction_at ? new Date(b.last_interaction_at).getTime() : 0;
                return bT - aT;
            }
            return 0;
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
                        <p className="text-xs text-slate-500">Dados reais do Supabase · Atualizado {lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={loadData} disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-full text-[10px] font-bold text-slate-300 transition active:scale-95 disabled:opacity-50">
                        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Atualizar
                    </button>
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

                {/* Loading state */}
                {loading && patients.length === 0 ? (
                    <div className="p-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mx-auto mb-2" />
                        <p className="text-xs text-slate-500">Carregando dados reais do Supabase...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center">
                        <AlertCircle className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                        <p className="text-sm text-slate-600">
                            {patients.length === 0
                                ? 'Nenhuma interação registrada ainda. Use o app do paciente e fale com a LIZ!'
                                : 'Nenhum paciente encontrado com esses filtros.'}
                        </p>
                    </div>
                ) : (
                    filtered.map((patient, idx) => {
                        const status = getStatus(patient.last_interaction_at);
                        return (
                            <div
                                key={patient.patient_id}
                                className={`grid grid-cols-12 gap-2 px-4 py-3.5 items-center transition-all hover:bg-slate-800/30 cursor-pointer ${
                                    idx !== filtered.length - 1 ? 'border-b border-slate-700/20' : ''
                                } ${selectedPatient?.patient_id === patient.patient_id ? 'bg-slate-800/50 ring-1 ring-emerald-500/20' : ''}`}
                                onClick={() => setSelectedPatient(selectedPatient?.patient_id === patient.patient_id ? null : patient)}
                            >
                                {/* Patient */}
                                <div className="col-span-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1D3461] to-[#0F172A] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                                        {patient.patient_initials}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">{patient.patient_name}</p>
                                        <p className="text-[10px] text-slate-500 truncate">
                                            {patient.topics.length > 0 ? patient.topics.join(' · ') : 'Sem tópicos'}
                                        </p>
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="col-span-1 text-center">
                                    <span className="text-sm font-bold text-white">{patient.total}</span>
                                </div>

                                {/* Voice */}
                                <div className="col-span-1 text-center flex items-center justify-center gap-1">
                                    <Mic className="w-3 h-3 text-cyan-400" />
                                    <span className="text-xs text-slate-300">{patient.voice}</span>
                                </div>

                                {/* Text */}
                                <div className="col-span-1 text-center flex items-center justify-center gap-1">
                                    <MessageSquare className="w-3 h-3 text-purple-400" />
                                    <span className="text-xs text-slate-300">{patient.text}</span>
                                </div>

                                {/* Proactive Alerts */}
                                <div className="col-span-1 text-center flex items-center justify-center gap-1">
                                    <Sparkles className="w-3 h-3 text-amber-400" />
                                    <span className="text-xs text-slate-300">{patient.proactive}</span>
                                </div>

                                {/* Last Interaction */}
                                <div className="col-span-2 text-center">
                                    <span className="text-xs text-slate-400">{timeAgo(patient.last_interaction_at)}</span>
                                </div>

                                {/* Status */}
                                <div className="col-span-1 flex justify-center">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                        status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : status === 'new' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusColor[status]} ${status === 'active' ? 'animate-pulse' : ''}`} />
                                        {statusLabel[status]}
                                    </span>
                                </div>

                                {/* Action */}
                                <div className="col-span-1 flex justify-center">
                                    <button className="p-1.5 hover:bg-slate-700 rounded-lg transition">
                                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Detail Panel (expandable) */}
            {selectedPatient && (
                <div className="mt-4 bg-[#111827] border border-emerald-500/20 rounded-2xl p-5 animate-fadeIn">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1D3461] to-[#0F172A] flex items-center justify-center text-sm font-bold">
                                {selectedPatient.patient_initials}
                            </div>
                            <div>
                                <h3 className="text-base font-bold">{selectedPatient.patient_name}</h3>
                                <p className="text-[10px] text-slate-500">Detalhamento de interações com a LIZ</p>
                            </div>
                        </div>
                        <span className="text-xs text-slate-500">Última: <span className="text-emerald-400 font-bold">{timeAgo(selectedPatient.last_interaction_at)}</span></span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30">
                            <p className="text-[10px] text-slate-500 font-semibold uppercase">Total</p>
                            <p className="text-lg font-bold text-white">{selectedPatient.total}</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-3 border border-cyan-800/30">
                            <p className="text-[10px] text-cyan-400 font-semibold uppercase flex items-center gap-1"><Mic className="w-3 h-3" /> Voz</p>
                            <p className="text-lg font-bold text-cyan-300">{selectedPatient.voice}</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-3 border border-purple-800/30">
                            <p className="text-[10px] text-purple-400 font-semibold uppercase flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Texto</p>
                            <p className="text-lg font-bold text-purple-300">{selectedPatient.text}</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-3 border border-amber-800/30">
                            <p className="text-[10px] text-amber-400 font-semibold uppercase flex items-center gap-1"><Sparkles className="w-3 h-3" /> Proativos</p>
                            <p className="text-lg font-bold text-amber-300">{selectedPatient.proactive}</p>
                        </div>
                    </div>

                    {/* Topics */}
                    {selectedPatient.topics.length > 0 && (
                        <div>
                            <p className="text-[10px] text-slate-500 font-semibold uppercase mb-2">Tópicos registrados</p>
                            <div className="flex flex-wrap gap-2">
                                {selectedPatient.topics.map((t) => (
                                    <span key={t} className="px-2.5 py-1 bg-slate-800 border border-slate-700/50 rounded-full text-[10px] font-semibold text-slate-300">{t}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Footer note */}
            <div className="mt-4 text-center">
                <p className="text-[10px] text-slate-600">Dados reais do Supabase · Auto-refresh a cada 30s · Interações são registradas via app do paciente.</p>
            </div>
        </div>
    );
};

export default LizInteractionsMonitor;
