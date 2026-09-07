import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    Home, Calendar, Mic, User, Bell, ChevronRight, Pill, FlaskConical,
    FileText, Stethoscope, Video, Heart, Clock, CheckCircle, AlertCircle,
    Phone, Mail, MapPin, Droplets, Shield, ArrowLeft, Volume2, Loader2,
    MicOff, KeyRound, MessageSquare, Activity, Plus, Star, LogOut,
    Eye, EyeOff, Lock, Smartphone, ArrowRight, Sparkles, X as XIcon, UserPlus,
    Trash2, ToggleLeft, ToggleRight, ClipboardList, Brain, Dumbbell, Moon,
    Coffee, Cigarette, Wine, HeartPulse, Siren, CreditCard, Camera, Upload,
    Check, HelpCircle, Thermometer, AlertTriangle, Send
} from 'lucide-react';
import {
    loginPatient, registerPatient, updatePatient, calculateAge, formatCPF, maskCPF,
    listMedications, addMedication, toggleMedication, deleteMedication,
    getHealthProfile, upsertHealthProfile, logLizInteraction,
    listTodayMedicationLogs, logMedicationStatus, getMedicationAdherence,
    listVitalSigns,
    listUpcomingAppointments, listPastAppointments, addAppointment,
    listExams,
    listNotifications, markAllNotificationsRead, createNotification,
    type Patient, type PatientInsert, type Medication, type MedicationInsert,
    type HealthProfile, type VitalSign, type MedicationLog,
    type Appointment, type Exam, type PatientNotification
} from '../services/patientService';
import { getInternalGeminiKey } from '../services/geminiKey';
import { generateLizSystemPrompt } from '../ai/LizBrain';
import { lizGeminiAudioService } from '../services/lizGeminiAudioService';
import { PrescricoesScreenLive, TriagemSaudeScreen } from './PatientScreens';
import { PatientCardScreen } from './PatientCardScreen';
import { VitalsScreen } from './VitalsScreen';

// ── Types ────────────────────────────────────────────────────────────────────────
type AppScreen = 'splash' | 'login' | 'register' | 'home' | 'consultas' | 'liz' | 'perfil' | 'prescricoes' | 'exames' | 'triagem' | 'cartao' | 'sinais-vitais' | 'telemedicina';
type LizOrbState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';

interface ConversationEntry {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    timestamp: string;
}

interface PatientDisplayData {
    name: string;
    fullName: string;
    initials: string;
    birthDate: string;
    age: number;
    cpf: string;
    phone: string;
    email: string;
    city: string;
    bloodType: string;
    avatar: string | null;
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
    vitalsHistorySummary: string;
    pendingExams: number;
    pendingExamsList: string[];
    availableResults: number;
    recentComplaints: string[];
}

// ── Clinical Context Builder (Real Data Only) ────────────────────────────────────
function buildClinicalContext(
    patient: { name: string; age: number; bloodType: string },
    meds: Medication[],
    adherence: { todayRate: number; totalScheduledToday: number; takenToday: number; skippedToday: number; pendingToday: number } | null,
    vitals: VitalSign | null,
    vitalsHistory: VitalSign[],
    profile: HealthProfile | null,
    upcomingApts: Appointment[],
    exams: Exam[]
): ClinicalContext {
    const activeMeds = meds.filter((p) => p.active);
    const pendingExams = exams.filter((e) => e.status === 'Pendente' || e.status === 'Agendado');
    const availableResults = exams.filter((e) => e.status === 'Resultado Disponível');
    const nextApt = upcomingApts[0];

    const adherenceSummary = adherence
        ? `Taxa de adesão hoje: ${adherence.todayRate}% (${adherence.takenToday}/${adherence.totalScheduledToday} doses tomadas, ${adherence.pendingToday} pendentes, ${adherence.skippedToday} puladas)`
        : 'Adesão de hoje não calculada';

    // ── Último sinal vital (com validade) ──
    let latestVitalsSummary = 'Sem sinais vitais registrados.';
    if (vitals) {
        const recordedAt = vitals.recorded_at || vitals.created_at;
        const ageHours = recordedAt ? (Date.now() - new Date(recordedAt).getTime()) / (1000 * 60 * 60) : Infinity;
        const ageDays = Math.floor(ageHours / 24);

        const parts = [];
        if (vitals.systolic_bp && vitals.diastolic_bp) parts.push(`PA: ${vitals.systolic_bp}/${vitals.diastolic_bp} mmHg`);
        if (vitals.heart_rate) parts.push(`FC: ${vitals.heart_rate} bpm`);
        if (vitals.glucose) parts.push(`Glicemia: ${vitals.glucose} mg/dL (${vitals.glucose_context || 'jejum'})`);
        if (vitals.oxygen_saturation) parts.push(`SpO2: ${vitals.oxygen_saturation}%`);
        if (vitals.temperature) parts.push(`Temp: ${vitals.temperature}°C`);
        if (vitals.weight) parts.push(`Peso: ${vitals.weight} kg`);

        if (parts.length > 0) {
            const freshness = ageHours < 24 ? '(RECENTE — medido hoje)' : ageDays <= 3 ? `(DESATUALIZADO — medido há ${ageDays} dia${ageDays > 1 ? 's' : ''}, solicite nova medição)` : `(EXPIRADO — medido há ${ageDays} dias, dados não confiáveis, peça para medir novamente)`;
            latestVitalsSummary = `${parts.join(', ')} ${freshness}`;
        }
    }

    // ── Histórico comparativo (tendências) ──
    let vitalsHistorySummary = 'Sem histórico para comparação.';
    if (vitalsHistory.length >= 2) {
        const entries = vitalsHistory.slice(0, 5).map((v, i) => {
            const dt = new Date(v.recorded_at || v.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            const parts = [];
            if (v.systolic_bp && v.diastolic_bp) parts.push(`PA:${v.systolic_bp}/${v.diastolic_bp}`);
            if (v.heart_rate) parts.push(`FC:${v.heart_rate}`);
            if (v.glucose) parts.push(`Gli:${v.glucose}`);
            if (v.oxygen_saturation) parts.push(`SpO2:${v.oxygen_saturation}%`);
            if (v.temperature) parts.push(`T:${v.temperature}°C`);
            if (v.weight) parts.push(`P:${v.weight}kg`);
            return `${i === 0 ? '[MAIS RECENTE]' : `[${i + 1}]`} ${dt} → ${parts.join(', ')}`;
        });

        // Tendência PA
        const bpReadings = vitalsHistory.filter(v => v.systolic_bp && v.diastolic_bp);
        let trend = '';
        if (bpReadings.length >= 2) {
            const latest = bpReadings[0].systolic_bp!;
            const previous = bpReadings[1].systolic_bp!;
            const delta = latest - previous;
            trend += delta > 10 ? `⚠️ PA subiu ${delta}mmHg desde a última medição. ` : delta < -10 ? `✅ PA desceu ${Math.abs(delta)}mmHg desde a última medição. ` : 'PA estável. ';
        }
        // Tendência FC
        const hrReadings = vitalsHistory.filter(v => v.heart_rate);
        if (hrReadings.length >= 2) {
            const latest = hrReadings[0].heart_rate!;
            const previous = hrReadings[1].heart_rate!;
            const delta = latest - previous;
            trend += delta > 15 ? `⚠️ FC subiu ${delta}bpm. ` : delta < -15 ? `✅ FC desceu ${Math.abs(delta)}bpm. ` : 'FC estável. ';
        }

        vitalsHistorySummary = `HISTÓRICO (${vitalsHistory.length} medições, últimas 5):\n${entries.join('\n')}${trend ? `\nTENDÊNCIA: ${trend}` : ''}`;
    } else if (vitalsHistory.length === 1) {
        vitalsHistorySummary = 'Apenas 1 medição registrada — sem comparação possível ainda.';
    }

    return {
        patientName: patient.name,
        patientAge: patient.age,
        bloodType: patient.bloodType,
        nextAppointment: nextApt
            ? `${nextApt.specialty} com ${nextApt.doctor_name} em ${new Date(nextApt.appointment_date).toLocaleDateString('pt-BR')} às ${nextApt.appointment_time.slice(0, 5)} (${nextApt.type})`
            : 'Nenhuma consulta agendada',
        activeMeds: activeMeds.length,
        activeMedsList: activeMeds.map((m) => `${m.medication_name} - ${m.dosage || ''} (Horários: ${(m.schedules || []).join(', ') || '08:00'})`),
        adherenceRate: adherence?.todayRate ?? 100,
        adherenceSummary,
        latestVitalsSummary,
        vitalsHistorySummary,
        pendingExams: pendingExams.length,
        pendingExamsList: pendingExams.map((e) => e.name),
        availableResults: availableResults.length,
        recentComplaints: [],
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
    const [notifications, setNotifications] = useState<PatientNotification[]>([]);

    // ── Real data from Supabase ───────────────────────────────────────────
    const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
    const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
    const [patientExams, setPatientExams] = useState<Exam[]>([]);

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
    const [vitalsHistory, setVitalsHistory] = useState<VitalSign[]>([]);
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

    // ── Dynamic Patient Data (from Supabase — requires login) ──────────────
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
    } : { name: '', fullName: '', initials: '', birthDate: '', age: 0, cpf: '', phone: '', email: '', city: '', bloodType: 'Não informado', avatar: null as string | null };

    const clinicalContext = buildClinicalContext(patientDisplayData, medications, adherenceStats, latestVitals, vitalsHistory, healthProfile, upcomingAppointments, patientExams);
    const systemPrompt = generateLizSystemPrompt(clinicalContext);

    const unreadCount = notifications.filter((n) => !n.read).length;
    const markAllRead = async () => {
        if (loggedPatient) await markAllNotificationsRead(loggedPatient.id);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const navigateTo = (s: AppScreen) => { setScreen(s); setShowNotifications(false); };

    // ── Background Proactive Analysis (Executa ao logar, trocar tela, OU quando dados clínicos mudam) ─
    // Serializa contexto para detectar mudanças reais nos dados
    const clinicalContextKey = JSON.stringify({
        vitals: latestVitals?.id,
        vitalsAge: latestVitals?.recorded_at,
        medsCount: medications.length,
        adherence: adherenceStats?.todayRate,
        exams: patientExams.length,
        apts: upcomingAppointments.length,
    });

    useEffect(() => {
        if (!isLoggedIn) return;
        const activeKey = apiKey.trim() || getInternalGeminiKey();
        if (!activeKey) return;

        // Limpa alerta antigo antes de refazer a análise
        setLizProactiveAlert(null);

        const runSilentLizAnalysis = async () => {
            try {
                const freshContext = buildClinicalContext(patientDisplayData, medications, adherenceStats, latestVitals, vitalsHistory, healthProfile, upcomingAppointments, patientExams);

                const analysisPrompt = `Você é a LIZ, coordenadora de cuidado do sistema ELYON. Analise os seguintes dados clínicos em tempo real do paciente: ${JSON.stringify(freshContext)}. Sua tarefa: identifique se há pendências críticas (como exames não realizados, consultas muito próximas, adesão baixa a remédios, sinais vitais alterados ou desatualizados). Compare os sinais vitais atuais com o histórico para identificar tendências. Se houver pendência, gere UMA frase acolhedora e proativa chamando o paciente pelo primeiro nome e sugerindo o próximo passo lógico. Seja breve e humana — a frase será exibida num banner no app. Não use markdown ou asteriscos. Se tudo estiver em dia e sem pendências, retorne EXATAMENTE a palavra NONE.`;

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
    }, [isLoggedIn, screen, clinicalContextKey]); // Re-executa ao logar, trocar tela, ou quando dados clínicos mudam

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
        const [meds, profile, vitalsList, adh, upcoming, past, exams, notifs] = await Promise.all([
            listMedications(loggedPatient.id),
            getHealthProfile(loggedPatient.id),
            listVitalSigns(loggedPatient.id, 10), // últimas 10 medições para análise comparativa
            getMedicationAdherence(loggedPatient.id),
            listUpcomingAppointments(loggedPatient.id),
            listPastAppointments(loggedPatient.id),
            listExams(loggedPatient.id),
            listNotifications(loggedPatient.id),
        ]);
        setMedications(meds);
        setHealthProfile(profile);
        setVitalsHistory(vitalsList);
        setLatestVitals(vitalsList.length > 0 ? vitalsList[0] : null);
        setAdherenceStats(adh);
        setUpcomingAppointments(upcoming);
        setPastAppointments(past);
        setPatientExams(exams);
        setNotifications(notifs);
    }, [loggedPatient]);

    useEffect(() => {
        if (loggedPatient) {
            refreshPatientData();
            requestNotificationPermission();
        }
    }, [loggedPatient, refreshPatientData]);

    // ── Smart Alerts Engine: Medicamentos, Consultas, Exames e Sinais Vitais ──
    useEffect(() => {
        if (!loggedPatient) return;

        const checkReminders = async () => {
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];

            // 1. AVISOS DE CONSULTAS
            for (const apt of upcomingAppointments) {
                if (apt.status === 'Agendada' || apt.status === 'Confirmada') {
                    const aptDate = apt.appointment_date ? apt.appointment_date.split('T')[0] : '';
                    if (aptDate === todayStr) {
                        const [aH, aM] = (apt.appointment_time || '00:00').slice(0, 5).split(':').map(Number);
                        const aptTimeInMinutes = aH * 60 + aM;
                        const nowInMinutes = now.getHours() * 60 + now.getMinutes();
                        const diffMinutes = aptTimeInMinutes - nowInMinutes;

                        // Se a consulta é hoje e falta entre 0 e 60 minutos
                        if (diffMinutes >= 0 && diffMinutes <= 60) {
                            const notifTitle = `📅 Consulta de ${apt.specialty} em Breve`;
                            const notifMessage = `Sua consulta com ${apt.doctor_name} (${apt.type}) está marcada para às ${apt.appointment_time.slice(0, 5)} (em ${diffMinutes === 0 ? 'instantes' : `${diffMinutes} min`}).`;

                            if (!notifications.some(n => n.message === notifMessage)) {
                                if ('Notification' in window && Notification.permission === 'granted') {
                                    new Notification(notifTitle, { body: notifMessage, icon: '/elyon-logo.jpg' });
                                }
                                await createNotification(loggedPatient.id, notifMessage, 'consulta', notifTitle, apt.id);
                                refreshPatientData();
                            }
                        }
                    }
                }
            }

            // 2. AVISOS DE MEDICAMENTOS (Com Popup + Notificação)
            if (medications.length > 0) {
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

                                const notifTitle = `💊 Hora do Remédio: ${med.medication_name}`;
                                const notifText = `Horário: ${time} • ${med.dosage || ''}. Tome sua medicação para manter o tratamento em dia.`;

                                if (!notifications.some(n => n.message === notifText)) {
                                    if ('Notification' in window && Notification.permission === 'granted') {
                                        new Notification(notifTitle, { body: notifText, icon: '/elyon-logo.jpg' });
                                    }
                                    await createNotification(loggedPatient.id, notifText, 'medicamento', notifTitle, med.id);
                                    refreshPatientData();
                                }
                                return;
                            }
                        }
                    }
                }
            }

            // 3. AVISOS DE EXAMES LIBERADOS
            for (const ex of patientExams) {
                if (ex.status === 'Resultado Disponível') {
                    const notifTitle = `🔬 Resultado Disponível: ${ex.name}`;
                    const notifText = `O laudo do seu exame ${ex.name} já está disponível para visualização.`;
                    if (!notifications.some(n => n.message === notifText)) {
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification(notifTitle, { body: notifText, icon: '/elyon-logo.jpg' });
                        }
                        await createNotification(loggedPatient.id, notifText, 'exame', notifTitle, ex.id);
                        refreshPatientData();
                    }
                }
            }
        };

        checkReminders();
        const interval = setInterval(checkReminders, 20000); // Checa a cada 20s
        return () => clearInterval(interval);
    }, [loggedPatient, medications, upcomingAppointments, patientExams, notifications, refreshPatientData]);

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
        // Reset ALL patient data to prevent leaking between accounts
        setMedications([]);
        setHealthProfile(null);
        setLatestVitals(null);
        setVitalsHistory([]);
        setAdherenceStats(null);
        setActiveMedReminder(null);
        setUpcomingAppointments([]);
        setPastAppointments([]);
        setPatientExams([]);
        setNotifications([]);
        // Reset LIZ state
        setOrbState('IDLE');
        setConversation([]);
        setTranscript('');
        setLizResponse('');
        setLizProactiveAlert(null);
        window.speechSynthesis?.cancel();
        recognitionRef.current?.stop();
        setScreen('login');
    };

    // ── TTS: Falar a resposta da LIZ com Áudio Neural Humanizado ────────────
    const speakResponse = useCallback((text: string) => {
        lizGeminiAudioService.playNeuralSpeech(
            text,
            () => setOrbState('SPEAKING'),
            () => setOrbState('IDLE')
        );
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
                            upcomingAppointments={upcomingAppointments}
                            activeMedReminder={activeMedReminder}
                            onTakeReminder={handleTakeReminder}
                            onSkipReminder={handleSkipReminder}
                            onRequestNotificationPermission={requestNotificationPermission} />
                    )}
                    {screen === 'consultas' && <ConsultasScreen navigateTo={navigateTo} upcomingAppointments={upcomingAppointments} pastAppointments={pastAppointments} patientId={loggedPatient?.id || null} onAppointmentAdded={refreshPatientData} />}
                    {screen === 'prescricoes' && (
                        <PrescricoesScreenLive navigateTo={navigateTo}
                            medications={medications} setMedications={setMedications}
                            patientId={loggedPatient?.id || null} mockPrescriptions={[]}
                            onAdherenceChange={refreshPatientData} />
                    )}
                    {screen === 'sinais-vitais' && loggedPatient && (
                        <VitalsScreen navigateTo={navigateTo}
                            patientId={loggedPatient.id}
                            patientName={patientDisplayData.name}
                            onVitalSaved={refreshPatientData} />
                    )}
                    {screen === 'exames' && <ExamesScreen navigateTo={navigateTo} exams={patientExams} />}
                    {screen === 'telemedicina' && loggedPatient && (
                        <TelemedicinaScreen navigateTo={navigateTo} patientId={loggedPatient.id} patientName={patientDisplayData.name} latestVitals={latestVitals} />
                    )}
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
//  SCREEN: SPLASH (SURGIMENTO CINEMATOGRÁFICO MINIMALISTA)
// ══════════════════════════════════════════════════════════════════════════════════
const SplashScreen: React.FC = () => {
    const [isRevealed, setIsRevealed] = useState(false);
    const [showSubtitle, setShowSubtitle] = useState(false);

    useEffect(() => {
        // Sequência suave de revelação cinematográfica
        const t1 = setTimeout(() => setIsRevealed(true), 250);
        const t2 = setTimeout(() => setShowSubtitle(true), 1100);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-[#0C1930] relative overflow-hidden select-none px-6">
            {/* Brilho radial suave ao fundo sem qualquer card ou caixa */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1D3461]/60 via-[#0C1930] to-[#081020] pointer-events-none" />

            {/* Conteúdo Central: Surgimento Gradual */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Logo da ELYON surgindo suavemente da escuridão */}
                <div
                    className={`transition-all duration-1000 ease-out transform mb-6 ${
                        isRevealed
                            ? 'opacity-100 scale-100 blur-none'
                            : 'opacity-0 scale-90 blur-md'
                    }`}
                >
                    <img
                        src="/elyon-logo.jpg"
                        alt="ELYON"
                        className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.4)]"
                    />
                </div>

                {/* Nome ELYON com efeito de surgimento e expansão de tracking */}
                <h1
                    className={`text-3xl sm:text-4xl font-extrabold text-white leading-none text-center transition-all duration-1000 ease-out transform ${
                        isRevealed
                            ? 'opacity-100 tracking-[0.35em] translate-y-0 blur-none'
                            : 'opacity-0 tracking-[0.1em] translate-y-4 blur-sm'
                    }`}
                    style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}
                >
                    ELYON
                </h1>

                {/* Linha luminosa minimalista */}
                <div
                    className={`h-[1.5px] bg-gradient-to-r from-transparent via-[#C0392B] to-transparent my-3.5 transition-all duration-1000 ease-out ${
                        isRevealed ? 'w-24 opacity-80' : 'w-0 opacity-0'
                    }`}
                />

                {/* Subtítulo institucional surgindo com atraso elegante */}
                <p
                    className={`text-[11px] sm:text-xs font-semibold text-blue-200/90 uppercase text-center transition-all duration-1000 ease-out transform ${
                        showSubtitle
                            ? 'opacity-100 tracking-[0.25em] translate-y-0 blur-none'
                            : 'opacity-0 tracking-[0.1em] translate-y-2 blur-xs'
                    }`}
                >
                    Cuidado Integrado & Inteligente
                </p>
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
            <div className="bg-gradient-to-br from-[#1D3461] via-[#162749] to-[#0F172A] px-6 pt-12 pb-8 flex items-center gap-4 rounded-b-[2.5rem] shadow-lg">
                <img
                    src="/elyon-logo.jpg"
                    alt="Elyon Health"
                    className="w-14 h-14 object-contain rounded-2xl bg-white p-1 shadow-md border border-white/20 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-extrabold text-white tracking-wide leading-none">ELYON</h1>
                    <p className="text-[11px] text-blue-200 tracking-[0.25em] font-bold uppercase mt-1.5 truncate">Portal do Paciente</p>
                </div>
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

// ── Helper: phone mask ──────────────────────────────────────────────────────────
const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

// ── Allergy categories config ───────────────────────────────────────────────────
const ALLERGY_CATEGORIES = [
    { key: 'medication', label: 'Medicamentos' },
    { key: 'food', label: 'Alimentos' },
    { key: 'latex', label: 'Látex' },
    { key: 'insect', label: 'Picada de insetos' },
    { key: 'chemical', label: 'Produtos químicos' },
    { key: 'contrast', label: 'Contraste radiológico' },
    { key: 'other', label: 'Outros' },
] as const;

const ALLERGY_DETAIL_FIELDS: Record<string, { label: string; placeholder: string; required?: boolean }> = {
    medication: { label: 'Quais medicamentos?', placeholder: 'Ex.: Dipirona, Penicilina' },
    food: { label: 'Quais alimentos?', placeholder: 'Ex.: Camarão, amendoim, leite' },
    chemical: { label: 'Informe quais produtos, se souber', placeholder: 'Ex.: Látex, formaldeído' },
    other: { label: 'Descreva sua alergia', placeholder: 'Descreva aqui...', required: true },
};

// ── Health conditions config ────────────────────────────────────────────────────
const HEALTH_CONDITIONS = [
    { key: 'hypertension', label: 'Hipertensão arterial' },
    { key: 'diabetes', label: 'Diabetes' },
    { key: 'asthma', label: 'Asma' },
    { key: 'heart_disease', label: 'Doença cardíaca' },
    { key: 'lung_disease', label: 'Doença pulmonar' },
    { key: 'kidney_disease', label: 'Doença renal' },
    { key: 'liver_disease', label: 'Doença hepática' },
    { key: 'thyroid_disease', label: 'Doença da tireoide' },
    { key: 'cancer', label: 'Câncer' },
    { key: 'epilepsy', label: 'Epilepsia' },
    { key: 'other', label: 'Outros' },
] as const;

const BLOOD_TYPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'] as const;

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

    // Step 2: Clinical — Blood Type
    const [bloodType, setBloodType] = useState('');
    const [unknownBloodType, setUnknownBloodType] = useState(false);

    // Step 2: Clinical — Allergies
    const [allergiesStatus, setAllergiesStatus] = useState<'' | 'yes' | 'no' | 'unknown'>('');
    const [allergyCategories, setAllergyCategories] = useState<Set<string>>(new Set());
    const [medicationAllergyDetails, setMedicationAllergyDetails] = useState('');
    const [foodAllergyDetails, setFoodAllergyDetails] = useState('');
    const [chemicalAllergyDetails, setChemicalAllergyDetails] = useState('');
    const [otherAllergyDetails, setOtherAllergyDetails] = useState('');

    // Step 2: Clinical — Health Conditions
    const [healthConditions, setHealthConditions] = useState<Set<string>>(new Set());
    const [noKnownConditions, setNoKnownConditions] = useState(false);
    const [unknownHealthConditions, setUnknownHealthConditions] = useState(false);
    const [otherHealthConditionDetails, setOtherHealthConditionDetails] = useState('');

    // Step 2: Emergency Contact
    const [emergName, setEmergName] = useState('');
    const [emergPhone, setEmergPhone] = useState('');

    // Step 3: Address + Password
    const [city, setCity] = useState('');
    const [state, setState] = useState('SP');
    const [address, setAddress] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // ── Blood type handlers ─────────────────────────────────────────────────
    const handleSelectBloodType = (type: string) => {
        setBloodType(type);
        setUnknownBloodType(false);
    };
    const handleUnknownBloodType = () => {
        setBloodType('');
        setUnknownBloodType(true);
    };

    // ── Allergy category toggle ─────────────────────────────────────────────
    const toggleAllergyCategory = (key: string) => {
        setAllergyCategories(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
                // Clear detail when unchecked
                if (key === 'medication') setMedicationAllergyDetails('');
                if (key === 'food') setFoodAllergyDetails('');
                if (key === 'chemical') setChemicalAllergyDetails('');
                if (key === 'other') setOtherAllergyDetails('');
            } else {
                next.add(key);
            }
            return next;
        });
    };

    // ── Health condition toggle ──────────────────────────────────────────────
    const toggleHealthCondition = (key: string) => {
        setNoKnownConditions(false);
        setUnknownHealthConditions(false);
        setHealthConditions(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
                if (key === 'other') setOtherHealthConditionDetails('');
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const handleNoKnownConditions = () => {
        setNoKnownConditions(true);
        setUnknownHealthConditions(false);
        setHealthConditions(new Set());
        setOtherHealthConditionDetails('');
    };

    const handleUnknownHealthConditions = () => {
        setUnknownHealthConditions(true);
        setNoKnownConditions(false);
        setHealthConditions(new Set());
        setOtherHealthConditionDetails('');
    };

    // ── Allergy detail getter ───────────────────────────────────────────────
    const getAllergyDetail = (key: string) => {
        switch (key) {
            case 'medication': return medicationAllergyDetails;
            case 'food': return foodAllergyDetails;
            case 'chemical': return chemicalAllergyDetails;
            case 'other': return otherAllergyDetails;
            default: return '';
        }
    };
    const setAllergyDetail = (key: string, value: string) => {
        switch (key) {
            case 'medication': setMedicationAllergyDetails(value); break;
            case 'food': setFoodAllergyDetails(value); break;
            case 'chemical': setChemicalAllergyDetails(value); break;
            case 'other': setOtherAllergyDetails(value); break;
        }
    };

    // ── Validations ─────────────────────────────────────────────────────────
    const validateStep1 = () => {
        if (!fullName.trim()) return 'Nome completo é obrigatório.';
        if (cpf.replace(/\D/g, '').length !== 11) return 'CPF deve ter 11 dígitos.';
        if (!birthDate) return 'Data de nascimento é obrigatória.';
        if (!gender) return 'Selecione o gênero.';
        return null;
    };

    const validateStep2 = () => {
        if (allergiesStatus === 'yes') {
            if (allergyCategories.size === 0) return 'Selecione pelo menos uma categoria de alergia.';
            if (allergyCategories.has('other') && !otherAllergyDetails.trim()) return 'Descreva a alergia em "Outros".';
        }
        if (healthConditions.has('other') && !otherHealthConditionDetails.trim()) return 'Descreva a condição de saúde em "Outros".';
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
        if (step === 2) {
            const err = validateStep2();
            if (err) { setRegError(err); return; }
        }
        setStep(step + 1);
    };

    // ── Build legacy-compatible arrays + new structured data ────────────────
    const buildAllergiesArray = (): string[] => {
        if (allergiesStatus !== 'yes') return [];
        const items: string[] = [];
        allergyCategories.forEach(cat => {
            const detail = getAllergyDetail(cat);
            if (detail.trim()) {
                detail.split(',').forEach(d => { if (d.trim()) items.push(d.trim()); });
            } else {
                const label = ALLERGY_CATEGORIES.find(c => c.key === cat)?.label;
                if (label) items.push(label);
            }
        });
        return items;
    };

    const buildChronicArray = (): string[] => {
        if (noKnownConditions || unknownHealthConditions) return [];
        const items: string[] = [];
        healthConditions.forEach(key => {
            if (key === 'other' && otherHealthConditionDetails.trim()) {
                otherHealthConditionDetails.split(',').forEach(d => { if (d.trim()) items.push(d.trim()); });
            } else {
                const label = HEALTH_CONDITIONS.find(c => c.key === key)?.label;
                if (label) items.push(label);
            }
        });
        return items;
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
            // Blood type
            blood_type: bloodType || null,
            unknown_blood_type: unknownBloodType,
            // Legacy arrays (backward compat)
            allergies: buildAllergiesArray(),
            chronic_conditions: buildChronicArray(),
            // Structured allergies
            allergies_status: allergiesStatus || null,
            allergy_categories: Array.from(allergyCategories),
            medication_allergy_details: medicationAllergyDetails || null,
            food_allergy_details: foodAllergyDetails || null,
            chemical_allergy_details: chemicalAllergyDetails || null,
            other_allergy_details: otherAllergyDetails || null,
            // Structured health conditions
            health_conditions: Array.from(healthConditions),
            no_known_conditions: noKnownConditions,
            unknown_health_conditions: unknownHealthConditions,
            other_health_condition_details: otherHealthConditionDetails || null,
            // Emergency
            emergency_contact_name: emergName || null,
            emergency_contact_phone: emergPhone.replace(/\D/g, '') || null,
            password,
        };

        const { data, error } = await registerPatient(patientData);
        setIsLoading(false);
        if (error) { setRegError(error); return; }
        if (data) onRegisterSuccess(data);
    };

    const inputClass = "flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-[#1D3461] focus-within:ring-1 focus-within:ring-[#1D3461]/20 transition-all";
    const fieldClass = "flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none font-medium";

    // ── Reusable Chip component ─────────────────────────────────────────────
    const Chip: React.FC<{
        label: string;
        selected: boolean;
        onPress: () => void;
        variant?: 'default' | 'exclusive';
        compact?: boolean;
    }> = ({ label, selected, onPress, variant = 'default', compact = false }) => {
        const isExclusive = variant === 'exclusive';
        return (
            <button
                type="button"
                onClick={onPress}
                className={`
                    inline-flex items-center gap-1.5 rounded-xl border text-[13px] font-semibold
                    transition-all duration-200 active:scale-[0.97]
                    ${compact ? 'px-3.5 py-2' : 'px-4 py-2.5'}
                    ${selected
                        ? isExclusive
                            ? 'bg-slate-100 border-slate-300 text-slate-700'
                            : 'bg-[#1D3461]/[0.06] border-[#1D3461]/30 text-[#1D3461]'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }
                `}
            >
                {selected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                {label}
            </button>
        );
    };

    // ── Radio option (single select like Yes/No/Unknown) ────────────────────
    const RadioOption: React.FC<{
        label: string;
        selected: boolean;
        onPress: () => void;
    }> = ({ label, selected, onPress }) => (
        <button
            type="button"
            onClick={onPress}
            className={`
                flex-1 flex items-center justify-center gap-2 rounded-xl border text-[13px] font-semibold py-3
                transition-all duration-200 active:scale-[0.97]
                ${selected
                    ? 'bg-[#1D3461]/[0.06] border-[#1D3461]/30 text-[#1D3461]'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }
            `}
        >
            {selected && <Check className="w-3.5 h-3.5" />}
            {label}
        </button>
    );

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

                {/* ── STEP 1: PERSONAL DATA ────────────────────────────── */}
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

                {/* ── STEP 2: CLINICAL DATA ────────────────────────────── */}
                {step === 2 && (
                    <div className="space-y-8">

                        {/* ── 1. TIPO SANGUÍNEO ───────────────────────────── */}
                        <section>
                            <div className="flex items-center gap-2 mb-1">
                                <Droplets className="w-4 h-4 text-[#1D3461]" />
                                <p className="text-sm font-bold text-slate-900">Tipo sanguíneo</p>
                            </div>
                            <p className="text-[11px] text-slate-400 mb-3">Selecione uma opção, se souber.</p>

                            <div className="grid grid-cols-4 gap-2 mb-2">
                                {BLOOD_TYPES.map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => handleSelectBloodType(type)}
                                        className={`
                                            flex items-center justify-center gap-1 rounded-xl border text-[13px] font-bold py-2.5
                                            transition-all duration-200 active:scale-[0.95]
                                            ${bloodType === type
                                                ? 'bg-[#1D3461]/[0.06] border-[#1D3461]/30 text-[#1D3461]'
                                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                            }
                                        `}
                                    >
                                        {bloodType === type && <Check className="w-3.5 h-3.5" />}
                                        {type}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={handleUnknownBloodType}
                                className={`
                                    w-full flex items-center justify-center gap-2 rounded-xl border text-[12px] font-medium py-2.5
                                    transition-all duration-200
                                    ${unknownBloodType
                                        ? 'bg-slate-100 border-slate-300 text-slate-600'
                                        : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                                    }
                                `}
                            >
                                {unknownBloodType && <Check className="w-3.5 h-3.5" />}
                                <HelpCircle className="w-3.5 h-3.5" />
                                Não sei meu tipo sanguíneo
                            </button>
                        </section>

                        {/* ── 2. ALERGIAS ──────────────────────────────────── */}
                        <section>
                            <div className="flex items-center gap-2 mb-1">
                                <AlertCircle className="w-4 h-4 text-[#1D3461]" />
                                <p className="text-sm font-bold text-slate-900">Alergias</p>
                            </div>
                            <p className="text-[11px] text-slate-400 mb-3">Você possui alguma alergia conhecida?</p>

                            <div className="flex gap-2 mb-1">
                                <RadioOption label="Não" selected={allergiesStatus === 'no'} onPress={() => { setAllergiesStatus('no'); setAllergyCategories(new Set()); }} />
                                <RadioOption label="Sim" selected={allergiesStatus === 'yes'} onPress={() => setAllergiesStatus('yes')} />
                                <RadioOption label="Não sei" selected={allergiesStatus === 'unknown'} onPress={() => { setAllergiesStatus('unknown'); setAllergyCategories(new Set()); }} />
                            </div>

                            {/* Conditional: allergy categories */}
                            {allergiesStatus === 'yes' && (
                                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <p className="text-[11px] font-semibold text-slate-500 mb-2.5">Selecione as categorias que se aplicam a você</p>
                                    <div className="flex flex-wrap gap-2">
                                        {ALLERGY_CATEGORIES.map((cat) => (
                                            <Chip
                                                key={cat.key}
                                                label={cat.label}
                                                selected={allergyCategories.has(cat.key)}
                                                onPress={() => toggleAllergyCategory(cat.key)}
                                            />
                                        ))}
                                    </div>

                                    {/* Conditional detail fields */}
                                    {Object.entries(ALLERGY_DETAIL_FIELDS).map(([key, field]) => (
                                        allergyCategories.has(key) && (
                                            <div key={key} className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">
                                                    {field.label} {field.required && '*'}
                                                </label>
                                                <div className={inputClass}>
                                                    <input
                                                        type="text"
                                                        value={getAllergyDetail(key)}
                                                        onChange={(e) => setAllergyDetail(key, e.target.value)}
                                                        placeholder={field.placeholder}
                                                        className={fieldClass}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* ── 3. CONDIÇÕES DE SAÚDE ────────────────────────── */}
                        <section>
                            <div className="flex items-center gap-2 mb-1">
                                <Heart className="w-4 h-4 text-[#1D3461]" />
                                <p className="text-sm font-bold text-slate-900">Condições de saúde</p>
                            </div>
                            <p className="text-[11px] text-slate-400 mb-3">Selecione todas as condições que se aplicam a você.</p>

                            <div className="flex flex-wrap gap-2">
                                {HEALTH_CONDITIONS.map((cond) => (
                                    <Chip
                                        key={cond.key}
                                        label={cond.label}
                                        selected={healthConditions.has(cond.key)}
                                        onPress={() => toggleHealthCondition(cond.key)}
                                    />
                                ))}
                            </div>

                            {/* Other condition detail */}
                            {healthConditions.has('other') && (
                                <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Informe a condição de saúde *</label>
                                    <div className={inputClass}>
                                        <input
                                            type="text"
                                            value={otherHealthConditionDetails}
                                            onChange={(e) => setOtherHealthConditionDetails(e.target.value)}
                                            placeholder="Ex.: Endometriose, artrite reumatoide"
                                            className={fieldClass}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Exclusive options */}
                            <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-slate-100">
                                <Chip
                                    label="Nenhuma condição conhecida"
                                    selected={noKnownConditions}
                                    onPress={handleNoKnownConditions}
                                    variant="exclusive"
                                />
                                <Chip
                                    label="Não sei informar"
                                    selected={unknownHealthConditions}
                                    onPress={handleUnknownHealthConditions}
                                    variant="exclusive"
                                />
                            </div>
                        </section>

                        {/* ── 4. CONTATO DE EMERGÊNCIA ─────────────────────── */}
                        <section>
                            <div className="flex items-center gap-2 mb-1">
                                <Phone className="w-4 h-4 text-[#1D3461]" />
                                <p className="text-sm font-bold text-slate-900">Contato de Emergência</p>
                            </div>
                            <div className="space-y-3 mt-3">
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Nome</label>
                                    <div className={inputClass}>
                                        <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                        <input type="text" value={emergName} onChange={(e) => setEmergName(e.target.value)} placeholder="Nome do contato" className={fieldClass} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Telefone</label>
                                    <div className={inputClass}>
                                        <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                        <input
                                            type="tel"
                                            value={emergPhone}
                                            onChange={(e) => setEmergPhone(formatPhone(e.target.value))}
                                            placeholder="(79) 99999-9999"
                                            inputMode="numeric"
                                            className={fieldClass}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* ── STEP 3: ADDRESS + PASSWORD ───────────────────────── */}
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
    navigateTo: (s: AppScreen) => void; patient: PatientDisplayData; unreadCount: number;
    showNotifications: boolean; setShowNotifications: (v: boolean) => void;
    notifications: PatientNotification[]; markAllRead: () => void;
    onTalkToLiz: () => void; orbState: LizOrbState;
    lizProactiveAlert: string | null; onDismissAlert: () => void;
    healthProfile: HealthProfile | null;
    adherenceStats: { todayRate: number; totalScheduledToday: number; takenToday: number; skippedToday: number; pendingToday: number } | null;
    latestVitals: VitalSign | null;
    upcomingAppointments: Appointment[];
    activeMedReminder: { medId: string; medName: string; dosage: string; time: string } | null;
    onTakeReminder: (medId: string, time: string) => void;
    onSkipReminder: (medId: string, time: string) => void;
    onRequestNotificationPermission: () => void;
}> = ({
    navigateTo, patient, unreadCount, showNotifications, setShowNotifications,
    notifications, markAllRead, onTalkToLiz, orbState, lizProactiveAlert, onDismissAlert,
    healthProfile, adherenceStats, latestVitals, upcomingAppointments, activeMedReminder,
    onTakeReminder, onSkipReminder, onRequestNotificationPermission
}) => {
    // Determina status clínico + VALIDADE dos sinais vitais
    const bpSystolic = latestVitals?.systolic_bp ?? null;
    const bpDiastolic = latestVitals?.diastolic_bp ?? null;
    const heartRate = latestVitals?.heart_rate ?? null;
    const hasVitalsData = bpSystolic !== null || heartRate !== null;

    // Freshness: quanto tempo desde a última medição
    const vitalsRecordedAt = latestVitals?.recorded_at || latestVitals?.created_at;
    const vitalsAgeMs = vitalsRecordedAt ? Date.now() - new Date(vitalsRecordedAt).getTime() : Infinity;
    const vitalsAgeHours = vitalsAgeMs / (1000 * 60 * 60);
    const vitalsFreshness: 'fresh' | 'stale' | 'expired' | 'none' =
        !hasVitalsData ? 'none' :
        vitalsAgeHours < 24 ? 'fresh' :
        vitalsAgeHours < 72 ? 'stale' : 'expired';

    // Texto humanizado do tempo
    const vitalsAgeText = vitalsRecordedAt
        ? vitalsAgeHours < 1 ? 'há poucos minutos'
        : vitalsAgeHours < 24 ? `há ${Math.floor(vitalsAgeHours)}h`
        : vitalsAgeHours < 48 ? 'há 1 dia'
        : `há ${Math.floor(vitalsAgeHours / 24)} dias`
        : '';

    // Alertas SÓ se vitals são recentes (< 24h)
    const isBpHigh = vitalsFreshness === 'fresh' && bpSystolic !== null && bpDiastolic !== null && (bpSystolic >= 140 || bpDiastolic >= 90);
    const isHrHigh = vitalsFreshness === 'fresh' && heartRate !== null && (heartRate >= 100 || heartRate <= 50);
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
                        {notifications.length > 0 && (
                            <button onClick={markAllRead} className="text-[11px] font-semibold text-[#1D3461] hover:underline">
                                Marcar como lidas
                            </button>
                        )}
                    </div>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {notifications.length === 0 ? (
                            <div className="text-xs text-slate-400 text-center py-4">Nenhuma notificação no momento.</div>
                        ) : notifications.map((n) => (
                            <div key={n.id} className={`text-xs p-3 rounded-2xl transition ${n.read ? 'bg-slate-50 text-slate-500' : 'bg-blue-50/70 text-slate-800 border border-blue-100 font-medium'}`}>
                                <p className="leading-relaxed">{n.message}</p>
                                <span className="text-[9px] text-slate-400 mt-1 block font-normal">
                                    {new Date(n.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </span>
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
                    {/* Avatar Personagem Mulher LIZ */}
                    <div className="relative flex-shrink-0">
                        <img
                            src="/liz-avatar.jpg"
                            alt="LIZ - Coordenadora de Cuidado"
                            className="w-13 h-13 rounded-2xl object-cover border border-slate-200 shadow-xs"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
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
                                : vitalsFreshness === 'stale'
                                ? 'Hora de atualizar seus sinais vitais'
                                : (lizProactiveAlert || 'Seu plano de cuidado está em dia')}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {hasVitalsAlert
                                ? 'Sua pressão arterial e frequência cardíaca estão acima dos valores esperados.'
                                : vitalsFreshness === 'stale'
                                ? `Sua última medição foi ${vitalsAgeText}. Mantenha seus dados atualizados para um acompanhamento mais preciso.`
                                : (lizProactiveAlert ? 'A LIZ identificou atualizações importantes para sua rotina de saúde.' : 'Seu histórico e adesão aos cuidados continuam sendo monitorados.')}
                        </p>
                    </div>
                </div>

                {/* Sinais Vitais — display inteligente baseado na VALIDADE */}
                {vitalsFreshness === 'expired' || vitalsFreshness === 'none' ? (
                    /* ── SEM MEDIÇÃO RECENTE: CTA para verificar ── */
                    <button onClick={() => navigateTo('sinais-vitais')}
                        className="w-full bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 mb-4 flex items-center gap-3 hover:bg-slate-100 transition text-left group">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center flex-shrink-0 shadow-2xs">
                            <HeartPulse className="w-5 h-5 text-slate-300" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-slate-500">Sem medição recente</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                {vitalsFreshness === 'none' ? 'Nenhum sinal vital registrado' : `Última medição ${vitalsAgeText}`}
                            </p>
                        </div>
                        <span className="text-xs font-bold text-[#1D3461] group-hover:underline whitespace-nowrap">Verificar agora →</span>
                    </button>
                ) : (
                    /* ── VITALS FRESCOS OU STALE: mostrar valores ── */
                    <div className="mb-4">
                        <div className={`grid grid-cols-2 gap-2.5 ${vitalsFreshness === 'stale' ? 'opacity-60' : ''}`}>
                            {/* Pressão Arterial */}
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center flex-shrink-0 shadow-2xs">
                                    <Heart className="w-4 h-4 text-slate-700" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider truncate">PRESSÃO ARTERIAL</p>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <span className="text-xs font-bold text-[#1D3461] truncate">
                                            {bpSystolic !== null ? `${bpSystolic}/${bpDiastolic} mmHg` : '-- / --'}
                                        </span>
                                        {bpSystolic !== null && vitalsFreshness === 'fresh' && (
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase leading-none ${
                                                isBpHigh ? 'bg-[#FDF2F2] text-[#C0392B] border border-[#FCA5A5]/70' : 'bg-slate-100 text-[#1D3461] border border-slate-200'
                                            }`}>{isBpHigh ? 'ALTO' : 'NORMAL'}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Frequência Cardíaca */}
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center flex-shrink-0 shadow-2xs">
                                    <Activity className="w-4 h-4 text-slate-700" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider truncate">FREQUÊNCIA CARDÍACA</p>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <span className="text-xs font-bold text-[#1D3461] truncate">
                                            {heartRate !== null ? `${heartRate} bpm` : '-- bpm'}
                                        </span>
                                        {heartRate !== null && vitalsFreshness === 'fresh' && (
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase leading-none ${
                                                isHrHigh ? 'bg-[#FDF2F2] text-[#C0392B] border border-[#FCA5A5]/70' : 'bg-slate-100 text-[#1D3461] border border-slate-200'
                                            }`}>{isHrHigh ? 'ALTO' : 'NORMAL'}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Barra de status de validade */}
                        <div className={`mt-2 flex items-center justify-between px-1 ${vitalsFreshness === 'stale' ? '' : ''}`}>
                            <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                                vitalsFreshness === 'fresh' ? 'text-emerald-500' : 'text-amber-500'
                            }`}>
                                {vitalsFreshness === 'fresh' ? (
                                    <><CheckCircle className="w-3 h-3" /> Medido {vitalsAgeText}</>
                                ) : (
                                    <><AlertCircle className="w-3 h-3" /> Desatualizado · {vitalsAgeText}</>
                                )}
                            </span>
                            {vitalsFreshness === 'stale' && (
                                <button onClick={() => navigateTo('sinais-vitais')} className="text-[10px] font-bold text-[#1D3461] hover:underline">
                                    Atualizar →
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Botões LIZ + Teleconsulta */}
                <div className="flex gap-2.5">
                    <button
                        onClick={onTalkToLiz}
                        className="flex-1 py-3.5 bg-[#1D3461] hover:bg-[#162749] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99]"
                    >
                        <MessageSquare className="w-4 h-4 text-white" />
                        Falar com a LIZ
                    </button>
                    <button
                        onClick={() => navigateTo('telemedicina')}
                        className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99]"
                    >
                        <Video className="w-4 h-4 text-white" />
                        Consulta Agora
                    </button>
                </div>
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
                            <p className="text-sm font-bold text-slate-900 mt-0.5">{patient.bloodType || 'Não informado'}</p>
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
                            {upcomingAppointments.length > 0 ? (
                                <>
                                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                                        {upcomingAppointments[0].specialty} • <span className="text-slate-500 font-normal">{upcomingAppointments[0].doctor_name}</span>
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {new Date(upcomingAppointments[0].appointment_date).toLocaleDateString('pt-BR')} às {upcomingAppointments[0].appointment_time.slice(0, 5)}
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-slate-400 mt-0.5">Nenhuma consulta agendada</p>
                            )}
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
const SPECIALTIES = [
    'Clínica Geral', 'Cardiologia', 'Dermatologia', 'Endocrinologia',
    'Ginecologia', 'Neurologia', 'Oftalmologia', 'Ortopedia',
    'Otorrinolaringologia', 'Pediatria', 'Psiquiatria', 'Urologia',
];

const ConsultasScreen: React.FC<{
    navigateTo: (s: AppScreen) => void;
    upcomingAppointments: Appointment[];
    pastAppointments: Appointment[];
    patientId: string | null;
    onAppointmentAdded: () => void;
}> = ({ navigateTo, upcomingAppointments, pastAppointments, patientId, onAppointmentAdded }) => {
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        specialty: '',
        doctor_name: '',
        appointment_date: '',
        appointment_time: '',
        type: 'Presencial' as 'Presencial' | 'Teleconsulta',
    });

    const canSave = form.specialty && form.doctor_name && form.appointment_date && form.appointment_time && patientId;

    const handleSave = async () => {
        if (!canSave) return;
        setSaving(true);
        await addAppointment({
            patient_id: patientId!,
            doctor_name: form.doctor_name,
            doctor_crm: null,
            specialty: form.specialty,
            appointment_date: form.appointment_date,
            appointment_time: form.appointment_time,
            type: form.type,
            teleconsultation_url: null,
            location: null,
            status: 'Agendada',
            chief_complaint: null,
            doctor_notes: null,
        });
        setSaving(false);
        setShowModal(false);
        setForm({ specialty: '', doctor_name: '', appointment_date: '', appointment_time: '', type: 'Presencial' });
        onAppointmentAdded();
    };

    return (
        <div className="px-5 pt-12 pb-4">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigateTo('home')} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition"><ArrowLeft className="w-5 h-5 text-slate-800" /></button>
                    <h1 className="text-lg font-bold text-slate-900">Minhas Consultas</h1>
                </div>
                <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-[#1D3461] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-[#162749] transition">
                    <Plus className="w-3.5 h-3.5" /> Agendar
                </button>
            </div>

            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Próximas</h2>
            <div className="space-y-3 mb-6">
                {upcomingAppointments.length === 0 ? (
                    <div className="text-center py-8">
                        <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">Nenhuma consulta agendada</p>
                        <button onClick={() => setShowModal(true)} className="mt-3 text-xs font-bold text-[#1D3461] hover:underline">Agendar agora →</button>
                    </div>
                ) : upcomingAppointments.map((apt) => (
                    <div key={apt.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-2">
                            <div><p className="text-sm font-bold text-slate-900">{apt.specialty}</p><p className="text-xs text-slate-500">{apt.doctor_name}</p></div>
                            <StatusBadge status={apt.status} />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-600">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(apt.appointment_date).toLocaleDateString('pt-BR')}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {apt.appointment_time.slice(0, 5)}</span>
                            <span className="flex items-center gap-1">{apt.type === 'Teleconsulta' ? <Video className="w-3.5 h-3.5 text-blue-500" /> : <MapPin className="w-3.5 h-3.5" />}{apt.type}</span>
                        </div>
                    </div>
                ))}
            </div>

            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Histórico</h2>
            <div className="space-y-2.5">
                {pastAppointments.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">Nenhum histórico de consultas.</p>
                ) : pastAppointments.map((h) => (
                    <div key={h.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="flex items-center justify-between mb-1"><p className="text-sm font-bold text-slate-800">{h.specialty}</p><span className="text-[10px] text-slate-500">{new Date(h.appointment_date).toLocaleDateString('pt-BR')}</span></div>
                        <p className="text-xs text-slate-500 mb-1">{h.doctor_name}</p>
                        {h.chief_complaint && <p className="text-xs text-slate-600 leading-relaxed">{h.chief_complaint}</p>}
                        <StatusBadge status={h.status} />
                    </div>
                ))}
            </div>

            {/* ═══ MODAL DE AGENDAMENTO ═══ */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center" onClick={() => setShowModal(false)}>
                    <div className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-8 space-y-5 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[#1D3461]" /> Agendar Consulta
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg transition"><XIcon className="w-5 h-5 text-slate-400" /></button>
                        </div>

                        {/* Especialidade */}
                        <div>
                            <label className="text-xs font-bold text-slate-700 mb-2 block">Especialidade *</label>
                            <div className="flex flex-wrap gap-2">
                                {SPECIALTIES.map(sp => (
                                    <button key={sp} onClick={() => setForm(f => ({ ...f, specialty: sp }))}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${form.specialty === sp ? 'bg-[#1D3461] text-white border-[#1D3461]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                                        {sp}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Médico */}
                        <div>
                            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Nome do Médico *</label>
                            <input type="text" placeholder="Ex: Dr. Marcelo Ferreira" value={form.doctor_name}
                                onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#1D3461]/20 focus:border-[#1D3461] outline-none" />
                        </div>

                        {/* Data e Hora */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Data *</label>
                                <input type="date" value={form.appointment_date}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={e => setForm(f => ({ ...f, appointment_date: e.target.value }))}
                                    className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#1D3461]/20 focus:border-[#1D3461] outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Horário *</label>
                                <input type="time" value={form.appointment_time}
                                    onChange={e => setForm(f => ({ ...f, appointment_time: e.target.value }))}
                                    className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#1D3461]/20 focus:border-[#1D3461] outline-none" />
                            </div>
                        </div>

                        {/* Tipo */}
                        <div>
                            <label className="text-xs font-bold text-slate-700 mb-2 block">Tipo de Consulta</label>
                            <div className="flex gap-2">
                                {(['Presencial', 'Teleconsulta'] as const).map(t => (
                                    <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${form.type === t ? 'bg-[#1D3461] text-white border-[#1D3461]' : 'bg-white text-slate-600 border-slate-200'}`}>
                                        {t === 'Teleconsulta' ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Botão Salvar */}
                        <button onClick={handleSave} disabled={!canSave || saving}
                            className="w-full py-3.5 bg-[#1D3461] hover:bg-[#162749] text-white font-bold text-sm rounded-2xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Agendando...</> : <><Calendar className="w-4 h-4" />Confirmar Agendamento</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// PrescricoesScreen estática removida — usando PrescricoesScreenLive (PatientScreens.tsx)

// ══════════════════════════════════════════════════════════════════════════════════
//  SCREEN: EXAMES
// ══════════════════════════════════════════════════════════════════════════════════
const ExamesScreen: React.FC<{ navigateTo: (s: AppScreen) => void; exams: Exam[] }> = ({ navigateTo, exams }) => (
    <div className="px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigateTo('home')} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition"><ArrowLeft className="w-5 h-5 text-slate-800" /></button>
            <h1 className="text-lg font-bold text-slate-900">Meus Exames</h1>
        </div>
        <div className="space-y-3">
            {exams.length === 0 ? (
                <div className="text-center py-12">
                    <FlaskConical className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Nenhum exame registrado</p>
                </div>
            ) : exams.map((ex) => (
                <div key={ex.id} className={`bg-white rounded-2xl border p-4 shadow-sm ${ex.status === 'Resultado Disponível' ? 'border-emerald-200' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ex.status === 'Resultado Disponível' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                            <FlaskConical className={`w-5 h-5 ${ex.status === 'Resultado Disponível' ? 'text-emerald-600' : 'text-amber-600'}`} />
                        </div>
                        <div><p className="text-sm font-bold text-slate-900">{ex.name}</p><p className="text-xs text-slate-500">{ex.doctor_name || 'Médico não informado'}</p></div>
                    </div>
                    <div className="flex items-center justify-between"><span className="text-[10px] text-slate-400">{new Date(ex.request_date).toLocaleDateString('pt-BR')}</span><StatusBadge status={ex.status} /></div>
                </div>
            ))}
        </div>
    </div>
);

// ══════════════════════════════════════════════════════════════════════════════════
//  SCREEN: TELEMEDICINA (Teleconsulta Imediata com Triagem)
// ══════════════════════════════════════════════════════════════════════════════════
const COMMON_SYMPTOMS = [
    'Dor de cabeça', 'Febre', 'Tosse', 'Dor de garganta', 'Falta de ar',
    'Dor no peito', 'Tontura', 'Náusea / Vômito', 'Dor abdominal',
    'Diarreia', 'Dor nas costas', 'Ansiedade', 'Insônia', 'Alergia / Coceira',
    'Dor muscular', 'Cansaço excessivo',
];

const TelemedicinaScreen: React.FC<{
    navigateTo: (s: AppScreen) => void;
    patientId: string;
    patientName: string;
    latestVitals: VitalSign | null;
}> = ({ navigateTo, patientName, latestVitals }) => {
    const [step, setStep] = useState(1); // 1=Triagem, 2=Vitals, 3=Aguardando
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [otherSymptom, setOtherSymptom] = useState('');
    const [includeVitals, setIncludeVitals] = useState(false);

    const toggleSymptom = (s: string) => {
        setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    };

    const hasSymptoms = selectedSymptoms.length > 0 || otherSymptom.trim().length > 0;

    const handleNext = () => {
        if (step === 1 && hasSymptoms) setStep(2);
        else if (step === 2) setStep(3);
    };

    return (
        <div className="px-5 pt-12 pb-6 min-h-screen">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => step === 1 ? navigateTo('home') : setStep(step - 1)} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition">
                    <ArrowLeft className="w-5 h-5 text-slate-800" />
                </button>
                <div>
                    <h1 className="text-lg font-bold text-slate-900">Consulta Agora</h1>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Teleconsulta imediata • Etapa {step} de 3</p>
                </div>
            </div>

            {/* ── STEP 1: TRIAGEM — O que está sentindo? ── */}
            {step === 1 && (
                <div className="space-y-5">
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <Stethoscope className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">O que você está sentindo?</h2>
                                <p className="text-xs text-slate-400">Selecione seus sintomas para agilizar o atendimento</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {COMMON_SYMPTOMS.map(s => (
                                <button key={s} onClick={() => toggleSymptom(s)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${selectedSymptoms.includes(s) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">Outros sintomas ou detalhes</label>
                            <textarea value={otherSymptom} onChange={e => setOtherSymptom(e.target.value)}
                                placeholder="Descreva com mais detalhes se necessário..."
                                rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none resize-none" />
                        </div>
                    </div>

                    {selectedSymptoms.length > 0 && (
                        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                            <p className="text-xs font-bold text-emerald-700 mb-1">Sintomas selecionados ({selectedSymptoms.length})</p>
                            <p className="text-xs text-emerald-600">{selectedSymptoms.join(' • ')}</p>
                        </div>
                    )}

                    <button onClick={handleNext} disabled={!hasSymptoms}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl transition disabled:opacity-40 flex items-center justify-center gap-2">
                        <ArrowRight className="w-4 h-4" /> Continuar
                    </button>
                </div>
            )}

            {/* ── STEP 2: SINAIS VITAIS (Opcional) ── */}
            {step === 2 && (
                <div className="space-y-5">
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                                <HeartPulse className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">Sinais Vitais</h2>
                                <p className="text-xs text-slate-400">Incluir seus sinais vitais mais recentes ajuda o médico</p>
                            </div>
                        </div>

                        {latestVitals ? (
                            <>
                                <div className="grid grid-cols-2 gap-2.5 mb-4">
                                    {latestVitals.systolic_bp && latestVitals.diastolic_bp && (
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Pressão</p>
                                            <p className="text-sm font-bold text-slate-800">{latestVitals.systolic_bp}/{latestVitals.diastolic_bp} <span className="text-[10px] font-normal text-slate-400">mmHg</span></p>
                                        </div>
                                    )}
                                    {latestVitals.heart_rate && (
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Frequência</p>
                                            <p className="text-sm font-bold text-slate-800">{latestVitals.heart_rate} <span className="text-[10px] font-normal text-slate-400">bpm</span></p>
                                        </div>
                                    )}
                                    {latestVitals.temperature && (
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Temperatura</p>
                                            <p className="text-sm font-bold text-slate-800">{latestVitals.temperature} <span className="text-[10px] font-normal text-slate-400">°C</span></p>
                                        </div>
                                    )}
                                    {latestVitals.oxygen_saturation && (
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">SpO₂</p>
                                            <p className="text-sm font-bold text-slate-800">{latestVitals.oxygen_saturation} <span className="text-[10px] font-normal text-slate-400">%</span></p>
                                        </div>
                                    )}
                                </div>
                                <label className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl cursor-pointer border border-blue-100">
                                    <input type="checkbox" checked={includeVitals} onChange={e => setIncludeVitals(e.target.checked)}
                                        className="w-4 h-4 rounded text-blue-600" />
                                    <span className="text-xs font-semibold text-blue-800">Enviar estes sinais vitais ao médico</span>
                                </label>
                                <p className="text-[10px] text-slate-400 mt-2">
                                    Registrado em {new Date(latestVitals.recorded_at || latestVitals.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </>
                        ) : (
                            <div className="text-center py-6">
                                <Thermometer className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                <p className="text-xs text-slate-400 mb-2">Nenhum sinal vital registrado</p>
                                <button onClick={() => navigateTo('sinais-vitais')} className="text-xs font-bold text-blue-600 hover:underline">
                                    Registrar sinais vitais →
                                </button>
                            </div>
                        )}
                    </div>

                    <button onClick={handleNext}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2">
                        <Send className="w-4 h-4" /> Solicitar Atendimento
                    </button>
                </div>
            )}

            {/* ── STEP 3: AGUARDANDO MÉDICO ── */}
            {step === 3 && (
                <div className="space-y-5">
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm text-center">
                        {/* Animação pulsante */}
                        <div className="relative w-24 h-24 mx-auto mb-5">
                            <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                            <div className="absolute inset-2 rounded-full bg-emerald-400/30 animate-pulse" />
                            <div className="absolute inset-4 rounded-full bg-emerald-500 flex items-center justify-center">
                                <Video className="w-8 h-8 text-white" />
                            </div>
                        </div>

                        <h2 className="text-base font-bold text-slate-900 mb-1">Aguardando médico disponível</h2>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">
                            Olá, <span className="font-semibold">{patientName}</span>! Sua solicitação de teleconsulta foi recebida. 
                            Um profissional irá atendê-lo assim que possível.
                        </p>

                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 mb-4">
                            <div className="flex items-center gap-2 justify-center mb-1">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                <p className="text-xs font-bold text-amber-700">Tempo estimado de espera</p>
                            </div>
                            <p className="text-xs text-amber-600">O tempo depende da disponibilidade de médicos. Você será notificado quando o atendimento iniciar.</p>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Resumo da triagem</p>
                            <div className="space-y-1.5">
                                <div className="flex items-start gap-2">
                                    <Stethoscope className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-slate-600">{[...selectedSymptoms, otherSymptom.trim()].filter(Boolean).join(', ')}</p>
                                </div>
                                {includeVitals && latestVitals && (
                                    <div className="flex items-start gap-2">
                                        <HeartPulse className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-slate-600">Sinais vitais enviados ao médico</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <button onClick={() => navigateTo('home')}
                        className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Voltar para o início
                    </button>
                </div>
            )}
        </div>
    );
};

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
        <div className="flex flex-col items-center px-5 pt-8 pb-4 min-h-full bg-gradient-to-b from-[#0F172A] via-[#1D3461] to-[#0A1120]">
            <div className="relative mb-2">
                <img
                    src="/liz-avatar.jpg"
                    alt="LIZ AI"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-xl"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
            </div>
            <h1 className="text-lg font-bold text-white mb-0.5">Assistente <span className="text-blue-300">LIZ</span></h1>
            <p className="text-[10px] text-slate-300 mb-2">Coordenadora do Cuidado • IA Contextual</p>
            <div className="bg-white/10 border border-white/15 backdrop-blur-md rounded-full px-3 py-1 mb-5 flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-blue-300" />
                <span className="text-[10px] text-blue-100 font-semibold">Conectada ao painel de {clinicalContext.patientName}</span>
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
    patient: PatientDisplayData;
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
