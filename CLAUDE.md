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
2. **Coleções**: `viaturas`, `motoristas`, `subsidios`, `postos`, `requisicoes`, `utilizadores`, `abastecimentos`, `despesas`, `planos`, `servicos`, `clientes`, `reservas`, `faturas` + documento `config/empresa`.
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

## Impressão, ficha da viatura e pesquisa

- **Imprimir / PDF**: `imprimir(html, nome)` põe o documento em `#print` (só visível em `@media print`) e chama `window.print()`;
  o `document.title` passa a ser o nome sugerido do PDF. Documentos: `fatHTML(f)` (fatura) e `reqHTML(r)` (requisição para o
  motorista levar ao posto, com a parte "A preencher pelo posto" e assinaturas). Botões `data-print="fat:id"` / `"rq:id"`.
  Depois de emitir uma requisição, a ficha abre logo (`opts.after` do `openDrawer` recebe o valor devolvido por `onSubmit`).
- **Ficha da viatura**: `abrirViatura(id)` → `filters.vid` → `viewViatura(v)` (estado, custos, consumo, receita, reservas,
  documentos, manutenção, últimos abastecimentos). A linha da lista abre a ficha (`data-open="vei:id"`); Editar está na ficha.
- **Pesquisa global**: Ctrl+K (ou `/`) ou o botão "Procurar…" do cabeçalho. `buscar(q)` procura sem acentos e compara a matrícula
  também sem espaços; respeita `veVista` do perfil. Setas + Enter para abrir, Esc para fechar.

- **Painel por perfil** (`viewPainel`): contabilista → requisições por pagar, faturas por receber, alugueres por faturar;
  operador → entregas/devoluções de hoje e próximos 7 dias; gestor → alertas da frota, requisições por verificar, entregas;
  admin/consulta → visão geral. Listas com "Ver mais" via `data-more="<chave>"` → `filters[<chave>+'All']`.
  O contador do menu Requisições só conta o que o perfil pode fazer (verificar e/ou pagar).
- **Formulários que se lembram**: `ultimosReq(viaturaId)` sugere bomba, motorista e litros na requisição nova (volta a sugerir
  ao trocar de viatura, se o campo não foi mexido à mão); `sugAbast(viaturaId)` sugere posto, preço da bomba e mostra a última
  leitura de km. `opts.again` no `openDrawer` acrescenta "Guardar e registar outro" (abastecimentos). **Duplicar** na ficha da
  requisição (`data-rqdup`) e na ficha da reserva (`verReserva`, `data-resdup`; reservas não-"reservada" abrem a ficha).
- **Desfazer** (em vez de pedir confirmação): `toast(msg, desfazer(fn))` mostra o botão durante 8 s. Usado em apagar (o `remove`
  regista em `lixo` tudo o que foi apagado na ação e o Desfazer volta a gravá-lo), anular requisição, cancelar reserva,
  terminar férias e marcar fatura como paga.

## Perfis de acesso e tema

- Coleção `utilizadores` (`nome`, `email`, `perfil`, `estado`). Perfis em `PERFIS`: `admin`, `gestor` (gestor de frota),
  `contabilista`, `operador` (rent-a-car), `consulta` (só leitura).
- `VISTAS_PERFIL` = módulos que cada perfil vê no menu; `PERMS` = ações que alteram dados (`viaturas`, `req.verificar`,
  `req.pagar`, `fat.emitir`, `fat.pagar`, `apagar`…). O admin pode tudo; **apagar é só do admin**. Use `pode(acao)` / `precisa(acao)`.
- Cada formulário declara `opts.perm`; sem permissão, `openDrawer` abre o mesmo formulário **só para leitura**.
  Botões de ação são escondidos por `aplicarPerms()` (mapa `BTN_PERM`) e o listener de cliques volta a verificar (guardas).
- Sessão: `eu()` lê o id em `localStorage['frotamz-utilizador']`. Sem sessão → ecrã "Quem está a usar?" (sem palavra-passe).
  Sem utilizadores registados entra-se como administrador temporário; o primeiro utilizador criado tem de ser admin.
  Não é possível ficar sem administrador ativo nem desativar a própria conta. A requisição guarda `verificadoPor` e `pagoPor`.
- **Não é segurança real** (tudo corre no navegador). Com backend, as mesmas regras têm de ser validadas no servidor.
- Tema: botão no cabeçalho alterna Automático → Claro → Escuro (`data-theme` no `<html>`, guardado em `localStorage['frotamz-tema']`).

## Fluxo do aluguer

`reservada` (Reservada) → no dia: alerta **Entregar hoje** (antes: "Levantamento em atraso") → **Entregar** (`formEntrega`) →
`curso` (Em aluguer) → no dia previsto: **Receber hoje** (depois: "Atrasada N dias") → **Receber** (`formDevolucao`) →
`concluida` (Devolvida **no prazo** / **com N dias de atraso** / **N dias antes**, ver `resSituacao`) → **Faturar** → fatura
`pendente` → `paga`. Também `cancelada`. **Ecrã Reservas** (`viewReservas`) separado pela tarefa: bloco **↗ Entregar ao cliente** (reservadas, por
`inicio`) e bloco **↙ Receber do cliente** (em aluguer, por `fim`); cada linha diz quando em linguagem simples (`quando(data)`:
Hoje, Amanhã, Atrasada N dias, Em N dias). Cartões no topo filtram (`filters.rs` = 'entregar' | 'receber' | 'historico' | 'tudo');
o Histórico (devolvidas e canceladas) fica à parte. No Painel, `hojeBar()` tem dois atalhos ("N para entregar ao cliente",
"N para receber do cliente", `data-rsgo`). O contador do menu Reservas conta o que é para hoje ou está atrasado.

- **Cancelar** (só reservas ainda não entregues): `formCancelar` pede o motivo (`MOTIVOS_CANCEL`; "Outro" exige observações) e
  grava `motivoCancel`, `obsCancel`, `canceladaEm`, `canceladaPor`. Tem Desfazer. O motivo aparece na ficha e no Histórico.
- **Expiração**: uma reserva `reservada` que passa `PRAZO_EXP()` dias (config `diasExpiraReserva`, 3 por omissão, em
  Empresa) da data de levantamento passa sozinha a `expirada` (`expirarReservas`, corre uma vez ao abrir a aplicação, depois de
  carregar reservas e config; grava `expiradaEm`, `motivoExpira`) e avisa. Expiradas não bloqueiam a viatura (`overlap`), vão
  para o Histórico ("Não levantada", sem valor) e a ficha tem **Reativar com novas datas** (`data-reativar`). Antes disso, a
  linha e o alerta mostram "expira em N dias" (`expiraEm`).
- **Antecipações justificadas**: receber antes de `fim` obriga a escolher a justificação (`opcoesAntecip()`): um motivo de
  `MOTIVOS_DEV_ANTES` ("Outro" exige `obsAntecipada`) → cobram-se só os dias usados; ou **"Sem justificação"** (`SEM_JUST`,
  grava `cobrarCompleto:true`) → cobra-se o **período combinado completo** (`resCalc().completo`). Pode mudar-se na ficha antes
  de faturar (`formAntecipada`, `data-antecip`). Texto mostrado: `antecipTxt(r)`; entregar antes de `inicio` exige `motivoEntregaAntes` (`MOTIVOS_ENT_ANTES`, `obsEntregaAntes`). Os campos só
  aparecem quando se aplicam. O motivo aparece na linha do tempo da ficha, no Histórico, no cálculo, na fatura e no auto de receção
  (`justif(motivo, obs)`, `devAntes(r)`).
- **Datas**: `inicio`/`fim` são o período **reservado** e não mudam. A entrega real é `checkEntrega.data` (`resSaida`) e a
  devolução real é `devolvidoEm`. **Os dias contam desde a data reservada** (`resDesde`), mesmo que o cliente levante mais
  tarde (`levAtraso`: aviso no formulário de entrega, na ficha, no cálculo e na fatura); só contam antes se a entrega for
  antecipada. No levantamento atrasado, o formulário de entrega e a linha da lista oferecem **Cancelar reserva** (motivo sugerido
  "Cliente não compareceu"). Depois de entregar não abre a ficha: só o aviso com o atalho "Imprimir auto de entrega".
  Depois de receber também não: aviso "… recebida de … · valor sem IVA" com **Faturar** (ou "Ver cálculo" sem `fat.emitir`).
- **Valor** (`resCalc`), em duas partes:
  1. **Período combinado**: dias reservados (`dc`) × (tarifa viatura + tarifa motorista). Se devolveu antes, só os dias usados
     (`dBase`), com a nota "devolvida N dias antes".
  2. **Dias extra fora do período** (`dExtra`, de `extraDe` = entrega + dias combinados até `extraAte` = devolução; em aluguer,
     até hoje) × as mesmas tarifas. Cobram-se por omissão; `cobrarExtra:false` deixa-os visíveis mas não cobrados e exige
     `motivoSemExtra`. Decide-se na receção (caixa "Cobrar os dias extra…", só aparece se houver dias extra) ou depois, na
     ficha, antes de faturar (`formDiasExtra`, `data-extra`).
  Depois: − desconto (`descontoTipo` 'pct'|'valor', `descontoValor`, `descontoMotivo` obrigatório) + **outros encargos**
  (`extras`/`extrasDesc`: danos, combustível…). `calcHTML` mostra o quadro com as duas partes e subtotais. A fatura tem linhas
  separadas: período combinado, dias extra (ou linha a 0 MT "não cobrados: motivo"), desconto (negativo) e outros encargos.
- **Checklists** na entrega e na receção (`CHECK_ITENS`, frases afirmativas): cada ponto **Sim / Não**; ao escolher Não abre-se,
  à frente, o campo do problema (obrigatório). Campo `{type:'checklist'}` devolve `k` = {ponto:'sim'|'nao'} e `k+'Notas'`.
  Também é obrigatória a caixa `{type:'checkbox'}` "O cliente conferiu a viatura connosco e concorda". Grava
  `checkEntrega` / `checkDevolucao` = {data, hora, por (utilizador com sessão), porId, km, combustivel, itens, notas, obs, pessoa,
  clienteConfirmou}. Na receção, o quadro avisa combustível abaixo do da saída e problemas novos face à entrega.
- **Ficha da reserva** (`verReserva`): linha do tempo Reservada → Entregue → Devolvida (datas, horas e quem), cálculo, os dois
  checklists e os autos de entrega/receção para imprimir (`autoHTML(r,'ent'|'dev')`, `data-print="auto:id"` / `"autodev:id"`).

Aluguer com motorista: a reserva pode ter `motoristaId` + `tarifaMotorista` (MT/dia, por omissão a `tarifa` do motorista).
`resValor` soma viatura + motorista; a fatura ganha a linha "Serviço de motorista". Sem motorista, o cliente conduz (`condutores`).

## Painel de pagamentos

Vista `viewPagamentos` (menu Análise → "Pagamentos"; admin, gestor, contabilista, consulta). `movimentos()` monta um livro único
a partir dos registos existentes (não há coleção própria): **saídas** = requisições pagas e abastecimentos sem requisição
(combustível), subsídios pagos/recebidos, serviços de oficina e despesas; **entradas** = faturas pagas. Abastecimentos e despesas
feitos enquanto a viatura estava com um cliente ligam-se a esse aluguer (`resNaData`). Agrupa por Tipo / Viatura / Aluguer /
Motorista (`filters.pag`, `grupoDe`), com período; cada grupo abre o detalhe (`verGrupoPag`) e cada movimento abre o registo
de origem. A fatura passa a registar o recebimento (`receberFatura`: `dataPaga`, `formaPaga`, `refPaga`, `pagaPor`).

## Subsídios dos motoristas

Coleção `subsidios` (vista `viewSubsidios`, menu "Subsídios"): `pendente` (por pagar) → **Pagar** (`pagarSub`: `dataPag`,
`formaPag` de `FORMAS_SUB`, `refPag` obrigatória exceto em numerário, `pagoPor`; atalho "Imprimir recibo") → `pago` (falta confirmar)
→ **Confirmar recebimento** (`confirmarSub`: `dataConf`, `modoConf` de `MODOS_CONF`, `obsConf`, caixa obrigatória "o motorista
confirmou", `confPor`) → `confirmado`. Também `anulado` (só por pagar, com Desfazer). Cada subsídio liga-se à reserva (`reservaId`).
- Gera-se sozinho na receção de um aluguer com motorista (`gerarSubsidio`): dias reais com o cliente × `SUB_DIA(motorista)`
  (`motorista.subsidioDia` ou `config.subsidioDia`, 500 MT por omissão). Se já houve adiantamento pago para a reserva, gera só o
  **complemento** dos dias em falta; um subsídio ainda por pagar é atualizado. Também se registam à mão (adiantamentos, deslocações).
- Permissões: `sub.gerir` (gestor), `sub.pagar` (contabilista), `sub.confirmar` (gestor e contabilista).
- Aparece na ficha do motorista, na ficha da reserva, no Painel da contabilista ("Subsídios por pagar") e nos alertas
  (por pagar há >7 dias; pago há >7 dias sem confirmação). Recibo para assinar: `subHTML` (`data-print="sub:id"`).

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

## Apagar vs. desativar viaturas

`vUso(id)` decide: **reservas ativas** (reservada/em curso) → não se pode apagar nem desativar (e "Inativa" não aparece no estado);
**histórico** (reservas terminadas, faturas, abastecimentos, requisições, oficina, despesas) → só **Desativar…** (`formDesativar`:
`motivoInativa` obrigatório de `MOTIVOS_INATIVA`, `dataInativa`, `obsInativa`, `inativadaPor`); **sem uso** → Apagar (só admin;
os planos de manutenção da viatura são apagados juntos). "Inativa" só se escolhe pelo botão Desativar; reativar = mudar o estado
(o motivo é limpo). `openDrawer` aceita `opts.extra` (HTML de botões à esquerda no rodapé quando não há Apagar).

## Regras do domínio (Moçambique)

- NUIT: 9 dígitos (validado em clientes e empresa).
- Matrículas no formato `AAA 123 XX` (XX = província: ZB Zambézia, MC Maputo Cidade, MP Maputo Província, SF Sofala, NP Nampula…). Mostradas com o componente `.plate`.
- Dados de exemplo situados em **Quelimane (Zambézia)**: matrículas e cartas ZB, bombas, oficinas e moradas locais.
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
3. Módulos em falta face ao Gestware: planificação de viagens, documentos de pessoal, anexos (fotos, PDFs).
   **Os motoristas não usam a aplicação**: é usada só pelo escritório (admin, gestor, contabilista, operador, consulta).
   Os dados dos motoristas (km, talões, entregas) são registados pelo pessoal do escritório.
4. Exportações (PDF da fatura, Excel dos relatórios), filtros por período nos relatórios.
5. Docker Compose para instalação em servidor.
6. Faturação certificada (integração com software autorizado pela AT).
