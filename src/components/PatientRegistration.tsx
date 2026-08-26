import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, MapPin, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import {
    fetchAddressByCep,
    fetchStates,
    fetchCitiesByState,
    type BrazilState,
    type BrazilCity,
} from '../services/brazilGeoService';

const PatientRegistration: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    // Form State
    const [formData, setFormData] = useState({
        // Step 1: Identificação
        name: '',
        birthDate: '',
        age: '',
        gender: '',
        cpf: '',
        cns: '',
        motherName: '',
        mobilePhone: '',
        altPhone: '',
        // Step 2: Endereço
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        state: '',
        city: '',
        // Step 3: Senha
        password: '',
        confirmPassword: '',
    });

    // ── IBGE State & Cities ──────────────────────────────────────────────────
    const [allStates, setAllStates] = useState<BrazilState[]>([]);
    const [availableCities, setAvailableCities] = useState<BrazilCity[]>([]);
    const [loadingStates, setLoadingStates] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    // ── CEP lookup ───────────────────────────────────────────────────────────
    const [loadingCep, setLoadingCep] = useState(false);
    const [cepError, setCepError] = useState('');

    // Ref to avoid double-fetching states on StrictMode
    const statesFetched = useRef(false);

    // ── Fetch states once on mount ───────────────────────────────────────────
    useEffect(() => {
        if (statesFetched.current) return;
        statesFetched.current = true;
        setLoadingStates(true);
        fetchStates()
            .then(data => setAllStates(data))
            .finally(() => setLoadingStates(false));
    }, []);

    // ── Calculate age dynamically ────────────────────────────────────────────
    useEffect(() => {
        if (formData.birthDate) {
            const birth = new Date(formData.birthDate);
            const today = new Date();
            let calculatedAge = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) calculatedAge--;
            if (calculatedAge >= 0) {
                setFormData(prev => ({ ...prev, age: calculatedAge.toString() }));
            }
        } else {
            setFormData(prev => ({ ...prev, age: '' }));
        }
    }, [formData.birthDate]);

    // ── Fetch cities when state changes ──────────────────────────────────────
    useEffect(() => {
        if (!formData.state) {
            setAvailableCities([]);
            return;
        }
        setLoadingCities(true);
        setFormData(prev => ({ ...prev, city: '' }));
        fetchCitiesByState(formData.state)
            .then(data => setAvailableCities(data))
            .finally(() => setLoadingCities(false));
    }, [formData.state]);

    // ── Generic input handler ────────────────────────────────────────────────
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // ── CEP lookup handler ───────────────────────────────────────────────────
    const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        // Format: 00000-000
        const digits = raw.replace(/\D/g, '').slice(0, 8);
        const formatted = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
        setFormData(prev => ({ ...prev, cep: formatted }));
        setCepError('');

        if (digits.length === 8) {
            setLoadingCep(true);
            const result = await fetchAddressByCep(digits);
            setLoadingCep(false);

            if (!result) {
                setCepError('CEP não encontrado. Verifique e preencha o endereço manualmente.');
                return;
            }

            // Pre-fill address fields
            setFormData(prev => ({
                ...prev,
                street: result.logradouro || prev.street,
                neighborhood: result.bairro || prev.neighborhood,
                state: result.uf || prev.state,
                // city will be filled after IBGE cities load
            }));

            // Fetch cities for the state returned by ViaCEP, then set city
            if (result.uf) {
                setLoadingCities(true);
                const cities = await fetchCitiesByState(result.uf);
                setLoadingCities(false);
                setAvailableCities(cities);
                const matchedCity = cities.find(
                    c => c.nome.toLowerCase() === result.localidade.toLowerCase()
                );
                setFormData(prev => ({
                    ...prev,
                    city: matchedCity ? matchedCity.nome : '',
                }));
            }
        }
    };

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(prev => prev + 1);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert('As senhas informadas não coincidem. Por favor, verifique.');
            return;
        }
        localStorage.setItem('userRole', 'paciente');
        navigate('/portal-paciente');
    };

    const getProgressWidth = () => `${((step - 1) / 2) * 100}%`;

    // ── Input class helper ───────────────────────────────────────────────────
    const inputCls =
        'w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[14px] focus:ring-2 focus:ring-[#1D3461] transition-all';
    const inputReadonlyCls =
        'w-full px-4 py-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-[14px] font-bold text-[#64748B] cursor-not-allowed';

    return (
        <div className="min-h-screen bg-[#F1F5F9] flex flex-col font-sans">
            {/* Simple Header */}
            <div className="bg-white px-6 xl:px-8 py-5 flex items-center shadow-sm relative z-10 border-b border-[#E2E8F0]">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#1D3461] rounded-lg flex items-center justify-center text-white mr-3 shadow-sm">
                        <span className="font-black text-xl tracking-tighter">P</span>
                    </div>
                    <span className="font-bold text-[18px] tracking-tight text-[#0F172A]">Clínica Pareceres</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
                <div className="w-full max-w-[800px]">

                    {/* Progress Bar */}
                    <div className="mb-8 animate-in fade-in duration-500">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-[#64748B] capitalize">
                                {step === 1 && 'Etapa 1: Identificação'}
                                {step === 2 && 'Etapa 2: Endereço'}
                                {step === 3 && 'Etapa 3: Senha de Acesso'}
                            </span>
                            <span className="text-[12px] font-black text-[#1D3461]">{step} de 3</span>
                        </div>
                        <div className="w-full bg-[#E2E8F0] rounded-full h-2.5 overflow-hidden">
                            <div
                                className="bg-[#1D3461] h-2.5 rounded-full transition-all duration-500 ease-out"
                                style={{ width: getProgressWidth() }}
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden border border-[#E2E8F0]">

                        {/* ── STEP 1: IDENTIFICATION ──────────────────────────── */}
                        {step === 1 && (
                            <div className="p-8 sm:p-10 animate-in slide-in-from-right-8 duration-300">
                                <div className="mb-8">
                                    <h1 className="text-[24px] sm:text-[28px] font-black text-[#0F172A] tracking-tight mb-2 flex items-center">
                                        <User className="w-7 h-7 mr-3 text-[#1D3461]" />
                                        Ficha de Identificação
                                    </h1>
                                    <p className="text-[14px] font-medium text-[#64748B]">Preencha seus dados básicos para criar seu prontuário no sistema.</p>
                                </div>

                                <form onSubmit={handleNextStep} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                        <div className="md:col-span-12 space-y-2">
                                            <label className="text-[11px] font-bold text-[#475569] capitalize">Nome Completo *</label>
                                            <input required name="name" value={formData.name} onChange={handleInputChange} type="text" className={inputCls} placeholder="Nome sem abreviações" />
                                        </div>

                                        <div className="md:col-span-4 space-y-2">
                                            <label className="text-[11px] font-bold text-[#475569] capitalize">Data de Nasc. *</label>
                                            <input required name="birthDate" value={formData.birthDate} onChange={handleInputChange} type="date" className={inputCls} />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[11px] font-bold text-[#475569] capitalize">Idade</label>
                                            <input disabled name="age" value={formData.age} type="text" className={inputReadonlyCls} placeholder="-" />
                                        </div>
                                        <div className="md:col-span-6 space-y-2">
                                            <label className="text-[11px] font-bold text-[#475569] capitalize">Sexo biológico *</label>
                                            <select required name="gender" value={formData.gender} onChange={handleInputChange} className={inputCls + ' text-[#0F172A]'}>
                                                <option value="" disabled>Selecione</option>
                                                <option value="M">Masculino</option>
                                                <option value="F">Feminino</option>
                                            </select>
                                        </div>

                                        <div className="md:col-span-6 space-y-2">
                                            <label className="text-[11px] font-bold text-[#475569] capitalize">CPF *</label>
                                            <input required name="cpf" value={formData.cpf} onChange={handleInputChange} type="text" className={inputCls} placeholder="000.000.000-00" />
                                        </div>
                                        <div className="md:col-span-6 space-y-2">
                                            <label className="text-[11px] font-bold text-[#475569] capitalize">CNS (Cartão SUS)</label>
                                            <input name="cns" value={formData.cns} onChange={handleInputChange} type="text" className={inputCls} placeholder="Opcional" />
                                        </div>

                                        <div className="md:col-span-12 space-y-2">
                                            <label className="text-[11px] font-bold text-[#475569] capitalize">Nome da Mãe *</label>
                                            <input required name="motherName" value={formData.motherName} onChange={handleInputChange} type="text" className={inputCls} placeholder="Nome completo da mãe" />
                                        </div>

                                        <div className="md:col-span-6 space-y-2 relative">
                                            <label className="text-[11px] font-bold text-[#475569] capitalize">Telefone Celular *</label>
                                            <input required name="mobilePhone" value={formData.mobilePhone} onChange={handleInputChange} type="tel" className={inputCls} placeholder="(00) 00000-0000" />
                                            <p className="text-[11px] font-bold text-[#10B981] mt-1 flex items-center">
                                                <CheckCircle className="w-3 h-3 mr-1" /> WhatsApp principal
                                            </p>
                                        </div>
                                        <div className="md:col-span-6 space-y-2 flex flex-col justify-start">
                                            <label className="text-[11px] font-bold text-[#475569] capitalize">Telefone Alternativo / E-mail</label>
                                            <input name="altPhone" value={formData.altPhone} onChange={handleInputChange} type="text" className={inputCls} placeholder="Outro contato" />
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-[#F1F5F9] flex justify-end">
                                        <button type="submit" className="px-8 py-3.5 bg-[#1D3461] hover:bg-[#162749] text-white rounded-xl text-[14px] font-bold transition-all shadow-md flex items-center group">
                                            Próxima Etapa
                                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* ── STEP 2: ADDRESS ─────────────────────────────────── */}
                        {step === 2 && (
                            <div className="p-8 sm:p-10 animate-in slide-in-from-right-8 duration-300">
                                <div className="mb-8">
                                    <h1 className="text-[24px] sm:text-[28px] font-black text-[#0F172A] tracking-tight mb-2 flex items-center">
                                        <MapPin className="w-7 h-7 mr-3 text-[#1D3461]" />
                                        Endereço de Residência
                                    </h1>
                                    <p className="text-[14px] font-medium text-[#64748B]">
                                        Digite o CEP para preencher o endereço automaticamente.
                                    </p>
                                </div>

                                <form onSubmit={handleNextStep} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

                                        {/* CEP field with loading indicator */}
                                        <div className="md:col-span-4 space-y-2">
                                            <label className="text-[11px] font-bold text-[#475569] capitalize">CEP *</label>
                                            <div className="relative">
                                                <input
                                                    required
                                                    name="cep"
                                                    value={formData.cep}
                                                    onChange={handleCepChange}
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={9}
                                                    className={inputCls + (cepError ? ' border-red-400 focus:ring-red-400' : '')}
                                                    placeholder="00000-000"
                                                />
                                                {loadingCep && (
                                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1D3461] animate-spin" />
                                                )}
                                            </div>
                                            {cepError && (
                                                <p className="flex items-start gap-1 text-[11px] font-medium text-red-500 mt-1">
                                                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                                    {cepError}
                                                </p>
                                            )}
                                            {!cepError && !loadingCep && formData.street && (
                                                <p className="flex items-center gap-1 text-[11px] font-bold text-[#10B981] mt-1">
                                                    <CheckCircle className="w-3 h-3" /> Endereço encontrado!
                                                </p>
                                            )}
                                        </div>

                                        <div className="md:col-span-8" /> {/* spacer */}

                                        <div className="md:col-span-9 space-y-2">
                                            <label className="text-[11px] font-bold text-[#475569] capitalize">Logradouro (Rua, Av.) *</label>
                                            <input
                                                required
                                                name="street"
                                                value={formData.street}
                                                onChange={handleInputChange}
                                                type="text"
                                                className={inputCls}
                                                placeholder="Ex: Av. Brasil"
                                            />
                                        </div>
                                        <div className="md:col-span-3 space-y-2">
                                            <label className="text-[11px] font-bold text-[#475569] capitalize">Número *</label>
                                            <input
                                                required
                                                name="number"
                                                value={formData.number}
                                                onChange={handleInputChange}
                                                type="text"
                                                className={inputCls}
                                                placeholder="123"
                                            />
                                        </div>

                                        <div className="md:col-span-6 space-y-2">
                                            <label className="text-[11px] font-bold text-[#475569] capitalize">Complemento</label>
                                            <input
                                                name="complement"
                                                value={formData.complement}
                                                onChange={handleInputChange}
                                                type="text"
                                                className={inputCls}
                                                placeholder="Apto, Bloco (Opcional)"
                                            />
                                        </div>
                                        <div className="md:col-span-6 space-y-2">
                                            <label className="text-[11px] font-bold text-[#475569] capitalize">Bairro *</label>
                                            <input
                                                required
                                                name="neighborhood"
                                                value={formData.neighborhood}
                                                onChange={handleInputChange}
                                                type="text"
                                                className={inputCls}
                                                placeholder="Seu bairro"
                                            />
                                        </div>

                                        {/* Estado — loaded from IBGE */}
                                        <div className="md:col-span-5 space-y-2">
                                            <label className="text-[11px] font-bold text-[#475569] capitalize">Estado (UF) *</label>
                                            <div className="relative">
                                                <select
                                                    required
                                                    name="state"
                                                    value={formData.state}
                                                    onChange={handleInputChange}
                                                    disabled={loadingStates}
                                                    className={inputCls + ' text-[#0F172A] disabled:opacity-60 disabled:cursor-not-allowed pr-8'}
                                                >
                                                    <option value="" disabled>
                                                        {loadingStates ? 'Carregando estados...' : 'Selecione'}
                                                    </option>
                                                    {allStates.map(st => (
                                                        <option key={st.sigla} value={st.sigla}>
                                                            {st.nome}
                                                        </option>
                                                    ))}
                                                </select>
                                                {loadingStates && (
                                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1D3461] animate-spin pointer-events-none" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Cidade — loaded from IBGE based on state */}
                                        <div className="md:col-span-7 space-y-2">
                                            <label className="text-[11px] font-bold text-[#475569] capitalize">Município *</label>
                                            <div className="relative">
                                                <select
                                                    required
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleInputChange}
                                                    disabled={!formData.state || loadingCities}
                                                    className={inputCls + ' text-[#0F172A] disabled:opacity-50 disabled:cursor-not-allowed pr-8'}
                                                >
                                                    <option value="" disabled>
                                                        {loadingCities
                                                            ? 'Carregando municípios...'
                                                            : formData.state
                                                                ? 'Selecione o Município'
                                                                : 'Escolha o Estado 1º'}
                                                    </option>
                                                    {availableCities.map(city => (
                                                        <option key={city.id} value={city.nome}>
                                                            {city.nome}
                                                        </option>
                                                    ))}
                                                </select>
                                                {loadingCities && (
                                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1D3461] animate-spin pointer-events-none" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-[#F1F5F9] flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="px-6 py-3.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569] rounded-xl text-[14px] font-bold transition-all shadow-sm flex items-center"
                                        >
                                            Voltar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-8 py-3.5 bg-[#1D3461] hover:bg-[#162749] text-white rounded-xl text-[14px] font-bold transition-all shadow-md flex items-center group"
                                        >
                                            Próxima Etapa
                                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* ── STEP 3: PASSWORD ─────────────────────────────────── */}
                        {step === 3 && (
                            <div className="p-8 sm:p-10 animate-in slide-in-from-right-8 duration-300">
                                <div className="mb-8">
                                    <h1 className="text-[24px] sm:text-[28px] font-black text-[#0F172A] tracking-tight mb-2 flex items-center">
                                        <Lock className="w-7 h-7 mr-3 text-[#1D3461]" />
                                        Credenciais de Acesso
                                    </h1>
                                    <p className="text-[14px] font-medium text-[#64748B]">Crie uma senha segura para acessar o Portal do Paciente posteriormente.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="bg-[#EEF4FA] border border-[#A8C4DA] rounded-2xl p-6 mb-8 flex items-start">
                                        <div className="bg-white p-2 rounded-lg shadow-sm mr-4 shrink-0">
                                            <User className="w-6 h-6 text-[#1D3461]" />
                                        </div>
                                        <div>
                                            <h3 className="text-[13px] font-bold text-[#1E3A8A] capitalize mb-1">Seu Login será o CPF</h3>
                                            <p className="text-[14px] font-medium text-[#1D3461]">
                                                {formData.cpf || 'O CPF informado na Etapa 1'} será utilizado como seu usuário padrão para retornar à plataforma.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-[#475569] capitalize">Crie uma Senha *</label>
                                            <input
                                                required
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                type="password"
                                                minLength={6}
                                                className={inputCls + ' text-[#0F172A]'}
                                                placeholder="Mínimo de 6 caracteres"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-[#475569] capitalize">Confirme a Senha *</label>
                                            <input
                                                required
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                type="password"
                                                minLength={6}
                                                className={inputCls + ' text-[#0F172A]'}
                                                placeholder="Repita a senha"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-[#F1F5F9] flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setStep(2)}
                                            className="px-6 py-3.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569] rounded-xl text-[14px] font-bold transition-all shadow-sm flex items-center"
                                        >
                                            Voltar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-8 py-3.5 bg-[#1D3461] hover:bg-[#162749] text-white rounded-xl text-[14px] font-bold transition-all shadow-md flex items-center group"
                                        >
                                            Concluir Cadastro
                                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    <p className="text-center mt-8 text-[12px] font-medium text-[#94A3B8]">
                        Seus dados são criptografados e tratados conforme a Lei Geral de Proteção de Dados (LGPD).
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PatientRegistration;
