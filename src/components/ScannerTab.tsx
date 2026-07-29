import React, { useState, useEffect } from 'react';
import { 
  Upload, GitBranch, Search, ShieldAlert, FileCode, CheckCircle2, 
  AlertTriangle, RefreshCw, Key, Layers, Cpu, FileArchive, ArrowRight,
  Download, FileText, Code, Globe
} from 'lucide-react';
import { api, AuditScanResult, VulnerabilityFinding } from '../services/api';

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
  const [useAi, setUseAi] = useState(true);

  // Carrega chave do localStorage ao iniciar
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
    const savedOllama = localStorage.getItem('ollama_url');
    if (savedOllama) setOllamaUrl(savedOllama);
  }, []);

  // Salva no localStorage quando alterado
  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    localStorage.setItem('gemini_api_key', val);
  };

  const handleOllamaUrlChange = (val: string) => {
    setOllamaUrl(val);
    localStorage.setItem('ollama_url', val);
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
          undefined,
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
          use_ai: useAi
        });
      }

      setScanResult(result);
    } catch (err: any) {
      setError(err.message || 'Falha ao executar a auditoria.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleDownloadReport = async (format: 'html' | 'markdown' | 'sarif') => {
    if (!scanResult) return;
    setIsExporting(true);
    try {
      const reportData = await api.exportReport(scanResult, format);
      
      let blob: Blob;
      let filename = `relatorio_conformidade_${format}.${format === 'markdown' ? 'md' : format}`;

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
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search color="var(--accent-indigo)" /> Auditoria de Conformidade GRC
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
          Escolha como deseja enviar o código da sua API para ser auditado pela AST, GraphRAG e pela IA (<code>gemini-1.5-flash</code> com 14 RPM / Ollama).
        </p>

        {/* Abas ZIP vs Git */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div
            onClick={() => setScanMode('zip')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: scanMode === 'zip' ? '2px solid var(--accent-indigo)' : '1px solid var(--border-color)',
              background: scanMode === 'zip' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(0,0,0,0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <FileArchive size={24} color={scanMode === 'zip' ? 'var(--accent-indigo)' : 'var(--text-dim)'} />
            <div>
              <div style={{ fontWeight: 700, color: scanMode === 'zip' ? 'var(--accent-indigo)' : 'var(--text-main)' }}>
                📦 Upload de Arquivo (.zip)
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Envie um arquivo compactado do projeto (C#, Go, Python, Java, TS).
              </div>
            </div>
          </div>

          <div
            onClick={() => setScanMode('git')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: scanMode === 'git' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
              background: scanMode === 'git' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(0,0,0,0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <GitBranch size={24} color={scanMode === 'git' ? 'var(--accent-cyan)' : 'var(--text-dim)'} />
            <div>
              <div style={{ fontWeight: 700, color: scanMode === 'git' ? 'var(--accent-cyan)' : 'var(--text-main)' }}>
                🔗 Repositório Git (URL)
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Cole a URL pública ou privada do GitHub/GitLab para clonar e auditar.
              </div>
            </div>
          </div>
        </div>

        {/* Input Area: Modo ZIP */}
        {scanMode === 'zip' && (
          <div style={{ marginBottom: '20px' }}>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleFileDrop}
              style={{
                border: isDragOver ? '2px dashed var(--accent-indigo)' : '2px dashed var(--border-color)',
                background: isDragOver ? 'rgba(99, 102, 241, 0.08)' : 'rgba(0,0,0,0.2)',
                borderRadius: '12px',
                padding: '32px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => document.getElementById('zip-file-input')?.click()}
            >
              <Upload size={32} color="var(--accent-indigo)" style={{ marginBottom: '12px' }} />
              {selectedFile ? (
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--accent-emerald)', fontSize: '1rem' }}>
                    ✓ Arquivo Selecionado: {selectedFile.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Tamanho: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Clique ou solte outro arquivo para substituir.
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    Arraste e solte o arquivo <strong>.zip</strong> da sua aplicação aqui
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '10px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>URL do Repositório Git:</label>
              <input
                type="text"
                value={gitUrl}
                onChange={(e) => setGitUrl(e.target.value)}
                placeholder="https://github.com/usuario/repositorio.git"
                style={{ width: '100%' }}
                className="code-font"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Branch:</label>
                <input
                  type="text"
                  value={gitBranch}
                  onChange={(e) => setGitBranch(e.target.value)}
                  placeholder="main"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Token de Acesso Pessoal (Para Repositórios Privados):</label>
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
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Provedor IA:</label>
                <select value={provider} onChange={(e) => setProvider(e.target.value as any)}>
                  <option value="gemini">Google Gemini (gemini-1.5-flash)</option>
                  <option value="ollama">Ollama (Servidor Local ou Ngrok)</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="use-ai-check"
                  checked={useAi}
                  onChange={(e) => setUseAi(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="use-ai-check" style={{ fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>
                  Habilitar Resumo Executivo da IA
                </label>
              </div>
            </div>

            {/* Input da Chave do Gemini com Persistência */}
            {provider === 'gemini' && (
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px', color: 'var(--accent-indigo)' }}>
                  Sua Gemini API Key (Salva no navegador):
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Key size={16} style={{ alignSelf: 'center', color: 'var(--text-dim)' }} />
                  <input
                    type="password"
                    placeholder="Cole sua API Key do Google Gemini (ex: AIzaSy...)"
                    value={apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    style={{ flex: 1, fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            )}

            {/* Input da URL do Ollama com Aviso Ngrok */}
            {provider === 'ollama' && (
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px', color: 'var(--accent-cyan)' }}>
                  Ollama Base URL:
                </label>
                <input
                  type="text"
                  placeholder="http://localhost:11434 ou https://xxx.ngrok-free.app"
                  value={ollamaUrl}
                  onChange={(e) => handleOllamaUrlChange(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
                <div style={{ fontSize: '0.78rem', color: 'var(--accent-amber)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={14} />
                  <span><strong>Nota para deploy na nuvem:</strong> Para o backend no Railway se conectar ao seu Ollama local, exponha a porta rodando <code>ngrok http 11434</code> e cola a URL pública do Ngrok acima.</span>
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
          style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}
        >
          {isScanning ? <RefreshCw className="animate-spin" size={20} /> : <ArrowRight size={20} />}
          {isScanning 
            ? (scanMode === 'zip' ? 'Descompactando & Auditando Código...' : 'Clonando Git & Auditando Código...') 
            : 'Iniciar Auditoria de Conformidade'}
        </button>
      </div>

      {/* Exibição de Erro */}
      {error && (
        <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-rose)', marginBottom: '24px' }}>
          <div style={{ color: 'var(--accent-rose)', fontWeight: 700, marginBottom: '4px' }}>Erro ao Executar Auditoria</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>{error}</div>
        </div>
      )}

      {/* Resultados do Escaneamento */}
      {scanResult && (
        <div>
          {/* Barra de Ações e Exportação de Relatórios */}
          <div className="glass-card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download color="var(--accent-cyan)" size={20} />
              <span>Exportar Relatórios GRC:</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className="btn-secondary"
                onClick={() => handleDownloadReport('html')}
                disabled={isExporting}
                style={{ fontSize: '0.82rem' }}
              >
                <FileText size={15} color="var(--accent-emerald)" /> Relatório Executivo (HTML)
              </button>
              <button
                className="btn-secondary"
                onClick={() => handleDownloadReport('markdown')}
                disabled={isExporting}
                style={{ fontSize: '0.82rem' }}
              >
                <FileCode size={15} color="var(--accent-indigo)" /> Comentário PR (Markdown)
              </button>
              <button
                className="btn-secondary"
                onClick={() => handleDownloadReport('sarif')}
                disabled={isExporting}
                style={{ fontSize: '0.82rem' }}
              >
                <Code size={15} color="var(--accent-amber)" /> GitHub Security (SARIF)
              </button>
            </div>
          </div>

          {/* Cards com Métricas Gerais */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Arquivos Analisados</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{scanResult.summary.total_files_scanned}</div>
            </div>

            <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total de Achados</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-rose)' }}>{scanResult.summary.total_findings}</div>
            </div>

            <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Nós no Grafo de Código</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>{scanResult.summary.graph_summary.total_nodes}</div>
            </div>

            <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Endpoints Mapeados</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{scanResult.summary.graph_summary.endpoints_count}</div>
            </div>
          </div>

          {/* Resumo Executivo da IA */}
          {scanResult.summary.ai_executive_summary && (
            <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid var(--accent-indigo)', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={20} /> Resumo Executivo da IA (gemini-1.5-flash / GraphRAG)
              </h3>
              <div className="code-font" style={{ fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: 'var(--text-main)', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px' }}>
                {scanResult.summary.ai_executive_summary}
              </div>
            </div>
          )}

          {/* Filtros e Lista de Vulnerabilidades */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert color="var(--accent-rose)" /> Achados de Conformidade GRC ({filteredFindings.length})
              </h3>

              {/* Botões de Filtro */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setActiveSeverityFilter(sev)}
                    className="btn-secondary"
                    style={{
                      padding: '4px 12px',
                      fontSize: '0.75rem',
                      background: activeSeverityFilter === sev ? 'var(--accent-indigo)' : 'rgba(255,255,255,0.05)',
                      color: activeSeverityFilter === sev ? 'white' : 'var(--text-main)',
                      borderColor: activeSeverityFilter === sev ? 'var(--accent-indigo)' : 'var(--border-color)'
                    }}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Cards de Achados */}
            {filteredFindings.length === 0 ? (
              <div className="glass-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Nenhum achado encontrado para o filtro selecionado ({activeSeverityFilter}).
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredFindings.map((f) => (
                  <div
                    key={f.id}
                    className="glass-card"
                    style={{
                      padding: '20px',
                      borderLeft: f.severity === 'CRITICAL' ? '4px solid var(--accent-rose)' : f.severity === 'HIGH' ? '4px solid var(--accent-amber)' : '4px solid var(--accent-cyan)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <span className={`badge badge-${f.severity.toLowerCase()}`} style={{ marginRight: '8px' }}>{f.severity}</span>
                        <span className="code-font" style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{f.rule_id}</span>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '4px' }}>{f.title}</h4>
                      </div>
                      <span className="code-font" style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        {f.location.file_path}:{f.location.line_start}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      {f.description}
                    </p>

                    {/* Trecho de Código */}
                    {f.location.snippet && (
                      <div className="code-font" style={{ background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '12px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Trecho de Código Afetado:</div>
                        <code style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>{f.location.snippet}</code>
                      </div>
                    )}

                    {/* Mapeamentos GRC e Recomendação */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-indigo)', display: 'block', marginBottom: '4px' }}>CONTROLES GRC MAPEADOS:</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {f.grc_mappings.map((g, i) => (
                            <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                              <strong>{g.framework} ({g.control_id}):</strong> {g.title}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-emerald)', display: 'block', marginBottom: '4px' }}>RECOMENDAÇÃO DE REPARO:</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{f.recommendation}</span>
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
