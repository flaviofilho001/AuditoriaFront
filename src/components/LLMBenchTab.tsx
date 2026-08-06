import React, { useState, useEffect } from 'react';
import { api, LLMTestResponse } from '../services/api';

export const LLMBenchTab: React.FC = () => {
  const [provider, setProvider] = useState<'gemini' | 'ollama'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('gemma:2b');
  const [prompt, setPrompt] = useState('Analise se um endpoint C# que recebe CPF via GET query parameter viola a LGPD.');
  
  const [detectedOllamaModels, setDetectedOllamaModels] = useState<string[]>([]);
  const [isDetectingOllama, setIsDetectingOllama] = useState(false);
  const [ollamaDetectError, setOllamaDetectError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LLMTestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
    const savedOllama = localStorage.getItem('ollama_url');
    if (savedOllama) {
      setOllamaUrl(savedOllama);
      autoDetectOllama(savedOllama);
    } else {
      autoDetectOllama('http://localhost:11434');
    }
  }, []);

  const autoDetectOllama = async (urlToTest: string) => {
    setIsDetectingOllama(true);
    setOllamaDetectError(null);
    try {
      const models = await api.detectLocalOllamaModels(urlToTest);
      setDetectedOllamaModels(models);
      if (models.length > 0 && !models.includes(ollamaModel)) {
        setOllamaModel(models[0]);
      }
    } catch (err: any) {
      setOllamaDetectError(err.message);
      setDetectedOllamaModels([]);
    } finally {
      setIsDetectingOllama(false);
    }
  };

  const handleKeyChange = (val: string) => {
    setApiKey(val);
    localStorage.setItem('gemini_api_key', val);
  };

  const handleOllamaUrlChange = (val: string) => {
    setOllamaUrl(val);
    localStorage.setItem('ollama_url', val);
    autoDetectOllama(val);
  };

  const handleTest = async () => {
    if (provider === 'gemini' && !apiKey.trim()) {
      setError('Por favor insira sua Gemini API Key antes de testar.');
      return;
    }

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
      <div className="brutal-card" style={{ padding: '28px', marginBottom: '24px', background: '#FFFFFF' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-microchip" style={{ color: 'var(--accent-cyan)' }}></i> Configuração & Teste da IA (Google GenAI SDK)
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', fontWeight: 500 }}>
          Testador oficial usando o modelo <code className="code-font" style={{ background: 'var(--accent-yellow)', padding: '2px 6px', border: '1px solid #000', borderRadius: '4px', color: '#000', fontWeight: 700 }}>gemini-3.5-flash</code> (via SDK <code>google-genai</code> com 14 RPM) ou Ollama local.
        </p>

        {/* Provedor Radio Group */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div
            onClick={() => setProvider('gemini')}
            style={{
              padding: '18px',
              borderRadius: '8px',
              border: provider === 'gemini' ? 'var(--border-thick)' : 'var(--border-thin)',
              background: provider === 'gemini' ? 'var(--accent-yellow)' : '#FFFFFF',
              boxShadow: provider === 'gemini' ? 'var(--shadow-brutal)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontWeight: 800, fontFamily: 'var(--font-title)', fontSize: '1rem', marginBottom: '6px', color: '#000000' }}>
              <i className="fa-brands fa-google" style={{ marginRight: '8px' }}></i> Google Gemini (gemini-3.5-flash)
            </div>
            <div style={{ fontSize: '0.82rem', color: '#000000', fontWeight: 500 }}>
              Usa a SDK oficial <code>google-genai</code> e modelo <strong>gemini-3.5-flash</strong> com Rate Limiting estrito de <strong>14 req/min</strong>.
            </div>
          </div>

          <div
            onClick={() => setProvider('ollama')}
            style={{
              padding: '18px',
              borderRadius: '8px',
              border: provider === 'ollama' ? 'var(--border-thick)' : 'var(--border-thin)',
              background: provider === 'ollama' ? 'var(--accent-cyan)' : '#FFFFFF',
              boxShadow: provider === 'ollama' ? 'var(--shadow-brutal)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontWeight: 800, fontFamily: 'var(--font-title)', fontSize: '1rem', marginBottom: '6px', color: '#000000' }}>
              <i className="fa-solid fa-server" style={{ marginRight: '8px' }}></i> Ollama Local
            </div>
            <div style={{ fontSize: '0.82rem', color: '#000000', fontWeight: 500 }}>
              Detecção automática dos seus modelos locais instalados.
            </div>
          </div>
        </div>

        {/* Options for Gemini */}
        {provider === 'gemini' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px', background: '#FFFBEB', padding: '18px', borderRadius: '8px', border: 'var(--border-thin)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#000000', fontWeight: 700 }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--accent-amber)', fontSize: '1.1rem' }}></i>
              <span><strong>Google GenAI SDK:</strong> Modelo <strong>gemini-3.5-flash</strong> ativado via <code>genai.Client()</code>.</span>
            </div>
            <div>
              <label style={{ fontSize: '0.88rem', fontWeight: 800, fontFamily: 'var(--font-title)', display: 'block', marginBottom: '6px', color: '#000000' }}>
                Gemini API Key (Obrigatória):
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ padding: '12px 14px', background: '#FFFFFF', border: 'var(--border-thick)', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                  <i className="fa-solid fa-key" style={{ color: '#000000' }}></i>
                </div>
                <input
                  type="password"
                  placeholder="Cole sua API Key da Google AI (ex: AIzaSy...)"
                  value={apiKey}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 500 }}>
                Obtenha sua chave gratuitamente em <a href="https://ai.google.dev" target="_blank" rel="noreferrer" style={{ color: '#000000', fontWeight: 700, textDecoration: 'underline' }}>ai.google.dev</a>.
              </div>
            </div>
          </div>
        )}

        {/* Options for Ollama */}
        {provider === 'ollama' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '24px', background: '#ECFEFF', padding: '18px', borderRadius: '8px', border: 'var(--border-thin)' }}>
            
            {/* INSTRUÇÕES DO LOCALTUNNEL */}
            <div style={{ background: '#FFFFFF', border: 'var(--border-thick)', borderRadius: '8px', padding: '16px', boxShadow: 'var(--shadow-brutal-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: '#000000', fontWeight: 800, fontFamily: 'var(--font-title)', fontSize: '0.95rem' }}>
                <i className="fa-solid fa-globe" style={{ color: 'var(--accent-cyan)' }}></i> Como conectar a nuvem ao seu Ollama local?
              </div>
              <div style={{ fontSize: '0.88rem', color: '#000000', lineHeight: '1.6', fontWeight: 500 }}>
                Abra o <strong>Terminal ou PowerShell</strong> no seu computador e cole o comando abaixo:
              </div>
              <div className="code-font" style={{ background: '#000000', color: 'var(--accent-yellow)', padding: '12px 16px', borderRadius: '6px', margin: '10px 0', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, border: '2px solid #000' }}>
                <i className="fa-solid fa-terminal"></i> <span>npx localtunnel --port 11434</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Ele vai gerar um link (ex: <code>https://algo.loca.lt</code>). Copie e cole esse link no campo <strong>Base URL</strong> logo abaixo e clique em Detectar!
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2.5fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'var(--font-title)', display: 'block', marginBottom: '6px', color: '#000000' }}>
                  Base URL (Link do LocalTunnel):
                </label>
                <input
                  type="text"
                  placeholder="https://sua-url.loca.lt"
                  value={ollamaUrl}
                  onChange={(e) => handleOllamaUrlChange(e.target.value)}
                  style={{ width: '100%', fontSize: '0.88rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'var(--font-title)', display: 'block', marginBottom: '6px', color: '#000000' }}>
                  Modelo Selecionado:
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {detectedOllamaModels.length > 0 ? (
                    <select
                      value={ollamaModel}
                      onChange={(e) => setOllamaModel(e.target.value)}
                      style={{ flex: 1, fontWeight: 700 }}
                    >
                      {detectedOllamaModels.map((m) => (
                        <option key={m} value={m}>{m} (Instalado)</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="ex: gemma:2b, gemma:12b..."
                      value={ollamaModel}
                      onChange={(e) => setOllamaModel(e.target.value)}
                      style={{ flex: 1 }}
                    />
                  )}
                  <button
                    className="btn-secondary"
                    onClick={() => autoDetectOllama(ollamaUrl)}
                    disabled={isDetectingOllama}
                    style={{ whiteSpace: 'nowrap', padding: '0 16px' }}
                  >
                    {isDetectingOllama ? <i className="fa-solid fa-rotate fa-spin"></i> : <i className="fa-solid fa-database"></i>} Detectar
                  </button>
                </div>
              </div>
            </div>

            {/* Exibe erro ou sucesso de detecção */}
            <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>
              {ollamaDetectError ? (
                <div style={{ color: 'var(--accent-rose)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ marginTop: '2px' }}></i>
                  <span>{ollamaDetectError} <br />Siga os passos do LocalTunnel no quadro azul acima para liberar o acesso!</span>
                </div>
              ) : detectedOllamaModels.length > 0 ? (
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 800, display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <i className="fa-solid fa-circle-check"></i> {detectedOllamaModels.length} modelo(s) encontrado(s)! Tudo pronto.
                </span>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>Insira sua URL do LocalTunnel e clique em Detectar para listar seus modelos.</span>
              )}
            </div>
          </div>
        )}

        {/* Prompt Input */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 800, fontFamily: 'var(--font-title)', display: 'block', marginBottom: '6px' }}>
            Prompt de Teste:
          </label>
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
          style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '1rem' }}
        >
          {loading ? <i className="fa-solid fa-rotate fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
          {loading ? 'Processando com gemini-3.5-flash (SDK)...' : 'Testar Resposta da IA'}
        </button>
      </div>

      {/* Error View */}
      {error && (
        <div className="brutal-card" style={{ padding: '20px', background: '#FEE2E2', borderLeft: '8px solid var(--accent-rose)', marginBottom: '24px' }}>
          <div style={{ color: 'var(--accent-rose)', fontWeight: 800, fontFamily: 'var(--font-title)', fontSize: '1.1rem', marginBottom: '6px' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i> Erro na Comunicação com LLM
          </div>
          <div style={{ fontSize: '0.9rem', color: '#000000', fontWeight: 500 }}>{error}</div>
        </div>
      )}

      {/* Result View */}
      {result && (
        <div className="brutal-card" style={{ padding: '28px', background: '#FFFFFF', borderLeft: '8px solid var(--accent-emerald)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: 800, fontFamily: 'var(--font-title)', color: '#000000', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
              <i className="fa-solid fa-circle-check" style={{ color: 'var(--accent-emerald)' }}></i> Resposta Recebida com Sucesso
            </span>
            <span className="badge badge-info" style={{ fontSize: '0.8rem' }}>
              Provedor: {result.health.provider} ({result.health.model || result.health.current_model || 'gemini-3.5-flash'})
            </span>
          </div>

          <div className="code-font" style={{ background: '#F9FAFB', padding: '20px', borderRadius: '8px', border: 'var(--border-thin)', whiteSpace: 'pre-wrap', fontSize: '0.92rem', lineHeight: '1.6', color: '#000000', boxShadow: 'var(--shadow-brutal-sm)' }}>
            {result.response}
          </div>
        </div>
      )}
    </div>
  );
};
