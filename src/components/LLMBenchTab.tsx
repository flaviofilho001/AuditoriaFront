import React, { useState } from 'react';
import { Cpu, Key, AlertTriangle, Send, CheckCircle2, RefreshCw } from 'lucide-react';
import { api, LLMTestResponse } from '../services/api';

export const LLMBenchTab: React.FC = () => {
  const [provider, setProvider] = useState<'gemini' | 'ollama'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('gemma:2b');
  const [prompt, setPrompt] = useState('Analise se um endpoint C# que recebe CPF via GET query parameter viola a LGPD.');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LLMTestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.testLLM({
        provider,
        api_key: apiKey || undefined,
        gemini_model: 'gemini-3.5-flash',
        ollama_base_url: ollamaUrl,
        ollama_model: ollamaModel,
        prompt
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Falha ao executar o teste da LLM');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '32px auto', padding: '0 16px' }}>
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu color="var(--accent-cyan)" /> Configuração & Teste do Provedor de IA
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
          Escolha entre a API de Nuvem (Google Gemini <code className="code-font" style={{ color: 'var(--accent-cyan)' }}>gemini-3.5-flash</code> com Rate Limiter de 14 RPM) ou um modelo Ollama local (ex: Gemma, Qwen).
        </p>

        {/* Provedor Radio Group */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div
            onClick={() => setProvider('gemini')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: provider === 'gemini' ? '2px solid var(--accent-indigo)' : '1px solid var(--border-color)',
              background: provider === 'gemini' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(0,0,0,0.2)',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '4px', color: provider === 'gemini' ? 'var(--accent-indigo)' : 'var(--text-main)' }}>
              Google Gemini API (gemini-3.5-flash)
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Usa a chave de API e o modelo exclusivo <strong>gemini-3.5-flash</strong> com Rate Limiter estrito de <strong>14 req/min</strong>.
            </div>
          </div>

          <div
            onClick={() => setProvider('ollama')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: provider === 'ollama' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
              background: provider === 'ollama' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(0,0,0,0.2)',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '4px', color: provider === 'ollama' ? 'var(--accent-cyan)' : 'var(--text-main)' }}>
              Ollama Local
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Roda 100% offline em <code>http://localhost:11434</code> (ex: gemma:2b, gemma:12b, gemma:26b, qwen3.5:2b).
            </div>
          </div>
        </div>

        {/* Options for Gemini */}
        {provider === 'gemini' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--accent-amber)' }}>
              <AlertTriangle size={16} />
              <span><strong>Modelo Fixo:</strong> Usando exclusivamente o <strong>gemini-3.5-flash</strong> com Rate Limiter de <strong>14 requisições/minuto</strong>.</span>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Gemini API Key (Opcional se já estiver configurada no .env do Backend):
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Key size={18} style={{ alignSelf: 'center', color: 'var(--text-dim)' }} />
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Options for Ollama */}
        {provider === 'ollama' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Base URL do Ollama:</label>
                <input
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Nome do Modelo Local:</label>
                <input
                  type="text"
                  placeholder="gemma:2b, gemma:12b, gemma:26b, qwen3.5:2b..."
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Prompt Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Prompt de Teste:</label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>

        <button
          className="btn-primary"
          onClick={handleTest}
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {loading ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
          {loading ? 'Processando com gemini-3.5-flash (Aguarde)...' : 'Testar Resposta da IA'}
        </button>
      </div>

      {/* Error View */}
      {error && (
        <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-rose)', marginBottom: '24px' }}>
          <div style={{ color: 'var(--accent-rose)', fontWeight: 700, marginBottom: '4px' }}>Erro na Comunicação com LLM</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{error}</div>
        </div>
      )}

      {/* Result View */}
      {result && (
        <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid var(--accent-emerald)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: 700, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={18} /> Resposta Recebida com Sucesso
            </span>
            <span className="code-font" style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              Provedor: {result.health.provider} ({result.health.model || result.health.current_model || 'gemini-3.5-flash'})
            </span>
          </div>

          <div className="code-font" style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: '1.6' }}>
            {result.response}
          </div>
        </div>
      )}
    </div>
  );
};
