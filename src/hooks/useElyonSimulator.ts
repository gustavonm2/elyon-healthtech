import { useState, useCallback } from 'react';
import type { SimulationReport, StressBottleneck, DailyMetrics } from '../types/simulator';
import type { DynamicStressor } from '../types/simulatorExtensions';
import type { LizPlaybook, LizPostMortemReport } from '../types/playbooks';
import { INITIAL_DYNAMIC_STRESSORS } from '../types/simulatorExtensions';
import { INITIAL_LIZ_PLAYBOOKS } from '../types/playbooks';
import { getRandomInflow } from '../utils/simulationMath';

export interface ElyonSimulatorInput {
    quantidadeMedicos?: number;
    capitalInicial?: number;
    receitaPorJornada?: number;
    diasPagamento?: number;
    pacientesPorDia?: number;
    taxaGlosasB2B?: number;
    tempoEsperaExames?: number;
    diasSimulacao?: number;
    lizAutomationRate?: number;
    doctorHourlyCost?: number;
    dynamicValues?: Record<string, number>;
}

export interface ExtendedSimulationReport extends SimulationReport {
    postMortem?: LizPostMortemReport;
    activePlaybooksCount?: number;
}

function runElyonSimulationInternal(
    input: ElyonSimulatorInput | DynamicStressor[],
    playbooks: LizPlaybook[] = []
): SimulationReport {
    const startTime = performance.now();

    // Map dynamic array into key-value map if passed as array
    let values: Record<string, number> = {};

    if (Array.isArray(input)) {
        input.forEach((item) => {
            values[item.id] = item.currentValue;
        });
    } else {
        values = {
            quantidadeMedicos: input.quantidadeMedicos ?? 10,
            capitalInicial: input.capitalInicial ?? 500000,
            receitaPorJornada: input.receitaPorJornada ?? 350,
            diasPagamento: input.diasPagamento ?? 30,
            pacientesPorDia: input.pacientesPorDia ?? 120,
            taxaGlosasB2B: input.taxaGlosasB2B ?? 5,
            tempoEsperaExames: input.tempoEsperaExames ?? 3,
            diasSimulacao: input.diasSimulacao ?? 40,
            lizAutomationRate: input.lizAutomationRate ?? 0.85,
            doctorHourlyCost: input.doctorHourlyCost ?? 150,
            ...(input.dynamicValues || {}),
        };
    }

    const quantidadeMedicos = values.quantidadeMedicos ?? 10;
    const capitalInicial = values.capitalInicial ?? 500000;
    const receitaPorJornada = values.receitaPorJornada ?? 350;
    let diasPagamento = values.diasPagamento ?? 30;
    let pacientesPorDia = values.pacientesPorDia ?? 120;
    let taxaGlosasB2B = values.taxaGlosasB2B ?? 5;
    const tempoEsperaExames = values.tempoEsperaExames ?? 3;
    const diasSimulacao = values.diasSimulacao ?? 40;
    const lizAutomationRate = values.lizAutomationRate ?? 0.85;
    let doctorHourlyCost = values.doctorHourlyCost ?? 150;

    // Check Active Contingency Playbooks
    const transbordoActive = playbooks.find(p => p.id === 'transbordoEmergencial')?.isActive || false;
    const auditoriaActive = playbooks.find(p => p.id === 'auditoriaAtivaLIZ')?.isActive || false;
    const retencaoActive = playbooks.find(p => p.id === 'protocoloRetencaoCronicos')?.isActive || false;
    const antecipacaoActive = playbooks.find(p => p.id === 'antecipacaoRecebiveis')?.isActive || false;

    // Apply Playbook initial parameter modifications
    if (transbordoActive) {
        doctorHourlyCost = Math.round(doctorHourlyCost * 1.25); // +25% doctor cost
    }

    if (auditoriaActive) {
        taxaGlosasB2B = taxaGlosasB2B * 0.20; // 80% reduction in glosas
    }

    if (antecipacaoActive) {
        diasPagamento = Math.max(0, Math.floor(diasPagamento * 0.50)); // Payment delay cut in half
    }

    const dailyPlaybookContingencyCost = playbooks
        .filter(p => p.isActive)
        .reduce((sum, p) => sum + p.impacts.costPerDay, 0);

    const metricsHistory: DailyMetrics[] = [];
    const bottlenecks: StressBottleneck[] = [];

    let currentCash = capitalInicial;
    let queue = 0;
    let systemCollapsed = false;
    let collapseReason: string | null = null;
    let survivalDays = diasSimulacao;

    let totalGlosaSaved = 0;
    let totalPatientsRedirected = 0;

    // Track daily potential revenue to simulate operator accounts receivable collection delay
    const revenuePipeline: number[] = new Array(diasSimulacao + 1).fill(0);
    let totalPendingReceivables = 0;

    // Push initial Playbook activation logs on Day 1
    if (transbordoActive) {
        bottlenecks.push({
            day: 1,
            type: 'CLINICAL_SATURATION',
            severity: 'WARNING',
            title: 'LIZ AI: Transbordo Emergencial Ativado',
            description: '[Dia 1] Ação LIZ: Transbordo emergencial ativo. 40% da demanda excedente redirecionada para rede de apoio.',
            impactMetric: 'Fila reduzida em -40%',
            recommendedAction: 'Estratégia LIZ em execução: monitorar taxa de ocupação da rede credenciada.',
        });
    }

    if (auditoriaActive) {
        bottlenecks.push({
            day: 1,
            type: 'FINANCIAL_INSOLVENCY',
            severity: 'WARNING',
            title: 'LIZ AI: Auditoria Ativa em Tempo Real',
            description: '[Dia 1] Ação LIZ: Algoritmos de pré-auditoria ativos. Taxa de glosas das operadoras reduzida em -80%.',
            impactMetric: 'Glosa reduzida em -80%',
            recommendedAction: 'Estratégia LIZ em execução: revisão automática de prontuários antes do envio das faturas.',
        });
    }

    for (let day = 1; day <= diasSimulacao; day++) {
        // 1. Demand & Arrivals
        let arrivals = getRandomInflow(pacientesPorDia, 0.15);

        // Apply Transbordo Playbook logic: reduce queue influx by 40%
        if (transbordoActive) {
            const originalArrivals = arrivals;
            arrivals = Math.round(arrivals * 0.60);
            totalPatientsRedirected += (originalArrivals - arrivals);
        }

        // 2. Capacity calculation
        const baseCapacity = Math.floor(quantidadeMedicos * 16);
        const lizCapacityMultiplier = lizAutomationRate >= 0.3
            ? 1 + 0.4 * lizAutomationRate
            : 0.8;
        const capacity = Math.floor(baseCapacity * lizCapacityMultiplier);

        // Process Queue & Consultations
        queue += arrivals;

        // Apply Dynamic Stressor math: tempoEsperaExames
        if (tempoEsperaExames > 7) {
            queue = Math.round(queue * 1.20);
        }

        const completed = Math.min(queue, capacity);
        queue -= completed;

        // SLA Breach calculation
        const idealCapacityLimit = Math.max(1, quantidadeMedicos * 4);
        const slaViolado = Math.min(90, Math.max(0, Math.round((queue / idealCapacityLimit) * 100)));

        // Bottleneck Check A: Clinical Saturation
        if (queue > capacity * 1.5) {
            const existingSat = bottlenecks.find(b => b.type === 'CLINICAL_SATURATION' && b.day === day && !b.title.includes('Transbordo'));
            if (!existingSat) {
                bottlenecks.push({
                    day,
                    type: 'CLINICAL_SATURATION',
                    severity: 'CRITICAL',
                    title: 'Gargalo Clínico: Tempo de Espera > 4h',
                    description: `[Dia ${day}] Gargalo Clínico: Fila acumulou ${queue} pacientes (SLA violado em ${slaViolado}%). Tempo médio de espera > 4h.`,
                    impactMetric: `Fila: ${queue} pac | SLA Breach: ${slaViolado}%`,
                    recommendedAction: 'Ação Recomendada: Contratar médico horista para os turnos da manhã.',
                });
            }
        }

        // 3. Financials & Burn Rate
        const dailyDoctorCost = quantidadeMedicos * 8 * doctorHourlyCost;
        const dailyFixedCost = Math.max(1500 * quantidadeMedicos, dailyDoctorCost + 2500) + dailyPlaybookContingencyCost;

        // Deduct daily burn rate
        currentCash -= dailyFixedCost;

        // Revenue generation today
        const grossRevenue = completed * receitaPorJornada;
        const netRevenue = Math.round(grossRevenue * (1 - taxaGlosasB2B / 100));

        if (auditoriaActive) {
            totalGlosaSaved += Math.round(grossRevenue * (0.80 * (values.taxaGlosasB2B ?? 5) / 100));
        }

        revenuePipeline[day] = netRevenue;
        totalPendingReceivables += netRevenue;

        // Revenue collection delay
        const collectionDay = day - diasPagamento;
        if (collectionDay > 0) {
            const collectedAmount = revenuePipeline[collectionDay] || 0;
            currentCash += collectedAmount;
            totalPendingReceivables -= collectedAmount;
        }

        // Check Financial Insolvency
        if (currentCash <= 0) {
            systemCollapsed = true;
            survivalDays = day;
            collapseReason = `[Dia ${day}] Falha Financeira: Fluxo de caixa zerado (R$ ${Math.round(currentCash).toLocaleString('pt-BR')}). Retenção de operadoras (${diasPagamento}d).`;

            bottlenecks.push({
                day,
                type: 'FINANCIAL_INSOLVENCY',
                severity: 'FATAL',
                title: 'Falha Financeira: Fluxo de Caixa Zerado',
                description: `[Dia ${day}] Falha Financeira: Fluxo de caixa zerado. Ação Recomendada: Renegociar prazo operadora.`,
                impactMetric: `Caixa: R$ ${Math.round(currentCash).toLocaleString('pt-BR')}`,
                recommendedAction: 'Ação Recomendada: Renegociar prazo operadora Z ou acionar antecipação de recebíveis.',
            });

            metricsHistory.push({
                day,
                patientsInQueue: queue,
                completedJourneys: completed,
                canceledJourneys: Math.floor(queue * 0.1),
                cashBalance: Math.round(currentCash),
                pendingReceivables: Math.round(totalPendingReceivables),
                burnRate: Math.round(dailyFixedCost),
                lizAlertsGenerated: Math.floor(arrivals * (1 - lizAutomationRate)),
                slaBreachRate: slaViolado,
                medicalCapacity: capacity,
            });

            break;
        }

        metricsHistory.push({
            day,
            patientsInQueue: queue,
            completedJourneys: completed,
            canceledJourneys: 0,
            cashBalance: Math.round(currentCash),
            pendingReceivables: Math.round(totalPendingReceivables),
            burnRate: Math.round(dailyFixedCost),
            lizAlertsGenerated: Math.floor(arrivals * (1 - lizAutomationRate)),
            slaBreachRate: slaViolado,
            medicalCapacity: capacity,
        });
    }

    // Health score calculation
    let healthScore = 100;
    const survivalRatio = survivalDays / diasSimulacao;
    if (systemCollapsed) {
        healthScore = Math.round(survivalRatio * 40);
    } else {
        const avgSla = metricsHistory.reduce((acc, m) => acc + m.slaBreachRate, 0) / (metricsHistory.length || 1);
        healthScore -= (bottlenecks.filter(b => b.severity === 'FATAL').length * 40);
        healthScore -= (bottlenecks.filter(b => b.severity === 'CRITICAL').length * 10);
        healthScore -= (avgSla * 0.3);
    }

    if (retencaoActive) {
        healthScore += 20; // +20 Health Score boost from Retenção de Crônicos
    }

    const overallHealthScore = Math.max(0, Math.min(100, Math.round(healthScore)));
    const endTime = performance.now();

    return {
        scenarioId: 'LIZ_WAR_ROOM_RUN',
        executionTimeMs: Math.round(endTime - startTime),
        survivalDays,
        didSystemCollapse: systemCollapsed,
        collapseReason,
        metricsHistory,
        bottlenecks,
        overallHealthScore,
    };
}

export function runElyonSimulation(
    input: ElyonSimulatorInput | DynamicStressor[],
    playbooks: LizPlaybook[] = []
): ExtendedSimulationReport {
    // 1. Run baseline pass without playbooks
    const baselineReport = runElyonSimulationInternal(input, []);

    // 2. Run active pass with active playbooks
    const activeReport = runElyonSimulationInternal(input, playbooks);

    const activeCount = playbooks.filter(p => p.isActive).length;
    const totalContingencyCost = playbooks
        .filter(p => p.isActive)
        .reduce((sum, p) => sum + p.impacts.costPerDay * activeReport.survivalDays, 0);

    const extendedDays = Math.max(0, activeReport.survivalDays - baselineReport.survivalDays);

    let summaryText = '';
    if (activeCount > 0) {
        if (extendedDays > 0) {
            summaryText = `Com a minha intervenção estratégica (Playbooks Ativos: ${activeCount}), conseguimos estender a sobrevivência do sistema em +${extendedDays} dias!`;
        } else if (!activeReport.didSystemCollapse) {
            summaryText = `Com os ${activeCount} playbooks ativos, o sistema operou dentro de 100% da margem de resiliência e estabilidade total.`;
        } else {
            summaryText = `As ações de contingência adiaram o colapso de caixa, contudo a retenção prolongada exigirá injeção de capital emergencial.`;
        }

        if (baselineReport.didSystemCollapse) {
            summaryText += ` Sem os playbooks ativos, o colapso financeiro teria ocorrido no Dia ${baselineReport.survivalDays}.`;
        }
    } else {
        summaryText = `Nenhum playbook de contingência está ativo no momento. O sistema está rodando no cenário de estresse puro.`;
        if (baselineReport.didSystemCollapse) {
            summaryText += ` O colapso do sistema ocorreu no Dia ${baselineReport.survivalDays}.`;
        }
    }

    const postMortem: LizPostMortemReport = {
        baselineSurvivalDays: baselineReport.survivalDays,
        activeSurvivalDays: activeReport.survivalDays,
        extendedDays,
        baselineCollapsed: baselineReport.didSystemCollapse,
        baselineCollapseDay: baselineReport.didSystemCollapse ? baselineReport.survivalDays : null,
        activeCollapsed: activeReport.didSystemCollapse,
        activeCollapseDay: activeReport.didSystemCollapse ? activeReport.survivalDays : null,
        totalContingencyCost,
        totalGlosaSaved: 0,
        totalPatientsRedirected: 0,
        recommendationSummary: summaryText,
    };

    return {
        ...activeReport,
        postMortem,
        activePlaybooksCount: activeCount,
    };
}

export function useElyonSimulator() {
    const [isExecuting, setIsExecuting] = useState<boolean>(false);
    const [report, setReport] = useState<ExtendedSimulationReport>(() =>
        runElyonSimulation(INITIAL_DYNAMIC_STRESSORS, INITIAL_LIZ_PLAYBOOKS)
    );

    const executeSimulation = useCallback(
        async (
            input: ElyonSimulatorInput | DynamicStressor[],
            playbooks: LizPlaybook[] = INITIAL_LIZ_PLAYBOOKS
        ): Promise<ExtendedSimulationReport> => {
            setIsExecuting(true);
            await new Promise((res) => setTimeout(res, 500));
            const resReport = runElyonSimulation(input, playbooks);
            setReport(resReport);
            setIsExecuting(false);
            return resReport;
        },
        []
    );

    return {
        isExecuting,
        report,
        executeSimulation,
        runElyonSimulationSync: runElyonSimulation,
    };
}
