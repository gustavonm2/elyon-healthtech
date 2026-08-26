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
