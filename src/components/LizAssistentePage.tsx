import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Send, Bot, User, Radio } from 'lucide-react';
import { LizFluidParticleOrb } from './LizFluidParticleOrb';
import { useLizVoice } from '../hooks/useLizVoice';
import { useLizHearing } from '../hooks/useLizHearing';
import { queryGeminiBrain, type LizBrainResponse } from '../services/lizGeminiBrainService';

interface ChatMessage {
    id: string;
    sender: 'user' | 'liz';
    text: string;
    timestamp: string;
    toolUsed?: string;
}

export const LizAssistentePage: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'msg-1',
            sender: 'liz',
            text: 'Olá! Sou a LIZ, sua assistente de IA. Diga "Liz" em voz alta ou digite seu comando.',
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
    ]);

    const [inputText, setInputText] = useState<string>('');
    const [isProcessingCommand, setIsProcessingCommand] = useState<boolean>(false);

    const { isSpeaking, isMuted, toggleMute, speak } = useLizVoice();
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Command Execution Handler
    const handleExecuteCommand = useCallback(
        async (commandText: string) => {
            if (!commandText.trim()) return;

            const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            const userMsg: ChatMessage = {
                id: `usr-${Date.now()}`,
                sender: 'user',
                text: commandText,
                timestamp,
            };

            setMessages((prev) => [...prev, userMsg]);
            setInputText('');
            setIsProcessingCommand(true);

            // Query Gemini 1.5 Brain
            setTimeout(async () => {
                const geminiRes: LizBrainResponse = await queryGeminiBrain(commandText);
                const lizResponseText = geminiRes.text;

                const lizMsg: ChatMessage = {
                    id: `liz-${Date.now()}`,
                    sender: 'liz',
                    text: lizResponseText,
                    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                    toolUsed: geminiRes.toolUsed,
                };

                setMessages((prev) => [...prev, lizMsg]);
                setIsProcessingCommand(false);

                // Speak response via calibrated UPA Speech Engine
                speak(lizResponseText);
            }, 400);
        },
        [speak]
    );

    // Continuous Hearing Engine with Wake Word ("Liz")
    const { isListening, wakeWordDetected, liveTranscript, toggleListening } = useLizHearing((detectedCmd) => {
        handleExecuteCommand(detectedCmd);
    });

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isSpeaking, isProcessingCommand, liveTranscript]);

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans p-4 sm:p-6 lg:p-8 flex flex-col justify-between space-y-6">
            
            {/* Minimalist Top Header */}
            <div className="bg-[#1E293B]/90 border border-slate-800 rounded-2xl p-4 shadow-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-inner flex-shrink-0">
                        <Radio className="w-5 h-5 animate-pulse text-teal-400" />
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                            LIZ Assistente Pessoal
                        </h1>
                    </div>
                </div>

                {/* Mic Mute Toggle */}
                <button
                    onClick={toggleListening}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                        isListening
                            ? 'bg-teal-500/20 border-teal-500 text-teal-300 shadow-lg shadow-teal-500/10'
                            : 'bg-rose-950 border-rose-800 text-rose-400'
                    }`}
                >
                    {isListening ? <Mic className="w-4 h-4 text-teal-400 animate-pulse" /> : <MicOff className="w-4 h-4 text-rose-400" />}
                    {isListening ? 'Escuta Ativa ("Liz")' : 'Mic Mutado'}
                </button>
            </div>

            {/* ── CENTER OF THE SCREEN: CLEAN 3D FLUID NEON ORB ── */}
            <div className="max-w-4xl mx-auto w-full flex flex-col items-center justify-center space-y-6 my-auto text-center">
                
                {/* 3D FLUID NEON PARTICLE ORB */}
                <LizFluidParticleOrb
                    isSpeaking={isSpeaking}
                    isListening={isListening}
                    isProcessing={isProcessingCommand}
                    wakeWordDetected={wakeWordDetected}
                    size={460}
                />

                {/* LIVE REAL-TIME TRANSCRIPTION (WHEN USER SPEAKS) */}
                {isListening && liveTranscript && (
                    <div className="w-full max-w-2xl bg-slate-900/90 border border-teal-500/50 rounded-2xl p-3.5 shadow-2xl text-left animate-fadeIn">
                        <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-teal-400 uppercase mb-1">
                            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                            <span>Transcrição em Tempo Real:</span>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-white tracking-wide">
                            "{liveTranscript}"<span className="inline-block w-1.5 h-4 ml-1 bg-teal-400 animate-pulse align-middle" />
                        </p>
                    </div>
                )}

                {/* CLEAN COMMAND BAR (MICROPHONE + TEXT INPUT + SEND BUTTON) */}
                <div className="w-full max-w-2xl space-y-3">
                    <div className="flex items-center gap-2">
                        
                        {/* Mic Button */}
                        <button
                            onClick={toggleListening}
                            className={`p-3.5 rounded-2xl border transition-all duration-300 flex-shrink-0 ${
                                isListening
                                    ? 'bg-teal-600 border-teal-400 text-slate-950 shadow-xl shadow-teal-500/40 scale-105'
                                    : 'bg-rose-950 border-rose-800 text-rose-400 shadow-lg'
                            }`}
                            title={isListening ? 'Mutar Escuta' : 'Ativar Escuta (Diga "Liz")'}
                        >
                            {isListening ? <Mic className="w-6 h-6 animate-pulse" /> : <MicOff className="w-6 h-6" />}
                        </button>

                        {/* Text Command Input */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleExecuteCommand(inputText);
                            }}
                            className="flex-1 flex items-center gap-2 bg-slate-900/95 border border-slate-700 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 rounded-2xl px-4 py-3 shadow-2xl transition"
                        >
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Fale ou digite seu comando para a LIZ..."
                                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
                            />
                            <button
                                type="submit"
                                disabled={isProcessingCommand || !inputText.trim()}
                                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition disabled:opacity-30 flex items-center gap-1.5"
                            >
                                <Send className="w-4 h-4" />
                                Enviar
                            </button>
                        </form>
                    </div>
                </div>

            </div>

            {/* CHAT MESSAGES STREAM (HISTÓRICO DE DIÁLOGO LIZ AI) */}
            <div className="max-w-4xl mx-auto w-full bg-[#1E293B]/80 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
                    <span className="font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <Bot className="w-4 h-4 text-teal-400" /> Histórico de Transcrição e Diálogo LIZ AI
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{messages.length} Mensagens</span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 font-sans">
                    {messages.map((msg) => {
                        const isLiz = msg.sender === 'liz';
                        return (
                            <div
                                key={msg.id}
                                className={`flex items-start gap-2.5 ${isLiz ? 'justify-start' : 'justify-end'}`}
                            >
                                {isLiz && (
                                    <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/40 flex-shrink-0 mt-0.5">
                                        <Bot className="w-3.5 h-3.5" />
                                    </div>
                                )}

                                <div
                                    className={`max-w-[85%] p-3 rounded-xl text-xs space-y-1 ${
                                        isLiz
                                            ? 'bg-slate-900 border border-slate-800 text-teal-200 shadow-md'
                                            : 'bg-teal-600 text-slate-950 font-medium shadow-md'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-3 text-[9px] opacity-75 border-b border-slate-800/60 pb-1 mb-1">
                                        <span className="font-bold">{isLiz ? 'LIZ AI Assistant' : 'Você'}</span>
                                        <span>{msg.timestamp}</span>
                                    </div>

                                    <p className={`leading-relaxed whitespace-pre-wrap ${isLiz ? 'text-teal-200 font-medium' : 'text-slate-950'}`}>
                                        {msg.text}
                                    </p>
                                </div>

                                {!isLiz && (
                                    <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700 flex-shrink-0 mt-0.5">
                                        <User className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    <div ref={chatEndRef} />
                </div>
            </div>

        </div>
    );
};

export default LizAssistentePage;
