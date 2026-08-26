import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Clock, ChevronRight, CheckCircle2, Plus, X, ChevronDown } from 'lucide-react';

type Priority = 'Alta' | 'Média' | 'Baixa';
type PatientStatus = 'Aguardando' | 'Encaminhado';

interface Patient {
    id: number;
    name: string;
    age: number;
    cpf: string;
    date: string;
    time: string;
    status: PatientStatus;
    symptoms: string;
    priority: Priority;
}

const INITIAL_PATIENTS: Patient[] = [
    {
        id: 1,
        name: 'Maria Clara da Silva',
        age: 45,
        cpf: '123.456.789-00',
        date: '17/03/2026',
        time: '08:30',
        status: 'Aguardando',
        symptoms: 'Dor no peito, falta de ar leve',
        priority: 'Alta'
    },
    {
        id: 2,
        name: 'João Pedro Santos',
        age: 32,
        cpf: '987.654.321-11',
        date: '17/03/2026',
        time: '09:15',
        status: 'Aguardando',
        symptoms: 'Febre alta (39°C), tosse seca há 3 dias',
        priority: 'Média'
    },
    {
        id: 3,
        name: 'Ana Júlia Oliveira',
        age: 68,
        cpf: '456.789.123-22',
        date: '17/03/2026',
        time: '10:00',
        status: 'Aguardando',
        symptoms: 'Controle de pressão arterial de rotina',
        priority: 'Baixa'
    }
];

const ESPECIALIDADES = [
    'Cardiologia', 'Clínica Geral', 'Endocrinologia', 'Neurologia',
    'Pneumologia', 'Ortopedia', 'Dermatologia', 'Ginecologia',
    'Urologia', 'Psiquiatria', 'Gastroenterologia', 'Reumatologia',
];

// ── Modal: Solicitar Novo Parecer ─────────────────────────────────────────────
const NovoParecerModal: React.FC<{ onClose: () => void; onAdd: (p: Patient) => void }> = ({ onClose, onAdd }) => {
    const [nome, setNome] = useState('');
    const [cpf, setCpf] = useState('');
    const [idade, setIdade] = useState('');
    const [especialidade, setEspecialidade] = useState('');
    const [queixa, setQueixa] = useState('');
    const [priority, setPriority] = useState<Priority>('Média');
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    const validate = () => {
        const e: Record<string, boolean> = {};
        if (!nome.trim()) e.nome = true;
        if (!cpf.trim()) e.cpf = true;
        if (!especialidade) e.especialidade = true;
        if (!queixa.trim()) e.queixa = true;
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const date = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
        const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
        onAdd({
            id: Date.now(),
            name: nome,
            age: Number(idade) || 0,
            cpf,
            date,
            time,
            status: 'Aguardando',
            symptoms: queixa,
            priority,
        });
        onClose();
    };

    const inputCls = (err?: boolean) =>
        `w-full px-3 py-2.5 text-[11px] font-medium text-[#0F172A] border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#1D3461] transition-all bg-white ${err ? 'border-[#C0392B]' : 'border-[#CBD5E1] hover:border-[#94A3B8]'}`;

    return (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[14px] shadow-[0_16px_40px_rgba(0,0,0,0.12)] w-full max-w-[520px] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#1D3461] flex items-center justify-center">
                            <Plus className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-[12px] font-black text-[#0F172A]">Solicitar Novo Parecer</h3>
                            <p className="text-[10px] font-medium text-[#64748B]">Preencha os dados do paciente para encaminhar</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-full transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                    {/* Nome + Idade */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                            <label className="block text-[11px] font-bold text-[#334155] mb-1.5">Nome Completo <span className="text-[#C0392B]">*</span></label>
                            <input
                                type="text"
                                placeholder="Nome do paciente"
                                className={inputCls(errors.nome)}
                                value={nome}
                                onChange={e => { setNome(e.target.value); if (errors.nome) setErrors(p => ({ ...p, nome: false })); }}
                            />
                            {errors.nome && <p className="text-[10px] text-[#C0392B] mt-1">Campo obrigatório</p>}
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-[#334155] mb-1.5">Idade</label>
                            <input
                                type="number"
                                placeholder="Ex: 45"
                                className={inputCls()}
                                value={idade}
                                onChange={e => setIdade(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* CPF */}
                    <div>
                        <label className="block text-[11px] font-bold text-[#334155] mb-1.5">CPF <span className="text-[#C0392B]">*</span></label>
                        <input
                            type="text"
                            placeholder="000.000.000-00"
                            className={inputCls(errors.cpf)}
                            value={cpf}
                            onChange={e => { setCpf(e.target.value); if (errors.cpf) setErrors(p => ({ ...p, cpf: false })); }}
                        />
                        {errors.cpf && <p className="text-[10px] text-[#C0392B] mt-1">Campo obrigatório</p>}
                    </div>

                    {/* Especialidade */}
                    <div>
                        <label className="block text-[11px] font-bold text-[#334155] mb-1.5">Especialidade Solicitada <span className="text-[#C0392B]">*</span></label>
                        <div className="relative">
                            <select
                                className={inputCls(errors.especialidade) + ' appearance-none pr-9'}
                                value={especialidade}
                                onChange={e => { setEspecialidade(e.target.value); if (errors.especialidade) setErrors(p => ({ ...p, especialidade: false })); }}
                            >
                                <option value="">Selecionar especialidade...</option>
                                {ESPECIALIDADES.map(esp => <option key={esp} value={esp}>{esp}</option>)}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
                        </div>
                        {errors.especialidade && <p className="text-[10px] text-[#C0392B] mt-1">Selecione uma especialidade</p>}
                    </div>

                    {/* Queixa */}
                    <div>
                        <label className="block text-[11px] font-bold text-[#334155] mb-1.5">Queixa Principal <span className="text-[#C0392B]">*</span></label>
                        <textarea
                            rows={3}
                            placeholder="Descreva brevemente a queixa do paciente..."
                            className={inputCls(errors.queixa) + ' resize-none'}
                            value={queixa}
                            onChange={e => { setQueixa(e.target.value); if (errors.queixa) setErrors(p => ({ ...p, queixa: false })); }}
                        />
                        {errors.queixa && <p className="text-[10px] text-[#C0392B] mt-1">Campo obrigatório</p>}
                    </div>

                    {/* Prioridade */}
                    <div>
                        <label className="block text-[11px] font-bold text-[#334155] mb-1.5">Prioridade</label>
                        <div className="flex gap-3">
                            {(['Alta', 'Média', 'Baixa'] as Priority[]).map(p => {
                                const active = priority === p;
                                const styles: Record<Priority, { bg: string; text: string; border: string }> = {
                                    Alta:  { bg: '#FEE2E2', text: '#C0392B', border: '#FCA5A5' },
                                    Média: { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' },
                                    Baixa: { bg: '#ECFDF5', text: '#059669', border: '#6EE7B7' },
                                };
                                return (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPriority(p)}
                                        className="flex-1 py-2 rounded-[10px] text-[11px] font-bold transition-all"
                                        style={{
                                            backgroundColor: active ? styles[p].bg : '#FFFFFF',
                                            color: active ? styles[p].text : '#94A3B8',
                                            border: `1px solid ${active ? styles[p].border : '#E2E8F0'}`,
                                            fontWeight: active ? 700 : 500,
                                        }}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E2E8F0]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-[10px] text-[11px] font-bold border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-[11px] font-bold text-white bg-[#1D3461] hover:bg-[#162749] shadow-md transition-all hover:scale-[1.01]"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Solicitar Parecer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Main List ─────────────────────────────────────────────────────────────────
const PacientesList: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
    const [showModal, setShowModal] = useState(false);

    const filteredPatients = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.cpf.includes(searchTerm)
    );

    const handleAddPatient = (p: Patient) => {
        setPatients(prev => [p, ...prev]);
    };

    return (
        <div className="w-full bg-[#F1F5F9] min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 relative animate-in fade-in duration-300">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-[12px] font-bold text-slate-800 tracking-tight">Fila de Pacientes (Triagem)</h1>
                        <p className="text-slate-500 mt-1 text-[11px] font-medium">Gerencie e analise as entradas de novos pacientes no sistema</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-[12px] font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.99]"
                        style={{ background: 'linear-gradient(135deg, #1D3461 0%, #2C5282 100%)' }}
                    >
                        <Plus className="w-4 h-4" />
                        Solicitar Novo Parecer
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50">
                        <div className="relative w-full sm:w-96 text-slate-500">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Buscar por nome ou CPF..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1D3461] focus:border-transparent transition-all shadow-sm text-[11px]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-[#1D3461] transition-all shadow-sm w-full sm:w-auto justify-center">
                            <Filter className="w-4 h-4" />
                            Filtros
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500 capitalize">Paciente / CPF</th>
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500 capitalize">Triagem Sintomas</th>
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500 capitalize text-center">Data / Hora Cadastro</th>
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500 capitalize text-center">Status</th>
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500 capitalize text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredPatients.map((patient) => {
                                    const isEncaminhado = patient.status === 'Encaminhado';
                                    const priorityColor: Record<Priority, string> = {
                                        Alta: 'bg-[#FEE2E2] text-[#C0392B] border-[#FCA5A5]',
                                        Média: 'bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]',
                                        Baixa: 'bg-[#ECFDF5] text-[#059669] border-[#6EE7B7]',
                                    };
                                    return (
                                        <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="font-bold text-slate-800 text-[11px] group-hover:text-[#1D3461] transition-colors">{patient.name}</div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[11px] text-slate-500 font-medium">{patient.cpf} • {patient.age} anos</span>
                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${priorityColor[patient.priority]}`}>
                                                        {patient.priority}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 max-w-[250px]">
                                                <div className="text-[11px] font-medium text-slate-600 truncate" title={patient.symptoms}>
                                                    {patient.symptoms}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="inline-flex flex-col items-center justify-center">
                                                    <span className="text-[11px] font-bold text-slate-700">{patient.date}</span>
                                                    <span className="text-[11px] font-medium text-slate-500 flex items-center mt-0.5">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {patient.time}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                {isEncaminhado ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                                                        <CheckCircle2 className="w-3 h-3" /> Encaminhado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#FFFBEB] text-[#D97706] border border-[#FCD34D]">
                                                        Aguardando
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    onClick={() => !isEncaminhado && navigate(`/triagem/${patient.id}`)}
                                                    disabled={isEncaminhado}
                                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all shadow-sm ${isEncaminhado ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-[#EEF4FA] text-[#1D3461] hover:bg-[#1D3461] hover:text-white'}`}
                                                    title={isEncaminhado ? 'Já encaminhado' : 'Iniciar triagem'}
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredPatients.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-500 font-medium text-[11px]">
                                            Nenhum paciente aguardando triagem no momento.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showModal && (
                <NovoParecerModal
                    onClose={() => setShowModal(false)}
                    onAdd={handleAddPatient}
                />
            )}
        </div>
    );
};

export default PacientesList;
