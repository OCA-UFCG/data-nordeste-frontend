#!/usr/bin/env bash
# Conversa com o assistente do Data Nordeste no terminal.
# Uso: ./conversar.sh [modelo]     (modelo: haiku, o padrão, ou sonnet)
set -euo pipefail
source "$(dirname "$0")/comum.sh"
MODELO="$(modelo_id "${1:-haiku}")"
cd "$SESSAO"
exec claude --model "$MODELO" "${OPCOES_CLAUDE[@]}"
