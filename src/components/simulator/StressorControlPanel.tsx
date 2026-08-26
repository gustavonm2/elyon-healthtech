import React, { useState } from 'react';
import { Sliders, Plus, DollarSign, Activity, Truck, Cpu, Info } from 'lucide-react';
import type { DynamicStressor, StressorCategory } from '../../types/simulatorExtensions';

interface StressorControlPanelProps {
    stressors: DynamicStressor[];
    onStressorChange: (id: string, val: number) => void;
    onAddStressor?: (newStressor: DynamicStressor) => void;
}

export const StressorControlPanel: React.FC<StressorControlPanelProps> = ({
    stressors,
    onStressorChange,
    onAddStressor,
}) => {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newId, setNewId] = useState('');
    const [newName, setNewName] = useState('');
    const [newCategory, setNewCategory] = useState<StressorCategory>('FINANCIAL');
    const [newMin, setNewMin] = useState(0);
    const [newMax, setNewMax] = useState(100);
    const [newVal, setNewVal] = useState(50);
    const [newUnit, setNewUnit] = useState('%');
    const [newDesc, setNewDesc] = useState('');

    const handleCreateStressor = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newId) return;

        const created: DynamicStressor = {
            id: newId.trim().replace(/\s+/g, '_'),
            name: newName.trim(),
            category: newCategory,
            min: Number(newMin),
            max: Number(newMax),
            currentValue: Number(newVal),
            step: 1,
            unit: newUnit.trim() || '%',
            description: newDesc.trim() || 'Estressor customizado inserido dinamicamente.',
        };

        if (onAddStressor) {
            onAddStressor(created);
        }

        setIsAddOpen(false);
        setNewId('');
        setNewName('');
        setNewDesc('');
    };

    const getCategoryBadge = (cat: StressorCategory) => {
        switch (cat) {
            case 'FINANCIAL':
                return (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <DollarSign className="w-2.5 h-2.5" /> Financeiro
                    </span>
                );
            case 'CLINICAL':
                return (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                        <Activity className="w-2.5 h-2.5" /> Clínico
                    </span>
                );
            case 'LOGISTICS':
                return (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                        <Truck className="w-2.5 h-2.5" /> Logística
                    </span>
                );
            case 'AI_COORDINATION':
            default:
                return (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                        <Cpu className="w-2.5 h-2.5" /> LIZ AI
                    </span>
                );
        }
    };

    const formatValueDisplay = (stressor: DynamicStressor) => {
        const { unit, currentValue } = stressor;
        if (unit === 'R$') {
            return `R$ ${currentValue >= 1000 ? (currentValue / 1000).toFixed(0) + 'k' : currentValue}`;
        }
        if (unit === '%') {
            return `${stressor.id === 'lizAutomationRate' ? (currentValue * 100).toFixed(0) : currentValue}%`;
        }
        return `${currentValue} ${unit}`;
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-teal-400" />
                        Configurações de Simulação
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        Injeção dinâmica de estressores sem alteração de código.
                    </p>
                </div>

                <button
                    onClick={() => setIsAddOpen(!isAddOpen)}
                    className="p-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 transition"
                    title="Adicionar Estressor Dinâmico"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* Modal / Form to Inject Custom Stressor */}
            {isAddOpen && (
                <form onSubmit={handleCreateStressor} className="bg-slate-900/90 border border-teal-500/40 rounded-xl p-3 space-y-2 text-xs">
                    <span className="font-bold text-teal-300 block text-[11px] uppercase tracking-wider">
                        + Injetar Novo Estressor Dinâmico
                    </span>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="text"
                            placeholder="ID (ex: taxaGlosas)"
                            value={newId}
                            onChange={(e) => setNewId(e.target.value)}
                            required
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                        />
                        <input
                            type="text"
                            placeholder="Nome (ex: Glosas Operadoras)"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            required
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <select
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value as StressorCategory)}
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                        >
                            <option value="FINANCIAL">Financeiro</option>
                            <option value="CLINICAL">Clínico</option>
                            <option value="LOGISTICS">Logística</option>
                            <option value="AI_COORDINATION">LIZ AI</option>
                        </select>
                        <input
                            type="number"
                            placeholder="Mínimo"
                            value={newMin}
                            onChange={(e) => setNewMin(Number(e.target.value))}
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                        />
                        <input
                            type="number"
                            placeholder="Máximo"
                            value={newMax}
                            onChange={(e) => setNewMax(Number(e.target.value))}
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                        />
                    </div>

                    <input
                        type="text"
                        placeholder="Descrição técnica..."
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                    />

                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => setIsAddOpen(false)}
                            className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded hover:bg-slate-700"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-3 py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded"
                        >
                            Injetar Estressor
                        </button>
                    </div>
                </form>
            )}

            {/* Dynamic Slider Blocks List */}
            <div className="space-y-4">
                {stressors.map((stressor) => (
                    <div key={stressor.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-1.5 transition hover:border-slate-700">
                        {/* Top info */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                {getCategoryBadge(stressor.category)}
                                <span className="text-xs font-semibold text-slate-200">{stressor.name}</span>
                            </div>
                            <span className="text-xs font-bold text-teal-400 font-mono">
                                {formatValueDisplay(stressor)}
                            </span>
                        </div>

                        {/* Slider input */}
                        <input
                            type="range"
                            min={stressor.min}
                            max={stressor.max}
                            step={stressor.step}
                            value={stressor.currentValue}
                            onChange={(e) => onStressorChange(stressor.id, Number(e.target.value))}
                            className="w-full accent-teal-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
                        />

                        {/* Helper Description */}
                        <p className="text-[10px] text-slate-400 leading-tight">
                            {stressor.description}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StressorControlPanel;
