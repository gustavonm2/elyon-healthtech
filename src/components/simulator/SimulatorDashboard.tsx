import React, { useState, useEffect } from 'react';
import {
    Activity,
    AlertTriangle,
    ShieldCheck,
    Play,
    Sliders,
    DollarSign,
    Users,
    Cpu,
    CheckCircle2,
    RotateCcw,
    Zap,
    Flame,
    HeartCrack,
    Banknote,
    ShieldAlert,
    Lightbulb,
    Clock,
    Filter,
    Award,
    TrendingUp,
    Sparkles,
    Camera,
    Columns,
    Grid,
    FileText,
    Bot,
    Eye,
} from 'lucide-react';
import { analyzeScreenWithLiz } from '../../services/lizVisionService';
import { lizGeminiAudioService } from '../../services/lizGeminiAudioService';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine,
} from 'recharts';

import type { DynamicStressor } from '../../types/simulatorExtensions';
import type { LizPlaybook } from '../../types/playbooks';
import type { ParsedScenarioResult } from '../../utils/lizPromptParser';
import { INITIAL_DYNAMIC_STRESSORS } from '../../types/simulatorExtensions';
import { INITIAL_LIZ_PLAYBOOKS } from '../../types/playbooks';
import { StressorControlPanel } from './StressorControlPanel';
import { LizStrategyPanel } from './LizStrategyPanel';
import { ComparisonDashboard } from './ComparisonDashboard';
import { SurvivalHeatmap } from './SurvivalHeatmap';
import { ExecutiveReportModal } from './ExecutiveReportModal';
import { ScenarioPromptReader } from './ScenarioPromptReader';
import { PRESET_SCENARIOS_LIST, getScenarioById } from '../../lib/simulator/scenarios';
import { useElyonSimulator } from '../../hooks/useElyonSimulator';
import { useSimulationComparison } from '../../hooks/useSimulationComparison';

export const SimulatorDashboard: React.FC = () => {
    const [selectedScenarioId, setSelectedScenarioId] = useState<string>('EPIDEMIC_SURGE');
    const [stressors, setStressors] = useState<DynamicStressor[]>(INITIAL_DYNAMIC_STRESSORS);
    const [playbooks, setPlaybooks] = useState<LizPlaybook[]>(INITIAL_LIZ_PLAYBOOKS);
    const [severityFilter, setSeverityFilter] = useState<string>('ALL');
    const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
    const [nlpReasoningAlert, setNlpReasoningAlert] = useState<string | null>(null);

    const { isExecuting, report, executeSimulation } = useElyonSimulator();

    const {
        snapshots,
        baselineSnapshot,
        compareSnapshot,
        setBaselineSnapshot,
        setCompareSnapshot,
        isComparisonMode,
        setIsComparisonMode,
        saveSnapshot,
        isOptimizing,
        optimizationResult,
        findSurvivalThreshold,
    } = useSimulationComparison();

    // Initial simulation run on mount
    useEffect(() => {
        executeSimulation(stressors, playbooks);
    }, []);

    const handleScenarioSelect = (scenarioId: string) => {
        setSelectedScenarioId(scenarioId);
        const scenarioConfig = getScenarioById(scenarioId);

        const updatedStressors = stressors.map((s) => {
            switch (s.id) {
                case 'quantidadeMedicos':
                    return { ...s, currentValue: scenarioConfig.availableDoctors };
                case 'pacientesPorDia':
                    return { ...s, currentValue: scenarioConfig.patientArrivalRatePerDay };
                case 'capitalInicial':
                    return { ...s, currentValue: scenarioConfig.initialCashReserve };
                case 'receitaPorJornada':
                    return { ...s, currentValue: scenarioConfig.revenuePerResolvedJourney };
                case 'diasPagamento':
                    return { ...s, currentValue: scenarioConfig.operatorPaymentDelayDays };
                case 'lizAutomationRate':
                    return { ...s, currentValue: scenarioConfig.lizAutomationRate };
                case 'doctorHourlyCost':
                    return { ...s, currentValue: scenarioConfig.doctorHourlyCost };
                default:
                    return s;
            }
        });

        setStressors(updatedStressors);
        executeSimulation(updatedStressors, playbooks);
    };

    const handleStressorChange = (id: string, val: number) => {
        const updated = stressors.map((s) => (s.id === id ? { ...s, currentValue: val } : s));
        setStressors(updated);
        executeSimulation(updated, playbooks);
    };

    const handleAddStressor = (newStressor: DynamicStressor) => {
        const updated = [...stressors, newStressor];
        setStressors(updated);
        executeSimulation(updated, playbooks);
    };

    const handleTogglePlaybook = (id: string) => {
        const updatedPlaybooks = playbooks.map((p) =>
            p.id === id ? { ...p, isActive: !p.isActive } : p
        );
        setPlaybooks(updatedPlaybooks);
        executeSimulation(stressors, updatedPlaybooks);
    };

    const handleApplyNLPPrompt = (parsedResult: ParsedScenarioResult) => {
        setStressors(parsedResult.updatedStressors);
        setNlpReasoningAlert(parsedResult.lizReasoning);
        executeSimulation(parsedResult.updatedStressors, playbooks);
    };

    const handleRunButtonClick = (e: React.MouseEvent) => {
        e.preventDefault();
        executeSimulation(stressors, playbooks);
    };

    const handleSaveCurrentSnapshot = () => {
        const presetName = PRESET_SCENARIOS_LIST.find(s => s.id === selectedScenarioId)?.name || 'Cenário Customizado';
        saveSnapshot(presetName, report, stressors);
    };

    const handleApplyOptimization = () => {
        if (!optimizationResult) return;
        const updated = stressors.map((s) => {
            if (s.id === 'quantidadeMedicos') return { ...s, currentValue: optimizationResult.minDoctors };
            if (s.id === 'capitalInicial') return { ...s, currentValue: optimizationResult.minCashReserve };
            return s;
        });
        setStressors(updated);
        executeSimulation(updated, playbooks);
    };

    // Helper getters for summary cards
    const totalPatientsCompleted = report?.metricsHistory?.reduce((acc, m) => acc + m.completedJourneys, 0) ?? 0;
    const totalPatientsCanceled = report?.metricsHistory?.reduce((acc, m) => acc + m.canceledJourneys, 0) ?? 0;

    const maxSlaBreach = report?.metricsHistory?.length
        ? Math.max(...report.metricsHistory.map((m) => m.slaBreachRate))
        : 0;

    const peakQueueVolume = report?.metricsHistory?.length
        ? Math.max(...report.metricsHistory.map((m) => m.patientsInQueue))
        : 0;

    const finalCash = report?.metricsHistory?.length
        ? report.metricsHistory[report.metricsHistory.length - 1].cashBalance
        : 0;

    const totalDaysRunway = stressors.find((s) => s.id === 'diasSimulacao')?.currentValue || 40;
    const currentDoctorsCount = stressors.find((s) => s.id === 'quantidadeMedicos')?.currentValue || 10;
    const currentDemandCount = stressors.find((s) => s.id === 'pacientesPorDia')?.currentValue || 120;
    const currentPresetName = PRESET_SCENARIOS_LIST.find(s => s.id === selectedScenarioId)?.name || 'Cenário Personalizado';

    // Severity Sorting Helper: FATAL > CRITICAL > WARNING
    const severityOrder: Record<string, number> = {
        FATAL: 1,
        CRITICAL: 2,
        WARNING: 3,
    };

    const sortedBottlenecks = [...(report?.bottlenecks || [])].sort((a, b) => {
        const orderA = severityOrder[a.severity] || 99;
        const orderB = severityOrder[b.severity] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return a.day - b.day;
    });

    const filteredChaosFeed = sortedBottlenecks.filter((b) => {
        if (severityFilter === 'ALL') return true;
        return b.severity === severityFilter;
    });

    const getBottleneckIcon = (type: string, severity: string) => {
        switch (type) {
            case 'FINANCIAL_INSOLVENCY':
                return <Banknote className="w-5 h-5 text-rose-400 flex-shrink-0" />;
            case 'CLINICAL_SATURATION':
                return <Flame className="w-5 h-5 text-amber-400 flex-shrink-0" />;
            case 'LIZ_COORDINATION_BREAKDOWN':
                return <HeartCrack className="w-5 h-5 text-purple-400 flex-shrink-0" />;
            case 'SLA_VIOLATION':
            default:
                return severity === 'CRITICAL' ? (
                    <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
                ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-300 flex-shrink-0" />
                );
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans p-4 sm:p-6 lg:p-8 space-y-6">

            {/* ── TOP BAR HEADER ── */}
            <div className="bg-[#1E293B]/90 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-inner flex-shrink-0">
                        <Zap className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                                ELYON Stress & Reality Simulator
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                                NLP Generative Engine v8.0
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Orquestrador de Cenários por Linguagem Natural (NLP Ingestion), Playbooks LIZ e Simulação Prescritiva
                        </p>
                    </div>
                </div>

                {/* Strategic Tools Bar */}
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
                    
                    {/* Executive Report CTA Button */}
                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        disabled={!report}
                        className="px-3.5 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-300 font-extrabold text-xs shadow-lg transition flex items-center gap-1.5 disabled:opacity-40"
                    >
                        <FileText className="w-4 h-4 text-teal-400" />
                        Gerar Relatório Clínico
                    </button>

                    {/* LIZ Optimizer CTA */}
                    <button
                        onClick={() => findSurvivalThreshold(stressors)}
                        disabled={isOptimizing}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/20 transition flex items-center gap-1.5"
                    >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        {isOptimizing ? 'Otimizando...' : 'LIZ: Otimizar Recursos'}
                    </button>

                    {/* Olhos da LIZ Vision CTA */}
                    <button
                        onClick={async () => {
                            const res = await analyzeScreenWithLiz('Analise a tela do simulador de realidade e forneça a avaliação clínica da LIZ.');
                            alert(`👁️ [OLHOS DA LIZ - PARECER CLÍNICO]:\n\n${res.analysisText}`);
                            lizGeminiAudioService.playNeuralSpeech(res.analysisText);
                        }}
                        className="px-3 py-2 rounded-xl bg-gradient-to-r from-teal-500/20 to-purple-500/20 hover:from-teal-500/30 hover:to-purple-500/30 border border-teal-500/60 text-xs font-bold text-teal-300 transition flex items-center gap-1.5 shadow-md shadow-teal-500/10"
                        title="Inspecionar Tela Atual com os Olhos da LIZ"
                    >
                        <Eye className="w-4 h-4 text-cyan-300 animate-pulse" />
                        Olhos da LIZ
                    </button>

                    {/* Save Snapshot CTA */}
                    <button
                        onClick={handleSaveCurrentSnapshot}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5"
                        title="Salvar Snapshot do Cenário Atual"
                    >
                        <Camera className="w-4 h-4 text-teal-400" />
                        Snapshot
                    </button>

                    {/* Split View Toggle */}
                    <button
                        onClick={() => setIsComparisonMode(!isComparisonMode)}
                        className={`px-3 py-2 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 ${
                            isComparisonMode
                                ? 'bg-teal-500/20 border-teal-500 text-teal-300 shadow-sm'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                    >
                        <Columns className="w-4 h-4 text-teal-400" />
                        {isComparisonMode ? 'Fechar Comparação' : 'Modo Comparativo'}
                    </button>

                    {/* Heatmap Toggle */}
                    <button
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        className={`px-3 py-2 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 ${
                            showHeatmap
                                ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                    >
                        <Grid className="w-4 h-4 text-purple-400" />
                        {showHeatmap ? 'Ocultar Heatmap' : 'Heatmap'}
                    </button>

                    {/* Main Execute CTA */}
                    <button
                        onClick={handleRunButtonClick}
                        disabled={isExecuting}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs tracking-wide shadow-lg shadow-teal-500/20 transition transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isExecuting ? (
                            <RotateCcw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Play className="w-4 h-4 fill-current" />
                        )}
                        {isExecuting ? 'Simulando...' : 'Simular'}
                    </button>
                </div>
            </div>

            {/* Run Progress Bar */}
            {isExecuting && (
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700">
                    <div
                        className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full animate-pulse transition-all duration-300 ease-out"
                        style={{ width: '100%' }}
                    />
                </div>
            )}

            {/* ── STEP 8: LIZ NLP PROMPT READER COMPONENT ── */}
            <ScenarioPromptReader
                currentStressors={stressors}
                onApplyPrompt={handleApplyNLPPrompt}
            />

            {/* ── LIZ NLP REASONING ALERT BOX ── */}
            {nlpReasoningAlert && (
                <div className="bg-teal-950/40 border border-teal-500/60 p-4 rounded-2xl shadow-xl flex items-start gap-3 text-xs text-teal-200">
                    <Bot className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5 animate-pulse" />
                    <div className="flex-1 space-y-1">
                        <span className="font-extrabold text-teal-300 block uppercase tracking-wider text-[10px]">
                            Interpretação e Ingestão de Linguagem Natural LIZ AI:
                        </span>
                        <p className="leading-relaxed text-slate-200">{nlpReasoningAlert}</p>
                    </div>
                    <button
                        onClick={() => setNlpReasoningAlert(null)}
                        className="text-slate-400 hover:text-white text-[10px] font-bold"
                    >
                        [Fechar]
                    </button>
                </div>
            )}

            {/* ── LIZ REVERSE CALCULATION OPTIMIZER RECOMMENDATION BANNER ── */}
            {optimizationResult && (
                <div className="bg-gradient-to-r from-violet-950/80 via-purple-950/70 to-slate-900 border border-purple-500/60 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/40 flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/40">
                                Otimizador Prescritivo LIZ ({optimizationResult.iterationsRun} Micro-simulações)
                            </span>
                            <p className="text-xs text-white font-bold mt-1 leading-snug">
                                {optimizationResult.recommendationText}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleApplyOptimization}
                        className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition flex-shrink-0"
                    >
                        Aplicar Configuração Recomendada
                    </button>
                </div>
            )}

            {/* ── SNAPSHOTS & COMPARISON SELECTION BAR ── */}
            {snapshots.length > 0 && (
                <div className="bg-[#1E293B]/60 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Camera className="w-3.5 h-3.5 text-teal-400" /> Snapshots ({snapshots.length}):
                        </span>

                        {snapshots.map((snap) => {
                            const isBaseline = baselineSnapshot?.id === snap.id;
                            const isCompare = compareSnapshot?.id === snap.id;

                            return (
                                <div key={snap.id} className="flex items-center gap-1 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg">
                                    <span className="font-semibold text-slate-200">{snap.name}</span>
                                    <span className="text-[10px] text-slate-500">({snap.createdAt})</span>
                                    
                                    <button
                                        onClick={() => setBaselineSnapshot(snap)}
                                        className={`px-1.5 py-0.5 text-[9px] font-black rounded ${isBaseline ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        [A]
                                    </button>
                                    <button
                                        onClick={() => setCompareSnapshot(snap)}
                                        className={`px-1.5 py-0.5 text-[9px] font-black rounded ${isCompare ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        [B]
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setIsComparisonMode(true)}
                        className="px-3 py-1 bg-teal-500/20 text-teal-300 font-bold rounded-lg border border-teal-500/40 hover:bg-teal-500/30"
                    >
                        Comparar A vs. B
                    </button>
                </div>
            )}

            {/* ── SPLIT VIEW COMPARISON DASHBOARD ── */}
            {isComparisonMode && (
                <ComparisonDashboard
                    baseline={baselineSnapshot}
                    compare={compareSnapshot}
                    onClose={() => setIsComparisonMode(false)}
                />
            )}

            {/* ── SURVIVAL HEATMAP ── */}
            {showHeatmap && (
                <SurvivalHeatmap
                    currentDoctors={currentDoctorsCount}
                    currentDemand={currentDemandCount}
                    targetDays={totalDaysRunway}
                />
            )}

            {/* ── EXECUTIVE REPORT MODAL (PDF EXPORT) ── */}
            <ExecutiveReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                report={report}
                scenarioName={currentPresetName}
                stressors={stressors}
                playbooks={playbooks}
                optimizationResult={optimizationResult}
            />

            {/* ── LIZ SUMMARY REPORT CARD (POST-MORTEM CARD) ── */}
            {report?.postMortem && (
                <div className="bg-[#1E293B]/90 border border-teal-500/50 rounded-2xl p-5 shadow-2xl relative overflow-hidden space-y-3">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-700/60 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/40">
                                <Award className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                                    Relatório de Impacto & Resiliência LIZ AI (Post-Mortem)
                                    <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded font-black border border-teal-500/40">
                                        Análise Pós-Simulação
                                    </span>
                                </h3>
                                <p className="text-xs text-teal-300 font-medium italic mt-0.5">
                                    "{report.postMortem.recommendationSummary}"
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 self-end md:self-center">
                            <div className="bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-xl text-center">
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">Sobrevivência Sem LIZ</span>
                                <span className="text-xs font-black text-rose-400">
                                    {report.postMortem.baselineCollapsed ? `Dia ${report.postMortem.baselineCollapseDay}` : '100%'}
                                </span>
                            </div>
                            <div className="bg-teal-950/60 border border-teal-500/60 px-3 py-1.5 rounded-xl text-center shadow-lg shadow-teal-500/10">
                                <span className="text-[10px] text-teal-300 font-bold block uppercase">Sobrevivência Com LIZ</span>
                                <span className="text-xs font-black text-emerald-400">
                                    {report.postMortem.activeCollapsed ? `Dia ${report.postMortem.activeCollapseDay}` : `${report.survivalDays}d (Total)`}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Ganho de Sobrevivência</span>
                            <span className="text-sm font-black text-emerald-400 flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5" />
                                {report.postMortem.extendedDays > 0 ? `+${report.postMortem.extendedDays} dias` : 'Estabilidade'}
                            </span>
                        </div>

                        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Playbooks Ativos</span>
                            <span className="text-sm font-black text-teal-300">
                                {playbooks.filter((p) => p.isActive).length} / {playbooks.length}
                            </span>
                        </div>

                        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Custo Total Contingência</span>
                            <span className="text-sm font-black text-amber-400">
                                R$ {report.postMortem.totalContingencyCost.toLocaleString('pt-BR')}
                            </span>
                        </div>

                        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Status do Sistema</span>
                            <span className={`text-sm font-black ${report.didSystemCollapse ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {report.didSystemCollapse ? 'COLAPSO' : 'OPERACIONAL'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Presets Quick Bar */}
            <div className="bg-[#1E293B]/60 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cenários Rápidos:</span>
                    {PRESET_SCENARIOS_LIST.map((sc) => (
                        <button
                            key={sc.id}
                            onClick={() => handleScenarioSelect(sc.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
                                sc.id === selectedScenarioId
                                    ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {sc.name.split(' (')[0]}
                        </button>
                    ))}
                </div>
                <div className="text-xs text-teal-400 font-semibold flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5" />
                    {stressors.length} Estressores Ativos
                </div>
            </div>

            {/* ── LIZ COMMAND CENTER (PLAYBOOKS PANEL) ── */}
            <LizStrategyPanel
                playbooks={playbooks}
                onTogglePlaybook={handleTogglePlaybook}
            />

            {/* ── MAIN 3-COLUMN ARCHITECTURE ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* ────────────────────────────────────────────────────────────────
                    COLUMN 1: EXPANDABLE STRESSORS CONTROL PANEL (LEFT)
                   ──────────────────────────────────────────────────────────────── */}
                <div className="lg:col-span-3 bg-[#1E293B]/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <StressorControlPanel
                        stressors={stressors}
                        onStressorChange={handleStressorChange}
                        onAddStressor={handleAddStressor}
                    />
                </div>

                {/* ────────────────────────────────────────────────────────────────
                    COLUMN 2: RESULTADOS & TELEMETRIA EM TEMPO REAL (CENTER)
                   ──────────────────────────────────────────────────────────────── */}
                <div className="lg:col-span-5 space-y-6">

                    {/* Top Summary KPI Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                        {/* KPI 1: Estado do Sistema */}
                        <div className={`p-4 rounded-2xl border backdrop-blur shadow-xl transition ${
                            report?.didSystemCollapse ? 'bg-rose-950/40 border-rose-600/60' : 'bg-emerald-950/30 border-emerald-600/50'
                        }`}>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Estado</span>
                                {report?.didSystemCollapse ? (
                                    <Flame className="w-4 h-4 text-rose-500 animate-bounce" />
                                ) : (
                                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                )}
                            </div>
                            <div className="mt-2">
                                <span className={`text-base font-black tracking-tight ${
                                    report?.didSystemCollapse ? 'text-rose-400' : 'text-emerald-400'
                                }`}>
                                    {report?.didSystemCollapse ? 'COLAPSO' : 'OPERACIONAL'}
                                </span>
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                    {report?.didSystemCollapse ? `Dia ${report.survivalDays}` : 'Margem segura'}
                                </p>
                            </div>
                        </div>

                        {/* KPI 2: Sobrevivência */}
                        <div className="bg-[#1E293B]/80 border border-slate-800 p-4 rounded-2xl shadow-xl">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Sobrevivência</span>
                                <Activity className="w-4 h-4 text-teal-400" />
                            </div>
                            <div className="mt-2">
                                <div className="text-base font-black text-white">
                                    {report?.survivalDays} <span className="text-xs text-slate-500 font-normal">/ {totalDaysRunway}d</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                    {report?.didSystemCollapse ? 'Encerrado precocemente' : '100% concluído'}
                                </p>
                            </div>
                        </div>

                        {/* KPI 3: Caixa Final */}
                        <div className="bg-[#1E293B]/80 border border-slate-800 p-4 rounded-2xl shadow-xl">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Caixa Final</span>
                                <DollarSign className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="mt-2">
                                <div className={`text-base font-black ${finalCash >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    R$ {(finalCash / 1000).toFixed(0)}k
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                    Saldo projetado
                                </p>
                            </div>
                        </div>

                        {/* KPI 4: Max SLA Violado */}
                        <div className="bg-[#1E293B]/80 border border-slate-800 p-4 rounded-2xl shadow-xl">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">SLA Violado (Max)</span>
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                            </div>
                            <div className="mt-2">
                                <div className={`text-base font-black ${maxSlaBreach > 40 ? 'text-amber-400' : 'text-teal-400'}`}>
                                    {maxSlaBreach}%
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                    {maxSlaBreach > 40 ? 'Pico de SLA crítico' : 'SLA controlado'}
                                </p>
                            </div>
                        </div>

                        {/* KPI 5: Pico Fila Pacientes */}
                        <div className="bg-[#1E293B]/80 border border-slate-800 p-4 rounded-2xl shadow-xl">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Pico Fila Pacientes</span>
                                <Users className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="mt-2">
                                <div className="text-base font-black text-white">
                                    {peakQueueVolume} <span className="text-[10px] text-slate-500 font-normal">pacientes</span>
                                </div>
                                <p className="text-[10px] text-teal-400 mt-0.5 truncate">
                                    {totalPatientsCompleted.toLocaleString('pt-BR')} atendidos
                                </p>
                            </div>
                        </div>

                        {/* KPI 6: Health Score */}
                        <div className="bg-[#1E293B]/80 border border-slate-800 p-4 rounded-2xl shadow-xl">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Health Score</span>
                                <Cpu className="w-4 h-4 text-teal-400" />
                            </div>
                            <div className="mt-2">
                                <div className="text-base font-black text-teal-300">
                                    {report?.overallHealthScore}<span className="text-xs text-slate-500">/100</span>
                                </div>
                                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                                    <div
                                        className={`h-full ${
                                            (report?.overallHealthScore || 0) > 70
                                                ? 'bg-emerald-400'
                                                : (report?.overallHealthScore || 0) > 40
                                                ? 'bg-amber-400'
                                                : 'bg-rose-500'
                                        }`}
                                        style={{ width: `${report?.overallHealthScore || 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* MAIN CHART: Fila de Pacientes vs. Capacidade Médica */}
                    <div className="bg-[#1E293B]/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-teal-400" />
                                    Fila de Pacientes vs. Capacidade Médica
                                </h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Demonstração gráfica do ponto exato de saturação da equipe médica
                                </p>
                            </div>
                        </div>

                        <div className="h-64 w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={report?.metricsHistory || []}>
                                    <defs>
                                        <linearGradient id="queueGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.45} />
                                            <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="capacityGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickFormatter={(d) => `D${d}`} />
                                    <YAxis stroke="#94A3B8" fontSize={10} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#FFF' }} />
                                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                                    <Area type="monotone" dataKey="patientsInQueue" name="Fila de Espera (Acumulada)" stroke="#F43F5E" strokeWidth={2} fillOpacity={1} fill="url(#queueGradient)" />
                                    <Area type="monotone" dataKey="medicalCapacity" name="Capacidade Médica Diária" stroke="#14B8A6" strokeWidth={2} fillOpacity={1} fill="url(#capacityGradient)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* SECONDARY CHART: Fluxo de Caixa & Riscos de Insolvência */}
                    <div className="bg-[#1E293B]/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-emerald-400" />
                                    Fluxo de Caixa & Contas a Receber
                                </h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Curva de liquidez e ponto de insolvência por retenção de operadoras
                                </p>
                            </div>
                        </div>

                        <div className="h-56 w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={report?.metricsHistory || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickFormatter={(d) => `D${d}`} />
                                    <YAxis stroke="#94A3B8" fontSize={10} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#FFF' }} formatter={(val: any) => [`R$ ${Number(val).toLocaleString('pt-BR')}`, '']} />
                                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                                    <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Insolvência (Caixa 0)', fill: '#EF4444', fontSize: 10 }} />
                                    <Line type="monotone" dataKey="cashBalance" name="Saldo de Caixa (R$)" stroke="#10B981" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="pendingReceivables" name="A Receber Operadoras (R$)" stroke="#3B82F6" strokeWidth={1.5} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

                {/* ────────────────────────────────────────────────────────────────
                    COLUMN 3: PAINEL DE DIAGNÓSTICO DE FALHAS (CHAOS FEED) (FAR RIGHT)
                   ──────────────────────────────────────────────────────────────── */}
                <div className="lg:col-span-4 bg-[#1E293B]/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col min-h-[680px]">
                    
                    {/* Header Column 3 */}
                    <div className="border-b border-slate-700/60 pb-3 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-wider text-rose-300 flex items-center gap-2">
                                <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
                                PAINEL DE DIAGNÓSTICO DE FALHAS (CHAOS FEED)
                            </h2>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                {filteredChaosFeed.length} Eventos
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                            Feed prescritivo de colapsos ordenado por severidade (FATAL &gt; CRITICAL &gt; WARNING)
                        </p>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex items-center gap-1.5 text-xs flex-shrink-0">
                        <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                            <Filter className="w-3 h-3 text-slate-400" /> Filtro:
                        </span>
                        {['ALL', 'FATAL', 'CRITICAL', 'WARNING'].map((sev) => {
                            const active = severityFilter === sev;
                            return (
                                <button
                                    key={sev}
                                    onClick={() => setSeverityFilter(sev)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase transition border ${
                                        active
                                            ? sev === 'FATAL'
                                                ? 'bg-rose-600 text-white border-rose-500'
                                                : sev === 'CRITICAL'
                                                ? 'bg-amber-500 text-slate-950 border-amber-400'
                                                : sev === 'WARNING'
                                                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                                                : 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    {sev === 'ALL' ? 'Todos' : sev}
                                </button>
                            );
                        })}
                    </div>

                    {/* Scrollable High-Fidelity Feed Container */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[580px]">
                        {filteredChaosFeed.length === 0 ? (
                            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
                                <CheckCircle2 className="w-10 h-10 text-emerald-400/80" />
                                <div>
                                    <span className="font-bold text-slate-200 block">Sem Gargalos Críticos</span>
                                    <span className="text-[11px] text-slate-400">Nenhuma falha registrada para o filtro selecionado.</span>
                                </div>
                            </div>
                        ) : (
                            filteredChaosFeed.map((event, idx) => {
                                const isFatal = event.severity === 'FATAL';
                                const isCritical = event.severity === 'CRITICAL';
                                const isLizAction = event.title.includes('LIZ AI:');

                                return (
                                    <div
                                        key={idx}
                                        className={`p-4 rounded-xl border transition-all duration-200 space-y-2.5 ${
                                            isLizAction
                                                ? 'bg-teal-950/30 border-teal-500/70 shadow-md shadow-teal-950/40'
                                                : isFatal
                                                ? 'bg-rose-950/40 border-rose-600/80 shadow-lg shadow-rose-950/50'
                                                : isCritical
                                                ? 'bg-amber-950/30 border-amber-600/70 shadow-md'
                                                : 'bg-slate-900/70 border-slate-700/80'
                                        }`}
                                    >
                                        {/* Top Row: Timestamp & Severity Badge */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                {isLizAction ? (
                                                    <Zap className="w-5 h-5 text-teal-400 flex-shrink-0 animate-pulse" />
                                                ) : (
                                                    getBottleneckIcon(event.type, event.severity)
                                                )}
                                                <span className="text-[11px] font-black text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-slate-400" />
                                                    [Dia {event.day}]
                                                </span>
                                            </div>

                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                                    isLizAction
                                                        ? 'bg-teal-500 text-slate-950'
                                                        : isFatal
                                                        ? 'bg-rose-600 text-white'
                                                        : isCritical
                                                        ? 'bg-amber-500 text-slate-950'
                                                        : 'bg-slate-700 text-slate-300'
                                                }`}
                                            >
                                                {isLizAction ? 'LIZ ACTION' : event.severity}
                                            </span>
                                        </div>

                                        {/* Event Title */}
                                        <h4 className={`text-xs font-black leading-tight ${isLizAction ? 'text-teal-200' : 'text-white'}`}>
                                            {event.title}
                                        </h4>

                                        {/* Root Cause & Numerical Impact */}
                                        <p className="text-[11px] text-slate-300 leading-relaxed">
                                            {event.description}
                                        </p>

                                        {/* Impact Metric Highlight */}
                                        <div className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center justify-between ${
                                            isLizAction
                                                ? 'bg-slate-950/80 text-teal-300 border-teal-500/40'
                                                : 'bg-slate-950/60 text-rose-300 border-slate-800/80'
                                        }`}>
                                            <span className="text-slate-400 font-medium">
                                                {isLizAction ? 'Resultado da Mitigação:' : 'Impacto Registrado:'}
                                            </span>
                                            <span>{event.impactMetric}</span>
                                        </div>

                                        {/* AI Prescriptive Recommended Action Sub-tagline */}
                                        <div className="pt-1.5 border-t border-slate-700/40 text-[11px] text-teal-300 font-medium flex items-start gap-1.5">
                                            <Lightbulb className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <span className="font-bold text-teal-400 block text-[10px] uppercase tracking-wider">Ação Recomendada pela IA LIZ:</span>
                                                <span className="text-slate-200 leading-tight block mt-0.5">{event.recommendedAction}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
};

export default SimulatorDashboard;
