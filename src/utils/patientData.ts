import type { QueueItem, PatientDetailedInfo, ConsultationHistoryItem } from '../types';

// Mock database in memory to persist changes during the session
const patientHistoryMock: Record<string, ConsultationHistoryItem[]> = {
  '1': [
    {
      id: 'h1',
      date: '24/10/2023',
      chiefComplaint: 'Solicitação de Parecer - Cardiologia',
      conducts: {
        orientations: ['Parecer solicitado pelo Dr. João Silva (Urgência). Aguardando avaliação do especialista.']
      }
    },
    {
      id: 'h2',
      date: '24/10/2023',
      chiefComplaint: 'Anexação de Exames',
      conducts: {
        exams: ['Eletrocardiograma (ECG)', 'Ecocardiograma Transtorácico'],
        documents: ['Laudo do Ecocardiograma']
      }
    }
  ]
};

const mockClinicalReport = `Paciente do sexo masculino, 62 anos, hipertenso e dislipidêmico de longa data, sem acompanhamento regular.
Dá entrada no pronto-socorro referindo dor torácica atípica, descrita como "peso no peito" irradiando para membro superior esquerdo, iniciada há cerca de 2 horas durante esforço leve. Refere dispneia leve associada. Nega síncope ou palpitações.
Ao exame físico: ECG demonstra supradesnivelamento do segmento ST em parede inferior, porém com algumas alterações inespecíficas.
Sinais vitais de admissão: PA 160/90 mmHg, FC 88 bpm, SatO2 96% em ar ambiente.
Dada a complexidade do ECG e quadro clínico limite, solicitamos avaliação urgente da cardiologia para conduta imediata (Trombolítico vs Cateterismo) e programação terapêutica.`;

export const getMockPatientDetails = (id: string, initialData?: QueueItem): PatientDetailedInfo => {
  const baseData = initialData || {
    id,
    patientName: 'Roberto Almeida',
    age: 62,
    arrivalTime: '08:30',
    bloodPressure: '160/90',
    riskRating: 'red',
    type: 'Parecer',
    status: 'waiting',
    waitTime: '10 min'
  };

  // Ensure history exists for this ID
  if (!patientHistoryMock[id]) {
    patientHistoryMock[id] = patientHistoryMock['1']; // Use the mock history as fallback
  }

  return {
    ...baseData,
    contact: '(11) 99876-0000',
    email: 'roberto.almeida@email.com',
    gender: 'Masculino',
    heartRate: '88 bpm',
    temperature: '36.5°C',
    oxygenSaturation: '96%',
    currentChiefComplaint: 'Dor torácica atípica e alterações inespecíficas no ECG.',
    clinicalReport: mockClinicalReport,
    attachedImages: [
      'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?q=80&w=400&auto=format&fit=crop', // ECG Mock Image
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=400&auto=format&fit=crop'  // X-Ray Mock Image
    ],
    medications: {
      continuous: ['Losartana 50mg (1x ao dia)', 'Atenolol 25mg (1x ao dia)', 'Sinvastatina 20mg (à noite)'],
      current: ['AAS 100mg (dose de ataque no PS)', 'Clopidogrel 300mg (dose de ataque no PS)']
    },
    pastIllnesses: ['Hipertensão Arterial Sistêmica (diagnosticada há 15 anos)', 'Dislipidemia misto', 'Apêndicectomia aos 20 anos'],
    familyHistory: ['Pai falecido aos 65 anos por Infarto Agudo do Miocárdio', 'Mãe diabética tipo 2'],
    examResults: [
      { name: 'ECG de Repouso', date: '24/10/2023 08:45', fileUrl: '#' },
      { name: 'Marcadores de Necrose Miocárdica (1ª amostra)', date: '24/10/2023 09:10', fileUrl: '#' },
      { name: 'Raio-X de Tórax PA/Perfil', date: '24/10/2023 09:30', fileUrl: '#' }
    ],
    history: patientHistoryMock[id]
  };
};

export const addPatientHistoryItem = (patientId: string, item: ConsultationHistoryItem) => {
  if (!patientHistoryMock[patientId]) {
    patientHistoryMock[patientId] = [];
  }
  // Add to the beginning of the array
  patientHistoryMock[patientId].unshift(item);
};