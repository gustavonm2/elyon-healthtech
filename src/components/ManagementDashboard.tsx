import React, { useState } from 'react';
import {
    BarChart2, TrendingUp, Users, MessageSquare, Clock,
    CheckCircle, Calendar, Plus, Trash2, Save, ChevronDown
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TimeSlot {
    id: string;
    start: string;
    end: string;
}

// ── Sub-component: Time Slot Row ──────────────────────────────────────────────

const SlotRow: React.FC<{
    slot: TimeSlot;
    onUpdate: (id: string, field: 'start' | 'end', val: string) => void;
    onRemove: (id: string) => void;
}> = ({ slot, onUpdate, onRemove }) => (
    <div className="flex items-center gap-2 group">
        <input
            type="time"
            value={slot.start}
            onChange={e => onUpdate(slot.id, 'start', e.target.value)}
            className="w-[100px] px-2.5 py-1.5 text-[11px] font-bold text-[#0F172A] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3461] bg-[#F8FAFC] hover:border-[#94A3B8] transition-all"
        />
        <span className="text-[11px] font-bold text-[#94A3B8]">até</span>
        <input
            type="time"
            value={slot.end}
            onChange={e => onUpdate(slot.id, 'end', e.target.value)}
            className="w-[100px] px-2.5 py-1.5 text-[11px] font-bold text-[#0F172A] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3461] bg-[#F8FAFC] hover:border-[#94A3B8] transition-all"
        />
        <button
            onClick={() => onRemove(slot.id)}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#C0392B] hover:bg-[#FEF2F2] opacity-0 group-hover:opacity-100 transition-all"
            title="Remover horário"
        >
            <Trash2 className="w-3.5 h-3.5" />
        </button>
    </div>
);

// ── Calendar Agenda Section ───────────────────────────────────────────────────

type DaySlots = Record<string, TimeSlot[]>; // key: "YYYY-MM-DD"

const WEEK_DAYS_HEADER = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const DURATIONS = ['30 min', '45 min', '60 min', '90 min'];

const toKey = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const AgendaSection: React.FC = () => {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [daySlots, setDaySlots] = useState<DaySlots>({
        [toKey(today.getFullYear(), today.getMonth(), today.getDate())]: [
            { id: 'demo1', start: '08:00', end: '12:00' },
            { id: 'demo2', start: '14:00', end: '17:00' },
        ],
    });
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const [duration, setDuration] = useState('60 min');

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    const prevMonth = () => {
        if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
        else setViewMonth(m => m + 1);
    };

    const keyOf = (day: number) => toKey(viewYear, viewMonth, day);

    const addSlot = (dayKey: string) => {
        setDaySlots(prev => ({
            ...prev,
            [dayKey]: [...(prev[dayKey] || []), { id: `${dayKey}-${Date.now()}`, start: '08:00', end: '12:00' }],
        }));
    };

    const updateSlot = (dayKey: string, id: string, field: 'start' | 'end', val: string) => {
        setDaySlots(prev => ({
            ...prev,
            [dayKey]: (prev[dayKey] || []).map(s => s.id === id ? { ...s, [field]: val } : s),
        }));
    };

    const removeSlot = (dayKey: string, id: string) => {
        setDaySlots(prev => ({
            ...prev,
            [dayKey]: (prev[dayKey] || []).filter(s => s.id !== id),
        }));
    };

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        setSelectedDay(null);
    };

    const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());
    const selectedSlots = selectedDay ? (daySlots[selectedDay] || []) : [];
    const totalConfigured = Object.values(daySlots).reduce((acc, s) => acc + s.length, 0);

    return (
        <div className="bg-white rounded-[12px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#E2E8F0] overflow-hidden">

            {/* Card Header */}
            <div className="px-6 py-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ borderLeftWidth: 3, borderLeftStyle: 'solid', borderLeftColor: '#1D3461' }}>
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <Calendar className="w-4 h-4 text-[#1D3461]" />
                        <h2 className="text-[12px] font-bold text-[#0F172A] uppercase tracking-wide">Minha Agenda de Disponibilidade</h2>
                    </div>
                    <p className="text-[11px] font-medium text-[#64748B]">
                        Clique em um dia para configurar os horários disponíveis para teleconsultas.
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-[#475569]">
                        <span>Duração:</span>
                        <div className="relative">
                            <select
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                                className="appearance-none pl-2.5 pr-7 py-1.5 border border-[#E2E8F0] bg-[#F8FAFC] rounded-lg text-[11px] font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1D3461] cursor-pointer"
                            >
                                {DURATIONS.map(d => <option key={d}>{d}</option>)}
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        className={`flex items-center gap-2 px-4 py-2 rounded-[10px] font-bold text-[11px] transition-all shadow-sm ${saved ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]' : 'bg-[#1D3461] text-white hover:bg-[#162749]'}`}
                    >
                        {saved ? <><CheckCircle className="w-4 h-4" /> Salvo!</> : <><Save className="w-4 h-4" /> Salvar Agenda</>}
                    </button>
                </div>
            </div>

            {/* Summary + Month Nav */}
            <div className="px-6 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#475569]">
                        <span className="w-2 h-2 rounded-full bg-[#1D3461]" />
                        {Object.keys(daySlots).filter(k => daySlots[k].length > 0).length} dias com slots
                    </div>
                    <div className="text-[#E2E8F0]">·</div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#475569]">
                        <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
                        {totalConfigured} períodos configurados
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#475569] font-bold text-[13px] transition-all">‹</button>
                    <span className="text-[12px] font-black text-[#0F172A] min-w-[140px] text-center">{MONTH_NAMES[viewMonth]} {viewYear}</span>
                    <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#475569] font-bold text-[13px] transition-all">›</button>
                </div>
            </div>

            {/* Calendar + Drawer */}
            <div className="flex">
                {/* Calendar */}
                <div className="flex-1 p-5">
                    <div className="grid grid-cols-7 mb-2">
                        {WEEK_DAYS_HEADER.map(d => (
                            <div key={d} className="text-center text-[10px] font-black text-[#94A3B8] uppercase tracking-wider py-1">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {cells.map((day, idx) => {
                            if (!day) return <div key={`empty-${idx}`} />;
                            const k = keyOf(day);
                            const slots = daySlots[k] || [];
                            const isToday = k === todayKey;
                            const isSelected = k === selectedDay;
                            const hasSlots = slots.length > 0;
                            return (
                                <button
                                    key={k}
                                    onClick={() => setSelectedDay(isSelected ? null : k)}
                                    className={`relative flex flex-col items-center justify-start pt-1.5 pb-1 rounded-[10px] min-h-[52px] border transition-all hover:shadow-md ${
                                        isSelected
                                            ? 'bg-[#1D3461] border-[#1D3461] shadow-md'
                                            : isToday
                                            ? 'bg-[#EEF4FA] border-[#A8C4DA] hover:bg-[#E0ECF7]'
                                            : 'bg-white border-[#E2E8F0] hover:border-[#A8C4DA] hover:bg-[#F8FAFC]'
                                    }`}
                                >
                                    <span className={`text-[12px] font-black leading-none ${isSelected ? 'text-white' : isToday ? 'text-[#1D3461]' : 'text-[#0F172A]'}`}>
                                        {day}
                                    </span>
                                    {hasSlots && (
                                        <div className="flex flex-wrap gap-0.5 mt-1 px-1 justify-center">
                                            {slots.slice(0, 3).map(s => (
                                                <span key={s.id}
                                                    className={`text-[8px] font-bold px-1 py-0.5 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-[#1D3461]/10 text-[#1D3461]'}`}
                                                >
                                                    {s.start}
                                                </span>
                                            ))}
                                            {slots.length > 3 && (
                                                <span className={`text-[8px] font-bold ${isSelected ? 'text-white/70' : 'text-[#94A3B8]'}`}>+{slots.length - 3}</span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Drawer */}
                {selectedDay && (
                    <div className="w-[280px] border-l border-[#E2E8F0] flex flex-col bg-[#F8FAFC]">
                        <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
                            <div>
                                <p className="text-[10px] font-bold text-[#1D3461] uppercase tracking-wider">Horários disponíveis</p>
                                <p className="text-[12px] font-black text-[#0F172A]">
                                    {new Date(selectedDay + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedDay(null)}
                                className="w-6 h-6 flex items-center justify-center text-[#94A3B8] hover:text-[#0F172A] rounded-full hover:bg-[#F1F5F9] text-[14px] font-bold transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {selectedSlots.length === 0 ? (
                                <p className="text-[11px] font-medium text-[#94A3B8] italic">Nenhum horário configurado para este dia.</p>
                            ) : (
                                selectedSlots.map(slot => (
                                    <SlotRow
                                        key={slot.id}
                                        slot={slot}
                                        onUpdate={(id, field, val) => updateSlot(selectedDay, id, field, val)}
                                        onRemove={(id) => removeSlot(selectedDay, id)}
                                    />
                                ))
                            )}
                            <button
                                onClick={() => addSlot(selectedDay)}
                                className="flex items-center gap-1.5 text-[11px] font-bold text-[#1D3461] hover:text-[#162749] w-fit transition-colors mt-1"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Adicionar horário
                            </button>
                        </div>
                        <div className="p-3 border-t border-[#E2E8F0] bg-white">
                            <button
                                onClick={handleSave}
                                className={`w-full py-2 rounded-[8px] text-[11px] font-bold transition-all ${saved ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#1D3461] text-white hover:bg-[#162749]'}`}
                            >
                                {saved ? '✓ Salvo!' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer hint */}
            <div className="px-6 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0]">
                <p className="text-[10px] font-medium text-[#94A3B8]">
                    💡 Clique em qualquer dia para adicionar ou editar os horários disponíveis. Os slots são calculados automaticamente pela duração selecionada.
                </p>
            </div>
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────

const ManagementDashboard: React.FC = () => {
    return (
        <div className="w-full bg-[#F1F5F9] min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-[12px] font-bold text-[#0F172A] flex items-center">
                        <BarChart2 className="w-6 h-6 mr-3 text-[#1D3461]" />
                        Gestão de Atendimentos &amp; Performance
                    </h1>
                    <p className="text-[#64748B] text-[12px] font-medium mt-1">
                        Métricas de engajamento via WhatsApp, resolutividade e ocupação de agenda.
                    </p>
                </div>

                {/* Top KPIs Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* KPI 1 */}
                    <div className="bg-white p-4 rounded-[10px] border border-[#E2E8F0] shadow-sm flex items-center relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-[#EEF4FA] rounded-full group-hover:scale-110 transition-transform"></div>
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-[#1D3461] text-white flex items-center justify-center shadow-md mr-4 relative z-10">
                            <Users className="w-5 h-5" />
                        </div>
                        <div className="flex-1 relative z-10">
                            <h3 className="text-[#64748B] text-[12px] font-bold capitalize mb-1 whitespace-nowrap">Total de Consultas</h3>
                            <div className="flex items-baseline gap-2">
                                <p className="text-[#0F172A] text-[12px] font-black leading-none">1.248</p>
                                <span className="text-[#1D3461] bg-[#EEF4FA] border border-[#A8C4DA] px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center whitespace-nowrap">
                                    <TrendingUp className="w-3 h-3 mr-1" /> +12%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* KPI 2 */}
                    <div className="bg-white p-4 rounded-[10px] border border-[#E2E8F0] shadow-sm flex items-center relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-[#EEF4FA] rounded-full group-hover:scale-110 transition-transform"></div>
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-[#1D3461] text-white flex items-center justify-center shadow-md mr-4 relative z-10">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <div className="flex-1 relative z-10">
                            <h3 className="text-[#64748B] text-[12px] font-bold capitalize mb-1 whitespace-nowrap">Iterações WhatsApp</h3>
                            <div className="flex items-baseline gap-2">
                                <p className="text-[#0F172A] text-[12px] font-black leading-none">3.492</p>
                                <span className="text-[#1D3461] bg-[#EEF4FA] border border-[#A8C4DA] px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center whitespace-nowrap">
                                    <TrendingUp className="w-3 h-3 mr-1" /> +24%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* KPI 3 */}
                    <div className="bg-white p-4 rounded-[10px] border border-[#E2E8F0] shadow-sm flex items-center relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-[#EEF4FA] rounded-full group-hover:scale-110 transition-transform"></div>
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-[#1D3461] text-white flex items-center justify-center shadow-md mr-4 relative z-10">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div className="flex-1 relative z-10">
                            <h3 className="text-[#64748B] text-[12px] font-bold capitalize mb-1 whitespace-nowrap">Tempo de Resposta</h3>
                            <div className="flex items-baseline gap-2">
                                <p className="text-[#0F172A] text-[12px] font-black leading-none">14<span className="text-[12px] text-[#64748B] ml-1">min</span></p>
                                <span className="text-[#64748B] bg-[#F1F5F9] border border-[#E2E8F0] px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center whitespace-nowrap">
                                    Média Diária
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* KPI 4 */}
                    <div className="bg-white p-4 rounded-[10px] border border-[#E2E8F0] shadow-sm flex items-center relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-[#EEF4FA] rounded-full group-hover:scale-110 transition-transform"></div>
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-[#1D3461] text-white flex items-center justify-center shadow-md mr-4 relative z-10">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div className="flex-1 relative z-10">
                            <h3 className="text-[#64748B] text-[12px] font-bold capitalize mb-1 whitespace-nowrap">Ocupação da Agenda</h3>
                            <div className="flex items-baseline gap-2">
                                <p className="text-[#0F172A] text-[12px] font-black leading-none">86<span className="text-[12px] text-[#64748B] ml-1">%</span></p>
                                <span className="text-[#64748B] bg-[#F1F5F9] border border-[#E2E8F0] px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center whitespace-nowrap">
                                    Estável
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Agenda Section ── */}
                <div className="mb-8">
                    <AgendaSection />
                </div>

                {/* Charts & Reports */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

                    {/* Gráfico de Resolutividade */}
                    <div className="bg-white rounded-[12px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#E2E8F0] p-6 lg:p-8">
                        <h2 className="text-[12px] font-bold text-[#0F172A] mb-1 flex items-center">
                            <CheckCircle className="w-5 h-5 mr-2 text-[#1D3461]" />
                            Resolubilidade (Baseado em Feedbacks)
                        </h2>
                        <p className="text-[#94A3B8] text-[11px] font-medium mb-8">Percentual de casos resolvidos no primeiro atendimento x retornos.</p>

                        <div className="flex flex-col space-y-6">
                            <div>
                                <div className="flex justify-between text-[12px] font-bold mb-2">
                                    <span className="text-[#475569]">Resolvidos Online (Sem Retorno)</span>
                                    <span className="text-[#1D3461]">72%</span>
                                </div>
                                <div className="w-full bg-[#E2E8F0] rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-[#1D3461] h-1.5 rounded-full transition-all" style={{ width: '72%' }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-[12px] font-bold mb-2">
                                    <span className="text-[#475569]">Necessitaram de Retorno (Online)</span>
                                    <span className="text-[#F59E0B]">18%</span>
                                </div>
                                <div className="w-full bg-[#E2E8F0] rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-[#F59E0B] h-1.5 rounded-full transition-all" style={{ width: '18%' }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-[12px] font-bold mb-2">
                                    <span className="text-[#475569]">Encaminhados P/ Presencial</span>
                                    <span className="text-[#94A3B8]">10%</span>
                                </div>
                                <div className="w-full bg-[#E2E8F0] rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-[#CBD5E1] h-1.5 rounded-full transition-all" style={{ width: '10%' }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-[#E2E8F0] flex items-center justify-between">
                            <span className="text-[12px] font-bold text-[#64748B]">Taxa Geral de Sucesso</span>
                            <span className="px-3 py-1 bg-[#EEF4FA] text-[#1D3461] text-[11px] font-black rounded-lg border border-[#A8C4DA]">Elevada</span>
                        </div>
                    </div>

                    {/* Funil de Engajamento via WhatsApp */}
                    <div className="bg-white rounded-[12px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#E2E8F0] p-6 lg:p-8 flex flex-col">
                        <h2 className="text-[12px] font-bold text-[#0F172A] mb-1 flex items-center">
                            <MessageSquare className="w-5 h-5 mr-2 text-[#1D3461]" />
                            Funil de Engajamento via WhatsApp
                        </h2>
                        <p className="text-[#94A3B8] text-[11px] font-medium mb-6">Conversão de mensagens automáticas que geraram respostas ou feedbacks do paciente.</p>

                        <div className="overflow-x-auto -mx-6 -mb-6 mt-2">
                            <table className="table-container">
                                <thead className="bg-[#F8FAFC]">
                                    <tr>
                                        <th className="table-title">ETAPA</th>
                                        <th className="table-title">DESCRIÇÃO</th>
                                        <th className="table-title text-right">VOLUME</th>
                                        <th className="table-title text-right">TAXA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="table-row-hover">
                                        <td className="table-text whitespace-nowrap">
                                            <span className="text-[11px] font-bold text-[#0F172A]">1. Enviadas</span>
                                        </td>
                                        <td className="table-text text-[11px] text-[#475569] whitespace-nowrap">Lembretes, Receitas, Acompanhamento</td>
                                        <td className="table-text text-[11px] font-bold text-[#0F172A] text-right whitespace-nowrap">1.500</td>
                                        <td className="table-text text-right whitespace-nowrap">
                                            <span className="text-[11px] font-medium text-[#94A3B8]">—</span>
                                        </td>
                                    </tr>
                                    <tr className="table-row-hover">
                                        <td className="table-text whitespace-nowrap">
                                            <span className="text-[11px] font-bold text-[#0F172A]">2. Lidas</span>
                                        </td>
                                        <td className="table-text text-[11px] text-[#475569] whitespace-nowrap">Taxa de abertura</td>
                                        <td className="table-text text-[11px] font-bold text-[#0F172A] text-right whitespace-nowrap">1.350</td>
                                        <td className="table-text text-right whitespace-nowrap">
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold bg-[#EEF4FA] text-[#1D3461]">90%</span>
                                        </td>
                                    </tr>
                                    <tr className="table-row-hover">
                                        <td className="table-text whitespace-nowrap">
                                            <span className="text-[11px] font-bold text-[#0F172A]">3. Feedbacks</span>
                                        </td>
                                        <td className="table-text text-[11px] text-[#475569] whitespace-nowrap">Interação ativa via BOT</td>
                                        <td className="table-text text-[11px] font-bold text-[#0F172A] text-right whitespace-nowrap">480</td>
                                        <td className="table-text text-right whitespace-nowrap">
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold bg-[#EEF4FA] text-[#1D3461]">35%</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default ManagementDashboard;
