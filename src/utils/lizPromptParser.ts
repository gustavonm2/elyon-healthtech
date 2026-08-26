import type { DynamicStressor } from '../types/simulatorExtensions';

export interface ParsedScenarioResult {
    updatedStressors: DynamicStressor[];
    lizReasoning: string;
    extractedKeywords: string[];
    detectedSeverity: 'MODERATE' | 'HIGH' | 'CRITICAL';
}

/**
 * Natural Language Ingestion Engine for ELYON Stress Simulator
 * Parses narrative text and translates real-world operational context into stressor values
 */
export function parseScenarioPrompt(
    promptText: string,
    currentStressors: DynamicStressor[]
): ParsedScenarioResult {
    const textLower = promptText.toLowerCase();
    const extractedKeywords: string[] = [];
    let detectedSeverity: 'MODERATE' | 'HIGH' | 'CRITICAL' = 'MODERATE';
    const explanations: string[] = [];

    // Clone current stressors array to mutate values
    const updated = currentStressors.map((s) => ({ ...s }));

    // Helper finder
    const getStressor = (id: string) => updated.find((s) => s.id === id);

    // 1. Epidemic / Demand Spikes
    if (/surto|dengue|epidemia|pandemia|vírus|gripe|arbovirose|hiperinfluxo|lotação/i.test(textLower)) {
        extractedKeywords.push('Surto Epidêmico / Hiper-Demanda');
        const demand = getStressor('pacientesPorDia');
        if (demand) {
            demand.currentValue = Math.min(demand.max, Math.round(demand.currentValue * 2.8));
            explanations.push(`Aumentei o afluxo de pacientes para ${demand.currentValue} pac/dia devido ao surto identificado.`);
        }
        detectedSeverity = 'HIGH';
    }

    // 2. Financial Delay / Operator Glosas
    if (/atraso|bloqueio|calote|glosa|operadora|retenção|repasse|inadimplência/i.test(textLower)) {
        extractedKeywords.push('Retenção Operadoras & Glosas');
        const paymentDays = getStressor('diasPagamento');
        if (paymentDays) {
            paymentDays.currentValue = /60|sessenta/i.test(textLower) ? 60 : /90|noventa/i.test(textLower) ? 90 : 65;
            explanations.push(`Ajustei o prazo de repasse das operadoras para ${paymentDays.currentValue} dias.`);
        }

        const glosas = getStressor('taxaGlosasB2B');
        if (glosas) {
            glosas.currentValue = 18;
            explanations.push(`Elevei a Taxa de Glosas B2B para ${glosas.currentValue}%.`);
        }
        detectedSeverity = 'CRITICAL';
    }

    // 3. Doctor Absenteeism / Staff Shortage
    if (/falta|greve|absenteísmo|férias|demissão|escassez|médicos|redução de equipe/i.test(textLower)) {
        extractedKeywords.push('Déficit de Equipe Médica');
        const doctors = getStressor('quantidadeMedicos');
        if (doctors) {
            doctors.currentValue = Math.max(doctors.min, Math.round(doctors.currentValue * 0.5));
            explanations.push(`Reduzi o corpo médico para ${doctors.currentValue} médicos em escala.`);
        }
        detectedSeverity = 'HIGH';
    }

    // 4. LIZ AI Offline / System Breakdown
    if (/off|offline|fora do ar|queda|instabilidade|falha|bug|colapso da ia/i.test(textLower)) {
        extractedKeywords.push('Desconexão / Falha LIZ AI');
        const lizRate = getStressor('lizAutomationRate');
        if (lizRate) {
            lizRate.currentValue = 0.20;
            explanations.push(`Reduzi a automação LIZ AI para 20% devido à instabilidade reportada.`);
        }
        detectedSeverity = 'CRITICAL';
    }

    // 5. Exam / Lab Delays
    if (/exame|laudo|laboratório|demora|atraso de laudo/i.test(textLower)) {
        extractedKeywords.push('Gargalo de Laudos Exames');
        const examDelay = getStressor('tempoEsperaExames');
        if (examDelay) {
            examDelay.currentValue = 9;
            explanations.push(`Defini o tempo de espera de laudos para ${examDelay.currentValue} dias.`);
        }
    }

    // 6. Cash Reserves Reduction
    if (/corte|verba|prejuízo|caixa baixo|pouca reserva|crise financeira/i.test(textLower)) {
        extractedKeywords.push('Restrição de Capital Inicial');
        const cash = getStressor('capitalInicial');
        if (cash) {
            cash.currentValue = Math.max(cash.min, 150000);
            explanations.push(`Ajustei a reserva inicial de caixa para R$ 150k.`);
        }
    }

    // Fallback if no specific keyword matched
    if (extractedKeywords.length === 0) {
        extractedKeywords.push('Ajuste de Estresse Genérico');
        const demand = getStressor('pacientesPorDia');
        if (demand) demand.currentValue = Math.round(demand.currentValue * 1.5);
        explanations.push('Elevando estresse geral do sistema em +50% com base na narrativa fornecida.');
    }

    const reasoningSummary = `LIZ AI Interpretou: "${promptText.slice(0, 80)}${promptText.length > 80 ? '...' : ''}". Identifiquei [${extractedKeywords.join(', ')}]. ${explanations.join(' ')}`;

    return {
        updatedStressors: updated,
        lizReasoning: reasoningSummary,
        extractedKeywords,
        detectedSeverity,
    };
}
