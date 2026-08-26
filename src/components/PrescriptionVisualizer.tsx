import React from 'react';
import { X, Printer, Send, ShieldCheck, Pill } from 'lucide-react';

interface PrescriptionVisualizerProps {
    patientName: string;
    doctorName: string;
    plan: string;
    orientations: string;
    onClose: () => void;
    onSendWhatsapp: () => void;
}

const PrescriptionVisualizer: React.FC<PrescriptionVisualizerProps> = ({
    patientName,
    doctorName,
    plan,
    orientations,
    onClose,
    onSendWhatsapp
}) => {
    return (
        <div className="fixed inset-0 z-[60] bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 pb-24 sm:pb-6 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-[#F1F5F9] w-full max-w-3xl rounded-[24px] shadow-[0_24px_64px_rgba(0,0,0,0.15)] flex flex-col max-h-full overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Toolbar */}
                <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#E2E8F0]">
                    <h3 className="font-bold text-[18px] text-[#0F172A] flex items-center">
                        <Pill className="w-5 h-5 mr-2 text-[#1D3461]" />
                        Visualização de Receituário
                    </h3>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onSendWhatsapp}
                            className="hidden sm:flex items-center px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-[13px] font-bold transition-colors shadow-sm"
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Enviar via WhatsApp
                        </button>
                        <button className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-full transition-colors hidden sm:block">
                            <Printer className="w-5 h-5" />
                        </button>
                        <div className="w-px h-6 bg-[#E2E8F0] mx-1 hidden sm:block"></div>
                        <button onClick={onClose} className="p-2 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Paper Container */}
                <div className="p-6 sm:p-10 overflow-y-auto flex-1 flex justify-center">
                    {/* A4 Format Paper */}
                    <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-md flex flex-col relative" style={{ backgroundImage: 'radial-gradient(#E2E8F0 1px, transparent 1px)', backgroundSize: '24px 24px', backgroundPosition: 'center' }}>

                        {/* Paper Header / Timbrado */}
                        <div className="px-12 pt-16 pb-8 border-b-2 border-[#E2E8F0] flex justify-between items-center bg-white rounded-t-md relative z-10">
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-[#1D3461] rounded-lg flex items-center justify-center text-white mr-4 shadow-sm">
                                    <span className="font-black text-xl tracking-tighter">P</span>
                                </div>
                                <div>
                                    <h2 className="text-[20px] font-black tracking-tight text-[#0F172A] capitalize">Clínica Pareceres</h2>
                                    <p className="text-[11px] font-bold text-[#64748B] tracking-widest capitalize mt-0.5">Telemedicina Avançada</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[14px] font-bold text-[#0F172A]">{doctorName}</p>
                                <p className="text-[12px] font-medium text-[#64748B]">CRM/UF: 000000</p>
                            </div>
                        </div>

                        {/* Paper Body */}
                        <div className="px-12 py-10 flex-1 bg-white relative z-10 text-[#0F172A]">
                            <div className="mb-10">
                                <p className="text-[12px] font-bold text-[#64748B] capitalize mb-1">Para o paciente</p>
                                <h1 className="text-[24px] font-black capitalize">{patientName}</h1>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-center mb-4">
                                    <div className="bg-[#EBF3FF] p-2 rounded-lg mr-3">
                                        <Pill className="w-5 h-5 text-[#1D3461]" />
                                    </div>
                                    <h3 className="text-[16px] font-bold capitalize text-[#0F172A]">Prescrição de Medicamentos</h3>
                                </div>
                                {plan ? (
                                    <div className="pl-14 text-[14px] leading-relaxed font-medium text-[#334155] whitespace-pre-wrap">
                                        {plan}
                                    </div>
                                ) : (
                                    <div className="pl-14 text-[14px] leading-relaxed font-medium text-[#94A3B8] italic">
                                        Nenhuma medicação prescrita neste atendimento.
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center mb-4">
                                    <div className="bg-[#EBF3FF] p-2 rounded-lg mr-3">
                                        <ShieldCheck className="w-5 h-5 text-[#1D3461]" />
                                    </div>
                                    <h3 className="text-[16px] font-bold capitalize text-[#0F172A]">Orientações Gerais</h3>
                                </div>
                                {orientations ? (
                                    <div className="pl-14 text-[14px] leading-relaxed font-medium text-[#334155] whitespace-pre-wrap">
                                        {orientations}
                                    </div>
                                ) : (
                                    <div className="pl-14 text-[14px] leading-relaxed font-medium text-[#94A3B8] italic">
                                        Nenhuma orientação específica registrada.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Paper Footer */}
                        <div className="px-12 pb-16 pt-8 bg-white rounded-b-md relative z-10 flex flex-col items-center">
                            <div className="w-64 border-b border-[#CBD5E1] mb-2"></div>
                            <p className="text-[14px] font-bold text-[#0F172A]">{doctorName}</p>
                            <p className="text-[12px] font-medium text-[#64748B] mb-6">Assinatura Eletrônica Verificada</p>
                            <p className="text-[11px] font-bold text-[#94A3B8] text-center max-w-md">
                                Documento assinado digitalmente conforme MP 2.200-2/2001. A autenticidade deste documento pode ser conferida via QRCode na versão impressa.
                            </p>
                        </div>

                        {/* Validation Stamp watermark */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.03] z-0 pointer-events-none">
                            <ShieldCheck className="w-96 h-96 text-[#1D3461]" />
                        </div>
                    </div>
                </div>

                {/* Mobile Toolbar (Bottom context) */}
                <div className="sm:hidden bg-white p-4 border-t border-[#E2E8F0] shadow-[0_-4px_16px_rgba(0,0,0,0.05)] pt-4 pb-8">
                    <button
                        onClick={onSendWhatsapp}
                        className="w-full flex items-center justify-center px-4 py-3.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-[14px] font-bold transition-colors shadow-sm"
                    >
                        <Send className="w-5 h-5 mr-2" />
                        Enviar via WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrescriptionVisualizer;
