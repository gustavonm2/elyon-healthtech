import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Home from './components/Home';
import Login from './components/Login';
import Opinions from './components/Opinions';
import DashboardMetrics from './components/DashboardMetrics';
import Layout from './components/Layout';
import ProfileManagement from './components/ProfileManagement';
import PatientRegistration from './components/PatientRegistration';
import ProfessionalWorkspace from './components/ProfessionalWorkspace';
import ManagementDashboard from './components/ManagementDashboard';
import PacientesList from './components/PacientesList';
import PatientPortal from './components/PatientPortal';
import TriagemPage from './components/TriagemPage';
import ClinicRegistration from './components/ClinicRegistration';
import MemberRegistration from './components/MemberRegistration';
import AvaliacoesPage from './components/AvaliacoesPage';
import SuporteTecnicoPage from './components/SuporteTecnicoPage';
import SuporteMasterPage from './components/SuporteMasterPage';
import RecepcaoUPA from './components/RecepcaoUPA';
import PainelChamadaTV from './components/PainelChamadaTV';
import TriagemUpaPage from './components/TriagemUpaPage';
import SimulatorDashboard from './components/simulator/SimulatorDashboard';
import LizAssistentePage from './components/LizAssistentePage';
import LizPromptPlayground from './components/LizPromptPlayground';
import LizVoiceInterface from './components/LizVoiceInterface';
import PatientApp from './components/PatientApp';
import LizInteractionsMonitor from './components/LizInteractionsMonitor';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<PatientRegistration />} />
              <Route path="/cadastro-clinica" element={<ClinicRegistration />} />
              <Route path="/cadastro-membro" element={<MemberRegistration />} />
              <Route path="/painel-tv" element={<PainelChamadaTV />} />
              <Route path="/simulador-full" element={<SimulatorDashboard />} />
              <Route path="/liz-assistente-full" element={<LizAssistentePage />} />
              <Route path="/liz-playground-full" element={<LizPromptPlayground />} />
              <Route path="/liz-voice-full" element={<LizVoiceInterface />} />
              <Route path="/app-paciente" element={<PatientApp />} />

              {/* Protected Dashboard Routes with Sidebar */}
              <Route element={<Layout />}>
                <Route path="/liz-voice" element={<LizVoiceInterface />} />
                <Route path="/liz-playground" element={<LizPromptPlayground />} />
                <Route path="/liz-assistente" element={<LizAssistentePage />} />
                <Route path="/assistente-liz" element={<LizAssistentePage />} />
                <Route path="/simulador" element={<SimulatorDashboard />} />
                <Route path="/simulator" element={<SimulatorDashboard />} />
                <Route path="/liz-monitor" element={<LizInteractionsMonitor />} />
                <Route path="/dashboard" element={<DashboardMetrics />} />
                <Route path="/portal-paciente" element={<PatientPortal />} />
                <Route path="/pareceres" element={<Opinions />} />
                <Route path="/pacientes" element={<PacientesList />} />
                <Route path="/triagem/:patientId" element={<TriagemPage />} />
                <Route path="/gestao-master" element={<ProfileManagement />} />
                <Route path="/atendimentos" element={<ProfessionalWorkspace />} />
                <Route path="/gestao" element={<ManagementDashboard />} />
                <Route path="/avaliacoes" element={<AvaliacoesPage />} />
                <Route path="/suporte" element={<SuporteTecnicoPage />} />
                <Route path="/suporte-master" element={<SuporteMasterPage />} />
                <Route path="/recepcao-upa" element={<RecepcaoUPA />} />
                <Route path="/triagem-upa" element={<TriagemUpaPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
