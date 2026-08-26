// ─── patientStore.ts ────────────────────────────────────────────────────────
// Central utility for reading and writing shared patient data to localStorage.
// This simulates a backend API while the app uses a frontend-only architecture.
// ─────────────────────────────────────────────────────────────────────────────

export interface StoredOpinion {
    id: string;
    patientId: string;
    patientName: string;
    specialty: string;
    doctor: string;
    date: string;
    summary: string;
    isNew: boolean; // unread flag for patient portal
}

export interface StoredConsulta {
    patientId: string;
    patientName: string;
    date: string;     // e.g. "20/03/2026"
    time: string;     // e.g. "10:00"
    type: string;     // e.g. "Retorno Online"
    status: 'aguardando_whatsapp' | 'aguardando_medico' | 'confirmado';
    modalidade: 'online' | 'parecer';
    doctorConfirmed?: boolean;
}

export interface StoredTriagem {
    id: string;
    patientId: string;
    patientName: string;
    cpf: string;
    age: number;
    // Pre-filled from registration
    initialSymptoms: string;
    cadastroDate: string;
    cadastroTime: string;
    // Filled by triador
    priority: 'Alta' | 'Média' | 'Baixa';
    pa: string;          // e.g. "120/80 mmHg"
    fc: string;          // e.g. "72 bpm"
    temperatura: string; // e.g. "36.5°C"
    spo2: string;        // e.g. "98%"
    queixaDetalhada: string;
    hipotese: string;
    modalidade: 'online' | 'parecer';
    especialidade: string;
    observacoes: string;
    // Metadata
    triadoEm: string;
    triadoPor: string;
    status: 'aguardando_parecer' | 'em_atendimento' | 'finalizado';
}

const OPINOES_KEY = 'pc_opinoes';
const CONSULTA_KEY = 'pc_consulta';
const MODALIDADE_KEY = 'pc_modalidade';
const TRIAGENS_KEY = 'pc_triagens';
const CLINICAL_IMAGES_KEY = 'pc_clinical_images';


// ── Opiniões / Pareceres ──────────────────────────────────────────────────────

export function getOpinioes(patientId?: string): StoredOpinion[] {
    try {
        const raw = localStorage.getItem(OPINOES_KEY);
        const all: StoredOpinion[] = raw ? JSON.parse(raw) : [];
        if (patientId) return all.filter(o => o.patientId === patientId);
        return all;
    } catch {
        return [];
    }
}

export function addOpiniao(opinion: Omit<StoredOpinion, 'id' | 'isNew'>): StoredOpinion {
    const existing = getOpinioes();
    const newOpinion: StoredOpinion = {
        ...opinion,
        id: `op_${Date.now()}`,
        isNew: true,
    };
    localStorage.setItem(OPINOES_KEY, JSON.stringify([newOpinion, ...existing]));
    return newOpinion;
}

export function markOpiniaoAsRead(opinionId: string): void {
    const existing = getOpinioes();
    const updated = existing.map(o => o.id === opinionId ? { ...o, isNew: false } : o);
    localStorage.setItem(OPINOES_KEY, JSON.stringify(updated));
}

export function hasNewOpinioes(patientId?: string): boolean {
    return getOpinioes(patientId).some(o => o.isNew);
}

// ── Consulta agendada (Telemedicina) ─────────────────────────────────────────

export function getConsulta(): StoredConsulta | null {
    try {
        const raw = localStorage.getItem(CONSULTA_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function setConsulta(data: StoredConsulta): void {
    localStorage.setItem(CONSULTA_KEY, JSON.stringify(data));
}

export function updateConsultaStatus(status: StoredConsulta['status']): void {
    const current = getConsulta();
    if (current) {
        localStorage.setItem(CONSULTA_KEY, JSON.stringify({ ...current, status }));
    }
}

export function confirmConsultaByDoctor(): void {
    const current = getConsulta();
    if (current) {
        localStorage.setItem(CONSULTA_KEY, JSON.stringify({
            ...current,
            status: 'confirmado',
            doctorConfirmed: true,
        }));
    }
}

// ── Modalidade do paciente ────────────────────────────────────────────────────

export function getModalidadePaciente(): 'online' | 'parecer' | null {
    const m = localStorage.getItem(MODALIDADE_KEY);
    if (m === 'online' || m === 'parecer') return m;
    return null;
}

export function setModalidadePaciente(modalidade: 'online' | 'parecer'): void {
    localStorage.setItem(MODALIDADE_KEY, modalidade);
}

// ── Dev helpers (for testing the flow) ───────────────────────────────────────

export function simulateWhatsAppConfirmation(patientName: string): void {
    setConsulta({
        patientId: 'current',
        patientName,
        date: '20/03/2026',
        time: '10:00',
        type: 'Teleconsulta Online',
        status: 'aguardando_medico',
        modalidade: 'online',
    });
}

// ── Triagens (Triador → Parecerista) ─────────────────────────────────────────

export function getTriagens(): StoredTriagem[] {
    try {
        const raw = localStorage.getItem(TRIAGENS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function addTriagem(triagem: Omit<StoredTriagem, 'id' | 'status' | 'triadoEm'>): StoredTriagem {
    const existing = getTriagens();
    const newTriagem: StoredTriagem = {
        ...triagem,
        id: `tri_${Date.now()}`,
        status: 'aguardando_parecer',
        triadoEm: new Date().toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }),
    };
    localStorage.setItem(TRIAGENS_KEY, JSON.stringify([newTriagem, ...existing]));
    return newTriagem;
}

export function updateTriagemStatus(id: string, status: StoredTriagem['status']): void {
    const existing = getTriagens();
    const updated = existing.map(t => t.id === id ? { ...t, status } : t);
    localStorage.setItem(TRIAGENS_KEY, JSON.stringify(updated));
}

export function clearPatientStore(): void {
    localStorage.removeItem(OPINOES_KEY);
    localStorage.removeItem(CONSULTA_KEY);
    localStorage.removeItem(MODALIDADE_KEY);
    localStorage.removeItem(TRIAGENS_KEY);
}

// ── Suporte Técnico (Tickets / Chat) ─────────────────────────────────────────

export interface TicketReply {
    author: string;    // display name
    authorRole: string;
    text: string;
    date: string;
}

export interface StoredTicket {
    id: string;
    tipo: 'chamado' | 'chat';
    authorRole: string;   // e.g. 'triador', 'paciente'
    authorName: string;
    subject: string;
    message: string;
    status: 'aberto' | 'em_andamento' | 'resolvido';
    replies: TicketReply[];
    createdAt: string;  // dd/mm/yyyy hh:mm
    hasUnreadReply: boolean; // unread for the original author
}

const TICKETS_KEY = 'pc_tickets';

export function getTickets(): StoredTicket[] {
    try {
        const raw = localStorage.getItem(TICKETS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function getTicketsByAuthor(authorName: string, authorRole: string): StoredTicket[] {
    return getTickets().filter(t => t.authorName === authorName && t.authorRole === authorRole);
}

export function addTicket(
    data: Pick<StoredTicket, 'tipo' | 'authorRole' | 'authorName' | 'subject' | 'message'>
): StoredTicket {
    const existing = getTickets();
    const now = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
    const newTicket: StoredTicket = {
        ...data,
        id: `tkt_${Date.now()}`,
        status: 'aberto',
        replies: [],
        createdAt: now,
        hasUnreadReply: false,
    };
    localStorage.setItem(TICKETS_KEY, JSON.stringify([newTicket, ...existing]));
    return newTicket;
}

export function addTicketReply(ticketId: string, reply: Omit<TicketReply, 'date'>): void {
    const existing = getTickets();
    const now = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
    const updated = existing.map(t => {
        if (t.id !== ticketId) return t;
        const isManagerReply = reply.authorRole === 'gestor_master';
        return {
            ...t,
            replies: [...t.replies, { ...reply, date: now }],
            status: t.status === 'aberto' ? 'em_andamento' as const : t.status,
            hasUnreadReply: isManagerReply ? true : t.hasUnreadReply,
        };
    });
    localStorage.setItem(TICKETS_KEY, JSON.stringify(updated));
}

export function markTicketRepliesRead(ticketId: string): void {
    const existing = getTickets();
    const updated = existing.map(t => t.id === ticketId ? { ...t, hasUnreadReply: false } : t);
    localStorage.setItem(TICKETS_KEY, JSON.stringify(updated));
}

export function updateTicketStatus(ticketId: string, status: StoredTicket['status']): void {
    const existing = getTickets();
    const updated = existing.map(t => t.id === ticketId ? { ...t, status } : t);
    localStorage.setItem(TICKETS_KEY, JSON.stringify(updated));
}

export function getOpenTicketsCount(): number {
    return getTickets().filter(t => t.status !== 'resolvido').length;
}

// ── Avaliações (Patient → Parecerista) ───────────────────────────────────────

export interface StoredRating {
    id: string;
    doctorName: string;
    doctorSpecialty: string;
    /** The team/clinic the doctor belongs to */
    team: string;
    patientName: string;
    stars: number;       // 1–5
    comment: string;
    date: string;        // dd/mm/yyyy
    consultaId: string;  // links back to a triagem / consulta id
}

const RATINGS_KEY = 'pc_ratings';

export function getRatings(): StoredRating[] {
    try {
        const raw = localStorage.getItem(RATINGS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function getRatingsByDoctor(doctorName: string): StoredRating[] {
    return getRatings().filter(r => r.doctorName === doctorName);
}

export function getRatingsByTeam(team: string): StoredRating[] {
    return getRatings().filter(r => r.team === team);
}

export function addRating(rating: Omit<StoredRating, 'id'>): StoredRating {
    const existing = getRatings();
    const newRating: StoredRating = { ...rating, id: `rat_${Date.now()}` };
    localStorage.setItem(RATINGS_KEY, JSON.stringify([newRating, ...existing]));
    return newRating;
}

/** Average stars for a given doctor (0 if no ratings) */
export function getAverageStars(doctorName: string): number {
    const ratings = getRatingsByDoctor(doctorName);
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + r.stars, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
}

/** Seed mock ratings so the UI looks populated for demo purposes */
export function seedMockRatings(): void {
    if (getRatings().length > 0) return; // already seeded
    const today = new Date();
    const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const mockRatings: Omit<StoredRating, 'id'>[] = [
        { doctorName: 'Dr. Marcelo Ferreira', doctorSpecialty: 'Cardiologia', team: 'Clínica SCI', patientName: 'Carlos Lima', stars: 5, comment: 'Atendimento excelente, muito atencioso e claro nas explicações.', date: fmt(new Date(today.getTime() - 2 * 86400000)), consultaId: 'tri_001' },
        { doctorName: 'Dr. Marcelo Ferreira', doctorSpecialty: 'Cardiologia', team: 'Clínica SCI', patientName: 'Ana Souza', stars: 4, comment: 'Ótimo profissional, respondeu todas as dúvidas.', date: fmt(new Date(today.getTime() - 5 * 86400000)), consultaId: 'tri_002' },
        { doctorName: 'Dr. Marcelo Ferreira', doctorSpecialty: 'Cardiologia', team: 'Clínica SCI', patientName: 'João Pedro', stars: 5, comment: 'Parecer muito completo e bem fundamentado.', date: fmt(new Date(today.getTime() - 8 * 86400000)), consultaId: 'tri_003' },
        { doctorName: 'Dra. Ana Paula Rocha', doctorSpecialty: 'Clínica Geral', team: 'Clínica SCI', patientName: 'Maria Santos', stars: 4, comment: 'Muito competente e cuidadosa.', date: fmt(new Date(today.getTime() - 3 * 86400000)), consultaId: 'tri_004' },
        { doctorName: 'Dra. Ana Paula Rocha', doctorSpecialty: 'Clínica Geral', team: 'Clínica SCI', patientName: 'Roberto Alves', stars: 3, comment: 'Bom atendimento, mas poderia ser mais detalhado.', date: fmt(new Date(today.getTime() - 10 * 86400000)), consultaId: 'tri_005' },
        { doctorName: 'Dr. Ricardo Lemos', doctorSpecialty: 'Neurologia', team: 'Equipe Norte', patientName: 'Fernanda Costa', stars: 5, comment: 'Incrível! Resolveu meu problema rapidamente.', date: fmt(new Date(today.getTime() - 1 * 86400000)), consultaId: 'tri_006' },
        { doctorName: 'Dr. Ricardo Lemos', doctorSpecialty: 'Neurologia', team: 'Equipe Norte', patientName: 'Lucas Mendes', stars: 4, comment: 'Profissional excelente.', date: fmt(new Date(today.getTime() - 6 * 86400000)), consultaId: 'tri_007' },
    ];
    localStorage.setItem(RATINGS_KEY, JSON.stringify(mockRatings.map((r, i) => ({ ...r, id: `rat_seed_${i}` }))));
}


// ── Repasse de Parecer ────────────────────────────────────────────────────────

export interface RepasseHistoricoItem {
    medico: string;
    motivo: string;
    data: string;
}

export interface StoredRepasse {
    id: string;
    patientId: string;
    patientName: string;
    especialidade: string;
    hipotese: string;
    priority: 'Alta' | 'Média' | 'Baixa';
    queixaDetalhada: string;
    motivoRepasse: string;
    repassadoPor: string;
    repassadoEm: string;
    status: 'disponivel' | 'em_atendimento' | 'finalizado';
    historicoRepasses: RepasseHistoricoItem[];
}

const REPASSES_KEY = 'pc_repasses';

export function getRepasses(): StoredRepasse[] {
    try {
        const raw = localStorage.getItem(REPASSES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function getRepassesDisponiveis(): StoredRepasse[] {
    return getRepasses().filter(r => r.status === 'disponivel');
}

export function addRepasse(data: Omit<StoredRepasse, 'id' | 'status' | 'repassadoEm'>): StoredRepasse {
    const existing = getRepasses();
    const newRepasse: StoredRepasse = {
        ...data,
        id: `rep_${Date.now()}`,
        status: 'disponivel',
        repassadoEm: new Date().toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        }),
    };
    localStorage.setItem(REPASSES_KEY, JSON.stringify([newRepasse, ...existing]));
    return newRepasse;
}

export function assumirRepasse(id: string): void {
    const existing = getRepasses();
    const updated = existing.map(r =>
        r.id === id ? { ...r, status: 'em_atendimento' as const } : r
    );
    localStorage.setItem(REPASSES_KEY, JSON.stringify(updated));
}

export function updateRepasseStatus(id: string, status: StoredRepasse['status']): void {
    const existing = getRepasses();
    const updated = existing.map(r => r.id === id ? { ...r, status } : r);
    localStorage.setItem(REPASSES_KEY, JSON.stringify(updated));
}

// ── Imagens Clínicas ──────────────────────────────────────────────────────────

export interface ClinicalImage {
    id: string;
    patientId: string;
    /** Base64 data URL (e.g. "data:image/jpeg;base64,...") */
    url: string;
    caption: string;
    uploadedBy: 'triador' | 'paciente';
    uploadedAt: string; // dd/mm/yyyy hh:mm
}

export function getClinicalImages(patientId?: string): ClinicalImage[] {
    try {
        const raw = localStorage.getItem(CLINICAL_IMAGES_KEY);
        const all: ClinicalImage[] = raw ? JSON.parse(raw) : [];
        if (patientId) return all.filter(img => img.patientId === patientId);
        return all;
    } catch {
        return [];
    }
}

export function addClinicalImage(
    data: Omit<ClinicalImage, 'id' | 'uploadedAt'>
): ClinicalImage {
    const existing = getClinicalImages();
    const now = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
    const newImage: ClinicalImage = {
        ...data,
        id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        uploadedAt: now,
    };
    localStorage.setItem(CLINICAL_IMAGES_KEY, JSON.stringify([...existing, newImage]));
    return newImage;
}

export function removeClinicalImage(imageId: string): void {
    const existing = getClinicalImages();
    localStorage.setItem(CLINICAL_IMAGES_KEY, JSON.stringify(existing.filter(img => img.id !== imageId)));
}

// ── Relatórios Médicos (PDFs / documentos) ────────────────────────────────────

export interface ClinicalReport {
    id: string;
    patientId: string;
    /** Base64 data URL (e.g. "data:application/pdf;base64,...") */
    url: string;
    fileName: string;
    fileSize: string; // human-readable e.g. "1.2 MB"
    uploadedBy: 'triador' | 'paciente';
    uploadedAt: string; // dd/mm/yyyy hh:mm
}

const CLINICAL_REPORTS_KEY = 'pc_clinical_reports';

export function getClinicalReports(patientId?: string): ClinicalReport[] {
    try {
        const raw = localStorage.getItem(CLINICAL_REPORTS_KEY);
        const all: ClinicalReport[] = raw ? JSON.parse(raw) : [];
        if (patientId) return all.filter(r => r.patientId === patientId);
        return all;
    } catch {
        return [];
    }
}

export function addClinicalReport(
    data: Omit<ClinicalReport, 'id' | 'uploadedAt'>
): ClinicalReport {
    const existing = getClinicalReports();
    const now = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
    const newReport: ClinicalReport = {
        ...data,
        id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        uploadedAt: now,
    };
    localStorage.setItem(CLINICAL_REPORTS_KEY, JSON.stringify([...existing, newReport]));
    return newReport;
}

export function removeClinicalReport(reportId: string): void {
    const existing = getClinicalReports();
    localStorage.setItem(CLINICAL_REPORTS_KEY, JSON.stringify(existing.filter(r => r.id !== reportId)));
}

