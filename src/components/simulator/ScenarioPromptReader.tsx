import React, { useState } from 'react';
import { Sparkles, Bot, ArrowRight, RotateCcw, MessageSquareCode } from 'lucide-react';
import type { DynamicStressor } from '../../types/simulatorExtensions';
import { parseScenarioPrompt, type ParsedScenarioResult } from '../../utils/lizPromptParser';

interface ScenarioPromptReaderProps {
    currentStressors: DynamicStressor[];
    onApplyPrompt: (result: ParsedScenarioResult) => void;
}

export const ScenarioPromptReader: React.FC<ScenarioPromptReaderProps> = ({
    currentStressors,
    onApplyPrompt,
}) => {
    const [promptText, setPromptText] = useState<string>('');
    const [isParsing, setIsParsing] = useState<boolean>(false);

    const presetPrompts = [
        'Surto grave de dengue com afluxo de 400 pac/dia, médicos em greve parcial e operadora parceira atrasando repasses em 60 dias.',
        'Queda da automação LIZ AI para 20%, alta taxa de glosas B2B em 20% e laudos laboratoriais represados por 9 dias.',
        'Corte de verba inicial para R$ 150k durante período de hiper-demanda e falta de equipe médica na recepção.',
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!promptText.trim()) return;

        setIsParsing(true);
        setTimeout(() => {
            const parsed = parseScenarioPrompt(promptText, currentStressors);
            onApplyPrompt(parsed);
            setIsParsing(false);
        }, 600);
    };

    const handleSelectPreset = (preset: string) => {
        setPromptText(preset);
        setIsParsing(true);
        setTimeout(() => {
            const parsed = parseScenarioPrompt(preset, currentStressors);
            onApplyPrompt(parsed);
            setIsParsing(false);
        }, 600);
    };

    return (
        <div className="bg-[#1E293B]/90 border border-teal-500/40 rounded-2xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/40 flex-shrink-0">
                        <Bot className="w-5 h-5 text-teal-400 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                            LIZ: Orquestrador de Cenários por IA (Natural Language Ingestion)
                            <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded font-black border border-teal-500/40">
                                NLP Ingestor v1.0
                            </span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            Descreva situações reais de estresse operacional. A LIZ interpretará o texto e ajustará os controles automaticamente.
                        </p>
                    </div>
                </div>
            </div>

            {/* Prompt Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                    <textarea
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        rows={3}
                        placeholder="Descreva o cenário de caos. Ex: 'Temos um surto de dengue na cidade, os médicos estão fazendo horas extras e o plano de saúde parceiro atrasou os repasses em 60 dias com taxa de glosa de 20%...'"
                        className="w-full bg-slate-900/90 border border-slate-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl p-3.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition duration-200 resize-none shadow-inner"
                    />
                    <MessageSquareCode className="w-4 h-4 text-slate-600 absolute right-3 bottom-3 pointer-events-none" />
                </div>

                {/* Preset Chips */}
                <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Cenários Narrativos Rápidos (Presets IA):
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {presetPrompts.map((preset, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleSelectPreset(preset)}
                                className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-[10px] text-slate-300 hover:text-teal-300 transition text-left line-clamp-1 max-w-full"
                            >
                                ✨ "{preset.slice(0, 55)}..."
                            </button>
                        ))}
                    </div>
                </div>

                {/* Submit Action */}
                <div className="flex justify-end pt-1">
                    <button
                        type="submit"
                        disabled={isParsing || !promptText.trim()}
                        className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-teal-500/20 transition flex items-center gap-2 disabled:opacity-50"
                    >
                        {isParsing ? (
                            <RotateCcw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Sparkles className="w-4 h-4 fill-current text-slate-950" />
                        )}
                        {isParsing ? 'LIZ está analisando a narrativa...' : 'LIZ, Interpretar e Simular Cenário'}
                        {!isParsing && <ArrowRight className="w-3.5 h-3.5 ml-1" />}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ScenarioPromptReader;
