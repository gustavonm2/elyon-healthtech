import type { ScenarioConfig, SimulationReport } from '../types/simulator';
import { ElyonStressSimulator } from '../lib/simulator/engine';
import { handleSimulationRunRequest } from '../app/api/simulator/run/route';

export async function runSimulation(
    config: ScenarioConfig,
    onProgress?: (progressPercent: number) => void
): Promise<SimulationReport> {
    if (onProgress) {
        // Simulate real-time progress steps for UI Telemetry Dashboard
        const totalSteps = 10;
        for (let i = 1; i <= totalSteps; i++) {
            await new Promise((res) => setTimeout(res, 40));
            onProgress(Math.round((i / totalSteps) * 100));
        }
    }

    const response = await handleSimulationRunRequest({
        scenarioId: config.id,
        customConfig: config,
    });

    if (response.status !== 200) {
        throw new Error('Falha ao processar simulação de estresse');
    }

    return response.body as SimulationReport;
}
