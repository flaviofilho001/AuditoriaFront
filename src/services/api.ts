const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

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
    max_rpm?: number;
    available_models?: string[];
    message?: string;
    error?: string;
  };
  response?: string;
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
  }
};
