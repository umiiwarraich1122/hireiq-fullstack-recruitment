import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import Features from '../components/Features';
import Pipeline from '../components/Pipeline';
import TechStack from '../components/TechStack';
import Creator from '../components/Creator';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

export default function Landing() {
  return (
    <>
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <Pipeline />
      <TechStack />
      <Creator />
      <CTA />
      <Footer />
    </>
  );
}
