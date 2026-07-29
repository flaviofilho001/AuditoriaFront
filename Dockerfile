# Multi-stage Dockerfile para AuditoriaFront

FROM node:20-alpine AS builder
WORKDIR /app

# Copia arquivos de definição de pacotes
COPY package*.json ./

# Instala dependências (usa npm install para maior compatibilidade se package-lock.json não estiver presente)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copia o restante do código-fonte
COPY . .

# Variável para apontar para a API no Railway
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

RUN npm run build

# Servidor HTTP estático leve com Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Expõe a porta 80 padrão do Nginx
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
