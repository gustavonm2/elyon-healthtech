import type { ScenarioConfig } from '../../types/simulator';

export const PRESET_SCENARIOS: Record<string, ScenarioConfig> = {
    EPIDEMIC_SURGE: {
        id: 'EPIDEMIC_SURGE',
        name: 'Surto Epidêmico Massivo (Surge x4)',
        description: 'Multiplica por 4 a demanda diária de pacientes mantendo a equipe médica atual. Testa a capacidade limite do pronto-atendimento e resiliência das filas de espera.',
        simulationDays: 90,
        patientArrivalRatePerDay: 400, // 4x normal (100 -> 400)
        availableDoctors: 12,
        avgConsultationMinutes: 25,
        doctorHourlyCost: 160,
        revenuePerResolvedJourney: 380,
        lizAutomationRate: 0.90, // LIZ fully active
        operatorPaymentDelayDays: 30,
        initialCashReserve: 800000,
    },
    INSURTECH_PAYMENT_FREEZE: {
        id: 'INSURTECH_PAYMENT_FREEZE',
        name: 'Bloqueio de Pagamentos das Operadoras (90 dias)',
        description: 'Fluxo normal de pacientes, porém com retenção prolongada de repasses das operadoras de saúde por 90 dias. Avalia o estresse no capital de giro e risco de insolvency.',
        simulationDays: 120,
        patientArrivalRatePerDay: 110,
        availableDoctors: 10,
        avgConsultationMinutes: 30,
        doctorHourlyCost: 150,
        revenuePerResolvedJourney: 350,
        lizAutomationRate: 0.85,
        operatorPaymentDelayDays: 90, // Stress test working capital delay
        initialCashReserve: 500000,
    },
    LIZ_BLACKOUT: {
        id: 'LIZ_BLACKOUT',
        name: 'Apagão na Inteligência LIZ AI (Automação 10%)',
        description: 'Simula a indisponibilidade ou falha nos modelos de IA da LIZ, reduzindo a automação para 10%. Mede o impacto direto na sobrecarga operacional humana.',
        simulationDays: 60,
        patientArrivalRatePerDay: 120,
        availableDoctors: 10,
        avgConsultationMinutes: 30,
        doctorHourlyCost: 150,
        revenuePerResolvedJourney: 350,
        lizAutomationRate: 0.10, // LIZ Failure / Blackout
        operatorPaymentDelayDays: 30,
        initialCashReserve: 600000,
    },
    HYPERGROWTH_SCALE: {
        id: 'HYPERGROWTH_SCALE',
        name: 'Escalabilidade em Hipercrescimento (+30%/mês)',
        description: 'Crescimento exponencial de 30% ao mês no volume de pacientes com atraso na contratação de novos médicos. Simula os gargalos do dimensionamento acelerado.',
        simulationDays: 180,
        patientArrivalRatePerDay: 100, // Starts at 100, grows 30% monthly
        availableDoctors: 14,
        avgConsultationMinutes: 28,
        doctorHourlyCost: 175,
        revenuePerResolvedJourney: 400,
        lizAutomationRate: 0.88,
        operatorPaymentDelayDays: 45,
        initialCashReserve: 1000000,
    },
};

export const PRESET_SCENARIOS_LIST: ScenarioConfig[] = Object.values(PRESET_SCENARIOS);

export function getScenarioById(id: string): ScenarioConfig {
    return PRESET_SCENARIOS[id] || PRESET_SCENARIOS.EPIDEMIC_SURGE;
}
