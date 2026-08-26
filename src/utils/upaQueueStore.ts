// ── UPA Queue / TV Call Store ─────────────────────────────────────────────────
// Simple localStorage-based store to simulate the communication between
// the reception desk, the triage nurse, and the TV panel in the waiting room.

export interface TriagedPatient {
    id: number;
    name: string;
    age: number;
    cpf: string;
    arrivalTime: string;
    complaint: string;
    riskClassification: 'Vermelho' | 'Laranja' | 'Amarelo' | 'Verde' | 'Azul';
    riskLabel: string;
    bloodPressure: string;
    heartRate: string;
    temperature: string;
    oxygenSaturation: string;
    glicemia?: string;            // glicemia em mg/dL
    weight?: string;              // peso em kg
    destination: string;          // e.g. "Consultório 02", "Sala Vermelha"
    calledAt?: string;            // ISO timestamp of when patient was called
    status: 'aguardando' | 'chamado' | 'em_atendimento' | 'finalizado';
    // Triage fields requested by nurse profile:
    symptomOnsetTime?: string;    // tempo de início dos sintomas
    preExistingConditions?: string[]; // doença pregressa
    otherConditions?: string;     // outros a digitar
    allergies?: string;           // alergias
}

export interface WaitingPatient {
    id: number;
    name: string;
    age: number;
    cpf: string;
    arrivalTime: string;
    initialComplaint: string;
    status: 'aguardando' | 'em_triagem' | 'triado';
}

const STORAGE_KEY = 'upa_triaged_queue';
const WAITING_KEY = 'upa_waiting_triage_queue';
const CURRENT_CALL_KEY = 'upa_current_call';
const CALL_HISTORY_KEY = 'upa_call_history';

// ── Simulated triaged patients (initial queue) ───────────────────────────────

const INITIAL_QUEUE: TriagedPatient[] = [
    {
        id: 1, name: 'Maria Clara da Silva', age: 45, cpf: '123.456.789-00',
        arrivalTime: '08:12', complaint: 'Dor torácica intensa, irradiação para braço esquerdo',
        riskClassification: 'Vermelho', riskLabel: 'Emergência',
        bloodPressure: '180/110', heartRate: '112 bpm', temperature: '36.8°C', oxygenSaturation: '94%',
        glicemia: '104 mg/dL', weight: '68 kg',
        destination: 'Sala Vermelha', status: 'aguardando',
        symptomOnsetTime: 'Há 2 horas', preExistingConditions: ['Hipertensão', 'Diabetes'],
        allergies: 'Dipirona',
    },
    {
        id: 2, name: 'João Pedro Santos', age: 32, cpf: '987.654.321-11',
        arrivalTime: '08:30', complaint: 'Febre persistente há 3 dias (39.2°C), tosse seca, cefaleia',
        riskClassification: 'Laranja', riskLabel: 'Muito Urgente',
        bloodPressure: '130/85', heartRate: '98 bpm', temperature: '39.2°C', oxygenSaturation: '96%',
        glicemia: '92 mg/dL', weight: '74 kg',
        destination: 'Consultório 03', status: 'aguardando',
        symptomOnsetTime: '3 dias', preExistingConditions: ['Nenhuma'],
        allergies: 'Nenhuma conhecida',
    },
    {
        id: 3, name: 'Ana Júlia Oliveira', age: 68, cpf: '456.789.123-22',
        arrivalTime: '08:45', complaint: 'Queda da própria altura com dor intensa no quadril direito',
        riskClassification: 'Laranja', riskLabel: 'Muito Urgente',
        bloodPressure: '145/90', heartRate: '88 bpm', temperature: '36.5°C', oxygenSaturation: '97%',
        glicemia: '115 mg/dL', weight: '62 kg',
        destination: 'Consultório 01', status: 'aguardando',
        symptomOnsetTime: 'Há 1 hora', preExistingConditions: ['Hipertensão', 'Doença Cardíaca'],
        allergies: 'Penicilina',
    },
];

// ── Simulated patients waiting for Nurse Triage ───────────────────────────────

const INITIAL_WAITING_QUEUE: WaitingPatient[] = [
    { id: 101, name: 'Cláudio Moreira da Silva', age: 50, cpf: '234.567.890-12', arrivalTime: '09:05', initialComplaint: 'Falta de ar progressiva e chiado no peito', status: 'aguardando' },
    { id: 102, name: 'Juliana Paes Santana', age: 29, cpf: '345.678.901-23', arrivalTime: '09:20', initialComplaint: 'Dor de cabeça súbita de forte intensidade com náuseas', status: 'aguardando' },
    { id: 103, name: 'Renato Aragão Góes', age: 74, cpf: '456.789.012-34', arrivalTime: '09:40', initialComplaint: 'Confusão mental, tontura e dor no peito', status: 'aguardando' },
    { id: 104, name: 'Carla Diaz Barbosa', age: 19, cpf: '567.890.123-45', arrivalTime: '09:55', initialComplaint: 'Suspeita de fratura no punho direito após queda de skate', status: 'aguardando' },
    { id: 105, name: 'Marcos Mion de Souza', age: 43, cpf: '678.901.234-56', arrivalTime: '10:05', initialComplaint: 'Crise de ansiedade severa com taquicardia e formigamento', status: 'aguardando' },
];

// ── Getters & Setters ────────────────────────────────────────────────────────

export function getTriagedQueue(): TriagedPatient[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_QUEUE));
        return INITIAL_QUEUE;
    }
    return JSON.parse(raw);
}

function saveQueue(queue: TriagedPatient[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function getWaitingTriageQueue(): WaitingPatient[] {
    const raw = localStorage.getItem(WAITING_KEY);
    if (!raw) {
        localStorage.setItem(WAITING_KEY, JSON.stringify(INITIAL_WAITING_QUEUE));
        return INITIAL_WAITING_QUEUE;
    }
    return JSON.parse(raw);
}

function saveWaitingQueue(queue: WaitingPatient[]) {
    localStorage.setItem(WAITING_KEY, JSON.stringify(queue));
}

export function getCurrentCall(): TriagedPatient | null {
    const raw = localStorage.getItem(CURRENT_CALL_KEY);
    return raw ? JSON.parse(raw) : null;
}

export function getCallHistory(): TriagedPatient[] {
    const raw = localStorage.getItem(CALL_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
}

/** Register a patient check-in at reception */
export function registerUpaCheckIn(name: string, age: number, cpf: string, initialComplaint: string): WaitingPatient {
    const queue = getWaitingTriageQueue();
    const pad = (n: number) => String(n).padStart(2, '0');
    const now = new Date();
    const arrivalTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    
    const newPatient: WaitingPatient = {
        id: Date.now(),
        name,
        age,
        cpf,
        arrivalTime,
        initialComplaint,
        status: 'aguardando'
    };

    saveWaitingQueue([newPatient, ...queue]);
    window.dispatchEvent(new Event('upa-waiting-list-updated'));
    return newPatient;
}

/** Submit triage details for a patient, moving them to the triaged queue */
export function submitNurseTriage(
    patientId: number,
    triageData: {
        complaint: string;
        symptomOnsetTime: string;
        preExistingConditions: string[];
        otherConditions?: string;
        allergies: string;
        bloodPressure: string;
        heartRate: string;
        temperature: string;
        oxygenSaturation: string;
        glicemia: string;
        weight: string;
        riskClassification: 'Vermelho' | 'Laranja' | 'Amarelo' | 'Verde' | 'Azul';
        destination: string;
    }
): TriagedPatient | null {
    // 1. Remove from waiting queue or set status to triado
    const waitingQueue = getWaitingTriageQueue();
    const patientIdx = waitingQueue.findIndex(p => p.id === patientId);
    if (patientIdx === -1) return null;
    
    const waitingPatient = waitingQueue[patientIdx];
    waitingQueue.splice(patientIdx, 1); // remove from wait list
    saveWaitingQueue(waitingQueue);

    // 2. Add to triaged queue
    const triagedQueue = getTriagedQueue();
    const labels: Record<string, string> = {
        'Vermelho': 'Emergência',
        'Laranja': 'Muito Urgente',
        'Amarelo': 'Urgente',
        'Verde': 'Pouco Urgente',
        'Azul': 'Não Urgente'
    };

    const newTriaged: TriagedPatient = {
        id: waitingPatient.id,
        name: waitingPatient.name,
        age: waitingPatient.age,
        cpf: waitingPatient.cpf,
        arrivalTime: waitingPatient.arrivalTime,
        complaint: triageData.complaint,
        riskClassification: triageData.riskClassification,
        riskLabel: labels[triageData.riskClassification],
        bloodPressure: triageData.bloodPressure,
        heartRate: triageData.heartRate,
        temperature: triageData.temperature,
        oxygenSaturation: triageData.oxygenSaturation,
        glicemia: triageData.glicemia,
        weight: triageData.weight,
        destination: triageData.destination,
        status: 'aguardando',
        symptomOnsetTime: triageData.symptomOnsetTime,
        preExistingConditions: triageData.preExistingConditions,
        otherConditions: triageData.otherConditions,
        allergies: triageData.allergies
    };

    triagedQueue.unshift(newTriaged);
    saveQueue(triagedQueue);

    // Dispatch update event
    window.dispatchEvent(new Event('upa-triaged-list-updated'));
    window.dispatchEvent(new Event('upa-waiting-list-updated'));

    return newTriaged;
}

/** Call a patient — moves them to "chamado" and saves as current call */
export function callPatient(patientId: number): TriagedPatient | null {
    const queue = getTriagedQueue();
    const idx = queue.findIndex(p => p.id === patientId);
    if (idx === -1) return null;

    const patient = { ...queue[idx], status: 'chamado' as const, calledAt: new Date().toISOString() };
    queue[idx] = patient;
    saveQueue(queue);

    // Save as current call
    localStorage.setItem(CURRENT_CALL_KEY, JSON.stringify(patient));

    // Add to history
    const history = getCallHistory();
    history.unshift(patient);
    localStorage.setItem(CALL_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));

    // Dispatch event so the TV panel reacts in real time
    window.dispatchEvent(new CustomEvent('upa-patient-called', { detail: patient }));

    return patient;
}

/** Move patient to "em_atendimento" */
export function startAtendimento(patientId: number): void {
    const queue = getTriagedQueue();
    const idx = queue.findIndex(p => p.id === patientId);
    if (idx === -1) return;
    queue[idx] = { ...queue[idx], status: 'em_atendimento' };
    saveQueue(queue);
}

/** Reset queue (for dev purposes) */
export function resetUpaQueue(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(WAITING_KEY);
    localStorage.removeItem(CURRENT_CALL_KEY);
    localStorage.removeItem(CALL_HISTORY_KEY);
    window.dispatchEvent(new Event('upa-waiting-list-updated'));
    window.dispatchEvent(new Event('upa-triaged-list-updated'));
}

// ── Risk Classification Colors (Manchester Protocol) ─────────────────────────

export const RISK_COLORS: Record<string, { bg: string; text: string; solid: string; label: string }> = {
    'Vermelho': { bg: '#FEF2F2', text: '#991B1B', solid: '#DC2626', label: 'Emergência' },
    'Laranja':  { bg: '#FFF7ED', text: '#9A3412', solid: '#EA580C', label: 'Muito Urgente' },
    'Amarelo':  { bg: '#FEFCE8', text: '#854D0E', solid: '#CA8A04', label: 'Urgente' },
    'Verde':    { bg: '#F0FDF4', text: '#166534', solid: '#16A34A', label: 'Pouco Urgente' },
    'Azul':     { bg: '#EFF6FF', text: '#1E40AF', solid: '#2563EB', label: 'Não Urgente' },
};

// Manchester Protocol — maximum wait time in minutes before being seen
export const MANCHESTER_MAX_WAIT: Record<string, number> = {
    'Vermelho': 0,    // Immediate
    'Laranja':  10,   // Up to 10 min
    'Amarelo':  60,   // Up to 60 min
    'Verde':    120,  // Up to 120 min
    'Azul':     240,  // Up to 240 min
};

