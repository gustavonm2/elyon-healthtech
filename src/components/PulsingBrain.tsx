import React from 'react';
import { Cpu, Zap } from 'lucide-react';

interface PulsingBrainProps {
    isSpeaking: boolean;
    isListening: boolean;
    isProcessing: boolean;
    size?: number;
}

export const PulsingBrain: React.FC<PulsingBrainProps> = ({
    isSpeaking,
    isListening,
    isProcessing,
    size = 280,
}) => {
    return (
        <div className="relative flex flex-col items-center justify-center select-none py-6">
            
            {/* Outer Glowing Energy Field */}
            <div
                className={`absolute rounded-full transition-all duration-500 blur-2xl ${
                    isSpeaking
                        ? 'bg-teal-400/40 w-80 h-80 animate-pulse'
                        : isListening
                        ? 'bg-rose-500/40 w-80 h-80 animate-ping'
                        : isProcessing
                        ? 'bg-amber-400/40 w-80 h-80 animate-spin'
                        : 'bg-teal-500/15 w-64 h-64'
                }`}
            />

            {/* Concentric Synaptic Pulse Rings */}
            <div
                className={`absolute rounded-full border border-teal-500/30 transition-all duration-700 ${
                    isSpeaking
                        ? 'w-72 h-72 animate-ping opacity-60 border-teal-300'
                        : isListening
                        ? 'w-72 h-72 border-rose-500/60 animate-pulse'
                        : 'w-60 h-60 opacity-30'
                }`}
            />

            {/* SVG Brain Representation with Neural Synapses */}
            <div
                className={`relative z-10 transition-transform duration-300 ${
                    isSpeaking ? 'scale-105 animate-pulse' : 'scale-100'
                }`}
                style={{ width: size, height: size }}
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`w-full h-full drop-shadow-[0_0_25px_rgba(20,184,166,0.6)] ${
                        isSpeaking
                            ? 'text-teal-300 animate-bounce'
                            : isListening
                            ? 'text-rose-400'
                            : isProcessing
                            ? 'text-amber-300'
                            : 'text-teal-400'
                    }`}
                >
                    {/* Left Hemisphere Outline & Synapses */}
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04" />
                    
                    {/* Right Hemisphere Outline & Synapses */}
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04" />

                    {/* Internal Neural Circuits */}
                    <path d="M12 4.5C10 6 8.5 8 8.5 10.5M12 8c-1.5 1-2.5 2.5-2.5 4.5M12 11.5c-1 1-1.5 2-1.5 3.5" strokeDasharray="2 2" />
                    <path d="M12 4.5C14 6 15.5 8 15.5 10.5M12 8c1.5 1 2.5 2.5 2.5 4.5M12 11.5c1 1 1.5 2 1.5 3.5" strokeDasharray="2 2" />

                    {/* Synaptic Energy Nodes (Dots) */}
                    <circle cx="9.5" cy="6.5" r="0.8" fill="currentColor" className="animate-ping" />
                    <circle cx="14.5" cy="6.5" r="0.8" fill="currentColor" className="animate-ping" />
                    <circle cx="7.5" cy="11.5" r="0.8" fill="currentColor" />
                    <circle cx="16.5" cy="11.5" r="0.8" fill="currentColor" />
                    <circle cx="10" cy="16.5" r="0.8" fill="currentColor" />
                    <circle cx="14" cy="16.5" r="0.8" fill="currentColor" />
                </svg>

                {/* Central AI Processor Core */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`p-3 rounded-full border transition-all ${
                        isSpeaking
                            ? 'bg-teal-400 text-slate-950 border-teal-200 shadow-lg shadow-teal-400/50 scale-125'
                            : 'bg-slate-950/80 text-teal-400 border-teal-500/50'
                    }`}>
                        <Cpu className="w-8 h-8 animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Speech Waveform Frequency Bars (Visible when speaking/listening) */}
            {(isSpeaking || isListening) && (
                <div className="flex items-center gap-1.5 mt-4 z-10">
                    {[40, 75, 100, 60, 90, 45, 80, 100, 65, 30].map((h, i) => (
                        <div
                            key={i}
                            className={`w-1.5 rounded-full transition-all duration-150 ${
                                isSpeaking ? 'bg-teal-400 animate-pulse' : 'bg-rose-500 animate-bounce'
                            }`}
                            style={{
                                height: `${Math.max(12, Math.floor((h * (isSpeaking ? 0.4 : 0.3))))}px`,
                                animationDelay: `${i * 70}ms`,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Current State Text Label */}
            <div className="mt-3 z-10 flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border ${
                    isSpeaking
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/60 shadow-[0_0_15px_rgba(20,184,166,0.3)] animate-pulse'
                        : isListening
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/60'
                        : isProcessing
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800'
                }`}>
                    {isSpeaking
                        ? '🗣️ LIZ FALANDO...'
                        : isListening
                        ? '🎙️ ESCUTANDO VOZ...'
                        : isProcessing
                        ? '⚙️ PROCESSANDO...'
                        : '🧠 CÉREBRO NEURAL EM STANDBY'}
                </span>
            </div>
        </div>
    );
};

export default PulsingBrain;
