import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2, Volume2, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
interface ConversationEntry {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    timestamp: string;
}

type OrbState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';

// ── Component ────────────────────────────────────────────────────────────────
export const LizVoiceInterface: React.FC = () => {
    // Core States
    const [orbState, setOrbState] = useState<OrbState>('IDLE');
    const [transcript, setTranscript] = useState<string>('');
    const [lizResponse, setLizResponse] = useState<string>('');
    const [conversation, setConversation] = useState<ConversationEntry[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Config States
    const [apiKey, setApiKey] = useState<string>('');
    const [systemPrompt] = useState<string>(
        `Você é a LIZ, uma assistente virtual de triagem e coordenação do cuidado médico da rede ELYON HealthTech.
Seu tom é profissional, acolhedor e empático. Responda de forma concisa e direta para ser lida em voz alta.
Não use markdown, asteriscos, ou formatação especial. Fale naturalmente como em uma conversa.
Ao receber relatos de sintomas, priorize a segurança do paciente e forneça orientações de triagem preliminares.`
    );

    // Refs
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
    const conversationEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll conversation
    useEffect(() => {
        conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]);

    // ── TTS: Falar a resposta da LIZ ─────────────────────────────────────────
    const speakResponse = useCallback((text: string) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            setErrorMessage('Seu navegador não suporta síntese de voz (TTS).');
            setOrbState('IDLE');
            return;
        }

        window.speechSynthesis.cancel();

        const cleanText = text
            .replace(/[*#_>]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.82;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const ptVoice =
            voices.find((v) => v.lang.startsWith('pt-BR')) ||
            voices.find((v) => v.lang.startsWith('pt'));
        if (ptVoice) utterance.voice = ptVoice;

        utterance.onstart = () => setOrbState('SPEAKING');
        utterance.onend = () => setOrbState('IDLE');
        utterance.onerror = () => setOrbState('IDLE');

        synthRef.current = utterance;

        // Voices may load async
        if (voices.length > 0) {
            window.speechSynthesis.speak(utterance);
        } else {
            window.speechSynthesis.onvoiceschanged = () => {
                const v = window.speechSynthesis.getVoices();
                const pt = v.find((x) => x.lang.startsWith('pt-BR')) || v.find((x) => x.lang.startsWith('pt'));
                if (pt) utterance.voice = pt;
                window.speechSynthesis.speak(utterance);
            };
        }
    }, []);

    // ── LLM: Enviar ao Gemini e receber resposta ─────────────────────────────
    const queryGemini = useCallback(
        async (userText: string) => {
            setOrbState('THINKING');
            setErrorMessage(null);

            const ts = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            // Add user message to conversation
            const userEntry: ConversationEntry = {
                id: `usr-${Date.now()}`,
                role: 'user',
                text: userText,
                timestamp: ts,
            };

            const updatedConversation = [...conversation, userEntry];
            setConversation(updatedConversation);
            setTranscript(userText);

            try {
                // Format for Gemini REST API
                const formatted = updatedConversation.map((m) => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.text }],
                }));

                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            systemInstruction: {
                                parts: [{ text: systemPrompt }],
                            },
                            contents: formatted,
                        }),
                    }
                );

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error?.message || 'Erro na API Gemini.');
                }

                const data = await res.json();

                if (!data.candidates || data.candidates.length === 0) {
                    throw new Error('A API não retornou resposta válida.');
                }

                const responseText = data.candidates[0].content.parts[0].text;

                // Add LIZ response to conversation
                const lizEntry: ConversationEntry = {
                    id: `liz-${Date.now()}`,
                    role: 'assistant',
                    text: responseText,
                    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                };

                setConversation((prev) => [...prev, lizEntry]);
                setLizResponse(responseText);

                // Trigger TTS
                speakResponse(responseText);
            } catch (err: any) {
                console.error('Erro Gemini:', err);
                setErrorMessage(err.message);
                setOrbState('IDLE');
            }
        },
        [apiKey, systemPrompt, conversation, speakResponse]
    );

    // ── STT: Iniciar escuta por voz ──────────────────────────────────────────
    const startListening = useCallback(() => {
        setErrorMessage(null);

        if (!apiKey.trim()) {
            setErrorMessage('Insira sua chave da API do Gemini antes de iniciar.');
            return;
        }

        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setErrorMessage('Seu navegador não suporta reconhecimento de voz (STT). Use Google Chrome.');
            return;
        }

        window.speechSynthesis.cancel();

        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
            setOrbState('LISTENING');
            setTranscript('');
            setLizResponse('');
        };

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript;
                } else {
                    interimTranscript += result[0].transcript;
                }
            }

            // Show interim while speaking
            setTranscript(finalTranscript || interimTranscript);

            // When final result is captured, send to Gemini
            if (finalTranscript.trim()) {
                recognition.stop();
                queryGemini(finalTranscript.trim());
            }
        };

        recognition.onerror = (event: any) => {
            console.error('STT Error:', event.error);
            if (event.error !== 'no-speech') {
                setErrorMessage(`Erro no microfone: ${event.error}`);
            }
            setOrbState('IDLE');
        };

        recognition.onend = () => {
            if (orbState === 'LISTENING') {
                setOrbState('IDLE');
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [apiKey, orbState, queryGemini]);

    // ── Toggle: Clique no Orbe ───────────────────────────────────────────────
    const handleOrbClick = useCallback(() => {
        if (orbState === 'LISTENING') {
            recognitionRef.current?.stop();
            setOrbState('IDLE');
            return;
        }

        if (orbState === 'SPEAKING') {
            window.speechSynthesis.cancel();
            setOrbState('IDLE');
            return;
        }

        if (orbState === 'IDLE') {
            startListening();
        }
    }, [orbState, startListening]);

    // ── Orb Visual Config ────────────────────────────────────────────────────
    const orbStyles: Record<OrbState, { bg: string; border: string; shadow: string; icon: React.ReactNode; label: string }> = {
        IDLE: {
            bg: 'bg-slate-800',
            border: 'border-slate-600',
            shadow: '',
            icon: <Mic className="w-10 h-10 text-slate-400" />,
            label: 'Toque para falar com a LIZ',
        },
        LISTENING: {
            bg: 'bg-emerald-950',
            border: 'border-emerald-500 animate-pulse',
            shadow: 'shadow-[0_0_60px_rgba(16,185,129,0.4)]',
            icon: <Mic className="w-10 h-10 text-emerald-400 animate-bounce" />,
            label: 'Ouvindo...',
        },
        THINKING: {
            bg: 'bg-indigo-950',
            border: 'border-indigo-500',
            shadow: 'shadow-[0_0_60px_rgba(99,102,241,0.4)]',
            icon: <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />,
            label: 'LIZ está pensando...',
        },
        SPEAKING: {
            bg: 'bg-cyan-950',
            border: 'border-cyan-400 animate-pulse',
            shadow: 'shadow-[0_0_60px_rgba(34,211,238,0.4)]',
            icon: <Volume2 className="w-10 h-10 text-cyan-300 animate-pulse" />,
            label: 'LIZ está falando...',
        },
    };

    const currentOrb = orbStyles[orbState];

    return (
        <div className="h-screen w-full bg-slate-900 text-slate-100 font-sans flex flex-col items-center justify-between p-6 overflow-hidden">

            {/* ── Top Bar: API Key + Title ── */}
            <div className="w-full max-w-2xl space-y-4">
                <div className="text-center space-y-1">
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        LIZ <span className="text-emerald-400">Voice</span> Assistant
                    </h1>
                    <p className="text-xs text-slate-500">
                        Interface de Voz Integrada • STT → Gemini → TTS
                    </p>
                </div>

                {/* API Key Input */}
                <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-3">
                    <KeyRound className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Cole sua GEMINI_API_KEY aqui para ativar..."
                        className="flex-1 bg-transparent text-xs text-slate-200 font-mono placeholder-slate-600 outline-none"
                    />
                    {apiKey && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    )}
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}
            </div>

            {/* ── Center: The Orb ── */}
            <div className="flex flex-col items-center justify-center space-y-6 my-auto">

                {/* Ambient Aura */}
                <div className="relative flex items-center justify-center">
                    {orbState !== 'IDLE' && (
                        <div
                            className={`absolute w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none ${
                                orbState === 'LISTENING' ? 'bg-emerald-500 animate-ping' :
                                orbState === 'THINKING' ? 'bg-indigo-500 animate-pulse' :
                                'bg-cyan-400 animate-pulse'
                            }`}
                        />
                    )}

                    {/* Orb Button */}
                    <button
                        onClick={handleOrbClick}
                        disabled={orbState === 'THINKING'}
                        className={`relative z-10 w-36 h-36 rounded-full border-4 flex items-center justify-center transition-all duration-500 cursor-pointer disabled:cursor-wait ${currentOrb.bg} ${currentOrb.border} ${currentOrb.shadow}`}
                    >
                        {currentOrb.icon}
                    </button>
                </div>

                {/* State Label */}
                <p className={`text-sm font-semibold tracking-wide transition-colors duration-300 ${
                    orbState === 'IDLE' ? 'text-slate-500' :
                    orbState === 'LISTENING' ? 'text-emerald-400' :
                    orbState === 'THINKING' ? 'text-indigo-400' :
                    'text-cyan-300'
                }`}>
                    {currentOrb.label}
                </p>

                {/* Live Transcript (what user said) */}
                {transcript && (
                    <div className="max-w-lg text-center space-y-1 animate-fadeIn">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Você disse:</p>
                        <p className="text-sm text-white font-medium leading-relaxed">
                            "{transcript}"
                        </p>
                    </div>
                )}

                {/* LIZ Response */}
                {lizResponse && orbState !== 'THINKING' && (
                    <div className="max-w-lg text-center space-y-1 animate-fadeIn">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">LIZ respondeu:</p>
                        <p className="text-sm text-slate-300 font-medium leading-relaxed">
                            {lizResponse}
                        </p>
                    </div>
                )}
            </div>

            {/* ── Bottom: Conversation History ── */}
            {conversation.length > 0 && (
                <div className="w-full max-w-2xl bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 max-h-48 overflow-y-auto space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pb-1 border-b border-slate-700">
                        Histórico da Sessão
                    </p>
                    {conversation.map((entry) => (
                        <div
                            key={entry.id}
                            className={`text-xs py-1.5 px-3 rounded-lg ${
                                entry.role === 'user'
                                    ? 'bg-slate-700/50 text-slate-300'
                                    : 'bg-emerald-950/30 text-emerald-200 border-l-2 border-emerald-600'
                            }`}
                        >
                            <span className="font-bold text-[10px] uppercase tracking-wider opacity-60">
                                {entry.role === 'user' ? 'Paciente' : 'LIZ'}{' '}
                                <span className="font-normal">{entry.timestamp}</span>
                            </span>
                            <p className="mt-0.5 leading-relaxed">{entry.text}</p>
                        </div>
                    ))}
                    <div ref={conversationEndRef} />
                </div>
            )}

        </div>
    );
};

export default LizVoiceInterface;
