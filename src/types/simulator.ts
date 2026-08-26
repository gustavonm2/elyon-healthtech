import { z } from 'zod';

// ─── 1. ScenarioConfig ────────────────────────────────────────────────────────
export const ScenarioConfigSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    simulationDays: z.number().min(1).max(1000).default(30),
    patientArrivalRatePerDay: z.number().min(0).default(100),
    availableDoctors: z.number().min(1).default(10),
    avgConsultationMinutes: z.number().min(5).max(180).default(30),
    doctorHourlyCost: z.number().min(0).default(150),
    revenuePerResolvedJourney: z.number().min(0).default(350),
    lizAutomationRate: z.number().min(0).max(1).default(0.85), // 0 to 1
    operatorPaymentDelayDays: z.number().min(0).default(30),
    initialCashReserve: z.number().min(0).default(500000),
});

export type ScenarioConfig = z.infer<typeof ScenarioConfigSchema>;

// ─── 2. DailyMetrics ──────────────────────────────────────────────────────────
export const DailyMetricsSchema = z.object({
    day: z.number(),
    patientsInQueue: z.number(),
    completedJourneys: z.number(),
    canceledJourneys: z.number(),
    cashBalance: z.number(),
    pendingReceivables: z.number(),
    burnRate: z.number(),
    lizAlertsGenerated: z.number(),
    slaBreachRate: z.number().min(0).max(100),
    medicalCapacity: z.number().default(0),
});

export type DailyMetrics = z.infer<typeof DailyMetricsSchema>;

// ─── 3. StressBottleneck ──────────────────────────────────────────────────────
export const StressBottleneckTypeSchema = z.enum([
    'CLINICAL_SATURATION',
    'FINANCIAL_INSOLVENCY',
    'LIZ_COORDINATION_BREAKDOWN',
    'SLA_VIOLATION',
]);

export const StressSeveritySchema = z.enum(['WARNING', 'CRITICAL', 'FATAL']);

export const StressBottleneckSchema = z.object({
    day: z.number(),
    type: StressBottleneckTypeSchema,
    severity: StressSeveritySchema,
    title: z.string(),
    description: z.string(),
    impactMetric: z.string(),
    recommendedAction: z.string(),
});

export type StressBottleneckType = z.infer<typeof StressBottleneckTypeSchema>;
export type StressSeverity = z.infer<typeof StressSeveritySchema>;
export type StressBottleneck = z.infer<typeof StressBottleneckSchema>;

// ─── 4. SimulationReport ──────────────────────────────────────────────────────
export const SimulationReportSchema = z.object({
    scenarioId: z.string(),
    executionTimeMs: z.number(),
    survivalDays: z.number(),
    didSystemCollapse: z.boolean(),
    collapseReason: z.string().nullable(),
    metricsHistory: z.array(DailyMetricsSchema),
    bottlenecks: z.array(StressBottleneckSchema),
    overallHealthScore: z.number().min(0).max(100),
});

export type SimulationReport = z.infer<typeof SimulationReportSchema>;
