# Assistente de dados do Data Nordeste (protótipo)

Um chat que responde, em português, perguntas sobre os dados do Data Nordeste
(o portal de dados da Sudene): população, PIB, IDHM, analfabetismo,
mortalidade infantil, vacinação, população em situação de rua, cisternas, lixo,
esgoto e Monitor de Secas, para os 2.074 municípios da área da Sudene, os
estados, as regiões do IBGE e os recortes Nordeste, área da Sudene, Semiárido e
Caatinga.

É a proposta B ("pergunte aos dados") da proposta de 23/11/2026, construída
sobre o harness do chat do SEDES (`~/SAP-frontend/tools/sedes-chatbot`). Por
enquanto roda só no computador, na assinatura do Claude de quem roda.

## Como rodar

Pré-requisitos: Node 24, Claude Code logado (`claude`), e, para montar o
tabelão, a VPN do LSD e o túnel para o banco do beta.

```bash
cd ~/datanordeste/datane-chatbot
npm install

# 1. O tabelão (2,5 min; lê o oca_db só com SELECT e grava dados/datane.sqlite, ~1 GB)
npm run tabelao
npm run conferir     # recalcula uma amostra no Postgres e compara (resultados/conferencia.md)

# 2. O conteúdo do portal (Contentful + Zenodo) e a malha dos mapas
npm run portal       # usa o token de leitura do .env do frontend
npm run malha        # usa o GeoJSON simplificado do site do SEDES

# 3. O chat, no navegador: http://localhost:3220
npm run chat
#    ou no terminal
./conversar.sh          # Haiku 5.5
./conversar.sh sonnet   # Sonnet 5.5
```

Depois do passo 1, o banco não é mais necessário: o chat lê só o tabelão.

### O banco

`npm run tabelao` e `npm run conferir` passam por `scripts/com-banco.sh`, que lê
`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_DATABASE` do `.env` do
Automatic-Reporting (`DATANE_PG_ENV` muda o arquivo; variáveis `PG*` no
ambiente têm prioridade). A senha não é copiada para cá. Fora da rede do LSD:

```bash
# VPN do LSD ligada; depois o túnel (porta local 5433 → 5432 da VM do banco do beta).
# Usuário e endereço da VM: documentação interna da equipe.
ssh -f -N -L 5433:127.0.0.1:5432 <usuário>@<VM do banco do beta>
```

A sessão abre em modo somente leitura (`default_transaction_read_only`); um
INSERT por engano no catálogo seria recusado pelo próprio Postgres.

## Como funciona

```
oca_db (views finais)          Contentful + Zenodo
   │  npm run tabelao (só SELECT)     │  npm run portal
   ▼                                  ▼
dados/datane.sqlite             dados/portal.json
(indicadores, territórios,           │
 valores já agregados)               │
   └──────────────┬──────────────────┘
                  ▼
     ferramentas (src/ferramentas/), todas só leitura
                  │
      ┌───────────┴────────────┐
 servidor MCP (claude -p)   motor da API (chave)
      └───────────┬────────────┘
                  ▼
      página de chat (src/chat/), conversas gravadas
```

### A camada curada (o tabelão)

O modelo não consulta o `oca_db`. No experimento da proposta, com SQL direto
nas views, os dois modelos caíram nas armadilhas do banco (linha "Brasil" somada
aos municípios, S0 lido como "sem seca"). O tabelão resolve isso antes:

- `src/tabelao/indicadores.ts` (e `indicadores-ampliacao.ts`) é o catálogo: 54 indicadores em 10 temas. Cada um
  diz de qual view vem (um SELECT simples), a fórmula, a unidade e a regra de
  agregação: **soma** (contagens, R$), **razão** (taxas: soma o numerador e o
  denominador dos municípios e só então divide) ou **municipal** (IDHM, Gini:
  sem valor de estado).
- `src/tabelao/montar-tabelao.ts` lê as views, calcula os totais por sexo, cor
  ou raça, faixa etária e categoria, e os valores de cada estado, região e
  recorte, e grava tudo na tabela `valores` (6,1 milhões de linhas). O modelo
  só lê números prontos.
- `src/tabelao/territorios.ts` monta os 2.324 territórios. MG e ES só têm parte
  dos municípios na área da Sudene: viram `MG_SUDENE` e `ES_SUDENE`, com o nome
  dizendo quantos municípios entram, para ninguém ler como o estado inteiro.
- `src/tabelao/conferir.ts` recalcula cada indicador em 8 recortes direto no
  Postgres, por outro caminho (GROUP BY lá), e compara: 591 de 591 bateram em
  24/11/2026. Confere também 13 respostas da proposta e os 17 cards do portal.

As inconsistências achadas no caminho estão em
[docs/inconsistencias-do-banco.md](docs/inconsistencias-do-banco.md); o código
cita cada uma como `INC-n` no lugar onde a contorna.

### As ferramentas

| Ferramenta | O que faz |
|---|---|
| `buscar_territorio` | Acha município, estado, região ou recorte pelo nome, sem acento, com UF no fim ("Patos - PB"), grafias alternativas (Assú/Açu) e erro de digitação; devolve todos os homônimos. |
| `consultar_sql` | SELECT no tabelão (até 200 linhas, 10 s). Com `grafico`, a página desenha série, ranking ou mapa, e a saída traz um "Resumo calculado". Avisos vão junto do resultado: id de indicador errado, recorte sem filtro (que dobraria a soma), indicador só municipal, ano em curso, cobertura acima de 100%, mistura de municípios com recortes. |
| `detalhar_indicador` | Ficha completa do indicador, com as categorias (público-alvo e meta de cada vacina). |
| `conteudo_do_portal` | Busca nos painéis, boletins, data stories e datasets do portal. É o que responde os temas que o tabelão não tem (comex, CAGED, FNE...), apontando o painel. |

O catálogo resumido e um texto sobre o portal (`conhecimento/sobre-o-datane.md`)
vão no prompt do sistema (`prompt.md` + `src/prompt-sistema.ts`, ~33 mil
caracteres), então o modelo não precisa pedir o catálogo antes de consultar.

### O que vem do chat do SEDES sem mudança de lógica

Copiado do chat do SEDES (`tools/sedes-chatbot` no repositório do SEDES; o
README de lá explica o porquê de cada um): os dois motores (`claude -p` em stream-json e API),
o turno, o descarte do rascunho escrito antes de uma ferramenta, a conferência
dos números (todo número da resposta tem de estar numa saída de ferramenta), a
revisão das frases, as perguntas sugeridas com `»`, o lembrete de língua, o SQL
em processo filho com prazo, o resumo calculado e a avaliação com juiz.

Mudou: o link "Ver no SEDES" virou o botão do painel do portal, montado pelos
indicadores das consultas; o resumo não traz média simples em rankings e mapas
(no datane o estado tem valor próprio); em vez do login do SEDES, uma senha
compartilhada da equipe (modo equipe, abaixo); a página tem as cores e o
logotipo do Data Nordeste.

### A página

`npm run chat` serve `http://localhost:3220`, só neste computador. Modelos:
Haiku 5.5 (padrão) e Sonnet 5.5, fixos durante a conversa. Mostra a resposta
enquanto é escrita, os passos com o SQL e o resultado de cada ferramenta, o
gráfico ou mapa, o botão do painel e 👍/👎 com comentário.

Cada conversa fica em `conversas/<data>_<id>.jsonl` (fora do git): linhas
`inicio`, `turno` (pergunta, resposta, ferramentas com entrada e saída, tempo,
tokens, custo estimado) e `avaliacao`. São elas que viram perguntas novas para
a avaliação.

Variáveis: `DATANE_CHAT_PORTA`, `DATANE_CHAT_MOTOR` (`claude` ou `api`),
`DATANE_CHAT_MODELOS`, `DATANE_CHAT_ESFORCO`, `DATANE_CHAT_CONFERIR=0`,
`DATANE_CHAT_REVISAR=0`.

### Modo equipe (gamma)

Com `DATANE_CHAT_SENHA`, a página pede a senha compartilhada antes de abrir
(`src/chat/equipe.ts`). Quem acerta recebe um cookie assinado de 30 dias com
um id aleatório do navegador: cada pessoa vê só as próprias conversas, e o id
fica gravado na linha `inicio` (sem nome nem e-mail). Trocar a senha desloga
todos. Dez senhas erradas seguidas travam o endereço por 15 minutos.

Limites (`src/chat/limites.ts`; contados também a partir das conversas
gravadas, então reiniciar não zera): 40 perguntas por pessoa por dia, US$ 5
por dia e US$ 50 por mês para o chat todo. O gasto é a estimativa por tokens;
quem garante é o limite de gasto da conta no Console da Anthropic, que conta
também o uso da mesma chave em outros lugares.

`DATANE_CHAT_HOST` muda o endereço em que o servidor escuta; fora de
127.0.0.1 ele só sobe com senha. Atrás do nginx, o servidor lê o endereço de
quem pede em `X-Real-IP` e o https em `X-Forwarded-Proto`; por isso a porta do
contêiner deve ficar presa ao 127.0.0.1 da VM (só o nginx fala com ele).

## Gamma

O chat da equipe roda na VM do gamma, num contêiner próprio
(`datane-chat-gamma`, porta 9100 da VM), no modo equipe com o motor `api` e
só o Haiku. O nginx de entrada encaminha
`https://gamma-datanordeste.oca-portal.com/assistente/` para ele.

- **Deploy:** `.github/workflows/deploy-chat-gamma.yml`, a cada push na `main`
  que mexa em `chatbot/` (ou à mão, em Actions). A imagem é montada na própria
  VM pelo runner do gamma (`Dockerfile` deste pacote).
- **Secrets do repositório:** `ANTHROPIC_API_KEY_GAMMA` (a chave da API) e
  `DATANE_CHAT_SENHA_GAMMA` (a senha que a equipe digita). Trocar a senha:
  atualizar o secret e rodar o workflow; todos precisam entrar de novo.
- **Dados:** a imagem não leva `dados/`. O tabelão (~2 GB), a malha e o
  conteúdo do portal ficam em `/home/ubuntu/datane-chat/dados` na VM (montado
  só para leitura) e as conversas em `/home/ubuntu/datane-chat/conversas`.
- **Atualizar o tabelão:** gerar e conferir aqui (`npm run tabelao`,
  `npm run conferir`), copiar `dados/` para a VM com `rsync` e reiniciar o
  contêiner (`sudo docker restart datane-chat-gamma`).
- **Gasto:** os limites do modo equipe (40 perguntas por pessoa por dia, US$ 5
  por dia, US$ 50 por mês) valem para este contêiner. O limite da conta no
  Console da Anthropic vale para a chave toda.

## Avaliação

`perguntas.md` tem 262 perguntas com resposta esperada: as 73 primeiras em 18 categorias (valor,
ranking, tendência, recortes de pessoas, homônimos, dado inexistente, tema só
no portal, guardrails, conversas com continuação, contas, vacinação, armadilhas
do banco, escrita informal, seca...), e outras 101, de 24/11/2026, com o que
aquelas não cobriam (território, indicadores nunca perguntados, falsa premissa,
datas relativas, contas, segurança, língua, usuário real, perguntas difíceis),
e 40 escritas por um agente separado com personas (PS), sem ver o harness.
As respostas foram tiradas do tabelão já conferido contra o Postgres.

```bash
npm run avaliar -- --so P01,H01 --rotulo teste   # teste rápido
npm run avaliar -- --categoria Q,V,K             # pelas letras do id
npm run avaliar                                  # todas, Haiku
npm run avaliar -- --modelo sonnet
npm run avaliar -- --comparar v1-haiku v2-haiku
npm run varrer -- v2-haiku                       # o que o juiz não olha
```

As conversas gravadas pela página viram perguntas candidatas com
`npm run candidatas` (grava `conversas/candidatas.md`, fora do git, com o 👎 e
os sinais de problema primeiro). As boas entram no `perguntas.md` depois de
escrever a resposta esperada, conferida no tabelão.

Cada pergunta roda pelo mesmo motor da página, e um juiz (Sonnet 5.5, pelo
`claude`) dá nota certo, parcial ou errado com o motivo. O resumo vai para
`resultados/rodadas/<rotulo>.md`; o bruto, para `resultados/brutos/` (fora do
git). O histórico das rodadas e das decisões fica no diário do processo, na
documentação interna da equipe.

O juiz só confere o que o gabarito pede. `npm run varrer` procura nas respostas
guardadas o que nenhum gabarito cobre: nome interno ("tabelão", nome de
ferramenta), SQL, língua errada, link de fora do portal, resposta longa demais,
comentário da revisão que chegou à pessoa e gráfico com duas barras de mesmo
nome (o juiz lê só o texto).

## Limites conhecidos

- O tabelão é uma cópia: dado novo no banco só entra com `npm run tabelao`.
- Temas fora do tabelão (comércio exterior, CAGED, FNE, energia, UCs...): o
  assistente aponta o painel do portal. A lista do que o assistente tem e do que
  está só no portal fica em `conhecimento/sobre-o-datane.md`, que entra no
  prompt: **ao pôr um tema no tabelão, tire-o de lá** (na c12 esqueci, e o
  prompt dizia ao modelo que não tinha desmatamento, aridez, quilombolas...).
- O tabelão tem ~1 GB; dá para encolher (códigos inteiros nas dimensões) quando
  for para um servidor.
- Os scripts do tabelão leem o banco do beta. Se o beta divergir da produção, o
  tabelão segue o beta.
