import React from 'react';
import { Sparkles, Zap, Radio } from 'lucide-react';

interface SpectrumVisualizerProps {
    isSpeaking: boolean;
    isListening: boolean;
    isProcessing: boolean;
    size?: number;
}

export const SpectrumVisualizer: React.FC<SpectrumVisualizerProps> = ({
    isSpeaking,
    isListening,
    isProcessing,
    size = 320,
}) => {
    // Generate 32 radial spectrum bars around the core
    const barCount = 32;
    const bars = Array.from({ length: barCount }, (_, i) => i);

    return (
        <div className="relative flex flex-col items-center justify-center select-none py-8 my-auto">
            
            {/* Outer Glowing Energy Field */}
            <div
                className={`absolute rounded-full transition-all duration-700 blur-3xl ${
                    isSpeaking
                        ? 'bg-teal-400/50 w-96 h-96 animate-pulse'
                        : isListening
                        ? 'bg-rose-500/50 w-96 h-96 animate-ping'
                        : isProcessing
                        ? 'bg-amber-400/50 w-96 h-96 animate-spin'
                        : 'bg-teal-500/20 w-80 h-80'
                }`}
            />

            {/* Concentric Spectrum Aura Rings */}
            <div
                className={`absolute rounded-full border transition-all duration-500 ${
                    isSpeaking
                        ? 'w-80 h-80 border-teal-400/70 shadow-[0_0_50px_rgba(20,184,166,0.6)] animate-ping opacity-80'
                        : isListening
                        ? 'w-80 h-80 border-rose-500/80 shadow-[0_0_50px_rgba(244,63,94,0.6)] animate-pulse'
                        : isProcessing
                        ? 'w-80 h-80 border-amber-400/70 shadow-[0_0_50px_rgba(245,158,11,0.5)] animate-spin'
                        : 'w-72 h-72 border-teal-500/30 opacity-40'
                }`}
            />

            <div
                className={`absolute rounded-full border border-teal-400/30 transition-all duration-1000 ${
                    isSpeaking ? 'w-96 h-96 animate-pulse' : 'w-80 h-80 opacity-20'
                }`}
            />

            {/* RADIAL 360° AUDIO FREQUENCY SPECTRUM BARS */}
            <div
                className="relative z-10 flex items-center justify-center"
                style={{ width: size, height: size }}
            >
                {/* 360-degree Circular Spectrum Bars */}
                {bars.map((i) => {
                    const angle = (i * 360) / barCount;
                    // Random-looking wave height pattern
                    const baseH = 20 + ((i * 17) % 45);
                    const dynamicHeight = isSpeaking
                        ? Math.max(15, (baseH * (1 + Math.sin(i + Date.now() * 0.005))))
                        : isListening
                        ? Math.max(10, baseH * 0.7)
                        : isProcessing
                        ? Math.max(12, baseH * 0.5)
                        : Math.max(8, baseH * 0.3);

                    return (
                        <div
                            key={i}
                            className="absolute top-1/2 left-1/2 origin-bottom transition-all duration-150"
                            style={{
                                transform: `translate(-50%, -100%) rotate(${angle}deg) translateY(-${size / 2 - 40}px)`,
                            }}
                        >
                            <div
                                className={`w-1.5 rounded-full transition-all duration-150 ${
                                    isSpeaking
                                        ? 'bg-gradient-to-t from-teal-500 via-teal-300 to-white shadow-[0_0_12px_rgba(20,184,166,0.8)] animate-pulse'
                                        : isListening
                                        ? 'bg-gradient-to-t from-rose-600 via-rose-400 to-white animate-bounce'
                                        : isProcessing
                                        ? 'bg-gradient-to-t from-amber-500 via-amber-300 to-white'
                                        : 'bg-teal-500/40'
                                }`}
                                style={{
                                    height: `${dynamicHeight}px`,
                                    animationDelay: `${(i % 5) * 80}ms`,
                                }}
                            />
                        </div>
                    );
                })}

                {/* CENTRAL SPECTRUM CORE SPHERE */}
                <div
                    className={`relative z-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isSpeaking
                            ? 'w-36 h-36 bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-600 text-slate-950 shadow-[0_0_60px_rgba(20,184,166,0.9)] scale-110 animate-pulse'
                            : isListening
                            ? 'w-36 h-36 bg-gradient-to-br from-rose-500 via-rose-600 to-red-700 text-white shadow-[0_0_60px_rgba(244,63,94,0.9)] scale-105 animate-bounce'
                            : isProcessing
                            ? 'w-36 h-36 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 text-slate-950 shadow-[0_0_60px_rgba(245,158,11,0.8)] scale-100'
                            : 'w-32 h-32 bg-slate-950/90 border-2 border-teal-500/60 text-teal-400 shadow-[0_0_30px_rgba(20,184,166,0.4)]'
                    }`}
                >
                    <div className="flex flex-col items-center justify-center space-y-1">
                        {isSpeaking ? (
                            <Zap className="w-10 h-10 animate-bounce fill-current" />
                        ) : isListening ? (
                            <Radio className="w-10 h-10 animate-pulse" />
                        ) : (
                            <Sparkles className="w-10 h-10 animate-pulse" />
                        )}
                        <span className="text-[10px] font-black tracking-widest uppercase opacity-90">
                            {isSpeaking ? 'FALANDO' : isListening ? 'ESCUTANDO' : isProcessing ? 'PENSANDO' : 'LIZ CORE'}
                        </span>
                    </div>
                </div>

            </div>

            {/* EQUALIZER AUDIO FREQUENCY BARS (HORIZONTAL BOTTOM SPECTRUM) */}
            <div className="flex items-center gap-1.5 mt-6 z-10">
                {[30, 60, 95, 100, 70, 85, 40, 90, 100, 50, 80, 60, 95, 30].map((h, idx) => {
                    const barH = isSpeaking
                        ? Math.max(16, Math.floor(h * 0.5))
                        : isListening
                        ? Math.max(12, Math.floor(h * 0.35))
                        : 8;

                    return (
                        <div
                            key={idx}
                            className={`w-1.5 rounded-full transition-all duration-150 ${
                                isSpeaking
                                    ? 'bg-gradient-to-t from-teal-500 to-teal-200 shadow-[0_0_10px_rgba(20,184,166,0.8)] animate-pulse'
                                    : isListening
                                    ? 'bg-rose-500 animate-bounce'
                                    : 'bg-slate-800'
                            }`}
                            style={{
                                height: `${barH}px`,
                                animationDelay: `${(idx % 4) * 60}ms`,
                            }}
                        />
                    );
                })}
            </div>

            {/* STATUS BADGE */}
            <div className="mt-4 z-10">
                <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase border transition-all ${
                    isSpeaking
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/80 shadow-[0_0_20px_rgba(20,184,166,0.4)] animate-pulse'
                        : isListening
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-bounce'
                        : isProcessing
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/80'
                        : 'bg-slate-900/90 text-slate-400 border-slate-800'
                }`}>
                    {isSpeaking
                        ? '🔊 ESPECTRO EMISSOR DE VOZ (LIZ FALANDO)'
                        : isListening
                        ? '🎙️ ESPECTRO RECEPTOR (ESCUTANDO VOZ)'
                        : isProcessing
                        ? '⚙️ SINTETIZANDO RESPOSTA...'
                        : '✨ ESPECTRO SONORO EM STANDBY'}
                </span>
            </div>

        </div>
    );
};

export default SpectrumVisualizer;
