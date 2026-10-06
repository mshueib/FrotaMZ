# FrotaMZ

Protótipo de gestão de frota e rent-a-car para empresas em Moçambique, inspirado no Gestware Fleet Management.
Interface, textos e comentários em **português (pt-PT/Moçambique)**. Moeda: meticais (MT/MZN). IVA geral: 16%.

## Estado atual

- Protótipo funcional em HTML + CSS + JavaScript puro (sem framework, sem build).
- Publicado também como artefacto Claude: https://claude.ai/artifact/EpjPz9uShEhxfzroDzdqWr
  (lá usa a base de dados do artefacto via `window.claude.use('db')`).
- Aberto localmente (`index.html`) corre em **modo demonstração**: carrega `window.SAMPLE` e guarda alterações em `localStorage` (chave `frotamz-demo-v1`).

## Estrutura

```
index.html            Estrutura da página (sidebar, header, drawer, toast)
css/styles.css        Tokens de cor (claro/escuro), layout, componentes
js/app.js             Toda a lógica: camada de dados, regras de negócio, vistas, formulários, eventos
js/sample-data.js     Gerado de data/sample.json (npm run sample) — não editar à mão
data/sample.json      Dados de exemplo (fonte de verdade)
scripts/              gen-sample.mjs, build-artifact.mjs (gera dist/frotamz-artifact.html num só ficheiro)
```

## Comandos

- `npm run dev` — serve a pasta em http://localhost:5173 (ou abrir `index.html` diretamente no browser)
- `npm run sample` — regenera `js/sample-data.js` depois de mudar `data/sample.json`
- `npm run build:artifact` — gera ficheiro único para republicar como artefacto

Para voltar aos dados de exemplo no browser: apagar `localStorage['frotamz-demo-v1']` (DevTools > Application).

## Arquitetura de `js/app.js`

1. **Camada de dados**: `S` (estado em memória, uma lista por coleção) + `save`, `patch`, `remove`, `saveConfig`.
   `mode` é `'db'` (artefacto) ou `'demo'` (localStorage). Qualquer backend novo deve implementar estas 4 funções.
2. **Coleções**: `viaturas`, `motoristas`, `abastecimentos`, `despesas`, `planos`, `servicos`, `clientes`, `reservas`, `faturas` + documento `config/empresa`.
   Relações por id: `viaturaId`, `clienteId`, `motoristaId`, `reservaId`, `faturaId`.
3. **Regras de negócio**: `planStatus` (manutenção por km OU meses, o que chegar primeiro; aviso a 1500 km / 30 dias),
   `docState` (documentos caducados / a caducar em 30 dias), `vStats` (consumo L/100 km, custo/km, receita),
   `overlap` (conflito de reservas), `alerts` (lista do painel), `fatSub`/`fatIva`/`fatTot`.
   Motoristas: `mEstado` (calculado, nunca guardado: `inativo` → `ferias` se hoje ∈ `feriasInicio..feriasFim` → `servico` se tem aluguer `curso` → `disponivel`),
   `mConflito` (inativo, de férias, já atribuído a outro aluguer no período, carta caduca antes da devolução), `feriasErro`.
   Combustível: `fillCons` (cada abastecimento cobre os km desde o anterior da mesma viatura), `consRef` (viatura `consumoRef`
   ou mediana do histórico com ≥3 medições), `consDesvio` (anormal se acima de `config.toleranciaConsumo`, 20% por omissão).
   Período: `periodo()` lê `filters.per` (mes, mesant, 3m, ano, tudo, pers + `pDe`/`pAte`), partilhado por Custos e Relatórios;
   `vStats(v, P)` calcula tudo dentro do período. `verConsumo(viaturaId)` abre na gaveta (larga) o histórico de abastecimentos
   com gráfico de consumo vs. referência/limite e o excesso em litros e MT (`data-cons` em linhas `tr` ou botões).
4. **Vistas**: `viewPainel`, `viewViaturas`, `viewMotoristas` (quadro Disponíveis / Em serviço / De férias + lista; com `filters.mid` mostra `viewMotorista`, o painel individual), `viewReservas`, `viewClientes`, `viewFaturas`, `viewCustos`, `viewManutencao`, `viewRelatorios`, `viewDefinicoes` — devolvem HTML em string; `render()` redesenha tudo.
5. **Formulários**: `openDrawer(title, fields, init, onSubmit, opts)` gera o formulário a partir de uma lista de campos.
   Tipos extra: `{type:'section',label}` (título de secção) e `{type:'note',html}`; `ro:1` = só leitura. Campos obrigatórios em falta
   ficam marcados (`.fld.invalid`) com a mensagem no topo; `opts.validate` devolve texto ou `{k, msg}` para marcar um campo.
   O botão fica "A guardar…" enquanto grava. `opts.change(e)` corre ao abrir e em cada `input`/`change`.
6. **Eventos**: um único listener de `click` com `data-*` (`data-view`, `data-new`, `data-edit="colecao:id"`, `data-ent`, `data-dev`, `data-faturar`, `data-fat`…).
   Linhas clicáveis: `tr[data-open]` (`rq:id`, `mot:id`, `edit:colecao:id`) e `tr[data-cons]`; também abrem com Enter.
   O menu mostra contadores (alertas urgentes, devoluções em atraso, requisições por verificar/pagar).

## Fluxo do aluguer

`reservada` → **Entregar** (grava `kmSaida`, viatura `alugada`) → `curso` → **Devolver** (grava `kmEntrada`, extras; viatura `disponivel`, km atualizado) → `concluida` → **Faturar** (cria fatura `FT AAAA/NNNN`, liga `faturaId`) → fatura `pendente` → `paga`. Também `cancelada`.

Aluguer com motorista: a reserva pode ter `motoristaId` + `tarifaMotorista` (MT/dia, por omissão a `tarifa` do motorista).
`resValor` soma viatura + motorista; a fatura ganha a linha "Serviço de motorista". Sem motorista, o cliente conduz (`condutores`).

## Requisições de combustível

Coleção `requisicoes`. O `numero` é **digitado à mão** (nº do livro de requisições), normalizado com `normNum` e único (ignora espaços e maiúsculas). `pendente` (por verificar) → **Verificar** (`verificarReq`: litros/preço reais e km;
cria o abastecimento com `requisicaoId` e grava `abastecimentoId`, `valorReal`) → `verificada` (por pagar) → **Pagar** (`pagarReq`:
`faturaNr`, `reciboNr`, `dataPag`, `valorPago`, `formaPag`) → `paga`. Também `anulada`. Várias requisições podem partilhar a mesma
fatura do posto (faturação mensal), por isso não há bloqueio de duplicados. Alertas: por verificar há >7 dias, por pagar há >30 dias.

Bombas de combustível: coleção `postos` (`nome`, `precoDiesel`, `precoGasolina`, `precoData`, `historico[]`, `estado`).
A requisição guarda `postoId`, `posto` (nome), `combustivel` (`combDe(viatura)`: híbrido → Gasolina, elétrico → nenhum) e
`precoLitro` copiado da bomba no momento da emissão — campo só de leitura (`ro:1` no `openDrawer`), recalculado ao guardar.
Na verificação o preço também é fixo (`precoReal = precoLitro`). Mudar o preço da bomba não altera requisições já emitidas.
`openDrawer` aceita `opts.change(e)` (chamado em cada `change` do formulário e uma vez ao abrir) e dicas com id `h_<campo>`.

## Regras do domínio (Moçambique)

- NUIT: 9 dígitos (validado em clientes e empresa).
- Matrículas no formato `AAA 123 XX` (XX = província: MC, MP, GZ, SL…). Mostradas com o componente `.plate`.
- Documentos da viatura: seguro, inspeção periódica, imposto/licença anual.
- Faturas: NUIT do emitente e do cliente, IVA discriminado, numeração sequencial por série anual.
  **Não tem validade fiscal**: a versão de produção precisa de software de faturação autorizado pela Autoridade Tributária.

## Convenções

- Escapar sempre texto do utilizador com `esc()` antes de o pôr em HTML.
- Formatação: `fmt(n, casas)`, `MT(n)`, `MT0(n)`, datas `dd('AAAA-MM-DD')` → `DD/MM/AAAA`. Datas guardadas em ISO `AAAA-MM-DD`.
- Cores só via tokens CSS (`--accent`, `--crit`, `--warn`, `--ok`…); o tema escuro redefine os tokens.
- Fontes: Barlow (UI), Barlow Semi Condensed (títulos), IBM Plex Mono (matrículas, NUIT, números de fatura).
- Nada de `alert()/confirm()/prompt()` — confirmações são feitas na própria UI.
- **Ecrãs limpos** (pedido do utilizador): no máximo 3–4 quadros de resumo e 5–6 colunas por tabela; não repetir o mesmo número
  em quadros, colunas e listas. O detalhe vai para a ficha que abre ao clicar na linha (`tr[data-open]`) ou para a dica (`title`).
  Na linha da tabela aparece só a **próxima ação** (Verificar, Pagar, Entregar…); editar/anular/apagar ficam na ficha.
  Listas do Painel mostram 5 itens com "Ver mais". Período escolhe-se numa lista (`#per`), não em botões.

## Próximos passos (roadmap)

1. Backend real: API (Node/Express ou NestJS) + PostgreSQL, ou Firebase; autenticação e multiempresa (`empresaId` em todas as coleções).
2. Migrar o frontend para React + Vite quando o backend existir (as vistas atuais mapeiam 1:1 para componentes).
3. Módulos em falta face ao Gestware: planificação de viagens, área do motorista/funcionário, documentos de pessoal, anexos (fotos, PDFs).
4. Exportações (PDF da fatura, Excel dos relatórios), filtros por período nos relatórios.
5. Docker Compose para instalação em servidor.
6. Faturação certificada (integração com software autorizado pela AT).
