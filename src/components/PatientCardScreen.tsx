import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
    ArrowLeft, CreditCard, Download, Share2, CheckCircle, Droplets,
    Heart, Phone, Shield, Sparkles
} from 'lucide-react';
import { type Patient, type HealthProfile, maskCPF } from '../services/patientService';

type CardTheme = 'blue' | 'white' | 'black';

interface PatientCardScreenProps {
    navigateTo: (s: string) => void;
    patient: Patient;
    healthProfile: HealthProfile | null;
}

// ── Card Theme Configs ───────────────────────────────────────────────────────────
const themes: Record<CardTheme, {
    bg: string; border: string; nameColor: string; labelColor: string; valueColor: string;
    chipBg: string; chipBorder: string; tagline: string; tagColor: string; qrFg: string; qrBg: string;
    logoBg: string; logoColor: string; accent: string;
}> = {
    blue: {
        bg: 'bg-gradient-to-br from-[#0F172A] via-[#1D3461] to-[#0F172A]',
        border: 'border-white/10',
        nameColor: 'text-white',
        labelColor: 'text-blue-300/70',
        valueColor: 'text-blue-100',
        chipBg: 'bg-teal-500/20', chipBorder: 'border-teal-400/30',
        tagline: 'CARTÃO SAÚDE DIGITAL',
        tagColor: 'text-teal-400',
        qrFg: '#ffffff', qrBg: 'transparent',
        logoBg: 'bg-white/10', logoColor: 'text-white',
        accent: 'from-teal-400 to-emerald-400',
    },
    white: {
        bg: 'bg-gradient-to-br from-white via-slate-50 to-white',
        border: 'border-slate-200',
        nameColor: 'text-[#1D3461]',
        labelColor: 'text-slate-400',
        valueColor: 'text-slate-700',
        chipBg: 'bg-teal-50', chipBorder: 'border-teal-200',
        tagline: 'CARTÃO SAÚDE DIGITAL',
        tagColor: 'text-teal-600',
        qrFg: '#1D3461', qrBg: 'transparent',
        logoBg: 'bg-[#1D3461]/5', logoColor: 'text-[#1D3461]',
        accent: 'from-teal-500 to-emerald-500',
    },
    black: {
        bg: 'bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a]',
        border: 'border-white/5',
        nameColor: 'text-white',
        labelColor: 'text-neutral-500',
        valueColor: 'text-neutral-300',
        chipBg: 'bg-amber-500/10', chipBorder: 'border-amber-500/20',
        tagline: 'ELYON BLACK • SAÚDE DIGITAL',
        tagColor: 'text-amber-400',
        qrFg: '#d4d4d4', qrBg: 'transparent',
        logoBg: 'bg-white/5', logoColor: 'text-white',
        accent: 'from-amber-400 to-yellow-300',
    },
};

const themeLabels: Record<CardTheme, { name: string; desc: string; preview: string }> = {
    blue: { name: 'Azul Premium', desc: 'Tom institucional ELYON', preview: 'bg-gradient-to-r from-[#0F172A] to-[#1D3461]' },
    white: { name: 'Branco Clean', desc: 'Visual limpo e elegante', preview: 'bg-gradient-to-r from-white to-slate-100' },
    black: { name: 'Black Edition', desc: 'Exclusivo e sofisticado', preview: 'bg-gradient-to-r from-[#0a0a0a] to-[#1a1a1a]' },
};

// ── Format helpers ───────────────────────────────────────────────────────────────
function formatDate(dateStr: string | null): string {
    if (!dateStr) return '--/--/----';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
}

function getFirstName(fullName: string): string {
    return fullName.split(' ')[0];
}

// ── Main Component ───────────────────────────────────────────────────────────────
export const PatientCardScreen: React.FC<PatientCardScreenProps> = ({
    navigateTo, patient, healthProfile,
}) => {
    const [selectedTheme, setSelectedTheme] = useState<CardTheme>('blue');
    const [showingBack, setShowingBack] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const t = themes[selectedTheme];

    const baseUrl = window.location.origin;
    const qrUrl = `${baseUrl}/saude/${patient.id}`;

    const emergencyInfo = [
        patient.blood_type && `Tipo: ${patient.blood_type}`,
        patient.allergies?.length && `Alergias: ${patient.allergies.join(', ')}`,
        patient.chronic_conditions?.length && `Condições: ${patient.chronic_conditions.join(', ')}`,
    ].filter(Boolean);

    // Share card
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Cartão Saúde - ${patient.full_name}`,
                    text: `Cartão Saúde Digital ELYON de ${getFirstName(patient.full_name)}`,
                    url: qrUrl,
                });
            } catch { /* user cancelled */ }
        } else {
            await navigator.clipboard.writeText(qrUrl);
            alert('Link copiado para a área de transferência!');
        }
    };

    return (
        <div className="min-h-full bg-slate-50">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#1D3461] to-[#0F172A] px-5 pt-12 pb-8 rounded-b-[2rem]">
                <div className="flex items-center gap-3 mb-2">
                    <button onClick={() => navigateTo('home')} className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-white flex items-center gap-2">
                            <CreditCard className="w-5 h-5" /> Cartão Saúde Digital
                        </h1>
                        <p className="text-[10px] text-blue-300">Seu cartão virtual de identificação médica</p>
                    </div>
                </div>
            </div>

            <div className="px-5 -mt-4 pb-6">
                {/* ═══ THE CARD ═══ */}
                <div
                    ref={cardRef}
                    onClick={() => setShowingBack(!showingBack)}
                    className={`relative w-full aspect-[1.586/1] rounded-2xl border shadow-2xl overflow-hidden cursor-pointer transition-all duration-500 mb-4 ${t.bg} ${t.border}`}
                    style={{ perspective: '1000px' }}
                >
                    {/* Subtle pattern overlay */}
                    <div className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 36px)`,
                        }}
                    />

                    {!showingBack ? (
                        /* ─── FRONT ─── */
                        <div className="relative h-full p-5 flex flex-col justify-between z-10">
                            {/* Top row: Logo + QR */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                    <img src="/elyon-logo.jpg" alt="Elyon" className="w-9 h-9 rounded-lg" />
                                    <div>
                                        <p className={`text-sm font-black tracking-wider ${t.nameColor}`}>ELYON</p>
                                        <p className={`text-[7px] ${t.labelColor} tracking-widest uppercase`}>Conecta · Coordena · Eleva</p>
                                    </div>
                                </div>
                                <div className={`p-1.5 rounded-lg ${selectedTheme === 'white' ? 'bg-slate-100' : 'bg-white/10'}`}>
                                    <QRCodeSVG value={qrUrl} size={48} fgColor={t.qrFg} bgColor="transparent" level="M" />
                                </div>
                            </div>

                            {/* Chip */}
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-7 rounded-md border ${t.chipBg} ${t.chipBorder} flex items-center justify-center`}>
                                    <div className="w-6 h-4 rounded-sm border border-current opacity-40" />
                                </div>
                            </div>

                            {/* Name + Data */}
                            <div>
                                <p className={`text-base font-black tracking-wide mb-1.5 ${t.nameColor}`}>
                                    {patient.full_name.toUpperCase()}
                                </p>
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div>
                                        <p className={`text-[7px] uppercase tracking-widest ${t.labelColor}`}>CPF</p>
                                        <p className={`text-[11px] font-bold ${t.valueColor}`}>{maskCPF(patient.cpf)}</p>
                                    </div>
                                    <div>
                                        <p className={`text-[7px] uppercase tracking-widest ${t.labelColor}`}>Tipo Sang.</p>
                                        <p className={`text-[11px] font-bold ${t.valueColor}`}>{patient.blood_type || '--'}</p>
                                    </div>
                                    <div>
                                        <p className={`text-[7px] uppercase tracking-widest ${t.labelColor}`}>Nasc.</p>
                                        <p className={`text-[11px] font-bold ${t.valueColor}`}>{formatDate(patient.birth_date)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom tagline */}
                            <div className="flex items-center justify-between">
                                <p className={`text-[7px] font-black tracking-[0.2em] uppercase ${t.tagColor}`}>{t.tagline}</p>
                                <div className={`h-[2px] w-12 rounded-full bg-gradient-to-r ${t.accent}`} />
                            </div>
                        </div>
                    ) : (
                        /* ─── BACK ─── */
                        <div className="relative h-full flex flex-col z-10">
                            {/* Magnetic stripe */}
                            <div className={`h-10 mt-5 ${selectedTheme === 'white' ? 'bg-slate-800' : 'bg-white/15'}`} />

                            <div className="flex-1 p-4 flex flex-col justify-between">
                                {/* Emergency info */}
                                <div>
                                    <p className={`text-[8px] font-black uppercase tracking-widest mb-2 ${t.tagColor}`}>
                                        🚨 Informações de Emergência
                                    </p>
                                    <div className="space-y-1">
                                        {emergencyInfo.length > 0 ? emergencyInfo.map((info, i) => (
                                            <p key={i} className={`text-[10px] ${t.valueColor}`}>• {info}</p>
                                        )) : (
                                            <p className={`text-[10px] ${t.labelColor} italic`}>Nenhuma informação de emergência cadastrada</p>
                                        )}
                                        {patient.emergency_contact_name && (
                                            <p className={`text-[10px] ${t.valueColor}`}>
                                                📞 {patient.emergency_contact_name}: {patient.emergency_contact_phone}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* QR + scan instruction */}
                                <div className="flex items-center gap-3">
                                    <div className={`p-1 rounded-md ${selectedTheme === 'white' ? 'bg-slate-100' : 'bg-white/10'}`}>
                                        <QRCodeSVG value={qrUrl} size={40} fgColor={t.qrFg} bgColor="transparent" level="M" />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-[8px] font-bold ${t.valueColor}`}>Escaneie para ver o prontuário completo</p>
                                        <p className={`text-[7px] ${t.labelColor} mt-0.5`}>Histórico, exames, medicações e cronologia clínica</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <p className={`text-[7px] ${t.labelColor}`}>elyon.health/{patient.id.slice(0, 8)}</p>
                                    <p className={`text-[7px] font-black tracking-[0.2em] uppercase ${t.tagColor}`}>ELYON</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-[10px] text-center text-slate-400 mb-5">Toque no cartão para ver {showingBack ? 'a frente' : 'o verso'}</p>

                {/* ═══ THEME SELECTOR ═══ */}
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Escolha o visual</h2>
                <div className="grid grid-cols-3 gap-2.5 mb-6">
                    {(Object.keys(themes) as CardTheme[]).map((theme) => {
                        const tl = themeLabels[theme];
                        const isSelected = selectedTheme === theme;
                        return (
                            <button key={theme} onClick={() => setSelectedTheme(theme)}
                                className={`relative p-3 rounded-2xl border-2 transition-all active:scale-95 ${
                                    isSelected ? 'border-[#1D3461] shadow-lg' : 'border-slate-200 hover:border-slate-300'
                                }`}>
                                {isSelected && (
                                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#1D3461] rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-3 h-3 text-white" />
                                    </div>
                                )}
                                <div className={`w-full h-8 rounded-lg mb-2 ${tl.preview} border border-slate-200/30`} />
                                <p className="text-[10px] font-bold text-slate-900">{tl.name}</p>
                                <p className="text-[8px] text-slate-400">{tl.desc}</p>
                            </button>
                        );
                    })}
                </div>

                {/* ═══ ACTIONS ═══ */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button onClick={handleShare}
                        className="flex items-center justify-center gap-2 py-3.5 bg-[#1D3461] text-white rounded-2xl text-xs font-bold active:scale-95 transition shadow-lg shadow-[#1D3461]/20">
                        <Share2 className="w-4 h-4" /> Compartilhar
                    </button>
                    <button onClick={() => navigateTo('home')}
                        className="flex items-center justify-center gap-2 py-3.5 bg-white text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold active:scale-95 transition">
                        <Download className="w-4 h-4" /> Salvar QR
                    </button>
                </div>

                {/* ═══ QR Code Info ═══ */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-purple-900 mb-1">Como usar o QR Code</p>
                            <div className="space-y-1.5">
                                <p className="text-[10px] text-purple-700">🚨 <b>Emergência:</b> Socorristas escaneiam para ver tipo sanguíneo, alergias e contatos.</p>
                                <p className="text-[10px] text-purple-700">🩺 <b>Consulta:</b> Médico escaneia para acessar histórico, exames e cronologia clínica.</p>
                                <p className="text-[10px] text-purple-700">💊 <b>Farmácia:</b> Valide suas prescrições ativas e medicações em uso.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
