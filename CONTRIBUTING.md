# Contribuindo

Este arquivo é a fonte canônica das convenções de trabalho do repositório:
branches, commits e pull requests. Regras de escrita de código, arquitetura e
testes ficam em [`CLAUDE.md`](CLAUDE.md). Contexto de produto, rotas e
integrações fica em [`docs/README.md`](docs/README.md). Setup local fica no
[`README.md`](README.md).

## Branches

Sempre a partir da `main`, com prefixo semântico e descrição em kebab-case:

- `feat/<descricao>` — nova funcionalidade.
- `fix/<descricao>` — correção.
- `refact/<descricao>` — refactor.
- `test/<descricao>` — testes.
- `docs/<descricao>` — documentação.

Exemplo: `fix/pdf-viewer`, `feat/municipality-search`.

## Commits

Commits seguem [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>: <descrição no imperativo>
```

Os tipos aceitos são exatamente estes sete:

| Tipo       | Quando usar                                        |
| ---------- | -------------------------------------------------- |
| `feat`     | Comportamento novo visível para quem usa o portal. |
| `fix`      | Correção de comportamento errado.                  |
| `refactor` | Mudança de estrutura sem mudar comportamento.      |
| `test`     | Só testes — novos casos, fakes, cobertura.         |
| `docs`     | Só documentação.                                   |
| `chore`    | Build, dependências, config, CI.                   |
| `revert`   | Desfazer um commit anterior.                       |

A regra é verificada automaticamente: o hook `commit-msg` (husky) roda
`commitlint` com a configuração de [`commitlint.config.mjs`](commitlint.config.mjs).
Uma mensagem fora da convenção é recusada antes de virar commit:

```
✖   type must be one of [feat, fix, refactor, test, docs, chore, revert] [type-enum]
```

Detalhes que o hook aceita de propósito:

- **Maiúscula na descrição é permitida.** As mensagens são em português, onde
  capitalização não carrega significado — `fix: Corrige acordeon` passa.
- **Commits de merge e de revert do git passam sem prefixo.** `Merge pull request
#329 from ...` e `Revert "feat: ..."` são gerados pelo git e pelo GitHub, e o
  commitlint os ignora por padrão.
- **O espaço depois dos dois-pontos é obrigatório.** `fix:acordeon` é recusado.

O histórico anterior a esta regra tem desvios (`add: ...`, mensagens sem prefixo).
Não use o `git log` como referência de estilo — use esta tabela.

## Pull requests

- Um PR por assunto. PR grande demais para revisar é PR que não é revisado.
- O título do PR segue a mesma convenção da mensagem de commit.
- Descreva **o que mudou e por quê**. O "o quê" o diff já mostra; o "por quê" não.
- Antes de abrir, rode a validação que a mudança exige — ver a seção `Commands`
  em [`CLAUDE.md`](CLAUDE.md). A CI **não** roda lint nem testes: ela só builda e
  reinicia containers. A validação local é o único portão.

## Hooks instalados

`npm install` instala os hooks via husky (`prepare`). São três:

| Hook         | O que roda                                 |
| ------------ | ------------------------------------------ |
| `pre-commit` | `prettier` nos arquivos staged, `eslint .` |
| `commit-msg` | `commitlint`                               |
| `pre-push`   | `make docker-build-prod`                   |

O `pre-push` faz um build Docker de produção completo, então `git push` leva
alguns minutos.

## Trabalhando com Claude Code

Este repositório tem dois propósitos: manter o portal no ar e ser um lugar onde
se aprende a construir software. Os dois valem, e isso muda como o agente deve
trabalhar aqui.

Quem desenvolve com Claude Code deve ler o [`CLAUDE.md`](CLAUDE.md): ele contém
as regras que o agente segue, incluindo a expectativa de que ele confirme o
entendimento de um conserto com você antes de aplicá-lo. Se o agente propôs uma
mudança que você não sabe explicar, peça a explicação antes de aceitar — quem
assina o PR é você.
