import React, { useState } from 'react';
import { X, Star, Send, CheckCircle } from 'lucide-react';
import { addRating } from '../utils/patientStore';

interface RatingModalProps {
    doctorName: string;
    doctorSpecialty: string;
    team: string;
    consultaId: string;
    patientName: string;
    onClose: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({
    doctorName, doctorSpecialty, team, consultaId, patientName, onClose
}) => {
    const [hovered, setHovered] = useState(0);
    const [selected, setSelected] = useState(0);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const starLabel = ['', 'Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'];
    const starColor = ['', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#10B981'];
    const displayStar = hovered || selected;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected) return;
        const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        addRating({ doctorName, doctorSpecialty, team, patientName, stars: selected, comment, date: today, consultaId });
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-[#D1FAE5] rounded-full flex items-center justify-center mx-auto mb-5">
                        <CheckCircle className="w-10 h-10 text-[#10B981]" />
                    </div>
                    <h2 className="text-[20px] font-black text-[#0F172A] mb-2">Avaliação Enviada!</h2>
                    <p className="text-[13px] text-[#64748B] font-medium mb-6">Obrigado pelo seu feedback. Ele ajuda a melhorar a qualidade do serviço.</p>
                    <div className="flex justify-center gap-1 mb-6">
                        {[1,2,3,4,5].map(s => (
                            <Star key={s} className="w-7 h-7" fill={s <= selected ? '#F59E0B' : 'none'} stroke={s <= selected ? '#F59E0B' : '#CBD5E1'} />
                        ))}
                    </div>
                    <button onClick={onClose} className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl font-bold text-[14px] transition-all">
                        Fechar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0]" style={{ borderLeftWidth: 4, borderLeftStyle: 'solid', borderLeftColor: '#F59E0B' }}>
                    <div>
                        <h2 className="text-[17px] font-black text-[#0F172A]">Avaliar Atendimento</h2>
                        <p className="text-[12px] text-[#64748B] font-medium mt-0.5">Como foi sua experiência com <strong>{doctorName}</strong>?</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F1F5F9] text-[#94A3B8] transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Doctor info chip */}
                    <div className="flex items-center gap-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0">
                            {doctorName.split(' ').map(w => w[0]).slice(0,2).join('')}
                        </div>
                        <div>
                            <p className="text-[13px] font-bold text-[#0F172A]">{doctorName}</p>
                            <p className="text-[11px] text-[#64748B] font-medium">{doctorSpecialty} · {team}</p>
                        </div>
                    </div>

                    {/* Stars */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-[#475569]">Nota geral *</label>
                        <div className="flex items-center gap-2">
                            {[1,2,3,4,5].map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onMouseEnter={() => setHovered(s)}
                                    onMouseLeave={() => setHovered(0)}
                                    onClick={() => setSelected(s)}
                                    className="transition-transform hover:scale-110 active:scale-95"
                                >
                                    <Star
                                        className="w-9 h-9 transition-all duration-150"
                                        fill={s <= displayStar ? (starColor[displayStar] || '#F59E0B') : 'none'}
                                        stroke={s <= displayStar ? (starColor[displayStar] || '#F59E0B') : '#CBD5E1'}
                                    />
                                </button>
                            ))}
                            {displayStar > 0 && (
                                <span className="ml-2 text-[13px] font-bold" style={{ color: starColor[displayStar] }}>
                                    {starLabel[displayStar]}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Comment */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#475569]">Comentário (opcional)</label>
                        <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#F59E0B] transition-all min-h-[90px] resize-none"
                            placeholder="Compartilhe sua experiência com o atendimento..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569] rounded-xl text-[13px] font-bold transition-all">
                            Agora não
                        </button>
                        <button
                            type="submit"
                            disabled={!selected}
                            className="flex-1 py-3 bg-[#F59E0B] hover:bg-[#D97706] disabled:bg-[#E2E8F0] disabled:text-[#94A3B8] disabled:cursor-not-allowed text-white rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            Enviar Avaliação
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RatingModal;
