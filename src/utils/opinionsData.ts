import type { OpinionRequest } from '../types';

let incomingOpinions: OpinionRequest[] = [
    {
        id: '1',
        patientName: 'Maria Lurdes da Silva',
        specialty: 'Cardiologia',
        doctorName: 'Dr. Roberto (Clínica Médica)',
        requestDate: '24/10/2023',
        deadline: '25/10/2023',
        priority: 'Urgente',
        status: 'Pendente',
        description: 'Avaliação de risco cirúrgico para colecistectomia. Paciente hipertensa.'
    },
    {
        id: '2',
        patientName: 'João Paulo Santos',
        specialty: 'Cardiologia',
        doctorName: 'Dra. Ana (Ortopedia)',
        requestDate: '23/10/2023',
        deadline: '26/10/2023',
        priority: 'Rotina',
        status: 'Pendente',
        description: 'ECG alterado no pré-op de artroscopia. Solicito avaliação.'
    }
];

let outgoingOpinions: OpinionRequest[] = [
    {
        id: '3',
        patientName: 'Fernanda Oliveira',
        specialty: 'Dermatologia',
        doctorName: 'Dr. Silva',
        requestDate: '20/10/2023',
        deadline: '23/10/2023',
        priority: 'Rotina',
        status: 'Respondido',
        description: 'Lesão suspeita em dorso.'
    },
    {
        id: '4',
        patientName: 'Carlos Eduardo',
        specialty: 'Neurologia',
        doctorName: 'Dr. Silva',
        requestDate: '24/10/2023',
        deadline: '24/10/2023',
        priority: 'Urgente',
        status: 'Pendente',
        description: 'Cefaleia súbita intensa. Exame físico normal.'
    }
];

export const getIncomingOpinions = (): OpinionRequest[] => {
    return incomingOpinions;
};

export const getOutgoingOpinions = (): OpinionRequest[] => {
    return outgoingOpinions;
};

export const updateOpinionStatus = (id: string, newStatus: 'Pendente' | 'Respondido' | 'Atrasado') => {
    const index = incomingOpinions.findIndex(op => op.id === id);
    if (index !== -1) {
        incomingOpinions[index] = { ...incomingOpinions[index], status: newStatus };
        return true;
    }
    return false;
};

export const addOutgoingOpinion = (opinion: OpinionRequest) => {
    outgoingOpinions.unshift(opinion);
};
