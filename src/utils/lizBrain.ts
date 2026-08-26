export interface LizBrainQueryResult {
    knowledgeFound: boolean;
    responseText: string;
    logHeader: string;
    matchedCategory?: string;
}

export const ELYON_KNOWLEDGE_BASE = [
    {
        keywords: ['precisão', 'simulador', 'modelo', 'algoritmo', 'des', 'probabilística'],
        category: 'SIMULADOR_ESTRESSE',
        fact: 'O simulador de estresse ELYON alcançou 90% de precisão probabilística em testes reais utilizando Discrete Event Simulation (DES) e distribuições de Poisson/Gaussiana.',
    },
    {
        keywords: ['elos', 'cuidado', 'coordenação', 'jornada', 'liz', 'ia'],
        category: 'LIZ_COORDINATION',
        fact: 'A IA LIZ coordena ativamente 12 elos de cuidado ao longo da jornada médica do paciente, desde a triagem inicial até a alta médica.',
    },
    {
        keywords: ['breakeven', 'equilíbrio', 'ponto de equilíbrio', 'financeiro', 'dias', 'caixa'],
        category: 'FINANCEIRO',
        fact: 'O breakeven financeiro do sistema em cenários de estresse de epidemia ocorre em média no Dia 45, desde que a taxa de glosa não ultrapasse 15%.',
    },
    {
        keywords: ['glosa', 'operadoras', 'auditoria', 'b2b', 'faturas', 'contas'],
        category: 'AUDITORIA_GLOSAS',
        fact: 'A auditoria ativa em tempo real realizada pela LIZ AI reduz a taxa de glosas B2B das operadoras de saúde em até 80%.',
    },
    {
        keywords: ['transbordo', 'fila', 'leitos', 'rede', 'emergencial', 'retaguarda'],
        category: 'LOGÍSTICA_TRANSBORDO',
        fact: 'O playbook de transbordo emergencial LIZ redireciona até 40% da fila de espera para a rede de retaguarda credenciada, evitando o colapso por superlotação.',
    },
];

/**
 * Simulates Neural Link Retrieval from ELYON Knowledge Base
 */
export function queryLizBrain(promptText: string): LizBrainQueryResult {
    const textLower = promptText.toLowerCase();

    const matched = ELYON_KNOWLEDGE_BASE.find((item) =>
        item.keywords.some((kw) => textLower.includes(kw))
    );

    if (matched) {
        return {
            knowledgeFound: true,
            responseText: `${matched.fact}`,
            logHeader: `> [Neural Link] Acessando links neurais do ELYON OS... Conexão estabelecida com a base factual [${matched.category}].`,
            matchedCategory: matched.category,
        };
    }

    return {
        knowledgeFound: false,
        responseText: `Processando solicitação: "${promptText}". Acessando barramento neural do ELYON OS.`,
        logHeader: `> [Neural Link] Acessando memória neural estendida do ELYON OS.`,
    };
}
