# Multi-stage Dockerfile para AuditoriaFront

FROM node:20-alpine AS builder
WORKDIR /app

# Copia arquivos de definição de pacotes
COPY package*.json ./

# Instala dependências
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

# Expõe as portas compatíveis com Railway
EXPOSE 8080 80

# Substitui dinamicamente a porta de escuta do Nginx para a $PORT atribuída pelo Railway (padrão 8080)
CMD ["sh", "-c", "sed -i 's/listen  *80;/listen '\"${PORT:-8080}\"';/g' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
