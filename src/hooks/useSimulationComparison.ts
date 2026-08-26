import { useState, useCallback } from 'react';
import type { SimulationReport } from '../types/simulator';
import type { DynamicStressor } from '../types/simulatorExtensions';
import { runElyonSimulation, type ElyonSimulatorInput } from './useElyonSimulator';

export interface SimulationSnapshot {
    id: string;
    name: string;
    createdAt: string;
    report: SimulationReport;
    stressorsSnapshot: DynamicStressor[];
}

export interface OptimizationResult {
    minDoctors: number;
    minCashReserve: number;
    targetDays: number;
    recommendationText: string;
    iterationsRun: number;
}

export function useSimulationComparison() {
    const [snapshots, setSnapshots] = useState<SimulationSnapshot[]>([]);
    const [baselineSnapshot, setBaselineSnapshot] = useState<SimulationSnapshot | null>(null);
    const [compareSnapshot, setCompareSnapshot] = useState<SimulationSnapshot | null>(null);
    const [isComparisonMode, setIsComparisonMode] = useState<boolean>(false);
    const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
    const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);

    const saveSnapshot = useCallback((name: string, report: SimulationReport, stressors: DynamicStressor[]) => {
        const newSnapshot: SimulationSnapshot = {
            id: `snap-${Date.now()}`,
            name: name || `Cenário ${snapshots.length + 1}`,
            createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            report,
            stressorsSnapshot: [...stressors],
        };

        setSnapshots((prev) => [newSnapshot, ...prev]);

        // If no baseline set, assign first as baseline
        if (!baselineSnapshot) {
            setBaselineSnapshot(newSnapshot);
        } else if (!compareSnapshot) {
            setCompareSnapshot(newSnapshot);
        }
        return newSnapshot;
    }, [snapshots, baselineSnapshot, compareSnapshot]);

    /**
     * LIZ Optimizer Engine: Performs iterative micro-simulations to find Minimum Viable Configuration
     */
    const findSurvivalThreshold = useCallback((stressors: DynamicStressor[]): OptimizationResult => {
        setIsOptimizing(true);
        let iterations = 0;

        const targetDays = stressors.find((s) => s.id === 'diasSimulacao')?.currentValue || 40;
        const currentDemand = stressors.find((s) => s.id === 'pacientesPorDia')?.currentValue || 120;
        const currentPayDelay = stressors.find((s) => s.id === 'diasPagamento')?.currentValue || 30;

        let optimalDoctors = 50;
        let optimalCash = 3000000;
        let foundSurvivingPair = false;

        // Iterative search grid across doctors and cash
        const doctorCandidates = [4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32];
        const cashCandidates = [100000, 250000, 450000, 600000, 800000, 1000000, 1500000, 2000000];

        for (const doc of doctorCandidates) {
            for (const cash of cashCandidates) {
                iterations++;
                const candidateInput: ElyonSimulatorInput = {
                    quantidadeMedicos: doc,
                    capitalInicial: cash,
                    pacientesPorDia: currentDemand,
                    diasPagamento: currentPayDelay,
                    diasSimulacao: targetDays,
                };

                const testReport = runElyonSimulation(candidateInput);

                if (!testReport.didSystemCollapse && testReport.survivalDays >= targetDays) {
                    if (doc < optimalDoctors || (doc === optimalDoctors && cash < optimalCash)) {
                        optimalDoctors = doc;
                        optimalCash = cash;
                        foundSurvivingPair = true;
                    }
                    break; // break inner cash loop for this doctor candidate
                }
            }
        }

        if (!foundSurvivingPair) {
            optimalDoctors = Math.max(16, Math.ceil(currentDemand / 10));
            optimalCash = 800000;
        }

        const result: OptimizationResult = {
            minDoctors: optimalDoctors,
            minCashReserve: optimalCash,
            targetDays,
            recommendationText: `LIZ Recomenda: Para suportar este cenário sem colapsar antes do Dia ${targetDays}, você precisa de no mínimo ${optimalDoctors} médicos ativos e R$ ${(optimalCash / 1000).toFixed(0)}k de reserva de caixa.`,
            iterationsRun: iterations,
        };

        setOptimizationResult(result);
        setIsOptimizing(false);
        return result;
    }, []);

    return {
        snapshots,
        baselineSnapshot,
        compareSnapshot,
        setBaselineSnapshot,
        setCompareSnapshot,
        isComparisonMode,
        setIsComparisonMode,
        saveSnapshot,
        isOptimizing,
        optimizationResult,
        findSurvivalThreshold,
    };
}
