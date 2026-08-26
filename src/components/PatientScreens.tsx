import React, { useState } from 'react';
import {
    ArrowLeft, ArrowRight, Pill, CheckCircle, AlertCircle, Plus,
    Loader2, Stethoscope, Sparkles, X as XIcon, Trash2, ToggleLeft, ToggleRight,
    ClipboardList, Brain, Dumbbell, Moon, Heart, Coffee, Cigarette, Wine, HeartPulse, Siren
} from 'lucide-react';
import {
    addMedication, toggleMedication, deleteMedication, upsertHealthProfile,
    type Medication, type HealthProfile
} from '../services/patientService';

// ══════════════════════════════════════════════════════════════════════════════════
//  SCREEN: PRESCRIÇÕES (Medications CRUD)
// ══════════════════════════════════════════════════════════════════════════════════
export const PrescricoesScreenLive: React.FC<{
    navigateTo: (s: string) => void;
    medications: Medication[]; setMedications: React.Dispatch<React.SetStateAction<Medication[]>>;
    patientId: string | null;
    mockPrescriptions: { id: string; med: string; dosage: string; doctor: string; date: string; active: boolean }[];
}> = ({ navigateTo, medications, setMedications, patientId, mockPrescriptions }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [medName, setMedName] = useState('');
    const [medDosage, setMedDosage] = useState('');
    const [medFrequency, setMedFrequency] = useState('');
    const [medDoctor, setMedDoctor] = useState('');
    const [medNotes, setMedNotes] = useState('');
    const [addError, setAddError] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = async () => {
        if (!patientId) { setAddError('Faça login para adicionar.'); return; }
        if (!medName.trim()) { setAddError('Nome do medicamento é obrigatório.'); return; }
        if (!medDosage.trim()) { setAddError('Dosagem é obrigatória.'); return; }
        if (!medFrequency.trim()) { setAddError('Frequência é obrigatória.'); return; }
        setIsAdding(true); setAddError('');
        const { data, error } = await addMedication({
            patient_id: patientId, medication_name: medName.trim(), dosage: medDosage.trim(),
            frequency: medFrequency.trim(), prescribing_doctor: medDoctor.trim() || null, notes: medNotes.trim() || null,
        });
        setIsAdding(false);
        if (error) { setAddError(error); return; }
        if (data) {
            setMedications(prev => [data, ...prev]);
            setShowAddModal(false);
            setMedName(''); setMedDosage(''); setMedFrequency(''); setMedDoctor(''); setMedNotes('');
        }
    };

    const handleToggle = async (id: string, active: boolean) => {
        const ok = await toggleMedication(id, !active);
        if (ok) setMedications(prev => prev.map(m => m.id === id ? { ...m, active: !active } : m));
    };

    const handleDelete = async (id: string) => {
        const ok = await deleteMedication(id);
        if (ok) setMedications(prev => prev.filter(m => m.id !== id));
    };

    const activeMeds = medications.filter(m => m.active);
    const inactiveMeds = medications.filter(m => !m.active);
    const hasMeds = medications.length > 0;
    const iCls = "flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-[#1D3461] focus-within:ring-1 focus-within:ring-[#1D3461]/20 transition-all";
    const fCls = "flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none font-medium";

    return (
        <div className="px-5 pt-12 pb-4">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigateTo('home')} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition"><ArrowLeft className="w-5 h-5 text-slate-800" /></button>
                    <h1 className="text-lg font-bold text-slate-900">Minhas Prescrições</h1>
                </div>
                <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-[#1D3461] text-white rounded-xl text-xs font-bold active:scale-95 transition">
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
            </div>

            {hasMeds ? (
                <>
                    {activeMeds.length > 0 && (
                        <>
                            <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Ativas ({activeMeds.length})</h2>
                            <div className="space-y-3 mb-6">
                                {activeMeds.map((rx) => (
                                    <div key={rx.id} className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Pill className="w-5 h-5 text-emerald-600" /></div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-900">{rx.medication_name}</p>
                                                <p className="text-xs text-slate-500">{rx.dosage} · {rx.frequency}</p>
                                                {rx.prescribing_doctor && <p className="text-[10px] text-slate-400 mt-0.5">{rx.prescribing_doctor}</p>}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleToggle(rx.id, rx.active)} className="p-1.5 rounded-lg hover:bg-slate-100"><ToggleRight className="w-4 h-4 text-emerald-500" /></button>
                                                <button onClick={() => handleDelete(rx.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-400" /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                    {inactiveMeds.length > 0 && (
                        <>
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Encerradas ({inactiveMeds.length})</h2>
                            <div className="space-y-2.5">
                                {inactiveMeds.map((rx) => (
                                    <div key={rx.id} className="bg-slate-50 rounded-2xl border border-slate-100 p-4 opacity-60">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-slate-600">{rx.medication_name}</p>
                                                <p className="text-xs text-slate-400">{rx.dosage} · {rx.frequency}</p>
                                            </div>
                                            <button onClick={() => handleToggle(rx.id, rx.active)} className="p-1.5 rounded-lg hover:bg-slate-200"><ToggleLeft className="w-4 h-4 text-slate-400" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </>
            ) : (
                <>
                    <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Ativas</h2>
                    <div className="space-y-3 mb-6">
                        {mockPrescriptions.filter(p => p.active).map(rx => (
                            <div key={rx.id} className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Pill className="w-5 h-5 text-emerald-600" /></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-900">{rx.med}</p>
                                        <p className="text-xs text-slate-500">{rx.dosage}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">{rx.doctor} · {rx.date}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400 text-center italic mb-4">Acima: dados de exemplo. Adicione seus medicamentos reais.</p>
                </>
            )}

            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center" onClick={() => setShowAddModal(false)}>
                    <div className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-8 space-y-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-base font-bold text-slate-900">Adicionar Medicação</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><XIcon className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        {addError && <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600"><AlertCircle className="w-3.5 h-3.5" />{addError}</div>}
                        <div><label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Nome do Medicamento *</label><div className={iCls}><Pill className="w-4 h-4 text-slate-400" /><input type="text" value={medName} onChange={e => setMedName(e.target.value)} placeholder="Ex: Losartana 50mg" className={fCls} /></div></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Dosagem *</label><div className={iCls}><input type="text" value={medDosage} onChange={e => setMedDosage(e.target.value)} placeholder="1 comp/dia" className={fCls} /></div></div>
                            <div><label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Frequência *</label><div className={iCls}><input type="text" value={medFrequency} onChange={e => setMedFrequency(e.target.value)} placeholder="Manhã" className={fCls} /></div></div>
                        </div>
                        <div><label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Médico Prescritor</label><div className={iCls}><Stethoscope className="w-4 h-4 text-slate-400" /><input type="text" value={medDoctor} onChange={e => setMedDoctor(e.target.value)} placeholder="Dr. Nome" className={fCls} /></div></div>
                        <div><label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Observações</label><div className={iCls}><input type="text" value={medNotes} onChange={e => setMedNotes(e.target.value)} placeholder="Tomar com água" className={fCls} /></div></div>
                        <button onClick={handleAdd} disabled={isAdding}
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2">
                            {isAdding ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : <><Plus className="w-4 h-4" />Adicionar Medicação</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════════
//  SCREEN: TRIAGEM DE SAÚDE (Health Triage with LIZ)
// ══════════════════════════════════════════════════════════════════════════════════
export const TriagemSaudeScreen: React.FC<{
    navigateTo: (s: string) => void; patientId: string; patientName: string; apiKey: string;
    healthProfile: HealthProfile | null; setHealthProfile: React.Dispatch<React.SetStateAction<HealthProfile | null>>;
}> = ({ navigateTo, patientId, patientName, apiKey, healthProfile, setHealthProfile }) => {
    const [step, setStep] = useState(healthProfile?.triage_completed ? 6 : 1);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzeError, setAnalyzeError] = useState('');

    const [dailyRoutine, setDailyRoutine] = useState(healthProfile?.daily_routine || '');
    const [exercise, setExercise] = useState(healthProfile?.exercise_frequency || '');
    const [sleepHours, setSleepHours] = useState(healthProfile?.sleep_hours || '');
    const [diet, setDiet] = useState(healthProfile?.diet_description || '');
    const [pastDiseases, setPastDiseases] = useState(healthProfile?.past_diseases?.join(', ') || '');
    const [surgeries, setSurgeries] = useState(healthProfile?.surgeries?.join(', ') || '');
    const [familyHistory, setFamilyHistory] = useState(healthProfile?.family_history?.join(', ') || '');
    const [hospitalizations, setHospitalizations] = useState(healthProfile?.hospitalizations || '');
    const [smoking, setSmoking] = useState(healthProfile?.smoking || 'não');
    const [alcohol, setAlcohol] = useState(healthProfile?.alcohol || 'não');
    const [stressLevel, setStressLevel] = useState(healthProfile?.stress_level || '');
    const [mentalHealth, setMentalHealth] = useState(healthProfile?.mental_health_notes || '');

    const iCls = "flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-[#1D3461] focus-within:ring-1 focus-within:ring-[#1D3461]/20 transition-all";
    const fCls = "flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none font-medium";
    const taCls = "w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none resize-none focus:border-[#1D3461] focus:ring-1 focus:ring-[#1D3461]/20 transition-all";

    const stepLabels = ['Rotina', 'Exercícios', 'Alimentação', 'Histórico', 'Hábitos'];

    const chipBtn = (label: string, selected: boolean, onClick: () => void) => (
        <button key={label} onClick={onClick}
            className={`px-3 py-2 rounded-full text-xs font-semibold border transition ${selected ? 'bg-[#1D3461] text-white border-[#1D3461]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#1D3461]'}`}>{label}</button>
    );

    const runLizAnalysis = async () => {
        setIsAnalyzing(true); setAnalyzeError('');
        const profileData = {
            daily_routine: dailyRoutine || null, exercise_frequency: exercise || null,
            sleep_hours: sleepHours || null, diet_description: diet || null,
            past_diseases: pastDiseases ? pastDiseases.split(',').map(s => s.trim()).filter(Boolean) : [],
            surgeries: surgeries ? surgeries.split(',').map(s => s.trim()).filter(Boolean) : [],
            family_history: familyHistory ? familyHistory.split(',').map(s => s.trim()).filter(Boolean) : [],
            hospitalizations: hospitalizations || null,
            smoking, alcohol, stress_level: stressLevel || null, mental_health_notes: mentalHealth || null,
        };

        try {
            const analysisPrompt = `Você é a LIZ, coordenadora de cuidado do ELYON HealthTech. O paciente ${patientName} acabou de fazer sua triagem de saúde. Analise os dados abaixo e gere uma análise completa.

DADOS DA TRIAGEM:
${JSON.stringify(profileData, null, 2)}

Responda EXATAMENTE neste formato JSON (sem markdown, sem code blocks, apenas o JSON puro):
{
  "summary": "Um resumo de 2-3 frases do perfil de saúde do paciente, humanizado e acolhedor",
  "risk_factors": ["fator de risco 1", "fator de risco 2"],
  "recommendations": ["recomendação 1", "recomendação 2", "recomendação 3"]
}

Se não houver riscos, use um array vazio. Sempre gere pelo menos 2 recomendações de saúde preventiva.`;

            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: analysisPrompt }] }],
                        generationConfig: { responseMimeType: 'application/json' },
                    }),
                }
            );

            if (!res.ok) throw new Error('Erro na API');
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const analysis = JSON.parse(text);

            const fullProfile = {
                ...profileData,
                liz_health_summary: analysis.summary || 'Perfil analisado com sucesso.',
                liz_risk_factors: analysis.risk_factors || [],
                liz_recommendations: analysis.recommendations || [],
                triage_completed: true,
                triage_completed_at: new Date().toISOString(),
            };

            const { data: saved } = await upsertHealthProfile(patientId, fullProfile);
            if (saved) setHealthProfile(saved);
            setStep(6);
        } catch {
            setAnalyzeError('Não foi possível analisar. Verifique a API Key e tente novamente.');
        }
        setIsAnalyzing(false);
    };

    // Step 6 = Results view
    if (step === 6 && healthProfile?.triage_completed) {
        return (
            <div className="px-5 pt-12 pb-4">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => navigateTo('home')} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition"><ArrowLeft className="w-5 h-5 text-slate-800" /></button>
                    <h1 className="text-lg font-bold text-slate-900">Perfil de Saúde</h1>
                </div>

                <div className="bg-gradient-to-br from-[#1D3461] to-[#0F172A] rounded-2xl p-5 mb-4 text-white">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center"><Brain className="w-4 h-4 text-emerald-300" /></div>
                        <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Análise LIZ</span>
                    </div>
                    <p className="text-sm leading-relaxed text-white/90">{healthProfile.liz_health_summary}</p>
                </div>

                {healthProfile.liz_risk_factors.length > 0 && (
                    <div className="mb-4">
                        <h2 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Siren className="w-3.5 h-3.5" /> Fatores de Risco</h2>
                        <div className="space-y-2">
                            {healthProfile.liz_risk_factors.map((rf, i) => (
                                <div key={i} className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700">
                                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /><span>{rf}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {healthProfile.liz_recommendations.length > 0 && (
                    <div className="mb-4">
                        <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> Recomendações</h2>
                        <div className="space-y-2">
                            {healthProfile.liz_recommendations.map((rec, i) => (
                                <div key={i} className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700">
                                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /><span>{rec}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-2 mt-4">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dados Coletados</h2>
                    {[
                        { icon: Moon, label: 'Sono', value: healthProfile.sleep_hours },
                        { icon: Dumbbell, label: 'Exercícios', value: healthProfile.exercise_frequency },
                        { icon: Cigarette, label: 'Tabagismo', value: healthProfile.smoking },
                        { icon: Wine, label: 'Álcool', value: healthProfile.alcohol },
                        { icon: HeartPulse, label: 'Estresse', value: healthProfile.stress_level },
                    ].filter(d => d.value).map(d => (
                        <div key={d.label} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <d.icon className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] text-slate-500 font-semibold w-20">{d.label}</span>
                            <span className="text-xs text-slate-800 font-medium">{d.value}</span>
                        </div>
                    ))}
                </div>

                <button onClick={() => setStep(1)} className="w-full mt-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-all active:scale-[0.98]">
                    Refazer Triagem
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="bg-gradient-to-br from-[#1D3461] to-[#0F172A] px-6 pt-12 pb-8 rounded-b-[2.5rem] shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={step > 1 ? () => setStep(step - 1) : () => navigateTo('home')} className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-white">🩺 Triagem de Saúde</h1>
                        <p className="text-[10px] text-blue-300">Etapa {step} de 5 — {stepLabels[step - 1]}</p>
                    </div>
                    <img src="/elyon-logo.jpg" alt="Elyon" className="w-10 h-10 rounded-xl" />
                </div>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? 'bg-emerald-400' : 'bg-white/10'}`} />
                    ))}
                </div>
                <p className="text-[10px] text-blue-200 mt-3 italic">💬 Conte à LIZ sobre você para que ela cuide melhor da sua saúde.</p>
            </div>

            <div className="flex-1 px-6 pt-5 pb-4 overflow-y-auto">
                {analyzeError && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 mb-4"><AlertCircle className="w-4 h-4 flex-shrink-0" />{analyzeError}</div>}

                {step === 1 && (
                    <div className="space-y-3">
                        <p className="text-sm font-bold text-slate-900 mb-1">Sua Rotina Diária</p>
                        <div><label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Como é o seu dia a dia?</label><textarea value={dailyRoutine} onChange={e => setDailyRoutine(e.target.value)} rows={3} placeholder="Ex: Acordo cedo, trabalho sentado o dia todo, chego em casa cansado..." className={taCls} /></div>
                        <div><label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Quantas horas dorme por noite?</label>
                            <div className="flex gap-2 flex-wrap">{['Menos de 5h', '5-6h', '6-7h', '7-8h', '8h+'].map(h => chipBtn(h, sleepHours === h, () => setSleepHours(h)))}</div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-3">
                        <p className="text-sm font-bold text-slate-900 mb-1">Atividade Física</p>
                        <div><label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Com que frequência se exercita?</label>
                            <div className="flex gap-2 flex-wrap">{['Nunca', '1-2x/semana', '3-4x/semana', '5x+/semana', 'Diariamente'].map(f => chipBtn(f, exercise === f, () => setExercise(f)))}</div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-3">
                        <p className="text-sm font-bold text-slate-900 mb-1">Alimentação</p>
                        <div><label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Descreva sua alimentação</label><textarea value={diet} onChange={e => setDiet(e.target.value)} rows={3} placeholder="Ex: Como bastante fast food, pouca fruta, bebo pouca água..." className={taCls} /></div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-3">
                        <p className="text-sm font-bold text-slate-900 mb-1">Histórico Médico</p>
                        <div><label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Doenças que já teve (separe por vírgula)</label><div className={iCls}><Heart className="w-4 h-4 text-slate-400" /><input type="text" value={pastDiseases} onChange={e => setPastDiseases(e.target.value)} placeholder="Ex: Dengue, Pneumonia" className={fCls} /></div></div>
                        <div><label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Cirurgias realizadas</label><div className={iCls}><Stethoscope className="w-4 h-4 text-slate-400" /><input type="text" value={surgeries} onChange={e => setSurgeries(e.target.value)} placeholder="Ex: Apendicectomia" className={fCls} /></div></div>
                        <div><label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Histórico familiar</label><div className={iCls}><HeartPulse className="w-4 h-4 text-slate-400" /><input type="text" value={familyHistory} onChange={e => setFamilyHistory(e.target.value)} placeholder="Ex: Pai diabético, mãe hipertensa" className={fCls} /></div></div>
                        <div><label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Internações hospitalares</label><div className={iCls}><Siren className="w-4 h-4 text-slate-400" /><input type="text" value={hospitalizations} onChange={e => setHospitalizations(e.target.value)} placeholder="Ex: Internado 2023 por infecção" className={fCls} /></div></div>
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-3">
                        <p className="text-sm font-bold text-slate-900 mb-1">Hábitos e Saúde Mental</p>
                        <div><label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Tabagismo</label>
                            <div className="flex gap-2 flex-wrap">{['Não', 'Sim, ocasional', 'Sim, diário', 'Ex-fumante'].map(s => chipBtn(s, smoking === s.toLowerCase(), () => setSmoking(s.toLowerCase())))}</div>
                        </div>
                        <div><label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Consumo de álcool</label>
                            <div className="flex gap-2 flex-wrap">{['Não', 'Social', 'Frequente', 'Ex-etilista'].map(a => chipBtn(a, alcohol === a.toLowerCase(), () => setAlcohol(a.toLowerCase())))}</div>
                        </div>
                        <div><label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Nível de estresse</label>
                            <div className="flex gap-2 flex-wrap">{['Baixo', 'Moderado', 'Alto', 'Muito alto'].map(l => chipBtn(l, stressLevel === l.toLowerCase(), () => setStressLevel(l.toLowerCase())))}</div>
                        </div>
                        <div><label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Saúde mental</label><textarea value={mentalHealth} onChange={e => setMentalHealth(e.target.value)} rows={2} placeholder="Conte como se sente emocionalmente..." className={taCls} /></div>
                    </div>
                )}
            </div>

            <div className="px-6 pb-6 pt-2">
                {step < 5 ? (
                    <button onClick={() => setStep(step + 1)}
                        className="w-full py-4 bg-[#1D3461] hover:bg-[#162749] text-white font-bold text-sm rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-[#1D3461]/20">
                        Próximo <ArrowRight className="w-4 h-4" />
                    </button>
                ) : (
                    <button onClick={runLizAnalysis} disabled={isAnalyzing || !apiKey.trim()}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-sm rounded-2xl transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg">
                        {isAnalyzing ? (<><Loader2 className="w-4 h-4 animate-spin" />LIZ está analisando...</>) : (<><Brain className="w-4 h-4" />LIZ, Analise Meu Perfil</>)}
                    </button>
                )}
            </div>
        </div>
    );
};
