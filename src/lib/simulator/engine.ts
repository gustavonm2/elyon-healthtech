import type {
    ScenarioConfig,
    DailyMetrics,
    StressBottleneck,
    SimulationReport,
} from '../../types/simulator';

/**
 * Box-Muller Transform to generate standard normal random values (mean=0, stdDev=1)
 */
function gaussianRandom(mean = 0, stdDev = 1): number {
    const u1 = Math.max(Number.EPSILON, Math.random());
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
}

export class ElyonStressSimulator {
    private config: ScenarioConfig;

    constructor(config: ScenarioConfig) {
        this.config = config;
    }

    public run(): SimulationReport {
        const startTime = performance.now();
        const {
            scenarioId = this.config.id,
            simulationDays,
            patientArrivalRatePerDay,
            availableDoctors,
            avgConsultationMinutes,
            doctorHourlyCost,
            revenuePerResolvedJourney,
            lizAutomationRate,
            operatorPaymentDelayDays,
            initialCashReserve,
        } = this.config;

        const metricsHistory: DailyMetrics[] = [];
        const bottlenecks: StressBottleneck[] = [];

        let currentCashBalance = initialCashReserve;
        let patientsInQueue = 0;
        let didSystemCollapse = false;
        let collapseReason: string | null = null;
        let survivalDays = simulationDays;

        // Track receivables timeline: dayIndex -> revenue generated on that day
        const pendingReceivablesQueue: number[] = new Array(simulationDays + 1).fill(0);
        let totalPendingReceivables = 0;

        // Base capacity: 8 hours work per doctor per day
        const baseDailyDoctorCapacity = Math.floor((availableDoctors * 8 * 60) / avgConsultationMinutes);

        // LIZ automation multiplier: LIZ improves throughput when efficiency is high (>= 0.3)
        const lizCapacityMultiplier = lizAutomationRate >= 0.3
            ? 1 + 0.4 * lizAutomationRate // up to +40% capacity boost with high LIZ AI
            : 0.8; // breakdown penalties

        const effectiveDailyCapacity = Math.floor(baseDailyDoctorCapacity * lizCapacityMultiplier);

        // Daily doctor labor costs + fixed operating overhead
        const dailyDoctorCost = availableDoctors * 8 * doctorHourlyCost;
        const dailyFixedOverhead = 4500 + availableDoctors * 250;
        const dailyBurnRate = dailyDoctorCost + dailyFixedOverhead;

        for (let day = 1; day <= simulationDays; day++) {
            // 1. Calculate patient arrival with Poisson/Gaussian variance
            // Hypergrowth scenario handling if patient arrival increases over time
            let currentTargetArrival = patientArrivalRatePerDay;
            if (this.config.id === 'HYPERGROWTH_SCALE') {
                // 30% monthly compounding growth
                const monthFraction = (day - 1) / 30;
                currentTargetArrival = Math.round(patientArrivalRatePerDay * Math.pow(1.3, monthFraction));
            }

            const dailyVariance = Math.sqrt(currentTargetArrival) * 1.2;
            const arrivalsToday = Math.max(
                0,
                Math.round(gaussianRandom(currentTargetArrival, dailyVariance))
            );

            patientsInQueue += arrivalsToday;

            // 2. Process capacity & consultations
            const completedToday = Math.min(patientsInQueue, effectiveDailyCapacity);
            patientsInQueue -= completedToday;

            // 3. Process patient dropouts / cancellations due to SLA delays
            let canceledToday = 0;
            const maxTolerableQueue = availableDoctors * 10;
            if (patientsInQueue > maxTolerableQueue) {
                const overflowRatio = patientsInQueue / maxTolerableQueue;
                // Exponential cancellation rate when queue overflows capacity
                const cancellationFactor = Math.min(0.35, 0.05 * Math.pow(overflowRatio, 1.4));
                canceledToday = Math.min(patientsInQueue, Math.floor(patientsInQueue * cancellationFactor));
                patientsInQueue -= canceledToday;
            }

            // 4. Calculate SLA breach rate (0% to 100%)
            const idealQueueLimit = Math.max(1, availableDoctors * 4);
            const slaBreachRate = Math.min(
                100,
                Math.max(0, Math.round((patientsInQueue / idealQueueLimit) * 100))
            );

            // 5. Financial calculations & Operator payment delay
            const revenueGeneratedToday = completedToday * revenuePerResolvedJourney;
            pendingReceivablesQueue[day] = revenueGeneratedToday;
            totalPendingReceivables += revenueGeneratedToday;

            // Collect payment if payment delay has passed
            const collectionDay = day - operatorPaymentDelayDays;
            let cashCollectedToday = 0;
            if (collectionDay > 0) {
                cashCollectedToday = pendingReceivablesQueue[collectionDay] || 0;
                totalPendingReceivables -= cashCollectedToday;
            }

            // Update cash balance with collections and burn rate
            currentCashBalance += cashCollectedToday - dailyBurnRate;

            // 6. LIZ AI Alerts
            const lizAlertsGenerated = Math.floor(
                arrivalsToday * (1 - lizAutomationRate) * 0.7 + patientsInQueue * 0.15
            );

            // 7. Record Daily Metrics
            metricsHistory.push({
                day,
                patientsInQueue,
                completedJourneys: completedToday,
                canceledJourneys: canceledToday,
                cashBalance: Math.round(currentCashBalance),
                pendingReceivables: Math.round(totalPendingReceivables),
                burnRate: Math.round(dailyBurnRate),
                lizAlertsGenerated,
                slaBreachRate,
                medicalCapacity: effectiveDailyCapacity,
            });

            // 8. Evaluate Stress Bottlenecks & Chaos Failure Modes

            // A) LIZ AI Coordination Breakdown
            if (lizAutomationRate < 0.3) {
                const existingBreakdown = bottlenecks.find(b => b.type === 'LIZ_COORDINATION_BREAKDOWN');
                if (!existingBreakdown) {
                    bottlenecks.push({
                        day,
                        type: 'LIZ_COORDINATION_BREAKDOWN',
                        severity: 'CRITICAL',
                        title: 'Falha Grave na Orquestração LIZ AI',
                        description: `A taxa de automação da LIZ caiu para ${(lizAutomationRate * 100).toFixed(0)}%. Gargalos na triagem e agendamento automático sobrecarregaram a equipe humana.`,
                        impactMetric: `Queda de 40% na eficiência operacional`,
                        recommendedAction: 'Restabelecer serviço de microserviços da LIZ AI ou acionar triagem contingencial.',
                    });
                }
            }

            // B) Clinical Saturation
            const saturationLimit = availableDoctors * 15;
            if (patientsInQueue > saturationLimit) {
                const existingSat = bottlenecks.find(b => b.type === 'CLINICAL_SATURATION' && b.day === day);
                if (!existingSat) {
                    bottlenecks.push({
                        day,
                        type: 'CLINICAL_SATURATION',
                        severity: 'CRITICAL',
                        title: 'Saturação Clínica Crítica',
                        description: `Fila de espera acumulou ${patientsInQueue} pacientes, superando em 15x a capacidade diária médica.`,
                        impactMetric: `${canceledToday} cancelamentos registrados no dia`,
                        recommendedAction: 'Redirecionar demanda para telemedicina de plantão ou expandir escala de médicos.',
                    });
                }
            }

            // C) SLA Violation
            if (slaBreachRate > 60) {
                const existingSla = bottlenecks.find(b => b.type === 'SLA_VIOLATION' && Math.abs(b.day - day) < 5);
                if (!existingSla) {
                    bottlenecks.push({
                        day,
                        type: 'SLA_VIOLATION',
                        severity: slaBreachRate > 85 ? 'CRITICAL' : 'WARNING',
                        title: 'Violação Massiva de SLA Operacional',
                        description: `Taxa de violação de SLA atingiu ${slaBreachRate}%. Tempo médio de espera excedeu limites regulatórios.`,
                        impactMetric: `SLA Breach: ${slaBreachRate}%`,
                        recommendedAction: 'Otimizar fluxo de atendimento e acionar fila de prioridade emergencial.',
                    });
                }
            }

            // D) Financial Insolvency (FATAL Collapse)
            if (currentCashBalance < 0) {
                didSystemCollapse = true;
                collapseReason = `Insolvência Financeira: Reserva de caixa esgotada no Dia ${day}. Retenção de pagamentos das operadoras (${operatorPaymentDelayDays} dias de atraso).`;
                survivalDays = day;

                bottlenecks.push({
                    day,
                    type: 'FINANCIAL_INSOLVENCY',
                    severity: 'FATAL',
                    title: 'COLAPSO FINANCEIRO - INSOLVÊNCIA DE CAIXA',
                    description: `O saldo de caixa ficou negativo (R$ ${currentCashBalance.toLocaleString('pt-BR')}). Incapacidade de honrar a folha de médicos e custos operacionais.`,
                    impactMetric: `Caixa: R$ ${currentCashBalance.toLocaleString('pt-BR')}`,
                    recommendedAction: 'Garantir linha de crédito emergencial de capital de giro ou negociar antecipação de recebíveis.',
                });

                break; // Stop simulation on system collapse
            }
        }

        // Calculate Overall Health Score (0 - 100)
        let healthScore = 100;
        const survivalRatio = survivalDays / simulationDays;

        if (didSystemCollapse) {
            healthScore = Math.round(survivalRatio * 45); // Penalty for collapse
        } else {
            // Deduction factors based on bottlenecks and SLA
            const avgSlaBreach = metricsHistory.reduce((acc, m) => acc + m.slaBreachRate, 0) / metricsHistory.length;
            const fatalCount = bottlenecks.filter(b => b.severity === 'FATAL').length;
            const criticalCount = bottlenecks.filter(b => b.severity === 'CRITICAL').length;
            const warningCount = bottlenecks.filter(b => b.severity === 'WARNING').length;

            healthScore -= fatalCount * 40;
            healthScore -= criticalCount * 12;
            healthScore -= warningCount * 5;
            healthScore -= (avgSlaBreach * 0.3);

            // Final cash margin bonus/penalty
            if (currentCashBalance < initialCashReserve * 0.5) {
                healthScore -= 10;
            }
        }

        const overallHealthScore = Math.max(0, Math.min(100, Math.round(healthScore)));
        const endTime = performance.now();

        return {
            scenarioId,
            executionTimeMs: Math.round(endTime - startTime),
            survivalDays,
            didSystemCollapse,
            collapseReason,
            metricsHistory,
            bottlenecks,
            overallHealthScore,
        };
    }
}
