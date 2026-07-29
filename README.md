# AuditoriaFront - Dashboard Web do Auditor de Conformidade de APIs

Interface Web moderna desenvolvida em **React 18**, **TypeScript**, **Vite** e **CSS Design System (Glassmorphism & Dark Mode)** para acompanhamento de auditorias de APIs, testes de IA (Gemini 14 RPM vs Ollama Local) e consulta de normas GRC.

## Variáveis de Ambiente
- `VITE_BACKEND_URL`: URL do backend `AuditoriaBack` (padrão local: `http://localhost:8000`). No Railway, defina para a URL pública gerada para o serviço `AuditoriaBack`.

## Como Rodar Localmente

```bash
cd AuditoriaFront
npm install
npm run dev
```

Acesse a interface no navegador em: `http://localhost:3000`

## Deploy no Railway

Suba esta pasta (`AuditoriaFront`) como um repositório Git separado no Railway. Adicione a variável de ambiente `VITE_BACKEND_URL` apontando para a URL do seu backend no Railway.
