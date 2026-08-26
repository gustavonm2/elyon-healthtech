import React, { useState, useEffect, useCallback } from 'react';
import {
    Activity, Clock, Stethoscope, AlertTriangle, Timer, ShieldAlert,
    CheckCircle2, Heart, Thermometer, Droplets, User, FileText, Check, AlertCircle, RefreshCw, Scale
} from 'lucide-react';
import {
    getWaitingTriageQueue, submitNurseTriage, RISK_COLORS, type WaitingPatient
} from '../utils/upaQueueStore';

const PRE_EXISTING_CONDITIONS = [
    'Doença Cardíaca',
    'Doença Respiratória',
    'Hipertensão',
    'Diabetes',
    'Transtorno Mental'
];

const DESTINATIONS = [
    'Consultório 01',
    'Consultório 02',
    'Consultório 03',
    'Consultório 04 (Pediatria)',
    'Consultório 05',
    'Consultório 06',
    'Consultório 07',
    'Sala Vermelha'
];

const TriagemUpaPage: React.FC = () => {
    const [waitingQueue, setWaitingQueue] = useState<WaitingPatient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<WaitingPatient | null>(null);

    // Form states
    const [complaint, setComplaint] = useState('');
    const [symptomOnsetTime, setSymptomOnsetTime] = useState('');
    const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
    const [otherConditionChecked, setOtherConditionChecked] = useState(false);
    const [otherConditionText, setOtherConditionText] = useState('');
    const [allergies, setAllergies] = useState('');
    const [bloodPressure, setBloodPressure] = useState('');
    const [heartRate, setHeartRate] = useState('');
    const [temperature, setTemperature] = useState('');
    const [oxygenSaturation, setOxygenSaturation] = useState('');
    const [glicemia, setGlicemia] = useState('');
    const [weight, setWeight] = useState('');
    const [riskClassification, setRiskClassification] = useState<'Vermelho' | 'Laranja' | 'Amarelo' | 'Verde' | 'Azul' | ''>('');
    const [destination, setDestination] = useState('');

    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const refresh = useCallback(() => {
        const queue = getWaitingTriageQueue();
        setWaitingQueue(queue);
    }, []);

    useEffect(() => {
        refresh();
        // Event listener for queue updates
        window.addEventListener('upa-waiting-list-updated', refresh);
        return () => window.removeEventListener('upa-waiting-list-updated', refresh);
    }, [refresh]);

    const handleSelectPatient = (patient: WaitingPatient) => {
        setSelectedPatient(patient);
        // Pre-fill form complaint with initial complaint from reception
        setComplaint(patient.initialComplaint);
        // Clear previous form fields
        setSymptomOnsetTime('');
        setSelectedConditions([]);
        setOtherConditionChecked(false);
        setOtherConditionText('');
        setAllergies('');
        setBloodPressure('');
        setHeartRate('');
        setTemperature('');
        setOxygenSaturation('');
        setGlicemia('');
        setWeight('');
        setRiskClassification('');
        setDestination('');
        setFormError('');
        setSuccessMessage('');
    };

    const handleConditionChange = (condition: string) => {
        setSelectedConditions(prev =>
            prev.includes(condition)
                ? prev.filter(c => c !== condition)
                : [...prev, condition]
        );
    };

    const handleSubmitTriage = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!selectedPatient) return;
        if (!complaint.trim()) { setFormError('Por favor, descreva a queixa principal.'); return; }
        if (!symptomOnsetTime.trim()) { setFormError('Por favor, informe o tempo de início dos sintomas.'); return; }
        if (!bloodPressure.trim() || !heartRate.trim() || !temperature.trim() || !oxygenSaturation.trim() || !glicemia.trim() || !weight.trim()) {
            setFormError('Todos os sinais vitais são obrigatórios.');
            return;
        }
        if (!riskClassification) { setFormError('Selecione uma classificação de risco Manchester.'); return; }
        if (!destination) { setFormError('Selecione o consultório ou sala de destino.'); return; }

        // Consolidate pre-existing conditions
        const finalConditions = [...selectedConditions];
        if (otherConditionChecked && otherConditionText.trim()) {
            finalConditions.push(otherConditionText.trim());
        }

        submitNurseTriage(selectedPatient.id, {
            complaint,
            symptomOnsetTime,
            preExistingConditions: finalConditions,
            otherConditions: otherConditionChecked ? otherConditionText : undefined,
            allergies: allergies.trim() || 'Nenhuma',
            bloodPressure,
            heartRate,
            temperature,
            oxygenSaturation,
            glicemia,
            weight,
            riskClassification,
            destination
        });

        setSuccessMessage(`Triagem de ${selectedPatient.name} finalizada com sucesso! Encaminhado para ${destination}.`);
        setSelectedPatient(null);
        refresh();

        // Clear success message after 4s
        setTimeout(() => setSuccessMessage(''), 4000);
    };

    return (
        <div className="w-full bg-[#F1F5F9] min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">

                {/* ── Dev Mode Banner ── */}
                <div
                    className="mb-6 rounded-xl px-4 py-3 flex items-center gap-3 border"
                    style={{
                        background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                        borderColor: '#F59E0B',
                    }}
                >
                    <ShieldAlert className="w-5 h-5 text-[#92400E] flex-shrink-0" />
                    <div>
                        <p className="text-[12px] font-bold text-[#92400E]">
                            🚧 Modo Desenvolvimento — Triagem UPA (Enfermagem)
                        </p>
                        <p className="text-[11px] text-[#A16207] font-medium mt-0.5">
                            Login: <strong>triagemupa</strong> / Senha: <strong>1</strong>
                        </p>
                    </div>
                </div>

                {/* ── Header ── */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-[22px] font-extrabold text-[#0F172A] flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-600 shadow-lg shadow-emerald-600/20"
                            >
                                <Stethoscope className="w-5 h-5 text-white" />
                            </div>
                            Triagem UPA — Enfermagem
                        </h1>
                        <p className="text-[#64748B] text-[13px] font-medium mt-1.5 ml-[52px]">
                            Realize a avaliação clínica e classificação de risco (Protocolo Manchester).
                        </p>
                    </div>
                </div>

                {/* Success Message Banner */}
                {successMessage && (
                    <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-800">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <span className="text-[13px] font-semibold">{successMessage}</span>
                    </div>
                )}

                {/* Main Section split: left queue, right evaluation form */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* ─── LEFT: Waiting Queue (5 cols) ─── */}
                    <div className="lg:col-span-5 flex flex-col gap-4">
                        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
                            {/* Queue Title */}
                            <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between">
                                <div>
                                    <h2 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-[#1D3461]" />
                                        Pacientes Aguardando Triagem
                                    </h2>
                                    <p className="text-[11px] text-[#64748B] font-medium mt-0.5">
                                        Selecione um paciente para iniciar a triagem
                                    </p>
                                </div>
                                <span className="bg-[#EEF4FA] text-[#1D3461] text-[11px] font-extrabold px-2.5 py-1 rounded-full">
                                    {waitingQueue.length} pacientes
                                </span>
                            </div>

                            {/* Queue List */}
                            <div className="divide-y divide-[#F1F5F9] max-h-[60vh] overflow-y-auto">
                                {waitingQueue.length === 0 ? (
                                    <div className="px-6 py-12 text-center">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                                        <p className="text-[13px] font-semibold text-slate-800">Tudo limpo!</p>
                                        <p className="text-[11px] text-slate-500 mt-1">Nenhum paciente aguardando triagem.</p>
                                    </div>
                                ) : (
                                    waitingQueue.map((patient) => {
                                        const isSelected = selectedPatient?.id === patient.id;
                                        return (
                                            <div
                                                key={patient.id}
                                                onClick={() => handleSelectPatient(patient)}
                                                className={`px-6 py-4 flex items-start gap-4 cursor-pointer transition-all ${
                                                    isSelected ? 'bg-emerald-50/50 border-l-4 border-emerald-600' : 'hover:bg-[#F8FAFC]'
                                                }`}
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                    <User className="w-5 h-5 text-slate-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[13px] font-bold text-[#0F172A] truncate">{patient.name}</p>
                                                        <span className="text-[10px] font-bold text-slate-400 tabular-nums">{patient.arrivalTime}</span>
                                                    </div>
                                                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                                                        {patient.age} anos · CPF: {patient.cpf}
                                                    </p>
                                                    <p className="text-[11px] text-[#64748B] truncate mt-1 italic">
                                                        "{patient.initialComplaint}"
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ─── RIGHT: Evaluation Form (7 cols) ─── */}
                    <div className="lg:col-span-7">
                        {selectedPatient ? (
                            <form 
                                onSubmit={handleSubmitTriage} 
                                className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col"
                            >
                                {/* Form Title */}
                                <div className="px-6 py-5 border-b border-[#E2E8F0] bg-slate-50 flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                            Triagem em Andamento
                                        </span>
                                        <h2 className="text-[16px] font-extrabold text-[#0F172A] mt-2">
                                            {selectedPatient.name}
                                        </h2>
                                        <p className="text-[11px] text-[#64748B] font-medium mt-0.5">
                                            CPF: {selectedPatient.cpf} · Idade: {selectedPatient.age} anos · Chegada: {selectedPatient.arrivalTime}
                                        </p>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="p-6 space-y-6">

                                    {formError && (
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2.5 text-red-700">
                                            <AlertCircle className="w-4.5 h-4.5 text-red-600 flex-shrink-0" />
                                            <span className="text-[11px] font-bold">{formError}</span>
                                        </div>
                                    )}

                                    {/* 1. Queixa Principal & Tempo de Sintomas */}
                                    <div className="space-y-4">
                                        <h3 className="text-[12px] font-bold text-[#1D3461] uppercase tracking-wider border-b pb-1.5 border-slate-100 flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            1. Queixa Principal e Anamnese
                                        </h3>
                                        <div>
                                            <label className="block text-[11px] font-bold text-[#475569] mb-1.5">
                                                Queixa Principal (Detalhamento Clínico) <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                required
                                                rows={3}
                                                placeholder="Descreva detalhadamente a queixa clínica coletada..."
                                                value={complaint}
                                                onChange={e => setComplaint(e.target.value)}
                                                className="w-full px-3 py-2.5 text-[11px] font-medium text-[#0F172A] border border-[#CBD5E1] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#1D3461] resize-none bg-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-[#475569] mb-1.5">
                                                Tempo de Início dos Sintomas <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Ex: Há 2 horas, Há 3 dias, Desde hoje de manhã"
                                                value={symptomOnsetTime}
                                                onChange={e => setSymptomOnsetTime(e.target.value)}
                                                className="w-full px-3 py-2.5 text-[11px] font-medium text-[#0F172A] border border-[#CBD5E1] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#1D3461] bg-white"
                                            />
                                        </div>
                                    </div>

                                    {/* 2. Histórico Médico Pregresso */}
                                    <div className="space-y-4">
                                        <h3 className="text-[12px] font-bold text-[#1D3461] uppercase tracking-wider border-b pb-1.5 border-slate-100 flex items-center gap-2">
                                            <Activity className="w-4 h-4" />
                                            2. Histórico Médico / Doenças Pregressas
                                        </h3>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {PRE_EXISTING_CONDITIONS.map((condition) => {
                                                const isChecked = selectedConditions.includes(condition);
                                                return (
                                                    <label 
                                                        key={condition}
                                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                                                            isChecked ? 'bg-slate-50 border-slate-300 font-bold' : 'bg-white border-[#E2E8F0]'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => handleConditionChange(condition)}
                                                            className="w-4.5 h-4.5 rounded border-slate-300 text-[#1D3461] focus:ring-[#1D3461]"
                                                        />
                                                        <span className="text-[11px] text-[#334155]">{condition}</span>
                                                    </label>
                                                );
                                            })}

                                            {/* Others checkbox */}
                                            <label 
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                                                    otherConditionChecked ? 'bg-slate-50 border-slate-300 font-bold' : 'bg-white border-[#E2E8F0]'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={otherConditionChecked}
                                                    onChange={() => setOtherConditionChecked(!otherConditionChecked)}
                                                    className="w-4.5 h-4.5 rounded border-slate-300 text-[#1D3461] focus:ring-[#1D3461]"
                                                />
                                                <span className="text-[11px] text-[#334155]">Outros</span>
                                            </label>
                                        </div>

                                        {otherConditionChecked && (
                                            <div className="pt-1">
                                                <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">Especifique a outra condição</label>
                                                <input
                                                    type="text"
                                                    placeholder="Digite outras doenças pré-existentes..."
                                                    value={otherConditionText}
                                                    onChange={e => setOtherConditionText(e.target.value)}
                                                    className="w-full px-3 py-2.5 text-[11px] font-medium text-[#0F172A] border border-[#CBD5E1] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#1D3461] bg-white"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* 3. Alergias e Sinais Vitais */}
                                    <div className="space-y-4">
                                        <h3 className="text-[12px] font-bold text-[#1D3461] uppercase tracking-wider border-b pb-1.5 border-slate-100 flex items-center gap-2">
                                            <Heart className="w-4 h-4" />
                                            3. Alergias & Sinais Vitais
                                        </h3>

                                        <div>
                                            <label className="block text-[11px] font-bold text-[#475569] mb-1.5">Alergias</label>
                                            <input
                                                type="text"
                                                placeholder="Descreva alergias medicamentosas ou alimentares (ex: Dipirona, Corantes)"
                                                value={allergies}
                                                onChange={e => setAllergies(e.target.value)}
                                                className="w-full px-3 py-2.5 text-[11px] font-medium text-[#0F172A] border border-[#CBD5E1] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#1D3461] bg-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-[#475569] mb-2">Sinais Vitais</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {[
                                                    { label: 'PA (mmHg)', placeholder: '120/80', value: bloodPressure, set: setBloodPressure, icon: Heart, color: 'text-red-500' },
                                                    { label: 'FC (bpm)', placeholder: '80', value: heartRate, set: setHeartRate, icon: Activity, color: 'text-orange-500' },
                                                    { label: 'Temp (°C)', placeholder: '36.8', value: temperature, set: setTemperature, icon: Thermometer, color: 'text-yellow-500' },
                                                    { label: 'SpO₂ (%)', placeholder: '98', value: oxygenSaturation, set: setOxygenSaturation, icon: Droplets, color: 'text-blue-500' },
                                                    { label: 'Glicemia (mg/dL)', placeholder: '99', value: glicemia, set: setGlicemia, icon: Activity, color: 'text-rose-500' },
                                                    { label: 'Peso (kg)', placeholder: '70', value: weight, set: setWeight, icon: Scale, color: 'text-indigo-500' },
                                                ].map(sv => (
                                                    <div key={sv.label} className="rounded-xl border border-[#E2E8F0] p-3 bg-[#F8FAFC]">
                                                        <div className="flex items-center gap-1.5 mb-1.5">
                                                            <sv.icon className={`w-3.5 h-3.5 ${sv.color}`} />
                                                            <span className="text-[10px] font-bold text-[#64748B] uppercase">{sv.label}</span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder={sv.placeholder}
                                                            value={sv.value}
                                                            onChange={e => sv.set(e.target.value)}
                                                            className="w-full px-2.5 py-1.5 text-[12px] font-bold text-[#0F172A] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D3461] bg-white"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4. Classificação de Risco */}
                                    <div className="space-y-4">
                                        <h3 className="text-[12px] font-bold text-[#1D3461] uppercase tracking-wider border-b pb-1.5 border-slate-100 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" />
                                            4. Classificação Manchester & Destino
                                        </h3>

                                        <div>
                                            <label className="block text-[11px] font-bold text-[#475569] mb-2">
                                                Classificação de Risco (Manchester) <span className="text-red-500">*</span>
                                            </label>
                                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                                {Object.entries(RISK_COLORS).map(([key, val]) => {
                                                    const isSelected = riskClassification === key;
                                                    return (
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            onClick={() => setRiskClassification(key as any)}
                                                            className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                                                                isSelected 
                                                                    ? 'shadow-md scale-[1.03] font-bold border-slate-400' 
                                                                    : 'border-[#E2E8F0] hover:bg-slate-50'
                                                            }`}
                                                            style={{
                                                                backgroundColor: isSelected ? val.bg : '#FFFFFF',
                                                                color: val.text,
                                                                borderColor: isSelected ? val.solid : undefined
                                                            }}
                                                        >
                                                            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: val.solid }} />
                                                            <span className="text-[10px] font-bold">{key}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-[#475569] mb-1.5">
                                                Destino do Atendimento <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                required
                                                value={destination}
                                                onChange={e => setDestination(e.target.value)}
                                                className="w-full px-3 py-2.5 text-[11px] font-medium text-[#0F172A] border border-[#CBD5E1] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#1D3461] bg-white appearance-none"
                                            >
                                                <option value="">Selecione o consultório ou sala...</option>
                                                {DESTINATIONS.map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedPatient(null)}
                                            className="px-5 py-2.5 rounded-[10px] text-[11px] font-bold border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] transition-colors"
                                        >
                                            Cancelar Triagem
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex items-center gap-2 px-8 py-3 rounded-xl text-[12px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/10 transition-all hover:scale-[1.01]"
                                        >
                                            <Check className="w-4 h-4" />
                                            Finalizar Triagem
                                        </button>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-12 text-center flex flex-col items-center justify-center h-[50vh]">
                                <Stethoscope className="w-16 h-16 text-slate-300 mb-4" />
                                <h3 className="text-[15px] font-bold text-[#0F172A]">Nenhum Paciente Selecionado</h3>
                                <p className="text-[12px] text-[#64748B] max-w-sm mt-1.5 leading-relaxed">
                                    Selecione um paciente na fila à esquerda para realizar a avaliação de sinais vitais, doenças pregressas e classificação Manchester.
                                </p>
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
};

export default TriagemUpaPage;
