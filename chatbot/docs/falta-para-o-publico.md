# O que falta para abrir o assistente ao público

Hoje o assistente roda só para a equipe, no gamma, atrás de senha. Esta lista
é o que ainda falta antes de abrir para gestores ou para o público, levantada
em 25/11/2026. Cada item diz o que já foi feito e o que falta.

## Conteúdo

1. **Revisão das explicações por quem entende dos dados.** As descrições dos
   indicadores (`src/tabelao/indicadores*.ts`) e a seção "Linguagem simples"
   do `prompt.md` foram escritas sem especialista. Em 25/11/2026 uma
   conferência contra fontes oficiais (IBGE, Atlas, ANA, Ministério da Saúde)
   achou e corrigiu 5 erros (evapotranspiração, população indígena em 2010,
   nomes atuais da ANA e do ministério). Ficou por conferir:
   - se o esgoto "rede geral ou pluvial" de 2022 inclui "fossa ligada à rede"
     (mudança de definição entre 2010 e 2022 que a resposta não avisa);
   - se as metas de vacinação do banco (`meta_cobertura`) batem com as do
     Ministério da Saúde (95% na maioria; 90% em BCG, rotavírus, HPV e covid);
   - a fonte e as classes do índice de ameaça de escassez hídrica ("a
     confirmar" no catálogo);
   - Semiárido: o portal usa 1.477 municípios; a Sudene reconhece 1.427 e
     manteve 50 provisoriamente (Resolução Condel 150/2021).
2. **Teste com o público de verdade.** Até aqui, perguntas, respostas e
   juízes são todos de modelos da Anthropic; a equipe também já conhece o
   jargão. A Lei 15.263/2025 (art. 5º, XVIII) pede teste com o público-alvo:
   4 ou 5 pessoas de fora (gestor de prefeitura pequena, jornalista, alguém
   sem curso superior), 15 minutos cada.

## Pessoas e dados pessoais

3. **Aviso de privacidade (LGPD).** As conversas ficam gravadas no servidor e
   passam pela Anthropic (empresa dos Estados Unidos). Falta: um aviso claro
   na página ("não digite dados pessoais; as conversas são guardadas por X
   meses"), o prazo de guarda e quem apaga. Hoje a página diz só "As
   conversas ficam gravadas aqui", que parece histórico do navegador.
4. **Limite por pessoa sem senha.** O limite de 100 perguntas por pessoa por
   dia conta pelo navegador (um cookie aleatório dado a quem acerta a senha
   da equipe). Aberto ao público, sem senha, basta limpar os cookies para
   zerar a conta, e o servidor não enxerga o endereço de quem acessa: na
   prática só valem os tetos de gasto do dia e do mês. Precisa de login ou
   de outra forma de identificar quem pergunta.

## Acesso

5. **Acessibilidade com leitor de tela de verdade** (Lei 13.146/2015, art. 63;
   eMAG). Feito em 25/11/2026: verificação automática (axe) sem problema
   crítico, rótulo no botão de nova conversa, `aria-busy` enquanto a resposta
   chega, gráficos e mapas com título lido e tabela em "Ver os dados". Falta
   testar com NVDA (computador) e TalkBack (celular).
6. **Celular de verdade.** Feito: tela de 360 px no navegador, sem rolagem
   lateral, mapa legível. Falta um aparelho simples com 4G fraco.
7. **Passos da resposta.** "Ver o resultado" mostra a consulta e nomes
   internos (`idhm_renda`). Serve à equipe; para o público, decidir se
   esconde ou traduz.

## Operação

8. **Atualização dos dados.** O tabelão é uma cópia (hoje, de 24/11/2026).
   Quando o portal atualizar um painel, o assistente fica diferente dele.
   Falta um responsável e uma rotina (`npm run tabelao` + `npm run conferir`
   + cópia para o gamma). Desde 25/11/2026 os textos dos indicadores vêm do
   código, então corrigir uma explicação não exige regerar o tabelão.
9. **Aviso para a equipe quando o chat cair.** Feito: quem usa vê "O assistente
   está indisponível no momento" (chave recusada, crédito acabou, a Anthropic
   fora do ar), o chat para de tentar por 10 minutos e o log registra
   `falha_na_api` com o motivo. Falta alguém ser avisado (e-mail ou chat da
   equipe), e também quando o gasto chegar a 80% do teto.
10. **Variação entre execuções.** Cada pergunta do teste roda uma vez; a
    mesma pergunta pode sair diferente. Baixa prioridade: os testes já rodam
    várias vezes ao longo do trabalho.

## Decisões fora da equipe técnica

11. **Aprovação e dono.** Quem na Sudene aprova um assistente de IA
    respondendo pelo portal; de quem é a conta que paga a chave; se há regra
    contra mandar textos de cidadãos a uma empresa de fora do país; quem
    cuida do assistente depois.
