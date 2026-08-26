import React, { useState, useRef, useEffect } from 'react';
import { Send, Save, Bot, User, Sparkles, Terminal, CheckCircle2, RefreshCw, AlertCircle, KeyRound } from 'lucide-react';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export const LizPromptPlayground: React.FC = () => {
    // Column 1 State: System Prompt + API Key
    const [systemPrompt, setSystemPrompt] = useState<string>(
        `Você é a LIZ, uma assistente virtual de triagem e coordenação do cuidado médico da rede ELYON HealthTech.
Seu objetivo é orientar pacientes, profissionais de saúde e gestores de forma humana, clara e objetiva.

Regras de Comportamento:
1. Mantenha um tom profissional, acolhedor e altamente empático.
2. Ao receber relatos de sintomas, priorize a segurança do paciente e forneça orientações de triagem preliminares.
3. Não forneça diagnósticos definitivos; recomende sempre a consulta com um médico especialista.
4. Para consultas operacionais, responda com métricas precisas do sistema ELYON OS.`
    );

    const [apiKey, setApiKey] = useState<string>('');
    const [isSaved, setIsSaved] = useState<boolean>(false);

    // Column 2 State: Test Chat Stream
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'msg-1',
            role: 'assistant',
            content: 'Olá! Sou a LIZ, assistente de triagem e coordenação do cuidado da ELYON. Como posso ajudar em seu teste hoje?',
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
    ]);

    const [inputMessage, setInputMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSaveParams = () => {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2500);
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputMessage.trim() || isLoading) return;

        // Validate API Key
        if (!apiKey.trim()) {
            setErrorMessage('Insira sua chave da API do Gemini no painel esquerdo.');
            return;
        }

        setErrorMessage(null);
        const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const userMsg: ChatMessage = {
            id: `usr-${Date.now()}`,
            role: 'user',
            content: inputMessage,
            timestamp,
        };

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInputMessage('');
        setIsLoading(true);

        try {
            // Formatação estrita exigida pelo Gemini V1Beta
            const formatted = updatedMessages.map((m) => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }],
            }));

            // Uso OBRIGATÓRIO do endpoint v1beta para suporte a systemInstruction no 1.5-flash
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        systemInstruction: {
                            parts: [{ text: systemPrompt || 'Você é a LIZ da rede Elyon.' }],
                        },
                        contents: formatted,
                    }),
                }
            );

            if (!res.ok) {
                const errData = await res.json();
                console.error('Erro detalhado da API Google:', errData);
                throw new Error(errData.error?.message || 'Erro de conexão com o servidor do Gemini.');
            }

            const data = await res.json();

            if (!data.candidates || data.candidates.length === 0) {
                throw new Error('A API não retornou texto válido.');
            }

            const texto = data.candidates[0].content.parts[0].text;

            const assistantMsg: ChatMessage = {
                id: `liz-${Date.now()}`,
                role: 'assistant',
                content: texto,
                timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            };

            setMessages((prev) => [...prev, assistantMsg]);
            setErrorMessage(null);
        } catch (error: any) {
            console.error('Falha Crítica na requisição:', error);
            setErrorMessage(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-full flex flex-col lg:flex-row font-sans overflow-hidden bg-slate-50">
            
            {/* ── COLUNA 1: SYSTEM PROMPT (O CÉREBRO - 35% DA TELA) ── */}
            <div className="w-full lg:w-[35%] h-1/2 lg:h-full bg-slate-900 text-slate-100 p-6 flex flex-col justify-between border-r border-slate-800 shadow-2xl">
                
                {/* Header Coluna 1 */}
                <div className="space-y-1 pb-4 border-b border-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                                <Terminal className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-white tracking-tight">
                                Engenharia de Prompt - LIZ
                            </h2>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                            v2.4 Dev
                        </span>
                    </div>
                    <p className="text-xs text-slate-400">
                        Defina e ajuste as instruções mestre do cérebro da assistente Elyon.
                    </p>
                </div>

                {/* Textarea Principal (System Prompt) */}
                <div className="flex-1 my-4 flex flex-col space-y-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                        <span>System Prompt (Instruções Mestre)</span>
                        <span className="text-[10px] text-slate-500 font-mono">UTF-8 / Config</span>
                    </label>
                    
                    <textarea
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        placeholder="Digite as instruções mestre da IA aqui..."
                        className="flex-1 w-full bg-slate-800/90 text-slate-200 font-mono text-xs p-4 rounded-xl border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none leading-relaxed shadow-inner"
                    />
                </div>

                {/* API Key Input */}
                <div className="space-y-2 pb-4 border-b border-slate-800 mb-3">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        Chave da API (Gemini)
                    </label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Cole sua GEMINI_API_KEY aqui..."
                        className="w-full bg-slate-800/90 text-slate-200 font-mono text-xs px-4 py-3 rounded-xl border border-slate-700/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none shadow-inner placeholder-slate-600"
                    />
                    {apiKey && (
                        <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Chave carregada ({apiKey.slice(0, 6)}...{apiKey.slice(-4)})
                        </p>
                    )}
                </div>

                {/* Botão Secundário de Salvar Parâmetros */}
                <div className="pt-2 flex items-center justify-between">
                    <button
                        onClick={handleSaveParams}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                            isSaved
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700 hover:border-slate-600'
                        }`}
                    >
                        {isSaved ? (
                            <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                Parâmetros Salvos com Sucesso!
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 text-slate-400" />
                                Salvar Parâmetros
                            </>
                        )}
                    </button>
                </div>

            </div>

            {/* ── COLUNA 2: CHAT DE TESTE (A INTERFACE - 65% DA TELA) ── */}
            <div className="w-full lg:w-[65%] h-1/2 lg:h-full bg-slate-50 text-slate-800 p-6 flex flex-col justify-between">
                
                {/* Header Coluna 2 */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                                Simulador de Atendimento - Elyon
                            </h1>
                            <p className="text-xs text-slate-500">
                                Client-Side • Gemini 1.5 Flash • Direto do Navegador
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setMessages([
                                {
                                    id: 'msg-1',
                                    role: 'assistant',
                                    content: 'Olá! Sou a LIZ, assistente de triagem e coordenação do cuidado da ELYON. Como posso ajudar em seu teste hoje?',
                                    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                                },
                            ]);
                            setErrorMessage(null);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition flex items-center gap-1.5"
                        title="Limpar Histórico de Teste"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Resetar Chat
                    </button>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Área de Mensagens (Scrollable Stream) */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
                    {messages.map((msg) => {
                        const isUser = msg.role === 'user';
                        return (
                            <div
                                key={msg.id}
                                className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                            >
                                {!isUser && (
                                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm flex-shrink-0 mt-1">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                )}

                                <div
                                    className={`max-w-[78%] p-4 rounded-2xl text-xs sm:text-sm space-y-1.5 shadow-sm ${
                                        isUser
                                            ? 'bg-blue-950 text-white rounded-tr-none'
                                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                                    }`}
                                >
                                    <div className={`flex items-center justify-between gap-4 text-[10px] ${isUser ? 'text-blue-200' : 'text-slate-400'}`}>
                                        <span className="font-bold uppercase tracking-wider">{isUser ? 'Usuário' : 'LIZ Assistente'}</span>
                                        <span>{msg.timestamp}</span>
                                    </div>

                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                </div>

                                {isUser && (
                                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm flex-shrink-0 mt-1">
                                        <User className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Indicador: LIZ está digitando... */}
                    {isLoading && (
                        <div className="flex items-center gap-3 animate-fadeIn">
                            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                                <Bot className="w-4 h-4 animate-spin" />
                            </div>
                            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-600 flex items-center gap-2 shadow-sm">
                                <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                                <span>LIZ está digitando...</span>
                            </div>
                        </div>
                    )}

                    <div ref={chatEndRef} />
                </div>

                {/* Input de Chat (Rodapé) */}
                <form
                    onSubmit={handleSendMessage}
                    className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3"
                >
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Digite sua mensagem de teste para a LIZ..."
                        disabled={isLoading}
                        className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none disabled:opacity-50"
                    />
                    
                    <button
                        type="submit"
                        disabled={!inputMessage.trim() || isLoading}
                        className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition disabled:opacity-40 flex items-center justify-center shadow-md shadow-emerald-600/20"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>

            </div>

        </div>
    );
};

export default LizPromptPlayground;
