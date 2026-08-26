export type StressorCategory = 'FINANCIAL' | 'CLINICAL' | 'LOGISTICS' | 'AI_COORDINATION';

export interface DynamicStressor {
    id: string;
    name: string;
    category: StressorCategory;
    min: number;
    max: number;
    currentValue: number;
    step: number;
    unit: string;
    description: string;
}

export const INITIAL_DYNAMIC_STRESSORS: DynamicStressor[] = [
    {
        id: 'quantidadeMedicos',
        name: 'Médicos Disponíveis',
        category: 'CLINICAL',
        min: 1,
        max: 50,
        currentValue: 10,
        step: 1,
        unit: 'médicos',
        description: 'Tamanho da equipe médica em escala ativa de pronto-atendimento.',
    },
    {
        id: 'pacientesPorDia',
        name: 'Demanda de Pacientes',
        category: 'CLINICAL',
        min: 20,
        max: 800,
        currentValue: 120,
        step: 10,
        unit: '/dia',
        description: 'Fluxo diário esperado de entrada de novos pacientes na fila.',
    },
    {
        id: 'capitalInicial',
        name: 'Capital Inicial de Caixa',
        category: 'FINANCIAL',
        min: 50000,
        max: 3000000,
        currentValue: 500000,
        step: 50000,
        unit: 'R$',
        description: 'Reserva financeira inicial para cobrir folha de pagamento e custos.',
    },
    {
        id: 'receitaPorJornada',
        name: 'Receita Por Jornada Concluída',
        category: 'FINANCIAL',
        min: 100,
        max: 1000,
        currentValue: 350,
        step: 25,
        unit: 'R$',
        description: 'Ticket médio faturado por consulta ou jornada resolvida.',
    },
    {
        id: 'diasPagamento',
        name: 'Atraso Repasse Operadoras',
        category: 'FINANCIAL',
        min: 0,
        max: 120,
        currentValue: 30,
        step: 5,
        unit: 'dias',
        description: 'Tempo médio em dias para que as operadoras liberem o repasse.',
    },
    {
        id: 'taxaGlosasB2B',
        name: 'Taxa de Glosa das Operadoras',
        category: 'FINANCIAL',
        min: 0,
        max: 50,
        currentValue: 5,
        step: 1,
        unit: '%',
        description: 'Percentual de faturamento recusado ou retido por auditoria das operadoras.',
    },
    {
        id: 'tempoEsperaExames',
        name: 'Tempo de Espera de Exames',
        category: 'LOGISTICS',
        min: 1,
        max: 30,
        currentValue: 3,
        step: 1,
        unit: 'dias',
        description: 'Tempo que laboratórios parceiros levam para devolver laudos ao sistema.',
    },
    {
        id: 'lizAutomationRate',
        name: 'Automação LIZ AI',
        category: 'AI_COORDINATION',
        min: 0,
        max: 1,
        currentValue: 0.85,
        step: 0.05,
        unit: '%',
        description: 'Eficiência do orquestrador LIZ AI na pré-triagem e encaminhamento.',
    },
    {
        id: 'doctorHourlyCost',
        name: 'Custo Hora Médico',
        category: 'FINANCIAL',
        min: 50,
        max: 400,
        currentValue: 150,
        step: 10,
        unit: 'R$/h',
        description: 'Custo unitário hora da folha médica contratada.',
    },
];
