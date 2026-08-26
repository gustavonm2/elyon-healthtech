export interface LizPlaybookImpacts {
    targetVariable: string;
    multiplier: number;
    costPerDay: number;
    queueReductionPct?: number;
    glosaReductionPct?: number;
    healthScoreBoost?: number;
}

export interface LizPlaybook {
    id: string;
    name: string;
    description: string;
    category: 'LOGISTICS' | 'FINANCIAL' | 'CLINICAL' | 'AI_OPTIMIZATION';
    impacts: LizPlaybookImpacts;
    isActive: boolean;
}

export interface LizPostMortemReport {
    baselineSurvivalDays: number;
    activeSurvivalDays: number;
    extendedDays: number;
    baselineCollapsed: boolean;
    baselineCollapseDay: number | null;
    activeCollapsed: boolean;
    activeCollapseDay: number | null;
    totalContingencyCost: number;
    totalGlosaSaved: number;
    totalPatientsRedirected: number;
    recommendationSummary: string;
}

export const INITIAL_LIZ_PLAYBOOKS: LizPlaybook[] = [
    {
        id: 'transbordoEmergencial',
        name: 'Transbordo Emergencial',
        description: 'Reduz a Fila de Espera em 40% redirecionando demanda excedente para a rede credenciada de retaguarda. Aumenta o custo médico em 25%.',
        category: 'LOGISTICS',
        impacts: {
            targetVariable: 'pacientesPorDia',
            multiplier: 0.6,
            costPerDay: 800,
            queueReductionPct: 0.4,
        },
        isActive: false,
    },
    {
        id: 'auditoriaAtivaLIZ',
        name: 'Auditoria Ativa LIZ AI',
        description: 'Automação de auditoria preventiva de contas médicas em tempo real. Reduz a Taxa de Glosas B2B das operadoras em 80%.',
        category: 'FINANCIAL',
        impacts: {
            targetVariable: 'taxaGlosasB2B',
            multiplier: 0.2,
            costPerDay: 500,
            glosaReductionPct: 0.8,
        },
        isActive: false,
    },
    {
        id: 'protocoloRetencaoCronicos',
        name: 'Protocolo de Retenção de Crônicos',
        description: 'Linha de cuidado contínuo que estabiliza casos de alto risco. Aumenta o Health Score Geral do sistema em +20 pontos.',
        category: 'CLINICAL',
        impacts: {
            targetVariable: 'healthScore',
            multiplier: 1.2,
            costPerDay: 350,
            healthScoreBoost: 20,
        },
        isActive: false,
    },
    {
        id: 'antecipacaoRecebiveis',
        name: 'Antecipação Automática de Recebíveis',
        description: 'Acelera o fluxo de caixa reduzindo pela metade o tempo de espera dos repasses das operadoras de saúde.',
        category: 'FINANCIAL',
        impacts: {
            targetVariable: 'diasPagamento',
            multiplier: 0.5,
            costPerDay: 400,
        },
        isActive: false,
    },
];
