import React from 'react';
import { Cpu, Zap, Activity, ShieldCheck, Sparkles, Radio, Mic, MicOff } from 'lucide-react';
import lizHologramImg from '../assets/liz-hologram.jpg';

interface LizHolographicCoreProps {
    isSpeaking: boolean;
    isListening: boolean;
    isProcessing: boolean;
    wakeWordDetected?: boolean;
    isMicMuted?: boolean;
    onToggleMic?: () => void;
    size?: number;
}

export const LizHolographicCore: React.FC<LizHolographicCoreProps> = ({
    isSpeaking,
    isListening,
    isProcessing,
    wakeWordDetected = false,
    isMicMuted = false,
    onToggleMic,
    size = 540,
}) => {
    return (
        <div className="relative flex flex-col items-center justify-center select-none w-full max-w-4xl mx-auto overflow-hidden rounded-3xl border border-teal-500/40 shadow-[0_0_60px_rgba(20,184,166,0.3)] bg-slate-950">
            
            {/* BASE HOLOGRAM BACKGROUND IMAGE */}
            <div className="relative w-full aspect-[16/9] min-h-[420px] flex items-center justify-center overflow-hidden">
                <img
                    src={lizHologramImg}
                    alt="LIZ Hologram Core"
                    className={`w-full h-full object-cover transition-all duration-700 ${
                        isMicMuted
                            ? 'brightness-40 contrast-120 grayscale opacity-60'
                            : isProcessing
                            ? 'brightness-50 contrast-120 opacity-70 blur-[1px]'
                            : isSpeaking
                            ? 'brightness-125 contrast-110 scale-105'
                            : wakeWordDetected || isListening
                            ? 'brightness-120 hue-rotate-[320deg] scale-105 shadow-[0_0_80px_rgba(20,184,166,0.8)]'
                            : 'brightness-100'
                    }`}
                />

                {/* OVERLAY GLASS GRADIENT */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-[#0F172A]/70 pointer-events-none" />

                {/* GLOWING MIC TOGGLE BUTTON (TOP RIGHT CORNER) */}
                {onToggleMic && (
                    <div className="absolute top-6 right-6 z-30">
                        <button
                            onClick={onToggleMic}
                            className={`p-3 rounded-2xl border transition-all duration-300 shadow-xl flex items-center gap-2 text-xs font-bold ${
                                isMicMuted
                                    ? 'bg-rose-950/80 border-rose-500 text-rose-400 shadow-rose-950/50'
                                    : wakeWordDetected
                                    ? 'bg-teal-500 border-teal-300 text-slate-950 shadow-teal-500/50 animate-pulse scale-105'
                                    : 'bg-slate-900/90 border-slate-700 text-teal-300 hover:border-teal-500'
                            }`}
                            title={isMicMuted ? 'Ativar Escuta Contínua (Palavra de Ativação "Liz")' : 'Mutar Microfone por Privacidade'}
                        >
                            {isMicMuted ? <MicOff className="w-5 h-5 text-rose-400" /> : <Mic className="w-5 h-5 text-teal-300 animate-pulse" />}
                            <span>{isMicMuted ? 'MIC MUTADO' : wakeWordDetected ? 'LIZ OUVIDO!' : 'OUVINDO "LIZ"'}</span>
                        </button>
                    </div>
                )}

                {/* LIVE HUD DATA PANELS (TOP LEFT) */}
                <div className="absolute top-6 left-6 z-20 space-y-1 text-[11px] font-mono text-teal-300 drop-shadow-[0_0_8px_rgba(20,184,166,0.8)] pointer-events-none">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isMicMuted ? 'bg-rose-500' : 'bg-teal-400 animate-ping'}`} />
                        <span className="font-bold text-white tracking-wider uppercase">Elyon OS: Liz Assistant</span>
                    </div>
                    <div className="text-slate-300 text-[10px]">
                        Neural Link: Latency 2ms
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Status: {isMicMuted ? 'MIC MUTED' : isSpeaking ? 'EMITTING SPEECH' : wakeWordDetected ? 'WAKE WORD DETECTED' : isListening ? 'CONTINUOUS LISTENING' : 'ACTIVE'}
                    </div>
                </div>

                {/* ANIMATED PULSING HOLOGRAPHIC OVERLAY LAYERS */}
                
                {/* Layer 1: Rotating Radar Ring Clockwise */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                        className={`w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] rounded-full border border-dashed transition-all duration-300 ${
                            isMicMuted
                                ? 'border-rose-500/20 opacity-30'
                                : wakeWordDetected || isSpeaking
                                ? 'scale-110 border-teal-300 border-2 shadow-[0_0_50px_rgba(20,184,166,0.8)] animate-[spin_6s_linear_infinite]'
                                : 'border-teal-400/40 animate-[spin_12s_linear_infinite]'
                        }`}
                    />
                </div>

                {/* Layer 2: Rotating Radar Ring Counter-Clockwise */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                        className={`w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] rounded-full border-2 border-t-transparent border-b-transparent transition-all duration-300 ${
                            isMicMuted
                                ? 'border-slate-800 opacity-20'
                                : wakeWordDetected || isSpeaking
                                ? 'scale-115 border-cyan-200 shadow-[0_0_50px_rgba(0,242,254,0.9)] animate-[spin_4s_linear_infinite_reverse]'
                                : 'border-cyan-400/50 animate-[spin_8s_linear_infinite_reverse]'
                        }`}
                    />
                </div>

                {/* Layer 3: Central Glowing Energy Vortex Core */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                        className={`rounded-full transition-all duration-300 flex items-center justify-center ${
                            isMicMuted
                                ? 'w-32 h-32 bg-slate-950/80 border border-slate-800 opacity-40'
                                : isSpeaking
                                ? 'w-44 h-44 bg-teal-400/30 border-2 border-teal-200 shadow-[0_0_80px_rgba(20,184,166,0.9)] animate-pulse scale-125'
                                : wakeWordDetected || isListening
                                ? 'w-44 h-44 bg-teal-500/30 border-2 border-teal-300 shadow-[0_0_80px_rgba(20,184,166,0.9)] animate-ping scale-115'
                                : isProcessing
                                ? 'w-44 h-44 bg-amber-400/30 border-2 border-amber-300 shadow-[0_0_80px_rgba(245,158,11,0.8)] animate-spin'
                                : 'w-36 h-36 bg-teal-500/10 border border-teal-500/40 shadow-[0_0_40px_rgba(20,184,166,0.4)]'
                        }`}
                    >
                        {/* Central Pulsing ELYON Emblem */}
                        <div className={`transition-transform duration-200 ${isSpeaking || wakeWordDetected ? 'animate-bounce scale-125 text-white' : 'text-teal-300'}`}>
                            <Zap className="w-12 h-12 fill-current drop-shadow-[0_0_15px_rgba(20,184,166,1)]" />
                        </div>
                    </div>
                </div>

                {/* Layer 4: Equalizer Audio Spectrum Bars at Pedestal Base */}
                <div className="absolute bottom-4 left-0 right-0 z-20 flex items-center justify-center gap-1.5 pointer-events-none">
                    {[35, 70, 100, 85, 45, 95, 60, 100, 75, 40, 90, 65, 30].map((h, idx) => (
                        <div
                            key={idx}
                            className={`w-1.5 rounded-full transition-all duration-150 ${
                                isMicMuted
                                    ? 'bg-slate-800 h-2'
                                    : isSpeaking || wakeWordDetected
                                    ? 'bg-gradient-to-t from-teal-500 via-teal-300 to-white shadow-[0_0_12px_rgba(20,184,166,0.9)] animate-pulse'
                                    : isListening
                                    ? 'bg-teal-400 animate-bounce'
                                    : 'bg-teal-500/40'
                            }`}
                            style={{
                                height: `${isSpeaking || wakeWordDetected ? Math.max(14, Math.floor(h * 0.45)) : isListening ? 10 : 6}px`,
                                animationDelay: `${(idx % 4) * 70}ms`,
                            }}
                        />
                    ))}
                </div>

            </div>

            {/* BOTTOM STATUS RIBBON */}
            <div className="w-full bg-[#1E293B]/90 border-t border-slate-800 px-6 py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-teal-300 font-mono font-bold">
                    <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                    <span>LIZ WAKE WORD ENGINE // PALAVRA DE ATIVAÇÃO: "LIZ"</span>
                </div>

                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    isMicMuted
                        ? 'bg-rose-950 text-rose-400 border-rose-800'
                        : isSpeaking
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/80 shadow-[0_0_15px_rgba(20,184,166,0.4)] animate-pulse'
                        : wakeWordDetected
                        ? 'bg-teal-400 text-slate-950 font-black border-white shadow-[0_0_20px_rgba(20,184,166,0.9)] animate-bounce'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}>
                    {isMicMuted
                        ? '🚫 PRIVACIDADE MUTADA'
                        : isSpeaking
                        ? '🔊 FALANDO...'
                        : wakeWordDetected
                        ? '🟢 WAKE WORD "LIZ" DETECTADO!'
                        : '🎙️ OUVINDO... DIGA "LIZ"'}
                </span>
            </div>

        </div>
    );
};

export default LizHolographicCore;
