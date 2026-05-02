import { useState, useEffect } from 'react';
import Header from './components/Header';
import OrbitalCanvas from './components/OrbitalCanvas';
import StrategyPanel from './components/StrategyPanel';
import AgentArchitecture from './components/AgentArchitecture';
import MetricsBar from './components/MetricsBar';
import InnovationShowcase from './components/InnovationShowcase';
import CombatSimulator from './components/CombatSimulator';
import Timeline from './components/Timeline';
import Footer from './components/Footer';

export default function App() {
  const [activeSection, setActiveSection] = useState('command');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`app-root ${loaded ? 'loaded' : ''}`}>
      <div className="cosmos-bg" />
      <Header activeSection={activeSection} setActiveSection={setActiveSection} />
      
      {activeSection === 'command' && (
        <main className="main-content stagger">
          <OrbitalCanvas />
          <MetricsBar />
          <StrategyPanel />
          <InnovationShowcase />
          <CombatSimulator />
          <AgentArchitecture />
          <Timeline />
        </main>
      )}
      
      <Footer />

      <style>{`
        .app-root {
          opacity: 0;
          transition: opacity 0.8s var(--ease-out);
        }
        .app-root.loaded {
          opacity: 1;
        }
        .main-content {
          max-width: 1440px;
          margin: 0 auto;
          padding: var(--s7) var(--s6);
          display: flex;
          flex-direction: column;
          gap: var(--s8);
        }
        @media (max-width: 768px) {
          .main-content {
            padding: var(--s4) var(--s3);
            gap: var(--s6);
          }
        }
      `}</style>
    </div>
  );
}
