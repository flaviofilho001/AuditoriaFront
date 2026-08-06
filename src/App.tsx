import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ScannerTab } from './components/ScannerTab';
import { LLMBenchTab } from './components/LLMBenchTab';
import { GRCKnowledgeTab } from './components/GRCKnowledgeTab';
import { api, HealthResponse } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scanner' | 'llm' | 'grc'>('scanner');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    try {
      const data = await api.checkHealth();
      setHealth(data);
      setIsBackendConnected(true);
    } catch {
      setIsBackendConnected(false);
      setHealth(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        isBackendConnected={isBackendConnected}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'scanner' && <ScannerTab />}
        {activeTab === 'llm' && <LLMBenchTab />}
        {activeTab === 'grc' && <GRCKnowledgeTab />}
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '20px',
        fontSize: '0.85rem',
        fontFamily: 'var(--font-title)',
        fontWeight: 700,
        color: '#000000',
        background: 'var(--accent-yellow)',
        borderTop: 'var(--border-thick)',
        marginTop: '40px'
      }}>
        Auditor de Conformidade de APIs • Clean Architecture + GraphRAG + IA para Segurança & LGPD
      </footer>
    </div>
  );
};

export default App;
