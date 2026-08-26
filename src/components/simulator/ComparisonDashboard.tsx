import React from 'react';
import { Columns, TrendingUp, TrendingDown, DollarSign, Activity, X, ShieldCheck } from 'lucide-react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine,
} from 'recharts';
import type { SimulationSnapshot } from '../../hooks/useSimulationComparison';

interface ComparisonDashboardProps {
    baseline: SimulationSnapshot | null;
    compare: SimulationSnapshot | null;
    onClose: () => void;
}

export const ComparisonDashboard: React.FC<ComparisonDashboardProps> = ({
    baseline,
    compare,
    onClose,
}) => {
    if (!baseline || !compare) {
        return (
            <div className="bg-[#1E293B]/80 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
                Selecione dois cenários salvos para ativar o Modo Comparativo LIZ.
            </div>
        );
    }

    const reportA = baseline.report;
    const reportB = compare.report;

    const finalCashA = reportA.metricsHistory.length ? reportA.metricsHistory[reportA.metricsHistory.length - 1].cashBalance : 0;
    const finalCashB = reportB.metricsHistory.length ? reportB.metricsHistory[reportB.metricsHistory.length - 1].cashBalance : 0;
    const cashDelta = finalCashB - finalCashA;

    const maxQueueA = reportA.metricsHistory.length ? Math.max(...reportA.metricsHistory.map(m => m.patientsInQueue)) : 0;
    const maxQueueB = reportB.metricsHistory.length ? Math.max(...reportB.metricsHistory.map(m => m.patientsInQueue)) : 0;
    const queueReductionPct = maxQueueA > 0 ? Math.round(((maxQueueA - maxQueueB) / maxQueueA) * 100) : 0;

    const survivalDelta = reportB.survivalDays - reportA.survivalDays;
    const healthScoreDelta = reportB.overallHealthScore - reportA.overallHealthScore;

    // Combine daily metrics for chart overlay
    const maxDays = Math.max(reportA.metricsHistory.length, reportB.metricsHistory.length);
    const combinedData = [];

    for (let d = 1; d <= maxDays; d++) {
        const itemA = reportA.metricsHistory.find(m => m.day === d);
        const itemB = reportB.metricsHistory.find(m => m.day === d);

        combinedData.push({
            day: d,
            cashA: itemA?.cashBalance ?? null,
            cashB: itemB?.cashBalance ?? null,
            queueA: itemA?.patientsInQueue ?? null,
            queueB: itemB?.patientsInQueue ?? null,
        });
    }

    return (
        <div className="bg-[#1E293B]/90 border border-teal-500/40 rounded-2xl p-5 shadow-2xl space-y-5">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/40">
                        <Columns className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white flex items-center gap-2">
                            Modo Comparativo de Realidades (Scenario A vs. Scenario B)
                            <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded font-black border border-teal-500/40">
                                Overlaid Telemetry
                            </span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Cenário A: <strong className="text-slate-300">{baseline.name}</strong> | Cenário B: <strong className="text-teal-300">{compare.name}</strong>
                        </p>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Fechar Modo Comparativo"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* FLOATING DELTA PANEL */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-inner">
                
                {/* Delta 1: Cash */}
                <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Diferencial de Caixa</span>
                    <span className={`text-sm font-black flex items-center gap-1 ${cashDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {cashDelta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {cashDelta >= 0 ? '+' : ''} R$ {(cashDelta / 1000).toFixed(0)}k
                    </span>
                </div>

                {/* Delta 2: Queue */}
                <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Variação da Fila</span>
                    <span className={`text-sm font-black ${queueReductionPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {queueReductionPct >= 0 ? `-${queueReductionPct}% Fila` : `+${Math.abs(queueReductionPct)}% Fila`}
                    </span>
                </div>

                {/* Delta 3: Survival */}
                <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Diferencial Sobrevivência</span>
                    <span className={`text-sm font-black ${survivalDelta >= 0 ? 'text-teal-300' : 'text-rose-400'}`}>
                        {survivalDelta >= 0 ? `+${survivalDelta} dias` : `${survivalDelta} dias`}
                    </span>
                </div>

                {/* Delta 4: Health Score */}
                <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Delta Health Score</span>
                    <span className={`text-sm font-black ${healthScoreDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {healthScoreDelta >= 0 ? `+${healthScoreDelta} pts` : `${healthScoreDelta} pts`}
                    </span>
                </div>

            </div>

            {/* OVERLAID DUAL CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Overlaid Chart 1: Cash Balance */}
                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
                    <h3 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        Fluxo de Caixa Comparativo (A vs. B)
                    </h3>
                    <div className="h-56 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={combinedData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickFormatter={(d) => `D${d}`} />
                                <YAxis stroke="#94A3B8" fontSize={10} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#FFF' }} formatter={(val: any) => [`R$ ${Number(val).toLocaleString('pt-BR')}`, '']} />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="3 3" />
                                <Line type="monotone" dataKey="cashA" name={`A: ${baseline.name}`} stroke="#94A3B8" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="cashB" name={`B: ${compare.name}`} stroke="#14B8A6" strokeWidth={2.5} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Overlaid Chart 2: Queue Volume */}
                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
                    <h3 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider">
                        <Activity className="w-4 h-4 text-teal-400" />
                        Fila de Pacientes Comparativa (A vs. B)
                    </h3>
                    <div className="h-56 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={combinedData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickFormatter={(d) => `D${d}`} />
                                <YAxis stroke="#94A3B8" fontSize={10} />
                                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#FFF' }} />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                <Line type="monotone" dataKey="queueA" name={`A: ${baseline.name}`} stroke="#F43F5E" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="queueB" name={`B: ${compare.name}`} stroke="#10B981" strokeWidth={2.5} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ComparisonDashboard;
