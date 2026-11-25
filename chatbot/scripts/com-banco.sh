#!/usr/bin/env bash
# Roda um comando com a conexão do oca_db nas variáveis PG* (só para leitura).
#
# Se PGHOST/PGUSER/PGPASSWORD não estiverem definidas, lê DB_HOST, DB_PORT,
# DB_USER, DB_PASSWORD e DB_DATABASE do .env do Automatic-Reporting
# (DATANE_PG_ENV, padrão ~/Automatic-Reporting/.env), sem copiar a senha para
# este repositório. Antes de rodar, confere se a porta responde: fora da rede do
# LSD, o banco só é alcançado pela VPN e pelo túnel SSH (veja o README).
set -euo pipefail
PACOTE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[ -f "$PACOTE/.env" ] && set -a && source "$PACOTE/.env" && set +a

if [ -z "${PGPASSWORD:-}" ]; then
  ARQ="${DATANE_PG_ENV:-$HOME/Automatic-Reporting/.env}"
  ARQ="${ARQ/#\~/$HOME}"
  if [ ! -f "$ARQ" ]; then
    echo "Sem PGPASSWORD e sem $ARQ. Defina as variáveis PG* (veja .env.sample)." >&2
    exit 1
  fi
  ler() { grep -E "^$1=" "$ARQ" | tail -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"; }
  export PGHOST="${PGHOST:-$(ler DB_HOST)}"
  export PGPORT="${PGPORT:-$(ler DB_PORT)}"
  export PGUSER="${PGUSER:-$(ler DB_USER)}"
  export PGDATABASE="${PGDATABASE:-$(ler DB_DATABASE)}"
  export PGPASSWORD="$(ler DB_PASSWORD)"
fi

if ! timeout 5 bash -c "echo > /dev/tcp/${PGHOST:-localhost}/${PGPORT:-5432}" 2>/dev/null; then
  echo "O banco não respondeu em ${PGHOST:-localhost}:${PGPORT:-5432}." >&2
  echo "Ligue a VPN do LSD e abra o túnel SSH para a VM do banco (veja \"O banco\" no README):" >&2
  echo "  ssh -f -N -L ${PGPORT:-5433}:127.0.0.1:5432 <usuário>@<VM do banco do beta>" >&2
  exit 1
fi

cd "$PACOTE"
exec "$PACOTE/node_modules/.bin/$1" "${@:2}"
