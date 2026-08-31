import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    Home, Calendar, Mic, User, Bell, ChevronRight, Pill, FlaskConical,
    FileText, Stethoscope, Video, Heart, Clock, CheckCircle, AlertCircle,
    Phone, Mail, MapPin, Droplets, Shield, ArrowLeft, Volume2, Loader2,
    MicOff, KeyRound, MessageSquare, Activity, Plus, Star, LogOut,
    Eye, EyeOff, Lock, Smartphone, ArrowRight, Sparkles, X as XIcon, UserPlus,
    Trash2, ToggleLeft, ToggleRight, ClipboardList, Brain, Dumbbell, Moon,
    Coffee, Cigarette, Wine, HeartPulse, Siren, CreditCard, Camera, Upload
} from 'lucide-react';
import {
    loginPatient, registerPatient, updatePatient, calculateAge, formatCPF, maskCPF,
    listMedications, addMedication, toggleMedication, deleteMedication,
    getHealthProfile, upsertHealthProfile, logLizInteraction,
    listTodayMedicationLogs, logMedicationStatus, getMedicationAdherence,
    getLatestVitalSign, listVitalSigns,
    type Patient, type PatientInsert, type Medication, type MedicationInsert,
    type HealthProfile, type VitalSign, type MedicationLog
} from '../services/patientService';
import { getInternalGeminiKey } from '../services/geminiKey';
import { generateLizSystemPrompt } from '../ai/LizBrain';
import { PrescricoesScreenLive, TriagemSaudeScreen } from './PatientScreens';
import { PatientCardScreen } from './PatientCardScreen';
import { VitalsScreen } from './VitalsScreen';

// ── Types ────────────────────────────────────────────────────────────────────────
type AppScreen = 'splash' | 'login' | 'register' | 'home' | 'consultas' | 'liz' | 'perfil' | 'prescricoes' | 'exames' | 'triagem' | 'cartao' | 'sinais-vitais';
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
    adherenceRate: number;
    adherenceSummary: string;
    latestVitalsSummary: string;
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
function buildClinicalContext(
    patient: typeof PATIENT,
    meds: Medication[],
    adherence: { todayRate: number; totalScheduledToday: number; takenToday: number; skippedToday: number; pendingToday: number } | null,
    vitals: VitalSign | null,
    profile: HealthProfile | null
): ClinicalContext {
    const activeMeds = meds.length > 0 ? meds.filter((p) => p.active) : PRESCRIPTIONS.filter((p) => p.active);
    const pendingExams = EXAMS.filter((e) => e.status === 'Pendente');
    const availableResults = EXAMS.filter((e) => e.status === 'Resultado Disponível');
    const apt = NEXT_APPOINTMENTS[0];

    const adherenceSummary = adherence
        ? `Taxa de adesão hoje: ${adherence.todayRate}% (${adherence.takenToday}/${adherence.totalScheduledToday} doses tomadas, ${adherence.pendingToday} pendentes, ${adherence.skippedToday} puladas)`
        : 'Adesão de hoje não calculada';

    let latestVitalsSummary = 'Sem sinais vitais registrados recentemente';
    if (vitals) {
        const parts = [];
        if (vitals.systolic_bp && vitals.diastolic_bp) parts.push(`PA: ${vitals.systolic_bp}/${vitals.diastolic_bp} mmHg`);
        if (vitals.heart_rate) parts.push(`FC: ${vitals.heart_rate} bpm`);
        if (vitals.glucose) parts.push(`Glicemia: ${vitals.glucose} mg/dL (${vitals.glucose_context || 'jejum'})`);
        if (vitals.oxygen_saturation) parts.push(`SpO2: ${vitals.oxygen_saturation}%`);
        if (vitals.temperature) parts.push(`Temp: ${vitals.temperature}°C`);
        if (vitals.weight) parts.push(`Peso: ${vitals.weight} kg`);
        if (parts.length > 0) latestVitalsSummary = parts.join(', ');
    }

    return {
        patientName: patient.name,
        patientAge: patient.age,
        bloodType: patient.bloodType,
        nextAppointment: apt ? `${apt.specialty} com ${apt.doctor} em ${apt.date} às ${apt.time} (${apt.type})` : 'Nenhuma consulta agendada',
        activeMeds: activeMeds.length,
        activeMedsList: activeMeds.map((m: any) => `${m.medication_name || m.med} - ${m.dosage || ''} (Horários: ${(m.schedules || []).join(', ') || m.frequency || '08:00'})`),
        adherenceRate: adherence?.todayRate ?? 100,
        adherenceSummary,
        latestVitalsSummary,
        pendingExams: pendingExams.length,
        pendingExamsList: pendingExams.map((e) => e.name),
        availableResults: availableResults.length,
        recentComplaints: HISTORY.slice(0, 2).map((h) => `${h.specialty}: ${h.complaint}`),
    };
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
    const [apiKey, setApiKey] = useState<string>(() => getInternalGeminiKey());
    const [showKeyInput, setShowKeyInput] = useState(false);

    // ── Proactive Analysis (Background LLM Check) ────────────────────────────
    const [lizProactiveAlert, setLizProactiveAlert] = useState<string | null>(null);

    // ── Patient Data (Medications + Health Profile + Vitals + Adherence) ──────
    const [medications, setMedications] = useState<Medication[]>([]);
    const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);
    const [latestVitals, setLatestVitals] = useState<VitalSign | null>(null);
    const [adherenceStats, setAdherenceStats] = useState<{
        todayRate: number;
        totalScheduledToday: number;
        takenToday: number;
        skippedToday: number;
        pendingToday: number;
    } | null>(null);
    const [activeMedReminder, setActiveMedReminder] = useState<{
        medId: string;
        medName: string;
        dosage: string;
        time: string;
    } | null>(null);

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
        avatar: loggedPatient.avatar_url || null,
    } : PATIENT;

    const clinicalContext = buildClinicalContext(patientDisplayData, medications, adherenceStats, latestVitals, healthProfile);
    const systemPrompt = generateLizSystemPrompt(clinicalContext);

    const unreadCount = notifications.filter((n) => !n.read).length;
    const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    const navigateTo = (s: AppScreen) => { setScreen(s); setShowNotifications(false); };

    // ── Background Proactive Analysis (Executa na abertura e sempre que acessa Home ou LIZ) ─
    useEffect(() => {
        if (!isLoggedIn) return;
        const activeKey = apiKey.trim() || getInternalGeminiKey();
        if (!activeKey) return;

        const runSilentLizAnalysis = async () => {
            try {
                const analysisPrompt = `Você é a LIZ, coordenadora de cuidado do sistema ELYON. Analise os seguintes dados clínicos em tempo real do paciente: ${JSON.stringify(clinicalContext)}. Sua tarefa: identifique se há pendências críticas (como exames não realizados, consultas muito próximas, adesão baixa a remédios, sinais vitais alterados). Se houver, gere UMA frase acolhedora e proativa chamando o paciente pelo primeiro nome e sugerindo o próximo passo lógico para resolver a pendência. Seja breve e humana — a frase será exibida num banner no app. Não use markdown ou asteriscos. Se tudo estiver em dia e sem pendências, retorne EXATAMENTE a palavra NONE.`;

                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${activeKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            systemInstruction: { parts: [{ text: analysisPrompt }] },
                            contents: [{ role: 'user', parts: [{ text: 'Faça a varredura completa dos dados do paciente e verifique pendências e riscos.' }] }],
                        }),
                    }
                );

                if (!res.ok) return;
                const data = await res.json();
                if (!data.candidates?.length) return;
                const text = data.candidates[0].content.parts[0].text.trim();
                if (text && text.toUpperCase() !== 'NONE') {
                    setLizProactiveAlert(text);
                    if (loggedPatient?.id) {
                        logLizInteraction(loggedPatient.id, 'proactive', null, text, 'Varredura Proativa LIZ');
                    }
                }
            } catch {
                // Silent fail — proactive analysis is non-blocking
            }
        };

        runSilentLizAnalysis();
    }, [isLoggedIn, screen]); // Executa ao logar e a cada troca de tela (Home, LIZ, etc.)

    // ── Splash auto-transition ───────────────────────────────────────────────
    useEffect(() => {
        if (screen === 'splash') {
            const timer = setTimeout(() => setScreen('login'), 2500);
            return () => clearTimeout(timer);
        }
    }, [screen]);

    // ── Web Notifications Permission Request ─────────────────────────────────
    const requestNotificationPermission = async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            try {
                await Notification.requestPermission();
            } catch { /* ignore */ }
        }
    };

    // ── Load Patient Data from Supabase ──────────────────────────────────────
    const refreshPatientData = useCallback(async () => {
        if (!loggedPatient) return;
        const [meds, profile, vitals, adh] = await Promise.all([
            listMedications(loggedPatient.id),
            getHealthProfile(loggedPatient.id),
            getLatestVitalSign(loggedPatient.id),
            getMedicationAdherence(loggedPatient.id),
        ]);
        setMedications(meds);
        setHealthProfile(profile);
        setLatestVitals(vitals);
        setAdherenceStats(adh);
    }, [loggedPatient]);

    useEffect(() => {
        if (loggedPatient) {
            refreshPatientData();
            requestNotificationPermission();
        }
    }, [loggedPatient, refreshPatientData]);

    // ── Medication Reminders & Notification Timer ────────────────────────────
    useEffect(() => {
        if (!loggedPatient || medications.length === 0) return;

        const checkReminders = async () => {
            const now = new Date();
            const todayLogs = await listTodayMedicationLogs(loggedPatient.id);
            const activeMeds = medications.filter(m => m.active);

            for (const med of activeMeds) {
                const times = med.schedules && med.schedules.length > 0 ? med.schedules : ['08:00'];
                for (const time of times) {
                    const alreadyLogged = todayLogs.some(l => l.medication_id === med.id && l.scheduled_time === time);
                    if (!alreadyLogged) {
                        const [tH, tM] = time.split(':').map(Number);
                        const isDue = (now.getHours() > tH) || (now.getHours() === tH && now.getMinutes() >= tM);
                        
                        if (isDue) {
                            setActiveMedReminder({
                                medId: med.id,
                                medName: med.medication_name,
                                dosage: med.dosage,
                                time: time,
                            });

                            if ('Notification' in window && Notification.permission === 'granted') {
                                new Notification(`💊 Lembrete: ${med.medication_name}`, {
                                    body: `Horário: ${time} • ${med.dosage}. Não esqueça de tomar sua medicação!`,
                                    icon: '/elyon-logo.jpg',
                                });
                            }

                            const notifText = `Lembrete: Tomar ${med.medication_name} (${med.dosage}) programado para às ${time}.`;
                            setNotifications(prev => {
                                if (prev.some(n => n.text === notifText)) return prev;
                                return [{ id: `med-${Date.now()}`, text: notifText, time: 'Agora', read: false }, ...prev];
                            });
                            return;
                        }
                    }
                }
            }
        };

        checkReminders();
        const interval = setInterval(checkReminders, 30000);
        return () => clearInterval(interval);
    }, [loggedPatient, medications]);

    const handleTakeReminder = async (medId: string, time: string) => {
        if (!loggedPatient) return;
        await logMedicationStatus(loggedPatient.id, medId, time, 'taken');
        setActiveMedReminder(null);
        refreshPatientData();
    };

    const handleSkipReminder = async (medId: string, time: string) => {
        if (!loggedPatient) return;
        await logMedicationStatus(loggedPatient.id, medId, time, 'skipped');
        setActiveMedReminder(null);
        refreshPatientData();
    };

    // ── Login / Logout ───────────────────────────────────────────────────────
    const handleLogin = (patient: Patient) => {
        setLoggedPatient(patient);
        setIsLoggedIn(true);
        setScreen('home');
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setLoggedPatient(null);
        setMedications([]);
        setHealthProfile(null);
        setLatestVitals(null);
        setAdherenceStats(null);
        setActiveMedReminder(null);
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
                const activeKey = apiKey.trim() || getInternalGeminiKey();
                const formatted = updated.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${activeKey}`,
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
    }, [orbState, queryGemini]);

    const handleOrbClick = useCallback(() => {
        if (orbState === 'LISTENING') { recognitionRef.current?.stop(); setOrbState('IDLE'); return; }
        if (orbState === 'SPEAKING') { window.speechSynthesis.cancel(); setOrbState('IDLE'); return; }
        if (orbState === 'IDLE') startListening();
    }, [orbState, startListening]);

    const handleFabClick = useCallback(() => {
        if (orbState === 'IDLE') {
            navigateTo('liz');
            setTimeout(() => startListening(), 300);
        } else if (orbState === 'LISTENING') { recognitionRef.current?.stop(); setOrbState('IDLE'); }
        else if (orbState === 'SPEAKING') { window.speechSynthesis.cancel(); setOrbState('IDLE'); }
    }, [orbState, startListening]);

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
        <div className="min-h-[100dvh] h-[100dvh] w-full bg-[#F0F4F8] font-['Inter',sans-serif] flex justify-center overflow-hidden select-none">
            <div className="w-full sm:max-w-md h-full bg-white flex flex-col relative overflow-hidden shadow-2xl">

                <div className="flex-1 overflow-y-auto overscroll-contain" style={{ paddingBottom: showAppChrome ? 96 : 0 }}>
                    {screen === 'splash' && <SplashScreen />}
                    {screen === 'login' && <LoginScreen onLogin={handleLogin} onGoToRegister={() => setScreen('register')} />}
                    {screen === 'register' && <RegisterScreen onBack={() => setScreen('login')} onRegisterSuccess={handleLogin} />}
                    {screen === 'home' && (
                        <HomeScreen navigateTo={navigateTo} patient={patientDisplayData} unreadCount={unreadCount}
                            showNotifications={showNotifications} setShowNotifications={setShowNotifications}
                            notifications={notifications} markAllRead={markAllRead} onTalkToLiz={handleFabClick} orbState={orbState}
                            lizProactiveAlert={lizProactiveAlert} onDismissAlert={() => setLizProactiveAlert(null)}
                            healthProfile={healthProfile}
                            adherenceStats={adherenceStats}
                            latestVitals={latestVitals}
                            activeMedReminder={activeMedReminder}
                            onTakeReminder={handleTakeReminder}
                            onSkipReminder={handleSkipReminder}
                            onRequestNotificationPermission={requestNotificationPermission} />
                    )}
                    {screen === 'consultas' && <ConsultasScreen navigateTo={navigateTo} />}
                    {screen === 'prescricoes' && (
                        <PrescricoesScreenLive navigateTo={navigateTo}
                            medications={medications} setMedications={setMedications}
                            patientId={loggedPatient?.id || null} mockPrescriptions={PRESCRIPTIONS}
                            onAdherenceChange={refreshPatientData} />
                    )}
                    {screen === 'sinais-vitais' && loggedPatient && (
                        <VitalsScreen navigateTo={navigateTo}
                            patientId={loggedPatient.id}
                            patientName={patientDisplayData.name}
                            onVitalSaved={refreshPatientData} />
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
                    {screen === 'perfil' && (
                        <PerfilScreen
                            patient={patientDisplayData}
                            loggedPatient={loggedPatient}
                            onAvatarUpdated={(url) => {
                                if (loggedPatient) {
                                    setLoggedPatient({ ...loggedPatient, avatar_url: url });
                                }
                            }}
                            onLogout={handleLogout}
                        />
                    )}
                </div>

                {/* Bottom Nav — Mobile Optimized with Safe Area */}
                {showAppChrome && (
                    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 px-4 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex items-center justify-around z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
                        {([
                            { id: 'home' as AppScreen, icon: Home, label: 'Início' },
                            { id: 'consultas' as AppScreen, icon: Clock, label: 'Histórico' },
                            { id: 'liz' as AppScreen, icon: MessageSquare, label: 'LIZ', isCenter: true },
                            { id: 'sinais-vitais' as AppScreen, icon: Heart, label: 'Saúde' },
                            { id: 'perfil' as AppScreen, icon: User, label: 'Perfil' },
                        ] as const).map((tab) => {
                            const isActive = screen === tab.id;
                            if ('isCenter' in tab && tab.isCenter) {
                                const isBusy = orbState !== 'IDLE';
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => navigateTo(tab.id)}
                                        className="-mt-5 flex flex-col items-center group focus:outline-none"
                                        aria-label="Abrir LIZ"
                                    >
                                        <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-lg transition-all active:scale-95 ${
                                            isBusy
                                                ? 'bg-[#C0392B] text-white animate-pulse shadow-[#C0392B]/30'
                                                : 'bg-[#1D3461] text-white hover:bg-[#162749] shadow-[#1D3461]/30'
                                        }`}>
                                            {isBusy && orbState === 'THINKING' ? (
                                                <Loader2 className="w-5 h-5 animate-spin text-white" />
                                            ) : (
                                                <MessageSquare className="w-5 h-5 text-white" />
                                            )}
                                            <span className="text-[9px] font-bold text-white tracking-wider mt-0.5">LIZ</span>
                                        </div>
                                    </button>
                                );
                            }
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => navigateTo(tab.id)}
                                    className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all focus:outline-none ${
                                        isActive ? 'text-[#1D3461]' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    <tab.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-[#1D3461]' : 'text-slate-400'}`} />
                                    <span className={`text-[10px] ${isActive ? 'font-bold text-[#1D3461]' : 'font-medium text-slate-400'}`}>
                                        {tab.label}
                                    </span>
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
//  SCREEN: SPLASH (ANIMAÇÃO CINEMATOGRÁFICA HEALTH TECH)
// ══════════════════════════════════════════════════════════════════════════════════
const SplashScreen: React.FC = () => {
    const [progress, setProgress] = useState(15);
    const [phaseText, setPhaseText] = useState('Iniciando Inteligência LIZ...');

    useEffect(() => {
        const t1 = setTimeout(() => { setProgress(55); setPhaseText('Sincronizando protocolos clínicos...'); }, 700);
        const t2 = setTimeout(() => { setProgress(90); setPhaseText('Calibrando cuidado personalizado...'); }, 1400);
        const t3 = setTimeout(() => { setProgress(100); setPhaseText('Bem-vindo à ELYON Health'); }, 2000);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    return (
        <div className="h-full flex flex-col items-center justify-between py-12 px-6 bg-gradient-to-b from-[#0F172A] via-[#1D3461] to-[#0A1120] relative overflow-hidden select-none">
            {/* Holographic glowing backgrounds */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#1D3461]/40 rounded-full blur-[100px] pointer-events-none animate-pulse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#C0392B]/15 rounded-full blur-[90px] pointer-events-none" />
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Top Badge */}
            <div className="relative z-10 pt-4 animate-fadeIn">
                <span className="text-[10px] font-bold tracking-[0.35em] text-blue-200/70 uppercase px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                    ELYON HEALTHTECH
                </span>
            </div>

            {/* Center: Logo with Multi-layer Pulse Radar & Shimmer */}
            <div className="relative z-10 flex flex-col items-center my-auto">
                <div className="relative flex items-center justify-center mb-7">
                    {/* Concentric expanding pulse rings */}
                    <div className="absolute w-44 h-44 rounded-full border border-blue-400/20 animate-ping opacity-25" style={{ animationDuration: '3s' }} />
                    <div className="absolute w-36 h-36 rounded-full border border-[#C0392B]/30 animate-pulse opacity-40" />
                    <div className="absolute w-32 h-32 rounded-3xl bg-blue-500/20 blur-xl animate-pulse" />

                    {/* Logo Box with Soft 3D Glow */}
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1 bg-gradient-to-b from-white/20 via-white/5 to-white/0 border border-white/20 shadow-[0_0_50px_rgba(29,52,97,0.8)] backdrop-blur-md overflow-hidden transform hover:scale-105 transition-transform duration-500">
                        <img
                            src="/elyon-logo.jpg"
                            alt="Elyon Health"
                            className="w-full h-full object-contain rounded-[22px] shadow-inner"
                        />
                        {/* Diagonal light beam sweep */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer pointer-events-none" />
                    </div>
                </div>

                {/* Typography */}
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-[0.2em] leading-none text-center drop-shadow-md">
                    ELYON
                </h1>
                <p className="text-xs font-bold text-blue-200/90 tracking-[0.25em] uppercase mt-2 text-center">
                    CUIDADO INTEGRADO & INTELIGENTE
                </p>
                <p className="text-[11px] text-slate-400 font-medium tracking-wider mt-1 text-center">
                    Conecta. Coordena. Eleva.
                </p>
            </div>

            {/* Bottom: Modern High-tech Progress Bar */}
            <div className="relative z-10 w-full max-w-xs flex flex-col items-center gap-2.5 pb-2">
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm p-[1px] border border-white/10">
                    <div
                        className="h-full bg-gradient-to-r from-[#C0392B] via-blue-400 to-emerald-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_rgba(192,57,43,0.8)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex items-center justify-between w-full text-[10px] text-blue-200/80 font-medium px-0.5">
                    <span className="truncate">{phaseText}</span>
                    <span className="font-mono text-slate-400">{progress}%</span>
                </div>
            </div>
        </div>
    );
};

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
    adherenceStats: { todayRate: number; totalScheduledToday: number; takenToday: number; skippedToday: number; pendingToday: number } | null;
    latestVitals: VitalSign | null;
    activeMedReminder: { medId: string; medName: string; dosage: string; time: string } | null;
    onTakeReminder: (medId: string, time: string) => void;
    onSkipReminder: (medId: string, time: string) => void;
    onRequestNotificationPermission: () => void;
}> = ({
    navigateTo, patient, unreadCount, showNotifications, setShowNotifications,
    notifications, markAllRead, onTalkToLiz, orbState, lizProactiveAlert, onDismissAlert,
    healthProfile, adherenceStats, latestVitals, activeMedReminder,
    onTakeReminder, onSkipReminder, onRequestNotificationPermission
}) => {
    // Determina status clínico dos sinais vitais
    const bpSystolic = latestVitals?.systolic_bp ?? 210;
    const bpDiastolic = latestVitals?.diastolic_bp ?? 100;
    const heartRate = latestVitals?.heart_rate ?? 125;
    const isBpHigh = bpSystolic >= 140 || bpDiastolic >= 90;
    const isHrHigh = heartRate >= 100 || heartRate <= 50;
    const hasVitalsAlert = isBpHigh || isHrHigh;

    return (
        <div className="bg-[#F8FAFC] min-h-full px-4 pt-6 pb-8 sm:px-5">
            {/* ── 1. HEADER ── */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigateTo('perfil')}
                        className="relative w-12 h-12 rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs flex-shrink-0 bg-white group focus:outline-none transition active:scale-95 text-left"
                        title="Ver / alterar foto de perfil"
                    >
                        {patient.avatar ? (
                            <img
                                src={patient.avatar}
                                alt={patient.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-[#1D3461] flex items-center justify-center text-white font-bold text-sm">
                                {patient.initials || 'EG'}
                            </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-[#C0392B] rounded-full border-2 border-white flex items-center justify-center shadow-2xs">
                            <Camera className="w-2.5 h-2.5 text-white" />
                        </span>
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-[#1D3461] leading-tight">Olá, {patient.name} 👋</h1>
                        <p className="text-xs text-slate-500 font-normal mt-0.5">Como está se sentindo hoje?</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative w-10 h-10 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-center text-[#1D3461] transition shadow-xs"
                        aria-label="Notificações"
                    >
                        <Bell className="w-5 h-5 text-[#1D3461]" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#C0392B] rounded-full ring-2 ring-white animate-pulse" />
                        )}
                    </button>
                </div>
            </div>

            {/* Central de Notificações Popover */}
            {showNotifications && (
                <div className="bg-white rounded-3xl p-4 mb-4 shadow-xl text-slate-800 animate-fadeIn border border-slate-200/80">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-[#1D3461]" />
                            <h3 className="text-sm font-bold text-[#1D3461]">Notificações & Lembretes</h3>
                        </div>
                        <button onClick={markAllRead} className="text-[11px] font-semibold text-[#1D3461] hover:underline">
                            Marcar como lidas
                        </button>
                    </div>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {notifications.map((n) => (
                            <div key={n.id} className={`text-xs p-3 rounded-2xl transition ${n.read ? 'bg-slate-50 text-slate-500' : 'bg-blue-50/70 text-slate-800 border border-blue-100 font-medium'}`}>
                                <p className="leading-relaxed">{n.text}</p>
                                <span className="text-[9px] text-slate-400 mt-1 block font-normal">{n.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── ⏰ LEMBRETE ATIVO DE MEDICAÇÃO (SE HOUVER DOSE PENDENTE) ── */}
            {activeMedReminder && (
                <div className="mb-4 bg-white border border-[#C0392B]/30 rounded-3xl p-4 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#FDF2F2] flex items-center justify-center flex-shrink-0">
                            <Clock className="w-5 h-5 text-[#C0392B]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold tracking-wider uppercase text-[#C0392B]">Hora do Medicamento ({activeMedReminder.time})</span>
                            <p className="text-sm font-bold text-[#1D3461] leading-tight mt-0.5 truncate">{activeMedReminder.medName}</p>
                            <p className="text-xs text-slate-500">{activeMedReminder.dosage}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                        <button
                            onClick={() => onTakeReminder(activeMedReminder.medId, activeMedReminder.time)}
                            className="flex-1 py-2.5 bg-[#1D3461] hover:bg-[#162749] text-white rounded-xl text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1.5"
                        >
                            <CheckCircle className="w-3.5 h-3.5 text-white" /> Já Tomei
                        </button>
                        <button
                            onClick={() => onSkipReminder(activeMedReminder.medId, activeMedReminder.time)}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition active:scale-95"
                        >
                            Pular
                        </button>
                    </div>
                </div>
            )}

            {/* ── 2. LIZ · CUIDADO PROATIVO (CARD PRINCIPAL HEALTH TECH) ── */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-5">
                {/* Header do Card */}
                <div className="flex items-start gap-3.5 mb-4">
                    {/* Avatar LIZ com Logo Oficial */}
                    <div className="relative flex-shrink-0">
                        <img
                            src="/elyon-logo.jpg"
                            alt="LIZ Elyon"
                            className="w-12 h-12 rounded-2xl object-contain bg-white border border-slate-100 shadow-xs"
                        />
                    </div>

                    {/* Textos LIZ */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-[#C0392B] uppercase tracking-wider flex items-center gap-1">
                                <Shield className="w-3.5 h-3.5 text-[#C0392B] inline" />
                                LIZ • CUIDADO PROATIVO
                            </span>
                            <button onClick={onTalkToLiz} className="text-slate-400 hover:text-slate-600 transition p-1 -mr-1">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        <h2 className="text-sm sm:text-base font-bold text-[#1D3461] mt-1 leading-snug">
                            {hasVitalsAlert
                                ? 'Seus sinais vitais precisam de atenção'
                                : (lizProactiveAlert || 'Seu plano de cuidado está em dia')}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {hasVitalsAlert
                                ? 'Sua pressão arterial e frequência cardíaca estão acima dos valores esperados.'
                                : (lizProactiveAlert ? 'A LIZ identificou atualizações importantes para sua rotina de saúde.' : 'Seu histórico e adesão aos cuidados continuam sendo monitorados.')}
                        </p>
                    </div>
                </div>

                {/* 2 Indicadores Padronizados de Sinais Vitais */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                    {/* Indicador 1: Pressão Arterial */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center flex-shrink-0 text-slate-700 shadow-2xs">
                            <Heart className="w-4 h-4 text-slate-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider truncate">PRESSÃO ARTERIAL</p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-xs font-bold text-[#1D3461] truncate">
                                    {bpSystolic}/{bpDiastolic} mmHg
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase leading-none ${
                                    isBpHigh
                                        ? 'bg-[#FDF2F2] text-[#C0392B] border border-[#FCA5A5]/70'
                                        : 'bg-slate-100 text-[#1D3461] border border-slate-200'
                                }`}>
                                    {isBpHigh ? 'ALTO' : 'NORMAL'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Indicador 2: Frequência Cardíaca */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center flex-shrink-0 text-slate-700 shadow-2xs">
                            <Activity className="w-4 h-4 text-slate-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider truncate">FREQUÊNCIA CARDÍACA</p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-xs font-bold text-[#1D3461] truncate">
                                    {heartRate} bpm
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase leading-none ${
                                    isHrHigh
                                        ? 'bg-[#FDF2F2] text-[#C0392B] border border-[#FCA5A5]/70'
                                        : 'bg-slate-100 text-[#1D3461] border border-slate-200'
                                }`}>
                                    {isHrHigh ? 'ALTO' : 'NORMAL'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botão Principal: Conversar com a LIZ (Azul Institucional) */}
                <button
                    onClick={onTalkToLiz}
                    className="w-full py-3.5 bg-[#1D3461] hover:bg-[#162749] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99]"
                >
                    <MessageSquare className="w-4 h-4 text-white" />
                    Conversar com a LIZ
                </button>
            </div>

            {/* ── 3. ACESSO RÁPIDO (6 BOTÕES RIGOROSAMENTE PADRONIZADOS) ── */}
            <div className="mb-6">
                <h2 className="text-sm font-bold text-[#1D3461] mb-3">Acesso rápido</h2>
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                    {[
                        { id: 'consultas', label: 'Consultas', icon: Calendar, action: () => navigateTo('consultas') },
                        { id: 'prescricoes', label: 'Prescrições', icon: Pill, action: () => navigateTo('prescricoes') },
                        { id: 'sinais-vitais', label: 'Sinais vitais', icon: Heart, action: () => navigateTo('sinais-vitais') },
                        { id: 'exames', label: 'Exames', icon: FlaskConical, action: () => navigateTo('exames') },
                        { id: 'cartao', label: 'Cartão Saúde', icon: CreditCard, action: () => navigateTo('cartao') },
                        { id: 'liz', label: 'Falar com a LIZ', icon: Mic, action: onTalkToLiz },
                    ].map((item) => (
                        <button
                            key={item.label}
                            onClick={item.action}
                            className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-3.5 sm:p-4 flex flex-col items-center justify-center gap-2.5 text-center shadow-xs transition active:scale-95 group"
                        >
                            <item.icon className="w-6 h-6 text-[#1D3461] stroke-[1.75] group-hover:scale-105 transition-transform" />
                            <span className="text-xs font-semibold text-[#1D3461] leading-tight">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── 4. RESUMO DE SAÚDE (CONTAINER ÚNICO BRANCO COM LISTA) ── */}
            <div className="mb-6">
                <h2 className="text-sm font-bold text-[#1D3461] mb-3">Resumo de saúde</h2>
                <div className="bg-white rounded-3xl border border-slate-200/80 divide-y divide-slate-100 shadow-xs overflow-hidden">
                    {/* Item 1: Adesão Medicamentosa */}
                    <button
                        onClick={() => navigateTo('prescricoes')}
                        className="w-full p-4 flex items-center gap-3.5 hover:bg-slate-50/70 transition text-left group"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-[#FDF2F2] text-[#C0392B] flex items-center justify-center flex-shrink-0">
                            <Pill className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500 font-medium">Adesão medicamentosa <span className="text-slate-400 font-normal">(hoje)</span></p>
                            <p className="text-sm font-bold text-slate-900 mt-0.5">
                                {adherenceStats
                                    ? `${adherenceStats.todayRate}% tomada (${adherenceStats.takenToday}/${adherenceStats.totalScheduledToday} doses)`
                                    : '100% tomada (0/0 doses)'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="bg-[#FDF2F2] text-[#C0392B] border border-[#FCA5A5]/60 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                                EM DIA
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
                        </div>
                    </button>

                    {/* Item 2: Últimos Sinais Vitais */}
                    <button
                        onClick={() => navigateTo('sinais-vitais')}
                        className="w-full p-4 flex items-center gap-3.5 hover:bg-slate-50/70 transition text-left group"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-[#FDF2F2] text-[#C0392B] flex items-center justify-center flex-shrink-0">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500 font-medium">Últimos sinais vitais</p>
                            <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                                PA: {bpSystolic}/{bpDiastolic} mmHg • FC: {heartRate} bpm
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                hasVitalsAlert
                                    ? 'bg-[#FDF2F2] text-[#C0392B] border border-[#FCA5A5]/70'
                                    : 'bg-slate-100 text-[#1D3461] border border-slate-200'
                            }`}>
                                {hasVitalsAlert ? 'ATENÇÃO' : 'NORMAL'}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
                        </div>
                    </button>

                    {/* Item 3: Tipo Sanguíneo */}
                    <div className="w-full p-4 flex items-center gap-3.5 text-left">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1D3461] flex items-center justify-center flex-shrink-0">
                            <Droplets className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500 font-medium">Tipo sanguíneo</p>
                            <p className="text-sm font-bold text-slate-900 mt-0.5">{patient.bloodType || 'A+'}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>

                    {/* Item 4: Próxima Consulta */}
                    <button
                        onClick={() => navigateTo('consultas')}
                        className="w-full p-4 flex items-center gap-3.5 hover:bg-slate-50/70 transition text-left group"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 text-[#1D3461] flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500 font-medium">Próxima consulta</p>
                            <p className="text-sm font-bold text-slate-900 mt-0.5">
                                {NEXT_APPOINTMENTS[0]?.specialty || 'Cardiologia'} • <span className="text-slate-500 font-normal">{NEXT_APPOINTMENTS[0]?.doctor || 'Dr. Marcelo Ferreira'}</span>
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {NEXT_APPOINTMENTS[0]?.date || '28/08/2026'} às {NEXT_APPOINTMENTS[0]?.time || '09:30'}
                            </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
                    </button>
                </div>
            </div>

            {/* ── 5. TRIAGEM DE SAÚDE (BANNER COMPACTO & DISCRETO) ── */}
            <button
                onClick={() => navigateTo('triagem')}
                className="w-full p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition flex items-center gap-3.5 text-left"
            >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    healthProfile?.triage_completed ? 'bg-[#FDF2F2] text-[#C0392B]' : 'bg-slate-100 text-[#1D3461]'
                }`}>
                    {healthProfile?.triage_completed ? <CheckCircle className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#1D3461]">
                        {healthProfile?.triage_completed ? 'Perfil de Saúde Completo' : 'Completar Triagem de Saúde'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        {healthProfile?.triage_completed ? 'Toque para revisar seu histórico clínico' : 'Conte à LIZ sobre sua rotina, alergias e histórico'}
                    </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
        </div>
    );
};

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
const PerfilScreen: React.FC<{
    patient: typeof PATIENT;
    loggedPatient: Patient | null;
    onAvatarUpdated: (url: string | null) => void;
    onLogout: () => void;
}> = ({ patient, loggedPatient, onAvatarUpdated, onLogout }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSaving(true);
        try {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = async () => {
                    // Redimensiona para max 320px para armazenamento otimizado no Supabase
                    const canvas = document.createElement('canvas');
                    const maxDim = 320;
                    let width = img.width;
                    let height = img.height;
                    if (width > height) {
                        if (width > maxDim) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        }
                    } else {
                        if (height > maxDim) {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

                    if (loggedPatient?.id) {
                        await updatePatient(loggedPatient.id, { avatar_url: compressedBase64 });
                    }
                    onAvatarUpdated(compressedBase64);
                    setIsSaving(false);
                    setSuccessMessage('Foto de perfil salva com sucesso!');
                    setTimeout(() => setSuccessMessage(null), 3000);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error('Erro ao processar imagem:', err);
            setIsSaving(false);
        }
    };

    const handleRemovePhoto = async () => {
        if (loggedPatient?.id) {
            setIsSaving(true);
            await updatePatient(loggedPatient.id, { avatar_url: null });
            setIsSaving(false);
        }
        onAvatarUpdated(null);
        setSuccessMessage('Foto removida!');
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    return (
        <div className="px-5 pt-10 pb-8">
            <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />

            <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSaving}
                        className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-slate-200 shadow-md flex items-center justify-center bg-white relative group focus:outline-none transition active:scale-95 text-left"
                    >
                        {patient.avatar ? (
                            <img
                                src={patient.avatar}
                                alt={patient.fullName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-[#1D3461] flex items-center justify-center text-3xl font-bold text-white">
                                {patient.initials}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-3xl">
                            <Camera className="w-7 h-7 text-white" />
                        </div>
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSaving}
                        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#1D3461] text-white flex items-center justify-center border-2 border-white shadow-md hover:bg-[#162749] transition active:scale-90"
                        title="Escolher Foto"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    </button>
                </div>

                <h1 className="text-lg font-bold text-[#1D3461] mt-3 leading-tight">{patient.fullName}</h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Paciente ELYON Health</p>

                <div className="flex items-center gap-2 mt-3">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSaving}
                        className="text-[11px] font-bold text-[#1D3461] bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5 shadow-2xs"
                    >
                        <Upload className="w-3 h-3" />
                        {patient.avatar ? 'Alterar foto' : 'Escolher foto'}
                    </button>
                    {patient.avatar && (
                        <button
                            onClick={handleRemovePhoto}
                            disabled={isSaving}
                            className="text-[11px] font-semibold text-[#C0392B] bg-[#FDF2F2] hover:bg-red-100 px-3 py-1.5 rounded-full transition"
                        >
                            Remover
                        </button>
                    )}
                </div>

                {successMessage && (
                    <div className="mt-3 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 shadow-2xs animate-fadeIn flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        {successMessage}
                    </div>
                )}
            </div>

            <div className="space-y-2.5 mb-6">
                {[
                    { icon: Calendar, label: 'Data de Nascimento', value: `${patient.birthDate} (${patient.age} anos)` },
                    { icon: Phone, label: 'Telefone', value: patient.phone },
                    { icon: Mail, label: 'E-mail', value: patient.email },
                    { icon: MapPin, label: 'Cidade', value: patient.city },
                    { icon: Droplets, label: 'Tipo Sanguíneo', value: patient.bloodType },
                    { icon: Shield, label: 'CPF', value: patient.cpf },
                ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                            <item.icon className="w-4 h-4 text-[#1D3461]" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{item.label}</p>
                            <p className="text-xs sm:text-sm font-semibold text-[#1D3461] truncate">{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={onLogout}
                className="w-full py-3.5 bg-[#FDF2F2] hover:bg-red-100 text-[#C0392B] font-bold text-sm rounded-2xl border border-[#FCA5A5]/60 flex items-center justify-center gap-2 active:scale-95 transition shadow-xs"
            >
                <LogOut className="w-4 h-4" />
                Sair da Conta
            </button>

            <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-slate-300">
                <ElyonLogo size="sm" />
                <span className="font-semibold text-slate-400">ELYON HealthTech v1.0</span>
            </div>
        </div>
    );
};

export default PatientApp;
