import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Calendar, Clock, AlertCircle, ChevronDown,
    Activity, Stethoscope, CheckCircle, Send
} from 'lucide-react';
import { addTriagem } from '../utils/patientStore';

// Mock — in a real app this would come from a shared store / URL state
const MOCK_PATIENTS = [
    { id: 1, name: 'Maria Clara da Silva', age: 45, cpf: '123.456.789-00', date: '17/03/2026', time: '08:30', symptoms: 'Dor no peito, falta de ar leve', priority: 'Alta' as const },
    { id: 2, name: 'João Pedro Santos', age: 32, cpf: '987.654.321-11', date: '17/03/2026', time: '09:15', symptoms: 'Febre alta (39°C), tosse seca há 3 dias', priority: 'Média' as const },
    { id: 3, name: 'Ana Júlia Oliveira', age: 68, cpf: '456.789.123-22', date: '17/03/2026', time: '10:00', symptoms: 'Controle de pressão arterial de rotina', priority: 'Baixa' as const },
];

const ESPECIALIDADES = [
    'Cardiologia', 'Clínica Geral', 'Endocrinologia', 'Neurologia',
    'Pneumologia', 'Ortopedia', 'Dermatologia', 'Ginecologia',
    'Urologia', 'Psiquiatria', 'Gastroenterologia', 'Reumatologia',
];

const Label: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
    <label className="block text-[11px] font-bold text-[#334155] mb-1.5">
        {children} {required && <span className="text-[#C0392B]">*</span>}
    </label>
);

const inputCls = (err?: boolean) =>
    `w-full px-3 py-2.5 text-[11px] font-medium text-[#0F172A] border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#1D3461] transition-all bg-white ${err ? 'border-[#C0392B]' : 'border-[#CBD5E1] hover:border-[#94A3B8]'}`;

const TriagemPage: React.FC = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();

    const patient = MOCK_PATIENTS.find(p => p.id === Number(patientId));

    const [priority, setPriority] = useState<'Alta' | 'Média' | 'Baixa'>(patient?.priority ?? 'Média');
    const [pa, setPa] = useState('');
    const [fc, setFc] = useState('');
    const [temperatura, setTemperatura] = useState('');
    const [spo2, setSpo2] = useState('');
    const [queixaDetalhada, setQueixaDetalhada] = useState(patient?.symptoms ?? '');
    const [hipotese, setHipotese] = useState('');
    const [modalidade, setModalidade] = useState<'online' | 'parecer'>('parecer');
    const [especialidade, setEspecialidade] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    if (!patient) {
        return (
            <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-[14px] font-bold text-[#0F172A]">Paciente não encontrado.</p>
                    <button onClick={() => navigate('/pacientes')} className="mt-4 text-[#1D3461] font-bold text-[12px]">Voltar</button>
                </div>
            </div>
        );
    }


    const validate = () => {
        const e: Record<string, boolean> = {};
        if (!queixaDetalhada.trim()) e.queixaDetalhada = true;
        if (!hipotese.trim()) e.hipotese = true;
        if (!especialidade) e.especialidade = true;
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        addTriagem({
            patientId: String(patient.id),
            patientName: patient.name,
            cpf: patient.cpf,
            age: patient.age,
            initialSymptoms: patient.symptoms,
            cadastroDate: patient.date,
            cadastroTime: patient.time,
            priority,
            pa, fc, temperatura, spo2,
            queixaDetalhada,
            hipotese,
            modalidade,
            especialidade,
            observacoes,
            triadoPor: 'Enfermeiro(a) Triador(a)',
        });

        setSubmitted(true);
        setTimeout(() => navigate('/pacientes'), 2500);
    };

    return (
        <div className="w-full bg-[#F1F5F9] min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Page Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/pacientes')}
                        className="flex items-center gap-2 text-[11px] font-bold text-[#64748B] hover:text-[#0F172A] transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para Fila de Pacientes
                    </button>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-[#1D3461] uppercase tracking-widest mb-1">Triagem</p>
                            <h1 className="text-[20px] font-black text-[#0F172A] leading-tight">{patient.name}</h1>
                            <p className="text-[12px] font-medium text-[#64748B] mt-1">{patient.cpf} · {patient.age} anos</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-[10px] px-4 py-2.5 shadow-sm">
                            <Calendar className="w-4 h-4 text-[#94A3B8]" />
                            <div className="text-right">
                                <p className="text-[11px] font-bold text-[#0F172A]">{patient.date}</p>
                                <p className="text-[10px] font-medium text-[#64748B] flex items-center gap-1 justify-end">
                                    <Clock className="w-3 h-3" /> {patient.time}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {submitted ? (
                    /* Success State */
                    <div className="bg-white rounded-[16px] shadow-sm border border-[#E2E8F0] p-16 flex flex-col items-center justify-center gap-5">
                        <div className="w-20 h-20 bg-[#ECFDF5] rounded-full flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-[#10B981]" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-[18px] font-black text-[#0F172A] mb-2">Triagem Encaminhada!</h2>
                            <p className="text-[13px] font-medium text-[#64748B]">
                                <strong>{patient.name}</strong> foi encaminhado(a) para o Parecerista com sucesso.
                            </p>
                            <p className="text-[12px] font-medium text-[#94A3B8] mt-2">Redirecionando para a fila...</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Queixa Inicial — destaque vermelho rubro */}
                        <div
                            className="bg-white rounded-[16px] shadow-sm border border-[#E2E8F0] px-6 py-4 flex items-start gap-3 overflow-hidden relative"
                            style={{ borderLeft: '3px solid #C0392B' }}
                        >
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#C0392B' }} />
                            <div className="flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: '#C0392B' }}>Queixa inicial do paciente</p>
                                <p className="text-[12px] font-medium text-[#334155] leading-relaxed">{patient.symptoms}</p>
                            </div>
                        </div>
                        <hr className="border-none h-px bg-[#E2E8F0]" />

                        {/* Card 2 — Avaliação Clínica */}
                        <div className="bg-white rounded-[16px] shadow-sm border border-[#E2E8F0] overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2.5" style={{ borderLeftWidth: 3, borderLeftStyle: 'solid', borderLeftColor: '#1D3461' }}>
                                <Activity className="w-4 h-4 text-[#1D3461]" />
                                <h2 className="text-[12px] font-bold text-[#0F172A] uppercase tracking-wide">Avaliação Clínica</h2>
                            </div>
                            <div className="px-6 py-6 space-y-5">

                                {/* Prioridade */}
                                <div>
                                    <Label required>Prioridade Sistêmica</Label>
                                    <div className="flex gap-3">
                                        {(['Alta', 'Média', 'Baixa'] as const).map(p => {
                                            const isActive = priority === p;
                                            const activeStyles: Record<string, { bg: string; text: string; border: string }> = {
                                                Alta:  { bg: '#FEE2E2', text: '#C0392B', border: '#FCA5A5' },
                                                Média: { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' },
                                                Baixa: { bg: '#ECFDF5', text: '#059669', border: '#6EE7B7' },
                                            };
                                            return (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setPriority(p)}
                                                    className="flex-1 py-2.5 rounded-[10px] text-[11px] font-bold transition-all"
                                                    style={{
                                                        backgroundColor: isActive ? activeStyles[p].bg : '#FFFFFF',
                                                        color: isActive ? activeStyles[p].text : '#94A3B8',
                                                        border: `1px solid ${isActive ? activeStyles[p].border : '#E2E8F0'}`,
                                                        boxShadow: isActive
                                                            ? 'inset 2px 2px 5px rgba(0,0,0,0.07), inset -2px -2px 5px rgba(255,255,255,0.65)'
                                                            : 'none',
                                                        fontWeight: isActive ? 700 : 500,
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                >
                                                    {p}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Sinais Vitais */}
                                <div>
                                    <Label>Sinais Vitais</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {[
                                            { label: 'PA (mmHg)', placeholder: '120/80', value: pa, set: setPa },
                                            { label: 'FC (bpm)', placeholder: '72', value: fc, set: setFc },
                                            { label: 'Temperatura (°C)', placeholder: '36.5', value: temperatura, set: setTemperatura },
                                            { label: 'SpO₂ (%)', placeholder: '98', value: spo2, set: setSpo2 },
                                        ].map(f => (
                                            <div key={f.label}>
                                                <p className="text-[10px] font-bold text-[#94A3B8] mb-1.5">{f.label}</p>
                                                <input
                                                    type="text"
                                                    placeholder={f.placeholder}
                                                    className={inputCls()}
                                                    value={f.value}
                                                    onChange={e => f.set(e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Queixa Detalhada */}
                                <div>
                                    <Label required>Queixa Principal Detalhada</Label>
                                    <textarea
                                        rows={3}
                                        placeholder="Descreva a queixa com detalhe clínico..."
                                        className={inputCls(errors.queixaDetalhada) + ' resize-none'}
                                        value={queixaDetalhada}
                                        onChange={e => { setQueixaDetalhada(e.target.value); if (errors.queixaDetalhada) setErrors(p => ({ ...p, queixaDetalhada: false })); }}
                                    />
                                    {errors.queixaDetalhada && <p className="text-[10px] text-[#C0392B] font-medium mt-1">Campo obrigatório</p>}
                                </div>

                                {/* Hipótese */}
                                <div>
                                    <Label required>Hipótese Diagnóstica</Label>
                                    <textarea
                                        rows={2}
                                        placeholder="ex: Síndrome coronariana aguda / IVAS / HAS descompensada..."
                                        className={inputCls(errors.hipotese) + ' resize-none'}
                                        value={hipotese}
                                        onChange={e => { setHipotese(e.target.value); if (errors.hipotese) setErrors(p => ({ ...p, hipotese: false })); }}
                                    />
                                    {errors.hipotese && <p className="text-[10px] text-[#C0392B] font-medium mt-1">Campo obrigatório</p>}
                                </div>

                                {/* Modalidade */}
                                <div>
                                    <Label required>Modalidade de Atendimento</Label>
                                    <div className="relative">
                                        <select
                                            className="w-full px-3 py-2.5 text-[11px] font-medium text-[#0F172A] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3461] appearance-none bg-white transition-all cursor-pointer"
                                            value={modalidade}
                                            onChange={e => setModalidade(e.target.value as 'online' | 'parecer')}
                                        >
                                            <option value="parecer">Parecer Assíncrono — Resposta via plataforma</option>
                                            <option value="online">Teleconsulta Online — Agendamento via WhatsApp</option>
                                        </select>
                                        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 3 — Encaminhamento */}
                        <div className="bg-white rounded-[16px] shadow-sm border border-[#E2E8F0] overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2.5" style={{ borderLeftWidth: 3, borderLeftStyle: 'solid', borderLeftColor: '#10B981' }}>
                                <Stethoscope className="w-4 h-4 text-[#10B981]" />
                                <h2 className="text-[12px] font-bold text-[#0F172A] uppercase tracking-wide">Encaminhamento</h2>
                            </div>
                            <div className="px-6 py-6 space-y-5">

                                {/* Especialidade */}
                                <div>
                                    <Label required>Especialidade Solicitada</Label>
                                    <div className="relative">
                                        <select
                                            className={inputCls(errors.especialidade) + ' appearance-none pr-10'}
                                            value={especialidade}
                                            onChange={e => { setEspecialidade(e.target.value); if (errors.especialidade) setErrors(p => ({ ...p, especialidade: false })); }}
                                        >
                                            <option value="">Selecionar especialidade...</option>
                                            {ESPECIALIDADES.map(esp => (
                                                <option key={esp} value={esp}>{esp}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
                                    </div>
                                    {errors.especialidade && <p className="text-[10px] text-[#C0392B] font-medium mt-1">Selecione uma especialidade</p>}
                                </div>

                                {/* Observações */}
                                <div>
                                    <Label>Observações Adicionais <span className="text-[#94A3B8] font-medium">(opcional)</span></Label>
                                    <textarea
                                        rows={3}
                                        placeholder="Informações complementares para o parecerista..."
                                        className={inputCls() + ' resize-none'}
                                        value={observacoes}
                                        onChange={e => setObservacoes(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Bar */}
                        <div className="flex items-center justify-between gap-4 pb-8">
                            <button
                                type="button"
                                onClick={() => navigate('/pacientes')}
                                className="px-6 py-3 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569] rounded-[10px] font-bold text-[12px] transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex items-center gap-2.5 px-8 py-3 bg-[#1D3461] hover:bg-[#162749] text-white rounded-[10px] font-bold text-[12px] shadow-[0_4px_12px_rgba(29,52,97,0.25)] transition-all hover:scale-[1.01]"
                            >
                                <Send className="w-4 h-4" />
                                Encaminhar para Parecer
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default TriagemPage;
