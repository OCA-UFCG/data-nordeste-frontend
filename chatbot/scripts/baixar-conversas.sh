#!/usr/bin/env bash
# Baixa o último pacote de conversas do gamma (ou o da execução indicada),
# descriptografa com a sua chave gpg e extrai em conversas-gamma/<data>/.
# O pacote vem de .github/workflows/exportar-conversas-gamma.yml.
#
#   scripts/baixar-conversas.sh            # a última exportação que deu certo
#   scripts/baixar-conversas.sh 1234567890 # uma execução específica
set -euo pipefail

cd "$(dirname "$0")/.."
WORKFLOW=exportar-conversas-gamma.yml
REPO=OCA-UFCG/data-nordeste-frontend

execucao="${1:-$(gh run list -R "$REPO" --workflow "$WORKFLOW" --status success -L 1 --json databaseId --jq '.[0].databaseId')}"
[ -n "$execucao" ] || { echo "Nenhuma execução bem-sucedida de $WORKFLOW em $REPO."; exit 1; }

temp="$(mktemp -d)"
trap 'rm -rf "$temp"' EXIT
gh run download -R "$REPO" "$execucao" --dir "$temp"
pacote="$(find "$temp" -name 'conversas-gamma.tar.gz.gpg' | head -1)"
[ -n "$pacote" ] || { echo "Execução $execucao sem o artifact conversas-gamma.tar.gz.gpg."; exit 1; }

destino="conversas-gamma/$(date +%F_%H%M)"
mkdir -p "$destino"
gpg --batch --quiet --decrypt "$pacote" | tar -xzf - -C "$destino" --strip-components=1
echo "$(find "$destino" -name '*.jsonl' | wc -l) conversas em chatbot/$destino"
