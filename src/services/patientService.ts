import { supabasePatients } from '../lib/supabasePatients';

// ── Types ────────────────────────────────────────────────────────────────────────
export interface Patient {
    id: string;
    full_name: string;
    cpf: string;
    birth_date: string;
    gender: 'masculino' | 'feminino' | 'outro' | 'prefiro_nao_dizer';
    phone: string | null;
    email: string | null;
    city: string | null;
    state: string | null;
    address: string | null;
    zip_code: string | null;
    blood_type: string | null;
    allergies: string[];
    chronic_conditions: string[];
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    password: string;
    status: 'ativo' | 'inativo' | 'suspenso';
    created_at: string;
    updated_at: string;
}

export type PatientInsert = Omit<Patient, 'id' | 'created_at' | 'updated_at' | 'status'>;

// ── Login ────────────────────────────────────────────────────────────────────────
export async function loginPatient(cpf: string, password: string): Promise<Patient | null> {
    const cleanCPF = cpf.replace(/\D/g, '');
    const { data, error } = await supabasePatients
        .from('patients')
        .select('*')
        .eq('cpf', cleanCPF)
        .eq('password', password)
        .eq('status', 'ativo')
        .limit(1)
        .single();

    if (error || !data) return null;
    return data as Patient;
}

// ── Register ─────────────────────────────────────────────────────────────────────
export async function registerPatient(patient: PatientInsert): Promise<{ data: Patient | null; error: string | null }> {
    const cleanCPF = patient.cpf.replace(/\D/g, '');

    // Check if CPF already exists
    const { data: existing } = await supabasePatients
        .from('patients')
        .select('id')
        .eq('cpf', cleanCPF)
        .limit(1);

    if (existing && existing.length > 0) {
        return { data: null, error: 'CPF já cadastrado no sistema.' };
    }

    const { data, error } = await supabasePatients
        .from('patients')
        .insert({ ...patient, cpf: cleanCPF })
        .select()
        .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Patient, error: null };
}

// ── Get Patient by ID ────────────────────────────────────────────────────────────
export async function getPatientById(id: string): Promise<Patient | null> {
    const { data, error } = await supabasePatients
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) return null;
    return data as Patient;
}

// ── Update Patient ───────────────────────────────────────────────────────────────
export async function updatePatient(id: string, updates: Partial<Patient>): Promise<{ data: Patient | null; error: string | null }> {
    const { data, error } = await supabasePatients
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Patient, error: null };
}

// ── List All Patients ────────────────────────────────────────────────────────────
export async function listPatients(): Promise<Patient[]> {
    const { data, error } = await supabasePatients
        .from('patients')
        .select('*')
        .eq('status', 'ativo')
        .order('full_name', { ascending: true });

    if (error || !data) return [];
    return data as Patient[];
}

// ── Helper: Calculate Age ────────────────────────────────────────────────────────
export function calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

// ── Helper: Format CPF ───────────────────────────────────────────────────────────
export function formatCPF(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

// ── Helper: Mask CPF for display ─────────────────────────────────────────────────
export function maskCPF(cpf: string): string {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length < 11) return cpf;
    return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
}

// ══════════════════════════════════════════════════════════════════════════════════
//  MEDICATIONS
// ══════════════════════════════════════════════════════════════════════════════════

export interface Medication {
    id: string;
    patient_id: string;
    medication_name: string;
    dosage: string;
    frequency: string;
    prescribing_doctor: string | null;
    start_date: string | null;
    end_date: string | null;
    notes: string | null;
    active: boolean;
    created_at: string;
    updated_at: string;
}

export type MedicationInsert = Pick<Medication, 'patient_id' | 'medication_name' | 'dosage' | 'frequency'> & {
    prescribing_doctor?: string | null;
    notes?: string | null;
};

export async function listMedications(patientId: string): Promise<Medication[]> {
    const { data, error } = await supabasePatients
        .from('patient_medications')
        .select('*')
        .eq('patient_id', patientId)
        .order('active', { ascending: false })
        .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data as Medication[];
}

export async function addMedication(med: MedicationInsert): Promise<{ data: Medication | null; error: string | null }> {
    const { data, error } = await supabasePatients
        .from('patient_medications')
        .insert(med)
        .select()
        .single();
    if (error) return { data: null, error: error.message };
    return { data: data as Medication, error: null };
}

export async function toggleMedication(id: string, active: boolean): Promise<boolean> {
    const { error } = await supabasePatients
        .from('patient_medications')
        .update({ active })
        .eq('id', id);
    return !error;
}

export async function deleteMedication(id: string): Promise<boolean> {
    const { error } = await supabasePatients
        .from('patient_medications')
        .delete()
        .eq('id', id);
    return !error;
}

// ══════════════════════════════════════════════════════════════════════════════════
//  HEALTH PROFILE (Triagem de Saúde LIZ)
// ══════════════════════════════════════════════════════════════════════════════════

export interface HealthProfile {
    id: string;
    patient_id: string;
    daily_routine: string | null;
    exercise_frequency: string | null;
    diet_description: string | null;
    sleep_hours: string | null;
    smoking: string | null;
    alcohol: string | null;
    past_diseases: string[];
    family_history: string[];
    surgeries: string[];
    hospitalizations: string | null;
    stress_level: string | null;
    mental_health_notes: string | null;
    liz_health_summary: string | null;
    liz_risk_factors: string[];
    liz_recommendations: string[];
    triage_completed: boolean;
    triage_completed_at: string | null;
    created_at: string;
    updated_at: string;
}

export async function getHealthProfile(patientId: string): Promise<HealthProfile | null> {
    const { data, error } = await supabasePatients
        .from('patient_health_profiles')
        .select('*')
        .eq('patient_id', patientId)
        .limit(1)
        .single();
    if (error || !data) return null;
    return data as HealthProfile;
}

export async function upsertHealthProfile(
    patientId: string,
    profile: Partial<Omit<HealthProfile, 'id' | 'patient_id' | 'created_at' | 'updated_at'>>
): Promise<{ data: HealthProfile | null; error: string | null }> {
    const { data, error } = await supabasePatients
        .from('patient_health_profiles')
        .upsert({ patient_id: patientId, ...profile }, { onConflict: 'patient_id' })
        .select()
        .single();
    if (error) return { data: null, error: error.message };
    return { data: data as HealthProfile, error: null };
}

// ══════════════════════════════════════════════════════════════════════════════════
//  LIZ INTERACTIONS (Logging & Monitor)
// ══════════════════════════════════════════════════════════════════════════════════

export interface LizInteraction {
    id: string;
    patient_id: string;
    interaction_type: 'voice' | 'text' | 'proactive';
    patient_message: string | null;
    liz_response: string | null;
    topic: string | null;
    created_at: string;
}

export async function logLizInteraction(
    patientId: string,
    type: 'voice' | 'text' | 'proactive',
    patientMessage?: string | null,
    lizResponse?: string | null,
    topic?: string | null
): Promise<void> {
    await supabasePatients.from('liz_interactions').insert({
        patient_id: patientId,
        interaction_type: type,
        patient_message: patientMessage || null,
        liz_response: lizResponse || null,
        topic: topic || null,
    });
}

export interface MonitorPatientRow {
    patient_id: string;
    patient_name: string;
    patient_initials: string;
    total: number;
    voice: number;
    text: number;
    proactive: number;
    last_interaction_at: string | null;
    topics: string[];
}

export async function getMonitorData(): Promise<MonitorPatientRow[]> {
    // 1. Get all interactions joined with patient names
    const { data: interactions, error } = await supabasePatients
        .from('liz_interactions')
        .select('patient_id, interaction_type, topic, created_at, patients!inner(full_name)')
        .order('created_at', { ascending: false });

    if (error || !interactions || interactions.length === 0) return [];

    // 2. Aggregate per patient
    const map = new Map<string, {
        name: string; total: number; voice: number; text: number; proactive: number;
        lastAt: string; topicSet: Set<string>;
    }>();

    for (const row of interactions) {
        const pid = row.patient_id;
        const pName = (row as any).patients?.full_name || 'Paciente';
        if (!map.has(pid)) {
            map.set(pid, { name: pName, total: 0, voice: 0, text: 0, proactive: 0, lastAt: row.created_at, topicSet: new Set() });
        }
        const entry = map.get(pid)!;
        entry.total++;
        if (row.interaction_type === 'voice') entry.voice++;
        else if (row.interaction_type === 'text') entry.text++;
        else if (row.interaction_type === 'proactive') entry.proactive++;
        if (row.topic) entry.topicSet.add(row.topic);
        if (row.created_at > entry.lastAt) entry.lastAt = row.created_at;
    }

    // 3. Convert to array sorted by total desc
    const result: MonitorPatientRow[] = [];
    map.forEach((v, pid) => {
        const initials = v.name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
        result.push({
            patient_id: pid,
            patient_name: v.name,
            patient_initials: initials,
            total: v.total,
            voice: v.voice,
            text: v.text,
            proactive: v.proactive,
            last_interaction_at: v.lastAt,
            topics: Array.from(v.topicSet),
        });
    });

    result.sort((a, b) => b.total - a.total);
    return result;
}
