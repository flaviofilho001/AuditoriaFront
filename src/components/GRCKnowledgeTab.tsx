import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export const GRCKnowledgeTab: React.FC = () => {
  const [docs, setDocs] = useState<string[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [docContent, setDocContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocsList();
  }, []);

  const loadDocsList = async () => {
    try {
      setLoading(true);
      const res = await api.listGRCDocs();
      setDocs(res.documents);
      if (res.documents.length > 0) {
        selectDoc(res.documents[0]);
      }
    } catch (err: any) {
      setError('Não foi possível conectar ao Backend para carregar os documentos GRC.');
    } finally {
      setLoading(false);
    }
  };

  const selectDoc = async (docName: string) => {
    setSelectedDoc(docName);
    setLoading(true);
    try {
      const res = await api.getGRCDoc(docName);
      setDocContent(res.content);
    } catch (err: any) {
      setDocContent('Erro ao carregar o conteúdo do documento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '32px auto', padding: '0 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
        {/* Document Selector Sidebar */}
        <div className="brutal-card" style={{ padding: '20px', height: 'fit-content', background: '#FFFFFF' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase' }}>
            <i className="fa-solid fa-book" style={{ color: 'var(--accent-pink)' }}></i> Normas Carregadas
          </h3>

          {error && (
            <div style={{ padding: '10px', background: 'var(--accent-rose)', color: '#FFF', fontWeight: 700, borderRadius: '6px', border: '2px solid #000', fontSize: '0.8rem', marginBottom: '12px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {docs.map((doc) => (
              <button
                key={doc}
                onClick={() => selectDoc(doc)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  border: 'var(--border-thin)',
                  background: selectedDoc === doc ? 'var(--accent-yellow)' : '#FFFFFF',
                  color: '#000000',
                  fontWeight: selectedDoc === doc ? 800 : 600,
                  boxShadow: selectedDoc === doc ? 'var(--shadow-brutal-sm)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.88rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <i className="fa-solid fa-file-lines" style={{ color: selectedDoc === doc ? '#000000' : 'var(--text-muted)' }}></i>
                <span style={{ flex: 1, fontFamily: 'var(--font-title)' }}>{doc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Document Content View */}
        <div className="brutal-card" style={{ padding: '28px', minHeight: '500px', background: '#FFFFFF' }}>
          {selectedDoc && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: 'var(--border-thick)', paddingBottom: '16px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, textTransform: 'uppercase', color: '#000000' }}>
                  {selectedDoc}
                </h2>
                <span className="badge badge-info" style={{ background: 'var(--accent-cyan)', color: '#000' }}>
                  <i className="fa-solid fa-circle-check"></i> Ativo na Base RAG
                </span>
              </div>

              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#000', fontWeight: 700 }}>
                  <i className="fa-solid fa-rotate fa-spin" style={{ fontSize: '1.2rem' }}></i> Carregando norma GRC...
                </div>
              ) : (
                <div style={{
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.9rem',
                  lineHeight: '1.7',
                  color: '#000000',
                  background: '#F9FAFB',
                  padding: '20px',
                  borderRadius: '6px',
                  border: 'var(--border-thin)',
                  boxShadow: 'var(--shadow-brutal-sm)'
                }} className="code-font">
                  {docContent}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
