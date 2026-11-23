# Mapa dos painéis em MapLibre, com geodados na VM — design

Data: 23/11/2026. Painéis afetados: `/demo/pib`, `/demo/idh`, `/demo/perfil-demografico`.

## Intenção

Trocar o card de mapa dos três painéis novos por um mapa no estilo do Atlas da
Desertificação: basemap real, camadas temáticas com as cores que o time de dados
definiu no QGIS, e navegação por zoom que também filtra o painel. Os arquivos
geográficos (shapes, rasters, `.qgz`) vêm da pasta do Drive "Mapas_painéis" e
ficam na VM do Data Nordeste, não no repositório.

Hoje: PIB e IDH desenham um SVG fixo dos 9 estados (`ProtoStateMap`); o perfil
demográfico desenha a malha municipal num canvas ECharts. Nenhum tem basemap,
raster ou recorte por zoom. `maplibre-gl` já está no `package.json`, sem uso.

## Objetivos

1. Um componente de mapa compartilhado (MapLibre) no lugar do card de mapa de
   cada um dos três painéis; cada painel mostra o próprio indicador.
2. Basemap selecionável: **Satélite** (ESRI World Imagery) ou **Oceano** (branco
   com oceano azul — ESRI World Ocean Base, o mesmo dos `.qgz`).
3. Camada vetorial do indicador do painel (PIB, IDH ou Demografia), colorida pelas
   classes do `.qgz`, no ano do filtro.
4. Camada raster **Índice de aridez**, liga/desliga, com seletor de década
   (1990, 2000, 2010, 2020), paleta do `indice_aridez.qgz`.
5. Recorte por zoom em três níveis: área de interesse → estado → município.
   Ao mudar de nível ou de alvo, o mapa **aplica o filtro do painel** (Estado /
   Município), o que dispara as consultas dos outros cards.
6. O filtro da barra também move o mapa (enquadra a seleção).
7. Destaque do recorte: **a partir do nível estado**, o que está fora do recorte
   fica cinza/opaco. No nível área de interesse não há cinza.
8. Limites estaduais e municipais com cor e espessura lidas dos `.qgz`.
9. Tooltip ao passar o mouse: nome do município (ou estado), valor do indicador
   formatado e posição no ranking (`rankRegions`, como hoje).
10. Script que baixa a pasta do Drive e prepara os arquivos para a web, e runbook
    para colocá-los na VM.
11. PDF com os problemas encontrados nos dados, para o responsável pelos dados.

## Não-objetivos

- Corrigir dados. Nenhum valor, classe ou geometria do Drive é alterado; tudo o
  que estiver errado vai para o PDF. O mapa usa os arquivos como vieram.
- Backend novo (FastAPI/PMTiles/tiles como o Atlas).
- Mapa no mobile: `PanelPage` já mostra a versão resumida sem mapa.
- Mudar o painel FNE (`/demo/fne`) ou as versões Power BI.

## Antiobjetivos (falha mesmo que "funcione")

- Disparar consultas a cada quadro de pan/zoom: só ao parar o movimento e só se o
  recorte mudou.
- Ciclo filtro → enquadra → zoom → filtro diferente (o enquadramento programático
  não pode gerar outro filtro).
- Cores escritas à mão no código quando o `.qgz` as define.
- Geodados commitados no repositório.

## Restrições

- Next.js App Router, TypeScript, Tailwind v4; regras do `CLAUDE.md` (funções
  curtas, `src/features` puro e testado, vendor atrás de interface própria, sem
  `Co-Authored-By`).
- SOLID e KISS (pedido explícito).
- Deploy: o container é iniciado por `docker run` nos workflows
  `.github/workflows/deploy-*.yml`; a VM precisa de um volume com os geodados.
- O ambiente local precisa de VPN LSD + túnel `ssh -N -L 5433:127.0.0.1:5432
  datane` para o `DATA_DB_URL` dos painéis.

## O que os arquivos do Drive contêm (levantado em 23/11/2026)

| Pasta | Conteúdo | Feições | Atributos usados |
|---|---|---|---|
| `pib/` | `pib.qgz`, `shapefile/pib.*` | 2.074 municípios | `cd_mun_1`, `nm_mun_1`, `sigla_uf_1`, `ne`, `semi_21_1`, `caat_24`, `aas_21_1`, `pib_2010…pib_2023` |
| `demografia/` | `demografia.qgz`, `shapefile/demografia.*` | 2.074 municípios | idem + `pop_2000` (texto), `pop_2010`, `pop_2022` |
| `idh/` | `idh.qgz`, `shapefile/idh.*` | **9 estados** | `uf`, `Estado_UF`, `cod_ibge`, `idh_2012…idh_2024` |
| `indice_aridez/` | `indice_aridez.qgz`, `raster/indice_aridez_{1990,2000,2010,2020}_4674_rec.tif` | 163×191 px, 0,1° | classes 2–5 |
| `shapefile_geral/` | `brasil/brasil_estado_4674`, `nordeste/{nordeste_4674,limite_nordeste_4674}`, `caatinga/Caatinga`, `area_sudene/{sudene_mun,limite_sudene}` | — | — |

Estilos dos `.qgz`: limites estaduais (`brasil_estado_4674`) e municipais (contorno
da camada do indicador) em `#666666`, 0,15 mm; classes graduadas por indicador;
raster com paleta por valor. Não existe polígono do Semiárido: ele é a união dos
municípios com `semi_21_1` marcado.

## Abordagens consideradas

1. **Escolhida — pipeline de arquivos + rota do Next.** Um script prepara os
   arquivos (GeoJSON simplificado, PNG do raster, estilos extraídos dos `.qgs`) num
   diretório que vira volume na VM; uma rota do Next os serve; o mapa é um
   componente MapLibre compartilhado. Leve, sem serviço novo.
2. Copiar o backend do Atlas (FastAPI + PMTiles + tiles PNG). Robusto, mas um
   serviço a mais para 2.074 polígonos e 4 rasters minúsculos.
3. GeoJSON commitado em `public/maps` (como hoje). Mais simples, mas contraria
   "arquivos na VM" e não lê o `.qgz`.

O usuário escolheu a 1.

## Design

### 1. Preparação dos geodados — `scripts/geodata/`

`prepare_geodata.py` (Python 3 + CLIs do GDAL: `ogr2ogr`, `gdal_translate`,
`gdaldem`; sem geopandas), em duas etapas:

- `download`: baixa os arquivos da pasta do Drive para `<raw>/` mantendo a árvore
  (`https://drive.usercontent.google.com/download?id=…&export=download&confirm=t`;
  a pasta é pública por link). A lista de IDs fica num `drive_manifest.json`
  versionado no script (o time de dados trocando um arquivo no Drive mantém o ID).
- `build`: de `<raw>/` gera `<out>/`:
  - `vector/{pib,demografia,sudene_mun}.geojson`: EPSG:4326, simplificado
    (`-simplify`, tolerância como constante), coordenadas com 5 casas, só os
    atributos usados (código, nome, UF, flags de área, colunas do indicador).
  - `vector/estados.geojson` (de `brasil_estado_4674`, só os estados do Nordeste +
    MG e ES — os que a Área da Sudene toca), `vector/idh.geojson`.
  - `vector/areas.geojson`: uma feição por área — `nordeste` (limite_nordeste),
    `caatinga` (Caatinga), `sudene` (limite_sudene), `semiarido` (união dos
    municípios com `semi_21_1` marcado, via `ogr2ogr -dialect sqlite ST_Union`).
  - `raster/aridez_{ano}.png` + bounds: `gdaldem color-relief` com a paleta do
    `.qgz` (valor → cor, sem dado transparente).
  - `styles.json`: para cada indicador, o atributo base, as classes
    (`lower`, `upper`, `label`, `color`), contorno (cor/largura); limite estadual;
    paleta do raster. Extraído do `.qgs` (XML dentro do `.qgz`) com `xml.etree`.
  - `manifest.json`: arquivos, anos disponíveis por indicador (lidos das colunas),
    bounds dos rasters, data de geração.
- Lê os valores **como vieram**: não reordena classes, não converte tipos além do
  necessário para desenhar (`pop_2000` texto → número na hora de pintar; o que não
  converter fica "sem dado").
- `--report <arquivo.json>`: escreve as inconsistências que encontrou (ver §7).

Funções puras (parse do `.qgs`, montagem do manifest, checagens) testadas com
`unittest` em `scripts/geodata/tests/`.

### 2. Servir os arquivos — `src/app/api/geodata/[...path]/route.ts`

- Lê de `process.env.GEODATA_DIR`; sem a variável responde 503 com mensagem que
  diz o que falta.
- Guarda contra path traversal (só caminhos dentro do diretório, extensões
  `.json`, `.geojson`, `.png`).
- `Cache-Control: public, max-age=86400` e `ETag` pelo mtime/tamanho.
- Lógica de resolução de caminho e de tipo em `src/features/geodata/` (pura,
  testada); a rota só faz I/O.

### 3. Domínio do mapa — `src/features/panelMap/` (puro, testado)

- `zoomLevels.ts`: `resolveZoomLevel(zoom)` → `"area" | "estado" | "municipio"`,
  limiares em constantes (`STATE_ZOOM = 6.5`, `MUNICIPALITY_ZOOM = 8.5`, ajustáveis
  ao ver o mapa). Para o IDH o nível máximo é `"estado"`.
- `recorte.ts`: dado o nível e o ponto central (feição que contém o centro, vinda
  do MapLibre), produz o recorte `{ uf?: string; mun?: string }`; compara com os
  filtros atuais e diz se há mudança (`recorteChanged`). Zoom de volta ao nível
  área → limpa Estado e Município.
- `qgisStyle.ts`: tipos de `styles.json` e `classPaint(style, ano)` → expressão
  MapLibre `step`/`case` sobre a coluna do ano, com cor de "sem dado".
- `mapLayers.ts`: véu cinza como filtro de camada (estados fora do recorte; no
  nível município, também os municípios fora dele) — mais simples que o
  "mundo com furo" do Atlas e cobre as "áreas não destacadas".
- `mapTooltip.ts`: texto do tooltip — nome, valor formatado pelo formatador do
  painel, `Nº no ranking` via `rankRegions` sobre as feições do recorte atual.
- `geodataUrls.ts`: URLs a partir do manifest.

### 4. Componente — `src/components/PanelMap/`

- `PanelMap.tsx` (client): monta o MapLibre, adiciona fontes/camadas na ordem
  basemap → raster → indicador → véu → limites → contorno do recorte. Recebe por
  props o indicador (`"pib" | "demografia" | "idh"`), ano, filtros atuais,
  `formatValue` e `onRecorteChange`.
- `useMapRecorte.ts`: escuta `moveend`, resolve nível e alvo, ignora o `moveend`
  causado por enquadramento programático e chama `onRecorteChange` só quando o
  recorte muda.
- `useFitToFilters.ts`: quando os filtros da barra mudam, enquadra
  (`fitBounds`) a seleção (área, estados ou municípios; vários = união).
- `BasemapSwitch.tsx` (Satélite | Oceano), `AridezToggle.tsx` (liga/desliga +
  década), `PanelMapLegend.tsx` (classes do `.qgz`; aridez quando ligada),
  `PanelMapTooltip.tsx`.
- `maplibreAdapter.ts`: a única peça que importa `maplibre-gl` (interface fina
  do projeto, como `src/lib` faz com SDKs).
- Basemaps: ESRI World Imagery e ESRI World Ocean Base como fontes raster XYZ, com
  atribuição.

### 5. Comportamento do recorte

- **Área de interesse** (zoom baixo): municípios da área do filtro (flags `ne`,
  `semi_21_1`, `caat_24`, `aas_21_1`) coloridos; limites estaduais; contorno da
  área. Sem véu.
- **Estado** (zoom médio): o estado sob o centro do mapa vira o filtro `uf`; véu
  cinza sobre tudo fora dele; contorno grosso do estado.
- **Município** (zoom alto; não existe no IDH): o município sob o centro vira o
  filtro `mun`; véu fora dele.
- Clique numa feição: enquadra nela (o que, pelo zoom, aplica o filtro).
- Filtro com vários estados/municípios: véu fora da união; enquadra a união. O
  zoom manual depois volta ao filtro único do alvo central.
- O filtro é aplicado pelo mesmo caminho que a barra de filtros usa (URL +
  navegação), então os outros cards recarregam como hoje (`usePendingFilters`,
  estados `stale`).

### 6. Integração nos painéis

- PIB: `PibMapCard` passa a renderizar `PanelMap indicador="pib"` (municipal;
  deixa de ser só por estado).
- Perfil demográfico: o card do mapa de porte usa `PanelMap
  indicador="demografia"`; os toggles Municípios/Estados e o `ChoroplethCanvas`
  desse card saem. A tabela `sr-only` (`buildPerfilPorteTable`) fica.
- IDH: o card do mapa usa `PanelMap indicador="idh"` (nível máximo estado).
- O fullscreen dos cards (`ProtoMapFullscreen`, slot `overlay`) passa a hospedar o
  mesmo `PanelMap`.
- Componentes que ficarem sem uso são removidos e listados em `docs/README.md`.

### 7. Relatório de dados (PDF)

O script de preparação grava as inconsistências; um gerador monta um PDF em
português para o responsável pelos dados, com arquivo, camada, campo, o problema,
evidência e o que se espera. Já encontrados:

- `demografia.qgz`: classe "Médio" com limites 50.000 → 10.000 (o rótulo diz
  "> 50 mil e ≤ 100 mil"); a classe "Grande" começa em 10.000.
- `demografia.shp`: `pop_2000` é texto; `pop_2010`/`pop_2022` são inteiros.
- `pib.qgz`: menor limite da 1ª classe é −190.464.340 (há PIB municipal negativo?).
- Não há polígono do Semiárido em `shapefile_geral` (é derivado no script).
- `sudene_mun.cpg` está nomeado `municipio_sudene.cpg`.

A lista final sai da checagem completa (nulos, códigos duplicados, municípios sem
geometria, anos faltando, divergência entre classes e rótulos).

### 8. Deploy e ambiente

- `.env.sample`: `GEODATA_DIR`.
- **Só gamma por enquanto** (decisão do usuário, 23/11/2026): as demos só rodam
  lá (`DEMOS_HABILITADAS=1`). `deploy-gamma.yml` ganha
  `-v /opt/datane/geodata:/geodata:ro -e GEODATA_DIR=/geodata`; beta e prod ficam
  como estão até as demos irem para lá.
- Os arquivos são copiados (rsync) para `/opt/datane/geodata` na VM do gamma
  (runner `datane-gamma-lsd-runner`, LSD) nesta entrega, depois de conferir o host
  por SSH. A montagem só vale a partir do próximo deploy do gamma.
- Runbook em `docs/README.md` (seção nova "Mapas dos painéis"): rodar o script,
  copiar `<out>/` para a VM (rsync); reiniciar não é necessário (arquivos lidos
  por requisição).

### 9. Verificação

- `npm run lint`, `npm test`, `npm run build`; testes do script Python.
- Rodar localmente (VPN + túnel + `GEODATA_DIR` local) e mostrar os três painéis
  funcionando: troca de basemap, aridez, zoom área → estado → município com véu e
  filtro aplicado, tooltip com ranking.

## Decidido com o usuário

- Abordagem 1; mapa no lugar do card de cada painel (opção A).
- O zoom aplica o filtro do painel e dispara as consultas.
- Véu cinza só a partir do nível estado.
- Não corrigir dados; reportar em PDF.
- Rodar localmente e mostrar ao final.
- Geodados só no gamma por enquanto; copiar para a VM faz parte da entrega.

## Respostas à revisão do construtor

- **Fonte dos valores** (decidido na escolha da abordagem 1): atributos dos shapes
  do Drive; o banco continua alimentando os outros cards. Consequência aceita: o
  tooltip pode divergir dos big numbers. O script compara shape × banco (PIB e
  população por município, IDH por estado, ano a ano, quando o túnel estiver de
  pé) e as divergências entram no PDF — sem corrigir nada. Ano do filtro ausente
  no shape → "sem dado" no mapa. **Unidade:** o construtor confere a ordem de
  grandeza do `pib_*` contra o banco antes de escolher o formatador; se não
  bater, entra no PDF.
- **IDH** (minha decisão): o IDH não tem `area`/`mun`. O nível "área" mostra os 9
  estados do Nordeste; o zoom escreve `uf` pelo `buildIdhSearch`. O mapa só existe
  na visão geral (onde já está hoje); as visões sexo/cor não mudam. A legenda do
  mapa vem do `.qgz`; os outros cards continuam com `IDH_MAP_BUCKETS`.
- **Regra de nível** (minha decisão): descer de nível (escolher estado/município)
  usa os limiares absolutos de zoom. Subir de nível (limpar o filtro) só acontece
  quando o usuário afasta o zoom para abaixo do zoom do último enquadramento menos
  0,5. Assim, escolher Bahia ou vários estados na barra não é desfeito pelo
  primeiro movimento. Arrastar sem mudar o zoom troca o alvo dentro do mesmo nível
  (o estado/município sob o centro), que é o "recorte do que está sendo dado o
  zoom". Movimentos programáticos (`fitBounds` pelo filtro) nunca geram filtro.
- **IDs do Drive**: levantados nesta sessão (pasta `1zXWbyU02PrbuZj9JQQRjf9bwZf-GoKg6`,
  pública por link); o `drive_manifest.json` é escrito à mão com eles. Sem API do
  Drive.
- **Baixar imagem** (minha decisão): fica, só em PNG: `preserveDrawingBuffer` no
  MapLibre e `map.getCanvas().toDataURL()`, com a atribuição ESRI desenhada no
  rodapé da imagem. Se os tiles ESRI não permitirem CORS, o item fica desabilitado
  com explicação (como o Gini).
- **Ranking do tooltip** (minha decisão): posição entre os municípios da área de
  interesse selecionada (IDH: entre os 9 estados), no ano do filtro — estável
  durante o zoom. Feições sob o véu também mostram tooltip, com o mesmo ranking.
- **Ambiente local**: além de VPN + túnel e `GEODATA_DIR`, as demos exigem
  `DEMOS_HABILITADAS=1` (`src/app/demo/layout.tsx`).

## Deixado ao construtor

- Limiares exatos de zoom e tolerância de simplificação (constantes nomeadas).
- Cor e opacidade do véu (partindo do Atlas: `#9ca3af`, 0,75).
- Layout dos controles dentro do card.
