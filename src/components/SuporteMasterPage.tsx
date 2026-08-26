import React, { useState, useEffect, useRef } from 'react';
import {
    LifeBuoy, Send, CheckCircle, Clock, MessageSquare,
    Filter, User, AlertCircle, ChevronDown,
} from 'lucide-react';
import {
    getTickets, addTicketReply, updateTicketStatus,
} from '../utils/patientStore';
import type { StoredTicket } from '../utils/patientStore';

// ── helpers ─────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
    triador: 'Triador',
    parecerista: 'Parecerista',
    telemedicina: 'Telemedicina',
    gestor_master: 'Gestor Master',
    paciente: 'Paciente',
};

const STATUS_CONFIG: Record<StoredTicket['status'], { label: string; color: string; bg: string; border: string }> = {
    aberto:       { label: 'Aberto',        color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    em_andamento: { label: 'Em andamento',  color: '#1D3461', bg: '#EEF4FA', border: '#A8C4DA' },
    resolvido:    { label: 'Resolvido',     color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
};

const ROLE_COLOR: Record<string, string> = {
    triador: '#7C3AED',
    parecerista: '#1D3461',
    telemedicina: '#0369A1',
    paciente: '#D97706',
    gestor_master: '#059669',
};

type FilterTab = 'todos' | 'chamado' | 'chat' | 'resolvido';

// ── ChatPanel ─────────────────────────────────────────────────────────────────

interface ChatPanelProps {
    ticket: StoredTicket;
    onReply: (text: string) => void;
    onStatusChange: (status: StoredTicket['status']) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ ticket, onReply, onStatusChange }) => {
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
        { author: ticket.authorName, authorRole: ticket.authorRole, text: ticket.message, date: ticket.createdAt, isManager: false },
        ...ticket.replies.map(r => ({
            author: r.author,
            authorRole: r.authorRole,
            text: r.text,
            date: r.date,
            isManager: r.authorRole === 'gestor_master',
        })),
    ];

    const st = STATUS_CONFIG[ticket.status];

    return (
        <div className="flex flex-col h-full">
            {/* Panel header */}
            <div
                className="px-5 py-4 border-b border-[#E2E8F0] bg-white flex items-start justify-between gap-3"
                style={{ borderLeft: '3px solid #1D3461' }}
            >
                <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-black text-[#0F172A] leading-snug truncate">{ticket.subject}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span
                            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border"
                            style={{ color: ROLE_COLOR[ticket.authorRole] || '#475569', backgroundColor: 'white', borderColor: '#E2E8F0' }}
                        >
                            <User className="w-3 h-3" />
                            {ticket.authorName} · {ROLE_LABELS[ticket.authorRole] || ticket.authorRole}
                        </span>
                        <span className="text-[10px] text-[#94A3B8]">{ticket.createdAt}</span>
                    </div>
                </div>
                {/* Status dropdown */}
                <div className="relative flex-shrink-0">
                    <select
                        value={ticket.status}
                        onChange={e => onStatusChange(e.target.value as StoredTicket['status'])}
                        className="appearance-none pl-3 pr-7 py-1.5 border rounded-lg text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-[#1D3461] cursor-pointer transition-all"
                        style={{ color: st.color, backgroundColor: st.bg, borderColor: st.border }}
                    >
                        <option value="aberto">Aberto</option>
                        <option value="em_andamento">Em andamento</option>
                        <option value="resolvido">Resolvido</option>
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: st.color }} />
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[#F8FAFC]">
                {allMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.isManager ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className="max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm"
                            style={{
                                backgroundColor: msg.isManager ? '#1D3461' : 'white',
                                color: msg.isManager ? 'white' : '#0F172A',
                                borderBottomRightRadius: msg.isManager ? 4 : 16,
                                borderBottomLeftRadius: msg.isManager ? 16 : 4,
                                border: msg.isManager ? 'none' : '1px solid #E2E8F0',
                            }}
                        >
                            <p className="text-[10px] font-bold mb-1 opacity-70">
                                {msg.isManager ? 'Você (Suporte)' : `${msg.author} · ${ROLE_LABELS[msg.authorRole] || msg.authorRole}`}
                            </p>
                            <p className="text-[12px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            <p className={`text-[10px] mt-1 text-right ${msg.isManager ? 'opacity-60' : 'text-[#94A3B8]'}`}>
                                {msg.date}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Reply */}
            {ticket.status !== 'resolvido' ? (
                <div className="px-4 py-3 bg-white border-t border-[#E2E8F0] flex items-end gap-2">
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Responda ao usuário…"
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
            ) : (
                <div className="px-4 py-3 bg-[#ECFDF5] border-t border-[#A7F3D0] flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#059669]" />
                    <p className="text-[11px] font-bold text-[#059669]">Chamado marcado como resolvido.</p>
                </div>
            )}
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────

const SuporteMasterPage: React.FC = () => {
    const [activeFilter, setActiveFilter] = useState<FilterTab>('todos');
    const [tickets, setTickets] = useState<StoredTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<StoredTicket | null>(null);

    const refreshTickets = () => {
        const all = getTickets();
        setTickets(all);
        if (selectedTicket) {
            const updated = all.find(t => t.id === selectedTicket.id);
            setSelectedTicket(updated || null);
        }
    };

    useEffect(() => { refreshTickets(); }, []);

    const filtered = tickets.filter(t => {
        if (activeFilter === 'todos') return t.status !== 'resolvido';
        if (activeFilter === 'chamado') return t.tipo === 'chamado' && t.status !== 'resolvido';
        if (activeFilter === 'chat') return t.tipo === 'chat' && t.status !== 'resolvido';
        if (activeFilter === 'resolvido') return t.status === 'resolvido';
        return true;
    });

    const handleReply = (text: string) => {
        if (!selectedTicket) return;
        addTicketReply(selectedTicket.id, {
            author: 'Gestor Master',
            authorRole: 'gestor_master',
            text,
        });
        refreshTickets();
    };

    const handleStatusChange = (status: StoredTicket['status']) => {
        if (!selectedTicket) return;
        updateTicketStatus(selectedTicket.id, status);
        refreshTickets();
    };

    const openCount = tickets.filter(t => t.status === 'aberto').length;
    const inProgressCount = tickets.filter(t => t.status === 'em_andamento').length;
    const resolvedCount = tickets.filter(t => t.status === 'resolvido').length;

    const FILTER_TABS: { id: FilterTab; label: string }[] = [
        { id: 'todos', label: `Abertos (${openCount + inProgressCount})` },
        { id: 'chamado', label: 'Chamados' },
        { id: 'chat', label: 'Chats' },
        { id: 'resolvido', label: `Resolvidos (${resolvedCount})` },
    ];

    return (
        <div className="w-full min-h-screen bg-[#F1F5F9]" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">

                {/* Header */}
                <div className="mb-7 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#1D3461] flex items-center justify-center shadow">
                            <LifeBuoy className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-[13px] font-black text-[#0F172A] leading-tight">Central de Suporte</h1>
                            <p className="text-[11px] font-medium text-[#64748B]">Gerencie os chamados e conversas da equipe e pacientes.</p>
                        </div>
                    </div>

                    {/* KPI badges */}
                    <div className="hidden md:flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-2 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl">
                            <AlertCircle className="w-3.5 h-3.5 text-[#D97706]" />
                            <span className="text-[11px] font-bold text-[#D97706]">{openCount} abertos</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-[#EEF4FA] border border-[#A8C4DA] rounded-xl">
                            <Clock className="w-3.5 h-3.5 text-[#1D3461]" />
                            <span className="text-[11px] font-bold text-[#1D3461]">{inProgressCount} em andamento</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl">
                            <CheckCircle className="w-3.5 h-3.5 text-[#059669]" />
                            <span className="text-[11px] font-bold text-[#059669]">{resolvedCount} resolvidos</span>
                        </div>
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1 mb-5 bg-white rounded-xl p-1 border border-[#E2E8F0] w-fit shadow-sm">
                    {FILTER_TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilter(tab.id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-all"
                            style={{
                                backgroundColor: activeFilter === tab.id ? '#1D3461' : 'transparent',
                                color: activeFilter === tab.id ? 'white' : '#64748B',
                            }}
                        >
                            <Filter className="w-3 h-3" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Two-column layout */}
                <div className="flex gap-4 h-[620px]">
                    {/* Ticket list */}
                    <div className="w-80 flex-shrink-0 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
                        <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                            <p className="text-[11px] font-bold text-[#475569] uppercase tracking-wide">
                                {filtered.length} {filtered.length === 1 ? 'chamado' : 'chamados'}
                            </p>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-[#F1F5F9]">
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
                                    <CheckCircle className="w-8 h-8 text-[#CBD5E1] mb-3" />
                                    <p className="text-[12px] font-bold text-[#94A3B8]">Nenhum chamado aqui</p>
                                </div>
                            ) : (
                                filtered.map(ticket => {
                                    const st = STATUS_CONFIG[ticket.status];
                                    const isSelected = selectedTicket?.id === ticket.id;
                                    return (
                                        <button
                                            key={ticket.id}
                                            onClick={() => setSelectedTicket(ticket)}
                                            className="w-full text-left px-4 py-3.5 transition-colors"
                                            style={{ backgroundColor: isSelected ? '#EEF4FA' : 'transparent' }}
                                            onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = '#F8FAFC'; }}
                                            onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                                        >
                                            <div className="flex items-start gap-2">
                                                <div
                                                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-[10px] font-black"
                                                    style={{ backgroundColor: ROLE_COLOR[ticket.authorRole] || '#94A3B8' }}
                                                >
                                                    {ticket.authorName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] font-bold text-[#0F172A] truncate">{ticket.subject}</p>
                                                    <p className="text-[10px] text-[#64748B] truncate">
                                                        {ticket.authorName} · {ROLE_LABELS[ticket.authorRole] || ticket.authorRole}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span
                                                            className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                                            style={{ color: st.color, backgroundColor: st.bg }}
                                                        >
                                                            {st.label}
                                                        </span>
                                                        <span className="text-[10px] text-[#CBD5E1]">{ticket.createdAt}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 ml-1">
                                                    {ticket.tipo === 'chat'
                                                        ? <MessageSquare className="w-3 h-3 text-[#94A3B8]" />
                                                        : <AlertCircle className="w-3 h-3 text-[#94A3B8]" />
                                                    }
                                                </div>
                                            </div>
                                            {ticket.replies.length > 0 && (
                                                <p className="text-[10px] text-[#94A3B8] mt-1.5 pl-9 truncate">
                                                    {ticket.replies.length} {ticket.replies.length === 1 ? 'resposta' : 'respostas'}
                                                </p>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Chat panel */}
                    <div className="flex-1 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
                        {selectedTicket ? (
                            <ChatPanel
                                ticket={selectedTicket}
                                onReply={handleReply}
                                onStatusChange={handleStatusChange}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center px-8">
                                <LifeBuoy className="w-12 h-12 text-[#CBD5E1] mb-4" />
                                <p className="text-[13px] font-bold text-[#94A3B8]">Selecione um chamado</p>
                                <p className="text-[11px] text-[#CBD5E1] mt-1 max-w-xs">
                                    Clique em qualquer chamado da lista para abrir a conversa e responder.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuporteMasterPage;
