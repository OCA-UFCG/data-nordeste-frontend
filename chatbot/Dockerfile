# Assistente de dados do Data Nordeste no modo equipe (senha compartilhada,
# motor api). Montado e rodado na VM do gamma por
# .github/workflows/deploy-chat-gamma.yml.
#
# Os arquivos gerados (dados/: o tabelão de ~2 GB, a malha dos municípios e o
# conteúdo do portal) e as conversas NÃO entram na imagem: chegam por volume.
# Ver "Gamma" no README.
FROM node:24-slim

LABEL datane.servico="chat"
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

ENV NODE_ENV=production \
    DATANE_CHAT_HOST=0.0.0.0 \
    DATANE_CHAT_MOTOR=api \
    DATANE_CHAT_MODELOS=haiku

# O processo não roda como root; a pasta das conversas na VM é do uid 1000 (node).
USER node
EXPOSE 3220

CMD ["node", "--import", "tsx", "src/chat/servidor-chat.ts"]
