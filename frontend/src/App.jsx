import { ThemeProvider } from './context/ThemeContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ParticleBackground from './components/ParticleBackground';
import CursorGlow from './components/CursorGlow';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import EmailPage from './pages/EmailPage';
import Candidates from './pages/Candidates';
import OpenRoles from './pages/OpenRoles';
import Analytics from './pages/Analytics';
import Interviews from './pages/Interviews';
import InterviewRoom from './pages/InterviewRoom';
import Results from './pages/Results';

function App() {
  return (
    <ThemeProvider>
      <CursorGlow />
      <div className="mesh-grad" />
      <ParticleBackground />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/emails" element={<EmailPage />} />
          <Route path="/candidates" element={<Candidates />} />
          <Route path="/open-roles" element={<OpenRoles />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/interviews" element={<Interviews />} />
          <Route path="/interview-room/:id" element={<InterviewRoom />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
