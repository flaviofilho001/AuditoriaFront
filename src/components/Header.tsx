import React from 'react';
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
    <header style={{
      backgroundColor: 'var(--bg-header)',
      borderBottom: 'var(--border-thick)',
      padding: '16px 32px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: '#000000',
            color: 'var(--accent-yellow)',
            padding: '12px 14px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #000000',
            boxShadow: '3px 3px 0px #000000'
          }}>
            <i className="fa-solid fa-shield-halved" style={{ fontSize: '1.6rem' }}></i>
          </div>
          <div>
            <h1 style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: '#000000',
              fontFamily: 'var(--font-title)',
              lineHeight: 1.1
            }}>
              AUDITOR DE CONFORMIDADE DE APIS
            </h1>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#000000', marginTop: '2px' }}>
              IA + GraphRAG + GRC (OWASP Top 10 • LGPD Art. 46 • ISO 27001)
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '10px' }}>
          <button
            className={activeTab === 'scanner' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('scanner')}
            style={{
              padding: '10px 18px',
              fontSize: '0.85rem',
              background: activeTab === 'scanner' ? 'var(--accent-pink)' : '#FFFFFF',
              color: activeTab === 'scanner' ? '#FFFFFF' : '#000000'
            }}
          >
            <i className="fa-solid fa-magnifying-glass"></i> Escanear Repositório
          </button>
          <button
            className={activeTab === 'llm' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('llm')}
            style={{
              padding: '10px 18px',
              fontSize: '0.85rem',
              background: activeTab === 'llm' ? 'var(--accent-cyan)' : '#FFFFFF',
              color: activeTab === 'llm' ? '#000000' : '#000000'
            }}
          >
            <i className="fa-solid fa-microchip"></i> Provedor LLM (IA)
          </button>
          <button
            className={activeTab === 'grc' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('grc')}
            style={{
              padding: '10px 18px',
              fontSize: '0.85rem',
              background: activeTab === 'grc' ? 'var(--accent-yellow)' : '#FFFFFF',
              color: activeTab === 'grc' ? '#000000' : '#000000'
            }}
          >
            <i className="fa-solid fa-book"></i> Base GRC ({health?.grc_docs_count || 0})
          </button>
        </nav>

        {/* Backend Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem',
          fontWeight: 700,
          background: '#FFFFFF',
          padding: '8px 14px',
          borderRadius: '8px',
          border: 'var(--border-thin)',
          boxShadow: 'var(--shadow-brutal-sm)'
        }}>
          <i className="fa-solid fa-server" style={{ color: '#000000' }}></i>
          <span>Backend:</span>
          {isBackendConnected ? (
            <span style={{ color: '#000000', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--accent-emerald)', padding: '2px 8px', borderRadius: '4px', border: '1px solid #000' }}>
              <span className="glowing-dot"></span> Conectado (v{health?.version})
            </span>
          ) : (
            <span style={{ color: '#FFFFFF', background: 'var(--accent-rose)', padding: '2px 8px', borderRadius: '4px', border: '1px solid #000' }}>
              Desconectado
            </span>
          )}
        </div>

      </div>
    </header>
  );
};
