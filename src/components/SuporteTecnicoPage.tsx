import React, { useState, useEffect, useRef } from 'react';
import {
    LifeBuoy, Send, CheckCircle, Clock, MessageSquare,
    AlignLeft, ChevronDown, PlusCircle, Bell,
} from 'lucide-react';
import {
    addTicket, getTicketsByAuthor, addTicketReply, markTicketRepliesRead,
} from '../utils/patientStore';
import type { StoredTicket } from '../utils/patientStore';

// ── helpers ─────────────────────────────────────────────────────────────────


const STATUS_CONFIG: Record<StoredTicket['status'], { label: string; color: string; bg: string }> = {
    aberto:      { label: 'Aberto',       color: '#D97706', bg: '#FFFBEB' },
    em_andamento:{ label: 'Em andamento', color: '#1D3461', bg: '#EEF4FA' },
    resolvido:   { label: 'Resolvido',    color: '#059669', bg: '#ECFDF5' },
};

// ── ChatThread ────────────────────────────────────────────────────────────────

interface ChatThreadProps {
    ticket: StoredTicket;
    onReply: (text: string) => void;
}

const ChatThread: React.FC<ChatThreadProps> = ({ ticket, onReply }) => {
    const [text, setText] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [ticket.replies]);

    const handleSend = () => {
        const trimmed = text.trim();
        if (!trimmed) return;
        onReply(trimmed);
        setText('');
    };

    const allMessages = [
        { author: ticket.authorName, authorRole: ticket.authorRole, text: ticket.message, date: ticket.createdAt, isOwn: true },
        ...ticket.replies.map(r => ({
            author: r.author,
            authorRole: r.authorRole,
            text: r.text,
            date: r.date,
            isOwn: r.authorRole !== 'gestor_master',
        })),
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#1D3461] flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                    <p className="text-[12px] font-bold text-[#0F172A] truncate">{ticket.subject}</p>
                    <p className="text-[11px] text-[#64748B]">
                        Aberto em {ticket.createdAt}
                        {' · '}
                        <span
                            className="font-bold px-1.5 py-0.5 rounded text-[10px]"
                            style={{
                                color: STATUS_CONFIG[ticket.status].color,
                                backgroundColor: STATUS_CONFIG[ticket.status].bg,
                            }}
                        >
                            {STATUS_CONFIG[ticket.status].label}
                        </span>
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[#F8FAFC]">
                {allMessages.map((msg, i) => {
                    const isSupport = msg.authorRole === 'gestor_master';
                    return (
                        <div key={i} className={`flex ${isSupport ? 'justify-start' : 'justify-end'}`}>
                            <div
                                className="max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm"
                                style={{
                                    backgroundColor: isSupport ? 'white' : '#1D3461',
                                    color: isSupport ? '#0F172A' : 'white',
                                    borderBottomLeftRadius: isSupport ? 4 : 16,
                                    borderBottomRightRadius: isSupport ? 16 : 4,
                                    border: isSupport ? '1px solid #E2E8F0' : 'none',
                                }}
                            >
                                <p className="text-[10px] font-bold mb-1 opacity-70">
                                    {isSupport ? 'Suporte SCI' : msg.author}
                                </p>
                                <p className="text-[12px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                <p className={`text-[10px] mt-1 text-right ${isSupport ? 'text-[#94A3B8]' : 'opacity-60'}`}>
                                    {msg.date}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            {ticket.status !== 'resolvido' && (
                <div className="px-4 py-3 bg-white border-t border-[#E2E8F0] flex items-end gap-2">
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Digite sua mensagem…"
                        rows={2}
                        className="flex-1 resize-none px-3 py-2 text-[12px] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D3461] bg-[#F8FAFC] transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!text.trim()}
                        className="p-2.5 rounded-xl bg-[#1D3461] text-white hover:bg-[#162749] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            )}
            {ticket.status === 'resolvido' && (
                <div className="px-4 py-3 bg-[#ECFDF5] border-t border-[#A7F3D0] flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#059669]" />
                    <p className="text-[11px] font-bold text-[#059669]">Chamado encerrado pelo suporte.</p>
                </div>
            )}
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────

const SuporteTecnicoPage: React.FC = () => {
    const userRole = localStorage.getItem('userRole') || 'telemedicina';
    const userName = userRole === 'paciente' ? 'Carlos E. Lima' : 'Dr. Exemplo';

    const [activeTab, setActiveTab] = useState<'chamado' | 'historico'>('chamado');

    // Chamado form
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [categoria, setCategoria] = useState('Problema técnico');
    const [submitted, setSubmitted] = useState(false);

    // History
    const [tickets, setTickets] = useState<StoredTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<StoredTicket | null>(null);

    const refreshTickets = () => {
        const all = getTicketsByAuthor(userName, userRole);
        setTickets(all);
        if (selectedTicket) {
            const updated = all.find(t => t.id === selectedTicket.id);
            setSelectedTicket(updated || null);
        }
    };

    useEffect(() => { refreshTickets(); }, []);

    const handleSubmitChamado = () => {
        if (!subject.trim() || !message.trim()) return;
        addTicket({ tipo: 'chamado', authorRole: userRole, authorName: userName, subject: `[${categoria}] ${subject}`, message });
        setSubject('');
        setMessage('');
        setCategoria('Problema técnico');
        setSubmitted(true);
        setTimeout(() => { setSubmitted(false); setActiveTab('historico'); refreshTickets(); }, 1800);
    };

    const handleSendChat = (chatText: string) => {
        if (!selectedTicket) return;
        addTicketReply(selectedTicket.id, {
            author: userName,
            authorRole: userRole,
            text: chatText,
        });
        refreshTickets();
    };

    const handleSelectTicket = (t: StoredTicket) => {
        if (t.hasUnreadReply) {
            markTicketRepliesRead(t.id);
        }
        setSelectedTicket(t);
        refreshTickets();
    };

    const unreadCount = tickets.filter(t => t.hasUnreadReply).length;

    const CATEGORIAS = [
        'Problema técnico', 'Dúvida sobre o sistema', 'Erro de acesso',
        'Sugestão de melhoria', 'Problema com paciente', 'Outro',
    ];

    return (
        <div className="w-full min-h-screen bg-[#F1F5F9]" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">

                {/* Header */}
                <div className="mb-7 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1D3461] flex items-center justify-center shadow">
                        <LifeBuoy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-[13px] font-black text-[#0F172A] leading-tight">Suporte Técnico</h1>
                        <p className="text-[11px] font-medium text-[#64748B]">Abra chamados ou tire dúvidas diretamente com a equipe de suporte.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-[#E2E8F0] w-fit shadow-sm">
                    {([
                        { id: 'chamado', label: 'Abrir Chamado', icon: PlusCircle },
                        { id: 'historico', label: `Meus Chamados${unreadCount > 0 ? ` (${unreadCount})` : ''}`, icon: Clock },
                    ] as const).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-all"
                            style={{
                                backgroundColor: activeTab === tab.id ? '#1D3461' : 'transparent',
                                color: activeTab === tab.id ? 'white' : '#64748B',
                            }}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                            {tab.id === 'historico' && unreadCount > 0 && (
                                <Bell className="w-3 h-3 text-yellow-400" />
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Abrir Chamado ── */}
                {activeTab === 'chamado' && (
                    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden max-w-2xl">
                        <div
                            className="px-6 py-5 border-b border-[#E2E8F0]"
                            style={{ borderLeft: '3px solid #1D3461' }}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <AlignLeft className="w-4 h-4 text-[#1D3461]" />
                                <h2 className="text-[12px] font-bold text-[#0F172A] uppercase tracking-wide">Novo Chamado</h2>
                            </div>
                            <p className="text-[11px] text-[#64748B]">Descreva o problema ou dúvida. O suporte responderá em até 24h úteis.</p>
                        </div>

                        <div className="px-6 py-6 space-y-5">
                            {/* Categoria */}
                            <div>
                                <label className="block text-[11px] font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Categoria</label>
                                <div className="relative">
                                    <select
                                        value={categoria}
                                        onChange={e => setCategoria(e.target.value)}
                                        className="w-full appearance-none pl-3 pr-8 py-2.5 border border-[#E2E8F0] rounded-xl text-[12px] font-medium text-[#0F172A] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#1D3461] transition-all"
                                    >
                                        {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                    <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
                                </div>
                            </div>

                            {/* Assunto */}
                            <div>
                                <label className="block text-[11px] font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Assunto</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    placeholder="Ex: Não consigo acessar a tela de triagem"
                                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-[12px] text-[#0F172A] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#1D3461] transition-all"
                                />
                            </div>

                            {/* Descrição */}
                            <div>
                                <label className="block text-[11px] font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Descrição detalhada</label>
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    rows={5}
                                    placeholder="Descreva o problema com o máximo de detalhes possível…"
                                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-[12px] text-[#0F172A] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#1D3461] resize-none transition-all"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                onClick={handleSubmitChamado}
                                disabled={!subject.trim() || !message.trim() || submitted}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[12px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    backgroundColor: submitted ? '#ECFDF5' : '#1D3461',
                                    color: submitted ? '#059669' : 'white',
                                    border: submitted ? '1px solid #A7F3D0' : 'none',
                                }}
                            >
                                {submitted
                                    ? <><CheckCircle className="w-4 h-4" /> Chamado enviado com sucesso!</>
                                    : <><Send className="w-4 h-4" /> Enviar Chamado</>
                                }
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Histórico / Chat ── */}
                {activeTab === 'historico' && (
                    <div className="flex gap-4 h-[600px]">
                        {/* Left list */}
                        <div className="w-80 flex-shrink-0 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
                            <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                                <p className="text-[11px] font-bold text-[#475569] uppercase tracking-wide">Todos os chamados</p>
                            </div>
                            <div className="flex-1 overflow-y-auto divide-y divide-[#F1F5F9]">
                                {tickets.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
                                        <LifeBuoy className="w-8 h-8 text-[#CBD5E1] mb-3" />
                                        <p className="text-[12px] font-bold text-[#94A3B8]">Nenhum chamado aberto</p>
                                        <p className="text-[11px] text-[#CBD5E1] mt-1">Abra seu primeiro chamado na aba ao lado.</p>
                                    </div>
                                ) : (
                                    tickets.map(ticket => {
                                        const st = STATUS_CONFIG[ticket.status];
                                        const isSelected = selectedTicket?.id === ticket.id;
                                        return (
                                            <button
                                                key={ticket.id}
                                                onClick={() => handleSelectTicket(ticket)}
                                                className="w-full text-left px-4 py-3.5 transition-colors relative"
                                                style={{ backgroundColor: isSelected ? '#EEF4FA' : 'transparent' }}
                                                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = '#F8FAFC'; }}
                                                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                                            >
                                                {ticket.hasUnreadReply && (
                                                    <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#D97706]" />
                                                )}
                                                <p className="text-[11px] font-bold text-[#0F172A] truncate pr-4">{ticket.subject}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span
                                                        className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                                        style={{ color: st.color, backgroundColor: st.bg }}
                                                    >
                                                        {st.label}
                                                    </span>
                                                    <span className="text-[10px] text-[#94A3B8]">{ticket.createdAt}</span>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Right: chat */}
                        <div className="flex-1 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
                            {selectedTicket ? (
                                <ChatThread
                                    ticket={selectedTicket}
                                    onReply={handleSendChat}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center px-8">
                                    <MessageSquare className="w-10 h-10 text-[#CBD5E1] mb-3" />
                                    <p className="text-[12px] font-bold text-[#94A3B8]">Selecione um chamado</p>
                                    <p className="text-[11px] text-[#CBD5E1] mt-1">Clique em um chamado à esquerda para ver a conversa.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuporteTecnicoPage;
