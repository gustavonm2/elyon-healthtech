import React, { useState } from 'react';
import {
    X, Send, ClipboardList, FileText, Video, AlertTriangle,
    Pill, Stethoscope, CheckCircle
} from 'lucide-react';
import { setModalidadePaciente } from '../utils/patientStore';

interface NovaConsultaModalProps {
    onClose: () => void;
}

const NovaConsultaModal: React.FC<NovaConsultaModalProps> = ({ onClose }) => {
    const [submitted, setSubmitted] = useState(false);
    const [modality, setModality] = useState<'online' | 'parecer' | null>(null);
    const [formData, setFormData] = useState({
        mainComplaint: '',
        diseaseHistory: '',
        symptomDuration: '',
        currentMedications: '',
        allergies: '',
        preexistingConditions: '',
        additionalInfo: '',
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!modality) return;
        setModalidadePaciente(modality);
        // (In a real app, persist full form data to server/store here)
        setSubmitted(true);
    };

    // ── Success screen ──────────────────────────────────────────────────────
    if (submitted) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-[#D1FAE5] rounded-full flex items-center justify-center mx-auto mb-5">
                        <CheckCircle className="w-10 h-10 text-[#10B981]" />
                    </div>
                    <h2 className="text-[22px] font-black text-[#0F172A] mb-3">Consulta Solicitada!</h2>
                    <p className="text-[14px] font-medium text-[#64748B] mb-8 leading-relaxed">
                        Sua solicitação foi recebida com sucesso. A equipe de triagem analisará seu caso e você receberá as próximas instruções diretamente no seu WhatsApp.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 bg-[#1D3461] hover:bg-[#162749] text-white rounded-xl text-[15px] font-bold transition-all"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        );
    }

    // ── Form screen ─────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-in slide-in-from-bottom-4 duration-300">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0]" style={{ borderLeftWidth: 4, borderLeftStyle: 'solid', borderLeftColor: '#1D3461' }}>
                    <div>
                        <h2 className="text-[18px] font-black text-[#0F172A] tracking-tight">Nova Consulta</h2>
                        <p className="text-[12px] text-[#64748B] font-medium mt-0.5">Relate sua condição de saúde e escolha como quer ser atendido</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#475569] transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Queixa principal */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#475569] flex items-center gap-1.5">
                            <ClipboardList className="w-3.5 h-3.5 text-[#1D3461]" />
                            Queixa Principal *
                        </label>
                        <textarea
                            required
                            name="mainComplaint"
                            value={formData.mainComplaint}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[14px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1D3461] transition-all min-h-[80px] resize-none"
                            placeholder="Ex: Dor de cabeça intensa há 3 dias, acompanhada de febre e náuseas..."
                        />
                    </div>

                    {/* História da doença */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#475569] flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-[#1D3461]" />
                            História da Doença Atual *
                        </label>
                        <textarea
                            required
                            name="diseaseHistory"
                            value={formData.diseaseHistory}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[14px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1D3461] transition-all min-h-[100px] resize-none"
                            placeholder="Descreva como começou, como evoluiu, o que piora ou melhora os sintomas..."
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Duração */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-[#475569] flex items-center gap-1.5">
                                <ClipboardList className="w-3.5 h-3.5 text-[#64748B]" />
                                Duração dos Sintomas
                            </label>
                            <input
                                name="symptomDuration"
                                value={formData.symptomDuration}
                                onChange={handleChange}
                                type="text"
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[14px] focus:ring-2 focus:ring-[#1D3461] transition-all"
                                placeholder="Ex: 3 dias, 2 semanas, 1 mês..."
                            />
                        </div>

                        {/* Alergias */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-[#475569] flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
                                Alergias Conhecidas
                            </label>
                            <input
                                name="allergies"
                                value={formData.allergies}
                                onChange={handleChange}
                                type="text"
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[14px] focus:ring-2 focus:ring-[#1D3461] transition-all"
                                placeholder="Ex: Dipirona, látex... ou Nenhuma"
                            />
                        </div>
                    </div>

                    {/* Medicações */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#475569] flex items-center gap-1.5">
                            <Pill className="w-3.5 h-3.5 text-[#6366F1]" />
                            Medicações em Uso
                        </label>
                        <textarea
                            name="currentMedications"
                            value={formData.currentMedications}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[14px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1D3461] transition-all min-h-[70px] resize-none"
                            placeholder="Liste os medicamentos, dosagem e frequência..."
                        />
                    </div>

                    {/* Doenças pré-existentes */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#475569] flex items-center gap-1.5">
                            <Stethoscope className="w-3.5 h-3.5 text-[#64748B]" />
                            Doenças Pré-existentes / Informações Adicionais
                        </label>
                        <textarea
                            name="preexistingConditions"
                            value={formData.preexistingConditions}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[14px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1D3461] transition-all min-h-[70px] resize-none"
                            placeholder="Ex: Hipertensão, Diabetes, cirurgias anteriores, histórico familiar relevante..."
                        />
                    </div>

                    {/* Modalidade */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-bold text-[#475569]">Modalidade de Atendimento *</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Online */}
                            <div
                                onClick={() => setModality('online')}
                                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${modality === 'online'
                                    ? 'border-[#1D3461] bg-[#EEF4FA]'
                                    : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                                    }`}
                            >
                                {modality === 'online' && (
                                    <div className="absolute top-3 right-3 text-[#1D3461]">
                                        <CheckCircle className="w-4 h-4" />
                                    </div>
                                )}
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${modality === 'online' ? 'bg-[#1D3461] text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                                    <Video className="w-5 h-5" />
                                </div>
                                <h3 className={`text-[14px] font-bold mb-1 ${modality === 'online' ? 'text-[#0F172A]' : 'text-[#334155]'}`}>
                                    Teleconsulta (Online)
                                </h3>
                                <p className={`text-[12px] font-medium leading-relaxed ${modality === 'online' ? 'text-[#334155]' : 'text-[#64748B]'}`}>
                                    Atendimento ao vivo por vídeo com o especialista.
                                </p>
                            </div>

                            {/* Parecer */}
                            <div
                                onClick={() => setModality('parecer')}
                                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${modality === 'parecer'
                                    ? 'border-[#1D3461] bg-[#EEF4FA]'
                                    : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                                    }`}
                            >
                                {modality === 'parecer' && (
                                    <div className="absolute top-3 right-3 text-[#1D3461]">
                                        <CheckCircle className="w-4 h-4" />
                                    </div>
                                )}
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${modality === 'parecer' ? 'bg-[#1D3461] text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                                    <FileText className="w-5 h-5" />
                                </div>
                                <h3 className={`text-[14px] font-bold mb-1 ${modality === 'parecer' ? 'text-[#0F172A]' : 'text-[#334155]'}`}>
                                    Parecer Médico (Assíncrono)
                                </h3>
                                <p className={`text-[12px] font-medium leading-relaxed ${modality === 'parecer' ? 'text-[#334155]' : 'text-[#64748B]'}`}>
                                    Resposta formal por escrito com base no seu relato.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-between">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-3 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569] rounded-xl text-[13px] font-bold transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!modality}
                            className="px-7 py-3 bg-[#1D3461] hover:bg-[#162749] disabled:bg-[#94A3B8] disabled:cursor-not-allowed text-white rounded-xl text-[14px] font-bold transition-all shadow-md flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            Enviar Solicitação
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NovaConsultaModal;
