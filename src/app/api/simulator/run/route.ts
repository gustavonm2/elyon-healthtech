import { z } from 'zod';
import { ScenarioConfigSchema } from '../../../../types/simulator';
import { ElyonStressSimulator } from '../../../../lib/simulator/engine';
import { getScenarioById } from '../../../../lib/simulator/scenarios';

const RequestPayloadSchema = z.object({
    scenarioId: z.string().optional(),
    customConfig: ScenarioConfigSchema.partial().optional(),
});

export async function handleSimulationRunRequest(body: unknown) {
    try {
        const parsed = RequestPayloadSchema.parse(body);

        let config = parsed.scenarioId ? getScenarioById(parsed.scenarioId) : getScenarioById('EPIDEMIC_SURGE');

        if (parsed.customConfig) {
            config = {
                ...config,
                ...parsed.customConfig,
            };
        }

        // Validate final combined config
        const validConfig = ScenarioConfigSchema.parse(config);

        // Execute simulation
        const engine = new ElyonStressSimulator(validConfig);
        const report = engine.run();

        return {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: report,
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
                body: { error: 'Validação de parâmetros falhou', details: error.errors },
            };
        }

        return {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: { error: 'Erro interno ao executar o motor de simulação de estresse', details: String(error) },
        };
    }
}
