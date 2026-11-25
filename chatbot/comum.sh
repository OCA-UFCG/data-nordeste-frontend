# Parte comum de conversar.sh, da página de chat (motor "claude") e da avaliação. Não rode direto: é carregado com "source".
#
# Monta a configuração do servidor MCP e as opções do claude que deixam o modelo
# só com as ferramentas do Data Nordeste: sem Bash, sem leitura de arquivos, sem
# web, sem skills e sem CLAUDE.md. Copiado do chat do SEDES.

PACOTE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -f "${DATANE_TABELAO:-$PACOTE/dados/datane.sqlite}" ]; then
  echo "Falta o tabelão. Rode antes: (cd $PACOTE && npm install && npm run tabelao)" >&2
  exit 1
fi
if [ ! -x "$PACOTE/node_modules/.bin/tsx" ]; then
  echo "Faltam as dependências. Rode antes: (cd $PACOTE && npm install)" >&2
  exit 1
fi
if [ ! -f "$PACOTE/dados/portal.json" ]; then
  echo "Aviso: falta dados/portal.json (npm run portal); a ferramenta conteudo_do_portal vai responder que não tem o conteúdo." >&2
fi

# Diretório fora do repositório: o claude não acha CLAUDE.md, memória nem .claude/ de projeto nenhum.
# DATANE_SESSAO separa a avaliação da página que já está aberta.
SESSAO="${DATANE_SESSAO:-${XDG_CACHE_HOME:-$HOME/.cache}/datane-chatbot}"
mkdir -p "$SESSAO"
cat > "$SESSAO/mcp.json" <<JSON
{
  "mcpServers": {
    "datane": {
      "command": "$PACOTE/node_modules/.bin/tsx",
      "args": ["$PACOTE/src/servidor.ts"],
      "env": {
        "NODE_NO_WARNINGS": "1",
        "PATH": "$(dirname "$(command -v node)"):/usr/bin:/bin"${DATANE_TABELAO:+,
        \"DATANE_TABELAO\": \"$DATANE_TABELAO\"}
      }
    }
  }
}
JSON

# prompt.md + texto do portal + catálogo + data de hoje (src/prompt-sistema.ts, o mesmo do motor api).
if ! NODE_NO_WARNINGS=1 "$PACOTE/node_modules/.bin/tsx" "$PACOTE/src/prompt-sistema.ts" > "$SESSAO/prompt.md"; then
  echo "Não consegui montar o prompt do sistema (src/prompt-sistema.ts)." >&2
  exit 1
fi
OPCOES_CLAUDE=(
  --mcp-config "$SESSAO/mcp.json"
  --strict-mcp-config
  --tools ""
  --allowedTools "mcp__datane"
  --setting-sources ""
  --disable-slash-commands
  --system-prompt-file "$SESSAO/prompt.md"
)
# Mesmo ajuste do motor api: low | medium | high (sem a variável, o padrão do modelo).
if [ -n "${DATANE_CHAT_ESFORCO:-}" ]; then
  OPCOES_CLAUDE+=(--effort "$DATANE_CHAT_ESFORCO")
fi

# Os apelidos do claude podem apontar para versões antigas, então fixamos os ids.
modelo_id() {
  case "$1" in
    haiku) echo "claude-haiku-5-5" ;;
    sonnet) echo "claude-sonnet-5-5" ;;
    *) echo "$1" ;;
  esac
}
