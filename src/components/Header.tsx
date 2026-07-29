import React from 'react';
import { ShieldCheck, Cpu, BookOpen, Search, Server } from 'lucide-react';
import { HealthResponse } from '../services/api';

interface HeaderProps {
  activeTab: 'scanner' | 'llm' | 'grc';
  setActiveTab: (tab: 'scanner' | 'llm' | 'grc') => void;
  health: HealthResponse | null;
  isBackendConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  health,
  isBackendConnected
}) => {
  return (
    <header className="glass-card" style={{ borderRadius: '0 0 16px 16px', borderTop: 'none', padding: '16px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
          }}>
            <ShieldCheck size={26} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Auditor de Conformidade de APIs
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              IA + GraphRAG + GRC (OWASP Top 10 • LGPD Art. 46 • ISO 27001)
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <button
            className={activeTab === 'scanner' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('scanner')}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <Search size={16} /> Escanear Repositório
          </button>
          <button
            className={activeTab === 'llm' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('llm')}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <Cpu size={16} /> Provedor LLM (IA)
          </button>
          <button
            className={activeTab === 'grc' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('grc')}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <BookOpen size={16} /> Base GRC ({health?.grc_docs_count || 0})
          </button>
        </nav>

        {/* Backend Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
          <Server size={14} color="var(--text-muted)" />
          <span style={{ color: 'var(--text-muted)' }}>Backend:</span>
          {isBackendConnected ? (
            <span style={{ color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="glowing-dot"></span> Conectado (v{health?.version})
            </span>
          ) : (
            <span style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>
              Desconectado
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
