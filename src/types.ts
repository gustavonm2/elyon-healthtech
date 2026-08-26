export type RiskRating = 'red' | 'orange' | 'yellow' | 'green' | 'blue';

export type ProfessionalRole = 'triador' | 'parecerista' | 'telemedicina' | 'gestor_master' | 'recepcao_upa' | 'triagem_upa';

export interface ClinicMember {
    id: string;
    name: string;
    email: string;
    password: string;
    role: ProfessionalRole;
    groupId: string;
    createdAt: string;
    cpf?: string;
    conselho?: string;
}

export interface ClinicGroup {
    id: string;
    name: string;
    specialty: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
    members: ClinicMember[];
    createdAt: string;
}

export interface QueueItem {
    id: string;
    patientName: string;
    age: number;
    arrivalTime: string;
    bloodPressure: string;
    riskRating: RiskRating;
    type: string;
    status: 'waiting' | 'in_progress' | 'finished';
    waitTime: string;
    requesterName?: string;
    requestDescription?: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
}

export interface OpinionRequest {
    id: string;
    patientName: string;
    specialty: string;
    doctorName: string;
    requestDate: string;
    deadline: string;
    priority: 'Urgente' | 'Rotina';
    status: 'Pendente' | 'Respondido' | 'Atrasado';
    description: string;
}

// Interfaces for Patient Details
export interface ConsultationHistoryItem {
    id: string;
    date: string;
    chiefComplaint: string;
    conducts: {
        prescriptions?: string[];
        exams?: string[];
        documents?: string[];
        orientations?: string[];
    };
}

export interface PatientDetailedInfo extends QueueItem {
    contact: string;
    email?: string;
    gender: string;
    heartRate: string;
    temperature: string;
    oxygenSaturation: string;
    currentChiefComplaint: string;
    clinicalReport?: string;
    attachedImages?: string[];
    medications?: {
        continuous: string[];
        current: string[];
    };
    pastIllnesses?: string[];
    familyHistory?: string[];
    examResults?: {
        name: string;
        date: string;
        fileUrl: string;
    }[];
    history: ConsultationHistoryItem[];
}
