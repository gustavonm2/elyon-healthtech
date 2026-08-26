import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Clock, Building2, MapPin, AlertTriangle, Timer, History, Users
} from 'lucide-react';
import {
    getCurrentCall, getTriagedQueue, getCallHistory,
    RISK_COLORS, MANCHESTER_MAX_WAIT, type TriagedPatient
} from '../utils/upaQueueStore';

// ── Animations ───────────────────────────────────────────────────────────────
const TV_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

@keyframes tvSlideUp {
    0% { transform: translateY(60px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
}
@keyframes tvFadeIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
}
@keyframes tvPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.04); }
}
@keyframes tvBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}
@keyframes riskPulse {
    0%, 100% { box-shadow: 0 0 0 0 var(--pulse-color); }
    50% { box-shadow: 0 0 0 16px var(--pulse-color); }
}
@keyframes bellSwing {
    0% { transform: rotate(0deg); }
    15% { transform: rotate(14deg); }
    30% { transform: rotate(-12deg); }
    45% { transform: rotate(8deg); }
    60% { transform: rotate(-6deg); }
    75% { transform: rotate(3deg); }
    100% { transform: rotate(0deg); }
}
@keyframes alertFlash {
    0%, 100% { background-color: rgba(220, 38, 38, 0.08); }
    50% { background-color: rgba(220, 38, 38, 0.2); }
}
@keyframes ticker {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
}
`;

// ── Wait time helpers ────────────────────────────────────────────────────────

function parseArrivalToMinutes(arrivalTime: string): number {
    const [h, m] = arrivalTime.split(':').map(Number);
    return h * 60 + m;
}

function getWaitMinutes(arrivalTime: string): number {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const arrivalMinutes = parseArrivalToMinutes(arrivalTime);
    let diff = nowMinutes - arrivalMinutes;
    if (diff < 0) diff += 24 * 60; // crossed midnight
    return diff;
}

function formatWaitTime(minutes: number): string {
    if (minutes < 1) return 'Agora';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}min`;
    return `${m}min`;
}

function isWaitExceeded(patient: TriagedPatient): boolean {
    const maxWait = MANCHESTER_MAX_WAIT[patient.riskClassification] ?? 240;
    return getWaitMinutes(patient.arrivalTime) > maxWait;
}

// ── Component ────────────────────────────────────────────────────────────────

const PainelChamadaTV: React.FC = () => {
    const [currentCall, setCurrentCall] = useState<TriagedPatient | null>(getCurrentCall());
    const [queue, setQueue] = useState<TriagedPatient[]>([]);
    const [history, setHistory] = useState<TriagedPatient[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isNewCall, setIsNewCall] = useState(false);
    const lastSpokenCallRef = useRef<string | null>(null);

    // ── TTS voice call ───────────────────────────────────────────────────────
    const speakPatientCall = useCallback((patient: TriagedPatient) => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();

        const callId = `${patient.id}-${patient.calledAt}`;
        if (lastSpokenCallRef.current === callId) return;
        lastSpokenCallRef.current = callId;

        const buildUtterance = (text: string, rate = 0.82) => {
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'pt-BR';
            u.rate = rate;
            u.pitch = 1.0;
            u.volume = 1.0;
            const voices = window.speechSynthesis.getVoices();
            const v = voices.find(v => v.lang.startsWith('pt-BR'))
                || voices.find(v => v.lang.startsWith('pt'));
            if (v) u.voice = v;
            return u;
        };

        const announce = () => {
            const main = buildUtterance(
                `Atenção! Paciente ${patient.name}. Por favor, dirija-se ao ${patient.destination}. Paciente ${patient.name}, ${patient.destination}.`
            );
            window.speechSynthesis.speak(main);
            main.onend = () => {
                setTimeout(() => {
                    window.speechSynthesis.speak(
                        buildUtterance(`Chamando novamente: ${patient.name}. Compareça ao ${patient.destination}, por favor.`, 0.85)
                    );
                }, 2500);
            };
        };

        if (window.speechSynthesis.getVoices().length > 0) announce();
        else window.speechSynthesis.onvoiceschanged = announce;
    }, []);

    // ── Clock ────────────────────────────────────────────────────────────────
    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    // ── Data polling (cross-tab support) ─────────────────────────────────────
    const refreshData = useCallback(() => {
        const call = getCurrentCall();
        setQueue(getTriagedQueue().filter(p => p.status === 'aguardando'));
        setHistory(getCallHistory().slice(0, 8));

        if (call && call.calledAt) {
            const callId = `${call.id}-${call.calledAt}`;
            if (lastSpokenCallRef.current !== callId) {
                setCurrentCall(call);
                setIsNewCall(true);
                speakPatientCall(call);
                setTimeout(() => setIsNewCall(false), 6000);
            }
        }
        setCurrentCall(call);
    }, [speakPatientCall]);

    useEffect(() => {
        refreshData();
        const i = setInterval(refreshData, 2000);
        return () => clearInterval(i);
    }, [refreshData]);

    // ── Same-tab event listener ──────────────────────────────────────────────
    useEffect(() => {
        const handler = (e: Event) => {
            const patient = (e as CustomEvent<TriagedPatient>).detail;
            setCurrentCall(patient);
            setIsNewCall(true);
            refreshData();

            try {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(523, ctx.currentTime);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                osc.start(ctx.currentTime);
                osc.frequency.setValueAtTime(659, ctx.currentTime + 0.2);
                osc.frequency.setValueAtTime(784, ctx.currentTime + 0.4);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
                osc.stop(ctx.currentTime + 0.7);
                setTimeout(() => speakPatientCall(patient), 800);
            } catch {
                speakPatientCall(patient);
            }

            setTimeout(() => setIsNewCall(false), 6000);
        };
        window.addEventListener('upa-patient-called', handler);
        return () => window.removeEventListener('upa-patient-called', handler);
    }, [refreshData, speakPatientCall]);

    // ── Derived ──────────────────────────────────────────────────────────────
    const rc = currentCall ? RISK_COLORS[currentCall.riskClassification] : null;
    const exceededPatients = queue.filter(isWaitExceeded);

    return (
        <>
            <style>{TV_STYLES}</style>
            <div
                className="w-full h-screen flex flex-col overflow-hidden transition-colors duration-300"
                style={{
                    fontFamily: 'Inter, sans-serif',
                    backgroundColor: 'var(--color-page-bg)',
                    color: 'var(--color-text-primary)',
                }}
            >
                {/* ═══════════════════ HEADER ═══════════════════ */}
                <header
                    className="flex items-center justify-between px-10 py-5 flex-shrink-0 transition-colors duration-300"
                    style={{
                        backgroundColor: 'var(--color-card-bg)',
                        borderBottom: '1px solid var(--color-border)',
                    }}
                >
                    <div className="flex items-center gap-5">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                            style={{ 
                                background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', 
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)' 
                            }}
                        >
                            <Building2 className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 
                                className="text-[26px] font-black tracking-tight leading-tight"
                                style={{ color: 'var(--color-text-primary)' }}
                            >
                                Seja Bem-vindo à UPA de Lagarto
                            </h1>
                            <p className="text-[13px] font-medium mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                Painel de Chamada de Pacientes
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        {/* Exceeded alert */}
                        {exceededPatients.length > 0 && (
                            <div
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-200"
                                style={{ animation: 'alertFlash 1.5s ease-in-out infinite' }}
                            >
                                <AlertTriangle className="w-4 h-4 text-red-600" style={{ animation: 'bellSwing 1s ease-in-out infinite' }} />
                                <span className="text-[12px] font-bold text-red-700">{exceededPatients.length} espera excedida</span>
                            </div>
                        )}

                        {/* Queue count */}
                        <div 
                            className="flex items-center gap-2 px-4 py-2 rounded-xl" 
                            style={{ backgroundColor: 'var(--color-primary-light)', border: '1px solid var(--color-border)' }}
                        >
                            <Users className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                            <span className="text-[14px] font-bold" style={{ color: 'var(--color-primary)' }}>{queue.length}</span>
                            <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>na fila</span>
                        </div>

                        {/* Clock */}
                        <div className="text-right">
                            <p className="text-[32px] font-black tabular-nums leading-none" style={{ color: 'var(--color-primary)' }}>
                                {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-[12px] font-semibold mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                            </p>
                        </div>
                    </div>
                </header>

                {/* ═══════════════════ MAIN ═══════════════════ */}
                <div className="flex-1 flex gap-5 p-5 overflow-hidden">

                    {/* ─── LEFT: Paciente Chamado ─── */}
                    <div className="flex-1 flex flex-col gap-5">

                        {currentCall && rc ? (
                            <div
                                className="flex-1 rounded-3xl flex flex-col overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.04)]"
                                style={{
                                    backgroundColor: 'var(--color-card-bg)',
                                    border: `2px solid ${rc.solid}35`,
                                    animation: isNewCall ? 'tvPulse 0.8s ease-in-out 3' : 'none',
                                }}
                            >
                                {/* "Chamando" top bar */}
                                <div
                                    className="flex items-center justify-between px-8 py-4 flex-shrink-0"
                                    style={{ 
                                        background: `linear-gradient(90deg, ${rc.solid}15, ${rc.solid}05)`, 
                                        borderBottom: `1px solid ${rc.solid}25` 
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: rc.solid, animation: isNewCall ? 'tvBlink 0.6s ease-in-out 6' : 'none' }}
                                        />
                                        <span
                                            className="text-[18px] font-black uppercase tracking-[0.2em]"
                                            style={{ color: rc.solid }}
                                        >
                                            Chamando Paciente
                                        </span>
                                    </div>
                                    <span className="text-[13px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                                        {currentCall.calledAt
                                            ? new Date(currentCall.calledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                            : ''}
                                    </span>
                                </div>

                                {/* Patient Info — clean and large */}
                                <div
                                    className="flex-1 flex flex-col justify-center px-10 py-8"
                                    style={{ animation: isNewCall ? 'tvSlideUp 0.5s ease-out' : 'tvFadeIn 0.3s ease-out' }}
                                >
                                    {/* Name */}
                                    <h2 
                                        className="text-[56px] font-black leading-[1.1] tracking-tight mb-6"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        {currentCall.name}
                                    </h2>

                                    {/* Risk + Destination cards */}
                                    <div className="flex items-stretch gap-5">
                                        {/* Risk Classification */}
                                        <div
                                            className="rounded-2xl px-8 py-6 flex items-center gap-5"
                                            style={{
                                                backgroundColor: rc.bg,
                                                border: `1px solid ${rc.solid}30`,
                                                '--pulse-color': `${rc.solid}20`,
                                            } as React.CSSProperties}
                                        >
                                            <div
                                                className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
                                                style={{
                                                    backgroundColor: rc.solid,
                                                    boxShadow: `0 8px 24px ${rc.solid}35`,
                                                    animation: currentCall.riskClassification === 'Vermelho' ? 'riskPulse 2s ease-in-out infinite' : 'none',
                                                    '--pulse-color': `${rc.solid}25`,
                                                } as React.CSSProperties}
                                            >
                                                <AlertTriangle className="w-10 h-10 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: rc.text }}>Classificação</p>
                                                <p className="text-[32px] font-black leading-none" style={{ color: rc.solid }}>
                                                    {currentCall.riskClassification}
                                                </p>
                                                <p className="text-[15px] font-semibold mt-1" style={{ color: rc.text }}>{currentCall.riskLabel}</p>
                                            </div>
                                        </div>

                                        {/* Destination */}
                                        <div
                                            className="rounded-2xl px-8 py-6 flex items-center gap-5 flex-1"
                                            style={{ 
                                                backgroundColor: 'var(--color-primary-light)', 
                                                border: '1px solid var(--color-primary-ring)' 
                                            }}
                                        >
                                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                                                style={{ 
                                                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', 
                                                    boxShadow: '0 4px 15px rgba(0,0,0,0.06)' 
                                                }}
                                            >
                                                <MapPin className="w-8 h-8 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-primary)' }}>Dirija-se ao</p>
                                                <p className="text-[32px] font-black leading-none" style={{ color: 'var(--color-primary-text)' }}>
                                                    {currentCall.destination}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Wait time for current patient */}
                                    {(() => {
                                        const wait = getWaitMinutes(currentCall.arrivalTime);
                                        const exceeded = isWaitExceeded(currentCall);
                                        return (
                                            <div className="mt-6 flex items-center gap-3">
                                                <Timer className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                                                <span className="text-[13px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                                                    Tempo de espera: <span className={`font-bold ${exceeded ? 'text-red-600' : 'text-slate-800'}`}>{formatWaitTime(wait)}</span>
                                                </span>
                                                {exceeded && (
                                                    <span className="text-[11px] font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-lg border border-red-200">
                                                        ⚠ EXCEDIDO (máx. {MANCHESTER_MAX_WAIT[currentCall.riskClassification]}min)
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        ) : (
                            /* No call */
                            <div
                                className="flex-1 rounded-3xl flex flex-col items-center justify-center gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.02)]"
                                style={{ backgroundColor: 'var(--color-card-bg)', border: '2px dashed var(--color-border)' }}
                            >
                                <Building2 className="w-16 h-16" style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
                                <p className="text-[28px] font-bold" style={{ color: 'var(--color-text-muted)' }}>Aguardando Chamada</p>
                                <p className="text-[14px] font-medium" style={{ color: 'var(--color-text-muted)' }}>O próximo paciente aparecerá aqui</p>
                            </div>
                        )}

                        {/* ─── Manchester Legend bar ─── */}
                        <div
                            className="rounded-2xl px-6 py-3 flex items-center gap-6 flex-shrink-0"
                            style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                                Protocolo Manchester
                            </span>
                            {Object.entries(RISK_COLORS).map(([key, val]) => (
                                <div key={key} className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-md flex-shrink-0" style={{ backgroundColor: val.solid }} />
                                    <span className="text-[10px] font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                                        {key} <span style={{ color: 'var(--color-text-muted)' }}>({MANCHESTER_MAX_WAIT[key]}min)</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ─── RIGHT: Fila + Histórico ─── */}
                    <div
                        className="w-[380px] flex-shrink-0 rounded-3xl flex flex-col overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.03)]"
                        style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}
                    >
                        {/* Waiting Queue */}
                        <div className="flex-1 overflow-y-auto px-4 pt-5 pb-3">
                            <div className="flex items-center gap-2 px-2 mb-4">
                                <Clock className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                                <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                                    Fila de Espera ({queue.length})
                                </p>
                            </div>

                            {queue.length === 0 ? (
                                <p className="text-[13px] font-medium text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
                                    Nenhum paciente na fila
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {queue.map((p, idx) => {
                                        const prc = RISK_COLORS[p.riskClassification];
                                        const wait = getWaitMinutes(p.arrivalTime);
                                        const exceeded = isWaitExceeded(p);

                                        return (
                                            <div
                                                key={p.id}
                                                className="rounded-xl px-4 py-3"
                                                style={{
                                                    backgroundColor: exceeded 
                                                        ? 'rgba(220,38,38,0.06)' 
                                                        : idx === 0 
                                                            ? 'var(--color-primary-light)' 
                                                            : 'var(--color-surface)',
                                                    border: exceeded 
                                                        ? '1px solid rgba(220,38,38,0.2)' 
                                                        : `1px solid ${idx === 0 ? 'var(--color-primary-ring)' : 'var(--color-border-light)'}`,
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* Risk dot */}
                                                    <div
                                                        className="w-4 h-4 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: prc.solid, boxShadow: `0 0 8px ${prc.solid}40` }}
                                                    />
                                                    {/* Name */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                                                            {p.name}
                                                        </p>
                                                        <p className="text-[10px] font-medium truncate" style={{ color: 'var(--color-text-muted)' }}>
                                                            {p.destination}
                                                        </p>
                                                    </div>
                                                    {/* Wait time */}
                                                    <div className="text-right flex-shrink-0">
                                                        <p className={`text-[12px] font-bold tabular-nums ${exceeded ? 'text-red-600' : 'text-slate-700'}`}>
                                                            {formatWaitTime(wait)}
                                                        </p>
                                                        {exceeded && (
                                                            <p className="text-[9px] font-bold text-red-600 mt-0.5">EXCEDIDO</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Separator */}
                        <div className="h-px mx-4" style={{ backgroundColor: 'var(--color-border)' }} />

                        {/* Call History */}
                        <div className="px-4 pt-4 pb-5 flex-shrink-0" style={{ maxHeight: '40%', overflowY: 'auto' }}>
                            <div className="flex items-center gap-2 px-2 mb-3">
                                <History className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                                <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                                    Últimas Chamadas
                                </p>
                            </div>

                            {history.length === 0 ? (
                                <p className="text-[12px] font-medium text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
                                    Nenhuma chamada realizada
                                </p>
                            ) : (
                                <div className="space-y-1.5">
                                    {history.map((p, idx) => {
                                        const hrc = RISK_COLORS[p.riskClassification];
                                        return (
                                            <div
                                                key={`${p.id}-${idx}`}
                                                className="rounded-lg px-4 py-2.5 flex items-center gap-3"
                                                style={{
                                                    backgroundColor: 'var(--color-surface)',
                                                    border: '1px solid var(--color-border-light)',
                                                    opacity: 1 - idx * 0.1,
                                                }}
                                            >
                                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: hrc.solid, opacity: 0.7 }} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--color-text-secondary)' }}>
                                                        {p.name}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: 'var(--color-primary)' }}>
                                                    {p.destination}
                                                </span>
                                                <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                                                    {p.calledAt ? new Date(p.calledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ═══════════════════ BOTTOM TICKER ═══════════════════ */}
                <footer
                    className="h-11 flex items-center overflow-hidden flex-shrink-0"
                    style={{ 
                        backgroundColor: 'var(--color-primary)', 
                        borderTop: '1px solid var(--color-primary-hover)' 
                    }}
                >
                    <div
                        className="whitespace-nowrap flex items-center gap-8 text-[12px] font-semibold text-white/80"
                        style={{ animation: 'ticker 35s linear infinite' }}
                    >
                        {[0, 1].map(i => (
                            <React.Fragment key={i}>
                                <span>🏥 UPA 24 HORAS DE LAGARTO</span>
                                <span>·</span>
                                <span>Aguarde ser chamado pelo painel e dirija-se ao local indicado</span>
                                <span>·</span>
                                <span>Atendimento por ordem de classificação de risco</span>
                                <span>·</span>
                                <span>Em caso de emergência, procure a recepção imediatamente</span>
                                <span>·</span>
                            </React.Fragment>
                        ))}
                    </div>
                </footer>
            </div>
        </>
    );
};

export default PainelChamadaTV;
