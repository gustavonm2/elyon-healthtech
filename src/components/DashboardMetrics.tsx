import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Clock, ArrowRight, X, Users, Share2, Activity, Briefcase } from 'lucide-react';

// MOCK DATA for Dashboard
const TOTAL_OPINIONS = 142;
const PENDING_OPINIONS = 28;
const RESOLVED_OPINIONS = TOTAL_OPINIONS - PENDING_OPINIONS;

// Complementary colors (Amber/Orange) to contrast with blue
const dataTotalPending = [
    { name: 'Resolvidos', value: RESOLVED_OPINIONS, color: '#2C4E6E' },
    { name: 'Pendentes', value: PENDING_OPINIONS, color: '#E2E8F0' },
];

const RESOLUTION_RATE_DATA = [
    { name: 'Resolutivos', value: 95, color: '#6366F1' }, // Indigo-500
    { name: 'Em Avaliação ou Complemento', value: 19, color: '#E2E8F0' },
];

const RESPONSE_TIME_DATA = [
    { day: '01', time: 14 },
    { day: '02', time: 16 },
    { day: '03', time: 12 },
    { day: '04', time: 18 },
    { day: '05', time: 24 }, // pico
    { day: '06', time: 10 },
    { day: '07', time: 15 },
    { day: '08', time: 13 },
    { day: '09', time: 11 },
    { day: '10', time: 12 },
];

const MOCK_URGENT_LIST = [
    { id: 1, patient: 'Maria C. Santos', priority: 'Urgente', time: '45 min' },
    { id: 2, patient: 'João B. Pereira', priority: 'Urgente', time: '1h 20m' },
    { id: 3, patient: 'Ana Julia Souza', priority: 'Urgente', time: '2h 10m' },
];

const DashboardMetrics: React.FC = () => {
    const navigate = useNavigate();
    const [selectedList, setSelectedList] = useState<{ title: string, data: any[] } | null>(null);
    const userRole = localStorage.getItem('userRole') || 'telemedicina';

    const handlePieClick = (data: any) => {
        // Mock list based on the clicked slice
        const demoArray = Array.from({ length: 5 }).map((_, i) => ({
            id: i,
            patient: `Paciente Exemplo ${i + 1}`,
            status: data.name
        }));
        setSelectedList({
            title: `Pacientes - ${data.name}`,
            data: demoArray
        });
    };

    const handleOpenUrgent = () => {
        setSelectedList({
            title: 'Pareceres Urgentes',
            data: MOCK_URGENT_LIST
        });
    };

    return (
        <div className="w-full bg-[#F1F5F9] min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 relative">
                <h1 className="text-[12px] font-bold text-[#0F172A] mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    Dashboard de Atendimentos
                    <button
                        onClick={handleOpenUrgent}
                        className="btn-primary px-5 py-2.5 text-[12px]"
                    >
                        Ver Pareceres Urgentes <ArrowRight className="ml-2 w-4 h-4" />
                    </button>
                </h1>

                {/* Quick Actions Shortcuts */}
                <div className="mb-8">
                    <h2 className="text-[12px] font-bold text-[#64748B] capitalize mb-4">Acesso Rápido</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {userRole === 'triador' && (
                            <button onClick={() => navigate('/pacientes')} className="bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-sm hover:border-[#1D3461] hover:shadow-md transition-all flex flex-row items-center cursor-pointer group">
                                <div className="w-10 h-10 shrink-0 rounded-lg text-[#1D3461] flex items-center justify-center mr-3 bg-[#F8FAFC] group-hover:bg-[#EEF4FA] transition-colors">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col items-start overflow-hidden">
                                    <span className="font-bold text-[#0F172A] text-[12px] whitespace-nowrap">Pacientes</span>
                                    <span className="text-[12px] font-medium text-[#64748B] text-left truncate w-full">Fila de triagem e cadastros</span>
                                </div>
                            </button>
                        )}

                        {(userRole === 'parecerista' || userRole === 'telemedicina') && (
                            <button onClick={() => navigate('/pareceres')} className="bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-sm hover:border-[#1D3461] hover:shadow-md transition-all flex flex-row items-center cursor-pointer group">
                                <div className="w-10 h-10 shrink-0 rounded-lg text-[#1D3461] flex items-center justify-center mr-3 bg-[#F8FAFC] group-hover:bg-[#EEF4FA] transition-colors">
                                    <Share2 className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col items-start overflow-hidden">
                                    <span className="font-bold text-[#0F172A] text-[12px] whitespace-nowrap">Central de Pareceres</span>
                                    <span className="text-[12px] font-medium text-[#64748B] text-left truncate w-full">Fila de espera e respostas</span>
                                </div>
                            </button>
                        )}

                        <button onClick={() => navigate('/atendimentos')} className="bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-sm hover:border-[#1D3461] hover:shadow-md transition-all flex flex-row items-center cursor-pointer group">
                            <div className="w-10 h-10 shrink-0 rounded-lg text-[#1D3461] flex items-center justify-center mr-3 bg-[#F8FAFC] group-hover:bg-[#EEF4FA] transition-colors">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col items-start overflow-hidden">
                                <span className="font-bold text-[#0F172A] text-[12px] whitespace-nowrap">Meus Atendimentos</span>
                                <span className="text-[12px] font-medium text-[#64748B] text-left truncate w-full">Prontuários e agenda</span>
                            </div>
                        </button>

                        <button onClick={() => navigate('/gestao')} className="bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-sm hover:border-[#1D3461] hover:shadow-md transition-all flex flex-row items-center cursor-pointer group">
                            <div className="w-10 h-10 shrink-0 rounded-lg text-[#1D3461] flex items-center justify-center mr-3 bg-[#F8FAFC] group-hover:bg-[#EEF4FA] transition-colors">
                                <Briefcase className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col items-start overflow-hidden">
                                <span className="font-bold text-[#0F172A] text-[12px] whitespace-nowrap">Painel de Gestão</span>
                                <span className="text-[12px] font-medium text-[#64748B] text-left truncate w-full">Métricas e resolutividade</span>
                            </div>
                        </button>

                        <button onClick={() => window.open('/cadastro', '_blank')} className="bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-sm hover:border-[#1D3461] hover:shadow-md transition-all flex flex-row items-center cursor-pointer group">
                            <div className="w-10 h-10 shrink-0 rounded-lg text-[#1D3461] flex items-center justify-center mr-3 bg-[#F8FAFC] group-hover:bg-[#EEF4FA] transition-colors">
                                <Users className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col items-start overflow-hidden">
                                <span className="font-bold text-[#0F172A] text-[12px] whitespace-nowrap">Portal do Paciente</span>
                                <span className="text-[12px] font-medium text-[#64748B] text-left truncate w-full">Simular entrada externa</span>
                            </div>
                        </button>
                    </div>
                </div>

                <h2 className="text-[12px] font-bold text-[#64748B] capitalize mb-4">Visão Geral</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Chart 1: Total vs Pendentes */}
                    <div className="bg-white p-4 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#E2E8F0] flex flex-col items-center">
                        <h2 className="text-[12px] font-bold tracking-widest text-[#64748B] capitalize mb-2 w-full text-center">Volume Total</h2>
                        <div className="h-36 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={dataTotalPending}
                                        innerRadius={45}
                                        outerRadius={65}
                                        paddingAngle={3}
                                        dataKey="value"
                                        onClick={(e) => handlePieClick(e)}
                                        className="cursor-pointer focus:outline-none"
                                        stroke="#fff"
                                        strokeWidth={3}
                                    >
                                        {dataTotalPending.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        formatter={(value: any, name: any) => [value, name]}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '13px', fontWeight: 600, color: '#0F172A' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-5 mt-4 text-[12px] font-medium text-[#475569]">
                            <div className="flex items-center"><span className="w-3 h-3 bg-[#2C4E6E] rounded mr-2"></span> Resolvidos</div>
                            <div className="flex items-center"><span className="w-3 h-3 bg-[#E2E8F0] rounded border border-[#CBD5E1] mr-2"></span> Pendentes</div>
                        </div>
                        <p className="text-[12px] text-[#94A3B8] font-medium mt-3 text-center">Clique no gráfico para ver pacientes</p>
                    </div>

                    {/* Chart 2: Taxa de Resolutividade */}
                    <div className="bg-white p-4 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#E2E8F0] flex flex-col items-center">
                        <h2 className="text-[12px] font-bold tracking-widest text-[#64748B] capitalize mb-2 w-full text-center">Resolutividade</h2>
                        <div className="h-36 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={RESOLUTION_RATE_DATA}
                                        innerRadius={45}
                                        outerRadius={65}
                                        paddingAngle={3}
                                        dataKey="value"
                                        onClick={(e) => handlePieClick(e)}
                                        className="cursor-pointer focus:outline-none"
                                        stroke="#fff"
                                        strokeWidth={3}
                                    >
                                        {RESOLUTION_RATE_DATA.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        formatter={(value: any, name: any) => [value, name]}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '13px', fontWeight: 600, color: '#0F172A' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-5 mt-4 text-[12px] font-medium text-[#475569]">
                            <div className="flex items-center"><span className="w-3 h-3 bg-[#6366F1] rounded mr-2"></span> Resolutivos</div>
                            <div className="flex items-center"><span className="w-3 h-3 bg-[#E2E8F0] rounded border border-[#CBD5E1] mr-2"></span> Avaliação</div>
                        </div>
                    </div>

                    {/* Chart 3: Tempo de Resposta (Area Chart smooth, thin line, days on x-axis) */}
                    <div className="bg-white p-4 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#E2E8F0] lg:col-span-1 md:col-span-2 flex flex-col items-center">
                        <h2 className="text-[12px] font-bold tracking-widest text-[#64748B] capitalize mb-2 w-full text-center">Tempo Médio de Resposta (h)</h2>
                        <div className="h-40 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={RESPONSE_TIME_DATA} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} dx={-10} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: '13px', fontWeight: 600, color: '#0F172A' }}
                                        cursor={{ stroke: '#E2E8F0', strokeWidth: 2 }}
                                    />
                                    <Area
                                        type="linear"
                                        dataKey="time"
                                        stroke="#0EA5E9"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorTime)"
                                        dot={false}
                                        activeDot={{ r: 6, fill: '#0284C7', strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex items-center justify-center mt-5 text-[12px] font-bold text-[#94A3B8]">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            ÚLTIMOS 10 DIAS
                        </div>
                    </div>
                </div>

                {/* Modal de Lista Padronizado com Tabela */}
                {selectedList && (
                    <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-[12px] shadow-[0_16px_40px_rgba(0,0,0,0.1)] max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                            <div className="px-6 py-5 border-b border-[#E2E8F0] flex justify-between items-center bg-white sticky top-0 z-10">
                                <h3 className="font-bold text-[18px] text-[#0F172A]">{selectedList.title}</h3>
                                <button onClick={() => setSelectedList(null)} className="p-2 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="overflow-y-auto flex-1 p-0">
                                <table className="table-container">
                                    <thead className="sticky top-0 z-0 bg-[#F8FAFC]">
                                        <tr>
                                            <th className="table-title text-[11px] whitespace-nowrap">Paciente</th>
                                            <th className="table-title text-[11px] text-right whitespace-nowrap">Status / Prioridade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedList.data.map((item, idx) => (
                                            <tr key={idx} className="table-row-hover">
                                                <td className="table-text text-[11px] font-bold">{item.patient}</td>
                                                <td className="table-text text-right">
                                                    {item.priority ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold bg-[#FEF2F2] text-[#C0392B] border border-[#FECACA] capitalize">
                                                            {item.priority} - {item.time}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold bg-[#EEF4FA] text-[#1D3461] border border-[#A8C4DA] capitalize">
                                                            {item.status}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {selectedList.data.length === 0 && (
                                    <div className="p-12 text-center flex flex-col items-center">
                                        <div className="w-12 h-12 bg-[#F1F5F9] rounded-full flex items-center justify-center mb-3">
                                            <Clock className="w-6 h-6 text-[#94A3B8]" />
                                        </div>
                                        <p className="text-[12px] font-medium text-[#64748B]">Nenhum paciente encontrado para esta categoria.</p>
                                    </div>
                                )}
                            </div>
                            <div className="px-6 py-4 bg-white border-t border-[#E2E8F0] flex justify-end sticky bottom-0">
                                <button
                                    onClick={() => setSelectedList(null)}
                                    className="btn-secondary px-5 py-2.5 text-[11px]"
                                >
                                    Fechar Lista
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardMetrics;
