import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    Share2, Settings, UserCircle, LogOut, Menu,
    Briefcase, Users, BarChart2, Activity, Shield, Cpu,
    ClipboardList, Video, Pill, FlaskConical, FileText, Stethoscope, Star, LifeBuoy,
    ChevronRight, FolderOpen, Image, Building2, Monitor, Terminal, AudioLines
} from 'lucide-react';
import { getOpenTicketsCount } from '../utils/patientStore';
import { LizSidebarAgent } from './layout/LizSidebarAgent';

// ── Patient section items ──────────────────────────────────────────────────────
const PATIENT_TOP_SECTIONS = [
    { id: 'prontuario',   label: 'Minhas Consultas',  icon: ClipboardList },
    { id: 'teleconsulta', label: 'Teleconsulta',       icon: Video },
    { id: 'pareceres',    label: 'Pareceres Médicos',  icon: FileText },
];

const PRONTUARIO_SUB = [
    { id: 'medicacoes',  label: 'Medicações',          icon: Pill },
    { id: 'historico',   label: 'Hist. de Saúde',      icon: Shield },
    { id: 'prescricoes', label: 'Prescrições',          icon: Stethoscope },
    { id: 'exames',      label: 'Exames',               icon: FlaskConical },
    { id: 'imagens',     label: 'Imagens Clínicas',     icon: Image },
    { id: 'relatorios',  label: 'Relatórios Médicos',   icon: FileText },
];

const PATIENT_BOTTOM_SECTIONS = [
    { id: 'suporte', label: 'Suporte Técnico', icon: LifeBuoy },
];

// ── PatientMenu sub-component ─────────────────────────────────────────────────
const SidebarBtn: React.FC<{
    id: string; label: string; icon: React.ElementType;
    active: boolean; indent?: boolean;
    onClick: () => void;
}> = ({ label, icon: Icon, active, indent, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 py-2.5 text-[12px] transition-all ${indent ? 'pl-9 pr-5' : 'px-5'}`}
        style={{
            fontWeight: active ? 600 : 500,
            backgroundColor: active ? '#E9EEF5' : 'transparent',
            color: active ? '#162749' : '#6B7280',
            boxShadow: active ? 'inset 2px 2px 6px rgba(0,0,0,0.08), inset -2px -2px 6px rgba(255,255,255,0.7)' : 'none',
            borderLeft: active ? '3px solid #2C4E6E' : '3px solid transparent',
            transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = '#F1F5F9'; }}
        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
    >
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: active ? '#1D3461' : '#94A3B8' }} />
        {label}
    </button>
);

const PatientMenu: React.FC<{
    activeSection: string;
    onActivate: (id: string) => void;
}> = ({ activeSection, onActivate }) => {
    const [prontuarioOpen, setProntuarioOpen] = useState(
        PRONTUARIO_SUB.some(s => s.id === activeSection)
    );
    return (
        <>
            {PATIENT_TOP_SECTIONS.map(({ id, label, icon }) => (
                <SidebarBtn key={id} id={id} label={label} icon={icon}
                    active={activeSection === id}
                    onClick={() => onActivate(id)}
                />
            ))}

            {/* Collapsible group: Meu Prontuário */}
            <button
                onClick={() => setProntuarioOpen(o => !o)}
                className="w-full flex items-center gap-3 px-5 py-2.5 text-[12px] transition-all"
                style={{
                    fontWeight: prontuarioOpen ? 600 : 500,
                    color: prontuarioOpen ? '#162749' : '#6B7280',
                    borderLeft: '3px solid transparent',
                    transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F1F5F9'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
            >
                <FolderOpen className="w-4 h-4 flex-shrink-0" style={{ color: prontuarioOpen ? '#1D3461' : '#94A3B8' }} />
                <span className="flex-1 text-left">Meu Prontuário</span>
                <ChevronRight
                    className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200"
                    style={{
                        color: '#94A3B8',
                        transform: prontuarioOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}
                />
            </button>

            {prontuarioOpen && (
                <div className="border-l-2 border-[#E2E8F0] ml-7 mr-2">
                    {PRONTUARIO_SUB.map(({ id, label, icon }) => (
                        <SidebarBtn key={id} id={id} label={label} icon={icon}
                            active={activeSection === id}
                            indent
                            onClick={() => onActivate(id)}
                        />
                    ))}
                </div>
            )}

            {PATIENT_BOTTOM_SECTIONS.map(({ id, label, icon }) => (
                <SidebarBtn key={id} id={id} label={label} icon={icon}
                    active={activeSection === id}
                    onClick={() => onActivate(id)}
                />
            ))}
        </>
    );
};

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const userRole = localStorage.getItem('userRole') || 'telemedicina';
    const isPatient = userRole === 'paciente';

    const [activeSection, setActiveSection] = useState<string>('prontuario');

    // Listen for section changes dispatched by PatientPortal
    useEffect(() => {
        if (!isPatient) return;
        const handler = (e: Event) => {
            const tab = (e as CustomEvent<string>).detail;
            setActiveSection(tab);
        };
        window.addEventListener('patient-section-change', handler);
        return () => window.removeEventListener('patient-section-change', handler);
    }, [isPatient]);

    const activateSection = (id: string) => {
        if (id === 'teleconsulta') return; // keep existing behavior for teleconsulta
        if (id === 'suporte') { navigate('/suporte'); setActiveSection(id); return; }
        if (location.pathname !== '/portal-paciente') {
            navigate('/portal-paciente');
            setTimeout(() => window.dispatchEvent(new CustomEvent('patient-tab-select', { detail: id })), 300);
        } else {
            window.dispatchEvent(new CustomEvent('patient-tab-select', { detail: id }));
        }
        setActiveSection(id);
    };

    const getMenuItems = () => {
        const baseItems = [
            { path: '/liz-assistente', label: 'LIZ Assistente', icon: Cpu, roles: ['simulador', 'gestor_master', 'triador', 'parecerista', 'telemedicina', 'recepcao_upa', 'triagem_upa'] },
            { path: '/liz-voice',      label: 'LIZ Voice',      icon: AudioLines, roles: ['simulador', 'gestor_master', 'triador', 'parecerista', 'telemedicina', 'recepcao_upa', 'triagem_upa'] },
            { path: '/liz-playground', label: 'Laboratório LIZ', icon: Terminal, roles: ['simulador', 'gestor_master', 'triador', 'parecerista', 'telemedicina', 'recepcao_upa', 'triagem_upa'] },
            { path: '/simulador',      label: 'Simulador de Realidade', icon: Activity, roles: ['simulador', 'gestor_master', 'triador', 'parecerista', 'telemedicina'] },
            { path: '/liz-monitor',    label: 'Monitor LIZ ↔ Paciente', icon: BarChart2, roles: ['simulador', 'gestor_master'] },
            { path: '/dashboard',      label: 'Dashboard',            icon: BarChart2, roles: ['triador', 'parecerista', 'telemedicina'] },
            { path: '/pacientes',      label: 'Pacientes',            icon: Users,     roles: ['triador', 'recepcao_upa'] },
            { path: '/pareceres',      label: 'Central de Pareceres', icon: Share2,    roles: ['parecerista', 'telemedicina'] },
            { path: '/pareceres',      label: 'Pareceres Solicitados',icon: Share2,    roles: ['triador'] },
            { path: '/atendimentos',   label: 'Atendimentos',         icon: Activity,  roles: ['parecerista', 'telemedicina', 'triador', 'recepcao_upa'] },
            { path: '/gestao',         label: 'Gestão',               icon: Briefcase, roles: ['parecerista', 'telemedicina', 'triador'] },
            { path: '/avaliacoes',     label: 'Minhas Avaliações',    icon: Star,      roles: ['parecerista'] },
            { path: '/suporte',        label: 'Suporte Técnico',      icon: LifeBuoy,  roles: ['triador', 'parecerista', 'telemedicina', 'recepcao_upa', 'triagem_upa'] },
            { path: '/recepcao-upa',   label: 'Recepção UPA',         icon: Building2, roles: ['recepcao_upa'] },
            { path: '/painel-tv',      label: 'Painel TV',            icon: Monitor,   roles: ['recepcao_upa'] },
            { path: '/triagem-upa',    label: 'Triagem UPA',          icon: Stethoscope, roles: ['triagem_upa'] },
            { path: '/gestao-master',  label: 'Gestão de Perfis',     icon: Shield,    roles: ['gestor_master'] },
            { path: '/avaliacoes',     label: 'Avaliações',           icon: Star,      roles: ['gestor_master'] },
            { path: '/suporte-master', label: 'Central de Suporte',   icon: LifeBuoy,  roles: ['gestor_master'] },
        ];
        if (userRole === 'simulador') return baseItems.filter(i => (i as any).roles?.includes('simulador'));
        if (userRole === 'gestor_master') return baseItems.filter(i => (i as any).roles?.includes('gestor_master'));
        if (userRole === 'recepcao_upa') return baseItems.filter(i => (i as any).roles?.includes('recepcao_upa'));
        if (userRole === 'triagem_upa') return baseItems.filter(i => (i as any).roles?.includes('triagem_upa'));
        return baseItems.filter(i => (i as any).roles?.includes(userRole));
    };

    const menuItems = getMenuItems();
    const isActive = (path: string) => path !== '#' && location.pathname === path;

    // Live badge for gestor_master: count of open/in-progress tickets
    const [openTickets, setOpenTickets] = useState(0);
    useEffect(() => {
        if (userRole !== 'gestor_master') return;
        const refresh = () => setOpenTickets(getOpenTicketsCount());
        refresh();
        const id = setInterval(refresh, 5000);
        return () => clearInterval(id);
    }, [userRole]);

    return (
        <aside
            className="fixed inset-y-0 left-0 w-64 hidden lg:flex flex-col z-10 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-colors duration-300"
            style={{
                backgroundColor: 'var(--color-sidebar-bg)',
                borderRight: '1px solid var(--color-sidebar-border)',
                color: 'var(--color-sidebar-text)',
            }}
        >
            {/* Logo */}
            <div
                className="flex items-center gap-2 px-4 h-20 transition-colors duration-300"
                style={{ borderBottom: '1px solid var(--color-sidebar-border)' }}
            >
                <img
                    src="/src/assets/sci-logo-clean.png"
                    alt="SCI Logo"
                    className="w-12 h-12 object-contain flex-shrink-0"
                    style={{ mixBlendMode: 'multiply' }}
                />
                <span className="font-bold text-[13px] text-[#1D3461] leading-tight">Pareceres<br />Médicos</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 space-y-0.5 overflow-y-auto">
                <p
                    className="px-5 text-[11px] font-bold uppercase tracking-wider mb-3"
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    {isPatient ? 'Portal do Paciente' : 'Principal'}
                </p>

                {isPatient ? (
                    <PatientMenu
                        activeSection={activeSection}
                        onActivate={activateSection}
                    />
                ) : (
                    menuItems.map(item => {
                        const active = isActive(item.path);
                        const isSupporteMaster = item.path === '/suporte-master';
                        return (
                            <button
                                key={item.path + item.label}
                                onClick={() => navigate(item.path)}
                                className="w-full flex items-center px-5 py-3 rounded-lg text-[13px] font-medium transition-all duration-200"
                                style={{
                                    backgroundColor: active ? '#E2E8F0' : 'transparent',
                                    color: active ? '#1D3461' : 'var(--color-sidebar-text)',
                                    fontWeight: active ? 700 : 500,
                                    borderTop: '1px solid transparent',
                                    borderBottom: '1px solid transparent',
                                    borderRight: '1px solid transparent',
                                    borderLeft: active ? '3px solid #2C4E6E' : '3px solid transparent',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = '#F1F5F9'; }}
                                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                            >
                                <item.icon className="w-4 h-4 mr-3 flex-shrink-0" style={{ color: active ? '#1D3461' : '#94A3B8' }} />
                                <span className="flex-1 text-left">{item.label}</span>
                                {isSupporteMaster && openTickets > 0 && (
                                    <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D97706] text-white text-[10px] font-black flex items-center justify-center">
                                        {openTickets}
                                    </span>
                                )}
                            </button>
                        );
                    })
                )}
            </nav>

            {/* Bottom: settings + user card */}
            <div
                className="p-4 space-y-2 transition-colors duration-300"
                style={{ borderTop: '1px solid var(--color-sidebar-border)' }}
            >
                <button
                    className="w-full flex items-center px-4 py-3 rounded-lg text-[12px] font-bold transition-all duration-200 hover:opacity-80"
                    style={{ color: 'var(--color-sidebar-text)' }}
                >
                    <Settings className="w-5 h-5 mr-3" style={{ color: 'var(--color-nav-icon)' }} />
                    Configurações
                </button>
                <div
                    className="flex items-center mt-4 px-3 py-2 rounded-xl shadow-sm border transition-colors duration-300"
                    style={{
                        backgroundColor: 'var(--color-card-bg)',
                        borderColor: 'var(--color-border)',
                    }}
                >
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center mr-3 font-bold text-[13px] flex-shrink-0"
                        style={{
                            backgroundColor: isPatient ? 'var(--color-primary-light)' : '#F1F5F9',
                            color: isPatient ? 'var(--color-primary)' : '#94A3B8',
                        }}
                    >
                        {isPatient ? 'CE' : <UserCircle className="w-9 h-9 text-[#CBD5E1]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                            {isPatient ? 'Carlos E. Lima' : userRole === 'simulador' ? 'Senior Principal Architect' : userRole === 'recepcao_upa' ? 'Recepção UPA' : userRole === 'triagem_upa' ? 'Enfermeiro UPA' : 'Dr. Exemplo'}
                        </p>
                        <p className="text-[11px] font-medium truncate" style={{ color: 'var(--color-text-muted)' }}>
                            {isPatient ? 'Paciente' : userRole === 'simulador' ? 'Chaos Engineering Specialist' : userRole === 'recepcao_upa' ? 'Recepcionista' : userRole === 'triagem_upa' ? 'Enfermagem UPA' : 'Cardiologia'}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 text-[#94A3B8] hover:text-[#C0392B] hover:bg-[#FEF2F2] rounded-lg transition-colors"
                        title="Sair"
                    >
                        <LogOut className="w-[18px] h-[18px]" />
                    </button>
                </div>
            </div>
        </aside>
    );
};

const Header = () => (
    <header
        className="lg:hidden sticky top-0 z-20 h-16 flex items-center justify-between px-4 sm:px-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-colors duration-300"
        style={{
            backgroundColor: 'var(--color-card-bg)',
            borderBottom: '1px solid var(--color-border)',
        }}
    >
        <div className="flex items-center">
            <button className="mr-4 transition-colors" style={{ color: 'var(--color-text-muted)' }}>
                <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
                <img
                    src="/src/assets/sci-logo-clean.png"
                    alt="SCI Logo"
                    className="w-10 h-10 object-contain"
                    style={{ mixBlendMode: 'multiply' }}
                />
                <span className="font-bold text-[13px] text-[#1D3461] leading-tight">Pareceres<br />Médicos</span>
            </div>
        </div>
    </header>
);

const Layout: React.FC = () => (
    <div
        className="min-h-screen flex transition-colors duration-300"
        style={{ fontFamily: 'Inter, sans-serif', backgroundColor: 'var(--color-page-bg)' }}
    >
        <Sidebar />
        <div className="flex-1 flex flex-col lg:pl-64 h-screen overflow-hidden">
            <Header />
            <main
                className="flex-1 overflow-x-hidden overflow-y-auto transition-colors duration-300"
                style={{ backgroundColor: 'var(--color-page-bg)' }}
            >
                <Outlet />
            </main>
        </div>
    </div>
);

export default Layout;
