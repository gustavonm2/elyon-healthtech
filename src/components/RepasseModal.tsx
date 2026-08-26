import React, { useState } from 'react';
import { X, ArrowRightLeft, AlertCircle, CheckCircle } from 'lucide-react';

interface RepasseModalProps {
    patientName: string;
    especialidade: string;
    onConfirm: (motivo: string) => void;
    onCancel: () => void;
}

const MIN_MOTIVO_LENGTH = 30;

const RepasseModal: React.FC<RepasseModalProps> = ({ patientName, especialidade, onConfirm, onCancel }) => {
    const [motivo, setMotivo] = useState('');
    const [touched, setTouched] = useState(false);

    const isValid = motivo.trim().length >= MIN_MOTIVO_LENGTH;
    const remaining = MIN_MOTIVO_LENGTH - motivo.trim().length;

    const handleConfirm = () => {
        if (!isValid) {
            setTouched(true);
            return;
        }
        onConfirm(motivo.trim());
    };

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(2px)' }}
        >
            {/* Modal Card */}
            <div
                className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
                style={{ border: '1px solid #E2E8F0' }}
            >
                {/* Header — laranja/âmbar para indicar ação sensível */}
                <div className="px-6 pt-6 pb-5" style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFBEB 100%)', borderBottom: '1px solid #FED7AA' }}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                                <ArrowRightLeft className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-[13px] font-bold text-[#0F172A]">Repassar Caso</h2>
                                <p className="text-[11px] font-medium text-[#92400E] mt-0.5">
                                    {patientName} · {especialidade}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-1.5 rounded-lg hover:bg-orange-100 text-[#92400E] transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {/* Info banner */}
                    <div className="flex gap-2.5 bg-[#FFF7ED] border border-[#FED7AA] rounded-xl px-4 py-3">
                        <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-[#92400E] font-medium leading-relaxed">
                            Este caso ficará disponível na <strong>fila de repasses</strong> para que outro colega possa assumir o atendimento. O motivo será registrado no histórico do paciente.
                        </p>
                    </div>

                    {/* Motivo field */}
                    <div>
                        <label className="block text-[11px] font-bold text-[#0F172A] mb-1.5">
                            Motivo do Repasse <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={motivo}
                            onChange={e => {
                                setMotivo(e.target.value);
                                if (touched) setTouched(false);
                            }}
                            onBlur={() => setTouched(true)}
                            rows={4}
                            placeholder="Descreva o motivo pelo qual está repassando este caso (dificuldade diagnóstica, necessidade de especialidade específica, conflito de agenda etc.)…"
                            className="w-full px-4 py-3 text-[11px] border rounded-xl resize-none focus:outline-none focus:ring-2 transition-all leading-relaxed"
                            style={{
                                borderColor: (touched && !isValid) ? '#EF4444' : '#E2E8F0',
                                backgroundColor: '#F8FAFC',
                                color: '#1E293B',
                                boxShadow: (touched && !isValid) ? '0 0 0 3px rgba(239,68,68,0.1)' : undefined,
                            }}
                        />
                        <div className="flex items-center justify-between mt-1.5">
                            {touched && !isValid ? (
                                <p className="text-[10px] font-semibold text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Mínimo de {MIN_MOTIVO_LENGTH} caracteres ({remaining > 0 ? `faltam ${remaining}` : 'ok'})
                                </p>
                            ) : (
                                <span />
                            )}
                            <span className={`text-[10px] font-bold ml-auto ${isValid ? 'text-green-600' : 'text-[#94A3B8]'}`}>
                                {motivo.trim().length}/{MIN_MOTIVO_LENGTH}+
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-xl text-[11px] font-bold border transition-colors"
                        style={{ borderColor: '#E2E8F0', color: '#64748B', backgroundColor: '#F8FAFC' }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-3 rounded-xl text-[11px] font-bold text-white flex items-center justify-center gap-2 transition-all"
                        style={{
                            backgroundColor: isValid ? '#EA580C' : '#D1D5DB',
                            cursor: isValid ? 'pointer' : 'not-allowed',
                            boxShadow: isValid ? '0 4px 12px rgba(234,88,12,0.25)' : undefined,
                        }}
                    >
                        {isValid
                            ? <><CheckCircle className="w-4 h-4" /> Confirmar Repasse</>
                            : <><ArrowRightLeft className="w-4 h-4" /> Confirmar Repasse</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RepasseModal;
