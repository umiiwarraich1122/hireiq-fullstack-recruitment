import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Features from './components/Features';
import Pipeline from './components/Pipeline';
import TechStack from './components/TechStack';
import Creator from './components/Creator';
import CTA from './components/CTA';
import Footer from './components/Footer';
import ParticleBackground from './components/ParticleBackground';
import CursorGlow from './components/CursorGlow';

function App() {
  return (
    <ThemeProvider>
      <CursorGlow />
      <div className="mesh-grad" />
      <ParticleBackground />
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <Pipeline />
      <TechStack />
      <Creator />
      <CTA />
      <Footer />
    </ThemeProvider>
  );
}

export default App;
