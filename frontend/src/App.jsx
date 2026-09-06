import { ThemeProvider } from './context/ThemeContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ParticleBackground from './components/ParticleBackground';
import CursorGlow from './components/CursorGlow';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';

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
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
