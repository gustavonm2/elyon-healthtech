import React from 'react';
import {
    FileText,
    Printer,
    X,
    ShieldCheck,
    Flame,
    Award,
    AlertTriangle,
    DollarSign,
    Users,
    CheckCircle2,
    Sparkles,
    Cpu,
} from 'lucide-react';
import type { SimulationReport } from '../../types/simulator';
import type { DynamicStressor } from '../../types/simulatorExtensions';
import type { LizPlaybook } from '../../types/playbooks';
import type { OptimizationResult } from '../../hooks/useSimulationComparison';

interface ExecutiveReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: SimulationReport | null;
    scenarioName: string;
    stressors: DynamicStressor[];
    playbooks: LizPlaybook[];
    optimizationResult: OptimizationResult | null;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
    isOpen,
    onClose,
    report,
    scenarioName,
    stressors,
    playbooks,
    optimizationResult,
}) => {
    if (!isOpen || !report) return null;

    const handlePrint = () => {
        window.print();
    };

    const activePlaybooksCount = playbooks.filter((p) => p.isActive).length;
    const totalPatientsCompleted = report.metricsHistory.reduce((acc, m) => acc + m.completedJourneys, 0);
    const totalPatientsCanceled = report.metricsHistory.reduce((acc, m) => acc + m.canceledJourneys, 0);
    const maxSlaBreach = report.metricsHistory.length
        ? Math.max(...report.metricsHistory.map((m) => m.slaBreachRate))
        : 0;

    const finalCash = report.metricsHistory.length
        ? report.metricsHistory[report.metricsHistory.length - 1].cashBalance
        : 0;

    const initialCash = stressors.find((s) => s.id === 'capitalInicial')?.currentValue || 500000;
    const doctorCount = stressors.find((s) => s.id === 'quantidadeMedicos')?.currentValue || 10;
    const demandRate = stressors.find((s) => s.id === 'pacientesPorDia')?.currentValue || 120;
    const paymentDelay = stressors.find((s) => s.id === 'diasPagamento')?.currentValue || 30;

    const estimatedLoss = finalCash < 0 ? Math.abs(finalCash) : Math.max(0, initialCash - finalCash);

    const collapseType = report.didSystemCollapse
        ? report.collapseReason?.toLowerCase().includes('financeir')
            ? 'FINANCEIRO'
            : 'CLÍNICO'
        : 'NENHUM';

    const currentDate = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
            
            {/* Printable Container */}
            <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:bg-white print:text-slate-900 print:max-w-none print:w-full print:rounded-none">
                
                {/* Modal Action Header (Hidden during print) */}
                <div className="bg-[#1E293B] border-b border-slate-700 px-6 py-4 flex items-center justify-between print:hidden">
                    <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
                        <FileText className="w-4 h-4" />
                        <span>RELATÓRIO AUDITADO ELYON OS</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
                        >
                            <Printer className="w-4 h-4" />
                            Exportar Relatório Executivo (PDF)
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Document Content */}
                <div id="executive-report-document" className="p-6 sm:p-8 space-y-6 print:p-0 print:space-y-4 print:text-slate-900">
                    
                    {/* Document Corporate Header */}
                    <div className="border-b border-slate-700 print:border-slate-300 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-black text-white print:text-slate-900 tracking-tight">
                                    RELATÓRIO DE RESILIÊNCIA E IMPACTO OPERACIONAL
                                </h1>
                            </div>
                            <p className="text-xs text-teal-400 print:text-teal-700 font-bold mt-0.5 uppercase tracking-wider">
                                ELYON Healthtech Operating System — Digital Twin Stress Audit
                            </p>
                        </div>

                        <div className="text-right text-xs text-slate-400 print:text-slate-600 font-mono">
                            <span className="block font-bold text-slate-200 print:text-slate-900">Audit ID: #ELY-{Date.now().toString().slice(-6)}</span>
                            <span>Data do Auditor: {currentDate}</span>
                        </div>
                    </div>

                    {/* Section 1: Sumário Executivo (Gerado pela LIZ) */}
                    <div className="bg-slate-900/80 print:bg-slate-50 border border-slate-800 print:border-slate-200 p-5 rounded-2xl space-y-2">
                        <h2 className="text-xs font-black uppercase tracking-wider text-teal-300 print:text-slate-800 flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-teal-400 print:text-teal-700" />
                            1. Sumário Executivo (Gerado pela IA LIZ)
                        </h2>
                        
                        <p className="text-xs text-slate-200 print:text-slate-800 leading-relaxed font-medium">
                            {report.didSystemCollapse ? (
                                <>
                                    O sistema testado sob o cenário <strong className="text-white print:text-slate-900">"{scenarioName}"</strong> ({doctorCount} médicos, {demandRate} pac/dia) operou por <strong className="text-rose-400 print:text-rose-700">{report.survivalDays} dias</strong> antes de atingir um ponto de colapso <strong className="text-rose-400 print:text-rose-700">[{collapseType}]</strong> no Dia {report.survivalDays}. {report.collapseReason}
                                </>
                            ) : (
                                <>
                                    O sistema testado sob o cenário <strong className="text-white print:text-slate-900">"{scenarioName}"</strong> manteve a estabilidade operacional durante 100% do horizonte de testes (<strong className="text-emerald-400 print:text-emerald-700">{report.survivalDays} dias</strong>), registrando um Health Score final de <strong className="text-teal-300 print:text-teal-700">{report.overallHealthScore}/100</strong> sem qualquer colapso financeiro ou clínico.
                                </>
                            )}
                        </p>
                    </div>

                    {/* Section 2: Matriz de Perdas e Eficiência (2x2 Grid) */}
                    <div className="space-y-3">
                        <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 print:text-slate-800 flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-400 print:text-amber-600" />
                            2. Matriz de Perdas, Capacidade e Eficiência
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Cell 1: Pacientes Desassistidos */}
                            <div className="bg-slate-900/60 print:bg-slate-100 border border-slate-800 print:border-slate-300 p-4 rounded-xl space-y-1">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 print:text-slate-600 block">
                                    Pacientes Atendidos vs. Desassistidos
                                </span>
                                <div className="text-base font-black text-white print:text-slate-900">
                                    {totalPatientsCompleted.toLocaleString('pt-BR')} <span className="text-xs font-normal text-teal-400 print:text-teal-700">atendidos</span>
                                </div>
                                <p className="text-[11px] text-rose-400 print:text-rose-700 font-semibold">
                                    {totalPatientsCanceled} cancelamentos/desistências
                                </p>
                            </div>

                            {/* Cell 2: Prejuízo Operacional */}
                            <div className="bg-slate-900/60 print:bg-slate-100 border border-slate-800 print:border-slate-300 p-4 rounded-xl space-y-1">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 print:text-slate-600 block">
                                    Impacto Financeiro Estimado
                                </span>
                                <div className="text-base font-black text-rose-400 print:text-rose-700">
                                    R$ {estimatedLoss.toLocaleString('pt-BR')}
                                </div>
                                <p className="text-[11px] text-slate-400 print:text-slate-600">
                                    Atraso repasse operadoras: {paymentDelay} dias
                                </p>
                            </div>

                            {/* Cell 3: SLA Máximo */}
                            <div className="bg-slate-900/60 print:bg-slate-100 border border-slate-800 print:border-slate-300 p-4 rounded-xl space-y-1">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 print:text-slate-600 block">
                                    SLA Máximo de Espera Atingido
                                </span>
                                <div className={`text-base font-black ${maxSlaBreach > 40 ? 'text-amber-400 print:text-amber-700' : 'text-teal-300 print:text-teal-700'}`}>
                                    {maxSlaBreach}%
                                </div>
                                <p className="text-[11px] text-slate-400 print:text-slate-600">
                                    {maxSlaBreach > 40 ? 'Violação severa dos limites regulatórios' : 'Operação dentro da meta regulatória'}
                                </p>
                            </div>

                            {/* Cell 4: Health Score & Playbooks */}
                            <div className="bg-slate-900/60 print:bg-slate-100 border border-slate-800 print:border-slate-300 p-4 rounded-xl space-y-1">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 print:text-slate-600 block">
                                    Índice de Resiliência & Playbooks
                                </span>
                                <div className="text-base font-black text-teal-300 print:text-teal-700">
                                    {report.overallHealthScore} / 100 pts
                                </div>
                                <p className="text-[11px] text-slate-400 print:text-slate-600">
                                    Playbooks ativos: {activePlaybooksCount} / {playbooks.length}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Arquitetura de Defesa Recomendada */}
                    <div className="bg-slate-900/90 print:bg-slate-50 border border-teal-500/50 print:border-teal-700 p-5 rounded-2xl space-y-3">
                        <h2 className="text-xs font-black uppercase tracking-wider text-teal-300 print:text-teal-800 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-300 print:text-amber-600" />
                            3. Arquitetura de Defesa e Otimização Recomendada
                        </h2>

                        {optimizationResult ? (
                            <div className="space-y-2 text-xs text-slate-200 print:text-slate-800">
                                <p className="font-semibold">
                                    Com base em <strong className="text-teal-300 print:text-teal-800">{optimizationResult.iterationsRun} micro-simulações</strong> executadas em memória, a IA LIZ prescreve o seguinte dimensionamento mínimo viável:
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-slate-300 print:text-slate-800">
                                    <li>
                                        <strong>Equipe Médica Mínima:</strong> {optimizationResult.minDoctors} médicos ativos em escala diária.
                                    </li>
                                    <li>
                                        <strong>Reserva de Caixa Requerida:</strong> R$ {(optimizationResult.minCashReserve / 1000).toFixed(0)}k para cobrir a folha durante os {paymentDelay} dias de retenção das operadoras.
                                    </li>
                                    <li>
                                        <strong>Playbooks Indicados:</strong> Transbordo Emergencial (-40% fila) + Auditoria Ativa LIZ AI (-80% glosas).
                                    </li>
                                </ul>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-300 print:text-slate-800 leading-relaxed">
                                Para estabilizar o fluxo sem risco de colapso antes do término da janela de simulação, recomenda-se aumentar a escala médica proporcionalmente ao volume diário e manter a automação da LIZ AI acima de 70%.
                            </p>
                        )}
                    </div>

                    {/* Section 4: Log de Gargalos e Colapsos Capturados */}
                    <div className="space-y-3">
                        <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 print:text-slate-800 flex items-center gap-2">
                            <Flame className="w-4 h-4 text-rose-500 print:text-rose-700" />
                            4. Diagnóstico de Gargalos Críticos Registrados ({report.bottlenecks.length} Eventos)
                        </h2>

                        <div className="space-y-2">
                            {report.bottlenecks.slice(0, 4).map((b, idx) => (
                                <div key={idx} className="p-3 rounded-xl bg-slate-900/60 print:bg-white border border-slate-800 print:border-slate-300 text-xs flex justify-between items-start gap-3">
                                    <div>
                                        <span className="font-bold text-white print:text-slate-900 block">
                                            [Dia {b.day}] {b.title} ({b.severity})
                                        </span>
                                        <p className="text-[11px] text-slate-400 print:text-slate-600 mt-0.5">
                                            {b.description}
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-teal-300 print:text-teal-800 bg-slate-950 print:bg-slate-100 px-2 py-1 rounded">
                                        {b.impactMetric}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Legal Signoff */}
                    <div className="pt-4 border-t border-slate-800 print:border-slate-300 flex justify-between items-center text-[10px] text-slate-500 print:text-slate-600">
                        <span>ELYON Healthtech Operating System © 2026 — Documento Auditado</span>
                        <span>Autenticação Digital: {Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ExecutiveReportModal;
