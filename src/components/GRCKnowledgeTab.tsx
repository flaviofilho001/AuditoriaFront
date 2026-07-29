import React, { useEffect, useState } from 'react';
import { BookOpen, FileText, RefreshCw, CheckCircle2 } from 'lucide-react';
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
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
        {/* Document Selector Sidebar */}
        <div className="glass-card" style={{ padding: '20px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color="var(--accent-indigo)" /> Normas Carregadas
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {docs.map((doc) => (
              <button
                key={doc}
                onClick={() => selectDoc(doc)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: selectedDoc === doc ? '1px solid var(--accent-indigo)' : '1px solid var(--border-color)',
                  background: selectedDoc === doc ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                  color: selectedDoc === doc ? 'var(--accent-indigo)' : 'var(--text-main)',
                  fontWeight: selectedDoc === doc ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.85rem'
                }}
              >
                <FileText size={16} />
                <span style={{ flex: 1 }}>{doc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Document Content View */}
        <div className="glass-card" style={{ padding: '24px', minHeight: '500px' }}>
          {selectedDoc && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                  {selectedDoc}
                </h2>
                <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={14} /> Ativo na Base RAG
                </span>
              </div>

              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                  <RefreshCw className="animate-spin" size={18} /> Carregando norma GRC...
                </div>
              ) : (
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.88rem', lineHeight: '1.7', color: 'var(--text-main)' }} className="code-font">
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
