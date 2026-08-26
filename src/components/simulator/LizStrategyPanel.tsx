import React from 'react';
import { ShieldCheck, Zap, DollarSign, Activity, Truck, Cpu, Power } from 'lucide-react';
import type { LizPlaybook } from '../../types/playbooks';

interface LizStrategyPanelProps {
    playbooks: LizPlaybook[];
    onTogglePlaybook: (id: string) => void;
}

export const LizStrategyPanel: React.FC<LizStrategyPanelProps> = ({
    playbooks,
    onTogglePlaybook,
}) => {
    const activeCount = playbooks.filter((p) => p.isActive).length;

    const getCategoryBadge = (cat: LizPlaybook['category']) => {
        switch (cat) {
            case 'FINANCIAL':
                return (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <DollarSign className="w-2.5 h-2.5" /> Financeiro
                    </span>
                );
            case 'LOGISTICS':
                return (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                        <Truck className="w-2.5 h-2.5" /> Logística
                    </span>
                );
            case 'CLINICAL':
                return (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                        <Activity className="w-2.5 h-2.5" /> Clínico
                    </span>
                );
            case 'AI_OPTIMIZATION':
            default:
                return (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                        <Cpu className="w-2.5 h-2.5" /> LIZ AI
                    </span>
                );
        }
    };

    return (
        <div className="bg-[#1E293B]/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
                <div>
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-teal-400 animate-pulse" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-white">
                            Centro de Comando LIZ - Ações de Contingência
                        </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        Ative contra-medidas táticas para mitigar colapsos operacionais e financeiros em tempo real
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${
                        activeCount > 0
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50 shadow-[0_0_12px_rgba(20,184,166,0.25)]'
                            : 'bg-slate-900/80 text-slate-400 border border-slate-800'
                    }`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {activeCount} Playbook{activeCount !== 1 ? 's' : ''} Ativo{activeCount !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Playbooks Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {playbooks.map((playbook) => {
                    const active = playbook.isActive;
                    return (
                        <div
                            key={playbook.id}
                            className={`p-4 rounded-xl border transition-all duration-300 relative flex flex-col justify-between space-y-3 ${
                                active
                                    ? 'bg-teal-950/25 border-teal-500/60 shadow-[0_0_20px_rgba(20,184,166,0.15)] ring-1 ring-teal-500/40'
                                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                        >
                            {/* Card Top */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    {getCategoryBadge(playbook.category)}
                                    
                                    {/* Toggle Switch Button */}
                                    <button
                                        onClick={() => onTogglePlaybook(playbook.id)}
                                        className={`px-3 py-1 rounded-xl text-[10px] font-black tracking-wider uppercase transition flex items-center gap-1.5 ${
                                            active
                                                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/30 font-extrabold'
                                                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                                        }`}
                                    >
                                        <Power className="w-3 h-3" />
                                        {active ? 'ATIVADO' : 'INATIVO'}
                                    </button>
                                </div>

                                <h4 className={`text-xs font-black tracking-tight ${active ? 'text-teal-200' : 'text-white'}`}>
                                    {playbook.name}
                                </h4>

                                <p className="text-[11px] text-slate-300 leading-relaxed">
                                    {playbook.description}
                                </p>
                            </div>

                            {/* Card Bottom Cost Footer */}
                            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                                <span className="text-slate-400">Custo Adicional:</span>
                                <span className="font-mono font-bold text-amber-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                                    + R$ {playbook.impacts.costPerDay}/dia
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LizStrategyPanel;
