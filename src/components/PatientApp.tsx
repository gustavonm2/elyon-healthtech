import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    Home, Calendar, Mic, User, Bell, ChevronRight, Pill, FlaskConical,
    FileText, Stethoscope, Video, Heart, Clock, CheckCircle, AlertCircle,
    Phone, Mail, MapPin, Droplets, Shield, ArrowLeft, Volume2, Loader2,
    MicOff, KeyRound, MessageSquare, Activity, Plus, Star, LogOut,
    Eye, EyeOff, Lock, Smartphone, ArrowRight, Sparkles, X as XIcon, UserPlus,
    Trash2, ToggleLeft, ToggleRight, ClipboardList, Brain, Dumbbell, Moon,
    Coffee, Cigarette, Wine, HeartPulse, Siren, CreditCard
} from 'lucide-react';
import {
    loginPatient, registerPatient, calculateAge, formatCPF, maskCPF,
    listMedications, addMedication, toggleMedication, deleteMedication,
    getHealthProfile, upsertHealthProfile, logLizInteraction,
    type Patient, type PatientInsert, type Medication, type MedicationInsert, type HealthProfile
} from '../services/patientService';
import { PrescricoesScreenLive, TriagemSaudeScreen } from './PatientScreens';
import { PatientCardScreen } from './PatientCardScreen';

// ── Types ────────────────────────────────────────────────────────────────────────
type AppScreen = 'splash' | 'login' | 'register' | 'home' | 'consultas' | 'liz' | 'perfil' | 'prescricoes' | 'exames' | 'triagem' | 'cartao';
type LizOrbState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';

interface ConversationEntry {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    timestamp: string;
}

interface ClinicalContext {
    patientName: string;
    patientAge: number;
    bloodType: string;
    nextAppointment: string;
    activeMeds: number;
    activeMedsList: string[];
    pendingExams: number;
    pendingExamsList: string[];
    availableResults: number;
    recentComplaints: string[];
}

// ── Mock Data ────────────────────────────────────────────────────────────────────
const PATIENT = {
    name: 'Carlos Eduardo',
    fullName: 'Carlos Eduardo Lima',
    initials: 'CE',
    birthDate: '14/03/1985',
    age: 41,
    cpf: '***.***.456-**',
    phone: '(11) 98765-4321',
    email: 'carlos.lima@email.com',
    city: 'São Paulo - SP',
    bloodType: 'A+',
    avatar: null as string | null,
};

const NEXT_APPOINTMENTS = [
    { id: 'a1', specialty: 'Cardiologia', doctor: 'Dr. Marcelo Ferreira', date: '28/08/2026', time: '09:30', status: 'Confirmada', type: 'Presencial' },
    { id: 'a2', specialty: 'Clínica Geral', doctor: 'Dra. Ana Paula Rocha', date: '05/09/2026', time: '14:00', status: 'Agendada', type: 'Teleconsulta' },
];

const HISTORY = [
    { id: 'h1', specialty: 'Cardiologia', doctor: 'Dr. Marcelo Ferreira', date: '10/03/2026', complaint: 'Dor torácica atípica e palpitações.' },
    { id: 'h2', specialty: 'Clínica Geral', doctor: 'Dra. Ana Paula Rocha', date: '02/02/2026', complaint: 'Cefaleia frontal recorrente.' },
    { id: 'h3', specialty: 'Clínica Geral', doctor: 'Dr. Ricardo Lemos', date: '12/11/2025', complaint: 'Check-up anual de rotina.' },
];

const PRESCRIPTIONS = [
    { id: 'rx1', med: 'AAS 100mg', dosage: '1 comp/dia após o jantar', doctor: 'Dr. Marcelo Ferreira', date: '10/03/2026', active: true },
    { id: 'rx2', med: 'Atenolol 25mg', dosage: '1 comp/dia pela manhã', doctor: 'Dr. Marcelo Ferreira', date: '10/03/2026', active: true },
    { id: 'rx3', med: 'Dipirona 500mg', dosage: '1 comp a cada 8h se dor', doctor: 'Dra. Ana Paula Rocha', date: '02/02/2026', active: false },
];

const EXAMS = [
    { id: 'ex1', name: 'Holter 24 horas', date: '10/03/2026', doctor: 'Dr. Marcelo Ferreira', status: 'Pendente' },
    { id: 'ex2', name: 'Ecocardiograma', date: '10/03/2026', doctor: 'Dr. Marcelo Ferreira', status: 'Pendente' },
    { id: 'ex3', name: 'Hemograma Completo', date: '02/02/2026', doctor: 'Dra. Ana Paula Rocha', status: 'Resultado Disponível' },
    { id: 'ex4', name: 'Glicemia em Jejum', date: '02/02/2026', doctor: 'Dra. Ana Paula Rocha', status: 'Resultado Disponível' },
];

const NOTIFICATIONS = [
    { id: 'n1', text: 'Sua consulta de Cardiologia é em 3 dias.', time: '2h atrás', read: false },
    { id: 'n2', text: 'Resultado do Hemograma Completo está disponível.', time: '1 dia', read: false },
    { id: 'n3', text: 'Lembrete: Tomar Atenolol 25mg pela manhã.', time: '5h atrás', read: true },
];

// ── Clinical Context Builder ─────────────────────────────────────────────────────
function buildClinicalContext(patient: typeof PATIENT): ClinicalContext {
    const activeMeds = PRESCRIPTIONS.filter((p) => p.active);
    const pendingExams = EXAMS.filter((e) => e.status === 'Pendente');
    const availableResults = EXAMS.filter((e) => e.status === 'Resultado Disponível');
    const apt = NEXT_APPOINTMENTS[0];
    return {
        patientName: patient.name,
        patientAge: patient.age,
        bloodType: patient.bloodType,
        nextAppointment: apt ? `${apt.specialty} com ${apt.doctor} em ${apt.date} às ${apt.time} (${apt.type})` : 'Nenhuma consulta agendada',
        activeMeds: activeMeds.length,
        activeMedsList: activeMeds.map((m) => `${m.med} - ${m.dosage}`),
        pendingExams: pendingExams.length,
        pendingExamsList: pendingExams.map((e) => e.name),
        availableResults: availableResults.length,
        recentComplaints: HISTORY.slice(0, 2).map((h) => `${h.specialty}: ${h.complaint}`),
    };
}

function buildSystemPrompt(ctx: ClinicalContext): string {
    return `Você é a LIZ, assistente de saúde inteligente do sistema ELYON HealthTech.

CONTEXTO CLÍNICO EM TEMPO REAL DO PACIENTE:
Você está atendendo o paciente ${ctx.patientName}, ${ctx.patientAge} anos, tipo sanguíneo ${ctx.bloodType}.
Os dados atuais do painel clínico dele são:
- Próxima consulta: ${ctx.nextAppointment}
- Medicamentos ativos (${ctx.activeMeds}): ${ctx.activeMedsList.join('; ')}
- Exames pendentes (${ctx.pendingExams}): ${ctx.pendingExamsList.join('; ')}
- Resultados disponíveis: ${ctx.availableResults}
- Queixas recentes: ${ctx.recentComplaints.join('; ')}

REGRAS DE COMPORTAMENTO:
1. Sempre cumprimente o paciente pelo primeiro nome.
2. Use os dados clínicos acima para coordenar o cuidado de forma proativa. Cite dados específicos.
3. Responda de forma concisa e humanizada, como em uma conversa oral natural.
4. Não use markdown, asteriscos ou formatação — sua resposta será lida em voz alta.
5. Ao receber relatos de sintomas, oriente com segurança e recomende consulta.
6. Quando perguntado sobre medicações, exames ou consultas, consulte os dados acima.`;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const cfg: Record<string, string> = {
        'Confirmada': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Agendada': 'bg-blue-50 text-blue-700 border-blue-200',
        'Pendente': 'bg-amber-50 text-amber-700 border-amber-200',
        'Resultado Disponível': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg[status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
            {status}
        </span>
    );
};

// Logo component used across screens
const ElyonLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
    const sizes = { sm: 'w-10 h-10', md: 'w-16 h-16', lg: 'w-24 h-24' };
    return <img src="/elyon-logo.jpg" alt="Elyon" className={`${sizes[size]} object-contain rounded-2xl`} />;
};

// ══════════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════════
export const PatientApp: React.FC = () => {
    const [screen, setScreen] = useState<AppScreen>('splash');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loggedPatient, setLoggedPatient] = useState<Patient | null>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState(NOTIFICATIONS);

    // ── LIZ Voice Engine (Top-Level) ─────────────────────────────────────────
    const [orbState, setOrbState] = useState<LizOrbState>('IDLE');
    const [transcript, setTranscript] = useState('');
    const [lizResponse, setLizResponse] = useState('');
    const [conversation, setConversation] = useState<ConversationEntry[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [showKeyInput, setShowKeyInput] = useState(false);

    // ── Proactive Analysis (Background LLM Check) ────────────────────────────
    const [lizProactiveAlert, setLizProactiveAlert] = useState<string | null>(null);

    // ── Patient Data (Medications + Health Profile from Supabase) ─────────────
    const [medications, setMedications] = useState<Medication[]>([]);
    const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);

    const recognitionRef = useRef<any>(null);
    const conversationEndRef = useRef<HTMLDivElement>(null);

    // ── Dynamic Patient Data (from Supabase or fallback to mock) ─────────────
    const patientDisplayData = loggedPatient ? {
        name: loggedPatient.full_name.split(' ').slice(0, 2).join(' '),
        fullName: loggedPatient.full_name,
        initials: loggedPatient.full_name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase(),
        birthDate: new Date(loggedPatient.birth_date).toLocaleDateString('pt-BR'),
        age: calculateAge(loggedPatient.birth_date),
        cpf: maskCPF(loggedPatient.cpf),
        phone: loggedPatient.phone || 'Não informado',
        email: loggedPatient.email || 'Não informado',
        city: `${loggedPatient.city || 'Não informada'}${loggedPatient.state ? ` - ${loggedPatient.state}` : ''}`,
        bloodType: loggedPatient.blood_type || 'Não informado',
        avatar: null as string | null,
    } : PATIENT;

    const clinicalContext = buildClinicalContext(patientDisplayData);
    const systemPrompt = buildSystemPrompt(clinicalContext);

    const unreadCount = notifications.filter((n) => !n.read).length;
    const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    const navigateTo = (s: AppScreen) => { setScreen(s); setShowNotifications(false); };

    // ── Background Proactive Analysis ────────────────────────────────────────
    useEffect(() => {
        if (!isLoggedIn || !apiKey.trim()) return;

        const runSilentLizAnalysis = async () => {
            try {
                const analysisPrompt = `Você é a LIZ, coordenadora de cuidado do sistema ELYON. Analise os seguintes dados do paciente: ${JSON.stringify(clinicalContext)}. Sua tarefa: identifique se há pendências críticas (como exames não realizados, consultas muito próximas, ou medicamentos que precisam de atenção). Se houver, gere UMA frase acolhedora e proativa chamando o paciente pelo primeiro nome e sugerindo o próximo passo lógico para resolver a pendência. Seja breve e humana — a frase será exibida num banner de app mobile. Não use markdown ou asteriscos. Se tudo estiver perfeitamente em dia e sem pendências, retorne EXATAMENTE a palavra NONE.`;

                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            systemInstruction: { parts: [{ text: analysisPrompt }] },
                            contents: [{ role: 'user', parts: [{ text: 'Analise agora os dados do paciente e me diga se há pendências.' }] }],
                        }),
                    }
                );

                if (!res.ok) return;
                const data = await res.json();
                if (!data.candidates?.length) return;
                const text = data.candidates[0].content.parts[0].text.trim();
                if (text && text.toUpperCase() !== 'NONE') {
                    setLizProactiveAlert(text);
                    // Log proactive interaction
                    if (loggedPatient?.id) {
                        logLizInteraction(loggedPatient.id, 'proactive', null, text, 'Alerta Proativo');
                    }
                }
            } catch {
                // Silent fail — proactive analysis is non-blocking
            }
        };

        runSilentLizAnalysis();
    }, [isLoggedIn, apiKey]); // Runs when user logs in AND has API key

    // ── Splash auto-transition ───────────────────────────────────────────────
    useEffect(() => {
        if (screen === 'splash') {
            const timer = setTimeout(() => setScreen('login'), 2500);
            return () => clearTimeout(timer);
        }
    }, [screen]);

    // ── Load Patient Data from Supabase ──────────────────────────────────────
    useEffect(() => {
        if (!loggedPatient) return;
        const loadData = async () => {
            const [meds, profile] = await Promise.all([
                listMedications(loggedPatient.id),
                getHealthProfile(loggedPatient.id),
            ]);
            setMedications(meds);
            setHealthProfile(profile);
        };
        loadData();
    }, [loggedPatient]);

    // ── Login / Logout ───────────────────────────────────────────────────────
    const handleLogin = (patient: Patient) => {
        setLoggedPatient(patient);
        setIsLoggedIn(true);
        setScreen('home');
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setLoggedPatient(null);
        setOrbState('IDLE');
        setConversation([]);
        setTranscript('');
        setLizResponse('');
        setLizProactiveAlert(null);
        window.speechSynthesis?.cancel();
        recognitionRef.current?.stop();
        setScreen('login');
    };

    // ── TTS ──────────────────────────────────────────────────────────────────
    const speakResponse = useCallback((text: string) => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const clean = text.replace(/[*#_>]/g, '').replace(/\s+/g, ' ').trim();
        const utt = new SpeechSynthesisUtterance(clean);
        utt.lang = 'pt-BR';
        utt.rate = 0.82;
        utt.pitch = 1.0;
        const voices = window.speechSynthesis.getVoices();
        const pt = voices.find((v) => v.lang.startsWith('pt-BR')) || voices.find((v) => v.lang.startsWith('pt'));
        if (pt) utt.voice = pt;
        utt.onstart = () => setOrbState('SPEAKING');
        utt.onend = () => setOrbState('IDLE');
        utt.onerror = () => setOrbState('IDLE');
        if (voices.length > 0) { window.speechSynthesis.speak(utt); }
        else {
            window.speechSynthesis.onvoiceschanged = () => {
                const v2 = window.speechSynthesis.getVoices();
                const pt2 = v2.find((x) => x.lang.startsWith('pt-BR')) || v2.find((x) => x.lang.startsWith('pt'));
                if (pt2) utt.voice = pt2;
                window.speechSynthesis.speak(utt);
            };
        }
    }, []);

    // ── LLM (Gemini with Clinical Context) ───────────────────────────────────
    const queryGemini = useCallback(
        async (userText: string) => {
            setOrbState('THINKING');
            setErrorMessage(null);
            const ts = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const userEntry: ConversationEntry = { id: `usr-${Date.now()}`, role: 'user', text: userText, timestamp: ts };
            const updated = [...conversation, userEntry];
            setConversation(updated);
            setTranscript(userText);
            try {
                const formatted = updated.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
                    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ systemInstruction: { parts: [{ text: systemPrompt }] }, contents: formatted }) }
                );
                if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || 'Erro na API.'); }
                const data = await res.json();
                if (!data.candidates?.length) throw new Error('Sem resposta da API.');
                const texto = data.candidates[0].content.parts[0].text;
                setConversation((prev) => [...prev, { id: `liz-${Date.now()}`, role: 'assistant', text: texto, timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }]);
                setLizResponse(texto);
                speakResponse(texto);
                // Log interaction to Supabase
                if (loggedPatient?.id) {
                    logLizInteraction(loggedPatient.id, 'voice', userText, texto, 'Conversa por Voz');
                }
            } catch (err: any) { setErrorMessage(err.message); setOrbState('IDLE'); }
        }, [apiKey, conversation, speakResponse, systemPrompt]
    );

    // ── STT ──────────────────────────────────────────────────────────────────
    const startListening = useCallback(() => {
        setErrorMessage(null);
        if (!apiKey.trim()) { setErrorMessage('Cole sua chave Gemini no ícone 🔑 na tela da LIZ.'); navigateTo('liz'); setShowKeyInput(true); return; }
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) { setErrorMessage('Use o Google Chrome para reconhecimento de voz.'); return; }
        window.speechSynthesis.cancel();
        const rec = new SR();
        rec.lang = 'pt-BR'; rec.continuous = false; rec.interimResults = true;
        rec.onstart = () => { setOrbState('LISTENING'); setTranscript(''); setLizResponse(''); };
        rec.onresult = (e: any) => {
            let final = '', interim = '';
            for (let i = e.resultIndex; i < e.results.length; i++) { if (e.results[i].isFinal) final += e.results[i][0].transcript; else interim += e.results[i][0].transcript; }
            setTranscript(final || interim);
            if (final.trim()) { rec.stop(); queryGemini(final.trim()); }
        };
        rec.onerror = (e: any) => { if (e.error !== 'no-speech') setErrorMessage(`Erro: ${e.error}`); setOrbState('IDLE'); };
        rec.onend = () => { if (orbState === 'LISTENING') setOrbState('IDLE'); };
        recognitionRef.current = rec;
        rec.start();
    }, [apiKey, orbState, queryGemini]);

    const handleOrbClick = useCallback(() => {
        if (orbState === 'LISTENING') { recognitionRef.current?.stop(); setOrbState('IDLE'); return; }
        if (orbState === 'SPEAKING') { window.speechSynthesis.cancel(); setOrbState('IDLE'); return; }
        if (orbState === 'IDLE') startListening();
    }, [orbState, startListening]);

    const handleFabClick = useCallback(() => {
        if (orbState === 'IDLE') {
            if (!apiKey.trim()) { navigateTo('liz'); setShowKeyInput(true); setErrorMessage('Cole sua chave Gemini para ativar a LIZ.'); return; }
            navigateTo('liz');
            setTimeout(() => startListening(), 300);
        } else if (orbState === 'LISTENING') { recognitionRef.current?.stop(); setOrbState('IDLE'); }
        else if (orbState === 'SPEAKING') { window.speechSynthesis.cancel(); setOrbState('IDLE'); }
    }, [orbState, apiKey, startListening]);

    // ── FAB config ───────────────────────────────────────────────────────────
    const fabConfig: Record<LizOrbState, { bg: string; icon: React.ReactNode; pulse: boolean }> = {
        IDLE: { bg: 'bg-emerald-500 shadow-emerald-500/30', icon: <Mic className="w-6 h-6 text-white" />, pulse: false },
        LISTENING: { bg: 'bg-emerald-500 shadow-emerald-500/50', icon: <Mic className="w-6 h-6 text-white animate-bounce" />, pulse: true },
        THINKING: { bg: 'bg-indigo-600 shadow-indigo-600/50', icon: <Loader2 className="w-6 h-6 text-white animate-spin" />, pulse: true },
        SPEAKING: { bg: 'bg-cyan-500 shadow-cyan-500/50', icon: <Volume2 className="w-6 h-6 text-white" />, pulse: true },
    };
    const fab = fabConfig[orbState];

    // ── Render ───────────────────────────────────────────────────────────────
    const showAppChrome = isLoggedIn && screen !== 'splash' && screen !== 'login' && screen !== 'register';

    return (
        <div className="h-screen w-full bg-[#F0F4F8] font-['Inter',sans-serif] flex justify-center">
            <div className="w-full max-w-md h-full bg-white flex flex-col relative overflow-hidden shadow-2xl">

                <div className="flex-1 overflow-y-auto" style={{ paddingBottom: showAppChrome ? 80 : 0 }}>
                    {screen === 'splash' && <SplashScreen />}
                    {screen === 'login' && <LoginScreen onLogin={handleLogin} onGoToRegister={() => setScreen('register')} />}
                    {screen === 'register' && <RegisterScreen onBack={() => setScreen('login')} onRegisterSuccess={handleLogin} />}
                    {screen === 'home' && (
                        <HomeScreen navigateTo={navigateTo} patient={patientDisplayData} unreadCount={unreadCount}
                            showNotifications={showNotifications} setShowNotifications={setShowNotifications}
                            notifications={notifications} markAllRead={markAllRead} onTalkToLiz={handleFabClick} orbState={orbState}
                            lizProactiveAlert={lizProactiveAlert} onDismissAlert={() => setLizProactiveAlert(null)}
                            healthProfile={healthProfile} />
                    )}
                    {screen === 'consultas' && <ConsultasScreen navigateTo={navigateTo} />}
                    {screen === 'prescricoes' && (
                        <PrescricoesScreenLive navigateTo={navigateTo}
                            medications={medications} setMedications={setMedications}
                            patientId={loggedPatient?.id || null} mockPrescriptions={PRESCRIPTIONS} />
                    )}
                    {screen === 'exames' && <ExamesScreen navigateTo={navigateTo} />}
                    {screen === 'triagem' && loggedPatient && (
                        <TriagemSaudeScreen navigateTo={navigateTo}
                            patientId={loggedPatient.id} patientName={patientDisplayData.name}
                            apiKey={apiKey} healthProfile={healthProfile}
                            setHealthProfile={setHealthProfile} />
                    )}
                    {screen === 'cartao' && loggedPatient && (
                        <PatientCardScreen navigateTo={navigateTo}
                            patient={loggedPatient} healthProfile={healthProfile} />
                    )}
                    {screen === 'liz' && (
                        <LizScreen orbState={orbState} transcript={transcript} lizResponse={lizResponse} conversation={conversation}
                            errorMessage={errorMessage} apiKey={apiKey} setApiKey={setApiKey} showKeyInput={showKeyInput}
                            setShowKeyInput={setShowKeyInput} handleOrbClick={handleOrbClick} conversationEndRef={conversationEndRef}
                            clinicalContext={clinicalContext} />
                    )}
                    {screen === 'perfil' && <PerfilScreen patient={patientDisplayData} onLogout={handleLogout} />}
                </div>

                {/* FAB */}
                {showAppChrome && screen !== 'liz' && (
                    <button onClick={handleFabClick}
                        className={`absolute bottom-24 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90 ${fab.bg} ${fab.pulse ? 'animate-pulse' : ''}`}>
                        {fab.icon}
                        {orbState !== 'IDLE' && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping" />}
                    </button>
                )}

                {/* Bottom Nav */}
                {showAppChrome && (
                    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 pt-2 pb-6 flex items-center justify-around z-40">
                        {([
                            { id: 'home' as AppScreen, icon: Home, label: 'Início' },
                            { id: 'consultas' as AppScreen, icon: Calendar, label: 'Consultas' },
                            { id: 'liz' as AppScreen, icon: Mic, label: 'LIZ', isCenter: true },
                            { id: 'perfil' as AppScreen, icon: User, label: 'Perfil' },
                        ] as const).map((tab) => {
                            const isActive = screen === tab.id;
                            if ('isCenter' in tab && tab.isCenter) {
                                const isBusy = orbState !== 'IDLE';
                                return (
                                    <button key={tab.id} onClick={() => navigateTo(tab.id)}
                                        className={`-mt-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
                                            isBusy
                                                ? orbState === 'LISTENING' ? 'bg-emerald-500 text-white shadow-emerald-500/40 animate-pulse'
                                                : orbState === 'THINKING' ? 'bg-indigo-600 text-white shadow-indigo-600/40 animate-pulse'
                                                : 'bg-cyan-500 text-white shadow-cyan-500/40 animate-pulse'
                                            : isActive ? 'bg-[#1D3461] text-white shadow-[#1D3461]/30'
                                            : 'bg-emerald-500 text-white shadow-emerald-500/30'
                                        }`}>
                                        {isBusy && orbState === 'THINKING' ? <Loader2 className="w-6 h-6 animate-spin" />
                                            : isBusy && orbState === 'SPEAKING' ? <Volume2 className="w-6 h-6" />
                                            : <Mic className="w-6 h-6" />}
                                    </button>
                                );
                            }
                            return (
                                <button key={tab.id} onClick={() => navigateTo(tab.id)}
                                    className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${isActive ? 'text-[#1D3461]' : 'text-slate-400'}`}>
                                    <tab.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                                    <span className={`text-[10px] font-semibold ${isActive ? 'text-[#1D3461]' : 'text-slate-400'}`}>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════════
//  SCREEN: SPLASH
// ══════════════════════════════════════════════════════════════════════════════════
const SplashScreen: React.FC = () => (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0F172A] via-[#1D3461] to-[#0F172A] relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex flex-col items-center animate-fadeIn">
            <img
                src="/elyon-logo.jpg"
                alt="Elyon HealthTech"
                className="w-32 h-32 object-contain rounded-3xl shadow-2xl shadow-blue-500/20 mb-6"
            />
            <h1 className="text-3xl font-bold text-white tracking-wider mb-1">ELYON</h1>
            <p className="text-xs text-blue-300 tracking-[0.3em] font-semibold uppercase">Conecta. Coordena. Eleva.</p>
        </div>

        {/* Loading indicator */}
        <div className="absolute bottom-20 flex flex-col items-center gap-3">
            <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-[10px] text-blue-400/60 font-medium">Carregando sua experiência de saúde...</p>
        </div>
    </div>
);

// ══════════════════════════════════════════════════════════════════════════════════
//  SCREEN: LOGIN
// ══════════════════════════════════════════════════════════════════════════════════
const LoginScreen: React.FC<{ onLogin: (p: Patient) => void; onGoToRegister: () => void }> = ({ onLogin, onGoToRegister }) => {
    const [cpf, setCpf] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        const cleanCpf = cpf.replace(/\D/g, '');
        if (!cleanCpf) { setLoginError('Insira seu CPF.'); return; }
        if (!password.trim()) { setLoginError('Insira sua senha.'); return; }

        setIsLoading(true);
        try {
            const patient = await loginPatient(cleanCpf, password);
            if (!patient) { setLoginError('CPF ou senha incorretos.'); setIsLoading(false); return; }
            onLogin(patient);
        } catch {
            setLoginError('Erro de conexão. Tente novamente.');
        }
        setIsLoading(false);
    };

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="bg-gradient-to-br from-[#1D3461] to-[#0F172A] px-6 pt-14 pb-10 flex flex-col items-center rounded-b-[2.5rem] shadow-lg">
                <img src="/elyon-logo.jpg" alt="Elyon HealthTech" className="w-20 h-20 object-contain rounded-2xl shadow-xl shadow-blue-500/20 mb-4" />
                <h1 className="text-2xl font-bold text-white tracking-wide">ELYON</h1>
                <p className="text-[10px] text-blue-300 tracking-[0.25em] font-semibold uppercase mt-0.5">Portal do Paciente</p>
            </div>

            <div className="flex-1 px-6 pt-8 flex flex-col">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-slate-900">Bem-vindo! 👋</h2>
                    <p className="text-xs text-slate-500 mt-1">Acesse seu painel de saúde digital com CPF e senha.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 flex-1">
                    <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">CPF</label>
                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus-within:border-[#1D3461] focus-within:ring-1 focus-within:ring-[#1D3461]/20 transition-all">
                            <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <input type="text" value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))}
                                placeholder="000.000.000-00" inputMode="numeric"
                                className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none font-medium" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Senha</label>
                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus-within:border-[#1D3461] focus-within:ring-1 focus-within:ring-[#1D3461]/20 transition-all">
                            <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                                placeholder="Digite sua senha"
                                className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none font-medium" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 transition">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {loginError && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{loginError}</span>
                        </div>
                    )}

                    <button type="submit" disabled={isLoading}
                        className="w-full py-4 bg-[#1D3461] hover:bg-[#162749] text-white font-bold text-sm rounded-2xl transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-[#1D3461]/20">
                        {isLoading ? (<><Loader2 className="w-4 h-4 animate-spin" />Entrando...</>) : (<>Entrar<ArrowRight className="w-4 h-4" /></>)}
                    </button>
                </form>

                <div className="py-6 text-center space-y-3">
                    <p className="text-xs text-slate-400">Não tem conta? <button onClick={onGoToRegister} className="text-[#1D3461] font-bold hover:underline">Cadastre-se</button></p>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-slate-300">
                        <Shield className="w-3 h-3" /><span>Protegido por criptografia de ponta-a-ponta</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════════
//  SCREEN: REGISTER (Cadastro Real de Paciente → Supabase)
// ══════════════════════════════════════════════════════════════════════════════════
const RegisterScreen: React.FC<{ onBack: () => void; onRegisterSuccess: (p: Patient) => void }> = ({ onBack, onRegisterSuccess }) => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [regError, setRegError] = useState('');

    // Step 1: Personal
    const [fullName, setFullName] = useState('');
    const [cpf, setCpf] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [gender, setGender] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    // Step 2: Clinical
    const [bloodType, setBloodType] = useState('');
    const [allergiesStr, setAllergiesStr] = useState('');
    const [chronicStr, setChronicStr] = useState('');
    const [emergName, setEmergName] = useState('');
    const [emergPhone, setEmergPhone] = useState('');

    // Step 3: Address + Password
    const [city, setCity] = useState('');
    const [state, setState] = useState('SP');
    const [address, setAddress] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const validateStep1 = () => {
        if (!fullName.trim()) return 'Nome completo é obrigatório.';
        if (cpf.replace(/\D/g, '').length !== 11) return 'CPF deve ter 11 dígitos.';
        if (!birthDate) return 'Data de nascimento é obrigatória.';
        if (!gender) return 'Selecione o gênero.';
        return null;
    };

    const validateStep3 = () => {
        if (!password.trim()) return 'Crie uma senha.';
        if (password.length < 3) return 'Senha deve ter pelo menos 3 caracteres.';
        if (password !== confirmPassword) return 'As senhas não coincidem.';
        return null;
    };

    const handleNext = () => {
        setRegError('');
        if (step === 1) {
            const err = validateStep1();
            if (err) { setRegError(err); return; }
        }
        setStep(step + 1);
    };

    const handleSubmit = async () => {
        setRegError('');
        const err3 = validateStep3();
        if (err3) { setRegError(err3); return; }

        setIsLoading(true);
        const patientData: PatientInsert = {
            full_name: fullName.trim(),
            cpf: cpf.replace(/\D/g, ''),
            birth_date: birthDate,
            gender: gender as any,
            phone: phone || null,
            email: email || null,
            city: city || null,
            state: state || 'SP',
            address: address || null,
            zip_code: zipCode || null,
            blood_type: bloodType || null,
            allergies: allergiesStr ? allergiesStr.split(',').map(a => a.trim()).filter(Boolean) : [],
            chronic_conditions: chronicStr ? chronicStr.split(',').map(c => c.trim()).filter(Boolean) : [],
            emergency_contact_name: emergName || null,
            emergency_contact_phone: emergPhone || null,
            password,
        };

        const { data, error } = await registerPatient(patientData);
        setIsLoading(false);
        if (error) { setRegError(error); return; }
        if (data) onRegisterSuccess(data);
    };

    const inputClass = "flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-[#1D3461] focus-within:ring-1 focus-within:ring-[#1D3461]/20 transition-all";
    const fieldClass = "flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none font-medium";

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="bg-gradient-to-br from-[#1D3461] to-[#0F172A] px-6 pt-12 pb-8 rounded-b-[2.5rem] shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={step > 1 ? () => setStep(step - 1) : onBack} className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-white">Cadastro de Paciente</h1>
                        <p className="text-[10px] text-blue-300">Etapa {step} de 3</p>
                    </div>
                    <img src="/elyon-logo.jpg" alt="Elyon" className="w-10 h-10 rounded-xl" />
                </div>
                {/* Progress */}
                <div className="flex gap-2">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? 'bg-emerald-400' : 'bg-white/10'}`} />
                    ))}
                </div>
            </div>

            <div className="flex-1 px-6 pt-6 pb-4 overflow-y-auto">
                {regError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 mb-4">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{regError}</span>
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-3">
                        <p className="text-sm font-bold text-slate-900 mb-1">Dados Pessoais</p>
                        <div>
                            <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Nome Completo *</label>
                            <div className={inputClass}><User className="w-4 h-4 text-slate-400 flex-shrink-0" /><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ex: Carlos Eduardo Lima" className={fieldClass} /></div>
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">CPF *</label>
                            <div className={inputClass}><Shield className="w-4 h-4 text-slate-400 flex-shrink-0" /><input type="text" value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} placeholder="000.000.000-00" inputMode="numeric" className={fieldClass} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Data Nasc. *</label>
                                <div className={inputClass}><input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={`${fieldClass} text-xs`} /></div>
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Gênero *</label>
                                <select value={gender} onChange={(e) => setGender(e.target.value)} className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none ${!gender ? 'text-slate-400' : ''}`}>
                                    <option value="">Selecione</option>
                                    <option value="masculino">Masculino</option>
                                    <option value="feminino">Feminino</option>
                                    <option value="outro">Outro</option>
                                    <option value="prefiro_nao_dizer">Prefiro não dizer</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Telefone</label>
                            <div className={inputClass}><Phone className="w-4 h-4 text-slate-400 flex-shrink-0" /><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 98765-4321" className={fieldClass} /></div>
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">E-mail</label>
                            <div className={inputClass}><Mail className="w-4 h-4 text-slate-400 flex-shrink-0" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" className={fieldClass} /></div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-3">
                        <p className="text-sm font-bold text-slate-900 mb-1">Dados Clínicos</p>
                        <div>
                            <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Tipo Sanguíneo</label>
                            <select value={bloodType} onChange={(e) => setBloodType(e.target.value)} className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none ${!bloodType ? 'text-slate-400' : ''}`}>
                                <option value="">Selecione</option>
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Não informado'].map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Alergias (separe por vírgula)</label>
                            <div className={inputClass}><AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0" /><input type="text" value={allergiesStr} onChange={(e) => setAllergiesStr(e.target.value)} placeholder="Ex: Dipirona, Penicilina" className={fieldClass} /></div>
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Condições Crônicas (separe por vírgula)</label>
                            <div className={inputClass}><Heart className="w-4 h-4 text-slate-400 flex-shrink-0" /><input type="text" value={chronicStr} onChange={(e) => setChronicStr(e.target.value)} placeholder="Ex: Hipertensão, Diabetes" className={fieldClass} /></div>
                        </div>
                        <p className="text-sm font-bold text-slate-900 mt-4 mb-1">Contato de Emergência</p>
                        <div>
                            <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Nome</label>
                            <div className={inputClass}><User className="w-4 h-4 text-slate-400 flex-shrink-0" /><input type="text" value={emergName} onChange={(e) => setEmergName(e.target.value)} placeholder="Nome do contato" className={fieldClass} /></div>
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Telefone</label>
                            <div className={inputClass}><Phone className="w-4 h-4 text-slate-400 flex-shrink-0" /><input type="tel" value={emergPhone} onChange={(e) => setEmergPhone(e.target.value)} placeholder="(11) 99999-9999" className={fieldClass} /></div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-3">
                        <p className="text-sm font-bold text-slate-900 mb-1">Endereço</p>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Cidade</label>
                                <div className={inputClass}><input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="São Paulo" className={fieldClass} /></div>
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">UF</label>
                                <div className={inputClass}><input type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="SP" maxLength={2} className={fieldClass} /></div>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Endereço</label>
                            <div className={inputClass}><MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" /><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, complemento" className={fieldClass} /></div>
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">CEP</label>
                            <div className={inputClass}><input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="00000-000" className={fieldClass} /></div>
                        </div>
                        <p className="text-sm font-bold text-slate-900 mt-4 mb-1">Criar Senha de Acesso</p>
                        <div>
                            <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Senha *</label>
                            <div className={inputClass}><Lock className="w-4 h-4 text-slate-400 flex-shrink-0" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Crie uma senha" className={fieldClass} /></div>
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Confirmar Senha *</label>
                            <div className={inputClass}><Lock className="w-4 h-4 text-slate-400 flex-shrink-0" /><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha" className={fieldClass} /></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Action */}
            <div className="px-6 pb-6 pt-2">
                {step < 3 ? (
                    <button onClick={handleNext}
                        className="w-full py-4 bg-[#1D3461] hover:bg-[#162749] text-white font-bold text-sm rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-[#1D3461]/20">
                        Próximo <ArrowRight className="w-4 h-4" />
                    </button>
                ) : (
                    <button onClick={handleSubmit} disabled={isLoading}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20">
                        {isLoading ? (<><Loader2 className="w-4 h-4 animate-spin" />Cadastrando...</>) : (<><UserPlus className="w-4 h-4" />Criar Minha Conta</>)}
                    </button>
                )}
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════════
//  SCREEN: HOME
// ══════════════════════════════════════════════════════════════════════════════════
const HomeScreen: React.FC<{
    navigateTo: (s: AppScreen) => void; patient: typeof PATIENT; unreadCount: number;
    showNotifications: boolean; setShowNotifications: (v: boolean) => void;
    notifications: typeof NOTIFICATIONS; markAllRead: () => void;
    onTalkToLiz: () => void; orbState: LizOrbState;
    lizProactiveAlert: string | null; onDismissAlert: () => void;
    healthProfile: HealthProfile | null;
}> = ({ navigateTo, patient, unreadCount, showNotifications, setShowNotifications, notifications, markAllRead, onTalkToLiz, orbState, lizProactiveAlert, onDismissAlert, healthProfile }) => (
    <div className="bg-gradient-to-b from-[#1D3461] to-[#162749] min-h-full">
        <div className="px-5 pt-12 pb-8 text-white">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <ElyonLogo size="sm" />
                    <div>
                        <p className="text-[10px] text-blue-300 font-semibold uppercase tracking-wider">ELYON Health</p>
                        <h1 className="text-lg font-bold leading-tight">Olá, {patient.name} 👋</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                        <Bell className="w-5 h-5 text-white" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center">{unreadCount}</span>
                        )}
                    </button>
                </div>
            </div>

            {showNotifications && (
                <div className="bg-white rounded-2xl p-4 mb-4 shadow-xl text-slate-800 animate-fadeIn">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-slate-900">Notificações</h3>
                        <button onClick={markAllRead} className="text-[10px] font-semibold text-blue-600">Marcar como lidas</button>
                    </div>
                    <div className="space-y-2">
                        {notifications.map((n) => (
                            <div key={n.id} className={`text-xs p-2.5 rounded-xl ${n.read ? 'bg-slate-50 text-slate-500' : 'bg-blue-50 text-slate-800 border border-blue-100'}`}>
                                <p className="leading-relaxed">{n.text}</p>
                                <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── LIZ Proactive Alert Banner ── */}
            {lizProactiveAlert && (
                <div className="mb-4 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 backdrop-blur-sm border border-emerald-400/30 rounded-2xl p-4 relative overflow-hidden">
                    {/* Subtle glow effect */}
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />
                    <div className="flex items-start gap-3 relative z-10">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Sparkles className="w-4 h-4 text-emerald-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">LIZ • Cuidado Proativo</span>
                            </div>
                            <p className="text-xs text-white/90 leading-relaxed">{lizProactiveAlert}</p>
                            <button
                                onClick={onTalkToLiz}
                                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/30 hover:bg-emerald-500/50 border border-emerald-400/30 rounded-full text-[10px] font-bold text-emerald-200 transition-all active:scale-95"
                            >
                                <Mic className="w-3 h-3" />
                                Resolver Agora
                            </button>
                        </div>
                        <button onClick={onDismissAlert} className="p-1 hover:bg-white/10 rounded-lg transition flex-shrink-0">
                            <XIcon className="w-3.5 h-3.5 text-white/40" />
                        </button>
                    </div>
                </div>
            )}

            {NEXT_APPOINTMENTS[0] && (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <p className="text-[10px] uppercase tracking-widest text-blue-200 font-bold mb-2">Próxima Consulta</p>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-base font-bold">{NEXT_APPOINTMENTS[0].specialty}</p>
                            <p className="text-xs text-blue-200">{NEXT_APPOINTMENTS[0].doctor}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold">{NEXT_APPOINTMENTS[0].date}</p>
                            <p className="text-xs text-blue-200">{NEXT_APPOINTMENTS[0].time}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="bg-white rounded-t-3xl -mt-2 px-5 pt-6 pb-4 min-h-[400px]">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Acesso Rápido</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                    { icon: Calendar, label: 'Consultas', color: 'bg-blue-50 text-blue-600 border-blue-100', action: () => navigateTo('consultas') },
                    { icon: Pill, label: 'Prescrições', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', action: () => navigateTo('prescricoes') },
                    { icon: FlaskConical, label: 'Exames', color: 'bg-purple-50 text-purple-600 border-purple-100', action: () => navigateTo('exames') },
                    { icon: CreditCard, label: 'Cartão Saúde', color: 'bg-amber-50 text-amber-600 border-amber-100', action: () => navigateTo('cartao') },
                    { icon: Mic, label: 'Falar com LIZ', color: 'bg-cyan-50 text-cyan-600 border-cyan-100', action: onTalkToLiz, isMic: true },
                ].map((item) => (
                    <button key={item.label} onClick={item.action}
                        className={`flex flex-col items-center gap-2 p-5 rounded-2xl border transition-all active:scale-95 ${item.color} ${
                            (item as any).isMic && orbState === 'THINKING' ? 'animate-pulse ring-2 ring-indigo-400' : ''
                        }`}>
                        {(item as any).isMic && orbState === 'THINKING' ? <Loader2 className="w-7 h-7 animate-spin" />
                            : (item as any).isMic && orbState === 'SPEAKING' ? <Volume2 className="w-7 h-7 animate-pulse" />
                            : <item.icon className="w-7 h-7" />}
                        <span className="text-xs font-bold">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Triage Card */}
            <button onClick={() => navigateTo('triagem')}
                className={`w-full p-4 rounded-2xl border transition-all active:scale-[0.98] mb-6 text-left ${
                    healthProfile?.triage_completed
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 animate-pulse'
                }`}>
                <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        healthProfile?.triage_completed ? 'bg-emerald-100' : 'bg-purple-100'
                    }`}>
                        {healthProfile?.triage_completed
                            ? <CheckCircle className="w-5 h-5 text-emerald-600" />
                            : <ClipboardList className="w-5 h-5 text-purple-600" />}
                    </div>
                    <div className="flex-1">
                        <p className={`text-sm font-bold ${healthProfile?.triage_completed ? 'text-emerald-800' : 'text-purple-800'}`}>
                            {healthProfile?.triage_completed ? '✅ Perfil de Saúde Completo' : '🩺 Triagem de Saúde'}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                            {healthProfile?.triage_completed
                                ? 'Toque para ver seu perfil completo'
                                : 'Conte à LIZ sobre sua rotina e saúde'}
                        </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
            </button>

            <h2 className="text-sm font-bold text-slate-900 mb-3">Resumo de Saúde</h2>
            <div className="space-y-2.5">
                {[
                    { icon: Droplets, label: 'Tipo Sanguíneo', value: patient.bloodType, iconBg: 'bg-red-50 border-red-100', iconColor: 'text-red-500' },
                    { icon: Pill, label: 'Medicamentos Ativos', value: `${PRESCRIPTIONS.filter((p) => p.active).length} medicamentos`, iconBg: 'bg-emerald-50 border-emerald-100', iconColor: 'text-emerald-600' },
                    { icon: FlaskConical, label: 'Exames Pendentes', value: `${EXAMS.filter((e) => e.status === 'Pendente').length} pendentes`, iconBg: 'bg-amber-50 border-amber-100', iconColor: 'text-amber-600' },
                ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${item.iconBg}`}>
                            <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] text-slate-500 font-semibold uppercase">{item.label}</p>
                            <p className="text-sm font-bold text-slate-900">{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// ══════════════════════════════════════════════════════════════════════════════════
//  SCREEN: CONSULTAS
// ══════════════════════════════════════════════════════════════════════════════════
const ConsultasScreen: React.FC<{ navigateTo: (s: AppScreen) => void }> = ({ navigateTo }) => (
    <div className="px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigateTo('home')} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition"><ArrowLeft className="w-5 h-5 text-slate-800" /></button>
            <h1 className="text-lg font-bold text-slate-900">Minhas Consultas</h1>
        </div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Próximas</h2>
        <div className="space-y-3 mb-6">
            {NEXT_APPOINTMENTS.map((apt) => (
                <div key={apt.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                        <div><p className="text-sm font-bold text-slate-900">{apt.specialty}</p><p className="text-xs text-slate-500">{apt.doctor}</p></div>
                        <StatusBadge status={apt.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {apt.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {apt.time}</span>
                        <span className="flex items-center gap-1">{apt.type === 'Teleconsulta' ? <Video className="w-3.5 h-3.5 text-blue-500" /> : <MapPin className="w-3.5 h-3.5" />}{apt.type}</span>
                    </div>
                </div>
            ))}
        </div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Histórico</h2>
        <div className="space-y-2.5">
            {HISTORY.map((h) => (
                <div key={h.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="flex items-center justify-between mb-1"><p className="text-sm font-bold text-slate-800">{h.specialty}</p><span className="text-[10px] text-slate-500">{h.date}</span></div>
                    <p className="text-xs text-slate-500 mb-1">{h.doctor}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{h.complaint}</p>
                </div>
            ))}
        </div>
    </div>
);

// ══════════════════════════════════════════════════════════════════════════════════
//  SCREEN: PRESCRIÇÕES
// ══════════════════════════════════════════════════════════════════════════════════
const PrescricoesScreen: React.FC<{ navigateTo: (s: AppScreen) => void }> = ({ navigateTo }) => (
    <div className="px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigateTo('home')} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition"><ArrowLeft className="w-5 h-5 text-slate-800" /></button>
            <h1 className="text-lg font-bold text-slate-900">Minhas Prescrições</h1>
        </div>
        <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Ativas</h2>
        <div className="space-y-3 mb-6">
            {PRESCRIPTIONS.filter((p) => p.active).map((rx) => (
                <div key={rx.id} className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Pill className="w-5 h-5 text-emerald-600" /></div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-slate-900">{rx.med}</p>
                            <p className="text-xs text-slate-500">{rx.dosage}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{rx.doctor} · {rx.date}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Encerradas</h2>
        <div className="space-y-2.5">
            {PRESCRIPTIONS.filter((p) => !p.active).map((rx) => (
                <div key={rx.id} className="bg-slate-50 rounded-2xl border border-slate-100 p-4 opacity-60">
                    <p className="text-sm font-semibold text-slate-600">{rx.med}</p>
                    <p className="text-xs text-slate-400">{rx.dosage}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{rx.doctor} · {rx.date}</p>
                </div>
            ))}
        </div>
    </div>
);

// ══════════════════════════════════════════════════════════════════════════════════
//  SCREEN: EXAMES
// ══════════════════════════════════════════════════════════════════════════════════
const ExamesScreen: React.FC<{ navigateTo: (s: AppScreen) => void }> = ({ navigateTo }) => (
    <div className="px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigateTo('home')} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition"><ArrowLeft className="w-5 h-5 text-slate-800" /></button>
            <h1 className="text-lg font-bold text-slate-900">Meus Exames</h1>
        </div>
        <div className="space-y-3">
            {EXAMS.map((ex) => (
                <div key={ex.id} className={`bg-white rounded-2xl border p-4 shadow-sm ${ex.status === 'Resultado Disponível' ? 'border-emerald-200' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ex.status === 'Resultado Disponível' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                            <FlaskConical className={`w-5 h-5 ${ex.status === 'Resultado Disponível' ? 'text-emerald-600' : 'text-amber-600'}`} />
                        </div>
                        <div><p className="text-sm font-bold text-slate-900">{ex.name}</p><p className="text-xs text-slate-500">{ex.doctor}</p></div>
                    </div>
                    <div className="flex items-center justify-between"><span className="text-[10px] text-slate-400">{ex.date}</span><StatusBadge status={ex.status} /></div>
                </div>
            ))}
        </div>
    </div>
);

// ══════════════════════════════════════════════════════════════════════════════════
//  SCREEN: LIZ VOICE
// ══════════════════════════════════════════════════════════════════════════════════
const LizScreen: React.FC<{
    orbState: LizOrbState; transcript: string; lizResponse: string; conversation: ConversationEntry[];
    errorMessage: string | null; apiKey: string; setApiKey: (v: string) => void;
    showKeyInput: boolean; setShowKeyInput: (v: boolean) => void; handleOrbClick: () => void;
    conversationEndRef: React.RefObject<HTMLDivElement>; clinicalContext: ClinicalContext;
}> = ({ orbState, transcript, lizResponse, conversation, errorMessage, apiKey, setApiKey, showKeyInput, setShowKeyInput, handleOrbClick, conversationEndRef, clinicalContext }) => {
    useEffect(() => { conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [conversation, conversationEndRef]);
    const orbConfig: Record<LizOrbState, { bg: string; ring: string; icon: React.ReactNode; label: string }> = {
        IDLE: { bg: 'bg-[#1D3461]', ring: '', icon: <Mic className="w-10 h-10 text-white" />, label: 'Toque para falar' },
        LISTENING: { bg: 'bg-emerald-600', ring: 'ring-4 ring-emerald-300 animate-pulse', icon: <Mic className="w-10 h-10 text-white animate-bounce" />, label: 'Ouvindo...' },
        THINKING: { bg: 'bg-indigo-600', ring: 'ring-4 ring-indigo-300', icon: <Loader2 className="w-10 h-10 text-white animate-spin" />, label: 'Consultando painel clínico...' },
        SPEAKING: { bg: 'bg-cyan-600', ring: 'ring-4 ring-cyan-300 animate-pulse', icon: <Volume2 className="w-10 h-10 text-white animate-pulse" />, label: 'LIZ está falando...' },
    };
    const orb = orbConfig[orbState];

    return (
        <div className="flex flex-col items-center px-5 pt-10 pb-4 min-h-full bg-gradient-to-b from-slate-900 to-slate-800">
            <ElyonLogo size="sm" />
            <h1 className="text-lg font-bold text-white mb-0.5 mt-2">Assistente <span className="text-emerald-400">LIZ</span></h1>
            <p className="text-[10px] text-slate-500 mb-2">Coordenadora do Cuidado • IA Contextual</p>
            <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-full px-3 py-1 mb-5 flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-emerald-300 font-semibold">Conectada ao painel de {clinicalContext.patientName}</span>
            </div>
            <div className="relative mb-4">
                {orbState !== 'IDLE' && <div className={`absolute inset-0 w-32 h-32 rounded-full blur-2xl opacity-25 pointer-events-none ${orbState === 'LISTENING' ? 'bg-emerald-400 animate-ping' : orbState === 'THINKING' ? 'bg-indigo-400 animate-pulse' : 'bg-cyan-400 animate-pulse'}`} />}
                <button onClick={handleOrbClick} disabled={orbState === 'THINKING'}
                    className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl disabled:cursor-wait ${orb.bg} ${orb.ring}`}>
                    {orb.icon}
                </button>
            </div>
            <p className={`text-sm font-semibold mb-3 ${orbState === 'IDLE' ? 'text-slate-500' : orbState === 'LISTENING' ? 'text-emerald-400' : orbState === 'THINKING' ? 'text-indigo-400' : 'text-cyan-300'}`}>{orb.label}</p>
            {errorMessage && <div className="w-full max-w-xs p-3 bg-red-950/40 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2 mb-3"><AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{errorMessage}</span></div>}
            {transcript && <div className="w-full max-w-xs text-center mb-2"><p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Você disse:</p><p className="text-sm text-white font-medium mt-1">"{transcript}"</p></div>}
            {lizResponse && orbState !== 'THINKING' && <div className="w-full max-w-xs text-center mb-3"><p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">LIZ:</p><p className="text-sm text-slate-300 font-medium mt-1 leading-relaxed">{lizResponse}</p></div>}
            <button onClick={() => setShowKeyInput(!showKeyInput)} className="p-2 rounded-xl bg-slate-800 border border-slate-700 mb-2"><KeyRound className={`w-4 h-4 ${apiKey ? 'text-emerald-400' : 'text-slate-500'}`} /></button>
            {showKeyInput && <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Cole sua GEMINI_API_KEY..." className="w-full max-w-xs bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 font-mono placeholder-slate-600 outline-none focus:border-emerald-500 mb-3" />}
            {conversation.length > 0 && (
                <div className="w-full max-w-xs bg-slate-800/50 border border-slate-700/50 rounded-2xl p-3 max-h-40 overflow-y-auto space-y-1.5 mt-1">
                    {conversation.map((entry) => (
                        <div key={entry.id} className={`text-xs py-1.5 px-2.5 rounded-lg ${entry.role === 'user' ? 'bg-slate-700/50 text-slate-300' : 'bg-emerald-950/30 text-emerald-200 border-l-2 border-emerald-600'}`}>
                            <span className="font-bold text-[9px] uppercase opacity-50">{entry.role === 'user' ? 'Você' : 'LIZ'} {entry.timestamp}</span>
                            <p className="mt-0.5 leading-relaxed">{entry.text}</p>
                        </div>
                    ))}
                    <div ref={conversationEndRef as any} />
                </div>
            )}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════════
//  SCREEN: PERFIL
// ══════════════════════════════════════════════════════════════════════════════════
const PerfilScreen: React.FC<{ patient: typeof PATIENT; onLogout: () => void }> = ({ patient, onLogout }) => (
    <div className="px-5 pt-12 pb-4">
        <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-full bg-[#1D3461] flex items-center justify-center text-2xl font-bold text-white mb-3 shadow-lg">{patient.initials}</div>
            <h1 className="text-lg font-bold text-slate-900">{patient.fullName}</h1>
            <p className="text-xs text-slate-500">Paciente ELYON</p>
        </div>
        <div className="space-y-3">
            {[
                { icon: Calendar, label: 'Data de Nascimento', value: `${patient.birthDate} (${patient.age} anos)` },
                { icon: Phone, label: 'Telefone', value: patient.phone },
                { icon: Mail, label: 'E-mail', value: patient.email },
                { icon: MapPin, label: 'Cidade', value: patient.city },
                { icon: Droplets, label: 'Tipo Sanguíneo', value: patient.bloodType },
                { icon: Shield, label: 'CPF', value: patient.cpf },
            ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center"><item.icon className="w-5 h-5 text-[#1D3461]" /></div>
                    <div><p className="text-[10px] text-slate-400 font-semibold uppercase">{item.label}</p><p className="text-sm font-semibold text-slate-900">{item.value}</p></div>
                </div>
            ))}
        </div>
        <button onClick={onLogout}
            className="w-full mt-6 py-3 bg-red-50 text-red-600 font-bold text-sm rounded-2xl border border-red-100 flex items-center justify-center gap-2 active:scale-95 transition">
            <LogOut className="w-4 h-4" />
            Sair da Conta
        </button>
        <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-slate-300">
            <ElyonLogo size="sm" />
            <span className="font-semibold text-slate-400">ELYON HealthTech v1.0</span>
        </div>
    </div>
);

export default PatientApp;
