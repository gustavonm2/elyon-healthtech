import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, Activity, Heart, Droplets, Thermometer,
    Scale, Plus, CheckCircle, AlertCircle, Clock, Calendar,
    Loader2, Trash2, TrendingUp, Sparkles, Shield
} from 'lucide-react';
import {
    addVitalSign, listVitalSigns, type VitalSign, type VitalSignInsert
} from '../services/patientService';

interface VitalsScreenProps {
    navigateTo: (s: string) => void;
    patientId: string;
    patientName: string;
    onVitalSaved?: () => void;
}

// ── Status classifications ────────────────────────────────────────────────────────
function getBpStatus(sys: number | null, dia: number | null): { label: string; color: string; alert?: boolean } {
    if (!sys || !dia) return { label: '--', color: 'text-slate-400' };
    if (sys < 120 && dia < 80) return { label: 'Ótima (Normal)', color: 'text-emerald-500' };
    if (sys <= 129 && dia < 80) return { label: 'Normal', color: 'text-emerald-400' };
    if (sys <= 139 || dia <= 89) return { label: 'Pré-Hipertensão', color: 'text-amber-500', alert: true };
    if (sys <= 159 || dia <= 99) return { label: 'Hipertensão Estágio 1', color: 'text-orange-500', alert: true };
    return { label: 'Hipertensão Estágio 2', color: 'text-red-500', alert: true };
}

function getHrStatus(hr: number | null): { label: string; color: string } {
    if (!hr) return { label: '--', color: 'text-slate-400' };
    if (hr < 60) return { label: 'Bradicardia', color: 'text-blue-400' };
    if (hr <= 100) return { label: 'Normal', color: 'text-emerald-500' };
    return { label: 'Taquicardia', color: 'text-red-500' };
}

function getGlucoseStatus(gl: number | null, ctx: string | null): { label: string; color: string } {
    if (!gl) return { label: '--', color: 'text-slate-400' };
    if (ctx === 'jejum') {
        if (gl < 70) return { label: 'Hipoglicemia', color: 'text-blue-500' };
        if (gl <= 99) return { label: 'Normal (Jejum)', color: 'text-emerald-500' };
        if (gl <= 125) return { label: 'Pré-Diabetes', color: 'text-amber-500' };
        return { label: 'Hiperglicemia', color: 'text-red-500' };
    }
    if (gl <= 140) return { label: 'Normal', color: 'text-emerald-500' };
    if (gl <= 199) return { label: 'Tolerância Diminuída', color: 'text-amber-500' };
    return { label: 'Hiperglicemia', color: 'text-red-500' };
}

function getSpo2Status(spo2: number | null): { label: string; color: string } {
    if (!spo2) return { label: '--', color: 'text-slate-400' };
    if (spo2 >= 95) return { label: 'Normal', color: 'text-emerald-500' };
    if (spo2 >= 90) return { label: 'Atenção (Baixa)', color: 'text-amber-500' };
    return { label: 'Hipoxemia Crítica', color: 'text-red-500' };
}

export const VitalsScreen: React.FC<VitalsScreenProps> = ({
    navigateTo, patientId, patientName, onVitalSaved
}) => {
    const [vitalsList, setVitalsList] = useState<VitalSign[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Form inputs
    const [systolic, setSystolic] = useState('');
    const [diastolic, setDiastolic] = useState('');
    const [heartRate, setHeartRate] = useState('');
    const [glucose, setGlucose] = useState('');
    const [glucoseContext, setGlucoseContext] = useState<'jejum' | 'pos_prandial' | 'casual'>('jejum');
    const [spo2, setSpo2] = useState('');
    const [temperature, setTemperature] = useState('');
    const [weight, setWeight] = useState('');
    const [notes, setNotes] = useState('');

    const loadData = async () => {
        setLoading(true);
        const data = await listVitalSigns(patientId);
        setVitalsList(data);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [patientId]);

    const handleSave = async () => {
        if (!systolic && !heartRate && !glucose && !spo2 && !temperature && !weight) {
            setError('Preencha ao menos um sinal vital.');
            return;
        }

        setSaving(true);
        setError('');

        const vitalData: VitalSignInsert = {
            patient_id: patientId,
            systolic_bp: systolic ? parseInt(systolic, 10) : null,
            diastolic_bp: diastolic ? parseInt(diastolic, 10) : null,
            heart_rate: heartRate ? parseInt(heartRate, 10) : null,
            glucose: glucose ? parseInt(glucose, 10) : null,
            glucose_context: glucose ? glucoseContext : null,
            oxygen_saturation: spo2 ? parseInt(spo2, 10) : null,
            temperature: temperature ? parseFloat(temperature.replace(',', '.')) : null,
            weight: weight ? parseFloat(weight.replace(',', '.')) : null,
            notes: notes.trim() || null,
            recorded_at: new Date().toISOString(),
        };

        const { data, error: err } = await addVitalSign(vitalData);
        setSaving(false);

        if (err) {
            setError(err);
            return;
        }

        if (data) {
            setVitalsList(prev => [data, ...prev]);
            setShowAddModal(false);
            // Reset form
            setSystolic(''); setDiastolic(''); setHeartRate(''); setGlucose('');
            setSpo2(''); setTemperature(''); setWeight(''); setNotes('');
            if (onVitalSaved) onVitalSaved();
        }
    };

    const latest = vitalsList[0] || null;
    const bpStatus = latest ? getBpStatus(latest.systolic_bp, latest.diastolic_bp) : null;
    const hrStatus = latest ? getHrStatus(latest.heart_rate) : null;
    const glStatus = latest ? getGlucoseStatus(latest.glucose, latest.glucose_context) : null;
    const spo2Status = latest ? getSpo2Status(latest.oxygen_saturation) : null;

    const iCls = "flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-[#1D3461] transition-all";
    const fCls = "w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none font-medium";

    return (
        <div className="min-h-full bg-slate-50 pb-8">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#1D3461] to-[#0F172A] px-5 pt-12 pb-8 rounded-b-[2rem] text-white">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigateTo('home')} className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold">Sinais Vitais</h1>
                            <p className="text-[10px] text-blue-300">Monitoramento contínuo para a LIZ</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold active:scale-95 transition shadow-lg shadow-emerald-500/20"
                    >
                        <Plus className="w-4 h-4" /> Registrar
                    </button>
                </div>

                {/* Latest Vitals Summary Grid */}
                {latest ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
                        {/* Blood Pressure */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] uppercase tracking-wider text-blue-200 font-semibold">Pressão</span>
                                <Heart className="w-3.5 h-3.5 text-red-400" />
                            </div>
                            <p className="text-base font-black">
                                {latest.systolic_bp && latest.diastolic_bp ? `${latest.systolic_bp}/${latest.diastolic_bp}` : '--'}
                                <span className="text-[9px] font-normal text-blue-200 ml-1">mmHg</span>
                            </p>
                            {bpStatus && <p className={`text-[8px] font-bold ${bpStatus.color} mt-0.5`}>{bpStatus.label}</p>}
                        </div>

                        {/* Heart Rate */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] uppercase tracking-wider text-blue-200 font-semibold">Freq. Cardíaca</span>
                                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            <p className="text-base font-black">
                                {latest.heart_rate || '--'}
                                <span className="text-[9px] font-normal text-blue-200 ml-1">bpm</span>
                            </p>
                            {hrStatus && <p className={`text-[8px] font-bold ${hrStatus.color} mt-0.5`}>{hrStatus.label}</p>}
                        </div>

                        {/* Glucose */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] uppercase tracking-wider text-blue-200 font-semibold">Glicemia</span>
                                <Droplets className="w-3.5 h-3.5 text-amber-400" />
                            </div>
                            <p className="text-base font-black">
                                {latest.glucose || '--'}
                                <span className="text-[9px] font-normal text-blue-200 ml-1">mg/dL</span>
                            </p>
                            {glStatus && <p className={`text-[8px] font-bold ${glStatus.color} mt-0.5`}>{glStatus.label}</p>}
                        </div>

                        {/* SpO2 */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] uppercase tracking-wider text-blue-200 font-semibold">Saturação O2</span>
                                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                            </div>
                            <p className="text-base font-black">
                                {latest.oxygen_saturation ? `${latest.oxygen_saturation}%` : '--'}
                            </p>
                            {spo2Status && <p className={`text-[8px] font-bold ${spo2Status.color} mt-0.5`}>{spo2Status.label}</p>}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                        <p className="text-xs text-blue-200">Nenhum sinal vital registrado ainda.</p>
                        <p className="text-[10px] text-blue-300/60 mt-1">Toque em "Registrar" para adicionar sua primeira medição.</p>
                    </div>
                )}
            </div>

            {/* Content & History */}
            <div className="px-5 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#1D3461]" /> Histórico de Medições
                    </h2>
                    <span className="text-[10px] font-semibold text-slate-400">{vitalsList.length} registro(s)</span>
                </div>

                {loading ? (
                    <div className="py-12 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-[#1D3461] mx-auto mb-2" />
                        <p className="text-xs text-slate-500">Carregando histórico...</p>
                    </div>
                ) : vitalsList.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
                        <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-700">Sem registros ainda</p>
                        <p className="text-xs text-slate-400 mt-1 mb-4">Mantenha seus sinais vitais atualizados para que a LIZ possa antecipar riscos e cuidar de você.</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2.5 bg-[#1D3461] text-white rounded-xl text-xs font-bold active:scale-95 transition"
                        >
                            Fazer Primeiro Registro
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {vitalsList.map((item) => {
                            const date = new Date(item.recorded_at);
                            const formattedDate = date.toLocaleDateString('pt-BR');
                            const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                            const bp = getBpStatus(item.systolic_bp, item.diastolic_bp);

                            return (
                                <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-800">{formattedDate} às {formattedTime}</span>
                                        </div>
                                        {bp.alert && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                <AlertCircle className="w-3 h-3" /> Atenção PA
                                            </span>
                                        )}
                                    </div>

                                    {/* Grid of values */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {item.systolic_bp && item.diastolic_bp && (
                                            <div className="p-2 bg-slate-50 rounded-xl">
                                                <p className="text-[9px] text-slate-500 font-semibold uppercase">Pressão</p>
                                                <p className="text-xs font-bold text-slate-900">{item.systolic_bp}/{item.diastolic_bp} mmHg</p>
                                                <p className={`text-[8px] font-semibold ${bp.color}`}>{bp.label}</p>
                                            </div>
                                        )}
                                        {item.heart_rate && (
                                            <div className="p-2 bg-slate-50 rounded-xl">
                                                <p className="text-[9px] text-slate-500 font-semibold uppercase">Pulso</p>
                                                <p className="text-xs font-bold text-slate-900">{item.heart_rate} bpm</p>
                                                <p className={`text-[8px] font-semibold ${getHrStatus(item.heart_rate).color}`}>{getHrStatus(item.heart_rate).label}</p>
                                            </div>
                                        )}
                                        {item.glucose && (
                                            <div className="p-2 bg-slate-50 rounded-xl">
                                                <p className="text-[9px] text-slate-500 font-semibold uppercase">Glicemia ({item.glucose_context || 'jejum'})</p>
                                                <p className="text-xs font-bold text-slate-900">{item.glucose} mg/dL</p>
                                                <p className={`text-[8px] font-semibold ${getGlucoseStatus(item.glucose, item.glucose_context).color}`}>{getGlucoseStatus(item.glucose, item.glucose_context).label}</p>
                                            </div>
                                        )}
                                        {item.oxygen_saturation && (
                                            <div className="p-2 bg-slate-50 rounded-xl">
                                                <p className="text-[9px] text-slate-500 font-semibold uppercase">SpO2</p>
                                                <p className="text-xs font-bold text-slate-900">{item.oxygen_saturation}%</p>
                                                <p className={`text-[8px] font-semibold ${getSpo2Status(item.oxygen_saturation).color}`}>{getSpo2Status(item.oxygen_saturation).label}</p>
                                            </div>
                                        )}
                                        {item.temperature && (
                                            <div className="p-2 bg-slate-50 rounded-xl">
                                                <p className="text-[9px] text-slate-500 font-semibold uppercase">Temperatura</p>
                                                <p className="text-xs font-bold text-slate-900">{item.temperature}°C</p>
                                                <p className="text-[8px] font-semibold text-emerald-500">{item.temperature >= 37.8 ? 'Febre' : 'Normal'}</p>
                                            </div>
                                        )}
                                        {item.weight && (
                                            <div className="p-2 bg-slate-50 rounded-xl">
                                                <p className="text-[9px] text-slate-500 font-semibold uppercase">Peso</p>
                                                <p className="text-xs font-bold text-slate-900">{item.weight} kg</p>
                                            </div>
                                        )}
                                    </div>

                                    {item.notes && (
                                        <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                            📝 {item.notes}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ═══ ADD VITALS MODAL ═══ */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center" onClick={() => setShowAddModal(false)}>
                    <div className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-8 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                                    <Activity className="w-4 h-4 text-emerald-600" />
                                </div>
                                <h2 className="text-base font-bold text-slate-900">Novo Registro de Sinais Vitais</h2>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                                ✕
                            </button>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Pressão Arterial */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Pressão Arterial (Sistólica / Diastólica)</label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className={iCls}>
                                    <Heart className="w-4 h-4 text-red-400" />
                                    <input type="number" value={systolic} onChange={e => setSystolic(e.target.value)} placeholder="Ex: 120 (Máx)" className={fCls} />
                                </div>
                                <div className={iCls}>
                                    <input type="number" value={diastolic} onChange={e => setDiastolic(e.target.value)} placeholder="Ex: 80 (Mín)" className={fCls} />
                                </div>
                            </div>
                        </div>

                        {/* Frequência Cardíaca & SpO2 */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Freq. Cardíaca (BPM)</label>
                                <div className={iCls}>
                                    <Activity className="w-4 h-4 text-emerald-400" />
                                    <input type="number" value={heartRate} onChange={e => setHeartRate(e.target.value)} placeholder="Ex: 75" className={fCls} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Saturação SpO2 (%)</label>
                                <div className={iCls}>
                                    <Shield className="w-4 h-4 text-cyan-400" />
                                    <input type="number" value={spo2} onChange={e => setSpo2(e.target.value)} placeholder="Ex: 98" className={fCls} />
                                </div>
                            </div>
                        </div>

                        {/* Glicemia + Contexto */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Glicemia (mg/dL)</label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className={iCls}>
                                    <Droplets className="w-4 h-4 text-amber-500" />
                                    <input type="number" value={glucose} onChange={e => setGlucose(e.target.value)} placeholder="Ex: 95" className={fCls} />
                                </div>
                                <select
                                    value={glucoseContext}
                                    onChange={e => setGlucoseContext(e.target.value as any)}
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none font-medium"
                                >
                                    <option value="jejum">Jejum</option>
                                    <option value="pos_prandial">Após refeição</option>
                                    <option value="casual">Casual</option>
                                </select>
                            </div>
                        </div>

                        {/* Temperatura & Peso */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Temperatura (°C)</label>
                                <div className={iCls}>
                                    <Thermometer className="w-4 h-4 text-rose-400" />
                                    <input type="text" value={temperature} onChange={e => setTemperature(e.target.value)} placeholder="Ex: 36.5" className={fCls} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Peso (kg)</label>
                                <div className={iCls}>
                                    <Scale className="w-4 h-4 text-purple-400" />
                                    <input type="text" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Ex: 72.5" className={fCls} />
                                </div>
                            </div>
                        </div>

                        {/* Observações */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Observações (opcional)</label>
                            <input
                                type="text"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Ex: Medido em repouso após caminhar"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none"
                            />
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                        >
                            {saving ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando Registro...</>
                            ) : (
                                <><CheckCircle className="w-4 h-4" /> Salvar Sinais Vitais</>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
