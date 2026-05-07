# Data Nordeste Frontend

Frontend do Data Nordeste, portal público da SUDENE para consulta de dados,
indicadores regionais, publicações, conjuntos de dados, painéis interativos,
datastories, parceiros e conteúdo institucional.

Este repositório é uma aplicação Next.js com App Router. A maior parte do
conteúdo visível vem de integrações externas, principalmente Contentful, Zenodo,
Power BI, ArcGIS e Firebase.

Para contexto operacional detalhado para agentes e mantenedores, leia também
[`docs/README.md`](docs/README.md). Regras de escrita, estrutura e validação de
código ficam em [`AGENTS.md`](AGENTS.md).

## Pré-requisitos

- Docker Engine
- GNU Make
- Node.js e npm instalados localmente para editor, lint, testes e build

## Configuração Local

Crie o arquivo de ambiente a partir do exemplo:

```bash
cp .env.sample .env
```

Preencha as variáveis necessárias no `.env`. Não documente valores reais de
segredos no repositório.

Mesmo usando Docker, instale as dependências localmente para que o editor
resolva imports, tipos, regras de lint e formatação:

```bash
npm install
```

## Como Rodar

Fluxo recomendado com Docker:

```bash
make docker-build-dev
make docker-run-dev
```

Abra `http://localhost:3000`.

Também é possível rodar sem Docker:

```bash
npm run dev
```

## Comandos Úteis

- `npm run dev`: inicia o servidor Next.js local.
- `npm run lint`: executa ESLint.
- `npm test`: executa a suíte Vitest.
- `npm run build`: gera build de produção e valida tipos/rotas do Next.js.
- `npm start`: inicia o servidor de produção após o build.
- `make run-dev`: roda o ambiente de desenvolvimento com npm.
- `make run-prod`: faz build e inicia produção com npm.
- `make docker-run-dev`: roda desenvolvimento com Docker.
- `make docker-build-prod`: constrói imagem Docker de produção.
- `make docker-run-prod`: roda container de produção.
- `make docker-run-beta`: roda container beta.

## Rotas Principais

- `/`: homepage com banners, cards de indicadores, publicações recentes,
  macrotemas, seção institucional, parceiros e pesquisa de feedback.
- `/macrothemes/[slug]`: página de um macrotema. A URL usa hífens e o código
  normaliza para underscores antes de consultar o Contentful.
- `/posts`: lista publicações do Contentful, como boletins, notícias e
  datastories.
- `/explore`: lista experiências de dados interativas e publicações relacionadas.
- `/catalog`: lista datasets da comunidade `datane` no Zenodo.
- `/data-panel/[id]`: carrega um painel do Contentful e embute o Power BI.
- `/data-stories/[id]`: embute um ArcGIS StoryMap por ID.
- `/experience/[id]`: embute uma experiência ArcGIS Experience Builder por ID.
- `/about`: conteúdo institucional, contatos, rede de colaboração, história e
  valores.
- `/connections`: parceiros e projetos.
- `/health`: endpoint de health check.

## Integrações

- **Contentful:** fonte de verdade para navegação, páginas, seções, posts,
  macrotemas, painéis, cards, parceiros, conteúdo institucional e perguntas da
  pesquisa.
- **Zenodo:** fonte do catálogo de datasets, usando a comunidade `datane`.
- **Power BI:** painéis interativos embutidos via iframe com fonte configurada no
  Contentful.
- **ArcGIS:** StoryMaps e Experience Builder embutidos a partir de IDs públicos.
- **Firebase App Check:** usado no envio da pesquisa de feedback.
- **Google Analytics:** configurado por variável pública de ambiente.

## Convenções De Trabalho

Use branches semânticas:

- `feat/<descricao>` para novas funcionalidades.
- `fix/<descricao>` para correções.
- `refact/<descricao>` para refactors.
- `test/<descricao>` para testes.
- `docs/<descricao>` para documentação.

Use commits semânticos:

- `feat: ...`
- `fix: ...`
- `refactor: ...`
- `test: ...`
- `docs: ...`

Antes de finalizar mudanças de código, rode `npm run lint`. Rode também
`npm test` quando houver lógica coberta por testes ou correção de bug. Rode
`npm run build` quando alterar rotas, configuração Next.js, tipos ou integrações.
