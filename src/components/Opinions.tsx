import React, { useState, useEffect } from 'react';
import { Share2, CheckCircle, Clock, AlertCircle, FileText, Send, User, LogOut } from 'lucide-react';
import type { OpinionRequest, QueueItem } from '../types';
import { getIncomingOpinions, getOutgoingOpinions } from '../utils/opinionsData';
import { useNavigate } from 'react-router-dom';
import PatientDetails from './PatientDetails';

interface OpinionsProps {
    onPatientSelect?: (patient: QueueItem) => void;
}

const Opinions: React.FC<OpinionsProps> = ({ onPatientSelect }) => {
    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole') || 'telemedicina';
    const [incomingList, setIncomingList] = useState<OpinionRequest[]>([]);
    const [outgoingList, setOutgoingList] = useState<OpinionRequest[]>([]);
    const [selectedOpinion, setSelectedOpinion] = useState<QueueItem | null>(null);
    const [currentView, setCurrentView] = useState<'list' | 'details' | 'attendance'>('list');

    useEffect(() => {
        setIncomingList(getIncomingOpinions());
        setOutgoingList(getOutgoingOpinions());
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Respondido':
                return <span className="inline-flex items-center px-2 py-1 rounded-md border border-gray-200 text-[11px] capitalize font-bold bg-white text-gray-600"><CheckCircle className="w-3 h-3 mr-1" /> Respondido</span>;
            case 'Pendente':
                return <span className="inline-flex items-center px-2 py-1 rounded-md border border-gray-200 text-[11px] capitalize font-bold bg-white text-gray-600"><Clock className="w-3 h-3 mr-1" /> Pendente</span>;
            case 'Atrasado':
                return <span className="inline-flex items-center px-2 py-1 rounded-md border border-gray-300 text-[11px] capitalize font-bold bg-gray-50 text-gray-900"><AlertCircle className="w-3 h-3 mr-1" /> Atrasado</span>;
            default:
                return null;
        }
    };

    const handleRowClick = (item: OpinionRequest) => {
        if (userRole === 'triador') {
            alert('Paciente encaminhado para a fila de Atendimento Médico/Parecer com sucesso!');
            // Logica simulada, nao mudaria o status na central local.
            return;
        }

        const queueItem: QueueItem = {
            id: item.id,
            patientName: item.patientName,
            age: 0,
            arrivalTime: item.requestDate,
            bloodPressure: '-',
            riskRating: item.priority === 'Urgente' ? 'red' : 'green',
            type: 'Parecer',
            status: item.status === 'Respondido' ? 'finished' : 'waiting',
            waitTime: item.deadline,
            requesterName: item.doctorName,
            requestDescription: item.description
        };

        if (onPatientSelect) {
            onPatientSelect(queueItem);
        } else {
            setSelectedOpinion(queueItem);
            setCurrentView('details');
        }
    };

    const handleLogout = () => {
        navigate("/");
    };

    if (selectedOpinion && (currentView === 'details' || currentView === 'attendance')) {
        return (
            <div className="w-full h-[calc(100vh-64px)] overflow-y-auto bg-[#F8FAFC]">
                <PatientDetails
                    patientId={selectedOpinion.id}
                    initialData={selectedOpinion}
                    isAttending={currentView === 'attendance'}
                    onBack={() => {
                        setSelectedOpinion(null);
                        setCurrentView('list');
                        setIncomingList(getIncomingOpinions());
                        setOutgoingList(getOutgoingOpinions());
                    }}
                    onStartAttendance={() => setCurrentView('attendance')}
                    onFinishAttendance={() => {
                        setSelectedOpinion(null);
                        setCurrentView('list');
                        setIncomingList(getIncomingOpinions());
                        setOutgoingList(getOutgoingOpinions());
                    }}
                />
            </div>
        );
    }

    return (
        <div className="w-full bg-[#F1F5F9] min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-[12px] font-bold text-[#0F172A] flex items-center">
                            <Share2 className="w-6 h-6 mr-3 text-[#1D3461]" />
                            {userRole === 'triador' ? 'Pareceres Solicitados' : 'Central de Pareceres'}
                        </h1>
                        <p className="text-[#64748B] text-[11px] font-medium mt-1">
                            {userRole === 'triador' ? 'Acompanhe as interconsultas solicitadas pela triagem.' : 'Gerencie solicitações de interconsulta recebidas e enviadas.'}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="btn-secondary px-5 py-2.5 text-[11px]"
                    >
                        <LogOut className="w-[18px] h-[18px] mr-2 text-[#64748B]" />
                        Sair do Sistema
                    </button>
                </div >

                <div className="space-y-8">

                    {/* SECTION 1: PARECERES A REALIZAR (RECEBIDOS) */}
                    {userRole !== 'triador' && (
                        <div className="bg-white rounded-[12px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#E2E8F0] overflow-hidden">
                            <div className="bg-white px-6 py-5 border-b border-[#E2E8F0] flex justify-between items-center">
                                <div>
                                    <h2 className="text-[12px] font-bold text-[#0F172A] flex items-center">
                                        <FileText className="w-5 h-5 mr-2 text-[#1D3461]" />
                                        {userRole === 'triador' ? 'Novos Cadastros & Triagem' : 'Pareceres a Realizar (Recebidos)'}
                                    </h2>
                                    <p className="text-[11px] font-medium text-[#64748B] mt-1">
                                        {userRole === 'triador' ? 'Pacientes advindos do portal aguardando encaminhamento clínico.' : 'Solicitações encaminhadas para sua especialidade.'}
                                    </p>
                                </div>
                                <span className="bg-[#EEF4FA] border border-[#A8C4DA] text-[#1D3461] text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center shadow-sm">
                                    {incomingList.filter(i => i.status === 'Pendente').length} Pendentes
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="table-container">
                                    <thead className="bg-[#F8FAFC]">
                                        <tr>
                                            <th className="table-title">PACIENTE</th>
                                            <th className="table-title">SOLICITANTE</th>
                                            <th className="table-title">DESCRIÇÃO RESUMIDA</th>
                                            <th className="table-title">PRIORIDADE</th>
                                            <th className="table-title">PRAZO</th>
                                            <th className="table-title text-right">AÇÃO</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {incomingList.map((item) => (
                                            <tr
                                                key={item.id}
                                                className={`table-row-hover cursor-pointer group ${item.status === 'Respondido' ? 'bg-[#F8FAFC] opacity-75' : ''}`}
                                                onClick={() => handleRowClick(item)}
                                            >
                                                <td className="table-text whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <span className="text-[11px] font-bold text-[#0F172A] group-hover:text-[#1D3461] transition-colors">{item.patientName}</span>
                                                    </div>
                                                </td>
                                                <td className="table-text whitespace-nowrap text-[11px] text-[#475569]">
                                                    {item.doctorName}
                                                </td>
                                                <td className="table-text text-[11px] text-[#475569]">
                                                    <div className="max-w-[200px] sm:max-w-xs truncate" title={item.description}>
                                                        {item.description}
                                                    </div>
                                                </td>
                                                <td className="table-text whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold capitalize ${item.priority === 'Urgente' ? 'bg-[#FEF2F2] text-[#C0392B] border border-[#FECACA]' : 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]'}`}>
                                                        {item.priority}
                                                    </span>
                                                </td>
                                                <td className="table-text whitespace-nowrap text-[11px] text-[#475569] font-bold">
                                                    {item.deadline}
                                                </td>
                                                <td className="table-text whitespace-nowrap text-right">
                                                    {item.status === 'Respondido' ? (
                                                        <span className="inline-flex items-center text-[#10B981] font-bold text-[11px] capitalize bg-[#ECFDF5] px-2 py-1 rounded-md border border-[#A7F3D0]">
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Concluído
                                                        </span>
                                                    ) : (
                                                        <button className="btn-primary hover:bg-[#162749] bg-[#1D3461] text-white px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-[0_2px_8px_rgba(29,52,97,0.25)] transition-transform hover:-translate-y-0.5 ml-auto">
                                                            {userRole === 'triador' ? 'Encaminhar' : 'Responder'}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SECTION 2: PARECERES SOLICITADOS (ENVIADOS) */}
                    {userRole !== 'parecerista' && (
                        <div className="bg-white rounded-[12px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#E2E8F0] overflow-hidden">
                            <div className="bg-white px-6 py-5 border-b border-[#E2E8F0] flex justify-between items-center">
                                <div>
                                    <h2 className="text-[12px] font-bold text-[#0F172A] flex items-center">
                                        <Send className="w-5 h-5 mr-2 text-[#1D3461]" />
                                        Pareceres Solicitados (Enviados)
                                    </h2>
                                    <p className="text-[11px] font-medium text-[#64748B] mt-1">Histórico de interconsultas que você solicitou.</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="table-container">
                                    <thead className="bg-[#F8FAFC]">
                                        <tr>
                                            <th className="table-title">PACIENTE</th>
                                            <th className="table-title">DESTINATÁRIO (ESPEC.)</th>
                                            <th className="table-title">DATA ENVIO</th>
                                            <th className="table-title">PRAZO RESPOSTA</th>
                                            <th className="table-title">STATUS</th>
                                            <th className="table-title text-right">DETALHES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {outgoingList.map((item) => (
                                            <tr key={item.id} className="table-row-hover">
                                                <td className="table-text whitespace-nowrap">
                                                    <span className="text-[11px] font-bold text-[#0F172A]">{item.patientName}</span>
                                                </td>
                                                <td className="table-text whitespace-nowrap">
                                                    <div className="flex items-center text-[11px] font-medium text-[#475569]">
                                                        <User className="w-[14px] h-[14px] mr-2 text-[#94A3B8]" />
                                                        {item.specialty}
                                                    </div>
                                                </td>
                                                <td className="table-text whitespace-nowrap text-[11px] font-medium text-[#475569]">
                                                    {item.requestDate}
                                                </td>
                                                <td className="table-text whitespace-nowrap text-[11px] font-medium text-[#475569]">
                                                    {item.deadline}
                                                </td>
                                                <td className="table-text whitespace-nowrap">
                                                    {getStatusBadge(item.status)}
                                                </td>
                                                <td className="table-text whitespace-nowrap text-right">
                                                    <button className="btn-secondary px-3 py-1.5 rounded-lg text-[11px]">
                                                        Ver Resumo
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Opinions;
