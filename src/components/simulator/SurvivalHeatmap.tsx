import React, { useMemo, useState } from 'react';
import { Grid, ShieldCheck, Flame, AlertTriangle, Info } from 'lucide-react';
import { runElyonSimulation } from '../../hooks/useElyonSimulator';

interface HeatmapCell {
    doctors: number;
    demand: number;
    survivalDays: number;
    didCollapse: boolean;
    slaBreach: number;
    healthScore: number;
}

export const SurvivalHeatmap: React.FC<{
    currentDoctors: number;
    currentDemand: number;
    targetDays?: number;
}> = ({ currentDoctors, currentDemand, targetDays = 40 }) => {
    const doctorSteps = [4, 8, 12, 16, 20, 24, 30];
    const demandSteps = [50, 100, 200, 300, 400, 500, 600];

    const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);

    const gridData = useMemo(() => {
        const matrix: HeatmapCell[][] = [];

        for (const demand of demandSteps) {
            const row: HeatmapCell[] = [];
            for (const docs of doctorSteps) {
                const report = runElyonSimulation({
                    quantidadeMedicos: docs,
                    pacientesPorDia: demand,
                    diasSimulacao: targetDays,
                    capitalInicial: 500000,
                    diasPagamento: 30,
                });

                const maxSla = report.metricsHistory.length
                    ? Math.max(...report.metricsHistory.map((m) => m.slaBreachRate))
                    : 0;

                row.push({
                    doctors: docs,
                    demand,
                    survivalDays: report.survivalDays,
                    didCollapse: report.didSystemCollapse,
                    slaBreach: maxSla,
                    healthScore: report.overallHealthScore,
                });
            }
            matrix.push(row);
        }
        return matrix;
    }, [targetDays]);

    const getCellColor = (cell: HeatmapCell) => {
        const isCurrentCell = cell.doctors === currentDoctors && Math.abs(cell.demand - currentDemand) < 40;

        if (cell.didCollapse) {
            return `bg-rose-950/60 border-rose-600/70 text-rose-300 ${isCurrentCell ? 'ring-2 ring-white font-black' : ''}`;
        }
        if (cell.slaBreach > 50) {
            return `bg-amber-950/50 border-amber-600/60 text-amber-300 ${isCurrentCell ? 'ring-2 ring-white font-black' : ''}`;
        }
        return `bg-emerald-950/40 border-emerald-600/50 text-emerald-300 ${isCurrentCell ? 'ring-2 ring-white font-black' : ''}`;
    };

    return (
        <div className="bg-[#1E293B]/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                        <Grid className="w-4 h-4 text-teal-400" />
                        Matriz de Sobrevivência Operacional (Safety Zone Heatmap)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        Mapeamento bi-dimensional de estabilidade: Médicos (Eixo X) vs. Demanda de Pacientes (Eixo Y)
                    </p>
                </div>

                <div className="flex items-center gap-2 text-[10px] flex-wrap">
                    <span className="flex items-center gap-1 text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-600/40 font-bold">
                        <ShieldCheck className="w-3 h-3" /> Seguro
                    </span>
                    <span className="flex items-center gap-1 text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-600/40 font-bold">
                        <AlertTriangle className="w-3 h-3" /> Risco SLA
                    </span>
                    <span className="flex items-center gap-1 text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-600/40 font-bold">
                        <Flame className="w-3 h-3" /> Colapso
                    </span>
                </div>
            </div>

            {/* Heatmap Grid */}
            <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse">
                    <thead>
                        <tr>
                            <th className="text-[10px] font-bold text-slate-400 p-2 text-left uppercase">Demanda \ Médicos</th>
                            {doctorSteps.map((doc) => (
                                <th key={doc} className="text-[10px] font-extrabold text-teal-400 p-2 border-b border-slate-700">
                                    {doc} méd
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {gridData.map((row, rIdx) => (
                            <tr key={rIdx}>
                                <td className="text-[10px] font-extrabold text-slate-300 p-2 text-left border-r border-slate-700/60">
                                    {demandSteps[rIdx]} pac/dia
                                </td>
                                {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="p-1">
                                        <button
                                            onClick={() => setSelectedCell(cell)}
                                            className={`w-full h-10 rounded-lg border text-[10px] font-bold transition transform hover:scale-105 flex flex-col items-center justify-center ${getCellColor(cell)}`}
                                            title={`Médicos: ${cell.doctors} | Demanda: ${cell.demand} | Sobrevivência: ${cell.survivalDays}d`}
                                        >
                                            <span>{cell.survivalDays}d</span>
                                            <span className="text-[9px] opacity-80">{cell.didCollapse ? 'COLAPSO' : `${cell.healthScore} pts`}</span>
                                        </button>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Selected Cell Modal/Drawer */}
            {selectedCell && (
                <div className="bg-slate-900 border border-teal-500/40 p-3 rounded-xl flex items-center justify-between text-xs text-slate-200">
                    <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-teal-400" />
                        <div>
                            <span className="font-bold text-white">
                                Configuração Selecionada: {selectedCell.doctors} Médicos | {selectedCell.demand} Pacientes/Dia
                            </span>
                            <span className="block text-[11px] text-slate-400">
                                Sobrevivência: {selectedCell.survivalDays} dias | Max SLA Breach: {selectedCell.slaBreach}% | Health Score: {selectedCell.healthScore}/100
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => setSelectedCell(null)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded"
                    >
                        Fechar
                    </button>
                </div>
            )}
        </div>
    );
};

export default SurvivalHeatmap;
