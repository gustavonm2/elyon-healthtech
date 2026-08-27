import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Droplets, Heart, Pill, AlertCircle, Phone, User, Calendar,
    FileText, FlaskConical, Clock, Shield, Activity, Stethoscope,
    CheckCircle, Loader2, HeartPulse, Brain, Siren
} from 'lucide-react';
import { supabasePatients } from '../lib/supabasePatients';

interface PublicPatient {
    id: string;
    full_name: string;
    birth_date: string | null;
    gender: string | null;
    blood_type: string | null;
    allergies: string[];
    chronic_conditions: string[];
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
}

interface PublicMedication {
    id: string;
    medication_name: string;
    dosage: string;
    frequency: string;
    prescribing_doctor: string | null;
    active: boolean;
}

interface PublicHealthProfile {
    daily_routine: string | null;
    exercise_frequency: string | null;
    sleep_hours: string | null;
    smoking: string | null;
    alcohol: string | null;
    past_diseases: string[];
    family_history: string[];
    surgeries: string[];
    stress_level: string | null;
    liz_health_summary: string | null;
    liz_risk_factors: string[];
    liz_recommendations: string[];
    triage_completed: boolean;
}

function calcAge(dateStr: string): number {
    const today = new Date();
    const birth = new Date(dateStr);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

export const PublicHealthPage: React.FC = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const [patient, setPatient] = useState<PublicPatient | null>(null);
    const [medications, setMedications] = useState<PublicMedication[]>([]);
    const [healthProfile, setHealthProfile] = useState<PublicHealthProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'emergency' | 'clinical' | 'history'>('emergency');

    useEffect(() => {
        if (!patientId) { setError('ID do paciente não informado.'); setLoading(false); return; }

        const loadData = async () => {
            try {
                const [patRes, medRes, profileRes] = await Promise.all([
                    supabasePatients.from('patients').select('id, full_name, birth_date, gender, blood_type, allergies, chronic_conditions, emergency_contact_name, emergency_contact_phone').eq('id', patientId).single(),
                    supabasePatients.from('patient_medications').select('id, medication_name, dosage, frequency, prescribing_doctor, active').eq('patient_id', patientId).order('active', { ascending: false }),
                    supabasePatients.from('patient_health_profiles').select('*').eq('patient_id', patientId).single(),
                ]);

                if (patRes.error || !patRes.data) { setError('Paciente não encontrado.'); setLoading(false); return; }
                setPatient(patRes.data as PublicPatient);
                setMedications((medRes.data || []) as PublicMedication[]);
                if (profileRes.data) setHealthProfile(profileRes.data as PublicHealthProfile);
            } catch {
                setError('Erro ao carregar dados.');
            }
            setLoading(false);
        };
        loadData();
    }, [patientId]);

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#1D3461] mx-auto mb-3" />
                <p className="text-sm text-slate-500">Carregando prontuário...</p>
            </div>
        </div>
    );

    if (error || !patient) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-5">
            <div className="bg-white rounded-2xl border border-red-100 p-8 text-center max-w-sm">
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <h2 className="text-base font-bold text-slate-900 mb-1">Prontuário Indisponível</h2>
                <p className="text-sm text-slate-500">{error || 'Não foi possível acessar os dados do paciente.'}</p>
            </div>
        </div>
    );

    const activeMeds = medications.filter(m => m.active);
    const tabs = [
        { id: 'emergency' as const, label: '🚨 Emergência', icon: Siren },
        { id: 'clinical' as const, label: '🩺 Clínico', icon: Stethoscope },
        { id: 'history' as const, label: '📋 Perfil', icon: Brain },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#1D3461] to-[#0F172A] px-5 pt-10 pb-6">
                <div className="flex items-center gap-3 mb-4">
                    <img src="/elyon-logo.jpg" alt="Elyon" className="w-10 h-10 rounded-xl" />
                    <div>
                        <p className="text-[10px] text-teal-400 font-bold uppercase tracking-widest">ELYON HealthTech</p>
                        <p className="text-[8px] text-blue-300">Prontuário Digital Verificado</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span className="text-[8px] font-bold text-emerald-300">VERIFICADO</span>
                    </div>
                </div>

                {/* Patient Identity */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                            <User className="w-7 h-7 text-blue-200" />
                        </div>
                        <div className="flex-1">
                            <p className="text-base font-bold text-white">{patient.full_name}</p>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                                {patient.birth_date && <span className="text-[10px] text-blue-200">{calcAge(patient.birth_date)} anos</span>}
                                {patient.gender && <span className="text-[10px] text-blue-200">· {patient.gender}</span>}
                                {patient.blood_type && (
                                    <span className="flex items-center gap-1 text-[10px] text-red-300 font-bold">
                                        <Droplets className="w-3 h-3" />{patient.blood_type}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-5 pt-4">
                <div className="flex bg-white rounded-xl border border-slate-200 p-1 mb-4">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-2.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                                activeTab === tab.id
                                    ? 'bg-[#1D3461] text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ─── TAB: EMERGENCY ─── */}
                {activeTab === 'emergency' && (
                    <div className="space-y-3 pb-6">
                        {/* Blood Type */}
                        {patient.blood_type && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                    <Droplets className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-red-400 font-bold uppercase">Tipo Sanguíneo</p>
                                    <p className="text-2xl font-black text-red-700">{patient.blood_type}</p>
                                </div>
                            </div>
                        )}

                        {/* Allergies */}
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Alergias</p>
                            {patient.allergies?.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {patient.allergies.map((a, i) => (
                                        <span key={i} className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold border border-amber-200">{a}</span>
                                    ))}
                                </div>
                            ) : <p className="text-xs text-amber-600/60 italic">Nenhuma alergia registrada</p>}
                        </div>

                        {/* Chronic Conditions */}
                        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                            <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-2 flex items-center gap-1"><HeartPulse className="w-3.5 h-3.5" /> Condições Crônicas</p>
                            {patient.chronic_conditions?.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {patient.chronic_conditions.map((c, i) => (
                                        <span key={i} className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold border border-purple-200">{c}</span>
                                    ))}
                                </div>
                            ) : <p className="text-xs text-purple-600/60 italic">Nenhuma condição crônica</p>}
                        </div>

                        {/* Emergency Contact */}
                        {patient.emergency_contact_name && (
                            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Contato de Emergência</p>
                                <p className="text-sm font-bold text-blue-900">{patient.emergency_contact_name}</p>
                                {patient.emergency_contact_phone && (
                                    <a href={`tel:${patient.emergency_contact_phone}`} className="inline-flex items-center gap-1.5 mt-2 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold active:scale-95 transition">
                                        <Phone className="w-3.5 h-3.5" />{patient.emergency_contact_phone}
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── TAB: CLINICAL ─── */}
                {activeTab === 'clinical' && (
                    <div className="space-y-3 pb-6">
                        {/* Active Medications */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-1"><Pill className="w-3.5 h-3.5" /> Medicações Ativas ({activeMeds.length})</p>
                            {activeMeds.length > 0 ? (
                                <div className="space-y-2.5">
                                    {activeMeds.map(med => (
                                        <div key={med.id} className="flex items-center gap-3 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                                            <Pill className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-slate-900">{med.medication_name}</p>
                                                <p className="text-[10px] text-slate-500">{med.dosage} · {med.frequency}</p>
                                                {med.prescribing_doctor && <p className="text-[9px] text-slate-400">{med.prescribing_doctor}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-xs text-slate-400 italic">Nenhuma medicação ativa cadastrada</p>}
                        </div>

                        {/* Health Profile Risk Factors */}
                        {healthProfile?.liz_risk_factors && healthProfile.liz_risk_factors.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                                <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1"><Siren className="w-3.5 h-3.5" /> Fatores de Risco (LIZ AI)</p>
                                <div className="space-y-1.5">
                                    {healthProfile.liz_risk_factors.map((rf, i) => (
                                        <div key={i} className="flex items-start gap-2 text-xs text-red-700">
                                            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /><span>{rf}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* LIZ Recommendations */}
                        {healthProfile?.liz_recommendations && healthProfile.liz_recommendations.length > 0 && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1"><Stethoscope className="w-3.5 h-3.5" /> Recomendações (LIZ AI)</p>
                                <div className="space-y-1.5">
                                    {healthProfile.liz_recommendations.map((rec, i) => (
                                        <div key={i} className="flex items-start gap-2 text-xs text-emerald-700">
                                            <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /><span>{rec}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── TAB: PROFILE/HISTORY ─── */}
                {activeTab === 'history' && (
                    <div className="space-y-3 pb-6">
                        {healthProfile?.triage_completed ? (
                            <>
                                {/* LIZ Summary */}
                                {healthProfile.liz_health_summary && (
                                    <div className="bg-gradient-to-br from-[#1D3461] to-[#0F172A] rounded-2xl p-4 text-white">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Brain className="w-4 h-4 text-emerald-300" />
                                            <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest">Análise LIZ AI</span>
                                        </div>
                                        <p className="text-xs leading-relaxed text-white/90">{healthProfile.liz_health_summary}</p>
                                    </div>
                                )}

                                {/* Health Data Grid */}
                                <div className="grid grid-cols-2 gap-2.5">
                                    {[
                                        { label: 'Exercícios', value: healthProfile.exercise_frequency, icon: Activity },
                                        { label: 'Sono', value: healthProfile.sleep_hours, icon: Clock },
                                        { label: 'Tabagismo', value: healthProfile.smoking, icon: Heart },
                                        { label: 'Álcool', value: healthProfile.alcohol, icon: Shield },
                                        { label: 'Estresse', value: healthProfile.stress_level, icon: HeartPulse },
                                    ].filter(d => d.value).map(d => (
                                        <div key={d.label} className="bg-white border border-slate-100 rounded-xl p-3">
                                            <d.icon className="w-3.5 h-3.5 text-slate-400 mb-1" />
                                            <p className="text-[9px] text-slate-400 font-semibold uppercase">{d.label}</p>
                                            <p className="text-xs font-bold text-slate-800 capitalize">{d.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Past Diseases */}
                                {healthProfile.past_diseases.length > 0 && (
                                    <div className="bg-white border border-slate-200 rounded-2xl p-4">
                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Doenças Anteriores</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {healthProfile.past_diseases.map((d, i) => (
                                                <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-medium">{d}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {healthProfile.surgeries.length > 0 && (
                                    <div className="bg-white border border-slate-200 rounded-2xl p-4">
                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Cirurgias</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {healthProfile.surgeries.map((s, i) => (
                                                <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-medium">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {healthProfile.family_history.length > 0 && (
                                    <div className="bg-white border border-slate-200 rounded-2xl p-4">
                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Histórico Familiar</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {healthProfile.family_history.map((f, i) => (
                                                <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-medium">{f}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
                                <Brain className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm font-bold text-slate-700">Triagem não realizada</p>
                                <p className="text-xs text-slate-400 mt-1">O paciente ainda não completou a triagem de saúde.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-8 pt-2">
                <div className="text-center">
                    <p className="text-[9px] text-slate-400">Prontuário digital verificado por</p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                        <img src="/elyon-logo.jpg" alt="Elyon" className="w-5 h-5 rounded" />
                        <span className="text-[10px] font-bold text-[#1D3461]">ELYON HealthTech</span>
                    </div>
                    <p className="text-[8px] text-slate-300 mt-1">Conecta · Coordena · Eleva</p>
                </div>
            </div>
        </div>
    );
};
