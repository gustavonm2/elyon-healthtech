import React, { useState, useRef } from 'react';
import type { QueueItem } from '../types';
import { getMockPatientDetails } from '../utils/patientData';
import {
  ArrowLeft, Phone, Mail, User, Calendar, Activity,
  Pill, Stethoscope, FileText as FileIcon, ChevronDown, Sparkles, PlusSquare, Video, ArrowRightLeft,
  ImagePlus, Trash2, Images, ZoomIn, X, ChevronLeft, ChevronRight, FileText, FilePlus, ExternalLink
} from 'lucide-react';
import ClinicalAttendance from './ClinicalAttendance';
import VideoCallOverlay from './VideoCallOverlay';
import RepasseModal from './RepasseModal';
import { addRepasse, getClinicalImages, addClinicalImage, getClinicalReports, addClinicalReport, type ClinicalImage, type ClinicalReport } from '../utils/patientStore';

interface PatientDetailsProps {
  patientId: string;
  onBack: () => void;
  onStartAttendance: () => void;
  onFinishAttendance?: () => void;
  initialData?: QueueItem;
  isAttending?: boolean;
}

const AccordionItem = ({ icon: Icon, title, rightElement, children, defaultOpen = false }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-[10px] shadow-sm mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors rounded-[10px]"
      >
        <div className="flex items-center">
          <Icon className="w-5 h-5 text-gray-500 mr-3" />
          <span className="font-bold text-gray-800 text-[11px]">{title}</span>
        </div>
        <div className="flex items-center gap-4">
          {rightElement}
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-auto opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="px-6 pb-5 pt-0">
          <div className="w-full h-px bg-gray-100 mb-4"></div>
          {children}
        </div>
      </div>
    </div>
  );
};

const PatientDetails: React.FC<PatientDetailsProps> = ({ patientId, onBack, onStartAttendance, onFinishAttendance, initialData, isAttending = false }) => {
  const patient = getMockPatientDetails(patientId, initialData);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showRepasseModal, setShowRepasseModal] = useState(false);

  // Clinical images
  const [clinicalImages, setClinicalImages] = useState<ClinicalImage[]>(() => getClinicalImages(patientId));
  const [imagePreviews, setImagePreviews] = useState<{ dataUrl: string; name: string }[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews(prev => [...prev, { dataUrl: ev.target?.result as string, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePreview = (idx: number) => setImagePreviews(prev => prev.filter((_, i) => i !== idx));

  // Clinical reports
  const [clinicalReports, setClinicalReports] = useState<ClinicalReport[]>(() => getClinicalReports(patientId));
  const [reportPreviews, setReportPreviews] = useState<{ dataUrl: string; name: string; size: string }[]>([]);
  const [selectedReport, setSelectedReport] = useState<ClinicalReport | null>(null);
  const reportInputRef = useRef<HTMLInputElement>(null);

  const handleReportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      const size = file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      reader.onload = (ev) => {
        setReportPreviews(prev => [...prev, { dataUrl: ev.target?.result as string, name: file.name, size }]);
      };
      reader.readAsDataURL(file);
    });
    if (reportInputRef.current) reportInputRef.current.value = '';
  };

  const removeReportPreview = (idx: number) => setReportPreviews(prev => prev.filter((_, i) => i !== idx));

  const handleSaveReports = () => {
    reportPreviews.forEach(rep => {
      addClinicalReport({ patientId, url: rep.dataUrl, fileName: rep.name, fileSize: rep.size, uploadedBy: 'triador' });
    });
    setClinicalReports(getClinicalReports(patientId));
    setReportPreviews([]);
  };

    const handleSaveImages = () => {
    imagePreviews.forEach(img => {
      addClinicalImage({ patientId, url: img.dataUrl, caption: img.name, uploadedBy: 'triador' });
    });
    setClinicalImages(getClinicalImages(patientId));
    setImagePreviews([]);
  };

  const handleRepasse = (motivo: string) => {
    addRepasse({
      patientId: patient.id,
      patientName: patient.patientName,
      especialidade: patient.type || 'Especialidade',
      hipotese: patient.requestDescription || '',
      priority: 'Média',
      queixaDetalhada: patient.requestDescription || '',
      motivoRepasse: motivo,
      repassadoPor: patient.requesterName || 'Parecerista',
      historicoRepasses: [],
    });
    setShowRepasseModal(false);
    onBack();
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-[#F8FAFC]" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header Card */}
      <div className="bg-white rounded-[10px] shadow-sm p-6 mb-6 relative">
        <button onClick={onBack} className="absolute -top-4 -left-4 bg-white shadow-md p-2 rounded-full hover:bg-gray-50 text-gray-600 transition-colors z-10">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="h-[72px] w-[72px] rounded-full bg-[#EBF3FF] text-[#1E5EFF] flex items-center justify-center font-bold text-[22px] tracking-tight">
                {patient.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-[#FFB800] border-2 border-white"></div>
            </div>
            <div>
              <h1 className="text-[11px] font-bold text-[#0F172A] mb-2 leading-tight">{patient.patientName}</h1>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 font-medium whitespace-nowrap">
                <span className="flex items-center gap-1.5"><User className="w-[16px] h-[16px] text-gray-400" /> {patient.age} anos</span>
                <span className="text-gray-300">•</span>
                <span>{patient.gender}</span>
                <span className="text-gray-300">•</span>
                <span className="bg-[#F1F5F9] px-2.5 py-1 rounded-md text-[#475569] font-bold text-[11px] tracking-wider capitalize">
                  {patient.type || 'CONSULTA'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-2.5 text-[11px] text-[#475569]">
            <div className="flex items-center">
              <Phone className="w-[16px] h-[16px] mr-3 text-gray-400" />
              {patient.contact}
            </div>
            {patient.email && (
              <div className="flex items-center">
                <Mail className="w-[16px] h-[16px] mr-3 text-gray-400" />
                {patient.email}
              </div>
            )}
            <div className="flex items-center mt-1 text-gray-500 font-medium text-[11px]">
              <span className="font-bold text-[#334155] mr-2">ID:</span> {patient.id}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Left Column (1/3) */}
        <div className="lg:col-span-1 space-y-5 sticky top-6">



          {/* Queixa Principal — vermelho rubro */}
          <div
            className="bg-white rounded-[10px] shadow-sm px-6 py-4"
            style={{ borderLeft: '3px solid #C0392B' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: '#C0392B' }}>Queixa Principal Atual</p>
            <p className="text-[#334155] font-medium leading-[1.6] text-[11px]">
              {patient.currentChiefComplaint || "Paciente relata dor de cabeça frontal persistente há 3 dias, associada a fotofobia. Nega febre ou vômitos."}
            </p>
          </div>
          <hr className="border-none h-px bg-[#E2E8F0]" />

          {/* Actions */}
          <div className="space-y-3 pt-2">
            {!isAttending ? (
              <>
                <button
                  onClick={onStartAttendance}
                  className="w-full py-3.5 bg-[#1D3461] hover:bg-[#162749] text-white rounded-xl font-semibold shadow-[0_4px_12px_rgba(29,52,97,0.2)] transition-all flex items-center justify-center text-[11px]"
                >
                  <FileIcon className="w-5 h-5 mr-3" />
                  Iniciar atendimento
                </button>
                <button
                  className="w-full py-3.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#1D3461] rounded-xl font-semibold shadow-sm transition-all flex items-center justify-center text-[11px]"
                >
                  <Sparkles className="w-5 h-5 mr-3" />
                  Automatização do cuidado
                </button>
                <button
                  onClick={() => setShowRepasseModal(true)}
                  className="w-full py-3.5 bg-orange-50 border border-orange-200 hover:bg-orange-100 text-orange-700 rounded-xl font-semibold shadow-sm transition-all flex items-center justify-center text-[11px]"
                >
                  <ArrowRightLeft className="w-5 h-5 mr-3" />
                  Repassar sem Atender
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowVideoCall(true)}
                className="w-full py-3.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-semibold shadow-[0_4px_12px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center text-[11px] animate-in slide-in-from-bottom-4 duration-300"
              >
                <Video className="w-5 h-5 mr-3" />
                Iniciar Chamada de Vídeo
              </button>
            )}
          </div>
        </div>

        {/* Right Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <AccordionItem
              icon={Calendar}
              title="Histórico de Consultas"
              defaultOpen={false}
              rightElement={
                <button className="text-[#1D3461] hover:text-[#162749] text-[11px] font-semibold transition-colors">
                  Ver Prontuário Completo
                </button>
              }
            >
              <div className="relative border-l-2 border-[#E2E8F0] ml-3 space-y-8 py-4">
                {patient.history.map((item) => (
                  <div key={item.id} className="relative pl-8">
                    <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-white border-[3px] border-[#CBD5E1]"></div>
                    <div className="flex flex-col mb-3">
                      <span className="text-[11px] font-bold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-md mb-2 inline-block w-fit capitalize">
                        {item.date}
                      </span>
                      <h4 className="text-[11px] font-bold text-[#0F172A]">{item.chiefComplaint}</h4>
                    </div>
                    <div className="mt-4 bg-[#F8FAFC] rounded-[16px] p-5 border border-[#E2E8F0]">
                      {item.conducts.prescriptions && (
                        <div className="mb-5 last:mb-0">
                          <p className="text-[11px] font-bold text-[#64748B] capitalize mb-2 flex items-center">
                            <Pill className="w-[14px] h-[14px] mr-2" /> Prescrição Externa
                          </p>
                          <ul className="list-none space-y-1 text-[11px] text-[#334155] font-medium">
                            {item.conducts.prescriptions.map((p, idx) => <li key={idx} className="flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] mr-3"></div>{p}</li>)}
                          </ul>
                        </div>
                      )}
                      {item.conducts.exams && (
                        <div className="mb-5 last:mb-0">
                          <p className="text-[11px] font-bold text-[#64748B] capitalize mb-2 flex items-center">
                            <Stethoscope className="w-[14px] h-[14px] mr-2" /> Solicitação de Exames
                          </p>
                          <ul className="list-none space-y-1 text-[11px] text-[#334155] font-medium">
                            {item.conducts.exams.map((e, idx) => <li key={idx} className="flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] mr-3"></div>{e}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {patient.history.length === 0 && (
                  <p className="text-[11px] text-gray-500 font-medium">Nenhum histórico de consulta encontrado.</p>
                )}
              </div>
            </AccordionItem>

            <AccordionItem icon={PlusSquare} title="Medicações em Uso Contínuo">
              {patient.medications?.continuous && patient.medications.continuous.length > 0 ? (
                <div className="overflow-x-auto -mx-6">
                  <table className="table-container">
                    <thead className="bg-[#F8FAFC]">
                      <tr>
                        <th className="table-title">#</th>
                        <th className="table-title">MEDICAMENTO / POSOLOGIA</th>
                        <th className="table-title">TIPO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patient.medications.continuous.map((med, idx) => (
                        <tr key={idx} className="table-row-hover">
                          <td className="table-text text-[11px] font-bold text-[#94A3B8] w-8">{idx + 1}</td>
                          <td className="table-text text-[11px] font-bold text-[#0F172A]">{med}</td>
                          <td className="table-text whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold bg-[#EEF4FA] text-[#1D3461] capitalize">Uso Contínuo</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[11px] text-[#64748B] font-medium pt-2">Nenhuma medicação de uso contínuo informada.</p>
              )}
            </AccordionItem>

            <AccordionItem icon={Activity} title="Resultados de Exames">
              {patient.examResults && patient.examResults.length > 0 ? (
                <div className="overflow-x-auto -mx-6">
                  <table className="table-container">
                    <thead className="bg-[#F8FAFC]">
                      <tr>
                        <th className="table-title">EXAME</th>
                        <th className="table-title">DATA / HORA</th>
                        <th className="table-title text-right">AÇÃO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patient.examResults.map((exam, idx) => (
                        <tr key={idx} className="table-row-hover cursor-pointer group">
                          <td className="table-text whitespace-nowrap">
                            <span className="text-[11px] font-bold text-[#0F172A] group-hover:text-[#1D3461] transition-colors">{exam.name}</span>
                          </td>
                          <td className="table-text whitespace-nowrap text-[11px] font-medium text-[#475569]">
                            {exam.date}
                          </td>
                          <td className="table-text whitespace-nowrap text-right">
                            <button className="text-[#1D3461] hover:text-[#162749] font-bold text-[11px] bg-[#EEF4FA] px-3 py-1.5 rounded-lg transition-colors">Ver Laudo</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[11px] text-[#64748B] font-medium pt-2">Nenhum exame anexado.</p>
              )}
            </AccordionItem>

            {/* ── Imagens Clínicas ──────────────────────────────────── */}
            <AccordionItem
              icon={Images}
              title="Imagens Clínicas do Caso"
              rightElement={
                <span className="text-[11px] font-bold text-[#1D3461] bg-[#EEF4FA] px-2.5 py-1 rounded-lg">
                  {clinicalImages.length} imagem(ns)
                </span>
              }
            >
              <div className="space-y-4">
                {/* Upload area */}
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#CBD5E1] rounded-xl text-[11px] font-bold text-[#64748B] hover:border-[#1D3461] hover:text-[#1D3461] hover:bg-[#EEF4FA] transition-all"
                  >
                    <ImagePlus className="w-4 h-4" />
                    Adicionar Imagens ao Caso
                  </button>

                  {/* Previews before saving */}
                  {imagePreviews.length > 0 && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-2">
                        {imagePreviews.map((img, idx) => (
                          <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC]">
                            <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removePreview(idx)}
                              className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveImages}
                        className="w-full py-2.5 bg-[#10B981] text-white rounded-xl text-[11px] font-bold hover:bg-[#059669] transition-colors flex items-center justify-center gap-2"
                      >
                        <ImagePlus className="w-4 h-4" />
                        Salvar {imagePreviews.length} imagem(ns) no caso
                      </button>
                    </div>
                  )}
                </div>

                {/* Saved images gallery */}
                {clinicalImages.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {clinicalImages.map((img, idx) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setLightboxIndex(idx)}
                        className="relative group aspect-square rounded-lg overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#1D3461] hover:scale-105 transition-all"
                      >
                        <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 flex items-center justify-center transition-colors">
                          <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/55 px-1.5 py-1">
                          <p className="text-[9px] text-white font-medium truncate">{img.uploadedBy === 'triador' ? 'Triador(a)' : 'Paciente'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#64748B] font-medium">Nenhuma imagem anexada ao caso ainda.</p>
                )}
              </div>
            </AccordionItem>


            {/* ── Relatórios Médicos ──────────────────────────────── */}
            <AccordionItem
              icon={FileText}
              title="Relatórios Médicos do Caso"
              rightElement={
                <span className="text-[11px] font-bold text-[#1D3461] bg-[#EEF4FA] px-2.5 py-1 rounded-lg">
                  {clinicalReports.length} documento(s)
                </span>
              }
            >
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <input
                    ref={reportInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    multiple
                    className="hidden"
                    onChange={handleReportUpload}
                  />
                  <button
                    type="button"
                    onClick={() => reportInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#CBD5E1] rounded-xl text-[11px] font-bold text-[#64748B] hover:border-[#1D3461] hover:text-[#1D3461] hover:bg-[#EEF4FA] transition-all"
                  >
                    <FilePlus className="w-4 h-4" />
                    Adicionar Relatórios / Laudos ao Caso
                  </button>

                  {reportPreviews.length > 0 && (
                    <div className="space-y-2">
                      {reportPreviews.map((rep, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                          <FileText className="w-5 h-5 text-[#1D3461] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-[#0F172A] truncate">{rep.name}</p>
                            <p className="text-[10px] text-[#94A3B8] font-medium">{rep.size}</p>
                          </div>
                          <button type="button" onClick={() => removeReportPreview(idx)} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={handleSaveReports} className="w-full py-2.5 bg-[#10B981] text-white rounded-xl text-[11px] font-bold hover:bg-[#059669] transition-colors flex items-center justify-center gap-2">
                        <FilePlus className="w-4 h-4" />
                        Salvar {reportPreviews.length} documento(s) no caso
                      </button>
                    </div>
                  )}
                </div>

                {clinicalReports.length > 0 ? (
                  <div className="space-y-2">
                    {clinicalReports.map((rep) => (
                      <div key={rep.id} className="flex items-center gap-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl hover:border-[#1D3461] hover:bg-[#EEF4FA] transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-[#1D3461]/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-[#1D3461]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-[#0F172A] truncate">{rep.fileName}</p>
                          <p className="text-[10px] text-[#94A3B8] font-medium">
                            {rep.fileSize} · {rep.uploadedBy === 'triador' ? 'Triador(a)' : 'Paciente'} · {rep.uploadedAt}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedReport(rep)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D3461] text-white rounded-lg text-[10px] font-bold hover:bg-[#162749] transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Abrir
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#64748B] font-medium">Nenhum relatório anexado ao caso ainda.</p>
                )}
              </div>
            </AccordionItem>

            {/* Report Viewer Modal */}
            {selectedReport && (
              <div
                className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4"
                onClick={() => setSelectedReport(null)}
              >
                <div
                  className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  {/* Modal header */}
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <FileText className="w-5 h-5 text-[#1D3461]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-[#0F172A] truncate">{selectedReport.fileName}</p>
                      <p className="text-[10px] text-[#94A3B8] font-medium">
                        {selectedReport.fileSize} · Enviado por {selectedReport.uploadedBy === 'triador' ? 'Triador(a)' : 'Paciente'} · {selectedReport.uploadedAt}
                      </p>
                    </div>
                    <button onClick={() => setSelectedReport(null)} className="p-2 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {/* Document viewer */}
                  <div className="flex-1 overflow-hidden bg-[#F1F5F9]">
                    {selectedReport.url.startsWith('data:image') ? (
                      <img src={selectedReport.url} alt={selectedReport.fileName} className="w-full h-full object-contain p-4" />
                    ) : (
                      <iframe
                        src={selectedReport.url}
                        title={selectedReport.fileName}
                        className="w-full h-full border-none"
                        style={{ minHeight: '70vh' }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Lightbox */}
            {lightboxIndex !== null && (() => {
              const img = clinicalImages[lightboxIndex];
              return (
                <div
                  className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
                  onClick={() => setLightboxIndex(null)}
                >
                  <button onClick={() => setLightboxIndex(null)} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white">
                    <X className="w-5 h-5" />
                  </button>
                  {lightboxIndex > 0 && (
                    <button className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white" onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i ?? 1) - 1); }}>
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  )}
                  {lightboxIndex < clinicalImages.length - 1 && (
                    <button className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white" onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i ?? 0) + 1); }}>
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  )}
                  <img src={img.url} alt={img.caption} className="max-h-[80vh] max-w-[90vw] rounded-xl shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
                  <div className="mt-4 text-center">
                    <p className="text-white text-sm font-medium">{img.caption}</p>
                    <p className="text-gray-400 text-xs mt-1">Enviado por: <span className="font-bold text-gray-200">{img.uploadedBy === 'triador' ? 'Triador(a)' : 'Paciente'}</span> · {img.uploadedAt}</p>
                    <p className="text-gray-500 text-[11px] mt-1">{lightboxIndex + 1} / {clinicalImages.length}</p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Chat Component rendering inline here if isAttending is true */}
          {isAttending && initialData && onFinishAttendance && (
            <div className="mt-8 animate-in slide-in-from-bottom-8 duration-500 ease-out" id="chat-section">
              <div className="bg-white rounded-[12px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden border border-[#E2E8F0]">
                <ClinicalAttendance
                  patient={initialData}
                  onBack={onFinishAttendance}
                />
              </div>
            </div>
          )}

        </div>
      </div>



      {/* Telemedicine Video Call Overlay */}
      {showVideoCall && (
        <VideoCallOverlay
          patientName={patient.patientName}
          onClose={() => setShowVideoCall(false)}
        />
      )}

      {/* Repasse Modal */}
      {showRepasseModal && (
        <RepasseModal
          patientName={patient.patientName}
          especialidade={patient.type || 'Especialidade'}
          onConfirm={handleRepasse}
          onCancel={() => setShowRepasseModal(false)}
        />
      )}

      {/* Floating Help Button - Hide when attending because the UI is already busy */}
      {!isAttending && (
        <div className="fixed bottom-8 right-8 flex items-center gap-4 z-40">
          <div className="bg-white rounded-full px-5 py-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#E2E8F0] text-[11px] font-bold text-[#64748B] transition-opacity hover:opacity-90 cursor-pointer">
            Precisa de ajuda?
          </div>
          <button className="h-14 w-14 rounded-full bg-[#1D3461] hover:bg-[#162749] text-white shadow-[0_8px_16px_rgba(29,52,97,0.25)] flex items-center justify-center transition-transform hover:scale-105 relative">
            <Sparkles className="w-[22px] h-[22px]" />
            <span className="absolute top-3.5 right-3.5 w-[6px] h-[6px] bg-white rounded-full"></span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PatientDetails;