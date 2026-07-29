import React, { useState } from 'react';
import { Search, ShieldAlert, FileCode, CheckCircle, Code, Layers, AlertCircle } from 'lucide-react';

interface MockFinding {
  id: string;
  rule_id: str;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  file: string;
  line: number;
  snippet: string;
  grc_control: string;
  description: string;
  recommendation: string;
}

export const ScannerTab: React.FC = () => {
  const [repoPath, setRepoPath] = useState('C:\\Users\\flavi\\OneDrive\\Desktop\\Programacao\\Auditor\\AuditoriaBack');
  const [targetLang, setTargetLang] = useState('all');
  const [isScanning, setIsScanning] = useState(false);
  const [findings, setFindings] = useState<MockFinding[]>([]);

  const handleStartScan = () => {
    setIsScanning(true);
    // Simulação do escaneamento de demonstração da Fase 1
    setTimeout(() => {
      setFindings([
        {
          id: 'FIND-001',
          rule_id: 'OWASP-A01-NO-AUTH',
          title: 'Endpoint de Login e Alteração de Dados sem Middleware de Autenticação',
          severity: 'CRITICAL',
          file: 'Controllers/UserController.cs',
          line: 42,
          snippet: '[HttpPost("update-password")] public IActionResult UpdatePassword([FromBody] UserDto user)',
          grc_control: 'OWASP Top 10 A01:2021 (Broken Access Control) • LGPD Art. 46',
          description: 'O método permite alteração de senha sem exigir atributo [Authorize] ou validação prévia de token JWT.',
          recommendation: 'Adicione a anotação [Authorize] no controller ou método e valide a identidade do usuário a partir do token da sessão.'
        },
        {
          id: 'FIND-002',
          rule_id: 'LGPD-PII-LOG-LEAK',
          title: 'Vazamento de Dado Pessoal Sensível (CPF/Senha) nos Arquivos de Log',
          severity: 'HIGH',
          file: 'Services/AuthService.go',
          line: 88,
          snippet: 'logger.Infof("Tentativa de login efetuada com sucesso: CPF=%s, Senha=%s", user.CPF, user.Password)',
          grc_control: 'LGPD Art. 46 (Segurança da Informação) • ISO 27001 A.8.15 (Logging)',
          description: 'Registro de log imprimindo senha e CPF em texto claro, violando os princípios de necessidade e segurança da LGPD.',
          recommendation: 'Remova os campos de Senha e sanitize/mascare o CPF (ex: ***.456.789-**) antes de enviar para o logger.'
        },
        {
          id: 'FIND-003',
          rule_id: 'OWASP-A05-CORS-WILDCARD',
          title: 'Configuração Insegura de CORS com Permissão Wildcard (*)',
          severity: 'MEDIUM',
          file: 'appsettings.json',
          line: 15,
          snippet: '"AllowedHosts": "*", "Cors": { "AllowOrigins": "*" }',
          grc_control: 'OWASP Top 10 A05:2021 (Security Misconfiguration)',
          description: 'Permitir qualquer origem com wildcard em APIs com autenticação expõe a aplicação a ataques de CSRF/Cross-Domain.',
          recommendation: 'Restrinja os origens permitidos apenas aos domínios confiáveis da aplicação no Railway/Produção.'
        }
      ]);
      setIsScanning(false);
    }, 1200);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '32px auto', padding: '0 16px' }}>
      {/* Search Input Box */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search color="var(--accent-indigo)" /> Escanear Repositório / Código Fonte
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
          Analise o repositório local ou projeto remoto em qualquer linguagem (C#, Go, Python, Java, TypeScript). O GraphRAG e o motor AST identificarão vulnerabilidades de segurança e GRC.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Caminho do Projeto / Repositório Git:</label>
            <input
              type="text"
              value={repoPath}
              onChange={(e) => setRepoPath(e.target.value)}
              style={{ width: '100%' }}
              className="code-font"
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Linguagem de Destino:</label>
            <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} style={{ width: '100%' }}>
              <option value="all">Auto-detectar (Multi-Linguagem)</option>
              <option value="csharp">C# (.NET 8/9)</option>
              <option value="golang">Go (Golang)</option>
              <option value="python">Python (FastAPI / Django / Flask)</option>
              <option value="java">Java (Spring Boot)</option>
              <option value="typescript">TypeScript / Node.js</option>
            </select>
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={handleStartScan}
          disabled={isScanning}
          style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
        >
          {isScanning ? 'Escaneando AST + Construindo Grafo + IA...' : 'Iniciar Auditoria de Conformidade'}
        </button>
      </div>

      {/* Results Header */}
      {findings.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert color="var(--accent-rose)" /> Achados de Conformidade ({findings.length})
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-critical">1 Crítico</span>
              <span className="badge badge-high">1 Alto</span>
              <span className="badge badge-medium">1 Médio</span>
            </div>
          </div>

          {/* Finding Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {findings.map((f) => (
              <div key={f.id} className="glass-card" style={{ padding: '20px', borderLeft: f.severity === 'CRITICAL' ? '4px solid var(--accent-rose)' : f.severity === 'HIGH' ? '4px solid var(--accent-amber)' : '4px solid var(--accent-cyan)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span className={`badge badge-${f.severity.toLowerCase()}`} style={{ marginRight: '8px' }}>{f.severity}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', className: 'code-font' }}>{f.rule_id}</span>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '4px' }}>{f.title}</h4>
                  </div>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-color)' }} className="code-font">
                    {f.file}:{f.line}
                  </span>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  {f.description}
                </p>

                {/* Code Snippet Box */}
                <div style={{ background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '12px' }} className="code-font">
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Trecho de Código Afetado:</div>
                  <code style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>{f.snippet}</code>
                </div>

                {/* GRC Control and Recommendation */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-indigo)', display: 'block', marginBottom: '2px' }}>CONTROLE GRC MAPEADO:</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>{f.grc_control}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-emerald)', display: 'block', marginBottom: '2px' }}>RECOMENDAÇÃO DE REPARO:</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{f.recommendation}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
