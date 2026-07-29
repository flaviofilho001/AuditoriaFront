/// <reference path="../vite-env.d.ts" />

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'https://auditoriaback-production.up.railway.app';

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  grc_docs_count: number;
}

export interface LLMTestRequest {
  provider: 'gemini' | 'ollama';
  api_key?: string;
  gemini_model?: string;
  ollama_base_url?: string;
  ollama_model?: string;
  prompt?: string;
}

export interface LLMTestResponse {
  success: boolean;
  health: {
    status: string;
    provider: string;
    model?: string;
    current_model?: string;
    max_rpm?: number;
    available_models?: string[];
    message?: string;
    error?: string;
  };
  response?: string;
}

export interface GRCMapping {
  framework: string;
  control_id: string;
  title: string;
  description: string;
}

export interface VulnerabilityFinding {
  id: string;
  rule_id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  recommendation: string;
  location: {
    file_path: string;
    line_start: number;
    line_end?: number;
    snippet?: string;
  };
  grc_mappings: GRCMapping[];
  detected_by: string;
}

export interface AuditScanResult {
  summary: {
    total_files_scanned: number;
    total_findings: number;
    severity_counts: {
      CRITICAL: number;
      HIGH: number;
      MEDIUM: number;
      LOW: number;
    };
    graph_summary: {
      total_nodes: number;
      total_edges: number;
      endpoints_count: number;
      pii_fields_count: number;
    };
    ai_executive_summary: string;
  };
  findings: VulnerabilityFinding[];
  files_scanned: string[];
}

export interface GitScanOptions {
  git_url: string;
  branch?: string;
  access_token?: string;
  provider: 'gemini' | 'ollama';
  api_key?: string;
  ollama_base_url?: string;
  ollama_model?: string;
  use_ai?: boolean;
}

export const api = {
  getBackendUrl: () => BACKEND_URL,

  checkHealth: async (): Promise<HealthResponse> => {
    const res = await fetch(`${BACKEND_URL}/health`);
    if (!res.ok) throw new Error(`Status de erro: ${res.status}`);
    return res.json();
  },

  listGRCDocs: async (): Promise<{ documents: string[] }> => {
    const res = await fetch(`${BACKEND_URL}/api/v1/grc/docs`);
    if (!res.ok) throw new Error(`Erro ao listar documentos GRC: ${res.status}`);
    return res.json();
  },

  getGRCDoc: async (docName: string): Promise<{ document: string; content: string }> => {
    const res = await fetch(`${BACKEND_URL}/api/v1/grc/docs/${docName}`);
    if (!res.ok) throw new Error(`Erro ao obter documento ${docName}`);
    return res.json();
  },

  testLLM: async (req: LLMTestRequest): Promise<LLMTestResponse> => {
    const res = await fetch(`${BACKEND_URL}/api/v1/llm/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Erro desconhecido' }));
      throw new Error(err.detail || `Erro HTTP: ${res.status}`);
    }
    return res.json();
  },

  scanZipFile: async (
    file: File, 
    provider: 'gemini' | 'ollama', 
    apiKey?: string, 
    ollamaBaseUrl?: string, 
    ollamaModel?: string, 
    useAi: boolean = true
  ): Promise<AuditScanResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('provider', provider);
    if (apiKey) formData.append('api_key', apiKey);
    if (ollamaBaseUrl) formData.append('ollama_base_url', ollamaBaseUrl);
    if (ollamaModel) formData.append('ollama_model', ollamaModel);
    formData.append('use_ai', useAi ? 'true' : 'false');

    const res = await fetch(`${BACKEND_URL}/api/v1/scan/upload-zip`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Erro ao processar o arquivo ZIP' }));
      throw new Error(err.detail || `Erro HTTP: ${res.status}`);
    }

    return res.json();
  },

  scanGitUrl: async (options: GitScanOptions): Promise<AuditScanResult> => {
    const res = await fetch(`${BACKEND_URL}/api/v1/scan/git-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Erro ao clonar/analisar o repositório Git' }));
      throw new Error(err.detail || `Erro HTTP: ${res.status}`);
    }

    return res.json();
  }
};
