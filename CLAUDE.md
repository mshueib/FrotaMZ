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
2. **Coleções**: `viaturas`, `abastecimentos`, `despesas`, `planos`, `servicos`, `clientes`, `reservas`, `faturas` + documento `config/empresa`.
   Relações por id: `viaturaId`, `clienteId`, `reservaId`, `faturaId`.
3. **Regras de negócio**: `planStatus` (manutenção por km OU meses, o que chegar primeiro; aviso a 1500 km / 30 dias),
   `docState` (documentos caducados / a caducar em 30 dias), `vStats` (consumo L/100 km, custo/km, receita),
   `overlap` (conflito de reservas), `alerts` (lista do painel), `fatSub`/`fatIva`/`fatTot`.
4. **Vistas**: `viewPainel`, `viewViaturas`, `viewReservas`, `viewClientes`, `viewFaturas`, `viewCustos`, `viewManutencao`, `viewRelatorios`, `viewDefinicoes` — devolvem HTML em string; `render()` redesenha tudo.
5. **Formulários**: `openDrawer(title, fields, init, onSubmit, opts)` gera o formulário a partir de uma lista de campos.
6. **Eventos**: um único listener de `click` com `data-*` (`data-view`, `data-new`, `data-edit="colecao:id"`, `data-ent`, `data-dev`, `data-faturar`, `data-fat`…).

## Fluxo do aluguer

`reservada` → **Entregar** (grava `kmSaida`, viatura `alugada`) → `curso` → **Devolver** (grava `kmEntrada`, extras; viatura `disponivel`, km atualizado) → `concluida` → **Faturar** (cria fatura `FT AAAA/NNNN`, liga `faturaId`) → fatura `pendente` → `paga`. Também `cancelada`.

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

## Próximos passos (roadmap)

1. Backend real: API (Node/Express ou NestJS) + PostgreSQL, ou Firebase; autenticação e multiempresa (`empresaId` em todas as coleções).
2. Migrar o frontend para React + Vite quando o backend existir (as vistas atuais mapeiam 1:1 para componentes).
3. Módulos em falta face ao Gestware: planificação de viagens, área do motorista/funcionário, documentos de pessoal, anexos (fotos, PDFs).
4. Exportações (PDF da fatura, Excel dos relatórios), filtros por período nos relatórios.
5. Docker Compose para instalação em servidor.
6. Faturação certificada (integração com software autorizado pela AT).
