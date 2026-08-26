import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Terminal, Cpu, CheckCircle2, Zap, FolderOpen, Play, Activity } from 'lucide-react';
import { executeLizLocalCommand, type LizAgentResponse } from '../../services/lizAgentService';

export const LizSidebarAgent: React.FC = () => {
    const [commandInput, setCommandInput] = useState<string>('');
    const [isListening, setIsListening] = useState<boolean>(false);
    const [isExecuting, setIsExecuting] = useState<boolean>(false);
    const [agentState, setAgentState] = useState<'IDLE' | 'LISTENING' | 'PROCESSING'>('IDLE');
    
    const [logs, setLogs] = useState<string[]>([
        `> [${new Date().toLocaleTimeString('pt-BR')}] LIZ Core v9.0 online (Tauri IPC Bridge Ready).`,
        `> Aguardando comandos de voz ou texto para tarefas do OS local.`,
    ]);

    const terminalEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const handleRunCommand = async (cmd: string) => {
        if (!cmd.trim()) return;

        setAgentState('PROCESSING');
        setIsExecuting(true);

        // Add prompt to log
        setLogs((prev) => [...prev, `> Comanda: "${cmd}"`]);

        // Simulate 400ms delay for agentic feel
        setTimeout(async () => {
            const res: LizAgentResponse = await executeLizLocalCommand(cmd);
            setLogs((prev) => [...prev, res.logMessage, `  └ Output: ${res.output}`]);
            setIsExecuting(false);
            setAgentState('IDLE');
            setCommandInput('');
        }, 400);
    };

    const handleToggleVoice = () => {
        if (isListening) {
            setIsListening(false);
            setAgentState('IDLE');
        } else {
            setIsListening(true);
            setAgentState('LISTENING');

            // Simulate voice command ingestion after 2.5 seconds
            setTimeout(() => {
                setIsListening(false);
                const voiceCmd = 'LIZ, abrir pasta do projeto e verificar status do sistema';
                setCommandInput(voiceCmd);
                handleRunCommand(voiceCmd);
            }, 2500);
        }
    };

    return (
        <div className="bg-[#0F172A]/95 border border-teal-500/30 rounded-2xl p-4 shadow-2xl space-y-4 font-sans relative overflow-hidden">
            
            {/* Top Bar Agent Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/40">
                        <Cpu className="w-4 h-4 text-teal-400 animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                            LIZ Personal Agent
                            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                        </h4>
                        <span className="text-[10px] text-teal-400 font-mono block">
                            {agentState === 'LISTENING' ? '🔴 ESCUTANDO VOZ...' : agentState === 'PROCESSING' ? '⚙️ PROCESSANDO...' : '🟢 CORE ONLINE'}
                        </span>
                    </div>
                </div>
            </div>

            {/* FUTURISTIC LIZ CORE ORB VISUALIZER */}
            <div className="flex flex-col items-center justify-center py-4 relative">
                
                {/* Glowing Aura Rings */}
                <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${
                    agentState === 'LISTENING'
                        ? 'bg-rose-500/20 border-2 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)] animate-pulse'
                        : agentState === 'PROCESSING'
                        ? 'bg-amber-500/20 border-2 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.4)] animate-spin'
                        : 'bg-teal-500/15 border border-teal-500/40 shadow-[0_0_25px_rgba(20,184,166,0.3)]'
                }`}>
                    
                    {/* Core Pulse Center Orb */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        agentState === 'LISTENING'
                            ? 'bg-rose-500 text-slate-950 scale-110 shadow-lg'
                            : agentState === 'PROCESSING'
                            ? 'bg-amber-400 text-slate-950 scale-95'
                            : 'bg-teal-400 text-slate-950 shadow-md shadow-teal-500/40'
                    }`}>
                        <Zap className="w-6 h-6 animate-pulse fill-current" />
                    </div>
                </div>

                <span className="text-[10px] text-slate-400 font-mono mt-2 uppercase tracking-wider">
                    {agentState === 'LISTENING' ? 'Fale agora...' : agentState === 'PROCESSING' ? 'Executando IPC Local...' : 'Agente Pessoal JARVIS-Style'}
                </span>
            </div>

            {/* QUICK ACTIONS CHIPS */}
            <div className="flex items-center gap-1.5 text-[10px] flex-wrap justify-center">
                <button
                    onClick={() => handleRunCommand('Abrir pasta do projeto')}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg transition flex items-center gap-1"
                >
                    <FolderOpen className="w-3 h-3 text-teal-400" /> Pasta OS
                </button>
                <button
                    onClick={() => handleRunCommand('Iniciar dev server')}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg transition flex items-center gap-1"
                >
                    <Play className="w-3 h-3 text-emerald-400" /> Dev Server
                </button>
                <button
                    onClick={() => handleRunCommand('Gerar relatório de sistema')}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg transition flex items-center gap-1"
                >
                    <Activity className="w-3 h-3 text-purple-400" /> Status CPU
                </button>
            </div>

            {/* INPUT & VOICE BUTTON */}
            <div className="flex items-center gap-2">
                
                {/* Voice Toggle Button */}
                <button
                    onClick={handleToggleVoice}
                    className={`p-2.5 rounded-xl border transition ${
                        isListening
                            ? 'bg-rose-600 border-rose-500 text-white animate-pulse shadow-lg shadow-rose-600/30'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                    }`}
                    title={isListening ? 'Parar Escuta de Voz' : 'Ativar Comando por Voz'}
                >
                    {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>

                {/* Text Fallback Input */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleRunCommand(commandInput);
                    }}
                    className="flex-1 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 focus-within:border-teal-500 rounded-xl px-3 py-1.5 shadow-inner"
                >
                    <input
                        type="text"
                        value={commandInput}
                        onChange={(e) => setCommandInput(e.target.value)}
                        placeholder="Pedir para LIZ..."
                        className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none"
                    />
                    <button
                        type="submit"
                        disabled={isExecuting || !commandInput.trim()}
                        className="text-teal-400 hover:text-teal-300 disabled:opacity-30 transition p-1"
                    >
                        <Send className="w-3.5 h-3.5" />
                    </button>
                </form>
            </div>

            {/* MINI TERMINAL CONSOLE LOG */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 h-32 overflow-y-auto font-mono text-[10px] space-y-1 text-slate-300 shadow-inner">
                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 border-b border-slate-900 pb-1 mb-1 uppercase tracking-wider">
                    <Terminal className="w-3 h-3 text-teal-400" /> Console de Execução Local (Tauri OS Bridge)
                </div>
                
                {logs.map((log, idx) => (
                    <div key={idx} className="leading-tight break-words">
                        {log.startsWith('>') ? (
                            <span className="text-teal-300">{log}</span>
                        ) : (
                            <span className="text-slate-400">{log}</span>
                        )}
                    </div>
                ))}
                <div ref={terminalEndRef} />
            </div>
        </div>
    );
};

export default LizSidebarAgent;
