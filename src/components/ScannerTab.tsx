import React, { useState, useEffect } from 'react';
import { api, AuditScanResult } from '../services/api';

export const ScannerTab: React.FC = () => {
  const [scanMode, setScanMode] = useState<'zip' | 'git'>('zip');

  // Estado para Upload ZIP
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Estado para Repositório Git
  const [gitUrl, setGitUrl] = useState('https://github.com/flaviofilho001/AuditoriaBack.git');
  const [gitBranch, setGitBranch] = useState('main');
  const [gitToken, setGitToken] = useState('');

  // Configurações Globais do Escaneamento
  const [provider, setProvider] = useState<'gemini' | 'ollama'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('gemma:2b');
  const [detectedOllamaModels, setDetectedOllamaModels] = useState<string[]>([]);
  const [isDetectingOllama, setIsDetectingOllama] = useState(false);
  const [ollamaDetectError, setOllamaDetectError] = useState<string | null>(null);
  const [useAi, setUseAi] = useState(true);

  // Carrega chave e auto-detecta Ollama ao iniciar
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
    const savedOllama = localStorage.getItem('ollama_url');
    if (savedOllama) setOllamaUrl(savedOllama);

    // Tenta detectar modelos do Ollama local
    autoDetectOllama(savedOllama || 'http://localhost:11434');
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

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    localStorage.setItem('gemini_api_key', val);
  };

  const handleOllamaUrlChange = (val: string) => {
    setOllamaUrl(val);
    localStorage.setItem('ollama_url', val);
    autoDetectOllama(val);
  };

  // Estados do Scanner e Resultados
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<AuditScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSeverityFilter, setActiveSeverityFilter] = useState<string>('ALL');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.zip')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Por favor envie apenas arquivos compactados com extensão .zip');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.name.endsWith('.zip')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Por favor envie apenas arquivos compactados com extensão .zip');
      }
    }
  };

  const handleExecuteScan = async () => {
    setIsScanning(true);
    setError(null);
    setScanResult(null);

    try {
      let result: AuditScanResult;

      if (scanMode === 'zip') {
        if (!selectedFile) {
          throw new Error('Selecione ou arraste um arquivo .zip antes de iniciar o escaneamento.');
        }
        result = await api.scanZipFile(
          selectedFile,
          provider,
          apiKey || undefined,
          ollamaUrl || undefined,
          ollamaModel || undefined,
          useAi
        );
      } else {
        if (!gitUrl.trim()) {
          throw new Error('Insira a URL do repositório Git antes de iniciar.');
        }
        result = await api.scanGitUrl({
          git_url: gitUrl,
          branch: gitBranch,
          access_token: gitToken || undefined,
          provider,
          api_key: apiKey || undefined,
          ollama_base_url: ollamaUrl || undefined,
          ollama_model: ollamaModel || undefined,
          use_ai: useAi
        });
      }

      if (useAi && provider === 'ollama' && result.summary.ai_executive_summary.includes('Não foi possível conectar ao Ollama')) {
        try {
          const prompt = `Você é um Auditor Sênior GRC. Analise este resumo de achados da API:\nTotal de Arquivos: ${result.summary.total_files_scanned}, Total de Achados: ${result.summary.total_findings}, Achados principais: ${result.findings.slice(0, 5).map(f => f.title).join('; ')}.\nFaça um resumo executivo com recomendações de segurança.`;
          const directSummary = await api.generateDirectOllamaCompletion(ollamaUrl, ollamaModel, prompt);
          if (directSummary) {
            result.summary.ai_executive_summary = `[Gerado via Navegador Seguro no Modelo Local ${ollamaModel}]\n\n` + directSummary;
          }
        } catch {
          // Mantém mensagem original
        }
      }

      setScanResult(result);
    } catch (err: any) {
      setError(err.message || 'Falha ao executar a auditoria.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleDownloadReport = async (format: 'html' | 'markdown' | 'sarif' | 'graphml') => {
    if (!scanResult) return;
    setIsExporting(true);
    try {
      const reportData = await api.exportReport(scanResult, format);

      let blob: Blob;
      let filename = `relatorio_conformidade_${format}.${format === 'markdown' ? 'md' : format}`;
      if (format === 'graphml') filename = 'grafo_conhecimento_graphrag.graphml';

      if (format === 'sarif') {
        const jsonStr = JSON.stringify(reportData, null, 2);
        blob = new Blob([jsonStr], { type: 'application/json' });
      } else {
        blob = reportData as Blob;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Erro ao baixar relatório: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredFindings = scanResult?.findings.filter((f) => {
    if (activeSeverityFilter === 'ALL') return true;
    return f.severity === activeSeverityFilter;
  }) || [];

  return (
    <div style={{ maxWidth: '1100px', margin: '32px auto', padding: '0 16px' }}>

      {/* Box de Seleção de Modo */}
      <div className="brutal-card" style={{ padding: '28px', marginBottom: '24px', background: '#FFFFFF' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--accent-pink)' }}></i> Auditoria de Conformidade GRC
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', fontWeight: 500 }}>
          Escolha como deseja enviar o código da sua API para ser auditado pela AST, GraphRAG e pela IA (<code>gemini-3.5-flash</code> com 14 RPM / Ollama).
        </p>

        {/* Abas ZIP vs Git */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div
            onClick={() => setScanMode('zip')}
            style={{
              padding: '18px',
              borderRadius: '8px',
              border: scanMode === 'zip' ? 'var(--border-thick)' : 'var(--border-thin)',
              background: scanMode === 'zip' ? 'var(--accent-yellow)' : '#FFFFFF',
              boxShadow: scanMode === 'zip' ? 'var(--shadow-brutal)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              transition: 'all 0.15s ease'
            }}
          >
            <i className="fa-solid fa-file-zipper" style={{ fontSize: '1.8rem', color: '#000000' }}></i>
            <div>
              <div style={{ fontWeight: 800, fontFamily: 'var(--font-title)', color: '#000000', fontSize: '1rem' }}>
                Upload de Arquivo (.zip)
              </div>
              <div style={{ fontSize: '0.82rem', color: '#000000', fontWeight: 500 }}>
                Envie um arquivo compactado do projeto (C#, Go, Python, Java, TS).
              </div>
            </div>
          </div>

          <div
            onClick={() => setScanMode('git')}
            style={{
              padding: '18px',
              borderRadius: '8px',
              border: scanMode === 'git' ? 'var(--border-thick)' : 'var(--border-thin)',
              background: scanMode === 'git' ? 'var(--accent-cyan)' : '#FFFFFF',
              boxShadow: scanMode === 'git' ? 'var(--shadow-brutal)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              transition: 'all 0.15s ease'
            }}
          >
            <i className="fa-solid fa-code-branch" style={{ fontSize: '1.8rem', color: '#000000' }}></i>
            <div>
              <div style={{ fontWeight: 800, fontFamily: 'var(--font-title)', color: '#000000', fontSize: '1rem' }}>
                Repositório Git (URL)
              </div>
              <div style={{ fontSize: '0.82rem', color: '#000000', fontWeight: 500 }}>
                Cole a URL pública ou privada do GitHub/GitLab para clonar e auditar.
              </div>
            </div>
          </div>
        </div>

        {/* Input Area: Modo ZIP */}
        {scanMode === 'zip' && (
          <div style={{ marginBottom: '24px' }}>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleFileDrop}
              style={{
                border: isDragOver ? '3px dashed #000000' : 'var(--border-thick)',
                background: isDragOver ? 'var(--accent-yellow)' : '#F9FAFB',
                borderRadius: '8px',
                padding: '36px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-brutal-sm)',
                transition: 'all 0.15s ease'
              }}
              onClick={() => document.getElementById('zip-file-input')?.click()}
            >
              <i className="fa-solid fa-upload" style={{ fontSize: '2.4rem', color: '#000000', marginBottom: '14px' }}></i>
              {selectedFile ? (
                <div>
                  <div style={{ fontWeight: 800, fontFamily: 'var(--font-title)', color: 'var(--accent-emerald)', fontSize: '1.1rem' }}>
                    <i className="fa-solid fa-circle-check"></i> Arquivo Selecionado: {selectedFile.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 600 }}>
                    Tamanho: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Clique ou solte outro arquivo para substituir.
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 800, fontFamily: 'var(--font-title)', fontSize: '1.05rem', color: '#000000' }}>
                    Arraste e solte o arquivo <strong>.zip</strong> da sua aplicação aqui
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 500 }}>
                    ou clique para procurar no seu computador
                  </div>
                </div>
              )}
              <input
                id="zip-file-input"
                type="file"
                accept=".zip"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        )}

        {/* Input Area: Modo Git */}
        {scanMode === 'git' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px', background: '#ECFEFF', padding: '18px', borderRadius: '8px', border: 'var(--border-thin)' }}>
            <div>
              <label style={{ fontSize: '0.88rem', fontWeight: 800, fontFamily: 'var(--font-title)', display: 'block', marginBottom: '6px' }}>
                URL do Repositório Git:
              </label>
              <input
                type="text"
                value={gitUrl}
                onChange={(e) => setGitUrl(e.target.value)}
                placeholder="https://github.com/usuario/repositorio.git"
                style={{ width: '100%' }}
                className="code-font"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.88rem', fontWeight: 800, fontFamily: 'var(--font-title)', display: 'block', marginBottom: '6px' }}>
                  Branch:
                </label>
                <input
                  type="text"
                  value={gitBranch}
                  onChange={(e) => setGitBranch(e.target.value)}
                  placeholder="main"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.88rem', fontWeight: 800, fontFamily: 'var(--font-title)', display: 'block', marginBottom: '6px' }}>
                  Token de Acesso Pessoal (Para Repositórios Privados):
                </label>
                <input
                  type="password"
                  value={gitToken}
                  onChange={(e) => setGitToken(e.target.value)}
                  placeholder="ghp_..."
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Configurações Adicionais de IA */}
        <div style={{ background: '#FFFBEB', padding: '18px', borderRadius: '8px', border: 'var(--border-thin)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>Provedor IA:</label>
                <select value={provider} onChange={(e) => setProvider(e.target.value as any)} style={{ fontWeight: 700 }}>
                  <option value="gemini">Google Gemini (gemini-3.5-flash com SDK)</option>
                  <option value="ollama">Ollama (Detector Automático de Modelos)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="use-ai-check"
                  checked={useAi}
                  onChange={(e) => setUseAi(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="use-ai-check" style={{ fontSize: '0.88rem', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-title)' }}>
                  Habilitar Resumo Executivo da IA
                </label>
              </div>
            </div>

            {/* Input da Chave do Gemini */}
            {provider === 'gemini' && (
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'var(--font-title)', display: 'block', marginBottom: '6px', color: '#000000' }}>
                  Sua Gemini API Key (Salva no seu navegador):
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ padding: '10px 12px', background: '#FFFFFF', border: 'var(--border-thick)', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                    <i className="fa-solid fa-key" style={{ color: '#000000' }}></i>
                  </div>
                  <input
                    type="password"
                    placeholder="Cole sua API Key do Google Gemini (ex: AIzaSy...)"
                    value={apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    style={{ flex: 1, fontSize: '0.88rem' }}
                  />
                </div>
              </div>
            )}

            {/* Seleção e Detecção do Ollama */}
            {provider === 'ollama' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* INSTRUÇÕES DO LOCALTUNNEL */}
                <div style={{ background: '#FFFFFF', border: 'var(--border-thick)', borderRadius: '8px', padding: '14px', boxShadow: 'var(--shadow-brutal-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: '#000000', fontWeight: 800, fontFamily: 'var(--font-title)', fontSize: '0.92rem' }}>
                    <i className="fa-solid fa-globe" style={{ color: 'var(--accent-cyan)' }}></i> Como conectar a nuvem ao seu Ollama local?
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#000000', lineHeight: '1.6', fontWeight: 500 }}>
                    Abra o <strong>Terminal ou PowerShell</strong> no seu computador e cole o comando abaixo:
                  </div>
                  <div className="code-font" style={{ background: '#000000', color: 'var(--accent-yellow)', padding: '10px 14px', borderRadius: '6px', margin: '8px 0', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, border: '2px solid #000' }}>
                    <i className="fa-solid fa-terminal"></i> <span>npx localtunnel --port 11434</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Ele vai gerar um link (ex: <code>https://algo.loca.lt</code>). Copie e cole esse link no campo <strong>Base URL</strong> logo abaixo e clique em Detectar!
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2.5fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'var(--font-title)', display: 'block', marginBottom: '6px' }}>
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
                    <label style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'var(--font-title)', display: 'block', marginBottom: '6px' }}>
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
                        style={{ whiteSpace: 'nowrap', padding: '0 14px' }}
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
          </div>
        </div>

        {/* Botão de Disparo */}
        <button
          className="btn-primary"
          onClick={handleExecuteScan}
          disabled={isScanning}
          style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '1rem' }}
        >
          {isScanning ? <i className="fa-solid fa-rotate fa-spin"></i> : <i className="fa-solid fa-arrow-right"></i>}
          {isScanning
            ? (scanMode === 'zip' ? 'Descompactando & Auditando Código...' : 'Clonando Git & Auditando Código...')
            : 'Iniciar Auditoria de Conformidade'}
        </button>
      </div>

      {/* Exibição de Erro */}
      {error && (
        <div className="brutal-card" style={{ padding: '20px', background: '#FEE2E2', borderLeft: '8px solid var(--accent-rose)', marginBottom: '24px' }}>
          <div style={{ color: 'var(--accent-rose)', fontWeight: 800, fontFamily: 'var(--font-title)', fontSize: '1.1rem', marginBottom: '6px' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i> Erro ao Executar Auditoria
          </div>
          <div style={{ fontSize: '0.9rem', color: '#000000', whiteSpace: 'pre-wrap', fontWeight: 500 }}>{error}</div>
        </div>
      )}

      {/* Resultados do Escaneamento */}
      {scanResult && (
        <div>
          {/* Barra de Ações e Exportação de Relatórios */}
          <div className="brutal-card" style={{ padding: '20px 24px', marginBottom: '24px', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ fontWeight: 800, fontFamily: 'var(--font-title)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-download" style={{ color: 'var(--accent-pink)', fontSize: '1.2rem' }}></i>
              <span>Exportar Relatórios GRC:</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                className="btn-secondary"
                onClick={() => handleDownloadReport('html')}
                disabled={isExporting}
                style={{ fontSize: '0.85rem' }}
              >
                <i className="fa-solid fa-file-lines" style={{ color: 'var(--accent-emerald)' }}></i> Relatório Executivo (HTML)
              </button>
              <button
                className="btn-secondary"
                onClick={() => handleDownloadReport('markdown')}
                disabled={isExporting}
                style={{ fontSize: '0.85rem' }}
              >
                <i className="fa-solid fa-file-code" style={{ color: 'var(--accent-purple)' }}></i> Comentário PR (Markdown)
              </button>
              <button
                className="btn-secondary"
                onClick={() => handleDownloadReport('sarif')}
                disabled={isExporting}
                style={{ fontSize: '0.85rem' }}
              >
                <i className="fa-solid fa-code" style={{ color: 'var(--accent-amber)' }}></i> GitHub Security (SARIF)
              </button>
              <button
                className="btn-secondary"
                onClick={() => handleDownloadReport('graphml')}
                disabled={isExporting}
                style={{ fontSize: '0.85rem' }}
              >
                <i className="fa-solid fa-layer-group" style={{ color: 'var(--accent-cyan)' }}></i> Grafo de Conhecimento (.graphml)
              </button>
            </div>
          </div>

          <div style={{ padding: '0 24px 24px 24px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            <strong>Dica de Visualização 3D:</strong> Baixe o arquivo <code>.graphml</code> acima e arraste-o para o site <a href="https://noworneverev.github.io/graphrag-visualizer/#/upload" target="_blank" rel="noreferrer" style={{ color: '#000000', fontWeight: 800, textDecoration: 'underline' }}>GraphRAG Visualizer</a> para ver o mapa do seu código!
          </div>

          {/* Cards com Métricas Gerais */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '24px' }}>
            <div className="brutal-card" style={{ padding: '20px', textAlign: 'center', background: 'var(--accent-cyan)' }}>
              <div style={{ fontSize: '0.8rem', color: '#000000', textTransform: 'uppercase', fontWeight: 800, fontFamily: 'var(--font-title)' }}>Arquivos Analisados</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: '#000000' }}>{scanResult.summary.total_files_scanned}</div>
            </div>

            <div className="brutal-card" style={{ padding: '20px', textAlign: 'center', background: 'var(--accent-pink)' }}>
              <div style={{ fontSize: '0.8rem', color: '#FFFFFF', textTransform: 'uppercase', fontWeight: 800, fontFamily: 'var(--font-title)' }}>Total de Achados</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: '#FFFFFF' }}>{scanResult.summary.total_findings}</div>
            </div>

            <div className="brutal-card" style={{ padding: '20px', textAlign: 'center', background: 'var(--accent-yellow)' }}>
              <div style={{ fontSize: '0.8rem', color: '#000000', textTransform: 'uppercase', fontWeight: 800, fontFamily: 'var(--font-title)' }}>Nós no Grafo de Código</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: '#000000' }}>{scanResult.summary.graph_summary.total_nodes}</div>
            </div>

            <div className="brutal-card" style={{ padding: '20px', textAlign: 'center', background: '#FFFFFF' }}>
              <div style={{ fontSize: '0.8rem', color: '#000000', textTransform: 'uppercase', fontWeight: 800, fontFamily: 'var(--font-title)' }}>Endpoints Mapeados</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: '#000000' }}>{scanResult.summary.graph_summary.endpoints_count}</div>
            </div>
          </div>

          {/* Resumo Executivo da IA */}
          {scanResult.summary.ai_executive_summary && (
            <div className="brutal-card" style={{ padding: '28px', background: '#FFFFFF', borderLeft: '8px solid var(--accent-yellow)', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '14px', color: '#000000', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fa-solid fa-microchip" style={{ color: 'var(--accent-pink)' }}></i> Resumo Executivo da IA (gemini-3.5-flash / {ollamaModel})
              </h3>
              <div className="code-font" style={{ fontSize: '0.92rem', lineHeight: '1.7', whiteSpace: 'pre-wrap', color: '#000000', background: '#F9FAFB', padding: '20px', borderRadius: '8px', border: 'var(--border-thin)', boxShadow: 'var(--shadow-brutal-sm)' }}>
                {scanResult.summary.ai_executive_summary}
              </div>
            </div>
          )}

          {/* Filtros e Lista de Vulnerabilidades */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fa-solid fa-shield-cat" style={{ color: 'var(--accent-rose)' }}></i> Achados de Conformidade GRC ({filteredFindings.length})
              </h3>

              {/* Botões de Filtro */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setActiveSeverityFilter(sev)}
                    className="btn-secondary"
                    style={{
                      padding: '6px 14px',
                      fontSize: '0.8rem',
                      background: activeSeverityFilter === sev ? 'var(--accent-yellow)' : '#FFFFFF',
                      fontWeight: activeSeverityFilter === sev ? 800 : 600,
                      boxShadow: activeSeverityFilter === sev ? 'var(--shadow-brutal-sm)' : 'none'
                    }}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Cards de Achados */}
            {filteredFindings.length === 0 ? (
              <div className="brutal-card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, background: '#FFFFFF' }}>
                Nenhum achado encontrado para o filtro selecionado ({activeSeverityFilter}).
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {filteredFindings.map((f) => (
                  <div
                    key={f.id}
                    className="brutal-card"
                    style={{
                      padding: '24px',
                      background: '#FFFFFF',
                      borderLeft: f.severity === 'CRITICAL' ? '8px solid var(--accent-rose)' : f.severity === 'HIGH' ? '8px solid var(--accent-amber)' : '8px solid var(--accent-cyan)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <span className={`badge badge-${f.severity.toLowerCase()}`} style={{ marginRight: '10px' }}>{f.severity}</span>
                        <span className="code-font" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)' }}>{f.rule_id}</span>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '6px', color: '#000000' }}>{f.title}</h4>
                      </div>
                      <span className="code-font" style={{ fontSize: '0.82rem', background: 'var(--accent-yellow)', padding: '6px 12px', borderRadius: '6px', border: 'var(--border-thin)', fontWeight: 700, color: '#000000', boxShadow: '2px 2px 0px #000' }}>
                        {f.location.file_path}:{f.location.line_start}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.92rem', color: '#000000', marginBottom: '14px', fontWeight: 500, lineHeight: 1.5 }}>
                      {f.description}
                    </p>

                    {/* Trecho de Código */}
                    {f.location.snippet && (
                      <div className="code-font" style={{ background: '#000000', color: '#FFFFFF', padding: '14px', borderRadius: '6px', border: '2px solid #000000', marginBottom: '14px', boxShadow: 'var(--shadow-brutal-sm)' }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--accent-yellow)', marginBottom: '4px', fontWeight: 700 }}>Trecho de Código Afetado:</div>
                        <code style={{ color: '#FFFFFF', fontSize: '0.88rem' }}>{f.location.snippet}</code>
                      </div>
                    )}

                    {/* Mapeamentos GRC e Recomendação */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: '#F9FAFB', padding: '16px', borderRadius: '8px', border: 'var(--border-thin)' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: '#000000', display: 'block', marginBottom: '6px' }}>CONTROLES GRC MAPEADOS:</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {f.grc_mappings.map((g, i) => (
                            <div key={i} style={{ fontSize: '0.85rem', color: '#000000', fontWeight: 600 }}>
                              <strong>{g.framework} ({g.control_id}):</strong> {g.title}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: '#000000', display: 'block', marginBottom: '6px' }}>RECOMENDAÇÃO DE REPARO:</span>
                        <span style={{ fontSize: '0.85rem', color: '#000000', fontWeight: 500 }}>{f.recommendation}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
