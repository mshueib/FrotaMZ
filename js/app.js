const SAMPLE = window.SAMPLE || {config:{}};
const COLS=['viaturas','motoristas','subsidios','postos','requisicoes','abastecimentos','despesas','planos','servicos','utilizadores','clientes','reservas','faturas'];
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=0)=>new Intl.NumberFormat('pt-PT',{minimumFractionDigits:d,maximumFractionDigits:d}).format(+n||0);
const MT=n=>fmt(n,2)+' MT';
const MT0=n=>fmt(n,0)+' MT';
const pad=(n,l=2)=>String(n).padStart(l,'0');
const toISO=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const TODAY=toISO(new Date());
const dd=s=>{if(!s)return '—';const[y,m,d]=s.split('-');return `${d}/${m}/${y}`};
const ddShort=s=>{if(!s)return '';const[y,m,d]=s.split('-');return `${d}/${m}`};
const days=(a,b)=>Math.round((new Date(b+'T12:00')-new Date(a+'T12:00'))/864e5);
const addMonths=(s,m)=>{const d=new Date(s+'T12:00');d.setMonth(d.getMonth()+(+m||0));return toISO(d)};
const addDays=(s,n)=>{const d=new Date(s+'T12:00');d.setDate(d.getDate()+n);return toISO(d)};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const sum=(a,f)=>a.reduce((s,x)=>s+(+f(x)||0),0);

let S={config:{},...Object.fromEntries(COLS.map(c=>[c,[]]))};
let mode='loading', db=null, view='painel', filters={};
const VIEWS={
  painel:{t:'Painel',g:'Operação',i:'<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>'},
  viaturas:{t:'Viaturas',g:'Operação',i:'<path d="M5 17h14M3 13l2-6h14l2 6v4h-2M5 17H3v-4"/><circle cx="7.5" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/>'},
  motoristas:{t:'Motoristas',g:'Operação',i:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.2"/><path d="M3.5 10.5c5.5-1.6 11.5-1.6 17 0M10 13.8l-3.2 6.4M14 13.8l3.2 6.4"/>'},
  subsidios:{t:'Subsídios de motoristas',n:'Subsídios',g:'Operação',i:'<circle cx="9" cy="9" r="5.5"/><path d="M9 6.5v5M7.3 8h2.6a1 1 0 0 1 0 2H8"/><path d="M14.5 10.8a5.5 5.5 0 1 1-3.7 9.6"/>'},
  reservas:{t:'Reservas',g:'Rent-a-Car',i:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'},
  clientes:{t:'Clientes',g:'Rent-a-Car',i:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.8c1.6.8 2.6 2.5 3 5.2"/>'},
  faturas:{t:'Faturação',g:'Rent-a-Car',i:'<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/>'},
  custos:{t:'Combustível e custos',n:'Combustível',g:'Custos',i:'<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M6 9h6M14 11h2a2 2 0 0 1 2 2v4a1.5 1.5 0 0 0 3 0V8l-3-3"/>'},
  requisicoes:{t:'Requisições de combustível',n:'Requisições',g:'Custos',i:'<path d="M8 3h8l3 3v15H5V3z"/><path d="M9 3v3h6M9 11h6M9 15h3"/><path d="M16.5 13.5s-1.8 2-1.8 3.2a1.8 1.8 0 0 0 3.6 0c0-1.2-1.8-3.2-1.8-3.2z"/>'},
  postos:{t:'Bombas de combustível',n:'Bombas',g:'Custos',i:'<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M7 7h4v4H7z"/><path d="M14 9h2.5a1.5 1.5 0 0 1 1.5 1.5V16a1.5 1.5 0 0 0 3 0V8.5L18 6"/>'},
  manutencao:{t:'Manutenção',g:'Custos',i:'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>'},
  pagamentos:{t:'Painel de pagamentos',n:'Pagamentos',g:'Análise',i:'<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/>'},
  relatorios:{t:'Relatórios',g:'Análise',i:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'},
  utilizadores:{t:'Utilizadores',g:'Administração',i:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.2 4.1-6.5 8-6.5s7 2.3 8 6.5"/><path d="M17.5 3.5l1.2 1.2 2.3-2.3"/>'},
  definicoes:{t:'Empresa',g:'Administração',i:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.8 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.8-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.8H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.8-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.8 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.8H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'}
};

/* ---------- data layer ---------- */
/* ---------- tema (claro / escuro / automático) — preferência só deste navegador ---------- */
const TEMAS={auto:'Automático',claro:'Claro',escuro:'Escuro'};
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}};
let tema=TEMAS[lsGet('frotamz-tema')]?lsGet('frotamz-tema'):'auto';
function aplicarTema(){ const r=document.documentElement; if(tema==='auto')delete r.dataset.theme; else r.dataset.theme=tema==='escuro'?'dark':'light'; }
aplicarTema();

/* ---------- perfis e permissões ----------
   Protótipo sem servidor: isto organiza o acesso na interface mas não é segurança real.
   Na versão com backend, as mesmas regras têm de ser validadas no servidor. */
const PERFIS={
  admin:{t:'Administrador',d:'Acesso total, incluindo utilizadores e dados da empresa.'},
  gestor:{t:'Gestor de frota',d:'Viaturas, motoristas, manutenção, combustível, reservas e requisições (emitir e verificar).'},
  contabilista:{t:'Contabilista',d:'Faturação, pagamento de requisições e dos subsídios dos motoristas, preços das bombas, despesas e relatórios.'},
  operador:{t:'Operador de rent-a-car',d:'Reservas, clientes, entregas, devoluções e emissão de faturas.'},
  consulta:{t:'Consulta',d:'Vê os módulos de operação e custos, sem alterar nada.'}
};
// Módulos que cada perfil vê no menu (o administrador vê tudo).
const VISTAS_PERFIL={
  gestor:['painel','pagamentos','viaturas','motoristas','subsidios','reservas','clientes','faturas','custos','requisicoes','postos','manutencao','relatorios','definicoes'],
  contabilista:['painel','pagamentos','viaturas','subsidios','reservas','clientes','faturas','custos','requisicoes','postos','relatorios','definicoes'],
  operador:['painel','viaturas','motoristas','reservas','clientes','faturas','definicoes'],
  consulta:['painel','pagamentos','viaturas','motoristas','subsidios','reservas','clientes','faturas','custos','requisicoes','postos','manutencao','relatorios','definicoes']
};
// Ações que alteram dados e quem as pode fazer (além do administrador). 'apagar' é só do administrador.
const PERMS={
  viaturas:['gestor'], motoristas:['gestor'], manutencao:['gestor'], abastecimentos:['gestor'],
  despesas:['gestor','contabilista'], postos:['gestor','contabilista'],
  clientes:['gestor','operador','contabilista'], reservas:['gestor','operador'],
  'req.emitir':['gestor'], 'req.verificar':['gestor'], 'req.pagar':['contabilista'],
  'fat.emitir':['operador','contabilista'], 'fat.pagar':['contabilista'],
  'sub.gerir':['gestor'], 'sub.pagar':['contabilista'], 'sub.confirmar':['gestor','contabilista'],
  empresa:[], utilizadores:[], apagar:[]
};
const SESS_KEY='frotamz-utilizador';
// Utilizador atual. Sem utilizadores registados, entra-se como administrador para poder criar o primeiro.
function eu(){
  if(!S.utilizadores.length)return {id:null,nome:'Administrador',perfil:'admin',temp:true};
  const u=S.utilizadores.find(x=>x.id===lsGet(SESS_KEY)&&x.estado!=='inativo');
  return u||null;
}
const perfil=()=>eu()?.perfil||null;
const pode=a=>perfil()==='admin'||(!!perfil()&&(PERMS[a]||[]).includes(perfil()));
const veVista=k=>perfil()==='admin'?true:!!perfil()&&(VISTAS_PERFIL[perfil()]||[]).includes(k);
function precisa(a){ if(pode(a))return true; toast(`O perfil ${PERFIS[perfil()]?.t||''} não permite esta ação.`); return false; }
// Botões escondidos para quem não os pode usar (ecrãs limpos: não mostrar o que não se pode fazer).
const BTN_PERM=[
  ['[data-new="viatura"]','viaturas'],['[data-new="motorista"]','motoristas'],['[data-edit^="motoristas:"]','motoristas'],['[data-ferias]','motoristas'],['[data-ferias-fim]','motoristas'],
  ['[data-new="requisicao"]','req.emitir'],['[data-rqdup]','req.emitir'],['[data-resdup]','reservas'],['[data-rqanular]','req.emitir'],['[data-edit^="requisicoes:"]','req.emitir'],['[data-rqver]','req.verificar'],['[data-rqpag]','req.pagar'],
  ['[data-new="posto"]','postos'],['[data-new="abast"]','abastecimentos'],['[data-abastv]','abastecimentos'],['[data-new="despesa"]','despesas'],
  ['[data-new="plano"]','manutencao'],['[data-new="servico"]','manutencao'],['[data-srv]','manutencao'],
  ['[data-new="cliente"]','clientes'],['[data-new="reserva"]','reservas'],['[data-ent]','reservas'],['[data-dev]','reservas'],['[data-cancel]','reservas'],
  ['[data-faturar]','fat.emitir'],['[data-new="subsidio"]','sub.gerir'],['[data-subanular]','sub.gerir'],['[data-subpag]','sub.pagar'],['[data-subconf]','sub.confirmar'],['[data-reativar]','reservas'],['#fPaga','fat.pagar'],['#editEmp','empresa'],['[data-new="utilizador"]','utilizadores']
];
function aplicarPerms(root=document){ BTN_PERM.forEach(([sel,a])=>{ const ok=pode(a); root.querySelectorAll(sel).forEach(el=>{ if(!ok)el.hidden=true; }); }); }
new MutationObserver(()=>aplicarPerms()).observe(document.body,{childList:true,subtree:true});

const DEMO_KEY='frotamz-demo-v1';
function loadDemo(){
  let saved=null; try{saved=JSON.parse(localStorage.getItem(DEMO_KEY)||'null')}catch(e){}
  const src=saved||SAMPLE;
  S={config:{...src.config},...Object.fromEntries(COLS.map(c=>[c,(src[c]??SAMPLE[c]??[]).map(x=>({...x}))]))};
}
function persistDemo(){try{localStorage.setItem(DEMO_KEY,JSON.stringify(S))}catch(e){}}
function errMsg(e){
  const c=e&&e.code;
  if(c==='quota_exceeded')return 'A base de dados está cheia. Apague registos antigos e tente de novo.';
  if(c==='invalid_argument')return 'Não tem permissão para alterar estes dados.';
  if(c==='resource_exhausted')return 'Demasiados pedidos seguidos. Aguarde uns segundos.';
  return 'Não foi possível guardar. Verifique a ligação e tente de novo.';
}
async function save(col,obj){
  const id=obj.id||uid(); const body={...obj}; delete body.id;
  Object.keys(body).forEach(k=>body[k]===undefined&&delete body[k]);
  if(mode==='db'){ try{await db.collection(col).doc(id).set(body)}catch(e){toast(errMsg(e));throw e} }
  else{ const a=S[col]; const i=a.findIndex(x=>x.id===id); const rec={...body,id}; if(i>=0)a[i]=rec; else a.push(rec); persistDemo(); render(); }
  return id;
}
async function patch(col,id,fields){
  const cur=S[col].find(x=>x.id===id)||{}; return save(col,{...cur,...fields,id});
}
let lixo=null; // [colecao, registo] apagados durante a ação atual
async function remove(col,id){
  const obj=S[col].find(x=>x.id===id); if(lixo&&obj)lixo.push([col,{...obj}]);
  if(mode==='db'){ try{await db.collection(col).doc(id).delete()}catch(e){toast(errMsg(e));throw e} }
  else{ S[col]=S[col].filter(x=>x.id!==id); persistDemo(); render(); }
}
async function saveConfig(cfg){
  if(mode==='db'){ try{await db.doc('config/empresa').set(cfg)}catch(e){toast(errMsg(e));throw e} }
  else{ S.config=cfg; persistDemo(); render(); }
}
let rq=0; function scheduleRender(){ if(rq)return; rq=requestAnimationFrame(()=>{rq=0;render()}) }

async function connect(){
  let got=null;
  try{ got = window.claude && window.claude.use ? await window.claude.use('db') : null }catch(e){ got=null }
  if(!got){ mode='demo'; render(); return; }
  db=got; mode='db';
  S={config:{},...Object.fromEntries(COLS.map(c=>[c,[]]))};
  render();
  COLS.forEach(c=>{
    db.collection(c).onSnapshot(s=>{ S[c]=s.docs.map(d=>({...d.data(),id:d.id})); colsLidas.add(c); scheduleRender(); },
      e=>{ if(e&&e.code!=='revoked') toast('Não foi possível ler '+c+'.'); });
  });
  db.doc('config/empresa').onSnapshot(s=>{ S.config=s.exists?{...s.data()}:{}; colsLidas.add('config'); scheduleRender(); },()=>{});
}

/* ---------- domain helpers ---------- */
const V=id=>S.viaturas.find(v=>v.id===id);
const C=id=>S.clientes.find(c=>c.id===id);
const M=id=>id?S.motoristas.find(m=>m.id===id):null;
const vLabel=v=>v?`${v.marca} ${v.modelo}`:'Viatura removida';
const plate=v=>v?`<span class="plate"><span>${esc(v.matricula)}</span></span>`:'<span class="muted">—</span>';
const IVA=()=>+(S.config.iva??16);
const ESTADO_V={disponivel:['Disponível','p-ok'],alugada:['Alugada','p-info'],manutencao:['Na oficina','p-warn'],inativa:['Inativa','p-mute']};
const ESTADO_R={reservada:['Reservada','p-mute'],curso:['Em aluguer','p-info'],concluida:['Devolvida','p-ok'],cancelada:['Cancelada','p-mute'],expirada:['Expirada','p-mute']};
const ESTADO_RQ={pendente:['Por verificar','p-warn'],verificada:['Por pagar','p-info'],paga:['Paga','p-ok'],anulada:['Anulada','p-mute']};
const FORMAS_PAG=['Transferência bancária','Numerário','Cheque','M-Pesa','e-Mola','Cartão de frota'];
const rqValor=r=>['verificada','paga'].includes(r.estado)?+r.valorReal||0:(+r.litros||0)*(+r.precoLitro||0);
const ESTADO_M={disponivel:['Disponível','p-ok'],servico:['Em serviço','p-info'],ferias:['De férias','p-warn'],inativo:['Inativo','p-mute']};
const pill=([t,c])=>`<span class="pill ${c}">${esc(t)}</span>`;
const DOCS=[['seguro','Seguro automóvel'],['inspecao','Inspeção periódica'],['licenca','Imposto/licença anual']];

function docState(date){ if(!date)return null; const d=days(TODAY,date); return d<0?'crit':d<=30?'warn':'ok'; }
function planStatus(p){
  const v=V(p.viaturaId); const nextKm=(+p.ultimoKm||0)+(+p.intervaloKm||0);
  const nextDate=p.intervaloMeses&&p.ultimaData?addMonths(p.ultimaData,p.intervaloMeses):null;
  const kmLeft=v&&p.intervaloKm?nextKm-(+v.km||0):null; const dLeft=nextDate?days(TODAY,nextDate):null;
  let lvl='ok'; if((kmLeft!==null&&kmLeft<=0)||(dLeft!==null&&dLeft<=0))lvl='crit'; else if((kmLeft!==null&&kmLeft<=1500)||(dLeft!==null&&dLeft<=30))lvl='warn';
  const usedKm=p.intervaloKm&&v?Math.min(1,Math.max(0,((+v.km||0)-(+p.ultimoKm||0))/p.intervaloKm)):0;
  const usedT=p.intervaloMeses&&p.ultimaData?Math.min(1,Math.max(0,days(p.ultimaData,TODAY)/days(p.ultimaData,nextDate))):0;
  return {nextKm,nextDate,kmLeft,dLeft,lvl,used:Math.max(usedKm,usedT)};
}
/* Período (filtro partilhado por Custos e Relatórios) */
const PERIODOS=[['mes','Este mês'],['mesant','Mês anterior'],['3m','Últimos 3 meses'],['ano','Este ano'],['tudo','Tudo'],['pers','Personalizado']];
function periodo(){
  const p=filters.per||'mes', y=+TODAY.slice(0,4), m=+TODAY.slice(5,7);
  const ini=(y,m)=>toISO(new Date(y,m-1,1)), fim=(y,m)=>toISO(new Date(y,m,0));
  const mesNome=(y,m)=>new Date(y,m-1,1).toLocaleDateString('pt-PT',{month:'long',year:'numeric'});
  if(p==='mesant')return {de:ini(y,m-1),ate:fim(y,m-1),label:mesNome(y,m-1)};
  if(p==='3m')return {de:ini(y,m-2),ate:fim(y,m),label:`${dd(ini(y,m-2))} a ${dd(fim(y,m))}`};
  if(p==='ano')return {de:`${y}-01-01`,ate:`${y}-12-31`,label:`ano ${y}`};
  if(p==='tudo')return {de:'0000-01-01',ate:'9999-12-31',label:'todo o período registado'};
  if(p==='pers'){const de=filters.pDe||'0000-01-01',ate=filters.pAte||'9999-12-31';
    return {de,ate,label:filters.pDe||filters.pAte?`${filters.pDe?dd(de):'início'} a ${filters.pAte?dd(ate):'hoje'}`:'escolha as datas'}}
  return {de:ini(y,m),ate:fim(y,m),label:mesNome(y,m)};
}
const inP=(d,P)=>!!d&&d>=P.de&&d<=P.ate;
function perBar(){
  const p=filters.per||'mes';
  return `<label class="per"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg><select id="per" aria-label="Período">${PERIODOS.map(([k,t])=>`<option value="${k}"${p===k?' selected':''}>${t}</option>`).join('')}</select></label>
  ${p==='pers'?`<span class="dates"><input type="date" class="search" id="pDe" value="${esc(filters.pDe||'')}" aria-label="De"><span class="muted">a</span><input type="date" class="search" id="pAte" value="${esc(filters.pAte||'')}" aria-label="Até"></span>`:''}`;
}

/* Consumo: cada abastecimento cobre os km desde o abastecimento anterior da mesma viatura. */
function fillCons(a){
  const prev=S.abastecimentos.filter(x=>x.viaturaId===a.viaturaId&&x.km<a.km).sort((x,y)=>y.km-x.km)[0];
  return prev&&a.km>prev.km?{dist:a.km-prev.km,cons:a.litros/(a.km-prev.km)*100}:null;
}
const TOL=()=>+(S.config.toleranciaConsumo??20);
// Referência: a indicada na viatura ou, na falta, a mediana do histórico (mínimo 3 medições).
function consRef(v){
  if(!v)return null; if(+v.consumoRef>0)return {val:+v.consumoRef,fonte:'definida'};
  const cs=S.abastecimentos.filter(a=>a.viaturaId===v.id).map(fillCons).filter(Boolean).map(c=>c.cons).sort((a,b)=>a-b);
  if(cs.length<3)return null; const h=cs.length>>1;
  return {val:cs.length%2?cs[h]:(cs[h-1]+cs[h])/2,fonte:'histórico'};
}
// Desvio do consumo de um abastecimento face à referência (em %), ou null.
function consDesvio(a){ const c=fillCons(a), r=consRef(V(a.viaturaId)); if(!c||!r)return null; return {cons:c.cons,ref:r.val,desvio:(c.cons/r.val-1)*100,anormal:(c.cons/r.val-1)*100>TOL()}; }

function vStats(v,P){
  const f=S.abastecimentos.filter(a=>a.viaturaId===v.id&&(!P||inP(a.data,P)));
  const fuel=sum(f,a=>a.litros*a.precoLitro), litros=sum(f,a=>a.litros);
  const seg=f.map(a=>({a,c:fillCons(a)})).filter(x=>x.c);
  const kmRun=sum(seg,x=>x.c.dist);
  const cons=kmRun>0?sum(seg,x=>x.a.litros)/kmRun*100:null;
  const inPer=x=>!P||inP(x.data,P);
  const desp=sum(S.despesas.filter(d=>d.viaturaId===v.id&&inPer(d)),d=>d.valor);
  const serv=sum(S.servicos.filter(s=>s.viaturaId===v.id&&inPer(s)),s=>s.custo);
  const total=fuel+desp+serv;
  const receita=sum(S.faturas.filter(x=>x.viaturaId===v.id&&x.estado!=='anulada'&&inPer(x)),x=>fatSub(x));
  const anormais=f.filter(a=>consDesvio(a)?.anormal).length;
  return {fuel,litros,n:f.length,kmRun,cons,desp,serv,total,cpk:kmRun>0?total/kmRun:null,receita,anormais};
}
const fatSub=f=>sum(f.linhas||[],l=>l.qtd*l.preco);
const fatIva=f=>fatSub(f)*(+f.iva||0)/100;
const fatTot=f=>fatSub(f)+fatIva(f);
// Dias contratados (reserva) vs. dias reais (da entrega à devolução). Cobram-se sempre os dias reais.
const resDias=r=>Math.max(1,days(r.inicio,r.fim));
const resMot=r=>r.motoristaId?+r.tarifaMotorista||0:0;
const resSaida=r=>r.checkEntrega?.data||r.inicio;
// Os dias contam desde a data reservada, mesmo que o cliente levante a viatura mais tarde (a viatura ficou reservada para ele).
// Só contam antes se a entrega for antecipada.
const resDesde=r=>resSaida(r)<r.inicio?resSaida(r):r.inicio;
const levAtraso=r=>r.checkEntrega?.data&&r.checkEntrega.data>r.inicio?days(r.inicio,r.checkEntrega.data):0;
// Concluída: até ao dia da devolução. Em aluguer: até à data prevista ou até hoje, se já passou (atraso a acumular).
const resDiasReais=r=>r.estado==='concluida'?Math.max(1,days(resDesde(r),r.devolvidoEm||r.fim))
  :r.estado==='curso'?Math.max(1,days(resDesde(r),TODAY>r.fim?TODAY:r.fim)):resDias(r);
const descontoDe=(r,bruto)=>r.descontoTipo==='pct'?bruto*Math.min(100,+r.descontoValor||0)/100:r.descontoTipo==='valor'?Math.min(bruto,+r.descontoValor||0):0;
// Cálculo do valor de um aluguer, separado em:
//  - período combinado: dias reservados (ou só os usados, se devolveu antes) × tarifas;
//  - dias extra fora do período: da data em que o período combinado acabou até à devolução, × as mesmas tarifas.
//    Cobram-se por omissão; r.cobrarExtra===false deixa-os visíveis mas não cobrados (com r.motivoSemExtra).
function resCalc(r){
  const dc=resDias(r), dr=resDiasReais(r), dif=dr-dc, tv=+r.tarifa||0, tm=resMot(r), dia=tv+tm;
  // Devolvida antes do prazo: com justificação cobram-se só os dias usados; sem justificação (cobrarCompleto) o período todo.
  const completo=dif<0&&!!r.cobrarCompleto;
  const dBase=completo?dc:Math.min(dr,dc), dExtra=Math.max(0,dif), cobraExtra=r.cobrarExtra!==false;
  const ini=resDesde(r), extraDe=dExtra?addDays(ini,dc):null, extraAte=dExtra?addDays(ini,dr):null;
  const base=dBase*dia, valExtra=dExtra*dia, extraCobrado=cobraExtra?valExtra:0;
  const bruto=base+extraCobrado, desc=descontoDe(r,bruto), extras=+r.extras||0;
  const dl=n=>`${n} ${n===1?'dia':'dias'}`;
  const nota=dExtra?`${dl(dExtra)} fora do período combinado (${dc})${cobraExtra?'':' — não cobrados'}`
    :dif<0?(completo?`devolvida antes do prazo sem justificação: cobrado o período completo (usou ${dl(dr)})`:`devolvida antes do prazo: cobrados ${dl(dr)} dos ${dc} combinados`):'';
  return {dc,dr,dif,dBase,dExtra,cobraExtra,extraDe,extraAte,tv,tm,base,valExtra,extraCobrado,bruto,desc,extras,
    liquido:bruto-desc,total:bruto-desc+extras,nota,completo,levAtraso:levAtraso(r),dUsados:Math.min(dr,dc),dCobrados:dBase+(cobraExtra?dExtra:0)};
}
const resValor=r=>resCalc(r).liquido;
// Situação para mostrar: entregar/receber hoje, atrasos e como foi devolvida (no prazo, com atraso, antes).
/* Reservas não levantadas expiram: se continuam "reservada" mais de PRAZO_EXP() dias depois da data de levantamento,
   passam a "expirada" (a viatura fica livre). Corre sozinho ao abrir a aplicação; o prazo define-se em Empresa. */
const PRAZO_EXP=()=>Math.max(1,+(S.config.diasExpiraReserva??3));
const expiraEm=r=>addDays(r.inicio,PRAZO_EXP()+1);   // primeiro dia em que já está expirada
let expiracaoFeita=false, colsLidas=new Set();
async function expirarReservas(){
  const lista=S.reservas.filter(r=>r.estado==='reservada'&&TODAY>=expiraEm(r));
  if(!lista.length)return;
  for(const r of lista) await patch('reservas',r.id,{estado:'expirada',expiradaEm:TODAY,
    motivoExpira:`O cliente não levantou a viatura: previsto a ${dd(r.inicio)}, prazo de ${PRAZO_EXP()} ${PRAZO_EXP()===1?'dia':'dias'}.`});
  toast(`${lista.length} ${lista.length===1?'reserva expirou':'reservas expiraram'}: o cliente não levantou a viatura. Ver no Histórico das Reservas.`);
}
function resSituacao(r){
  if(r.estado==='expirada')return ESTADO_R.expirada;
  if(r.estado==='reservada'){ if(r.inicio<TODAY)return ['Levantamento em atraso','p-crit']; if(r.inicio===TODAY)return ['Entregar hoje','p-warn']; return ESTADO_R.reservada; }
  if(r.estado==='curso'){ if(r.fim<TODAY){const d=days(r.fim,TODAY);return [`Atrasada ${d} ${d===1?'dia':'dias'}`,'p-crit']} if(r.fim===TODAY)return ['Receber hoje','p-warn']; return ESTADO_R.curso; }
  if(r.estado==='concluida'&&r.devolvidoEm){ const d=days(r.fim,r.devolvidoEm);
    return d>0?[`Devolvida com ${d} ${d===1?'dia':'dias'} de atraso`,'p-warn']:d<0?[`Devolvida ${-d} ${d===-1?'dia':'dias'} antes`,'p-info']:['Devolvida no prazo','p-ok']; }
  return ESTADO_R[r.estado]||ESTADO_R.reservada;
}
// Quadro do cálculo: primeiro o período combinado, depois os dias extra fora do período (cobrados ou não).
function calcHTML(c,r){
  const L=(k,v,cls='')=>`<div class="cl ${cls}"><span>${k}</span><span>${v}</span></div>`;
  const dl=n=>`${n} ${n===1?'dia':'dias'}`;
  const parte=(n,off)=>L(`${dl(n)} × ${MT(c.tv)} (viatura)`,MT(n*c.tv),off)+(c.tm?L(`${dl(n)} × ${MT(c.tm)} (motorista)`,MT(n*c.tm),off):'');
  let h=`<div class="calc"><div class="cl-h"><span>Período combinado</span><span>${r?.inicio?`${dd(r.inicio)} → ${dd(r.fim)} · `:''}${dl(c.dc)}</span></div>`;
  if(c.levAtraso)h+=`<div class="cl-nota mais">O cliente levantou a viatura ${dl(c.levAtraso)} depois do previsto (${dd(r.checkEntrega.data)}). Os dias contam desde a data reservada, ${dd(r.inicio)}.</div>`;
  if(c.dif<0)h+=c.completo?`<div class="cl-nota mais">Devolvida antes do prazo <b>sem justificação</b>. Usou ${dl(c.dUsados)} dos ${dl(c.dc)} combinados, mas cobra-se o período combinado completo.</div>`
    :`<div class="cl-nota menos">Devolvida antes do prazo${r?.motivoAntecipada?` · motivo: <b>${esc(justif(r.motivoAntecipada,r.obsAntecipada))}</b>`:''}. Usou ${dl(c.dBase)} dos ${dl(c.dc)} combinados: cobra-se só ${c.dBase===1?'esse dia':`esses ${c.dBase} dias`}.</div>`;
  h+=parte(c.dBase,'')+L('Subtotal do período combinado',MT(c.base),'sub');
  if(c.dExtra){
    const off=c.cobraExtra?'':'off';
    h+=`<div class="cl-h extra"><span>Dias extra fora do período</span><span>${dd(c.extraDe)} → ${dd(c.extraAte)} · ${dl(c.dExtra)}${r?.estado==='curso'?' até hoje':''}</span></div>`;
    h+=parte(c.dExtra,off);
    h+=c.cobraExtra?L('Subtotal dos dias extra',MT(c.valExtra),'sub')
      :L(`Dias extra <b>não cobrados</b>${r?.motivoSemExtra?` · ${esc(r.motivoSemExtra)}`:''}`,`<s>${MT(c.valExtra)}</s> 0,00 MT`,'sub off');
  }
  if(c.desc)h+=L(`Desconto${r?.descontoTipo==='pct'?` ${fmt(r.descontoValor,1)}%`:''}${r?.descontoMotivo?` · ${esc(r.descontoMotivo)}`:''}`,'− '+MT(c.desc),'desc');
  if(c.extras)h+=L(`Outros encargos${r?.extrasDesc?` · ${esc(r.extrasDesc)}`:''}`,MT(c.extras));
  return h+L('<b>Total sem IVA</b>',`<b>${MT(c.total)}</b>`,'tot')+'</div>';
}
function overlap(r){
  return S.reservas.find(o=>o.id!==r.id&&o.viaturaId===r.viaturaId&&!['cancelada','concluida','expirada'].includes(o.estado)&&o.inicio<=r.fim&&r.inicio<=o.fim);
}
// Motoristas: férias por período (feriasInicio..feriasFim); "em serviço" = aluguer em curso atribuído.
const emFerias=(m,a,b=a)=>!!(m&&m.feriasInicio&&m.feriasFim&&m.feriasInicio<=b&&a<=m.feriasFim);
function mEstado(m){
  if(m.estado==='inativo')return 'inativo';
  if(emFerias(m,TODAY))return 'ferias';
  return S.reservas.some(r=>r.motoristaId===m.id&&r.estado==='curso')?'servico':'disponivel';
}
function mOverlap(r){
  return r.motoristaId&&S.reservas.find(o=>o.id!==r.id&&o.motoristaId===r.motoristaId&&['reservada','curso'].includes(o.estado)&&o.inicio<=r.fim&&r.inicio<=o.fim);
}
const mAtual=m=>S.reservas.find(r=>r.motoristaId===m.id&&r.estado==='curso');
const mProx=m=>S.reservas.filter(r=>r.motoristaId===m.id&&r.estado==='reservada').sort((a,b)=>a.inicio.localeCompare(b.inicio))[0];
// Erro de atribuição do motorista a uma reserva (null se estiver tudo bem).
function mConflito(r){
  const m=M(r.motoristaId); if(!r.motoristaId)return null; if(!m)return 'O motorista escolhido já não existe.';
  if(m.estado==='inativo')return `${m.nome} está inativo.`;
  if(emFerias(m,r.inicio,r.fim))return `${m.nome} está de férias de ${dd(m.feriasInicio)} a ${dd(m.feriasFim)}.`;
  const o=mOverlap(r); if(o)return `${m.nome} já está atribuído a outro aluguer de ${dd(o.inicio)} a ${dd(o.fim)} (${V(o.viaturaId)?.matricula||'—'}).`;
  if(m.cartaValidade&&m.cartaValidade<r.fim)return `A carta de condução de ${m.nome} caduca a ${dd(m.cartaValidade)}, antes da devolução.`;
  return null;
}
function alerts(){
  const out=[];
  S.viaturas.forEach(v=>{
    if(v.estado==='inativa')return;
    DOCS.forEach(([k,l])=>{ if(!v[k])return; const d=days(TODAY,v[k]);
      if(d<0) out.push({lvl:'crit',v,t:`${l} caducado`,m:`há ${-d} ${-d===1?'dia':'dias'} (${dd(v[k])})`,s:d,go:'viaturas'});
      else if(d<=30) out.push({lvl:'warn',v,t:`${l} a caducar`,m:`em ${d} ${d===1?'dia':'dias'} (${dd(v[k])})`,s:d,go:'viaturas'});
    });
  });
  S.planos.forEach(p=>{ const v=V(p.viaturaId); if(!v)return; const st=planStatus(p); if(st.lvl==='ok')return;
    const parts=[]; if(st.kmLeft!==null)parts.push(st.kmLeft<=0?`${fmt(-st.kmLeft)} km em atraso`:`faltam ${fmt(st.kmLeft)} km`);
    if(st.dLeft!==null&&st.dLeft<=30)parts.push(st.dLeft<=0?`prazo passou a ${dd(st.nextDate)}`:`até ${dd(st.nextDate)}`);
    out.push({lvl:st.lvl,v,t:`${p.tipo}`,m:parts.join(' · '),s:st.lvl==='crit'?-50:10,go:'manutencao'});
  });
  S.reservas.forEach(r=>{ const v=V(r.viaturaId), c=C(r.clientId||r.clienteId);
    if(r.estado==='curso'&&r.fim<TODAY) out.push({lvl:'crit',v,t:'Devolução em atraso',m:`${esc(c?.nome||'Cliente')} devia devolver a ${dd(r.fim)}`,s:-80,go:'reservas',raw:true});
    else if(r.estado==='curso'&&r.fim===TODAY) out.push({lvl:'warn',v,t:'Receber hoje',m:`${esc(c?.nome||'Cliente')} devolve hoje`,s:-30,go:'reservas',raw:true});
    else if(r.estado==='reservada'&&r.inicio<TODAY) out.push({lvl:'crit',v,t:'Levantamento em atraso',m:`${esc(c?.nome||'Cliente')} devia ter levantado a ${dd(r.inicio)} · expira a ${dd(expiraEm(r))}`,s:-60,go:'reservas',raw:true});
    else if(r.estado==='reservada'&&r.inicio===TODAY) out.push({lvl:'warn',v,t:'Entregar hoje',m:`${esc(c?.nome||'Cliente')} levanta hoje`,s:-35,go:'reservas',raw:true});
    else if(r.estado==='reservada'&&days(TODAY,r.inicio)<=3) out.push({lvl:'info',v,t:'Entrega agendada',m:`${esc(c?.nome||'Cliente')} levanta a ${dd(r.inicio)}`,s:20,go:'reservas',raw:true});
    if(['reservada','curso'].includes(r.estado)&&c&&c.cartaValidade&&c.cartaValidade<r.fim) out.push({lvl:'warn',v,t:'Carta de condução caduca durante o aluguer',m:`${esc(c.nome)} · válida até ${dd(c.cartaValidade)}`,s:5,go:'clientes',raw:true});
    const m=M(r.motoristaId);
    if(r.estado==='reservada'&&m&&emFerias(m,r.inicio,r.fim)) out.push({lvl:'crit',v,t:'Motorista de férias durante o aluguer',m:`${esc(m.nome)} · férias até ${dd(m.feriasFim)}; levantamento a ${dd(r.inicio)}`,s:-40,go:'reservas',raw:true});
  });
  S.subsidios.forEach(x=>{ const m=M(x.motoristaId);
    if(x.estado==='pendente'&&days(x.criadoEm||TODAY,TODAY)>7) out.push({lvl:'warn',who:m?.nome,t:'Subsídio por pagar',m:`${MT0(x.valor)} · ${x.descricao||''} · desde ${dd(x.criadoEm)}`,s:13,go:'subsidios'});
    if(x.estado==='pago'&&days(x.dataPag,TODAY)>7) out.push({lvl:'warn',who:m?.nome,t:'Subsídio pago sem confirmação',m:`${MT0(x.valor)} pagos a ${dd(x.dataPag)} (${x.formaPag||''}) · falta confirmar o recebimento`,s:15,go:'subsidios'}); });
  S.requisicoes.forEach(r=>{ const v=V(r.viaturaId);
    if(r.estado==='pendente'&&days(r.data,TODAY)>7) out.push({lvl:'warn',v,t:`Requisição ${r.numero} por verificar`,m:`emitida há ${days(r.data,TODAY)} dias · ${fmt(r.litros,1)} L em ${r.posto||'—'}`,s:12,go:'requisicoes'});
    if(r.estado==='verificada'&&days(r.dataVerif||r.data,TODAY)>30) out.push({lvl:'warn',v,t:`Requisição ${r.numero} por pagar`,m:`${MT0(rqValor(r))} a ${r.posto||'—'} · verificada a ${dd(r.dataVerif)}`,s:14,go:'requisicoes'}); });
  S.abastecimentos.forEach(a=>{ if(days(a.data,TODAY)>30)return; const x=consDesvio(a); if(!x?.anormal)return;
    out.push({lvl:'warn',v:V(a.viaturaId),t:'Consumo acima do normal',m:`${fmt(x.cons,1)} L/100 km a ${dd(a.data)} · referência ${fmt(x.ref,1)} (+${fmt(x.desvio)}%)`,s:8,go:'custos',ca:1}); });
  S.motoristas.forEach(m=>{ if(m.estado==='inativo'||!m.cartaValidade)return; const d=days(TODAY,m.cartaValidade);
    if(d<0) out.push({lvl:'crit',who:m.nome,t:'Carta de motorista caducada',m:`há ${-d} ${-d===1?'dia':'dias'} (${dd(m.cartaValidade)})`,s:d,go:'motoristas'});
    else if(d<=30) out.push({lvl:'warn',who:m.nome,t:'Carta de motorista a caducar',m:`em ${d} ${d===1?'dia':'dias'} (${dd(m.cartaValidade)})`,s:d,go:'motoristas'});
  });
  return out.sort((a,b)=>a.s-b.s);
}

/* ---------- UI helpers ---------- */
let toastT;
// Aviso no fundo do ecrã; com acao={label,fn} mostra um botão (ex.: Desfazer) e fica visível mais tempo.
function toast(msg,acao){
  const t=$('#toast'); clearTimeout(toastT);
  t.innerHTML=`<span>${esc(msg)}</span>${acao?`<button type="button" class="toast-a">${esc(acao.label)}</button>`:''}`; t.hidden=false;
  if(acao)t.querySelector('.toast-a').onclick=async()=>{ t.hidden=true; clearTimeout(toastT); try{ await acao.fn(); if(acao.label==='Desfazer')toast('Desfeito.'); }catch(e){} };
  toastT=setTimeout(()=>t.hidden=true,acao?8000:3200);
}
const desfazer=fn=>({label:'Desfazer',fn});
const vOptions=(sel,filter)=>S.viaturas.filter(filter||(()=>true)).map(v=>`<option value="${esc(v.id)}"${v.id===sel?' selected':''}>${esc(v.matricula)} · ${esc(vLabel(v))}</option>`).join('');
const cOptions=sel=>S.clientes.map(c=>`<option value="${esc(c.id)}"${c.id===sel?' selected':''}>${esc(c.nome)}</option>`).join('');

let drawerSubmit=null, denovo=false;
function openDrawer(title,fields,init,onSubmit,opts={}){
  // Sem permissão para alterar: o mesmo formulário abre só para consulta. Apagar é só do administrador.
  const soLer=!!opts.perm&&!pode(opts.perm);
  if(soLer)opts={...opts,del:null}; else if(opts.del&&!pode('apagar'))opts={...opts,del:null};
  if(soLer)title=title.replace(/^(Editar|Nova|Novo|Registar)\s+/i,'').replace(/^./,c=>c.toUpperCase());
  $('.drawer-p').classList.remove('wide'); $('#dTitle').textContent=title;
  const body=fields.map(f=>{
    if(f.type==='note')return `<div class="form-note">${f.html}</div>`;
    if(f.type==='section')return `<div class="form-sec">${esc(f.label)}</div>`;
    // Checklist: cada ponto Sim / Não; ao escolher Não abre-se, à frente, um campo para descrever o problema.
    if(f.type==='checklist'){ const val=init[f.k]||{}, notas=init[f.k+'Notas']||{};
      return `<div class="fld full"><div class="ck-h"><label>${esc(f.label)}${f.req?' *':''}</label><button type="button" class="link" data-ckall="${f.k}">Marcar tudo Sim</button></div>
        <div class="ck" id="f_${f.k}" role="group" aria-label="${esc(f.label)}">${f.items.map((it,i)=>{const nao=val[it]==='nao'||val[it]==='problema';
          return `<div class="ck-row${nao?' nao':''}"><span class="ck-l">${esc(it)}</span><span class="ck-opts">
          <label class="ck-ok"><input type="radio" name="ck_${f.k}_${i}" value="sim"${val[it]==='sim'||val[it]==='ok'?' checked':''}><span>Sim</span></label>
          <label class="ck-bad"><input type="radio" name="ck_${f.k}_${i}" value="nao"${nao?' checked':''}><span>Não</span></label></span>
          <input class="ck-com" id="ckc_${f.k}_${i}" placeholder="Qual é o problema? (ex.: risco na porta traseira esquerda)" value="${esc(notas[it]||'')}" aria-label="Problema em ${esc(it)}" autocomplete="off"></div>`}).join('')}</div></div>`; }
    // Caixa de confirmação (ex.: o cliente conferiu e concordou).
    if(f.type==='checkbox')return `<div class="fld full"><label class="chk"><input type="checkbox" id="f_${f.k}"${init[f.k]?' checked':''}><span>${esc(f.label)}${f.req?' *':''}</span></label>${f.hint?`<span class="hint">${esc(f.hint)}</span>`:''}</div>`;
    const id='f_'+f.k, v=init[f.k]??f.def??'';
    let input;
    if(f.type==='select') input=`<select id="${id}" name="${f.k}"${f.req?' required':''}>${f.optsHtml??(f.opts||[]).map(o=>{const[val,lab]=Array.isArray(o)?o:[o,o];return `<option value="${esc(val)}"${String(val)===String(v)?' selected':''}>${esc(lab)}</option>`}).join('')}</select>`;
    else if(f.type==='textarea') input=`<textarea id="${id}" name="${f.k}" rows="3">${esc(v)}</textarea>`;
    else input=`<input id="${id}" name="${f.k}" type="${f.type||'text'}" value="${esc(v)}"${f.step?` step="${f.step}"`:''}${f.min!=null?` min="${f.min}"`:''}${f.req?' required':''}${f.ro?' readonly tabindex="-1"':''}${f.ph?` placeholder="${esc(f.ph)}"`:''} autocomplete="off">`;
    return `<div class="fld${f.full?' full':''}"><label for="${id}">${esc(f.label)}${f.req?' *':''}</label>${input}${f.hint!=null?`<span class="hint" id="h_${f.k}">${esc(f.hint)}</span>`:''}</div>`;
  }).join('');
  $('#dBody').innerHTML=`<div class="form"><div class="form-err" id="dErr" role="alert" tabindex="-1" hidden></div>${body}${fields.some(f=>f.req)?'<div class="form-req">* campo obrigatório</div>':''}</div>`;
  $('#dFoot').innerHTML=`${opts.del?'<span class="confirm" id="delWrap"><button type="button" class="btn danger" id="dDel">Apagar</button></span><span style="flex:1"></span>':opts.extra?`${opts.extra}<span style="flex:1"></span>`:''}<button type="button" class="btn" data-close>Cancelar</button>${opts.again?'<button type="button" class="btn" id="dAgain">Guardar e registar outro</button>':''}<button type="submit" class="btn primary" id="dOk">${esc(opts.ok||'Guardar')}</button>`;
  // Mostra o erro no topo e marca os campos em causa; o 1.º campo fica com o foco.
  const fail=(msg,keys=[])=>{ const err=$('#dErr'); err.textContent=msg; err.hidden=false;
    keys.forEach(k=>{const el=document.getElementById('f_'+k); if(el){el.closest('.fld').classList.add('invalid'); el.setAttribute('aria-invalid','true')}});
    const first=keys.length&&document.getElementById('f_'+keys[0]); (first||err).focus?.(); err.scrollIntoView({block:'nearest'}); };
  drawerSubmit=async()=>{
    const out={}; const miss=[];
    $('#dBody').querySelectorAll('.fld.invalid').forEach(x=>x.classList.remove('invalid'));
    fields.forEach(f=>{ if(!f.k||f.type==='note'||f.type==='section')return;
      if(f.type==='checklist'){ const o={}, notas={}; let falta=0; const semNota=[];
        f.items.forEach((it,i)=>{ const x=document.querySelector(`input[name="ck_${f.k}_${i}"]:checked`); if(!x){falta++;return}
          o[it]=x.value; if(x.value==='nao'){ const t=(document.getElementById(`ckc_${f.k}_${i}`)?.value||'').trim(); if(t)notas[it]=t; else semNota.push(it); } });
        if(f.req&&falta)miss.push({...f,label:`${f.label} (${falta} ${falta===1?'ponto':'pontos'} por marcar)`});
        else if(semNota.length)miss.push({...f,label:`o problema em ${semNota.join(', ')}`});
        out[f.k]=o; out[f.k+'Notas']=notas; return; }
      if(f.type==='checkbox'){ const el=document.getElementById('f_'+f.k); out[f.k]=!!el.checked; if(f.req&&!el.checked)miss.push({...f,label:f.missLabel||f.label}); return; }
      const el=document.getElementById('f_'+f.k); let v=el.value.trim();
      if(f.req&&!v)miss.push(f);
      if(f.type==='number')v=v===''?null:+v; out[f.k]=v; });
    if(miss.length)return fail(miss.length===1?`Falta preencher: ${miss[0].label}.`:`Faltam ${miss.length} campos: ${miss.map(f=>f.label).join(', ')}.`,miss.map(f=>f.k));
    const res=opts.validate?opts.validate(out):null;
    if(res)return typeof res==='string'?fail(res):fail(res.msg,[res.k]);
    const ok=$('#dOk'), lab=ok.textContent; ok.disabled=true; ok.textContent='A guardar…';
    const outro=denovo; denovo=false;
    try{ const res=await onSubmit(out); closeDrawer(); if(opts.done)toast(opts.done); if(opts.after)opts.after(res); if(outro&&opts.again)opts.again(out);}catch(e){ ok.disabled=false; ok.textContent=lab; }
  };
  if(opts.del){ $('#dDel').onclick=async()=>{ lixo=[]; try{ await opts.del(); }catch(e){ lixo=null; return; }
    const itens=lixo; lixo=null; closeDrawer();
    toast('Registo apagado.',desfazer(async()=>{ for(const [c,o] of itens.slice().reverse())await save(c,o); })); }; }
  if(opts.again)$('#dAgain').onclick=()=>{denovo=true;drawerSubmit&&drawerSubmit()};
  $('#dBody').onchange=opts.change?e=>opts.change(e):null; if(opts.change)opts.change(null);
  // Ao corrigir um campo, tira-lhe a marca de erro; os cálculos em direto (opts.change) também correm enquanto se escreve.
  $('#dBody').oninput=e=>{ const fl=e.target.closest('.fld.invalid'); if(fl){fl.classList.remove('invalid');e.target.removeAttribute('aria-invalid')} if(opts.change)opts.change(e); };
  $('#drawer').hidden=false;
  if(soLer){
    $('#dBody').querySelectorAll('input,select,textarea').forEach(el=>el.disabled=true);
    $('#dBody .form').insertAdjacentHTML('afterbegin',`<div class="form-note ro-note">Só leitura · o perfil ${esc(PERFIS[perfil()]?.t||'')} não pode alterar estes dados.</div>`);
    $('#dFoot').innerHTML='<span style="flex:1"></span><button type="button" class="btn primary" data-close>Fechar</button>';
    drawerSubmit=()=>closeDrawer(); return;
  }
  setTimeout(()=>{const f=$('#dBody input:not([readonly]),#dBody select');f&&f.focus()},30);
}
// Checklist: ao escolher Não, a linha abre o campo do problema (à frente) e põe lá o cursor.
document.addEventListener('change',e=>{ const x=e.target; if(!x.matches?.('.ck input[type=radio]'))return;
  const row=x.closest('.ck-row'); row.classList.toggle('nao',x.value==='nao'); if(x.value==='nao')row.querySelector('.ck-com')?.focus(); });
function closeDrawer(){$('#drawer').hidden=true;drawerSubmit=null;$('#dBody').onchange=null;$('#dBody').oninput=null;$('.drawer-p').classList.remove('wide')}
$('#dForm').addEventListener('submit',e=>{e.preventDefault();drawerSubmit&&drawerSubmit()});
$('#drawer').addEventListener('click',e=>{if(e.target.closest('[data-close]'))closeDrawer()});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('#drawer').hidden)return closeDrawer();
  // Linhas clicáveis também abrem com Enter (navegação por teclado).
  if(e.key==='Enter'&&e.target.matches?.('tr[data-open],tr[data-cons],tr[data-pagg]'))e.target.click();
});

/* ---------- forms ---------- */
/* Uso de uma viatura: decide se pode ser apagada, só desativada, ou nenhuma das duas.
   - reservas ativas (reservada / em curso) → não pode apagar nem desativar;
   - histórico (reservas terminadas, faturas, abastecimentos, requisições, oficina, despesas) → só desativar, com motivo;
   - sem nada → pode apagar (os planos de manutenção vão junto). */
const MOTIVOS_INATIVA=['Vendida','Abatida (sucata)','Perda total (acidente)','Roubada','Fim do contrato de leasing','Devolvida ao proprietário','Outro'];
function vUso(id){
  const rs=S.reservas.filter(r=>r.viaturaId===id);
  const ativas=rs.filter(r=>['reservada','curso'].includes(r.estado));
  const hist=rs.length-ativas.length+['faturas','abastecimentos','requisicoes','servicos','despesas'].reduce((n,c)=>n+S[c].filter(x=>x.viaturaId===id).length,0);
  return {ativas,hist,reservasHist:rs.length-ativas.length};
}
function formDesativar(v){
  const u=vUso(v.id); if(u.ativas.length)return toast('Tem reservas ativas: termine-as ou cancele-as primeiro.');
  openDrawer(`Desativar ${v.matricula}`,[
    {type:'note',html:`${plate(v)} ${esc(vLabel(v))} tem histórico (${u.reservasHist} ${u.reservasHist===1?'reserva':'reservas'} e outros registos), por isso não pode ser apagada. Fica <b>inativa</b>: sai das listas de reservas e requisições, mas o histórico mantém-se.`},
    {k:'motivoInativa',label:'Motivo',type:'select',opts:MOTIVOS_INATIVA,req:1,full:1},
    {k:'dataInativa',label:'Data',type:'date',def:TODAY,req:1},
    {k:'obsInativa',label:'Observações',full:1,ph:'Ex.: vendida a …, processo do seguro nº …'},
  ],{},o=>patch('viaturas',v.id,{...o,estado:'inativa',inativadaPor:eu()?.nome||''}),
  {perm:'viaturas',ok:'Desativar viatura',done:'Viatura desativada. O histórico foi mantido.',
   validate:o=>o.motivoInativa==='Outro'&&!o.obsInativa?{k:'obsInativa',msg:'Descreva o motivo nas observações.'}:null});
}
function formViatura(v={}){
  const u=v.id?vUso(v.id):{ativas:[],hist:0};
  // "Inativa" só se escolhe pelo botão Desativar (que pede o motivo); aqui só aparece se já estiver inativa.
  const estados=Object.entries(ESTADO_V).filter(([k])=>k!=='inativa'||v.estado==='inativa').map(([k,[t]])=>[k,k==='inativa'?`Inativa · ${v.motivoInativa||'sem motivo'}`:t]);
  const aviso=!v.id?[]:u.ativas.length?[{type:'note',html:`Tem ${u.ativas.length} ${u.ativas.length===1?'reserva ativa':'reservas ativas'} (${u.ativas.map(r=>`${dd(r.inicio)} → ${dd(r.fim)}`).join(', ')}): não pode ser apagada nem desativada.`}]
    :v.estado==='inativa'?[{type:'note',html:`<b>Inativa desde ${dd(v.dataInativa)}</b> · ${esc(v.motivoInativa||'—')}${v.obsInativa?` · ${esc(v.obsInativa)}`:''}${v.inativadaPor?` <span class="muted">(${esc(v.inativadaPor)})</span>`:''}. Para a reativar, mude o estado.`}]:[];
  openDrawer(v.id?'Editar viatura':'Nova viatura',[
    ...aviso,
    {type:'section',label:'Identificação'},
    {k:'matricula',label:'Matrícula',req:1,ph:'AAA 123 ZB'},
    {k:'estado',label:'Estado',type:'select',opts:estados,def:'disponivel'},
    {k:'marca',label:'Marca',req:1},{k:'modelo',label:'Modelo',req:1},
    {k:'ano',label:'Ano',type:'number',min:1980},{k:'categoria',label:'Categoria',type:'select',opts:['Económico','Ligeiro','SUV','Pick-up','Minibus','Camião','Moto'],def:'Ligeiro'},
    {k:'combustivel',label:'Combustível',type:'select',opts:['Diesel','Gasolina','Híbrido','Elétrico'],def:'Diesel'},
    {type:'section',label:'Utilização e aluguer'},
    {k:'km',label:'Quilometragem atual',type:'number',min:0,req:1},
    {k:'tarifa',label:'Tarifa diária (MT)',type:'number',min:0,step:'0.01',hint:'Preço de aluguer sem IVA'},
    {k:'consumoRef',label:'Consumo de referência (L/100 km)',type:'number',min:0,step:'0.1',hint:'Vazio = mediana do histórico'},
    {type:'section',label:'Documentos'},
    {k:'seguro',label:'Seguro válido até',type:'date'},
    {k:'inspecao',label:'Inspeção válida até',type:'date'},
    {k:'licenca',label:'Imposto/licença anual até',type:'date'},
  ],v,async o=>{ o.matricula=o.matricula.toUpperCase().replace(/\s+/g,' ');
    // Ao reativar, o motivo antigo deixa de se aplicar.
    const rec={...v,...o}; if(v.estado==='inativa'&&o.estado!=='inativa'){delete rec.motivoInativa;delete rec.dataInativa;delete rec.obsInativa;delete rec.inativadaPor}
    await save('viaturas',rec); },
  {perm:'viaturas',done:v.id?'Viatura atualizada.':'Viatura adicionada.',
   // Apagar só sem qualquer uso; com histórico, a saída é Desativar (com motivo); com reservas ativas, nenhuma das duas.
   del:v.id&&!u.ativas.length&&!u.hist?async()=>{ if(vUso(v.id).hist||vUso(v.id).ativas.length)throw toast('A viatura passou a ter registos. Não pode ser apagada.');
     for(const p of S.planos.filter(p=>p.viaturaId===v.id))await remove('planos',p.id); await remove('viaturas',v.id); }:null,
   extra:v.id&&!u.ativas.length&&u.hist&&v.estado!=='inativa'&&pode('viaturas')?`<button type="button" class="btn danger" data-desativar="${v.id}">Desativar…</button>`:'',
   validate:o=>S.viaturas.some(x=>x.id!==v.id&&x.matricula.replace(/\s/g,'')===o.matricula.toUpperCase().replace(/\s/g,''))?'Já existe uma viatura com esta matrícula.':null});
}
// Sugestões para um abastecimento novo: km atual da viatura, último posto usado e o preço desse posto (bomba registada).
function sugAbast(vid){
  const v=V(vid), u=S.abastecimentos.filter(x=>x.viaturaId===vid).sort((a,b)=>b.data.localeCompare(a.data)||b.km-a.km)[0];
  const bomba=S.postos.find(p=>p.id===u?.postoId||p.nome===u?.posto);
  return {posto:u?.posto||'', precoLitro:precoPosto(bomba,combDe(v))||u?.precoLitro||'', kmMin:Math.max(+v?.km||0,+u?.km||0)};
}
function formAbast(a={}){
  if(!S.viaturas.length)return toast('Adicione primeiro uma viatura.');
  const v0=V(a.viaturaId)||S.viaturas.find(v=>v.estado!=='inativa')||S.viaturas[0];
  const novo=!a.id, sug=novo?sugAbast(a.viaturaId||v0.id):{};
  openDrawer(a.id?'Editar abastecimento':'Registar abastecimento',[
    {k:'viaturaId',label:'Viatura',type:'select',optsHtml:vOptions(a.viaturaId||v0.id),full:1,req:1},
    {k:'data',label:'Data',type:'date',def:TODAY,req:1},{k:'km',label:'Conta-quilómetros',type:'number',req:1,min:0,hint:novo?`Última leitura: ${fmt(sug.kmMin)} km`:'Leitura no momento do abastecimento'},
    {k:'litros',label:'Litros',type:'number',step:'0.01',req:1,min:0},{k:'precoLitro',label:'Preço por litro (MT)',type:'number',step:'0.01',req:1,def:87.97},
    {k:'posto',label:'Posto',full:1,hint:novo&&sug.posto?'Sugerido: o último usado por esta viatura':undefined},
    ...(a.requisicaoId?[{type:'note',html:`Registado pela verificação da requisição <b>${esc(S.requisicoes.find(x=>x.id===a.requisicaoId)?.numero||'—')}</b>. Se corrigir litros ou preço aqui, a requisição mantém os valores verificados.`}]:[]),
    {type:'note',html:'O consumo médio (L/100 km) é calculado entre abastecimentos de depósito cheio da mesma viatura.'}
  ],novo?{posto:sug.posto,precoLitro:sug.precoLitro,...a}:a,async o=>{ await save('abastecimentos',{...a,...o}); const v=V(o.viaturaId); if(v&&o.km>(+v.km||0)) await patch('viaturas',v.id,{km:o.km}); },
  {perm:'abastecimentos',done:'Abastecimento registado.',del:a.id?()=>remove('abastecimentos',a.id):null,
   // Lançar vários talões seguidos: o próximo formulário mantém a data e o posto.
   again:novo?o=>formAbast({data:o.data,posto:o.posto}):null,
   change:e=>{ if(!novo||e?.target?.id!=='f_viaturaId'||e.type!=='change')return; const s2=sugAbast(e.target.value);
     $('#h_km').textContent=`Última leitura: ${fmt(s2.kmMin)} km`; if(s2.posto)$('#f_posto').value=s2.posto; if(s2.precoLitro)$('#f_precoLitro').value=s2.precoLitro; },
   validate:o=>{ const prev=S.abastecimentos.filter(x=>x.id!==a.id&&x.viaturaId===o.viaturaId&&x.data<=o.data).sort((x,y)=>y.km-x.km)[0];
     return prev&&o.km<=prev.km?{k:'km',msg:`A leitura tem de ser superior à do abastecimento anterior (${fmt(prev.km)} km a ${dd(prev.data)}).`}:null; }});
}
/* ---------- requisições de combustível: pendente → verificada (cria abastecimento) → paga ---------- */
/* ---------- bombas de combustível (postos) com preço por litro ---------- */
const normNum=s=>String(s||'').toUpperCase().replace(/s+/g,' ').trim();
const PST=id=>id?S.postos.find(p=>p.id===id):null;
// Tipo de combustível a comprar para a viatura (híbridos abastecem gasolina; elétricos não usam bomba).
const combDe=v=>!v?null:v.combustivel==='Diesel'?'Diesel':v.combustivel==='Elétrico'?null:'Gasolina';
const precoPosto=(p,comb)=>p&&comb?+(comb==='Diesel'?p.precoDiesel:p.precoGasolina)||0:0;
function formPosto(p={}){
  const usada=S.requisicoes.some(r=>r.postoId===p.id);
  const hist=(p.historico||[]).slice(-6).reverse();
  openDrawer(p.id?'Editar bomba de combustível':'Nova bomba de combustível',[
    {type:'section',label:'Identificação'},
    {k:'nome',label:'Nome da bomba',req:1,full:1,ph:'Ex.: Petromoc Samora Machel'},
    {k:'localizacao',label:'Localização',full:1,ph:'Av. Samora Machel, Quelimane'},
    {k:'telefone',label:'Telefone'},{k:'nuit',label:'NUIT',hint:'9 dígitos'},
    {type:'section',label:'Preço por litro'},
    {k:'precoDiesel',label:'Preço Diesel (MT/L)',type:'number',step:'0.01',min:0},
    {k:'precoGasolina',label:'Preço Gasolina (MT/L)',type:'number',step:'0.01',min:0},
    {type:'section',label:'Situação'},
    {k:'estado',label:'Situação',type:'select',opts:[['ativo','Ativa'],['inativo','Inativa (não aparece nas requisições)']],def:'ativo',full:1},
    {type:'note',html:'As novas requisições usam estes preços e não os deixam alterar. As requisições já emitidas mantêm o preço do dia em que foram feitas.'},
    ...(hist.length?[{type:'note',html:`<b>Histórico de preços</b><br>${hist.map(h=>`${dd(h.data)} · Diesel ${h.precoDiesel!=null?fmt(h.precoDiesel,2):'—'} · Gasolina ${h.precoGasolina!=null?fmt(h.precoGasolina,2):'—'}`).join('<br>')}`}]:[])
  ],p,o=>{
    const mudou=!p.id||+o.precoDiesel!==+p.precoDiesel||+o.precoGasolina!==+p.precoGasolina;
    const historico=mudou?[...(p.historico||[]),{data:TODAY,precoDiesel:o.precoDiesel,precoGasolina:o.precoGasolina}]:(p.historico||[]);
    return save('postos',{...p,...o,historico,precoData:mudou?TODAY:p.precoData});
  },{perm:'postos',done:p.id?'Bomba atualizada.':'Bomba adicionada.',del:p.id&&!usada?()=>remove('postos',p.id):null,
     validate:o=>{ if(o.nuit&&!/^\d{9}$/.test(o.nuit))return 'O NUIT tem 9 dígitos.';
       if(!(o.precoDiesel>0)&&!(o.precoGasolina>0))return 'Indique pelo menos um preço por litro.';
       return S.postos.some(x=>x.id!==p.id&&x.nome.trim().toLowerCase()===o.nome.trim().toLowerCase())?'Já existe uma bomba com este nome.':null; }});
}
// Sugestões para uma nova requisição: a bomba, o motorista e os litros da última requisição desta viatura
// (motorista: senão o do aluguer em curso; bomba: senão a última usada na empresa).
function ultimosReq(vid){
  const ord=xs=>xs.filter(x=>x.estado!=='anulada').sort((a,b)=>(b.data||'').localeCompare(a.data||''));
  const u=ord(S.requisicoes.filter(x=>x.viaturaId===vid))[0], g=ord(S.requisicoes)[0];
  const emCurso=S.reservas.find(x=>x.viaturaId===vid&&x.estado==='curso'&&x.motoristaId);
  return {postoId:u?.postoId||g?.postoId, motoristaId:u?.motoristaId||emCurso?.motoristaId||'', litros:u?.litros};
}
function formRequisicao(r={}){
  if(!S.viaturas.length)return toast('Adicione primeiro uma viatura.');
  const ativos=S.postos.filter(p=>p.estado!=='inativo'||p.id===r.postoId).sort((a,b)=>a.nome.localeCompare(b.nome));
  if(!ativos.length)return toast('Registe primeiro uma bomba de combustível com o preço por litro.');
  const v0=V(r.viaturaId)||S.viaturas.find(v=>v.estado!=='inativa')||S.viaturas[0];
  const novo=!r.id, ini=novo?{...ultimosReq(v0.id),...r}:r, mexeu=new Set();
  // Preço a usar: numa requisição já emitida com a mesma bomba e viatura, fica o preço original.
  const preco=(vid,pid)=>r.id&&vid===r.viaturaId&&pid===r.postoId?+r.precoLitro:precoPosto(PST(pid),combDe(V(vid)));
  const upd=()=>{ const vid=$('#f_viaturaId').value, pid=$('#f_postoId').value, v=V(vid), p=PST(pid), c=combDe(v), pr=preco(vid,pid);
    $('#f_precoLitro').value=pr?pr.toFixed(2):'';
    $('#h_precoLitro').textContent=!c?'Viatura elétrica: não usa bomba.':!pr?`${p?.nome||'Esta bomba'} não tem preço de ${c}.`:`${c} · preço de ${p.nome}${r.id&&pr===+r.precoLitro&&pid===r.postoId?' (da requisição)':p.precoData?` desde ${dd(p.precoData)}`:''}`;
    const l=+$('#f_litros').value||0;
    $('#rqResumo').innerHTML=l&&pr?`<span>${fmt(l,2)} L × ${MT(pr)}</span><b>${MT(l*pr)}</b>`:'<span class="muted">Indique os litros para ver o valor.</span>'; };
  const ult=S.requisicoes.slice().sort((a,b)=>(b.data||'').localeCompare(a.data||''))[0];
  openDrawer(r.id?`Editar requisição ${r.numero}`:'Nova requisição de combustível',[
    {type:'section',label:'1. Documento'},
    {k:'numero',label:'Nº da requisição',req:1,ph:'Ex.: RC 2026/0009',hint:ult?`Última registada: ${ult.numero}`:'Número impresso no livro de requisições'},
    {k:'data',label:'Data da requisição',type:'date',def:TODAY,req:1},
    {type:'section',label:'2. Viatura e bomba'},
    {k:'viaturaId',label:'Viatura',type:'select',optsHtml:vOptions(r.viaturaId||v0.id,v=>v.estado!=='inativa'||v.id===r.viaturaId),full:1,req:1},
    {k:'postoId',label:'Bomba de combustível',type:'select',optsHtml:ativos.map(p=>`<option value="${esc(p.id)}"${p.id===ini.postoId?' selected':''}>${esc(p.nome)}</option>`).join(''),full:1,req:1,hint:novo?'Sugerida: a última usada por esta viatura':undefined},
    {k:'motoristaId',label:'Motorista / requisitante',type:'select',full:1,optsHtml:`<option value="">— Nenhum —</option>`+S.motoristas.filter(m=>m.estado!=='inativo'||m.id===ini.motoristaId).map(m=>`<option value="${esc(m.id)}"${m.id===ini.motoristaId?' selected':''}>${esc(m.nome)}</option>`).join('')},
    {type:'section',label:'3. Quantidade'},
    {k:'litros',label:'Litros requisitados',type:'number',step:'0.01',min:0,req:1,ph:ini.litros?`Última: ${fmt(ini.litros)}`:'0,00'},
    {k:'precoLitro',label:'Preço por litro (MT) · fixo',type:'number',step:'0.01',ro:1,hint:''},
    {type:'note',html:'<div class="sumline" id="rqResumo"></div><div class="muted" style="font-size:12.5px;margin-top:4px">O preço vem da bomba e não pode ser alterado aqui. Para o mudar, edite a bomba em <b>Bombas de combustível</b>.</div>'},
    {k:'finalidade',label:'Finalidade (opcional)',full:1,ph:'Ex.: Serviço de aluguer, deslocação a Mocuba'},
  ],novo?{...ini,litros:r.litros}:r,async o=>{
    const p=PST(o.postoId), v=V(o.viaturaId);
    const rec={...r,...o,numero:normNum(o.numero),posto:p.nome,combustivel:combDe(v),precoLitro:preco(o.viaturaId,o.postoId)};
    return save('requisicoes',r.id?rec:{...rec,estado:'pendente'});
  },{perm:'req.emitir',done:r.id?'Requisição atualizada.':'Requisição emitida. Pode imprimi-la para o motorista levar ao posto.',after:id=>{const x=S.requisicoes.find(q=>q.id===id);if(x&&!r.id)verReq(x)},del:r.id&&r.estado==='pendente'?()=>remove('requisicoes',r.id):null,change:e=>{ const id=e?.target?.id;
       if(id==='f_postoId'||id==='f_motoristaId')mexeu.add(id);
       // Ao trocar de viatura numa requisição nova, sugere de novo bomba e motorista (se ainda não foram mudados à mão).
       if(novo&&id==='f_viaturaId'&&e.type==='change'){ const u=ultimosReq(e.target.value);
         if(!mexeu.has('f_postoId')&&ativos.some(x=>x.id===u.postoId))$('#f_postoId').value=u.postoId;
         if(!mexeu.has('f_motoristaId'))$('#f_motoristaId').value=u.motoristaId||'';
         $('#f_litros').placeholder=u.litros?`Última: ${fmt(u.litros)}`:'0,00'; }
       upd(); },
     validate:o=>{ const dup=S.requisicoes.find(x=>x.id!==r.id&&normNum(x.numero).replace(/ /g,'')===normNum(o.numero).replace(/ /g,''));
       if(dup)return {k:'numero',msg:`O nº ${dup.numero} já está registado (${dd(dup.data)}, ${V(dup.viaturaId)?.matricula||'—'}).`};
       const c=combDe(V(o.viaturaId)); if(!c)return {k:'viaturaId',msg:'Esta viatura é elétrica e não abastece combustível.'};
       if(!preco(o.viaturaId,o.postoId))return {k:'postoId',msg:`A bomba ${PST(o.postoId)?.nome||''} não tem preço de ${c}. Atualize-a antes de requisitar.`};
       return o.litros>0?null:{k:'litros',msg:'Os litros têm de ser maiores que zero.'}; }});
}
function verificarReq(r){
  const v=V(r.viaturaId);
  openDrawer(`Verificar ${r.numero}`,[
    {type:'note',html:`${plate(v)} ${esc(vLabel(v))} · requisitados <b>${fmt(r.litros,1)} L</b> a ${MT(r.precoLitro)}/L (${MT(rqValor(r))}) em ${esc(r.posto||'—')}.`},
    {k:'dataAbast',label:'Data do abastecimento',type:'date',def:r.data,req:1},
    {k:'km',label:'Conta-quilómetros',type:'number',min:0,req:1,hint:`Última leitura: ${fmt(v?.km)} km`},
    {k:'litrosReais',label:'Litros abastecidos',type:'number',step:'0.01',min:0,def:r.litros,req:1,hint:'Conforme talão / fatura do posto'},
    {k:'precoReal',label:'Preço por litro (MT)',type:'number',step:'0.01',def:r.precoLitro,ro:1,hint:'Preço da bomba na requisição'},
    {k:'obsVerif',label:'Observações',full:1,ph:'Diferenças, talão nº…'},
  ],{},async o=>{
    o.precoReal=+r.precoLitro; // o preço é sempre o da requisição (bomba), nunca editado na verificação
    const aid=await save('abastecimentos',{viaturaId:r.viaturaId,data:o.dataAbast,km:o.km,litros:o.litrosReais,precoLitro:o.precoReal,posto:r.posto,postoId:r.postoId,requisicaoId:r.id});
    await patch('requisicoes',r.id,{estado:'verificada',dataAbast:o.dataAbast,km:o.km,litrosReais:o.litrosReais,precoReal:o.precoReal,valorReal:+(o.litrosReais*o.precoReal).toFixed(2),obsVerif:o.obsVerif,abastecimentoId:aid,dataVerif:TODAY,verificadoPor:eu()?.nome||''});
    if(v&&o.km>(+v.km||0)) await patch('viaturas',v.id,{km:o.km});
  },{perm:'req.verificar',ok:'Confirmar verificação',done:'Requisição verificada e abastecimento registado.',
     validate:o=>{ if(!(o.litrosReais>0))return 'Indique os litros abastecidos.';
       const prev=S.abastecimentos.filter(a=>a.viaturaId===r.viaturaId&&a.data<=o.dataAbast).sort((a,b)=>b.km-a.km)[0];
       return prev&&o.km<=prev.km?`A leitura tem de ser superior à do abastecimento anterior (${fmt(prev.km)} km a ${dd(prev.data)}).`:null; }});
}
function pagarReq(r){
  openDrawer(`Pagamento ${r.numero}`,[
    {type:'note',html:`${esc(r.posto||'—')} · ${fmt(r.litrosReais,1)} L verificados · valor a pagar <b>${MT(rqValor(r))}</b>.`},
    {k:'faturaNr',label:'Nº da fatura do fornecedor',req:1,ph:'Ex.: FT 2026/1542'},
    {k:'reciboNr',label:'Nº do recibo',req:1,ph:'Ex.: RC 2026/0877'},
    {k:'dataPag',label:'Data do pagamento',type:'date',def:TODAY,req:1},
    {k:'valorPago',label:'Valor pago (MT)',type:'number',step:'0.01',min:0,def:rqValor(r),req:1},
    {k:'formaPag',label:'Forma de pagamento',type:'select',opts:FORMAS_PAG,def:'Transferência bancária',full:1},
  ],r,o=>patch('requisicoes',r.id,{...o,estado:'paga',pagoPor:eu()?.nome||''}),{perm:'req.pagar',ok:'Confirmar pagamento',done:'Pagamento registado.',
     validate:o=>o.valorPago>0?null:'Indique o valor pago.'});
}
function verReq(r){
  const v=V(r.viaturaId), m=M(r.motoristaId), dif=r.litrosReais!=null?r.litrosReais-r.litros:null;
  const row=(k,val)=>`<tr><td class="muted">${k}</td><td>${val}</td></tr>`;
  $('.drawer-p').classList.remove('wide'); $('#dTitle').textContent=r.numero;
  $('#dBody').innerHTML=`<div style="display:grid;gap:14px"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${vCell(v)}<span class="grow"></span>${pill(ESTADO_RQ[r.estado])}</div>
    <section class="panel"><div class="panel-h"><h2>Requisição</h2></div><div class="tbl-wrap"><table><tbody>
      ${row('Data',dd(r.data))}${row('Requisitante',esc(m?.nome||'—'))}${row('Posto / fornecedor',esc(r.posto||'—'))}${row('Finalidade',esc(r.finalidade||'—'))}
      ${row('Pedido',`${fmt(r.litros,1)} L × ${MT(r.precoLitro)} = ${MT(r.litros*r.precoLitro)}`)}</tbody></table></div></section>
    ${r.estado==='verificada'||r.estado==='paga'?`<section class="panel"><div class="panel-h"><h2>Verificação</h2><span class="sub">${dd(r.dataVerif)}</span></div><div class="tbl-wrap"><table><tbody>
      ${row('Abastecido a',`${dd(r.dataAbast)} · ${fmt(r.km)} km`)}${row('Litros',`${fmt(r.litrosReais,1)} L${dif?` <span class="pill ${dif>0?'p-crit':'p-ok'}">${dif>0?'+':''}${fmt(dif,1)} L face ao pedido</span>`:''}`)}
      ${row('Valor verificado',`<b>${MT(r.valorReal)}</b> (${MT(r.precoReal)}/L)`)}${r.verificadoPor?row('Verificado por',esc(r.verificadoPor)):''}${r.obsVerif?row('Observações',esc(r.obsVerif)):''}</tbody></table></div></section>`:''}
    ${r.estado==='paga'?`<section class="panel"><div class="panel-h"><h2>Pagamento</h2></div><div class="tbl-wrap"><table><tbody>
      ${row('Fatura nº',`<span class="mono">${esc(r.faturaNr)}</span>`)}${row('Recibo nº',`<span class="mono">${esc(r.reciboNr)}</span>`)}${row('Data',dd(r.dataPag))}
      ${row('Valor pago',`<b>${MT(r.valorPago)}</b>${Math.abs((+r.valorPago||0)-(+r.valorReal||0))>0.009?` <span class="pill p-warn">difere ${MT((+r.valorPago||0)-(+r.valorReal||0))}</span>`:''}`)}${row('Forma',esc(r.formaPag||'—'))}${r.pagoPor?row('Registado por',esc(r.pagoPor)):''}</tbody></table></div></section>`:''}
  </div>`;
  $('#dFoot').innerHTML=`${r.estado==='pendente'?`<button type="button" class="btn primary" data-rqver="${r.id}">Verificar</button><button type="button" class="btn" data-edit="requisicoes:${r.id}">Editar</button><button type="button" class="btn ghost danger" data-rqanular="${r.id}">Anular</button>`:r.estado==='verificada'?`<button type="button" class="btn primary" data-rqpag="${r.id}">Registar pagamento</button>`:''}<span style="flex:1"></span>${r.estado!=='anulada'?`<button type="button" class="btn" data-print="rq:${r.id}">Imprimir / PDF</button>`:''}<button type="button" class="btn" data-rqdup="${r.id}" title="Nova requisição com a mesma viatura, bomba, motorista e litros">Duplicar</button><button type="button" class="btn" data-close>Fechar</button>`;
  drawerSubmit=()=>closeDrawer(); $('#drawer').hidden=false;
}

function formDespesa(d={}){
  if(!S.viaturas.length)return toast('Adicione primeiro uma viatura.');
  openDrawer(d.id?'Editar despesa':'Registar despesa',[
    {k:'viaturaId',label:'Viatura',type:'select',optsHtml:vOptions(d.viaturaId),full:1,req:1},
    {k:'data',label:'Data',type:'date',def:TODAY,req:1},{k:'categoria',label:'Categoria',type:'select',opts:['Portagem','Multa','Lavagem','Pneus','Acidente','Seguro','Parqueamento','Outro'],def:'Portagem'},
    {k:'valor',label:'Valor (MT)',type:'number',step:'0.01',req:1,min:0},{k:'descricao',label:'Descrição',full:1},
  ],d,o=>save('despesas',{...d,...o}),{perm:'despesas',done:'Despesa registada.',del:d.id?()=>remove('despesas',d.id):null});
}
function formPlano(p={}){
  if(!S.viaturas.length)return toast('Adicione primeiro uma viatura.');
  openDrawer(p.id?'Editar plano de manutenção':'Novo plano de manutenção',[
    {k:'viaturaId',label:'Viatura',type:'select',optsHtml:vOptions(p.viaturaId),full:1,req:1},
    {k:'tipo',label:'Serviço',req:1,full:1,ph:'Ex.: Óleo e filtros'},
    {k:'intervaloKm',label:'Repetir a cada (km)',type:'number',min:0,def:10000},{k:'intervaloMeses',label:'ou a cada (meses)',type:'number',min:0,def:6},
    {k:'ultimoKm',label:'Último serviço (km)',type:'number',min:0,req:1},{k:'ultimaData',label:'Último serviço (data)',type:'date',req:1},
    {type:'note',html:'O alerta dispara no que chegar primeiro: quilómetros ou tempo. Aviso a 1 500 km ou 30 dias do prazo.'}
  ],p,o=>save('planos',{...p,...o}),{perm:'manutencao',done:'Plano guardado.',del:p.id?()=>remove('planos',p.id):null});
}
function formServico(s={},plano){
  if(!S.viaturas.length)return toast('Adicione primeiro uma viatura.');
  const init=plano?{viaturaId:plano.viaturaId,tipo:plano.tipo,km:V(plano.viaturaId)?.km,data:TODAY}:s;
  openDrawer(s.id?'Editar serviço':'Registar serviço na oficina',[
    {k:'viaturaId',label:'Viatura',type:'select',optsHtml:vOptions(init.viaturaId),full:1,req:1},
    {k:'tipo',label:'Serviço realizado',req:1,full:1},
    {k:'data',label:'Data',type:'date',def:TODAY,req:1},{k:'km',label:'Quilometragem',type:'number',min:0,req:1},
    {k:'oficina',label:'Oficina'},{k:'custo',label:'Custo (MT)',type:'number',step:'0.01',min:0,req:1},
    ...(plano?[{type:'note',html:`Ao guardar, o plano “${esc(plano.tipo)}” recomeça a contar a partir deste serviço.`}]:[])
  ],init,async o=>{ await save('servicos',{...s,...o});
    if(plano) await patch('planos',plano.id,{ultimoKm:o.km,ultimaData:o.data});
    const v=V(o.viaturaId); if(v&&o.km>(+v.km||0)) await patch('viaturas',v.id,{km:o.km}); },
  {perm:'manutencao',done:'Serviço registado.',del:s.id?()=>remove('servicos',s.id):null});
}
function formCliente(c={}){
  openDrawer(c.id?'Editar cliente':'Novo cliente',[
    {k:'nome',label:'Nome ou firma',req:1,full:1},{k:'nuit',label:'NUIT',hint:'9 dígitos',ph:'100000000'},{k:'telefone',label:'Telefone',ph:'+258 84 000 0000'},
    {k:'documento',label:'Documento de identificação',full:1,ph:'BI, passaporte ou alvará'},
    {k:'carta',label:'Carta de condução nº'},{k:'cartaValidade',label:'Carta válida até',type:'date'},
  ],c,o=>save('clientes',{...c,...o}),{perm:'clientes',done:'Cliente guardado.',del:c.id?()=>remove('clientes',c.id):null,
   validate:o=>o.nuit&&!/^\d{9}$/.test(o.nuit)?'O NUIT tem 9 dígitos.':null});
}
const mOptions=sel=>`<option value="">Sem motorista (o cliente conduz)</option>`+S.motoristas.filter(m=>m.estado!=='inativo'||m.id===sel).sort((a,b)=>a.nome.localeCompare(b.nome))
  .map(m=>{const e=mEstado(m);return `<option value="${esc(m.id)}"${m.id===sel?' selected':''}>${esc(m.nome)}${e==='disponivel'?'':` (${ESTADO_M[e][0].toLowerCase()})`}</option>`}).join('');
function formReserva(r={}){
  if(!S.viaturas.length||!S.clientes.length)return toast('Precisa de pelo menos uma viatura e um cliente.');
  const v0=V(r.viaturaId)||S.viaturas.find(v=>v.estado==='disponivel')||S.viaturas[0];
  // Estimativa em direto (dias contratados × tarifas − desconto).
  const est=()=>{ const g=id=>document.getElementById('f_'+id)?.value;
    const vid=g('viaturaId'), mid=g('motoristaId');
    const t={estado:'reservada',inicio:g('inicio'),fim:g('fim')||g('inicio'),tarifa:g('tarifa')===''?V(vid)?.tarifa:+g('tarifa'),
      motoristaId:mid,tarifaMotorista:mid?(g('tarifaMotorista')===''?M(mid)?.tarifa:+g('tarifaMotorista')):0,
      descontoTipo:g('descontoTipo'),descontoValor:+g('descontoValor')||0,descontoMotivo:g('descontoMotivo')};
    $('#resCalc').innerHTML=t.inicio&&g('fim')&&t.fim>=t.inicio?calcHTML(resCalc(t),t)+'<div class="muted" style="font-size:12.5px;margin-top:6px">Estimativa pelos dias reservados. Na devolução cobram-se os dias reais (mais ou menos dias).</div>':'<span class="muted">Escolha as datas para ver o valor.</span>'; };
  openDrawer(r.id?'Editar reserva':'Nova reserva',[
    {type:'section',label:'Cliente e viatura'},
    {k:'clienteId',label:'Cliente',type:'select',optsHtml:cOptions(r.clienteId),full:1,req:1},
    {k:'viaturaId',label:'Viatura',type:'select',optsHtml:vOptions(r.viaturaId||v0.id,v=>v.estado!=='inativa'),full:1,req:1},
    {type:'section',label:'Período e preço'},
    {k:'inicio',label:'Levantamento (entrega ao cliente)',type:'date',def:TODAY,req:1},{k:'fim',label:'Devolução prevista',type:'date',req:1},
    {k:'tarifa',label:'Tarifa diária (MT)',type:'number',step:'0.01',def:v0.tarifa,hint:'Deixe vazio para usar a tarifa da viatura'},{k:'caucao',label:'Caução (MT)',type:'number',step:'0.01',def:0},
    {type:'section',label:'Motorista'},
    {k:'motoristaId',label:'Motorista da empresa',type:'select',optsHtml:mOptions(r.motoristaId)},
    {k:'tarifaMotorista',label:'Tarifa do motorista (MT/dia)',type:'number',step:'0.01',min:0,hint:'Vazio = tarifa do motorista'},
    {k:'condutores',label:'Condutores autorizados',full:1,ph:'Separe por ponto e vírgula',hint:'Pessoas do cliente autorizadas a conduzir, se não houver motorista'},
    {type:'section',label:'Desconto (opcional)'},
    {k:'descontoTipo',label:'Tipo de desconto',type:'select',opts:[['','Sem desconto'],['pct','Percentagem (%)'],['valor','Valor fixo (MT)']]},
    {k:'descontoValor',label:'Valor do desconto',type:'number',step:'0.01',min:0},
    {k:'descontoMotivo',label:'Motivo do desconto',full:1,ph:'Ex.: cliente frequente, aluguer longo'},
    {type:'section',label:'Valor estimado'},
    {type:'note',html:'<div id="resCalc"></div>'},
  ],r,async o=>{ if(o.tarifa==null)o.tarifa=V(o.viaturaId)?.tarifa||0;
    if(!o.motoristaId)o.tarifaMotorista=null; else if(o.tarifaMotorista==null)o.tarifaMotorista=+M(o.motoristaId)?.tarifa||0;
    if(!o.descontoTipo){o.descontoValor=null;o.descontoMotivo='';}
    await save('reservas',{estado:'reservada',...r,...o}); },
  {perm:'reservas',done:r.id?'Reserva atualizada.':'Reserva criada. No dia do levantamento aparece em "Entregar hoje".',del:r.id&&!r.faturaId?()=>remove('reservas',r.id):null,change:est,
   validate:o=>{ if(o.fim<o.inicio)return {k:'fim',msg:'A devolução tem de ser depois do levantamento.'};
     const c=overlap({...r,...o}); if(c){const cl=C(c.clienteId);return `A viatura já está reservada de ${dd(c.inicio)} a ${dd(c.fim)} (${cl?.nome||'outro cliente'}).`}
     const mc=mConflito({...r,...o}); if(mc)return mc;
     const cli=C(o.clienteId); if(!o.motoristaId&&cli?.cartaValidade&&cli.cartaValidade<o.fim)return `A carta de condução de ${cli.nome} caduca a ${dd(cli.cartaValidade)}, antes da devolução.`;
     return descontoErro(o); }});
}
// Antecipações têm de ser justificadas: devolução antes do fim do período e entrega antes da data reservada.
const MOTIVOS_DEV_ANTES=['Cliente terminou o serviço mais cedo','Avaria ou problema com a viatura','Cliente insatisfeito','Troca por outra viatura','Pedido da empresa','Outro'];
const MOTIVOS_ENT_ANTES=['Pedido do cliente','Viatura já preparada e disponível','Outro'];
const justif=(m,o)=>m?`${m}${o?` (${o})`:''}`:'';
const devAntes=r=>r.estado==='concluida'&&r.devolvidoEm&&r.devolvidoEm<r.fim;
const SEM_JUST='__sem'; // opção "Sem justificação — cobrar o período completo"
const antecipTxt=r=>r.cobrarCompleto?'sem justificação — cobrado o período completo':justif(r.motivoAntecipada,r.obsAntecipada);
const opcoesAntecip=()=>[['','— Escolha —'],[SEM_JUST,'Sem justificação — cobrar o período combinado completo'],...MOTIVOS_DEV_ANTES.map(m=>[m,`${m} — cobrar só os dias usados`])];
const valoresAntecip=(sel,obs)=>sel===SEM_JUST?{motivoAntecipada:'',obsAntecipada:obs||'',cobrarCompleto:true}:{motivoAntecipada:sel||'',obsAntecipada:sel?obs||'':'',cobrarCompleto:false};
// Mudar, antes de faturar, a justificação de uma devolução antecipada (muda o que se cobra).
function formAntecipada(r){
  const k=resCalc(r);
  openDrawer('Devolução antes do prazo',[
    {type:'note',html:`Reservada de ${dd(r.inicio)} a ${dd(r.fim)} (${k.dc} dias) · devolvida a ${dd(r.devolvidoEm)} · usou ${k.dUsados} ${k.dUsados===1?'dia':'dias'}.`},
    {k:'sel',label:'Justificação',type:'select',opts:opcoesAntecip(),req:1,full:1},
    {k:'obsAntecipada',label:'Detalhe',full:1,ph:'Obrigatório se escolher "Outro"'},
  ],{sel:r.cobrarCompleto?SEM_JUST:r.motivoAntecipada||'',obsAntecipada:r.obsAntecipada||''},
  o=>patch('reservas',r.id,valoresAntecip(o.sel,o.obsAntecipada)).then(()=>r.id),
  {perm:pode('reservas')?'reservas':'fat.emitir',done:'Cálculo atualizado.',after:id=>{const x=S.reservas.find(q=>q.id===id);if(x)verReserva(x)},
   validate:o=>o.sel==='Outro'&&!o.obsAntecipada?{k:'obsAntecipada',msg:'Descreva o motivo da devolução antecipada.'}:null});
}
// Decidir, antes de faturar, se os dias extra fora do período combinado são cobrados (não cobrar exige motivo).
function formDiasExtra(r){
  const k=resCalc(r);
  openDrawer('Dias extra fora do período',[
    {type:'note',html:`<b>${k.dExtra} ${k.dExtra===1?'dia':'dias'}</b> fora do período combinado (${dd(k.extraDe)} → ${dd(k.extraAte)}) · ${MT(k.valExtra)}`},
    {k:'cobrarExtra',type:'checkbox',label:'Cobrar os dias extra fora do período combinado'},
    {k:'motivoSemExtra',label:'Motivo para não cobrar',full:1,hint:'Obrigatório se não forem cobrados. Aparece na fatura.'},
  ],{cobrarExtra:k.cobraExtra,motivoSemExtra:r.motivoSemExtra||''},
  o=>patch('reservas',r.id,{cobrarExtra:o.cobrarExtra,motivoSemExtra:o.cobrarExtra?'':o.motivoSemExtra}).then(()=>r.id),
  {perm:pode('reservas')?'reservas':'fat.emitir',done:'Cálculo atualizado.',after:id=>{const x=S.reservas.find(q=>q.id===id);if(x)verReserva(x)},
   validate:o=>!o.cobrarExtra&&!o.motivoSemExtra?{k:'motivoSemExtra',msg:'Indique o motivo para não cobrar os dias extra.'}:null});
}
// Cancelar uma reserva (só antes da entrega): pede sempre o motivo; fica registado quem cancelou e quando.
const MOTIVOS_CANCEL=['Cliente desistiu','Cliente não compareceu','Viatura indisponível (avaria ou oficina)','Mudança de datas (nova reserva)','Pagamento ou caução não efetuados','Erro no registo','Outro'];
function formCancelar(r){
  const c=C(r.clienteId), v=V(r.viaturaId);
  openDrawer('Cancelar reserva',[
    {type:'note',html:`${plate(v)} ${esc(vLabel(v))} · <b>${esc(c?.nome||'—')}</b><br>Reservada de ${dd(r.inicio)} a ${dd(r.fim)}. A viatura fica livre para outras reservas nestas datas.`},
    {k:'motivoCancel',label:'Motivo',type:'select',opts:[['','— Escolha o motivo —'],...MOTIVOS_CANCEL.map(m=>[m,m])],req:1,full:1},
    {k:'obsCancel',label:'Observações',type:'textarea',full:1,hint:'Obrigatório se o motivo for "Outro".'},
  ],r.inicio<TODAY?{motivoCancel:'Cliente não compareceu',obsCancel:`Devia levantar a ${dd(r.inicio)}.`}:{},async o=>{
    const antes={estado:r.estado};
    await patch('reservas',r.id,{estado:'cancelada',motivoCancel:o.motivoCancel,obsCancel:o.obsCancel||'',canceladaEm:TODAY,canceladaPor:eu()?.nome||''});
    toast(`Reserva de ${c?.nome||'cliente'} cancelada: ${o.motivoCancel}.`,desfazer(()=>patch('reservas',r.id,{...antes,motivoCancel:'',obsCancel:'',canceladaEm:'',canceladaPor:''})));
  },{perm:'reservas',ok:'Cancelar reserva',
     validate:o=>o.motivoCancel==='Outro'&&!o.obsCancel?{k:'obsCancel',msg:'Descreva o motivo nas observações.'}:null});
  $('#dOk').classList.add('danger-fill'); const vt=$('#dFoot [data-close]'); if(vt)vt.textContent='Voltar';
}
// Ficha de uma reserva: datas previstas e reais, quem entregou e recebeu, checklists e o cálculo do valor.
function verReserva(r){
  const c=C(r.clienteId), v=V(r.viaturaId), mo=M(r.motoristaId), f=r.faturaId&&S.faturas.find(x=>x.id===r.faturaId);
  const row=(k,val)=>`<tr><td class="muted">${k}</td><td>${val}</td></tr>`;
  const ent=r.checkEntrega, dev=r.checkDevolucao, k=resCalc(r);
  const pontos=[['Reservada',`${dd(r.inicio)} → ${dd(r.fim)} · ${resDias(r)} ${resDias(r)===1?'dia':'dias'}`,true],
    ['Entregue',ent?`${dd(ent.data)} ${esc(ent.hora||'')} · por ${esc(ent.por||'—')} a ${esc(ent.pessoa||ent.recebidoPor||'—')}${r.motivoEntregaAntes?`<br><em>Antes da data reservada: ${esc(justif(r.motivoEntregaAntes,r.obsEntregaAntes))}</em>`:''}${levAtraso(r)?`<br><em>Levantou ${levAtraso(r)} ${levAtraso(r)===1?'dia':'dias'} depois do previsto (${dd(r.inicio)}); o valor conta desde essa data</em>`:''}`:r.kmSaida!=null?`${dd(r.inicio)} (sem checklist)`:'',!!(ent||r.kmSaida!=null)],
    ['Devolvida',r.estado==='concluida'?`${dd(r.devolvidoEm||r.fim)}${dev?` ${esc(dev.hora||'')} · recebida por ${esc(dev.por||'—')}`:''}${devAntes(r)?`<br><em>Antes do prazo: ${esc(antecipTxt(r)||'motivo não indicado')}</em>`:''}`:'',r.estado==='concluida']];
  $('.drawer-p').classList.remove('wide'); $('#dTitle').textContent=`Reserva · ${c?.nome||'—'}`;
  $('#dBody').innerHTML=`<div style="display:grid;gap:14px"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${vCell(v)}<span class="grow"></span>${pill(resSituacao(r))}</div>
    ${r.estado==='expirada'?`<div class="cancel-box"><b>Expirada a ${dd(r.expiradaEm)}</b><div>${esc(r.motivoExpira||'O cliente não levantou a viatura.')}</div><div class="muted">Estava reservada de ${dd(r.inicio)} a ${dd(r.fim)}. Se o cliente aparecer, use <b>Reativar com novas datas</b>.</div></div>`
      :r.estado==='cancelada'?`<div class="cancel-box"><b>Cancelada${r.canceladaEm?` a ${dd(r.canceladaEm)}`:''}${r.canceladaPor?` por ${esc(r.canceladaPor)}`:''}</b><div>Motivo: <b>${esc(r.motivoCancel||'não indicado')}</b></div>${r.obsCancel?`<div class="muted">${esc(r.obsCancel)}</div>`:''}<div class="muted">Estava reservada de ${dd(r.inicio)} a ${dd(r.fim)}.</div></div>`
      :`<ol class="tl">${pontos.map(([t,txt,feito])=>`<li class="${feito?'on':''}"><b>${t}</b><span>${feito?txt:'—'}</span></li>`).join('')}</ol>`}
    <section class="panel"><div class="tbl-wrap"><table><tbody>
      ${row('Cliente',esc(c?.nome||'—'))}${row('Motorista',mo?`${esc(mo.nome)} · ${MT0(resMot(r))}/dia`:esc(r.condutores||'Cliente conduz'))}
      ${mo&&subsDaReserva(r.id).length?row('Subsídio do motorista',subsDaReserva(r.id).map(x=>`<button class="link" data-open-sub="${x.id}">${MT0(x.valor)}</button> ${pill(ESTADO_SUB[x.estado])}`).join('<br>')):''}
      ${r.caucao?row('Caução',MT0(r.caucao)):''}
      ${r.kmSaida!=null?row('Quilómetros',`${fmt(r.kmSaida)}${r.kmEntrada?` → ${fmt(r.kmEntrada)} (${fmt(r.kmEntrada-r.kmSaida)} km)`:''}`):''}
    </tbody></table></div></section>
    ${['cancelada','expirada'].includes(r.estado)?'':`<section class="panel"><div class="panel-h"><h2>${r.estado==='concluida'?'Valor':'Valor estimado'}</h2>${f?`<span class="sub">fatura ${esc(f.numero)}</span>`:''}</div><div class="panel-b">${calcHTML(k,r)}${r.estado==='concluida'&&!f&&(k.dExtra||devAntes(r))?`<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">${k.dExtra?`<button type="button" class="btn sm" data-extra="${r.id}">${k.cobraExtra?'Não cobrar os dias extra…':'Cobrar os dias extra'}</button>`:''}${devAntes(r)?`<button type="button" class="btn sm" data-antecip="${r.id}">Alterar justificação da devolução antecipada…</button>`:''}</div>`:''}</div></section>`}
    ${ent?`<section class="panel"><div class="panel-h"><h2>Checklist da entrega</h2></div><div class="panel-b ck-res">${ckResumo(ent)}</div></section>`:''}
    ${dev?`<section class="panel"><div class="panel-h"><h2>Checklist da receção</h2></div><div class="panel-b ck-res">${ckResumo(dev)}</div></section>`:''}</div>`;
  const prox=r.estado==='expirada'?`<button type="button" class="btn primary" data-reativar="${r.id}">Reativar com novas datas</button>`:r.estado==='reservada'?`<button type="button" class="btn primary" data-ent="${r.id}">Entregar</button><button type="button" class="btn" data-edit="reservas:${r.id}">Editar</button><button type="button" class="btn ghost danger" data-cancel="${r.id}">Cancelar reserva</button>`:r.estado==='curso'?`<button type="button" class="btn primary" data-dev="${r.id}">Receber viatura</button>`
    :r.estado==='concluida'&&!f?`<button type="button" class="btn primary" data-faturar="${r.id}">Faturar</button>`:f?`<button type="button" class="btn" data-fat="${f.id}">Fatura ${esc(f.numero)}</button>`:'';
  $('#dFoot').innerHTML=`${prox}<span style="flex:1"></span>${ent?`<button type="button" class="btn" data-print="auto:${r.id}">Auto de entrega</button>`:''}${dev?`<button type="button" class="btn" data-print="autodev:${r.id}">Auto de receção</button>`:''}<button type="button" class="btn" data-resdup="${r.id}" title="Nova reserva para o mesmo cliente e viatura">Duplicar</button><button type="button" class="btn" data-close>Fechar</button>`;
  drawerSubmit=()=>closeDrawer(); $('#drawer').hidden=false;
}
function formMotorista(m={}){
  const ativas=S.reservas.some(r=>r.motoristaId===m.id&&['reservada','curso'].includes(r.estado));
  openDrawer(m.id?'Editar motorista':'Novo motorista',[
    {type:'section',label:'Dados pessoais'},
    {k:'nome',label:'Nome completo',req:1,full:1},
    {k:'telefone',label:'Telefone',ph:'+258 84 000 0000'},{k:'documento',label:'BI nº',ph:'110100000000A'},
    {type:'section',label:'Carta e tarifa'},
    {k:'carta',label:'Carta de condução nº',req:1},{k:'cartaCategoria',label:'Categorias',ph:'B, C1'},
    {k:'cartaValidade',label:'Carta válida até',type:'date',req:1},{k:'tarifa',label:'Tarifa diária (MT)',type:'number',step:'0.01',min:0,def:1500,hint:'Cobrada ao cliente no aluguer com motorista'},
    {k:'subsidioDia',label:'Subsídio por dia (MT)',type:'number',step:'0.01',min:0,hint:'Pago ao motorista. Vazio = valor da empresa'},
    {type:'section',label:'Situação e férias'},
    {k:'estado',label:'Situação',type:'select',opts:[['ativo','Ativo no quadro'],['inativo','Inativo (saiu da empresa)']],def:'ativo',full:1},
    {k:'feriasInicio',label:'Férias de',type:'date'},{k:'feriasFim',label:'Férias até',type:'date'},
    {type:'note',html:'Durante as férias o motorista aparece como <b>De férias</b> e não pode ser atribuído a alugueres.'}
  ],m,o=>save('motoristas',{...m,...o}),{perm:'motoristas',done:m.id?'Motorista atualizado.':'Motorista adicionado.',
   del:m.id&&!ativas?()=>remove('motoristas',m.id):null,validate:o=>feriasErro(m,o.feriasInicio,o.feriasFim)});
}
// Valida um período de férias contra os alugueres já atribuídos ao motorista.
function feriasErro(m,a,b){
  if(!a&&!b)return null; if(!a||!b)return 'Indique o início e o fim das férias.'; if(b<a)return 'O fim das férias tem de ser depois do início.';
  const r=S.reservas.find(r=>m.id&&r.motoristaId===m.id&&['reservada','curso'].includes(r.estado)&&r.inicio<=b&&a<=r.fim);
  return r?`Tem um aluguer atribuído de ${dd(r.inicio)} a ${dd(r.fim)} (${V(r.viaturaId)?.matricula||'—'}). Troque o motorista dessa reserva primeiro.`:null;
}
function formFerias(m){
  openDrawer(`Férias · ${m.nome}`,[
    {k:'feriasInicio',label:'Início',type:'date',req:1,def:TODAY},{k:'feriasFim',label:'Fim',type:'date',req:1},
    {type:'note',html:'Fica registado um período de férias por motorista. Um novo período substitui o anterior.'}
  ],m,o=>patch('motoristas',m.id,o),{perm:'motoristas',ok:'Marcar férias',done:'Férias registadas.',validate:o=>feriasErro(m,o.feriasInicio,o.feriasFim)});
}
/* Entrega e receção com checklist. Cada ponto é Sim / Não; um "Não" leva sempre a descrição do problema.
   reserva.checkEntrega / reserva.checkDevolucao = {data, hora, por, porId, km, combustivel, itens:{ponto:'sim'|'nao'},
   notas:{ponto:'texto'}, obs, pessoa, clienteConfirmou}. "por" é o utilizador com sessão (quem verificou). */
const CHECK_ITENS=['Carroçaria sem riscos nem amolgadelas','Vidros e para-brisas sem danos','Espelhos em bom estado','Faróis, piscas e luzes de travão a funcionar','Pneus em bom estado','Pneu sobresselente','Macaco e chave de rodas','2 triângulos e colete refletor','Extintor','Interior e bancos limpos e sem danos','Ar condicionado a funcionar','Rádio / som a funcionar','Documentos na viatura (livrete, seguro, inspeção)','Viatura limpa'];
const COMB_NIVEIS=['Reserva','1/4','1/2','3/4','Cheio'];
const ckNao=x=>x==='nao'||x==='problema';
const ckProblemas=ck=>Object.entries(ck?.itens||{}).filter(([,x])=>ckNao(x)).map(([k])=>k);
const agoraHora=()=>{const d=new Date();return pad(d.getHours())+':'+pad(d.getMinutes())};
function registoCheck(o){ const me=eu();
  return {data:o.data||TODAY,hora:agoraHora(),por:me?.nome||'',porId:me?.id||null,km:o.km,combustivel:o.combustivel,itens:o.itens,notas:o.itensNotas||{},obs:o.obs||'',pessoa:o.pessoa,clienteConfirmou:!!o.clienteConfirmou}; }
async function entregar(r){
  const v=V(r.viaturaId);
  if(v&&v.estado==='manutencao')return toast('A viatura está na oficina. Mude o estado antes de entregar.');
  const mc=mConflito(r); if(mc)return toast(mc+' Edite a reserva antes de entregar.');
  formEntrega(r);
}
function formEntrega(r){
  const v=V(r.viaturaId), c=C(r.clienteId), mo=M(r.motoristaId);
  const quem=mo?.nome||(r.condutores||'').split(';')[0].trim()||c?.nome||'';
  const d=days(r.inicio,TODAY);
  openDrawer(`Entregar ${v?.matricula||'viatura'}`,[
    {type:'note',html:`${plate(v)} ${esc(vLabel(v))} → <b>${esc(c?.nome||'—')}</b><br>Reservada de ${dd(r.inicio)} a ${dd(r.fim)} (${resDias(r)} ${resDias(r)===1?'dia':'dias'})`},
    ...(d>0?[{type:'note',html:`<div class="lev-atraso"><b>Levantamento previsto: ${dd(r.inicio)}</b> · o cliente vem ${d} ${d===1?'dia':'dias'} depois.<br>O valor conta desde a data reservada (${dd(r.inicio)}), porque a viatura esteve reservada para este cliente.${r.fim<TODAY?`<br>O período reservado já terminou a ${dd(r.fim)}: os dias a partir daí contam como <b>dias extra</b>.`:''}<br>Se o cliente não vem, cancele a reserva com o botão em baixo.</div>`}]:[]),
    ...(d<0?[{type:'section',label:'Entrega antes da data reservada'},{k:'motivoEntregaAntes',label:'Motivo',type:'select',opts:[['','— Escolha o motivo —'],...MOTIVOS_ENT_ANTES.map(m=>[m,m])],req:1,full:1,hint:`Reservada a partir de ${dd(r.inicio)}. Os dias a mais contam como dias extra.`},{k:'obsEntregaAntes',label:'Detalhe do motivo',full:1,ph:'Obrigatório se escolher "Outro"'}]:[]),
    {type:'section',label:'1. Quilómetros e combustível à saída'},
    {k:'km',label:'Quilómetros',type:'number',req:1,min:0,hint:`Última leitura: ${fmt(v?.km)} km`},
    {k:'combustivel',label:'Nível de combustível',type:'select',opts:COMB_NIVEIS,req:1},
    {type:'section',label:'2. Checklist antes de entregar'},
    {k:'itens',label:'Responda a cada ponto',type:'checklist',items:CHECK_ITENS,req:1},
    {k:'obs',label:'Outras observações',type:'textarea',full:1},
    {type:'section',label:'3. Confirmação'},
    {k:'pessoa',label:'Entregue a',req:1,hint:mo?'Motorista da empresa':'Cliente ou condutor que levanta a viatura'},
    {k:'verificadoPor',label:'Verificado por',ro:1,hint:'Utilizador com sessão iniciada'},
    {k:'clienteConfirmou',type:'checkbox',req:1,label:'O cliente conferiu a viatura connosco e concorda com este checklist',missLabel:'a confirmação do cliente'},
  ],{km:v?.km,combustivel:'Cheio',pessoa:quem,verificadoPor:eu()?.nome||''},async o=>{
    await patch('reservas',r.id,{estado:'curso',kmSaida:o.km,checkEntrega:registoCheck(o),...(d<0?{motivoEntregaAntes:o.motivoEntregaAntes,obsEntregaAntes:o.obsEntregaAntes||''}:{})});
    if(v) await patch('viaturas',v.id,{estado:'alugada',km:Math.max(+v.km||0,o.km)});
    return r.id;
  },{perm:'reservas',ok:'Confirmar entrega',extra:d>0?`<button type="button" class="btn ghost danger" data-cancel="${r.id}">Cliente não vem? Cancelar reserva…</button>`:'',
     after:id=>{const x=S.reservas.find(q=>q.id===id); toast(`${v?.matricula||'Viatura'} entregue a ${c?.nome||'cliente'}.`,x&&x.checkEntrega?{label:'Imprimir auto de entrega',fn:()=>imprimir(autoHTML(x,'ent'),nomeFich(`Auto de entrega ${v?.matricula||''} ${dd(x.checkEntrega.data)}`))}:null)},
     validate:o=>{ if(o.km<(+v?.km||0))return {k:'km',msg:`Os km não podem ser inferiores à última leitura (${fmt(v.km)} km).`};
       return d<0&&o.motivoEntregaAntes==='Outro'&&!o.obsEntregaAntes?{k:'obsEntregaAntes',msg:'Descreva o motivo da entrega antecipada.'}:null; }});
  $('.drawer-p').classList.add('wide');
  if(d>0){const vt=$('#dFoot [data-close]'); if(vt)vt.textContent='Voltar';}
}
// Receção da viatura devolvida pelo cliente: checklist, km, combustível, encargos e o cálculo pelos dias reais.
function formDevolucao(r){
  const v=V(r.viaturaId), c=C(r.clienteId), ent=r.checkEntrega;
  const n=x=>COMB_NIVEIS.indexOf(x);
  const calc=()=>{ const g=id=>document.getElementById('f_'+id);
    const t={...r,estado:'concluida',devolvidoEm:g('devolvidoEm').value||TODAY,extras:+g('extras').value||0,extrasDesc:g('extrasDesc').value,
      descontoTipo:g('descontoTipo').value,descontoValor:+g('descontoValor').value||0,descontoMotivo:g('descontoMotivo').value,motivoAntecipada:g('motivoAntecipada').value===SEM_JUST?'':g('motivoAntecipada').value,cobrarCompleto:g('motivoAntecipada').value===SEM_JUST,obsAntecipada:g('obsAntecipada').value,
      cobrarExtra:g('cobrarExtra').checked,motivoSemExtra:g('motivoSemExtra').value};
    const k=resCalc(t), sit=resSituacao(t);
    // A opção dos dias extra só aparece quando há dias fora do período combinado.
    const antes=t.devolvidoEm<r.fim; g('motivoAntecipada').closest('.fld').hidden=!antes; g('obsAntecipada').closest('.fld').hidden=!antes;
    if(antes)$('#h_motivoAntecipada').textContent=(t.cobrarCompleto?'Sem justificação: cobra-se o período combinado completo. ':t.motivoAntecipada?'Com justificação: cobram-se só os dias usados. ':'Com justificação cobram-se só os dias usados; sem justificação, o período completo. ')+`Previsto até ${dd(r.fim)}: a viatura volta ${days(t.devolvidoEm,r.fim)} ${days(t.devolvidoEm,r.fim)===1?'dia':'dias'} antes.`;
    g('cobrarExtra').closest('.fld').hidden=!k.dExtra; g('motivoSemExtra').closest('.fld').hidden=!k.dExtra||t.cobrarExtra;
    const avisos=[];
    if(ent&&n(g('combustivel').value)<n(ent.combustivel))avisos.push(`Combustível: saiu com <b>${esc(ent.combustivel)}</b>, voltou com <b>${esc(g('combustivel').value)}</b>.`);
    const novos=CHECK_ITENS.filter((it,i)=>document.querySelector(`input[name="ck_itens_${i}"][value="nao"]`)?.checked&&!ckNao(ent?.itens?.[it]));
    if(novos.length)avisos.push(`Problemas novos (não estavam na entrega): <b>${novos.map(esc).join(', ')}</b>.`);
    $('#devCalc').innerHTML=`<div style="margin-bottom:8px">${pill(sit)}</div>${calcHTML(k,t)}${avisos.length?`<div class="cl-av">${avisos.join('<br>')} Se for o caso, cobre em <b>Outros encargos</b>.</div>`:''}`; };
  openDrawer(`Receber ${v?.matricula||'viatura'}`,[
    {type:'note',html:`<b>${esc(c?.nome||'—')}</b> · reservada de ${dd(r.inicio)} a ${dd(r.fim)} (${resDias(r)} ${resDias(r)===1?'dia':'dias'})<br><b>À saída:</b> ${ent?ckResumo(ent,true):`${fmt(r.kmSaida)} km`}`},
    {type:'section',label:'1. Devolução'},
    {k:'devolvidoEm',label:'Data da devolução',type:'date',req:1},
    {k:'motivoAntecipada',label:'Justificação da devolução antes do prazo',type:'select',opts:opcoesAntecip(),full:1,hint:''},
    {k:'obsAntecipada',label:'Detalhe do motivo',full:1,ph:'Obrigatório se escolher "Outro"'},
    {k:'km',label:'Quilómetros',type:'number',req:1,min:r.kmSaida||0,hint:`À saída: ${fmt(r.kmSaida)} km`},
    {k:'combustivel',label:'Nível de combustível',type:'select',opts:COMB_NIVEIS,req:1},
    {type:'section',label:'2. Checklist na receção'},
    {k:'itens',label:'Responda a cada ponto',type:'checklist',items:CHECK_ITENS,req:1},
    {k:'obs',label:'Outras observações',type:'textarea',full:1},
    {type:'section',label:'3. Valor'},
    {type:'note',html:'<div id="devCalc"></div>'},
    {k:'cobrarExtra',type:'checkbox',label:'Cobrar os dias extra fora do período combinado'},
    {k:'motivoSemExtra',label:'Motivo para não cobrar os dias extra',full:1,ph:'Ex.: atraso causado pela empresa, cortesia ao cliente'},
    {k:'extras',label:'Outros encargos (MT)',type:'number',step:'0.01',min:0,hint:'Danos, combustível em falta, limpeza…'},{k:'extrasDesc',label:'Descrição dos outros encargos'},
    {k:'descontoTipo',label:'Desconto',type:'select',opts:[['','Sem desconto'],['pct','Percentagem (%)'],['valor','Valor fixo (MT)']]},
    {k:'descontoValor',label:'Valor do desconto',type:'number',step:'0.01',min:0},
    {k:'descontoMotivo',label:'Motivo do desconto',full:1,ph:'Ex.: cliente frequente, devolução antecipada'},
    {type:'section',label:'4. Confirmação'},
    {k:'pessoa',label:'Recebida de',req:1,hint:'Quem devolveu a viatura'},
    {k:'verificadoPor',label:'Verificado por',ro:1,hint:'Utilizador com sessão iniciada'},
    {k:'clienteConfirmou',type:'checkbox',req:1,label:'O cliente conferiu a viatura connosco e concorda com este checklist',missLabel:'a confirmação do cliente'},
  ],{devolvidoEm:TODAY,km:'',combustivel:ent?.combustivel||'Cheio',pessoa:ent?.pessoa||ent?.recebidoPor||c?.nome||'',verificadoPor:eu()?.nome||'',
     extras:r.extras||'',extrasDesc:r.extrasDesc||'',descontoTipo:r.descontoTipo||'',descontoValor:r.descontoValor||'',descontoMotivo:r.descontoMotivo||'',
     cobrarExtra:r.cobrarExtra!==false,motivoSemExtra:r.motivoSemExtra||''},async o=>{
    const tem=!!o.descontoTipo;
    await patch('reservas',r.id,{estado:'concluida',devolvidoEm:o.devolvidoEm,kmEntrada:o.km,extras:o.extras||0,extrasDesc:o.extrasDesc||'',
      descontoTipo:tem?o.descontoTipo:'',descontoValor:tem?o.descontoValor:null,descontoMotivo:tem?o.descontoMotivo:'',
      cobrarExtra:o.cobrarExtra,motivoSemExtra:o.cobrarExtra?'':o.motivoSemExtra,
      ...valoresAntecip(o.devolvidoEm<r.fim?o.motivoAntecipada:'',o.devolvidoEm<r.fim?o.obsAntecipada:''),
      checkDevolucao:registoCheck({...o,data:o.devolvidoEm})});
    await gerarSubsidio({...r,estado:'concluida',devolvidoEm:o.devolvidoEm});
    if(v) await patch('viaturas',v.id,{estado:'disponivel',km:Math.max(+v.km||0,o.km)});
    return r.id;
  },{perm:'reservas',ok:'Confirmar receção',change:calc,
     // Depois de receber não abre a ficha: só o aviso com o valor e o atalho para faturar (ou ver o cálculo, sem permissão para faturar).
     after:id=>{ const x=S.reservas.find(q=>q.id===id); if(!x)return;
       const msg=`${v?.matricula||'Viatura'} recebida de ${c?.nome||'cliente'} · ${MT0(resCalc(x).total)} sem IVA.`;
       toast(msg,pode('fat.emitir')?{label:'Faturar',fn:()=>{ const y=S.reservas.find(q=>q.id===id); if(y&&!y.faturaId)return faturar(y); }}:{label:'Ver cálculo',fn:()=>verReserva(x)}); },
     validate:o=>{ if(o.devolvidoEm<resSaida(r))return {k:'devolvidoEm',msg:`A devolução não pode ser antes da entrega (${dd(resSaida(r))}).`};
       if(o.km<(r.kmSaida||0))return {k:'km',msg:`Os km não podem ser inferiores aos da saída (${fmt(r.kmSaida)} km).`};
       if(o.extras>0&&!o.extrasDesc)return {k:'extrasDesc',msg:'Descreva os outros encargos (aparecem na fatura).'};
       if(o.devolvidoEm<r.fim&&!o.motivoAntecipada)return {k:'motivoAntecipada',msg:`A viatura volta antes do fim do período (${dd(r.fim)}): indique o motivo.`};
       if(o.devolvidoEm<r.fim&&o.motivoAntecipada==='Outro'&&!o.obsAntecipada)return {k:'obsAntecipada',msg:'Descreva o motivo da devolução antecipada.'};
       if(!o.cobrarExtra&&!o.motivoSemExtra&&resCalc({...r,estado:'concluida',devolvidoEm:o.devolvidoEm}).dExtra)return {k:'motivoSemExtra',msg:'Indique o motivo para não cobrar os dias extra.'};
       return descontoErro(o); }});
  $('.drawer-p').classList.add('wide');
}
const devolver=formDevolucao;
function descontoErro(o){
  if(!o.descontoTipo)return null;
  if(!(o.descontoValor>0))return {k:'descontoValor',msg:'Indique o valor do desconto.'};
  if(o.descontoTipo==='pct'&&o.descontoValor>100)return {k:'descontoValor',msg:'A percentagem não pode passar de 100%.'};
  return o.descontoMotivo?null:{k:'descontoMotivo',msg:'Indique o motivo do desconto (aparece na fatura).'};
}
// Resumo de um checklist (ficha da reserva e receção). curto=true para a nota do formulário de receção.
function ckResumo(ck,curto){
  if(!ck)return '<span class="muted">Sem checklist.</span>';
  const pr=ckProblemas(ck), tot=Object.keys(ck.itens||{}).length, nota=k=>ck.notas?.[k];
  const lista=pr.length?`<span class="pill p-warn">${pr.length} com problema</span> ${pr.map(k=>`${esc(k)}${nota(k)?` <span class="muted">(${esc(nota(k))})</span>`:''}`).join(' · ')}`:`<span class="pill p-ok">${tot} pontos OK</span>`;
  if(curto)return `${fmt(ck.km)} km · combustível ${esc(ck.combustivel||'—')} · ${lista}`;
  return `<div>${dd(ck.data)} ${esc(ck.hora||'')} · <b>${fmt(ck.km)} km</b> · combustível <b>${esc(ck.combustivel||'—')}</b></div>
    <div>${lista}</div>${ck.obs?`<div class="muted">${esc(ck.obs)}</div>`:''}
    <div class="muted">Verificado por <b>${esc(ck.por||'—')}</b> · ${esc(ck.pessoa||ck.recebidoPor||'—')}${ck.clienteConfirmou?' · <span style="color:var(--ok)">✓ cliente confirmou</span>':''}</div>`;
}
// Auto de entrega / de receção para imprimir e o cliente assinar.
function autoHTML(r,tipo){
  const ck=(tipo==='dev'?r.checkDevolucao:r.checkEntrega)||{}, v=V(r.viaturaId), c=C(r.clienteId);
  const lin=(k,val)=>`<tr><td class="k">${k}</td><td>${val}</td></tr>`;
  const k=tipo==='dev'?resCalc(r):null;
  return `<div class="inv">
    <div class="row">${cabEmpresa()}<div style="text-align:right"><div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#666">${tipo==='dev'?'Auto de receção':'Auto de entrega'}</div><div>${dd(ck.data)} ${esc(ck.hora||'')}</div></div></div>
    <table class="kv"><tbody>${lin('Cliente',`<b>${esc(c?.nome||'—')}</b>`)}${lin('Viatura',`<span class="mono"><b>${esc(v?.matricula||'—')}</b></span> · ${esc(vLabel(v))}`)}
      ${lin('Período reservado',`${dd(r.inicio)} → ${dd(r.fim)} (${resDias(r)} dias)`)}
      ${tipo==='dev'&&devAntes(r)?lin('Devolução antecipada',esc(antecipTxt(r)||'—')):''}
      ${tipo==='dev'?lin('Entregue / devolvida',`${dd(resSaida(r))} → ${dd(r.devolvidoEm)} · ${k.dr} ${k.dr===1?'dia':'dias'} · ${esc(resSituacao(r)[0])}`):''}
      ${lin('Quilómetros',fmt(ck.km))}${lin('Combustível',esc(ck.combustivel||'—'))}</tbody></table>
    <table class="kv ck-print"><tbody>${Object.entries(ck.itens||{}).map(([it,x])=>lin(esc(it),ckNao(x)?`<b>Não</b>${ck.notas?.[it]?` — ${esc(ck.notas[it])}`:''}`:'Sim')).join('')}</tbody></table>
    ${ck.obs?`<p><b>Observações:</b> ${esc(ck.obs)}</p>`:''}
    ${k?`<p><b>Valor:</b> ${k.dBase} ${k.dBase===1?'dia':'dias'} do período combinado${k.dExtra?` + ${k.dExtra} ${k.dExtra===1?'dia extra':'dias extra'} fora do período${k.cobraExtra?'':' (não cobrados)'}`:''} · total sem IVA ${MT(k.total)}</p>`:''}
    <p>${ck.clienteConfirmou?'☑':'☐'} O cliente conferiu a viatura e concorda com este registo.</p>
    <div class="sig"><div>Verificado por: ${esc(ck.por||'')}</div><div>${tipo==='dev'?'Devolvida por':'Recebida por'}: ${esc(ck.pessoa||ck.recebidoPor||'')}</div></div>
    <div class="legal">${tipo==='dev'?'Registo do estado da viatura no momento da devolução.':'O cliente declara ter recebido a viatura no estado descrito. Danos não registados neste auto serão da responsabilidade do cliente na devolução.'}</div>
  </div>`;
}
async function faturar(r){
  const v=V(r.viaturaId), k=resCalc(r), ano=TODAY.slice(0,4);
  const nums=S.faturas.map(f=>f.numero||'').filter(n=>n.includes(ano+'/')).map(n=>+n.split('/')[1]||0);
  const numero=`FT ${ano}/${pad((nums.length?Math.max(...nums):0)+1,4)}`;
  const m=M(r.motoristaId), mot=`Serviço de motorista${m?` (${m.nome})`:''}`;
  const comb=`período combinado ${ddShort(r.inicio)} a ${ddShort(r.fim)}${k.levAtraso?` (levantada a ${ddShort(r.checkEntrega.data)}; contado desde a data reservada)`:''}${k.dif<0?(k.completo?` (devolvida antes do prazo sem justificação: cobrado o período completo; usados ${k.dUsados} dos ${k.dc} dias)`:` (usados ${k.dBase} dos ${k.dc} dias; devolvida antes do prazo${r.motivoAntecipada?`: ${justif(r.motivoAntecipada,r.obsAntecipada)}`:''})`):''}`;
  const fora=k.dExtra?`dias extra fora do período, ${ddShort(k.extraDe)} a ${ddShort(k.extraAte)}`:'';
  // 1.º o período combinado; depois os dias extra (cobrados, ou a 0 MT com o motivo, para ficar registado na fatura).
  const linhas=[{desc:`Aluguer ${vLabel(v)} (${v?.matricula||''}) — ${comb}`,qtd:k.dBase,preco:k.tv}];
  if(k.tm>0)linhas.push({desc:`${mot} — ${comb}`,qtd:k.dBase,preco:k.tm});
  if(k.dExtra&&k.cobraExtra){ linhas.push({desc:`Aluguer ${v?.matricula||''} — ${fora}`,qtd:k.dExtra,preco:k.tv}); if(k.tm>0)linhas.push({desc:`${mot} — ${fora}`,qtd:k.dExtra,preco:k.tm}); }
  if(k.dExtra&&!k.cobraExtra)linhas.push({desc:`${fora[0].toUpperCase()+fora.slice(1)} — não cobrados${r.motivoSemExtra?`: ${r.motivoSemExtra}`:''}`,qtd:k.dExtra,preco:0});
  if(k.desc>0)linhas.push({desc:`Desconto${r.descontoTipo==='pct'?` de ${fmt(r.descontoValor,1)}%`:''}${r.descontoMotivo?`: ${r.descontoMotivo}`:''}`,qtd:1,preco:-k.desc});
  if(k.extras>0)linhas.push({desc:r.extrasDesc||'Outros encargos',qtd:1,preco:k.extras});
  const id=uid();
  await save('faturas',{id,numero,data:TODAY,clienteId:r.clienteId,reservaId:r.id,viaturaId:r.viaturaId,iva:IVA(),estado:'pendente',linhas});
  await patch('reservas',r.id,{faturaId:id});
  toast(`Fatura ${numero} emitida.`); verFatura(id);
}
/* ---------- impressão / PDF ----------
   O documento é posto em #print (só visível ao imprimir) e abre-se a janela de impressão do navegador,
   onde se escolhe a impressora ou "Guardar como PDF". O título da página vira o nome sugerido do PDF. */
function imprimir(html,nome){
  $('#print').innerHTML=html;
  const t=document.title; document.title=nome;
  let feito=false; const fim=()=>{ if(feito)return; feito=true; document.title=t; $('#print').innerHTML=''; window.removeEventListener('afterprint',fim); };
  window.addEventListener('afterprint',fim);
  // window.print() bloqueia até a janela fechar na maioria dos navegadores; o fim corre nos dois casos.
  setTimeout(()=>{ window.print(); setTimeout(fim,500); },30);
}
const nomeFich=s=>String(s||'documento').replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,' ').trim();
function cabEmpresa(){ const e=S.config; return `<div><h4>${esc(e.nome||'A sua empresa')}</h4><div>${esc(e.endereco||'')}</div><div>NUIT <span class="mono">${esc(e.nuit||'—')}</span>${e.telefone?` · ${esc(e.telefone)}`:''}</div></div>`; }
function fatHTML(f){
  const c=C(f.clienteId)||{};
  return `<div class="inv">
    <div class="row">${cabEmpresa()}
    <div style="text-align:right"><div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#666">Fatura</div><div class="mono" style="font-size:17px">${esc(f.numero)}</div><div>Data: ${dd(f.data)}</div><div>Moeda: MZN</div></div></div>
    <div style="margin:18px 0 12px;padding:10px 12px;background:#efefe9;border-radius:4px"><div style="font-size:11.5px;color:#666;text-transform:uppercase;letter-spacing:.07em">Cliente</div><b>${esc(c.nome||'—')}</b><div>NUIT <span class="mono">${esc(c.nuit||'Consumidor final')}</span></div></div>
    <div class="tbl-wrap"><table><thead><tr><th>Descrição</th><th class="n">Qtd.</th><th class="n">Preço unit.</th><th class="n">Valor</th></tr></thead><tbody>
    ${(f.linhas||[]).map(l=>`<tr><td>${esc(l.desc)}</td><td class="n">${fmt(l.qtd)}</td><td class="n">${MT(l.preco)}</td><td class="n">${MT(l.qtd*l.preco)}</td></tr>`).join('')}
    </tbody></table></div>
    <div class="tot"><div><span>Subtotal</span><span>${MT(fatSub(f))}</span></div><div><span>IVA ${fmt(f.iva)}%</span><span>${MT(fatIva(f))}</span></div><div class="g"><span>Total</span><span>${MT(fatTot(f))}</span></div></div>
    ${f.estado==='paga'?'<div style="margin-top:10px;font-weight:700;color:#27774A">PAGA</div>':''}
    <div class="legal">Documento gerado por protótipo. Para uso fiscal, a numeração e emissão têm de passar por um programa de faturação autorizado pela Autoridade Tributária de Moçambique.</div>
  </div>`;
}
// Requisição para o motorista levar ao posto; a parte de baixo é preenchida pelo posto.
function reqHTML(r){
  const v=V(r.viaturaId), m=M(r.motoristaId), p=PST(r.postoId);
  const lin=(k,val)=>`<tr><td class="k">${k}</td><td>${val}</td></tr>`;
  return `<div class="inv doc-req">
    <div class="row">${cabEmpresa()}
      <div style="text-align:right"><div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#666">Requisição de combustível</div><div class="mono" style="font-size:19px">${esc(r.numero)}</div><div>Data: ${dd(r.data)}</div></div></div>
    <table class="kv"><tbody>
      ${lin('Posto / bomba',`<b>${esc(r.posto||'—')}</b>${p?.localizacao?` · ${esc(p.localizacao)}`:''}${p?.nuit?` · NUIT <span class="mono">${esc(p.nuit)}</span>`:''}`)}
      ${lin('Viatura',`<span class="mono"><b>${esc(v?.matricula||'—')}</b></span> · ${esc(vLabel(v))}`)}
      ${lin('Motorista / requisitante',esc(m?.nome||'—'))}
      ${lin('Combustível',esc(r.combustivel||v?.combustivel||'—'))}
      ${lin('Quantidade autorizada',`<b>${fmt(r.litros,2)} litros</b>`)}
      ${lin('Preço por litro',MT(r.precoLitro))}
      ${lin('Valor máximo',`<b>${MT((+r.litros||0)*(+r.precoLitro||0))}</b>`)}
      ${r.finalidade?lin('Finalidade',esc(r.finalidade)):''}
    </tbody></table>
    <div class="sig"><div>Requisitado por</div><div>Autorizado por</div></div>
    <div class="posto"><div class="ph">A preencher pelo posto</div>
      <table class="kv"><tbody>${lin('Litros abastecidos','')}${lin('Conta-quilómetros','')}${lin('Nº do talão','')}${lin('Data e hora','')}</tbody></table>
      <div class="sig"><div>Assinatura do motorista</div><div>Carimbo e assinatura do posto</div></div></div>
    <div class="legal">Válida apenas para a viatura, o combustível e a quantidade indicados. Devolver o talão ao escritório.</div>
  </div>`;
}
// Registar o recebimento de uma fatura (entra no painel de pagamentos).
function receberFatura(f){
  openDrawer(`Recebimento · ${f.numero}`,[
    {type:'note',html:`${esc(C(f.clienteId)?.nome||'—')} · total <b>${MT(fatTot(f))}</b>`},
    {k:'dataPaga',label:'Data do recebimento',type:'date',req:1},
    {k:'formaPaga',label:'Forma',type:'select',opts:FORMAS_SUB,req:1},
    {k:'refPaga',label:'Referência',full:1,hint:'Nº da transferência, M-Pesa / e-Mola, cheque ou recibo'},
  ],{dataPaga:TODAY,formaPaga:'Transferência bancária'},async o=>{
    await patch('faturas',f.id,{...o,estado:'paga',pagaPor:eu()?.nome||''});
    toast(`Fatura ${f.numero} recebida.`,desfazer(async()=>{await patch('faturas',f.id,{estado:'pendente',dataPaga:'',formaPaga:'',refPaga:''});}));
    return f.id;
  },{perm:'fat.pagar',ok:'Confirmar recebimento',after:id=>verFatura(id),
     validate:o=>o.formaPaga!=='Numerário'&&!o.refPaga?{k:'refPaga',msg:`Indique a referência do pagamento por ${o.formaPaga}.`}:null});
}
function verFatura(id){
  const f=S.faturas.find(x=>x.id===id); if(!f)return;
  $('.drawer-p').classList.remove('wide'); $('#dTitle').textContent=f.numero;
  $('#dBody').innerHTML=fatHTML(f);
  $('#dFoot').innerHTML=`${f.estado==='paga'?`<span class="pill p-ok">Paga${f.dataPaga?` a ${dd(f.dataPaga)}${f.formaPaga?` · ${esc(f.formaPaga)}`:''}`:''}</span>`:`<button type="button" class="btn" id="fPaga">Registar recebimento</button>`}<span style="flex:1"></span><button type="button" class="btn" data-print="fat:${f.id}">Imprimir / PDF</button><button type="button" class="btn primary" data-close>Fechar</button>`;
  const b=$('#fPaga'); if(b)b.onclick=()=>{ if(!precisa('fat.pagar'))return; receberFatura(f); };
  drawerSubmit=()=>closeDrawer();
  $('#drawer').hidden=false;
}
// Histórico de abastecimentos de uma viatura, com gráfico de consumo face à referência.
function verConsumo(vid){
  const v=V(vid); if(!v)return;
  const P=periodo(), all=!!filters.hAll, ref=consRef(v), tol=TOL();
  const list=S.abastecimentos.filter(a=>a.viaturaId===vid&&(all||inP(a.data,P))).sort((a,b)=>a.km-b.km)
    .map(a=>{const c=fillCons(a), x=consDesvio(a);
      const excL=x?.anormal?a.litros-ref.val*c.dist/100:0;
      return {a,c,x,excL,excMT:excL*a.precoLitro}});
  const pts=list.filter(r=>r.c);
  const anorm=list.filter(r=>r.x?.anormal);
  const kmR=sum(pts,r=>r.c.dist), cons=kmR?sum(pts,r=>r.a.litros)/kmR*100:null;
  const top=Math.max(1,...pts.map(r=>r.c.cons),ref?ref.val*(1+tol/100):0)*1.12;
  const y=val=>(val/top*100).toFixed(2)+'%';
  const chart=pts.length?`<div class="cchart" role="img" aria-label="Consumo por abastecimento em L/100 km">
      ${ref?`<div class="cline ref" style="bottom:${y(ref.val)}"><span>Referência ${fmt(ref.val,1)}</span></div><div class="cline tol" style="bottom:${y(ref.val*(1+tol/100))}"><span>Limite +${fmt(tol)}%</span></div>`:''}
      <div class="cbars">${pts.map(r=>`<div class="cbar${r.x?.anormal?' crit':''}" title="${dd(r.a.data)} · ${fmt(r.c.cons,1)} L/100 km"><b>${fmt(r.c.cons,1)}</b><i style="height:${y(r.c.cons)}"></i><small>${ddShort(r.a.data)}</small></div>`).join('')}</div>
    </div>`:'<div class="empty">São precisos pelo menos dois abastecimentos para medir o consumo.</div>';
  $('#dTitle').textContent=`Combustível · ${v.matricula}`;
  $('#dBody').innerHTML=`<div style="display:grid;gap:16px">
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${vCell(v)}<span class="grow"></span>
      <div class="seg" role="group" aria-label="Período do histórico"><button type="button" data-hall="0" aria-pressed="${!all}">${esc(P.label)}</button><button type="button" data-hall="1" aria-pressed="${all}">Todo o histórico</button></div></div>
    <div class="kpis mini">
      <div class="kpi"><label>Gasto</label><b>${MT0(sum(list,r=>r.a.litros*r.a.precoLitro))}</b><small>${fmt(sum(list,r=>r.a.litros),1)} L · ${list.length} abast.</small></div>
      <div class="kpi"><label>Consumo médio</label><b>${cons?fmt(cons,1):'—'}</b><small>L/100 km em ${fmt(kmR)} km</small></div>
      <div class="kpi"><label>Referência</label><b>${ref?fmt(ref.val,1):'—'}</b><small>${ref?(ref.fonte==='definida'?'definida na viatura':'mediana do histórico'):'sem dados suficientes'}</small></div>
      <div class="kpi"><label>Consumo anormal</label><b style="color:${anorm.length?'var(--crit)':'inherit'}">${anorm.length}</b><small>${anorm.length?`${fmt(sum(anorm,r=>r.excL),1)} L a mais · ${MT0(sum(anorm,r=>r.excMT))}`:'nenhum no período'}</small></div>
    </div>
    ${chart}
    ${anorm.length?`<div class="form-err" style="font-weight:400">${anorm.map(r=>`<div><b>${dd(r.a.data)}</b> · ${fmt(r.c.cons,1)} L/100 km (+${fmt(r.x.desvio)}% sobre ${fmt(r.x.ref,1)}): ${fmt(r.a.litros,1)} L para ${fmt(r.c.dist)} km, quando o normal seriam ${fmt(r.a.litros-r.excL,1)} L. Excesso de <b>${fmt(r.excL,1)} L ≈ ${MT0(r.excMT)}</b>${r.a.posto?` · ${esc(r.a.posto)}`:''}.</div>`).join('')}
      <div style="margin-top:6px;font-size:12.5px">Possíveis causas: abastecimento anterior parcial, erro na leitura dos km, fuga ou avaria, condução agressiva ou desvio de combustível.</div></div>`:''}
    <div class="tbl-wrap"><table><thead><tr><th>Data</th><th class="n">Km</th><th class="n">Percorridos</th><th class="n">Litros</th><th class="n">Total</th><th class="n">L/100 km</th><th class="n">Desvio</th></tr></thead>
      <tbody>${list.slice().reverse().map(r=>`<tr${r.x?.anormal?' class="row-crit"':''}><td class="nowrap">${dd(r.a.data)}<br><small class="muted">${esc(r.a.posto||'')}</small></td><td class="n">${fmt(r.a.km)}</td><td class="n muted">${r.c?fmt(r.c.dist):'—'}</td><td class="n">${fmt(r.a.litros,1)}</td><td class="n">${MT0(r.a.litros*r.a.precoLitro)}</td><td class="n">${r.c?fmt(r.c.cons,1):'<span class="muted">1.º registo</span>'}</td>
        <td class="n">${r.x?pill(r.x.anormal?[`+${fmt(r.x.desvio)}%`,'p-crit']:[`${r.x.desvio>0?'+':''}${fmt(r.x.desvio)}%`,r.x.desvio>tol/2?'p-warn':'p-ok']):'<span class="muted">—</span>'}</td></tr>`).join('')}</tbody></table></div>
    ${list.length?'':'<div class="empty">Sem abastecimentos neste período.</div>'}
  </div>`;
  $('#dFoot').innerHTML=`<button type="button" class="btn" data-abastv="${esc(v.id)}">+ Abastecimento</button><span style="flex:1"></span><button type="button" class="btn primary" data-close>Fechar</button>`;
  drawerSubmit=()=>closeDrawer(); filters.hv=vid;
  $('.drawer-p').classList.add('wide');
  $('#drawer').hidden=false;
}
/* ---------- subsídios dos motoristas ----------
   Coleção `subsidios`: {motoristaId, reservaId?, descricao, dias, valorDia, valor, estado, criadoEm, criadoPor,
     dataPag, formaPag, refPag, pagoPor, dataConf, modoConf, obsConf, confPor, anuladoMotivo}.
   pendente (por pagar) → Pagar (data, forma, referência) → pago (à espera de confirmação)
   → Confirmar recebimento (como o motorista confirmou) → confirmado. Também anulado.
   Gera-se sozinho ao receber a viatura de um aluguer com motorista (dias reais com o cliente × subsídio diário). */
const ESTADO_SUB={pendente:['Por pagar','p-warn'],pago:['Pago · falta confirmar','p-info'],confirmado:['Recebido','p-ok'],anulado:['Anulado','p-mute']};
const MODOS_CONF=['Assinatura no recibo','Comprovativo M-Pesa / e-Mola','Mensagem SMS / WhatsApp do motorista','Confirmação presencial ao gestor'];
const FORMAS_SUB=['Numerário','M-Pesa','e-Mola','Transferência bancária','Cheque'];
const SUB_DIA=m=>+(m?.subsidioDia??S.config.subsidioDia??500)||0;
const SB=id=>S.subsidios.find(x=>x.id===id);
const subsDaReserva=rid=>S.subsidios.filter(x=>x.reservaId===rid&&x.estado!=='anulado');
const resTxt=r=>r?`${C(r.clienteId)?.nome||'—'} · ${V(r.viaturaId)?.matricula||''} · ${dd(resSaida(r))} → ${dd(r.devolvidoEm||r.fim)}`:'';
// Chamado depois da receção: gera o subsídio dos dias com o cliente. Se já houve adiantamento pago para esta reserva,
// gera só o complemento dos dias que faltam; um subsídio ainda por pagar é atualizado em vez de duplicado.
async function gerarSubsidio(r){
  if(!r?.motoristaId)return;
  const m=M(r.motoristaId), dias=Math.max(1,days(resSaida(r),r.devolvidoEm||TODAY)), vd=SUB_DIA(m);
  const exist=subsDaReserva(r.id), pend=exist.find(x=>x.estado==='pendente'), jaPago=sum(exist.filter(x=>x!==pend),x=>x.dias);
  const falta=dias-jaPago; if(falta<=0)return;
  const mat=V(r.viaturaId)?.matricula||'', cli=C(r.clienteId)?.nome||'';
  await save('subsidios',{...(pend||{}),motoristaId:r.motoristaId,reservaId:r.id,
    descricao:jaPago?`Complemento: aluguer ${mat} — ${cli} (${dias} dias, ${jaPago} já pagos)`:`Aluguer ${mat} — ${cli}`,
    dias:falta,valorDia:vd,valor:falta*vd,estado:'pendente',criadoEm:pend?.criadoEm||TODAY,criadoPor:pend?.criadoPor||eu()?.nome||'Sistema'});
}
function formSubsidio(s={}){
  if(!S.motoristas.length)return toast('Registe primeiro um motorista.');
  const ms=S.motoristas.filter(m=>m.estado!=='inativo'||m.id===s.motoristaId).sort((a,b)=>a.nome.localeCompare(b.nome));
  const resOpts=mid=>`<option value="">— Sem reserva (adiantamento, deslocação interna…) —</option>`+S.reservas.filter(r=>r.motoristaId===mid&&['curso','concluida'].includes(r.estado))
    .sort((a,b)=>b.inicio.localeCompare(a.inicio)).map(r=>`<option value="${esc(r.id)}"${r.id===s.reservaId?' selected':''}>${esc(resTxt(r))}</option>`).join('');
  const m0=s.motoristaId||ms[0]?.id;
  const upd=e=>{ const g=id=>document.getElementById('f_'+id);
    if(e?.target?.id==='f_motoristaId'){ g('reservaId').innerHTML=resOpts(g('motoristaId').value); g('valorDia').value=SUB_DIA(M(g('motoristaId').value)); }
    if(e?.target?.id==='f_reservaId'&&g('reservaId').value){ const r=S.reservas.find(x=>x.id===g('reservaId').value);
      g('dias').value=Math.max(1,days(resSaida(r),r.devolvidoEm||TODAY)); if(!g('descricao').value)g('descricao').value=`Aluguer ${V(r.viaturaId)?.matricula||''} — ${C(r.clienteId)?.nome||''}`; }
    const t=(+g('dias').value||0)*(+g('valorDia').value||0); $('#subTot').innerHTML=t?`<span>${fmt(+g('dias').value)} × ${MT(+g('valorDia').value)}</span><b>${MT(t)}</b>`:'<span class="muted">Indique os dias e o valor por dia.</span>'; };
  openDrawer(s.id?'Editar subsídio':'Novo subsídio de motorista',[
    {k:'motoristaId',label:'Motorista',type:'select',optsHtml:ms.map(m=>`<option value="${esc(m.id)}"${m.id===m0?' selected':''}>${esc(m.nome)}</option>`).join(''),req:1,full:1},
    {k:'reservaId',label:'Reserva',type:'select',optsHtml:resOpts(m0),full:1,hint:'Escolha a reserva a que o subsídio diz respeito'},
    {k:'descricao',label:'Descrição',req:1,full:1,ph:'Ex.: Adiantamento para deslocação a Mocuba'},
    {k:'dias',label:'Dias',type:'number',min:0,step:'1',req:1},{k:'valorDia',label:'Subsídio por dia (MT)',type:'number',min:0,step:'0.01',req:1},
    {type:'note',html:'<div class="sumline" id="subTot"></div>'},
  ],{dias:1,valorDia:SUB_DIA(M(m0)),...s},async o=>{
    await save('subsidios',{...s,...o,valor:o.dias*o.valorDia,estado:s.estado||'pendente',criadoEm:s.criadoEm||TODAY,criadoPor:s.criadoPor||eu()?.nome||''});
  },{perm:'sub.gerir',done:s.id?'Subsídio atualizado.':'Subsídio registado. Fica por pagar.',change:upd,
     del:s.id&&s.estado==='pendente'?()=>remove('subsidios',s.id):null,
     validate:o=>o.dias>0&&o.valorDia>0?null:{k:o.dias>0?'valorDia':'dias',msg:'Os dias e o valor por dia têm de ser maiores que zero.'}});
}
function pagarSub(s){
  const m=M(s.motoristaId);
  openDrawer(`Pagar subsídio · ${m?.nome||''}`,[
    {type:'note',html:`${esc(s.descricao||'')}<br>${fmt(s.dias)} ${s.dias===1?'dia':'dias'} × ${MT(s.valorDia)} = <b>${MT(s.valor)}</b>`},
    {k:'dataPag',label:'Data do pagamento',type:'date',req:1},
    {k:'formaPag',label:'Como foi pago',type:'select',opts:FORMAS_SUB,req:1},
    {k:'refPag',label:'Referência',full:1,hint:'Nº da transação M-Pesa / e-Mola, da transferência, do cheque ou do recibo de caixa'},
  ],{dataPag:TODAY,formaPag:'Numerário'},o=>patch('subsidios',s.id,{...o,estado:'pago',pagoPor:eu()?.nome||''}).then(()=>s.id),
  {perm:'sub.pagar',ok:'Confirmar pagamento',
   after:id=>toast(`Subsídio de ${m?.nome||'motorista'} pago (${MT0(s.valor)}). Falta o motorista confirmar que recebeu.`,{label:'Imprimir recibo',fn:()=>{const x=SB(id);if(x)imprimir(subHTML(x),nomeFich(`Recibo subsídio ${m?.nome||''} ${dd(x.dataPag)}`))}}),
   validate:o=>o.formaPag!=='Numerário'&&!o.refPag?{k:'refPag',msg:`Indique a referência do pagamento por ${o.formaPag}.`}:null});
}
function confirmarSub(s){
  const m=M(s.motoristaId);
  openDrawer(`Confirmar recebimento · ${m?.nome||''}`,[
    {type:'note',html:`${MT(s.valor)} pagos a ${dd(s.dataPag)} por ${esc(s.formaPag||'—')}${s.refPag?` (ref. ${esc(s.refPag)})`:''}.`},
    {k:'dataConf',label:'Data da confirmação',type:'date',req:1},
    {k:'modoConf',label:'Como o motorista confirmou',type:'select',opts:MODOS_CONF,req:1,full:1},
    {k:'obsConf',label:'Observações',full:1,ph:'Ex.: recibo assinado arquivado na pasta de setembro'},
    {k:'motoristaConfirmou',type:'checkbox',req:1,label:`${m?.nome||'O motorista'} confirmou que recebeu o valor`,missLabel:'a confirmação do motorista'},
  ],{dataConf:TODAY,modoConf:s.formaPag==='Numerário'?'Assinatura no recibo':'Comprovativo M-Pesa / e-Mola'},
  o=>patch('subsidios',s.id,{dataConf:o.dataConf,modoConf:o.modoConf,obsConf:o.obsConf||'',estado:'confirmado',confPor:eu()?.nome||''}),
  {perm:'sub.confirmar',ok:'Confirmar recebimento',done:'Recebimento confirmado.',
   validate:o=>o.dataConf<s.dataPag?{k:'dataConf',msg:'A confirmação não pode ser antes do pagamento.'}:null});
}
function verSub(s){
  const m=M(s.motoristaId), r=s.reservaId&&S.reservas.find(x=>x.id===s.reservaId);
  const row=(k,v)=>`<tr><td class="muted">${k}</td><td>${v}</td></tr>`;
  const pts=[['Gerado',`${dd(s.criadoEm)}${s.criadoPor?` · ${esc(s.criadoPor)}`:''}`,true],
    ['Pago',s.dataPag?`${dd(s.dataPag)} · ${esc(s.formaPag||'')}${s.refPag?` (ref. ${esc(s.refPag)})`:''} · por ${esc(s.pagoPor||'—')}`:'',!!s.dataPag],
    ['Recebido',s.dataConf?`${dd(s.dataConf)} · ${esc(s.modoConf||'')} · registado por ${esc(s.confPor||'—')}`:'',s.estado==='confirmado']];
  $('.drawer-p').classList.remove('wide'); $('#dTitle').textContent=`Subsídio · ${m?.nome||'—'}`;
  $('#dBody').innerHTML=`<div style="display:grid;gap:14px"><div style="display:flex;gap:10px;align-items:center"><b>${esc(s.descricao||'')}</b><span class="grow"></span>${pill(ESTADO_SUB[s.estado]||ESTADO_SUB.pendente)}</div>
    ${s.estado==='anulado'?`<div class="cancel-box"><b>Anulado</b><div>${esc(s.anuladoMotivo||'')}</div></div>`:`<ol class="tl">${pts.map(([t,x,on])=>`<li class="${on?'on':''}"><b>${t}</b><span>${on?x:'—'}</span></li>`).join('')}</ol>`}
    <section class="panel"><div class="tbl-wrap"><table><tbody>
      ${row('Motorista',esc(m?.nome||'—'))}${row('Reserva',r?`<button class="link" data-open-res="${r.id}">${esc(resTxt(r))}</button>`:'<span class="muted">Sem reserva</span>')}
      ${row('Cálculo',`${fmt(s.dias)} ${s.dias===1?'dia':'dias'} × ${MT(s.valorDia)} = <b>${MT(s.valor)}</b>`)}
      ${s.obsConf?row('Observações',esc(s.obsConf)):''}
    </tbody></table></div></section></div>`;
  const prox=s.estado==='pendente'?`<button type="button" class="btn primary" data-subpag="${s.id}">Pagar</button><button type="button" class="btn" data-edit="subsidios:${s.id}">Editar</button><button type="button" class="btn ghost danger" data-subanular="${s.id}">Anular</button>`
    :s.estado==='pago'?`<button type="button" class="btn primary" data-subconf="${s.id}">Confirmar recebimento</button>`:'';
  $('#dFoot').innerHTML=`${prox}<span style="flex:1"></span>${s.dataPag?`<button type="button" class="btn" data-print="sub:${s.id}">Recibo</button>`:''}<button type="button" class="btn" data-close>Fechar</button>`;
  drawerSubmit=()=>closeDrawer(); $('#drawer').hidden=false;
}
// Recibo para o motorista assinar (confirmação de recebimento em papel).
function subHTML(s){
  const m=M(s.motoristaId), r=s.reservaId&&S.reservas.find(x=>x.id===s.reservaId);
  const lin=(k,v)=>`<tr><td class="k">${k}</td><td>${v}</td></tr>`;
  return `<div class="inv"><div class="row">${cabEmpresa()}<div style="text-align:right"><div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#666">Recibo de subsídio</div><div>${dd(s.dataPag)}</div></div></div>
    <table class="kv"><tbody>${lin('Motorista',`<b>${esc(m?.nome||'—')}</b>${m?.documento?` · BI ${esc(m.documento)}`:''}`)}${lin('Referente a',esc(s.descricao||''))}
      ${r?lin('Reserva',esc(resTxt(r))):''}${lin('Cálculo',`${fmt(s.dias)} ${s.dias===1?'dia':'dias'} × ${MT(s.valorDia)}`)}
      ${lin('Valor',`<b>${MT(s.valor)}</b>`)}${lin('Pago por',`${esc(s.formaPag||'')}${s.refPag?` · ref. ${esc(s.refPag)}`:''}`)}</tbody></table>
    <p>Declaro que recebi o valor acima indicado.</p>
    <div class="sig"><div>Pago por: ${esc(s.pagoPor||'')}</div><div>Recebi: ${esc(m?.nome||'')}</div></div></div>`;
}
function viewSubsidios(){
  const P=periodo(), st=['pendente','pago','confirmado'].includes(filters.ss)?filters.ss:'', mf=filters.sm||'';
  const base=S.subsidios.filter(s=>!mf||s.motoristaId===mf);
  const by=k=>base.filter(s=>s.estado===k);
  const conf=by('confirmado').filter(s=>inP(s.dataConf||s.dataPag,P));
  const list=base.filter(s=>st?s.estado===st:(s.estado!=='confirmado'&&s.estado!=='anulado')||inP(s.dataConf||s.dataPag||s.criadoEm,P))
    .sort((a,b)=>({pendente:0,pago:1,confirmado:2,anulado:3}[a.estado]-{pendente:0,pago:1,confirmado:2,anulado:3}[b.estado])||(b.criadoEm||'').localeCompare(a.criadoEm||''));
  const step=(k,n,t,sub,cls,v)=>`<button class="step${st===k?' on':''}" data-ss="${st===k?'':k}" aria-pressed="${st===k}"><span class="n">${n}</span><span class="st"><b>${t}</b><small>${sub}</small></span><em class="${cls}">${v}</em></button>`;
  const act=s=>s.estado==='pendente'?`<button class="btn sm primary" data-subpag="${s.id}">Pagar</button>`:s.estado==='pago'?`<button class="btn sm primary" data-subconf="${s.id}">Confirmar</button>`:'';
  return `<div class="steps">
      <button class="step" data-new="subsidio"><span class="n">+</span><span class="st"><b>Registar</b><small>adiantamento ou deslocação</small></span><em>Novo</em></button>
      ${step('pendente','1','Por pagar',MT0(sum(by('pendente'),s=>s.valor)),by('pendente').length?'warn':'',by('pendente').length)}
      ${step('pago','2','Pagos · falta confirmar',MT0(sum(by('pago'),s=>s.valor)),by('pago').length?'info':'',by('pago').length)}
      ${step('confirmado','✓','Recebidos',`${MT0(sum(conf,s=>s.valor))} no período`,'ok',conf.length)}
    </div>
    <div class="toolbar">${perBar()}<select class="search" id="sm" aria-label="Filtrar por motorista" style="width:auto"><option value="">Todos os motoristas</option>${S.motoristas.map(m=>`<option value="${esc(m.id)}"${m.id===mf?' selected':''}>${esc(m.nome)}</option>`).join('')}</select></div>
    <section class="panel"><div class="tbl-wrap"><table>
      <thead><tr><th>Motorista</th><th>Referente a</th><th class="n">Valor</th><th>Pagamento</th><th>Situação</th><th></th></tr></thead>
      <tbody>${list.map(s=>{const m=M(s.motoristaId), r=s.reservaId&&S.reservas.find(x=>x.id===s.reservaId);
        return `<tr class="row-link${s.estado==='anulado'?' muted':''}" data-open="sub:${s.id}" tabindex="0" title="Abrir subsídio"><td><b>${esc(m?.nome||'—')}</b></td>
        <td>${esc(s.descricao||'')}<br><small class="muted">${r?`${dd(resSaida(r))} → ${dd(r.devolvidoEm||r.fim)} · `:''}${fmt(s.dias)} ${s.dias===1?'dia':'dias'} × ${MT0(s.valorDia)}</small></td>
        <td class="n"><b>${MT0(s.valor)}</b></td>
        <td class="nowrap">${s.dataPag?`${dd(s.dataPag)} · ${esc(s.formaPag||'')}${s.refPag?`<br><small class="muted mono">${esc(s.refPag)}</small>`:''}`:'<span class="muted">—</span>'}</td>
        <td>${pill(ESTADO_SUB[s.estado]||ESTADO_SUB.pendente)}${s.estado==='confirmado'?`<br><small class="muted">${dd(s.dataConf)} · ${esc(s.modoConf||'')}</small>`:''}</td><td class="act">${act(s)}</td></tr>`}).join('')}</tbody>
    </table></div>${list.length?'':'<div class="empty">Sem subsídios neste filtro ou período.</div>'}</section>`;
}

/* ---------- painel de pagamentos ----------
   Junta todos os movimentos de dinheiro num só livro (movimentos()), a partir dos registos que já existem:
   saídas = combustível (requisições pagas + abastecimentos sem requisição), subsídios pagos, oficina e despesas;
   entradas = faturas pagas. Abastecimentos e despesas feitos durante um aluguer contam para esse aluguer. */
const TIPOS_MOV={combustivel:['Combustível','var(--accent)'],subsidio:['Subsídios','var(--info)'],oficina:['Oficina','var(--amber)'],despesa:['Despesas','var(--crit)'],recebimento:['Recebido de clientes','var(--ok)']};
const TIPOS_SAIDA=['combustivel','subsidio','oficina','despesa'];
// Reserva em que a viatura estava com um cliente nessa data (para ligar custos ao aluguer).
function resNaData(vid,data){
  return S.reservas.find(r=>r.viaturaId===vid&&['curso','concluida'].includes(r.estado)&&resSaida(r)<=data&&data<=(r.devolvidoEm||(r.estado==='curso'?TODAY:r.fim)));
}
function movimentos(){
  const L=[];
  S.requisicoes.filter(r=>r.estado==='paga').forEach(r=>L.push({data:r.dataPag||r.data,tipo:'combustivel',valor:+r.valorPago||0,viaturaId:r.viaturaId,motoristaId:r.motoristaId,
    reservaId:resNaData(r.viaturaId,r.dataAbast||r.data)?.id,descricao:`Requisição ${r.numero} · ${r.posto||''} · ${fmt(r.litrosReais??r.litros,1)} L`,forma:r.formaPag,ref:[r.faturaNr,r.reciboNr].filter(Boolean).join(' / '),abrir:`rq:${r.id}`}));
  S.abastecimentos.filter(a=>!a.requisicaoId).forEach(a=>L.push({data:a.data,tipo:'combustivel',valor:(+a.litros||0)*(+a.precoLitro||0),viaturaId:a.viaturaId,
    reservaId:resNaData(a.viaturaId,a.data)?.id,descricao:`Abastecimento direto · ${a.posto||''} · ${fmt(a.litros,1)} L`,forma:'',ref:'',abrir:`edit:abastecimentos:${a.id}`}));
  S.subsidios.filter(x=>['pago','confirmado'].includes(x.estado)).forEach(x=>{ const r=x.reservaId&&S.reservas.find(y=>y.id===x.reservaId);
    L.push({data:x.dataPag,tipo:'subsidio',valor:+x.valor||0,viaturaId:r?.viaturaId,motoristaId:x.motoristaId,reservaId:x.reservaId,
      descricao:`Subsídio · ${M(x.motoristaId)?.nome||''} · ${x.descricao||''}`,forma:x.formaPag,ref:x.refPag||'',estado:x.estado==='confirmado'?'recebido pelo motorista':'falta confirmar',abrir:`sub:${x.id}`}); });
  S.servicos.forEach(x=>L.push({data:x.data,tipo:'oficina',valor:+x.custo||0,viaturaId:x.viaturaId,reservaId:null,descricao:`${x.tipo}${x.oficina?` · ${x.oficina}`:''}`,forma:'',ref:'',abrir:`edit:servicos:${x.id}`}));
  S.despesas.forEach(x=>L.push({data:x.data,tipo:'despesa',valor:+x.valor||0,viaturaId:x.viaturaId,reservaId:resNaData(x.viaturaId,x.data)?.id,descricao:`${x.categoria}${x.descricao?` · ${x.descricao}`:''}`,forma:'',ref:'',abrir:`edit:despesas:${x.id}`}));
  S.faturas.filter(f=>f.estado==='paga').forEach(f=>{ const r=f.reservaId&&S.reservas.find(y=>y.id===f.reservaId);
    L.push({data:f.dataPaga||f.data,tipo:'recebimento',entrada:true,valor:fatTot(f),viaturaId:f.viaturaId,motoristaId:r?.motoristaId,reservaId:f.reservaId,descricao:`Fatura ${f.numero} · ${C(f.clienteId)?.nome||''}`,forma:f.formaPaga||'',ref:'',abrir:`fat:${f.id}`}); });
  return L.filter(m=>m.data).sort((a,b)=>b.data.localeCompare(a.data));
}
const AGRUP={tipo:'Tipo',viatura:'Viatura',aluguer:'Aluguer',motorista:'Motorista'};
function grupoDe(m,ag){
  if(ag==='tipo')return {k:m.tipo,t:TIPOS_MOV[m.tipo][0]};
  if(ag==='viatura'){const v=V(m.viaturaId);return v?{k:v.id,t:v.matricula,sub:vLabel(v)}:{k:'_',t:'Sem viatura'}}
  if(ag==='motorista'){const x=M(m.motoristaId);return x?{k:x.id,t:x.nome}:null}
  const r=m.reservaId&&S.reservas.find(y=>y.id===m.reservaId);
  return r?{k:r.id,t:C(r.clienteId)?.nome||'—',sub:`${V(r.viaturaId)?.matricula||''} · ${dd(resSaida(r))} → ${dd(r.devolvidoEm||r.fim)}`}:null;
}
function viewPagamentos(){
  const P=periodo(), ag=AGRUP[filters.pag]?filters.pag:'tipo';
  const movs=movimentos().filter(m=>inP(m.data,P));
  const saidas=movs.filter(m=>!m.entrada), entradas=movs.filter(m=>m.entrada);
  const pago=sum(saidas,m=>m.valor), recebido=sum(entradas,m=>m.valor);
  // Agrupar: cada grupo soma por tipo de movimento.
  const G=new Map();
  movs.forEach(m=>{ const g=grupoDe(m,ag); if(!g)return; if(!G.has(g.k))G.set(g.k,{...g,por:{},n:0,movs:[]}); const x=G.get(g.k); x.por[m.tipo]=(x.por[m.tipo]||0)+m.valor; x.n++; x.movs.push(m); });
  const grupos=[...G.values()].map(g=>({...g,pago:sum(TIPOS_SAIDA,t=>g.por[t]||0),recebido:g.por.recebimento||0})).sort((a,b)=>b.pago-a.pago||b.recebido-a.recebido);
  const maxG=Math.max(1,...grupos.map(g=>Math.max(g.pago,g.recebido)));
  const barra=g=>`<div class="bar-track" title="${TIPOS_SAIDA.filter(t=>g.por[t]).map(t=>`${TIPOS_MOV[t][0]} ${MT0(g.por[t])}`).join(' · ')}">${TIPOS_SAIDA.map(t=>g.por[t]?`<span style="width:${g.por[t]/maxG*100}%;background:${TIPOS_MOV[t][1]}"></span>`:'').join('')}</div>`;
  filters._pagGrupos=grupos; // para abrir o detalhe ao clicar
  const semGrupo=ag==='motorista'?'Só subsídios e requisições têm motorista; os outros movimentos não aparecem aqui.':ag==='aluguer'?'Só aparecem movimentos ligados a um aluguer (feitos durante o aluguer, subsídios e faturas).':'';
  return `<div class="toolbar">${perBar()}<div class="seg" role="group" aria-label="Agrupar por">${Object.entries(AGRUP).map(([k,t])=>`<button data-pag="${k}" aria-pressed="${ag===k}">${t}</button>`).join('')}</div></div>
  <div class="kpis">
    <div class="kpi"><label>Pagamentos feitos</label><b>${MT0(pago)}</b><small>${saidas.length} ${saidas.length===1?'movimento':'movimentos'} · ${esc(P.label)}</small></div>
    <div class="kpi"><label>Recebido de clientes</label><b style="color:var(--ok)">${MT0(recebido)}</b><small>${entradas.length} ${entradas.length===1?'fatura paga':'faturas pagas'}</small></div>
    <div class="kpi"><label>Saldo</label><b style="color:${recebido-pago>=0?'var(--ok)':'var(--crit)'}">${MT0(recebido-pago)}</b><small>recebido menos pago</small></div>
  </div>
  <section class="panel" style="margin-bottom:18px"><div class="panel-h"><h2>Por ${AGRUP[ag].toLowerCase()}</h2><span class="sub">clique para ver os movimentos</span></div>
    <div class="panel-b" style="padding-bottom:0"><div class="legend">${TIPOS_SAIDA.map(t=>`<span><i style="background:${TIPOS_MOV[t][1]}"></i>${TIPOS_MOV[t][0]}</span>`).join('')}</div></div>
    ${grupos.length?`<div class="tbl-wrap"><table><thead><tr><th>${AGRUP[ag]}</th><th style="min-width:160px">Distribuição</th><th class="n">Pago</th><th class="n">Recebido</th><th class="n">Movimentos</th></tr></thead><tbody>
    ${grupos.map((g,i)=>`<tr class="row-link" data-pagg="${i}" tabindex="0" title="Ver movimentos"><td>${ag==='viatura'&&V(g.k)?plate(V(g.k)):`<b>${esc(g.t)}</b>`}${g.sub?`<br><small class="muted">${esc(g.sub)}</small>`:''}</td><td>${g.pago?barra(g):''}</td>
      <td class="n"><b>${g.pago?MT0(g.pago):'—'}</b></td><td class="n" style="color:var(--ok)">${g.recebido?MT0(g.recebido):'—'}</td><td class="n muted">${g.n}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Sem movimentos neste período.</div>'}
    ${semGrupo?`<div class="panel-b muted" style="font-size:12.5px">${semGrupo}</div>`:''}</section>
  <section class="panel"><div class="panel-h"><h2>Últimos movimentos</h2><span class="sub">${esc(P.label)}</span></div>
    ${movs.length?`<div class="tbl-wrap"><table><tbody>${(filters.mvAll?movs:movs.slice(0,10)).map(movLinha).join('')}</tbody></table></div>${movs.length>10?`<button class="more" data-more="mv">${filters.mvAll?'Mostrar menos':`Ver mais ${movs.length-10}`}</button>`:''}`:'<div class="empty">Sem movimentos neste período.</div>'}</section>`;
}
const movLinha=m=>`<tr class="row-link" data-open="${m.abrir}" tabindex="0" title="Abrir o registo"><td class="nowrap">${dd(m.data)}</td><td><span class="tipo-dot" style="background:${TIPOS_MOV[m.tipo][1]}"></span>${esc(TIPOS_MOV[m.tipo][0])}</td>
  <td>${esc(m.descricao)}${m.viaturaId&&V(m.viaturaId)?` <small class="muted mono">${esc(V(m.viaturaId).matricula)}</small>`:''}${m.estado?`<br><small class="muted">${esc(m.estado)}</small>`:''}</td>
  <td class="nowrap">${m.forma?esc(m.forma):'<span class="muted">—</span>'}${m.ref?`<br><small class="muted mono">${esc(m.ref)}</small>`:''}</td>
  <td class="n" style="color:${m.entrada?'var(--ok)':'inherit'}"><b>${m.entrada?'+ ':''}${MT0(m.valor)}</b></td></tr>`;
// Detalhe de um grupo (na gaveta larga): os movimentos um a um.
function verGrupoPag(i){
  const g=(filters._pagGrupos||[])[i]; if(!g)return;
  $('#dTitle').textContent=`${g.t}${g.sub?` · ${g.sub}`:''}`;
  $('#dBody').innerHTML=`<div style="display:grid;gap:14px"><div class="kpis mini">
      ${TIPOS_SAIDA.filter(t=>g.por[t]).map(t=>`<div class="kpi"><label>${TIPOS_MOV[t][0]}</label><b>${MT0(g.por[t])}</b></div>`).join('')}
      ${g.recebido?`<div class="kpi"><label>Recebido</label><b style="color:var(--ok)">${MT0(g.recebido)}</b></div>`:''}</div>
    <div class="tbl-wrap"><table><thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Forma / ref.</th><th class="n">Valor</th></tr></thead><tbody>${g.movs.map(movLinha).join('')}</tbody></table></div>
    <div class="cl tot" style="display:flex;justify-content:space-between;font-weight:700"><span>Total pago${g.recebido?' · recebido':''}</span><span>${MT0(g.pago)}${g.recebido?` · <span style="color:var(--ok)">${MT0(g.recebido)}</span>`:''}</span></div></div>`;
  $('#dFoot').innerHTML='<span style="flex:1"></span><button type="button" class="btn primary" data-close>Fechar</button>';
  drawerSubmit=()=>closeDrawer(); $('.drawer-p').classList.add('wide'); $('#drawer').hidden=false;
}

/* ---------- utilizadores ---------- */
const adminsAtivos=excl=>S.utilizadores.filter(u=>u.id!==excl&&u.perfil==='admin'&&u.estado!=='inativo').length;
function formUtilizador(u={}){
  const primeiro=!S.utilizadores.length, euId=eu()?.id;
  openDrawer(u.id?'Editar utilizador':'Novo utilizador',[
    {k:'nome',label:'Nome',req:1,full:1},
    {k:'email',label:'Email',type:'email',req:1,full:1,ph:'nome@empresa.co.mz',hint:'Será o login na versão com servidor'},
    {k:'perfil',label:'Perfil de acesso',type:'select',opts:Object.entries(PERFIS).map(([k,p])=>[k,p.t]),def:primeiro?'admin':'operador',req:1,full:1,hint:''},
    {k:'estado',label:'Situação',type:'select',opts:[['ativo','Ativo'],['inativo','Inativo (não pode entrar)']],def:'ativo',full:1},
    ...(primeiro?[{type:'note',html:'Este é o primeiro utilizador: tem de ser <b>Administrador</b> para poder gerir os restantes.'}]:[])
  ],u,async o=>{ o.email=o.email.toLowerCase(); const id=await save('utilizadores',{...u,...o}); if(primeiro)lsSet(SESS_KEY,id); },
  {perm:'utilizadores',done:u.id?'Utilizador atualizado.':'Utilizador criado.',
   del:u.id&&u.id!==euId&&!(u.perfil==='admin'&&!adminsAtivos(u.id))?()=>remove('utilizadores',u.id):null,
   change:()=>{ const el=$('#f_perfil'), h=$('#h_perfil'); if(el&&h)h.textContent=PERFIS[el.value]?.d||''; },
   validate:o=>{
     if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(o.email))return {k:'email',msg:'Email inválido.'};
     if(S.utilizadores.some(x=>x.id!==u.id&&x.email===o.email.toLowerCase()))return {k:'email',msg:'Já existe um utilizador com este email.'};
     if(primeiro&&o.perfil!=='admin')return {k:'perfil',msg:'O primeiro utilizador tem de ser Administrador.'};
     if(u.perfil==='admin'&&(o.perfil!=='admin'||o.estado==='inativo')&&!adminsAtivos(u.id))return {k:'perfil',msg:'Tem de existir pelo menos um administrador ativo.'};
     if(u.id&&u.id===euId&&o.estado==='inativo')return {k:'estado',msg:'Não pode desativar a sua própria conta.'};
     return null; }});
}
function viewUtilizadores(){
  const us=S.utilizadores.slice().sort((a,b)=>(a.estado==='inativo')-(b.estado==='inativo')||Object.keys(PERFIS).indexOf(a.perfil)-Object.keys(PERFIS).indexOf(b.perfil)||a.nome.localeCompare(b.nome));
  const euId=eu()?.id;
  return `<div class="toolbar"><span class="grow"></span><button class="btn primary" data-new="utilizador">+ Novo utilizador</button></div>
  <section class="panel" style="margin-bottom:18px"><div class="tbl-wrap"><table>
    <thead><tr><th>Utilizador</th><th>Perfil</th><th>Situação</th></tr></thead>
    <tbody>${us.map(u=>`<tr class="row-link${u.estado==='inativo'?' muted':''}" data-open="edit:utilizadores:${u.id}" tabindex="0" title="Editar utilizador"><td><div class="me"><span class="avatar">${esc(iniciais(u.nome))}</span><span><b>${esc(u.nome)}${u.id===euId?' <small class="muted">(você)</small>':''}</b><small>${esc(u.email||'')}</small></span></div></td>
      <td>${esc(PERFIS[u.perfil]?.t||u.perfil)}</td><td>${pill(u.estado==='inativo'?['Inativo','p-mute']:['Ativo','p-ok'])}</td></tr>`).join('')}</tbody>
  </table></div>${us.length?'':'<div class="empty">Ainda não há utilizadores. Enquanto não houver, qualquer pessoa entra como administrador.<br><button class="btn primary" data-new="utilizador" style="margin-top:10px">+ Criar o primeiro (administrador)</button></div>'}</section>
  <section class="panel"><div class="panel-h"><h2>Perfis de acesso</h2></div><ul class="perfis">
    ${Object.entries(PERFIS).map(([k,p])=>`<li><b>${esc(p.t)}</b><span class="muted">${esc(p.d)}</span><small class="muted">${S.utilizadores.filter(u=>u.perfil===k&&u.estado!=='inativo').length}</small></li>`).join('')}
  </ul></section>`;
}
function formEmpresa(){
  openDrawer('Dados da empresa',[
    {k:'nome',label:'Nome da empresa',req:1,full:1},{k:'nuit',label:'NUIT',req:1},{k:'telefone',label:'Telefone'},
    {k:'endereco',label:'Endereço',full:1},{k:'iva',label:'Taxa de IVA (%)',type:'number',step:'0.1',def:16,hint:'Taxa geral em Moçambique: 16%'},
    {k:'toleranciaConsumo',label:'Tolerância de consumo (%)',type:'number',min:0,step:'1',def:20,hint:'Acima da referência conta como consumo anormal'},
    {k:'subsidioDia',label:'Subsídio do motorista por dia (MT)',type:'number',min:0,step:'0.01',def:500,hint:'Valor por omissão; cada motorista pode ter o seu'},
    {k:'diasExpiraReserva',label:'Reserva expira após (dias)',type:'number',min:1,step:'1',def:3,hint:'Dias de atraso no levantamento até a reserva passar a Expirada'},
  ],S.config,o=>saveConfig({...S.config,...o}),{perm:'empresa',done:'Dados da empresa guardados.',validate:o=>/^\d{9}$/.test(o.nuit)?null:'O NUIT tem 9 dígitos.'});
}

/* ---------- views ---------- */
function vCell(v){return `<div style="display:flex;gap:10px;align-items:center">${plate(v)}<div class="vname"><b>${esc(vLabel(v))}</b></div></div>`}

// Painel adaptado ao perfil: cada pessoa vê primeiro o que tem para fazer.
//  contabilista → requisições por pagar e faturas por receber;
//  operador     → entregas e devoluções de hoje;
//  gestor       → alertas da frota e requisições por verificar;
//  admin / consulta → visão geral.
function viewPainel(){
  const pf=perfil();
  const vs=S.viaturas.filter(v=>v.estado!=='inativa'); const n=vs.length||1;
  const cnt=k=>vs.filter(v=>v.estado===k).length;
  const mes=TODAY.slice(0,7);
  const recMes=sum(S.faturas.filter(f=>(f.data||'').startsWith(mes)),fatSub);
  const custoMes=sum(S.abastecimentos.filter(a=>(a.data||'').startsWith(mes)),a=>a.litros*a.precoLitro)+sum(S.despesas.filter(d=>(d.data||'').startsWith(mes)),d=>d.valor)+sum(S.servicos.filter(s=>(s.data||'').startsWith(mes)),s=>s.custo);
  const pend=S.faturas.filter(f=>f.estado==='pendente').sort((a,b)=>a.data.localeCompare(b.data));
  const porFaturar=S.reservas.filter(r=>r.estado==='concluida'&&!r.faturaId);
  const rqPag=S.requisicoes.filter(r=>r.estado==='verificada').sort((a,b)=>(a.dataVerif||a.data).localeCompare(b.dataVerif||b.data));
  const rqVer=S.requisicoes.filter(r=>r.estado==='pendente').sort((a,b)=>a.data.localeCompare(b.data));
  const LIM=5;
  // Lista curta com "Ver mais": chave k guarda o estado aberto/fechado em filters.
  const lista=(k,itens,li,vazio)=>{ const all=!!filters[k+'All'];
    return itens.length?`<ul class="alerts">${(all?itens:itens.slice(0,LIM)).map(li).join('')}</ul>${itens.length>LIM?`<button class="more" data-more="${k}">${all?'Mostrar menos':`Ver mais ${itens.length-LIM}`}</button>`:''}`:`<div class="empty">${vazio}</div>`; };
  const panel=(t,sub,body)=>`<section class="panel"><div class="panel-h"><h2>${t}</h2>${sub||''}</div>${body}</section>`;
  const kpi=(l,b,sm,extra='')=>`<div class="kpi"><label>${l}</label><b>${b}</b><small>${sm}</small>${extra}</div>`;

  const kFrota=kpi('Frota',`${cnt('alugada')}<span class="of">/${vs.length}</span>`,`alugadas hoje · ${cnt('disponivel')} livres`,
    `<div class="fleetbar" aria-hidden="true"><span style="width:${cnt('disponivel')/n*100}%;background:var(--ok)"></span><span style="width:${cnt('alugada')/n*100}%;background:var(--info)"></span><span style="width:${cnt('manutencao')/n*100}%;background:var(--amber)"></span></div>`);
  const kFat=kpi('Faturado este mês',MT0(recMes),pend.length?`${MT0(sum(pend,fatTot))} por receber`:'tudo recebido');
  const kCus=kpi('Custos este mês',MT0(custoMes),'combustível, oficina e despesas');

  const alertLi=a=>`<li class="${a.lvl}"><span class="sev"></span><div><div class="t">${esc(a.t)}</div><div class="m">${a.who?`<b>${esc(a.who)}</b>`:plate(a.v)} <span>${a.raw?a.m:esc(a.m)}</span></div></div><button class="btn sm ghost" data-go="${a.go}"${a.ca?' data-ca="anormal"':''} aria-label="Abrir">›</button></li>`;
  const pAlertas=(t,al)=>{const urg=al.filter(a=>a.lvl==='crit').length;
    return panel(t,urg?`<span class="pill p-crit">${urg} ${urg===1?'urgente':'urgentes'}</span>`:'',lista('al',al,alertLi,'Tudo em dia.'))};
  const resLi=r=>{const c=C(r.clienteId),v=V(r.viaturaId);const late=r.estado==='curso'&&r.fim<TODAY;
    return `<li class="${late?'crit':r.estado==='curso'?'info':'warn'}"><span class="sev"></span><div><div class="t">${esc(c?.nome||'—')}</div><div class="m">${plate(v)} ${late?`atrasada desde ${dd(r.fim)}`:r.estado==='curso'?`devolve ${dd(r.fim)}`:`levanta ${dd(r.inicio)}`}</div></div>${r.estado==='curso'?`<button class="btn sm" data-dev="${r.id}">Receber</button>`:`<button class="btn sm" data-ent="${r.id}">Entregar</button>`}</li>`};
  const quando=r=>r.estado==='curso'?r.fim:r.inicio;
  const prox=S.reservas.filter(r=>(r.estado==='reservada'&&days(TODAY,r.inicio)<=7)||r.estado==='curso').sort((a,b)=>quando(a).localeCompare(quando(b)));
  const pEntregas=()=>panel('Entregas e devoluções','<span class="sub">próximos 7 dias</span>',lista('pr',prox,resLi,'Nada agendado.'));
  const rqLi=(r,acao)=>`<li class="${acao==='pagar'?'info':days(r.data,TODAY)>7?'crit':'warn'}"><span class="sev"></span><div><div class="t">${esc(r.numero)} · ${esc(r.posto||'')}</div><div class="m">${plate(V(r.viaturaId))} <span>${acao==='pagar'?`${MT0(rqValor(r))} · verificada a ${dd(r.dataVerif)}`:`${fmt(r.litros)} L · emitida a ${dd(r.data)}`}</span></div></div><button class="btn sm" data-${acao==='pagar'?'rqpag':'rqver'}="${r.id}">${acao==='pagar'?'Pagar':'Verificar'}</button></li>`;
  const fatLi=f=>{const d=days(f.data,TODAY);return `<li class="${d>30?'crit':'warn'}"><span class="sev"></span><div><div class="t">${esc(f.numero)} · ${esc(C(f.clienteId)?.nome||'—')}</div><div class="m">${MT0(fatTot(f))} · emitida há ${d} ${d===1?'dia':'dias'}</div></div><button class="btn sm" data-fat="${f.id}">Abrir</button></li>`};
  const porFatLi=r=>`<li class="warn"><span class="sev"></span><div><div class="t">${esc(C(r.clienteId)?.nome||'—')}</div><div class="m">${plate(V(r.viaturaId))} ${dd(r.inicio)} → ${dd(r.fim)} · ${MT0(resValor(r)+(+r.extras||0))}</div></div><button class="btn sm primary" data-faturar="${r.id}">Faturar</button></li>`;

  const subPag=S.subsidios.filter(x=>x.estado==='pendente').sort((a,b)=>(a.criadoEm||'').localeCompare(b.criadoEm||''));
  if(pf==='contabilista') return `<div class="kpis">
      ${kpi('Por pagar às bombas',MT0(sum(rqPag,rqValor)),`${rqPag.length} ${rqPag.length===1?'requisição verificada':'requisições verificadas'}`)}
      ${kpi('Por receber',MT0(sum(pend,fatTot)),`${pend.length} ${pend.length===1?'fatura pendente':'faturas pendentes'}`)}
      ${kCus}</div>
    <div class="cols">${panel('Requisições por pagar','<span class="sub">mais antigas primeiro</span>',lista('rp',rqPag,r=>rqLi(r,'pagar'),'Nada por pagar.'))}
      <div class="grid">${panel('Faturas por receber','',lista('fr',pend,fatLi,'Tudo recebido.'))}
        ${subPag.length?panel('Subsídios por pagar',`<span class="sub">${MT0(sum(subPag,x=>x.valor))}</span>`,lista('sp',subPag,x=>`<li class="warn"><span class="sev"></span><div><div class="t">${esc(M(x.motoristaId)?.nome||'—')}</div><div class="m">${MT0(x.valor)} · ${esc(x.descricao||'')}</div></div><button class="btn sm" data-subpag="${x.id}">Pagar</button></li>`,'')):''}
        ${porFaturar.length?panel('Alugueres por faturar','',lista('pf',porFaturar,porFatLi,'')):''}</div></div>`;

  if(pf==='operador'){
    const hojeEnt=S.reservas.filter(r=>r.estado==='reservada'&&r.inicio<=TODAY), hojeDev=S.reservas.filter(r=>r.estado==='curso'&&r.fim<=TODAY);
    const hoje=[...hojeDev,...hojeEnt].sort((a,b)=>quando(a).localeCompare(quando(b)));
    const depois=prox.filter(r=>!hoje.includes(r));
    return `<div class="kpis">
      ${kpi('Viaturas livres',`${cnt('disponivel')}<span class="of">/${vs.length}</span>`,`${cnt('alugada')} alugadas · ${cnt('manutencao')} na oficina`)}
      ${kpi('Entregas hoje',hojeEnt.length,hojeEnt.some(r=>r.inicio<TODAY)?'inclui levantamentos atrasados':'clientes a levantar')}
      ${kpi('Devoluções hoje',hojeDev.length,hojeDev.some(r=>r.fim<TODAY)?'<span style="color:var(--crit)">inclui atrasadas</span>':'viaturas a receber')}</div>
    <div class="cols">${panel('Hoje','<span class="sub">entregas e devoluções</span>',lista('hj',hoje,resLi,'Nada para hoje.'))}
      <div class="grid">${panel('Próximos 7 dias','',lista('pr',depois,resLi,'Nada agendado.'))}
        ${porFaturar.length?panel('Alugueres por faturar','',lista('pf',porFaturar,porFatLi,'')):''}</div></div>`;
  }

  if(pf==='gestor'){
    const alF=alerts().filter(a=>['viaturas','manutencao','custos','requisicoes','motoristas'].includes(a.go));
    return `${hojeBar()}<div class="kpis">${kFrota}
      ${kpi('Por verificar',rqVer.length,rqVer.length?'requisições à espera do talão':'requisições em dia')}
      ${kCus}</div>
    <div class="cols">${pAlertas('Frota: precisa de atenção',alF)}
      <div class="grid">${panel('Requisições por verificar','',lista('rv',rqVer,r=>rqLi(r,'verificar'),'Nada por verificar.'))}${pEntregas()}</div></div>`;
  }

  return `${hojeBar()}<div class="kpis">${kFrota}${kFat}${kCus}</div>
  <div class="cols">${pAlertas('Precisa de atenção',alerts())}${pEntregas()}</div>`;
}

/* ---------- ficha da viatura: tudo sobre uma viatura num só ecrã ---------- */
function abrirViatura(id){ view='viaturas'; filters.vid=id; try{history.replaceState(null,'','#viaturas')}catch(e){} render(); window.scrollTo(0,0); }
function viewViatura(v){
  const s=vStats(v), ref=consRef(v), est=ESTADO_V[v.estado]||ESTADO_V.inativa;
  const rs=S.reservas.filter(r=>r.viaturaId===v.id);
  const ativas=rs.filter(r=>['reservada','curso'].includes(r.estado)).sort((a,b)=>a.inicio.localeCompare(b.inicio));
  const ult=rs.filter(r=>r.estado==='concluida').sort((a,b)=>b.fim.localeCompare(a.fim)).slice(0,3);
  const abs=S.abastecimentos.filter(a=>a.viaturaId===v.id).sort((a,b)=>b.data.localeCompare(a.data)||b.km-a.km).slice(0,5);
  const planos=S.planos.filter(p=>p.viaturaId===v.id).map(p=>({p,st:planStatus(p)}));
  const docRow=([k,l])=>{const st=docState(v[k]);return `<tr><td>${esc(l)}</td><td class="nowrap">${dd(v[k])}</td><td>${!v[k]?pill(['Sem data','p-mute']):pill(st==='crit'?['Caducado','p-crit']:st==='warn'?['A caducar','p-warn']:['Em dia','p-ok'])}</td></tr>`};
  const resLi=r=>{const c=C(r.clienteId), late=r.estado==='curso'&&r.fim<TODAY, mo=M(r.motoristaId);
    return `<li class="${late?'crit':r.estado==='curso'?'info':r.estado==='reservada'?'warn':'ok'}"><span class="sev"></span><div><div class="t">${esc(c?.nome||'—')}</div><div class="m">${dd(r.inicio)} → ${dd(r.fim)}${mo?` · com ${esc(mo.nome)}`:''}${late?' · <b>atrasada</b>':''}</div></div>${r.estado==='curso'?`<button class="btn sm" data-dev="${r.id}">Receber</button>`:r.estado==='reservada'?`<button class="btn sm" data-ent="${r.id}">Entregar</button>`:`<small class="muted">${MT0(resValor(r)+(+r.extras||0))}</small>`}</li>`};
  return `<div class="toolbar"><button class="btn" data-vback>← Todas as viaturas</button><span class="grow"></span>
    <button class="btn" data-cons="${v.id}">Gráfico de consumo</button><button class="btn primary" data-edit="viaturas:${v.id}">${pode('viaturas')?'Editar':'Ver dados'}</button></div>
  <section class="panel vhead"><div class="panel-b">${plate(v)}<div class="vname"><b>${esc(vLabel(v))}</b><small>${esc([v.categoria,v.ano,v.combustivel].filter(Boolean).join(' · '))}</small></div>
    <span class="grow"></span><span class="muted">${fmt(v.km)} km · ${MT0(v.tarifa)}/dia</span>${pill(est)}</div>
    ${v.estado==='inativa'?`<div class="panel-b muted" style="border-top:1px solid var(--line)">Inativa desde ${dd(v.dataInativa)} · ${esc(v.motivoInativa||'sem motivo')}${v.obsInativa?` · ${esc(v.obsInativa)}`:''}</div>`:''}</section>
  <div class="kpis">
    <div class="kpi"><label>Custos</label><b>${MT0(s.total)}</b><small>${s.cpk?`${fmt(s.cpk,2)} MT/km · `:''}combustível, oficina e despesas</small></div>
    <div class="kpi"><label>Consumo médio</label><b>${s.cons?fmt(s.cons,1):'—'}<span class="of"> L/100 km</span></b><small>${ref?`referência ${fmt(ref.val,1)}`:'sem referência'}${s.anormais?` · <span style="color:var(--crit)">${s.anormais} anormal</span>`:''}</small></div>
    <div class="kpi"><label>Receita</label><b>${MT0(s.receita)}</b><small>margem <span style="color:${s.receita-s.total>=0?'var(--ok)':'var(--crit)'}">${MT0(s.receita-s.total)}</span></small></div>
  </div>
  <div class="cols">
    <section class="panel"><div class="panel-h"><h2>Reservas</h2><span class="sub">${rs.length} no total</span></div>
      ${ativas.length+ult.length?`<ul class="alerts">${[...ativas,...ult].map(resLi).join('')}</ul>`:'<div class="empty">Sem reservas.</div>'}</section>
    <div class="grid">
      <section class="panel"><div class="panel-h"><h2>Documentos</h2></div><div class="tbl-wrap"><table><tbody>${DOCS.map(docRow).join('')}</tbody></table></div></section>
      <section class="panel"><div class="panel-h"><h2>Manutenção</h2>${pode('manutencao')?`<button class="link" data-go="manutencao">Gerir</button>`:''}</div>
        ${planos.length?`<div class="tbl-wrap"><table><tbody>${planos.map(({p,st})=>`<tr><td><b>${esc(p.tipo)}</b><br><small class="muted">${p.intervaloKm?`aos ${fmt(st.nextKm)} km`:''}${p.intervaloKm&&st.nextDate?' ou ':''}${st.nextDate?`até ${dd(st.nextDate)}`:''}</small></td><td class="act">${pill(st.lvl==='crit'?['Em atraso','p-crit']:st.lvl==='warn'?['Brevemente','p-warn']:['Em dia','p-ok'])}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Sem planos de manutenção.</div>'}</section>
    </div>
  </div>
  <section class="panel" style="margin-top:18px"><div class="panel-h"><h2>Últimos abastecimentos</h2><button class="link" data-cons="${v.id}">Ver todos</button></div>
    ${abs.length?`<div class="tbl-wrap"><table><tbody>${abs.map(a=>{const x=consDesvio(a), c=fillCons(a);return `<tr${x?.anormal?' class="row-crit"':''}><td class="nowrap">${dd(a.data)}</td><td>${esc(a.posto||'')}</td><td class="n">${fmt(a.litros,1)} L</td><td class="n">${MT0(a.litros*a.precoLitro)}</td><td class="n">${c?`${fmt(c.cons,1)} L/100`:'—'}${x?.anormal?` <span class="pill p-crit">+${fmt(x.desvio)}%</span>`:''}</td></tr>`}).join('')}</tbody></table></div>`:'<div class="empty">Sem abastecimentos.</div>'}</section>`;
}

function viewViaturas(){
  const sel=V(filters.vid); if(sel)return viewViatura(sel);
  const q=(filters.vq||'').toLowerCase(), st=filters.vs||'todas';
  const list=S.viaturas.filter(v=>(st==='todas'||v.estado===st)&&(`${v.matricula} ${v.marca} ${v.modelo}`.toLowerCase().includes(q)));
  // Um só indicador para os 3 documentos; as datas ficam na dica e na ficha da viatura.
  const docs=v=>{ const xs=DOCS.filter(([k])=>v[k]).map(([k,l])=>({l,s:docState(v[k]),d:v[k]}));
    const tip=esc(xs.map(x=>`${x.l}: ${dd(x.d)}`).join(' · ')||'Sem datas registadas');
    const bad=xs.filter(x=>x.s==='crit'), w=xs.filter(x=>x.s==='warn');
    const p=!xs.length?['Sem datas','p-mute']:bad.length?[`${bad.map(x=>x.l.split(' ')[0]).join(', ')} caducado`,'p-crit']:w.length?[`${w.map(x=>x.l.split(' ')[0]).join(', ')} a caducar`,'p-warn']:['Em dia','p-ok'];
    return `<span title="${tip}">${pill(p)}</span>`; };
  return `<div class="toolbar"><input class="search" id="vq" type="search" placeholder="Procurar matrícula ou modelo" value="${esc(filters.vq||'')}" aria-label="Procurar viaturas">
    <div class="seg" role="group" aria-label="Filtrar por estado">${[['todas','Todas'],...Object.entries(ESTADO_V).map(([k,[t]])=>[k,t])].map(([k,t])=>`<button data-vs="${k}" aria-pressed="${st===k}">${t}</button>`).join('')}</div>
    <span class="grow"></span><button class="btn primary" data-new="viatura">+ Nova viatura</button></div>
  <section class="panel"><div class="tbl-wrap"><table>
    <thead><tr><th>Viatura</th><th class="n">Km</th><th class="n">Tarifa/dia</th><th>Documentos</th><th>Estado</th></tr></thead>
    <tbody>${list.map(v=>`<tr class="row-link" data-open="vei:${v.id}" tabindex="0" title="Abrir ficha da viatura"><td>${vCell(v)}</td><td class="n">${fmt(v.km)}</td><td class="n">${MT0(v.tarifa)}</td><td>${docs(v)}</td><td>${pill(ESTADO_V[v.estado]||ESTADO_V.inativa)}${v.estado==='inativa'&&v.motivoInativa?`<br><small class="muted">${esc(v.motivoInativa)}</small>`:''}</td></tr>`).join('')}</tbody>
  </table></div>${list.length?'':'<div class="empty">Nenhuma viatura corresponde ao filtro.</div>'}</section>`;
}

function viewCustos(){
  const tab=filters.ct||'abast', vf=filters.cv||'', ca=filters.ca||'todos', P=periodo();
  const inV=x=>(!vf||x.viaturaId===vf)&&inP(x.data,P);
  const abast=S.abastecimentos.filter(inV);
  const consCell=x=>x?`${fmt(x.cons,1)}${x.anormal?` <span class="pill p-crit" title="Referência ${fmt(x.ref,1)} L/100 km">+${fmt(x.desvio)}%</span>`:''}`:'<span class="muted">—</span>';
  let body;
  if(tab==='abast'){
    const list=abast.map(a=>({a,x:consDesvio(a)})).filter(({x})=>ca!=='anormal'||x?.anormal).sort((p,q)=>q.a.data.localeCompare(p.a.data)||q.a.km-p.a.km);
    body=`<thead><tr><th>Data</th><th>Viatura</th><th>Posto</th><th class="n">Litros</th><th class="n">Total</th><th class="n">L/100 km</th></tr></thead><tbody>${list.map(({a,x})=>{const c=fillCons(a);
      const rq=a.requisicaoId&&S.requisicoes.find(y=>y.id===a.requisicaoId);
      return `<tr class="row-link${x?.anormal?' row-crit':''}" data-open="edit:abastecimentos:${a.id}" tabindex="0" title="Abrir abastecimento"><td class="nowrap">${dd(a.data)}</td><td>${plate(V(a.viaturaId))}</td><td>${esc(a.posto||'')}${rq?` <small class="muted mono">${esc(rq.numero)}</small>`:''}</td><td class="n">${fmt(a.litros,1)}</td><td class="n">${MT0(a.litros*a.precoLitro)}</td><td class="n">${consCell(x||(c&&{cons:c.cons}))}</td></tr>`}).join('')}</tbody>`;
    body+=list.length?'':`<tbody><tr><td colspan="6" class="empty">${ca==='anormal'?'Nenhum consumo anormal neste período.':'Sem abastecimentos neste período.'}</td></tr></tbody>`;
  }else{
    const list=S.despesas.filter(inV).sort((a,b)=>b.data.localeCompare(a.data));
    body=`<thead><tr><th>Data</th><th>Viatura</th><th>Categoria</th><th class="n">Valor</th></tr></thead><tbody>${list.map(d=>`<tr class="row-link" data-open="edit:despesas:${d.id}" tabindex="0" title="${esc(d.descricao||'Abrir despesa')}"><td class="nowrap">${dd(d.data)}</td><td>${plate(V(d.viaturaId))}</td><td>${esc(d.categoria)}${d.descricao?` <small class="muted">· ${esc(d.descricao)}</small>`:''}</td><td class="n">${MT(d.valor)}</td></tr>`).join('')}</tbody>`;
    body+=list.length?'':'<tbody><tr><td colspan="4" class="empty">Sem despesas neste período.</td></tr></tbody>';
  }
  const fuelT=sum(abast,a=>a.litros*a.precoLitro), litros=sum(abast,a=>a.litros), despT=sum(S.despesas.filter(inV),d=>d.valor);
  const rows=S.viaturas.filter(v=>!vf||v.id===vf).map(v=>({v,s:vStats(v,P),r:consRef(v)})).filter(x=>x.s.n).sort((a,b)=>b.s.fuel-a.s.fuel);
  const kmT=sum(rows,x=>x.s.kmRun), consT=kmT?sum(rows,x=>x.s.cons*x.s.kmRun/100)/kmT*100:null;
  const anormT=sum(rows,x=>x.s.anormais);
  const resumo=tab==='abast'&&rows.length&&!vf?`<section class="panel" style="margin-bottom:18px"><div class="panel-h"><h2>Por viatura</h2><span class="sub">clique para ver o histórico</span></div><div class="tbl-wrap"><table>
    <thead><tr><th>Viatura</th><th class="n">Litros</th><th class="n">Gasto</th><th class="n">L/100 km</th><th>Consumo</th></tr></thead>
    <tbody>${rows.map(({v,s,r})=>{const dv=s.cons&&r?(s.cons/r.val-1)*100:null;
      const st=dv==null?['—','p-mute']:dv>TOL()?[`+${fmt(dv)}% acima`,'p-crit']:dv>TOL()/2?[`+${fmt(dv)}%`,'p-warn']:['Normal','p-ok'];
      return `<tr class="row-link" data-cons="${v.id}" tabindex="0" title="Ver histórico · referência ${r?fmt(r.val,1)+' L/100 km':'—'}"><td>${vCell(v)}</td><td class="n">${fmt(s.litros,1)}</td><td class="n"><b>${MT0(s.fuel)}</b></td><td class="n">${s.cons?fmt(s.cons,1):'—'}</td><td>${pill(st)}</td></tr>`}).join('')}</tbody></table></div></section>`:'';
  const kpis=tab==='abast'?`<div class="kpi"><label>Combustível</label><b>${MT0(fuelT)}</b><small>${fmt(litros)} litros</small></div>
    <div class="kpi"><label>Consumo médio</label><b>${consT?fmt(consT,1):'—'}<span class="of"> L/100 km</span></b><small>${fmt(kmT)} km</small></div>
    <button class="kpi kpi-btn${ca==='anormal'?' on':''}" data-ca="${ca==='anormal'?'todos':'anormal'}" aria-pressed="${ca==='anormal'}"><label>Consumo anormal</label><b style="color:${anormT?'var(--crit)':'inherit'}">${anormT}</b><small>${ca==='anormal'?'a mostrar só estes · clique para ver todos':anormT?'clique para ver':'nenhum'}</small></button>`
    :`<div class="kpi"><label>Despesas</label><b>${MT0(despT)}</b><small>${S.despesas.filter(inV).length} registos</small></div>`;
  return `<div class="toolbar"><div class="seg" role="group" aria-label="Tipo de registo"><button data-ct="abast" aria-pressed="${tab==='abast'}">Abastecimentos</button><button data-ct="desp" aria-pressed="${tab==='desp'}">Despesas</button></div>
    ${perBar()}<select class="search" id="cv" aria-label="Filtrar por viatura" style="width:auto"><option value="">Todas as viaturas</option>${vOptions(vf)}</select>${vf&&tab==='abast'?`<button class="btn" data-cons="${vf}">Ver gráfico</button>`:''}
    <span class="grow"></span><button class="btn primary" data-new="${tab==='abast'?'abast':'despesa'}">+ ${tab==='abast'?'Abastecimento':'Despesa'}</button></div>
  <div class="kpis">${kpis}</div>
  ${resumo}
  <section class="panel"><div class="tbl-wrap"><table>${body}</table></div></section>`;
}

function viewRequisicoes(){
  const P=periodo(), st=filters.rqs||'todas', vf=filters.rqv||'', q=(filters.rqq||'').toLowerCase();
  const base=S.requisicoes.filter(r=>inP(r.data,P)&&(!vf||r.viaturaId===vf));
  const list=base.filter(r=>(st==='todas'||r.estado===st)&&`${r.numero} ${r.posto||''} ${r.faturaNr||''} ${r.reciboNr||''} ${V(r.viaturaId)?.matricula||''} ${M(r.motoristaId)?.nome||''}`.toLowerCase().includes(q))
    .sort((a,b)=>b.data.localeCompare(a.data)||(b.numero||'').localeCompare(a.numero||''));
  const by=k=>base.filter(r=>r.estado===k);
  // Pendentes de verificar/pagar contam sempre, independentemente do período.
  const pend=S.requisicoes.filter(r=>r.estado==='pendente'&&(!vf||r.viaturaId===vf)), porPag=S.requisicoes.filter(r=>r.estado==='verificada'&&(!vf||r.viaturaId===vf));
  // Só a próxima ação aparece na linha; editar, anular e o detalhe estão na ficha (clique na linha).
  const act=r=>r.estado==='pendente'?`<button class="btn sm primary" data-rqver="${r.id}">Verificar</button>`:r.estado==='verificada'?`<button class="btn sm primary" data-rqpag="${r.id}">Pagar</button>`:'';
  const litCell=r=>{ if(r.litrosReais==null)return fmt(r.litros,1); const d=r.litrosReais-r.litros;
    return `${fmt(r.litrosReais,1)}${d>0?` <span class="pill p-crit" title="Pedido: ${fmt(r.litros,1)} L">+${fmt(d,1)}</span>`:''}`};
  return `<div class="steps" role="group" aria-label="Fluxo da requisição">
    <button class="step" data-new="requisicao"><span class="n">1</span><span class="st"><b>Emitir</b><small>nova requisição</small></span><em>+ Nova</em></button>
    <button class="step${st==='pendente'?' on':''}" data-rqs="${st==='pendente'?'todas':'pendente'}" aria-pressed="${st==='pendente'}"><span class="n">2</span><span class="st"><b>Verificar</b><small>confirmar o talão</small></span><em class="${pend.length?'warn':''}">${pend.length}</em></button>
    <button class="step${st==='verificada'?' on':''}" data-rqs="${st==='verificada'?'todas':'verificada'}" aria-pressed="${st==='verificada'}"><span class="n">3</span><span class="st"><b>Pagar</b><small>${porPag.length?`${MT0(sum(porPag,rqValor))} em dívida`:'fatura e recibo'}</small></span><em class="${porPag.length?'info':''}">${porPag.length}</em></button>
    <button class="step${st==='paga'?' on':''}" data-rqs="${st==='paga'?'todas':'paga'}" aria-pressed="${st==='paga'}"><span class="n">✓</span><span class="st"><b>Pagas</b><small>no período</small></span><em class="ok">${by('paga').length}</em></button>
  </div>
  <div class="toolbar">${perBar()}<input class="search" id="rqq" type="search" placeholder="Nº, posto, fatura, recibo…" value="${esc(filters.rqq||'')}" aria-label="Procurar requisições">
    <select class="search" id="rqv" aria-label="Filtrar por viatura" style="width:auto"><option value="">Todas as viaturas</option>${vOptions(vf)}</select>${st!=='todas'?`<button class="btn ghost" data-rqs="todas">✕ ${esc(ESTADO_RQ[st][0])}</button>`:''}</div>
  <section class="panel"><div class="tbl-wrap"><table>
    <thead><tr><th>Nº</th><th>Data</th><th>Viatura</th><th>Posto</th><th class="n">Litros</th><th class="n">Valor</th><th>Estado</th><th></th></tr></thead>
    <tbody>${list.map(r=>`<tr class="row-link${r.estado==='anulada'?' muted':''}" data-open="rq:${r.id}" tabindex="0" title="Abrir requisição ${esc(r.numero)}"><td class="mono nowrap">${esc(r.numero)}</td><td class="nowrap">${dd(r.data)}</td><td>${plate(V(r.viaturaId))}</td><td>${esc(r.posto||'')}</td>
      <td class="n">${litCell(r)}</td><td class="n">${MT0(r.estado==='paga'?r.valorPago:rqValor(r))}</td>
      <td>${pill(ESTADO_RQ[r.estado]||ESTADO_RQ.pendente)}${r.faturaNr?` <small class="muted mono">${esc(r.faturaNr)}</small>`:''}</td><td class="act">${act(r)}</td></tr>`).join('')}</tbody>
  </table></div>${list.length?'':`<div class="empty">${S.requisicoes.length?'Nenhuma requisição neste filtro ou período. Experimente o período <b>Tudo</b> ou limpe a pesquisa.':'Ainda não há requisições.<br><button class="btn primary" data-new="requisicao" style="margin-top:10px">+ Registar a primeira requisição</button>'}</div>`}</section>`;
}

function viewPostos(){
  const list=S.postos.slice().sort((a,b)=>(a.estado==='inativo')-(b.estado==='inativo')||a.nome.localeCompare(b.nome));
  const ativos=list.filter(p=>p.estado!=='inativo');
  const faixa=k=>{const xs=ativos.map(p=>+p[k]).filter(x=>x>0);return xs.length?{min:Math.min(...xs),max:Math.max(...xs)}:null};
  const fd=faixa('precoDiesel'), fg=faixa('precoGasolina');
  const rq=p=>S.requisicoes.filter(r=>r.postoId===p.id&&r.estado!=='anulada');
  const precoCell=(p,k,f)=>+p[k]>0?`${fmt(p[k],2)}${f&&f.min<f.max&&+p[k]===f.min&&p.estado!=='inativo'?' <span class="pill p-ok" title="Mais barato">↓</span>':''}`:'<span class="muted">—</span>';
  return `<div class="toolbar"><span class="muted">Os preços por litro são usados automaticamente nas requisições.</span><span class="grow"></span><button class="btn primary" data-new="posto">+ Nova bomba</button></div>
  <section class="panel"><div class="tbl-wrap"><table>
    <thead><tr><th>Bomba</th><th class="n">Diesel MT/L</th><th class="n">Gasolina MT/L</th><th>Preço desde</th><th class="n">Por pagar</th></tr></thead>
    <tbody>${list.map(p=>{const rs=rq(p), dv=sum(rs.filter(r=>r.estado==='verificada'),rqValor);return `<tr class="row-link${p.estado==='inativo'?' muted':''}" data-open="edit:postos:${p.id}" tabindex="0" title="Editar bomba e preços"><td><b>${esc(p.nome)}</b>${p.estado==='inativo'?' '+pill(['Inativa','p-mute']):''}<br><small class="muted">${esc(p.localizacao||'')}</small></td>
      <td class="n">${precoCell(p,'precoDiesel',fd)}</td><td class="n">${precoCell(p,'precoGasolina',fg)}</td>
      <td class="nowrap">${dd(p.precoData)}</td><td class="n">${dv?MT0(dv):'<span class="muted">—</span>'}</td></tr>`}).join('')}</tbody>
  </table></div>${list.length?'':'<div class="empty">Ainda não há bombas.<br><button class="btn primary" data-new="posto" style="margin-top:10px">+ Registar a primeira bomba</button></div>'}</section>`;
}

function viewManutencao(){
  const planos=S.planos.map(p=>({p,st:planStatus(p),v:V(p.viaturaId)})).sort((a,b)=>({crit:0,warn:1,ok:2}[a.st.lvl]-{crit:0,warn:1,ok:2}[b.st.lvl])||b.st.used-a.st.used);
  const hist=S.servicos.slice().sort((a,b)=>b.data.localeCompare(a.data));
  return `<div class="toolbar"><span class="grow"></span><button class="btn" data-new="servico">Registar serviço</button><button class="btn primary" data-new="plano">+ Novo plano</button></div>
  <section class="panel" style="margin-bottom:18px"><div class="panel-h"><h2>Planos preventivos</h2><span class="sub">${planos.filter(x=>x.st.lvl!=='ok').length} a precisar de atenção</span></div><div class="tbl-wrap"><table>
    <thead><tr><th>Viatura</th><th>Serviço</th><th style="min-width:130px">Uso do intervalo</th><th>Próximo</th><th>Estado</th><th></th></tr></thead>
    <tbody>${planos.map(({p,st,v})=>`<tr class="row-link" data-open="edit:planos:${p.id}" tabindex="0" title="A cada ${p.intervaloKm?fmt(p.intervaloKm)+' km':''}${p.intervaloKm&&p.intervaloMeses?' ou ':''}${p.intervaloMeses?p.intervaloMeses+' meses':''} · último a ${fmt(p.ultimoKm)} km (${dd(p.ultimaData)})"><td>${plate(v)}</td><td><b>${esc(p.tipo)}</b></td>
      <td><div class="meter ${st.lvl==='ok'?'':st.lvl}"><span style="width:${Math.round(st.used*100)}%"></span></div><small class="muted">${Math.round(st.used*100)}%</small></td>
      <td class="nowrap">${p.intervaloKm?fmt(st.nextKm)+' km':''}<br><small class="muted">${st.nextDate?dd(st.nextDate):''}</small></td>
      <td>${pill(st.lvl==='crit'?['Em atraso','p-crit']:st.lvl==='warn'?['Brevemente','p-warn']:['Em dia','p-ok'])}</td>
      <td class="act"><button class="btn sm" data-srv="${p.id}">Feito</button></td></tr>`).join('')}</tbody></table></div>${planos.length?'':'<div class="empty">Sem planos. Crie um para receber alertas.</div>'}</section>
  <section class="panel"><div class="panel-h"><h2>Histórico de oficina</h2><span class="sub">${MT0(sum(hist,s=>s.custo))} no total</span></div><div class="tbl-wrap"><table>
    <thead><tr><th>Data</th><th>Viatura</th><th>Serviço</th><th class="n">Custo</th></tr></thead>
    <tbody>${hist.map(s=>`<tr class="row-link" data-open="edit:servicos:${s.id}" tabindex="0" title="${fmt(s.km)} km"><td class="nowrap">${dd(s.data)}</td><td>${plate(V(s.viaturaId))}</td><td>${esc(s.tipo)}${s.oficina?` <small class="muted">· ${esc(s.oficina)}</small>`:''}</td><td class="n">${MT(s.custo)}</td></tr>`).join('')}</tbody></table></div>${hist.length?'':'<div class="empty">Sem serviços registados.</div>'}</section>`;
}

/* Reservas separadas pelo que há a fazer:
   ↗ Entregar ao cliente (reservadas, por data de levantamento) e ↙ Receber do cliente (em aluguer, por data de devolução).
   Cada linha diz QUANDO em linguagem simples (Hoje, Amanhã, Atrasada 9 dias, Em 3 dias). O histórico fica à parte. */
function quando(d){ const n=days(TODAY,d);
  if(n<0)return {t:`Atrasada ${-n} ${n===-1?'dia':'dias'}`,lvl:'crit'};
  if(n===0)return {t:'Hoje',lvl:'warn'}; if(n===1)return {t:'Amanhã',lvl:'info'};
  return {t:`Em ${n} dias`,lvl:''}; }
const porEntregar=()=>S.reservas.filter(r=>r.estado==='reservada').sort((a,b)=>a.inicio.localeCompare(b.inicio));
const porReceber=()=>S.reservas.filter(r=>r.estado==='curso').sort((a,b)=>a.fim.localeCompare(b.fim));
function viewReservas(){
  const st=['entregar','receber','historico'].includes(filters.rs)?filters.rs:'tudo';
  const ent=porEntregar(), rec=porReceber();
  const conta=(xs,campo)=>{ const h=xs.filter(r=>r[campo]===TODAY).length, a=xs.filter(r=>r[campo]<TODAY).length;
    return [a?`<span class="atr">${a} ${a===1?'atrasada':'atrasadas'}</span>`:'',h?`${h} hoje`:'',xs.length-a-h?`${xs.length-a-h} ${xs.length-a-h===1?'próxima':'próximas'}`:''].filter(Boolean).join(' · ')||'nenhuma'; };
  const card=(k,cls,ico,t,n,sub)=>`<button class="rs-card ${cls}${st===k?' on':''}" data-rs="${st===k?'tudo':k}" aria-pressed="${st===k}"><span class="ico" aria-hidden="true">${ico}</span><span class="tx"><b>${t}</b><small>${sub}</small></span>${n!=null?`<span class="n">${n}</span>`:''}</button>`;
  const quandoCell=(d,extra)=>{ const q=quando(d); return `<td class="quando ${q.lvl}"><b>${q.t}</b><small>${dd(d)}${extra?` · ${extra}`:''}</small></td>`; };
  const motor=r=>{const mo=M(r.motoristaId);return mo?`<br><small class="muted">com ${esc(mo.nome)}</small>`:''};
  const tEntregar=`<section class="panel rs-sec out"><div class="panel-h"><h2><span aria-hidden="true">↗</span> Entregar ao cliente</h2><span class="sub">${ent.length} ${ent.length===1?'reserva':'reservas'} à espera de levantamento</span></div>
    ${ent.length?`<div class="tbl-wrap"><table><thead><tr><th>Levanta</th><th>Cliente</th><th>Viatura</th><th>Reservada por</th><th></th></tr></thead><tbody>
    ${ent.map(r=>{const q=quando(r.inicio), ex=days(TODAY,expiraEm(r));return `<tr class="row-link lvl-${q.lvl||'ok'}" data-open="res:${r.id}" tabindex="0" title="Abrir reserva">${quandoCell(r.inicio,r.inicio<TODAY?(ex<=1?'<b>expira amanhã</b>':`expira em ${ex} dias`):'')}<td><b>${esc(C(r.clienteId)?.nome||'—')}</b></td><td>${plate(V(r.viaturaId))}${motor(r)}</td><td class="nowrap">${resDias(r)} ${resDias(r)===1?'dia':'dias'}<br><small class="muted">até ${dd(r.fim)}</small></td><td class="act">${q.lvl==='crit'?`<button class="btn sm ghost danger" data-cancel="${r.id}" title="O cliente não veio levantar">Cancelar…</button> `:''}<button class="btn sm ${q.lvl==='crit'||q.lvl==='warn'?'primary':''}" data-ent="${r.id}">Entregar</button></td></tr>`}).join('')}
    </tbody></table></div>`:'<div class="empty">Nenhuma viatura por entregar.</div>'}</section>`;
  const tReceber=`<section class="panel rs-sec in"><div class="panel-h"><h2><span aria-hidden="true">↙</span> Receber do cliente</h2><span class="sub">${rec.length} ${rec.length===1?'viatura':'viaturas'} em aluguer</span></div>
    ${rec.length?`<div class="tbl-wrap"><table><thead><tr><th>Devolve</th><th>Cliente</th><th>Viatura</th><th>Com o cliente desde</th><th class="n">Valor até hoje</th><th></th></tr></thead><tbody>
    ${rec.map(r=>{const q=quando(r.fim), k=resCalc(r), n=Math.max(1,days(resSaida(r),TODAY));return `<tr class="row-link lvl-${q.lvl||'ok'}" data-open="res:${r.id}" tabindex="0" title="Abrir reserva">${quandoCell(r.fim)}<td><b>${esc(C(r.clienteId)?.nome||'—')}</b></td><td>${plate(V(r.viaturaId))}${motor(r)}</td><td class="nowrap">${dd(resSaida(r))}<br><small class="muted">${n} ${n===1?'dia':'dias'} · reservou ${resDias(r)}</small></td><td class="n" title="${esc(k.nota||'')}">${MT0(k.total)}</td><td class="act"><button class="btn sm ${q.lvl==='crit'||q.lvl==='warn'?'primary':''}" data-dev="${r.id}">Receber</button></td></tr>`}).join('')}
    </tbody></table></div>`:'<div class="empty">Nenhuma viatura com clientes.</div>'}</section>`;
  const hist=S.reservas.filter(r=>['concluida','cancelada','expirada'].includes(r.estado)).sort((a,b)=>(b.devolvidoEm||b.fim).localeCompare(a.devolvidoEm||a.fim));
  const tHist=`<section class="panel"><div class="panel-h"><h2>Histórico</h2><span class="sub">devolvidas, canceladas e expiradas</span></div>
    ${hist.length?`<div class="tbl-wrap"><table><thead><tr><th>Cliente</th><th>Viatura</th><th>Entregue → devolvida</th><th class="n">Valor s/ IVA</th><th>Situação</th><th></th></tr></thead><tbody>
    ${hist.map(r=>{const k=resCalc(r), f=r.faturaId&&S.faturas.find(x=>x.id===r.faturaId);
      const act=r.estado==='concluida'?(f?`<button class="btn sm" data-fat="${f.id}">${esc(f.numero)}</button>`:`<button class="btn sm primary" data-faturar="${r.id}">Faturar</button>`):'';
      return `<tr class="row-link" data-open="res:${r.id}" tabindex="0" title="Abrir reserva"><td><b>${esc(C(r.clienteId)?.nome||'—')}</b></td><td>${plate(V(r.viaturaId))}</td>
      <td class="nowrap">${['cancelada','expirada'].includes(r.estado)?`${dd(r.inicio)} → ${dd(r.fim)}`:`${dd(resSaida(r))} → ${dd(r.devolvidoEm||r.fim)}<br><small class="muted">${k.dr} ${k.dr===1?'dia':'dias'}${k.dif?` (${k.dif>0?'+':''}${k.dif} face à reserva)`:''}</small>`}</td>
      <td class="n">${['cancelada','expirada'].includes(r.estado)?'—':MT0(k.total)}</td><td>${pill(resSituacao(r))}${r.estado==='expirada'?'<br><small class="muted">Não levantada</small>':r.estado==='cancelada'&&r.motivoCancel?`<br><small class="muted">${esc(r.motivoCancel)}</small>`:devAntes(r)&&(r.motivoAntecipada||r.cobrarCompleto)?`<br><small class="muted">${r.cobrarCompleto?'Sem justificação · período completo':esc(r.motivoAntecipada)}</small>`:''}</td><td class="act">${act}</td></tr>`}).join('')}
    </tbody></table></div>`:'<div class="empty">Ainda sem histórico.</div>'}</section>`;
  return `<div class="toolbar rs-top">
      ${card('entregar','out','↗','Entregar ao cliente',ent.length,conta(ent,'inicio'))}
      ${card('receber','in','↙','Receber do cliente',rec.length,conta(rec,'fim'))}
      ${card('historico','','≡','Histórico',null,'devolvidas, canceladas e expiradas')}
      <span class="grow"></span><button class="btn primary" data-new="reserva">+ Nova reserva</button></div>
    ${st==='historico'?tHist:st==='entregar'?tEntregar:st==='receber'?tReceber:`<div class="rs-grid">${tEntregar}${tReceber}</div>`}`;
}
// Faixa "Hoje" no Painel: dois atalhos claros, um para cada tarefa.
function hojeBar(){
  if(!veVista('reservas'))return '';
  const ent=S.reservas.filter(r=>r.estado==='reservada'&&r.inicio<=TODAY), rec=S.reservas.filter(r=>r.estado==='curso'&&r.fim<=TODAY);
  if(!ent.length&&!rec.length)return '';
  const atr=(xs,c)=>{const a=xs.filter(r=>r[c]<TODAY).length;return a?` <span class="atr">(${a} ${a===1?'atrasada':'atrasadas'})</span>`:''};
  return `<div class="hoje-bar" role="status"><b>Hoje</b>
    ${ent.length?`<button class="hb out" data-rsgo="entregar">↗ ${ent.length} para <u>entregar</u> ao cliente${atr(ent,'inicio')}</button>`:''}
    ${rec.length?`<button class="hb in" data-rsgo="receber">↙ ${rec.length} para <u>receber</u> do cliente${atr(rec,'fim')}</button>`:''}</div>`;
}

// Linha de contexto de um motorista: onde está agora ou o que vem a seguir.
function mContexto(m,e=mEstado(m)){
  if(e==='inativo')return 'Fora do quadro';
  if(e==='ferias')return `Regressa a ${dd(addDays(m.feriasFim,1))}`;
  const a=mAtual(m); if(a)return `${plate(V(a.viaturaId))} <span>${esc(C(a.clienteId)?.nome||'—')} · até ${dd(a.fim)}</span>`;
  const p=mProx(m); if(p)return `Próximo: ${plate(V(p.viaturaId))} <span>${dd(p.inicio)} → ${dd(p.fim)}</span>`;
  if(m.feriasInicio>TODAY)return `Férias marcadas a partir de ${dd(m.feriasInicio)}`;
  return 'Sem serviço agendado';
}
function viewMotoristas(){
  const sel=M(filters.mid); if(sel)return viewMotorista(sel);
  const all=S.motoristas.map(m=>({m,e:mEstado(m)})).sort((a,b)=>a.m.nome.localeCompare(b.m.nome));
  const by=k=>all.filter(x=>x.e===k);
  const q=(filters.mq||'').toLowerCase(), st=filters.ms||'todos';
  const list=all.filter(x=>(st==='todos'||(st==='ativos'?['disponivel','servico'].includes(x.e):x.e===st))&&`${x.m.nome} ${x.m.telefone||''} ${x.m.carta||''}`.toLowerCase().includes(q));
  const col=(k,lvl,t,vazio)=>{const xs=by(k);return `<section class="panel"><div class="panel-h"><h2>${t}</h2><span class="pill ${ESTADO_M[k][1]}">${xs.length}</span></div>
    ${xs.length?`<ul class="alerts">${xs.map(({m})=>`<li class="${lvl}"><span class="sev"></span><div><div class="t">${esc(m.nome)}</div><div class="m">${mContexto(m,k)}</div></div><button class="btn sm ghost" data-mot="${m.id}" aria-label="Abrir painel de ${esc(m.nome)}">›</button></li>`).join('')}</ul>`:`<div class="empty">${vazio}</div>`}</section>`};
  return `<div class="board">${col('disponivel','ok','Disponíveis','Nenhum motorista livre.')}${col('servico','info','Em serviço','Nenhum motorista em serviço.')}${col('ferias','warn','De férias','Ninguém de férias.')}</div>
  <div class="toolbar"><input class="search" id="mq" type="search" placeholder="Procurar nome, telefone ou carta" value="${esc(filters.mq||'')}" aria-label="Procurar motoristas">
    <div class="seg" role="group" aria-label="Filtrar por situação">${[['todos','Todos'],['ativos','Ativos'],...Object.entries(ESTADO_M).map(([k,[t]])=>[k,t])].map(([k,t])=>`<button data-ms="${k}" aria-pressed="${st===k}">${t}</button>`).join('')}</div>
    <span class="grow"></span><button class="btn primary" data-new="motorista">+ Novo motorista</button></div>
  <section class="panel"><div class="tbl-wrap"><table>
    <thead><tr><th>Motorista</th><th>Agora / a seguir</th><th>Carta válida até</th><th>Situação</th></tr></thead>
    <tbody>${list.map(({m,e})=>{const s=docState(m.cartaValidade);return `<tr class="row-link" data-open="mot:${m.id}" tabindex="0" title="Abrir painel do motorista"><td><b>${esc(m.nome)}</b><br><small class="muted">${esc(m.telefone||'')}</small></td>
      <td><div class="m-ctx">${mContexto(m,e)}</div></td>
      <td class="nowrap"><span class="docdate ${s==='ok'?'':s||''}">${dd(m.cartaValidade)}</span></td><td>${pill(ESTADO_M[e])}</td></tr>`}).join('')}</tbody>
  </table></div>${list.length?'':`<div class="empty">${S.motoristas.length?'Nenhum motorista corresponde ao filtro.':'Ainda não há motoristas. Adicione o primeiro.'}</div>`}</section>`;
}
function viewMotorista(m){
  const e=mEstado(m), s=docState(m.cartaValidade);
  const rs=S.reservas.filter(r=>r.motoristaId===m.id);
  const feitos=rs.filter(r=>r.estado==='concluida');
  const agenda=rs.filter(r=>['curso','reservada'].includes(r.estado)).sort((a,b)=>(a.estado==='curso'?-1:0)-(b.estado==='curso'?-1:0)||a.inicio.localeCompare(b.inicio));
  const hist=rs.filter(r=>['concluida','cancelada'].includes(r.estado)).sort((a,b)=>b.inicio.localeCompare(a.inicio));
  const km=sum(feitos,r=>(+r.kmEntrada||0)-(+r.kmSaida||0));
  const diasServ=sum(rs.filter(r=>['concluida','curso'].includes(r.estado)),resDias);
  const rec=sum(feitos,r=>resCalc(r).dCobrados*resMot(r));
  const subs=S.subsidios.filter(x=>x.motoristaId===m.id&&x.estado!=='anulado').sort((a,b)=>(b.criadoEm||'').localeCompare(a.criadoEm||''));
  const feriasTxt=m.feriasInicio&&m.feriasFim>=TODAY?`${dd(m.feriasInicio)} → ${dd(m.feriasFim)}`:'Sem férias marcadas';
  return `<div class="toolbar"><button class="btn" data-mot="">← Todos os motoristas</button><span class="grow"></span>
    ${e==='inativo'?'':m.feriasInicio&&m.feriasFim>=TODAY?`<button class="btn" data-ferias-fim="${m.id}">Terminar férias</button>`:`<button class="btn" data-ferias="${m.id}">Marcar férias</button>`}
    <button class="btn primary" data-edit="motoristas:${m.id}">Editar dados</button></div>
  <div class="kpis">
    <div class="kpi"><label>Situação</label><b style="font-size:21px">${pill(ESTADO_M[e])}</b><small>${e==='ferias'?`até ${dd(m.feriasFim)}`:e==='servico'?`devolve ${dd(mAtual(m).fim)}`:e==='disponivel'?'pode ser atribuído':'fora do quadro'}</small></div>
    <div class="kpi"><label>Alugueres feitos</label><b>${feitos.length}</b><small>${agenda.length} ${agenda.length===1?'agendado ou em curso':'agendados ou em curso'}</small></div>
    <div class="kpi"><label>Km conduzidos</label><b>${fmt(km)}</b><small>${fmt(diasServ)} dias em serviço</small></div>
    <div class="kpi"><label>Faturado em motorista</label><b>${MT0(rec)}</b><small>sem IVA · alugueres concluídos</small></div>
  </div>
  <div class="cols">
    <section class="panel"><div class="panel-h"><h2>Serviço atual e agendado</h2></div>
      ${agenda.length?`<ul class="alerts">${agenda.map(r=>{const late=r.estado==='curso'&&r.fim<TODAY;return `<li class="${late?'crit':r.estado==='curso'?'info':'warn'}"><span class="sev"></span><div><div class="t">${esc(C(r.clienteId)?.nome||'—')}</div><div class="m">${plate(V(r.viaturaId))} <span>${dd(r.inicio)} → ${dd(r.fim)}${late?' · devolução em atraso':''}</span></div></div>${r.estado==='curso'?`<button class="btn sm" data-dev="${r.id}">Receber</button>`:`<button class="btn sm" data-ent="${r.id}">Entregar</button>`}</li>`}).join('')}</ul>`:'<div class="empty">Sem alugueres atribuídos.</div>'}
    </section>
    <section class="panel"><div class="panel-h"><h2>Dados do motorista</h2></div><div class="tbl-wrap"><table><tbody>
      <tr><td class="muted">Telefone</td><td>${esc(m.telefone||'—')}</td></tr>
      <tr><td class="muted">BI</td><td class="mono">${esc(m.documento||'—')}</td></tr>
      <tr><td class="muted">Carta de condução</td><td><span class="mono">${esc(m.carta||'—')}</span> ${m.cartaCategoria?`· categorias ${esc(m.cartaCategoria)}`:''}</td></tr>
      <tr><td class="muted">Carta válida até</td><td><span class="docdate ${s==='ok'?'':s||''}">${dd(m.cartaValidade)}</span>${s==='crit'?' · caducada':s==='warn'?' · a caducar':''}</td></tr>
      <tr><td class="muted">Tarifa diária</td><td>${MT0(m.tarifa)}</td></tr>
      <tr><td class="muted">Férias</td><td>${feriasTxt}</td></tr>
    </tbody></table></div></section>
  </div>
  <section class="panel" style="margin-top:18px"><div class="panel-h"><h2>Histórico de alugueres</h2><span class="sub">${hist.length} registos</span></div><div class="tbl-wrap"><table>
    <thead><tr><th>Período</th><th>Cliente</th><th>Viatura</th><th class="n">Dias</th><th class="n">Km</th><th class="n">Tarifa motorista</th><th>Estado</th></tr></thead>
    <tbody>${hist.map(r=>`<tr><td class="nowrap">${dd(r.inicio)} → ${dd(r.fim)}</td><td>${esc(C(r.clienteId)?.nome||'—')}</td><td>${plate(V(r.viaturaId))}</td><td class="n">${resDias(r)}</td><td class="n">${r.kmEntrada?fmt(r.kmEntrada-r.kmSaida):'—'}</td><td class="n">${MT0(resMot(r))}/dia</td><td>${pill(ESTADO_R[r.estado])}</td></tr>`).join('')}</tbody>
  </table></div>${hist.length?'':'<div class="empty">Ainda sem alugueres concluídos.</div>'}</section>
  <section class="panel" style="margin-top:18px"><div class="panel-h"><h2>Subsídios</h2><span class="sub">${MT0(sum(subs.filter(x=>x.estado==='pendente'),x=>x.valor))} por pagar · ${MT0(sum(subs.filter(x=>x.estado==='pago'),x=>x.valor))} por confirmar</span></div>
    ${subs.length?`<div class="tbl-wrap"><table><tbody>${subs.slice(0,8).map(x=>`<tr class="row-link" data-open="sub:${x.id}" tabindex="0"><td>${esc(x.descricao||'')}<br><small class="muted">${fmt(x.dias)} × ${MT0(x.valorDia)}</small></td><td class="n"><b>${MT0(x.valor)}</b></td><td>${pill(ESTADO_SUB[x.estado])}${x.dataPag?`<br><small class="muted">pago ${dd(x.dataPag)} · ${esc(x.formaPag||'')}</small>`:''}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Sem subsídios registados.</div>'}</section>`;
}

function viewClientes(){
  const q=(filters.cq||'').toLowerCase();
  const list=S.clientes.filter(c=>`${c.nome} ${c.nuit}`.toLowerCase().includes(q)).sort((a,b)=>a.nome.localeCompare(b.nome));
  return `<div class="toolbar"><input class="search" id="cq" type="search" placeholder="Procurar nome ou NUIT" value="${esc(filters.cq||'')}" aria-label="Procurar clientes"><span class="grow"></span><button class="btn primary" data-new="cliente">+ Novo cliente</button></div>
  <section class="panel"><div class="tbl-wrap"><table><thead><tr><th>Cliente</th><th>NUIT</th><th>Carta válida até</th><th class="n">Alugueres</th><th class="n">Faturado</th></tr></thead>
  <tbody>${list.map(c=>{const s=docState(c.cartaValidade);return `<tr class="row-link" data-open="edit:clientes:${c.id}" tabindex="0" title="Editar cliente"><td><b>${esc(c.nome)}</b><br><small class="muted">${esc(c.telefone||'')}</small></td><td class="mono">${esc(c.nuit||'—')}</td>
    <td>${c.carta?`<span class="docdate ${s==='ok'?'':s}">${dd(c.cartaValidade)}</span>`:'<span class="muted">Empresa</span>'}</td>
    <td class="n">${S.reservas.filter(r=>r.clienteId===c.id).length}</td><td class="n">${MT0(sum(S.faturas.filter(f=>f.clienteId===c.id),fatTot))}</td></tr>`}).join('')}</tbody></table></div>${list.length?'':'<div class="empty">Sem clientes.</div>'}</section>`;
}

function viewFaturas(){
  const list=S.faturas.slice().sort((a,b)=>(b.numero||'').localeCompare(a.numero||''));
  const pend=list.filter(f=>f.estado==='pendente');
  const porFaturar=S.reservas.filter(r=>r.estado==='concluida'&&!r.faturaId);
  return `<div class="kpis">
    <div class="kpi"><label>Por receber</label><b>${MT0(sum(pend,fatTot))}</b><small>${pend.length} ${pend.length===1?'fatura pendente':'faturas pendentes'}</small></div>
    <div class="kpi"><label>Total faturado</label><b>${MT0(sum(list,fatTot))}</b><small>com IVA · dos quais ${MT0(sum(list,fatIva))} de IVA</small></div>
  </div>
  ${porFaturar.length?`<section class="panel" style="margin-bottom:18px"><div class="panel-h"><h2>Alugueres por faturar</h2></div><ul class="alerts">${porFaturar.map(r=>`<li class="warn"><span class="sev"></span><div><div class="t">${esc(C(r.clienteId)?.nome||'—')}</div><div class="m">${plate(V(r.viaturaId))} ${dd(r.inicio)} → ${dd(r.fim)} · ${MT0(resValor(r)+(+r.extras||0))} s/ IVA</div></div><button class="btn sm primary" data-faturar="${r.id}">Emitir fatura</button></li>`).join('')}</ul></section>`:''}
  <section class="panel"><div class="tbl-wrap"><table><thead><tr><th>Número</th><th>Data</th><th>Cliente</th><th class="n">Total c/ IVA</th><th>Estado</th></tr></thead>
  <tbody>${list.map(f=>`<tr class="row-link" data-open="fat:${f.id}" tabindex="0" title="Ver fatura"><td class="mono nowrap">${esc(f.numero)}</td><td class="nowrap">${dd(f.data)}</td><td>${esc(C(f.clienteId)?.nome||'—')}</td><td class="n"><b>${MT(fatTot(f))}</b></td><td>${pill(f.estado==='paga'?['Paga','p-ok']:['Pendente','p-warn'])}</td></tr>`).join('')}</tbody></table></div>${list.length?'':'<div class="empty">Ainda não há faturas. Conclua um aluguer para faturar.</div>'}</section>`;
}

function viewRelatorios(){
  const P=periodo();
  const rows=S.viaturas.map(v=>({v,s:vStats(v,P)}));
  const maxT=Math.max(1,...rows.map(r=>Math.max(r.s.total,r.s.receita)));
  const T=k=>sum(rows,r=>r.s[k]);
  const kmT=T('kmRun');
  return `<div class="toolbar">${perBar()}</div>
  <div class="kpis">
    <div class="kpi"><label>Custo total da frota</label><b>${MT0(T('total'))}</b><small>${esc(P.label)}</small></div>
    <div class="kpi"><label>Custo médio por km</label><b>${kmT?fmt(T('total')/kmT,2):'—'} <span style="font-size:15px">MT/km</span></b><small>${fmt(kmT)} km registados</small></div>
    <div class="kpi"><label>Receita de aluguer</label><b>${MT0(T('receita'))}</b><small>faturada, sem IVA</small></div>
    <div class="kpi"><label>Resultado</label><b style="color:${T('receita')-T('total')>=0?'var(--ok)':'var(--crit)'}">${MT0(T('receita')-T('total'))}</b><small>receita menos custos diretos</small></div>
  </div>
  <section class="panel" style="margin-bottom:18px"><div class="panel-h"><h2>Custos e receita por viatura</h2></div><div class="panel-b">
    <div class="legend"><span><i style="background:var(--accent)"></i>Combustível</span><span><i style="background:var(--amber)"></i>Oficina</span><span><i style="background:var(--crit)"></i>Outras despesas</span><span><i style="background:var(--info)"></i>Receita</span></div>
    <div class="bars">${rows.map(({v,s})=>`<div class="bar-row"><div>${plate(v)}</div><div style="display:grid;gap:3px">
      <div class="bar-track" title="Custos ${MT0(s.total)}"><span style="width:${s.fuel/maxT*100}%;background:var(--accent)"></span><span style="width:${s.serv/maxT*100}%;background:var(--amber)"></span><span style="width:${s.desp/maxT*100}%;background:var(--crit)"></span></div>
      <div class="bar-track" style="height:8px" title="Receita ${MT0(s.receita)}"><span style="width:${s.receita/maxT*100}%;background:var(--info)"></span></div></div>
      <div class="n" style="text-align:right;font-variant-numeric:tabular-nums;font-size:12.5px">${MT0(s.total)}<br><span style="color:var(--info)">${MT0(s.receita)}</span></div></div>`).join('')}</div>
  </div></section>
  <section class="panel"><div class="tbl-wrap"><table><thead><tr><th>Viatura</th><th class="n">Km</th><th class="n">Custo total</th><th class="n">MT/km</th><th class="n">Receita</th><th class="n">Margem</th></tr></thead>
  <tbody>${rows.map(({v,s})=>`<tr title="Combustível ${MT0(s.fuel)} · Oficina ${MT0(s.serv)} · Despesas ${MT0(s.desp)}${s.cons?` · ${fmt(s.cons,1)} L/100 km`:''}"><td>${vCell(v)}</td><td class="n">${fmt(s.kmRun)}</td><td class="n"><b>${MT0(s.total)}</b></td><td class="n">${s.cpk?fmt(s.cpk,2):'—'}</td><td class="n">${MT0(s.receita)}</td><td class="n" style="color:${s.receita-s.total>=0?'var(--ok)':'var(--crit)'}">${MT0(s.receita-s.total)}</td></tr>`).join('')}</tbody></table></div></section>`;
}

function viewDefinicoes(){
  const e=S.config;
  return `<div class="set-grid"><section class="panel"><div class="panel-h"><h2>Dados da empresa</h2><button class="btn sm" id="editEmp">Editar</button></div><div class="panel-b">
    <div class="tbl-wrap"><table><tbody>
      <tr><td class="muted">Nome</td><td><b>${esc(e.nome||'—')}</b></td></tr><tr><td class="muted">NUIT</td><td style="font-family:var(--f-mono)">${esc(e.nuit||'—')}</td></tr>
      <tr><td class="muted">Endereço</td><td>${esc(e.endereco||'—')}</td></tr><tr><td class="muted">Telefone</td><td>${esc(e.telefone||'—')}</td></tr><tr><td class="muted">IVA</td><td>${fmt(IVA(),1)}%</td></tr><tr><td class="muted">Tolerância de consumo</td><td>+${fmt(TOL())}% acima da referência</td></tr><tr><td class="muted">Subsídio do motorista</td><td>${MT0(SUB_DIA(null))} por dia</td></tr><tr><td class="muted">Reserva não levantada</td><td>expira ${PRAZO_EXP()} ${PRAZO_EXP()===1?'dia':'dias'} depois da data de levantamento</td></tr>
    </tbody></table></div></div></section>
    <section class="panel"><div class="panel-h"><h2>Sobre este protótipo</h2></div><div class="panel-b" style="display:grid;gap:8px;max-width:62ch">
      <p style="margin:0">Os dados ${mode==='db'?'ficam guardados na base de dados deste artefacto e são partilhados com quem tiver acesso de edição.':'ficam apenas neste navegador (modo demonstração).'}</p>
      <p style="margin:0" class="muted">As faturas seguem o formato de Moçambique (NUIT do emitente e do cliente, IVA discriminado, numeração sequencial por série anual). Para emissão com validade fiscal, a versão final precisa de certificação junto da Autoridade Tributária.</p>
    </div></section></div>`;
}

/* ---------- pesquisa global (Ctrl+K ou /) ---------- */
// Sem acentos, minúsculas; a matrícula também se compara sem espaços ("agm214" encontra "AGM 214 ZB").
const semAc=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
let bSel=0, bItens=[];
function buscar(q){
  q=semAc(q).trim(); if(!q)return [];
  const qc=q.replace(/\s+/g,'');
  const tem=(...xs)=>{const t=semAc(xs.join(' '));return t.includes(q)||t.replace(/\s+/g,'').includes(qc)};
  const G=[];
  const add=(grp,vista,list)=>{ if(veVista(vista)&&list.length)G.push({grp,list:list.slice(0,5)}); };
  add('Viaturas','viaturas',S.viaturas.filter(v=>tem(v.matricula,v.marca,v.modelo)).map(v=>({t:`${v.matricula} · ${vLabel(v)}`,s:(ESTADO_V[v.estado]||ESTADO_V.inativa)[0],go:()=>abrirViatura(v.id)})));
  add('Clientes','clientes',S.clientes.filter(c=>tem(c.nome,c.nuit,c.telefone)).map(c=>({t:c.nome,s:c.nuit?'NUIT '+c.nuit:'',go:()=>{go('clientes');formCliente(c)}})));
  add('Motoristas','motoristas',S.motoristas.filter(m=>tem(m.nome,m.telefone,m.carta)).map(m=>({t:m.nome,s:ESTADO_M[mEstado(m)][0],go:()=>{view='motoristas';filters.mid=m.id;render()}})));
  add('Requisições','requisicoes',S.requisicoes.filter(r=>tem(r.numero,r.faturaNr,r.reciboNr,r.posto,V(r.viaturaId)?.matricula)).map(r=>({t:`${r.numero} · ${V(r.viaturaId)?.matricula||''}`,s:`${(ESTADO_RQ[r.estado]||[''])[0]} · ${dd(r.data)}`,go:()=>{go('requisicoes');verReq(r)}})));
  add('Faturas','faturas',S.faturas.filter(f=>tem(f.numero,C(f.clienteId)?.nome)).map(f=>({t:`${f.numero} · ${C(f.clienteId)?.nome||''}`,s:MT0(fatTot(f)),go:()=>{go('faturas');verFatura(f.id)}})));
  add('Reservas','reservas',S.reservas.filter(r=>['reservada','curso'].includes(r.estado)&&tem(C(r.clienteId)?.nome,V(r.viaturaId)?.matricula)).map(r=>({t:`${C(r.clienteId)?.nome||'—'} · ${V(r.viaturaId)?.matricula||''}`,s:`${dd(r.inicio)} → ${dd(r.fim)}`,go:()=>go('reservas')})));
  add('Bombas','postos',S.postos.filter(x=>tem(x.nome,x.localizacao)).map(x=>({t:x.nome,s:x.localizacao||'',go:()=>{go('postos');formPosto(x)}})));
  return G;
}
function desenharBusca(){
  const G=buscar($('#bq').value); bItens=G.flatMap(g=>g.list); bSel=Math.min(bSel,Math.max(0,bItens.length-1));
  let i=0;
  $('#bres').innerHTML=!$('#bq').value.trim()?'<li class="none">Escreva para procurar em viaturas, clientes, motoristas, requisições e faturas.</li>'
    :!bItens.length?'<li class="none">Nada encontrado.</li>'
    :G.map(g=>`<li class="grp" role="presentation">${esc(g.grp)}</li>${g.list.map(x=>{const k=i++;return `<li role="presentation"><button role="option" data-bi="${k}" aria-selected="${k===bSel}"><span>${esc(x.t)}</span><small>${esc(x.s)}</small></button></li>`}).join('')}`).join('');
  $('#bres [aria-selected="true"]')?.scrollIntoView({block:'nearest'});
}
function abrirBusca(){ if(!eu())return; closeDrawer(); $('#busca').hidden=false; $('#bq').value=''; bSel=0; desenharBusca(); setTimeout(()=>$('#bq').focus(),10); }
function fecharBusca(){ $('#busca').hidden=true; }
function escolher(k){ const x=bItens[k]; if(!x)return; fecharBusca(); x.go(); }
$('#bq').addEventListener('input',()=>{bSel=0;desenharBusca()});
$('#busca').addEventListener('click',e=>{ if(e.target.closest('[data-bclose]'))return fecharBusca(); const b=e.target.closest('[data-bi]'); if(b)escolher(+b.dataset.bi); });
document.addEventListener('keydown',e=>{
  const aberta=!$('#busca').hidden;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();return aberta?fecharBusca():abrirBusca()}
  if(!aberta&&e.key==='/'&&!e.target.closest('input,textarea,select,[contenteditable]')&&$('#drawer').hidden){e.preventDefault();return abrirBusca()}
  if(!aberta)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();return fecharBusca()}
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();bSel=(bSel+(e.key==='ArrowDown'?1:-1)+bItens.length)%Math.max(1,bItens.length);return desenharBusca()}
  if(e.key==='Enter'){e.preventDefault();return escolher(bSel)}
},true);

/* ---------- render & events ---------- */
const TEMA_ICO={auto:'<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor"/>',claro:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',escuro:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'};
const temaBtn=()=>`<button class="btn ghost icon" data-tema title="Tema: ${TEMAS[tema]} · clique para mudar" aria-label="Tema ${TEMAS[tema]}, mudar"><svg viewBox="0 0 24 24" aria-hidden="true">${TEMA_ICO[tema]}</svg></button>`;
const iniciais=n=>String(n||'?').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
// Ecrã de entrada: protótipo sem palavra-passe, escolhe-se o utilizador para experimentar cada perfil.
function viewEntrar(){
  const us=S.utilizadores.filter(u=>u.estado!=='inativo').sort((a,b)=>Object.keys(PERFIS).indexOf(a.perfil)-Object.keys(PERFIS).indexOf(b.perfil)||a.nome.localeCompare(b.nome));
  return `<div class="login"><section class="panel"><div class="panel-h"><h2>Quem está a usar?</h2></div>
    <ul class="users">${us.map(u=>`<li><button data-login="${u.id}"><span class="avatar">${esc(iniciais(u.nome))}</span><span><b>${esc(u.nome)}</b><small>${esc(PERFIS[u.perfil]?.t||u.perfil)}</small></span><span class="go">›</span></button></li>`).join('')}</ul>
    <div class="panel-b muted" style="font-size:13px">Protótipo sem palavra-passe. Na versão final cada pessoa entra com a sua conta.</div></section></div>`;
}
function render(){
  const me=eu();
  $('#sideUser').innerHTML=me?`<div class="me"><span class="avatar">${esc(iniciais(me.nome))}</span><span><b>${esc(me.nome)}</b><small>${esc(PERFIS[me.perfil]?.t||'')}</small></span>${me.temp?'':'<button class="btn ghost sm" data-logout title="Mudar de utilizador">Sair</button>'}</div>`:'';
  if(!me){ // ninguém com sessão: só o ecrã de entrada
    $('#nav').innerHTML=''; $('#h1').textContent='Entrar'; $('#hsub').textContent=S.config.nome||'FrotaMZ';
    $('#topActions').innerHTML=temaBtn(); $('#demoNote').innerHTML=''; $('#view').innerHTML=viewEntrar(); return;
  }
  if(!veVista(view)){ view='painel'; filters.mid=null; }
  if(!expiracaoFeita&&(mode==='demo'||colsLidas.has('reservas')&&colsLidas.has('config'))){ expiracaoFeita=true; setTimeout(()=>expirarReservas().catch(()=>{}),0); }
  const al=alerts(); const crit=al.filter(a=>a.lvl==='crit').length;
  let g='';
  // Contadores no menu: o que precisa de ação em cada módulo.
  const nPend=S.requisicoes.filter(r=>r.estado==='pendente').length, nPag=S.requisicoes.filter(r=>r.estado==='verificada').length;
  const nRes=S.reservas.filter(r=>(r.estado==='reservada'&&r.inicio<=TODAY)||(r.estado==='curso'&&r.fim<=TODAY)).length;
  // Só conta o que este perfil tem para fazer (verificar e/ou pagar).
  const nReq=(pode('req.verificar')?nPend:0)+(pode('req.pagar')?nPag:0);
  // Subsídios: por pagar (quem paga) e pagos à espera de confirmação (quem confirma).
  const nSub=(pode('sub.pagar')?S.subsidios.filter(x=>x.estado==='pendente').length:0)+(pode('sub.confirmar')?S.subsidios.filter(x=>x.estado==='pago').length:0);
  const badge=k=>k==='subsidios'&&nSub?`<span class="count warn" title="Subsídios para pagar ou confirmar">${nSub}</span>`:k==='painel'&&crit?`<span class="count" title="Alertas urgentes">${crit}</span>`:k==='requisicoes'&&nReq?`<span class="count warn" title="${[pode('req.verificar')&&nPend?nPend+' por verificar':'',pode('req.pagar')&&nPag?nPag+' por pagar':''].filter(Boolean).join(' · ')}">${nReq}</span>`:k==='reservas'&&nRes?`<span class="count" title="Para entregar ou receber hoje (inclui atrasos)">${nRes}</span>`:'';
  $('#nav').innerHTML=Object.entries(VIEWS).filter(([k])=>veVista(k)).map(([k,v])=>{const head=v.g!==g?(g=v.g,`<div class="nav-group">${v.g}</div>`):'';
    return `${head}<button data-view="${k}"${view===k?' aria-current="page"':''}><svg viewBox="0 0 24 24" aria-hidden="true">${v.i}</svg>${v.n||v.t}${badge(k)}</button>`}).join('');
  $('#h1').textContent=VIEWS[view].t;
  const hoje=new Date().toLocaleDateString('pt-PT',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  $('#hsub').textContent=view==='painel'?`Olá, ${String(me.nome).split(' ')[0]} · ${hoje}`:({viaturas:V(filters.vid)?`Ficha da viatura · ${V(filters.vid).matricula}`:`${S.viaturas.length} viaturas registadas`,motoristas:M(filters.mid)?`Painel do motorista · ${M(filters.mid).nome}`:'Disponibilidade, férias e serviço atual',reservas:'Reservas, entregas e devoluções',clientes:`${S.clientes.length} clientes`,faturas:`Série FT ${TODAY.slice(0,4)} · IVA ${fmt(IVA())}%`,custos:'Abastecimentos, portagens, multas e outras despesas',requisicoes:'Pedidos aos postos, verificação e pagamento (fatura e recibo)',postos:'Postos fornecedores e preço por litro',manutencao:'Manutenção preventiva e histórico de oficina',relatorios:'Custo por quilómetro e rentabilidade por viatura',definicoes:'Emitente das faturas',utilizadores:'Quem acede ao FrotaMZ e com que perfil',subsidios:'Pagamento e confirmação dos subsídios dos motoristas',pagamentos:'Tudo o que foi pago e recebido: combustível, subsídios, oficina, despesas e faturas'})[view];
  $('#topActions').innerHTML=`<button class="btn busca-btn" data-busca title="Pesquisar (Ctrl+K)"><span class="lbl">Procurar…</span><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style="stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><kbd>Ctrl K</kbd></button>`+temaBtn()+(me.temp?'':`<button class="btn ghost sm only-m" data-logout title="Mudar de utilizador">${esc(iniciais(me.nome))} · Sair</button>`)+(view==='painel'?`<button class="btn" data-new="reserva">+ Reserva</button><button class="btn" data-new="requisicao">+ Requisição</button>`:'')+`<span class="sync ${mode==='db'?'on':''}" title="${mode==='db'?'Os dados ficam na base de dados partilhada.':'Dados de exemplo; as alterações ficam só neste navegador.'}"><i></i>${mode==='db'?'Guardado na nuvem':mode==='loading'?'A ligar…':'Modo demonstração'}</span>`;
  $('#demoNote').innerHTML=''; // o estado (demonstração / nuvem) já aparece no cabeçalho
  const fn={painel:viewPainel,viaturas:viewViaturas,motoristas:viewMotoristas,custos:viewCustos,requisicoes:viewRequisicoes,postos:viewPostos,manutencao:viewManutencao,reservas:viewReservas,clientes:viewClientes,faturas:viewFaturas,relatorios:viewRelatorios,definicoes:viewDefinicoes,utilizadores:viewUtilizadores,subsidios:viewSubsidios,pagamentos:viewPagamentos}[view];
  const active=document.activeElement; const aid=active&&active.id; const pos=aid&&active.selectionStart;
  $('#view').innerHTML=fn();
  aplicarPerms();
  if(aid&&['vq','cq','mq','rqq'].includes(aid)){const el=document.getElementById(aid);if(el){el.focus();try{el.setSelectionRange(pos,pos)}catch(e){}}}
}
function go(k){ if(!VIEWS[k])return; if(!veVista(k))return toast('O seu perfil não tem acesso a este módulo.'); view=k; filters.mid=null; filters.vid=null; try{history.replaceState(null,'','#'+k)}catch(e){} render(); window.scrollTo(0,0); }

document.addEventListener('click',async e=>{
  const b=e.target.closest('button');
  if(!b){ if(e.target.closest('a,input,select,textarea'))return;
    const tr=e.target.closest('tr[data-cons],tr[data-open],tr[data-pagg]'); if(!tr)return;
    if(tr.dataset.pagg!=null)return verGrupoPag(+tr.dataset.pagg);
    if(tr.dataset.cons)return verConsumo(tr.dataset.cons);
    const [t,a,c]=tr.dataset.open.split(':');
    if(t==='rq'){const r=S.requisicoes.find(x=>x.id===a);return r&&verReq(r)}
    if(t==='fat')return verFatura(a);
    if(t==='sub'){const x=SB(a);return x&&verSub(x)}
    if(t==='vei')return abrirViatura(a);
    if(t==='res'){const r=S.reservas.find(x=>x.id===a);return r&&verReserva(r)}
    if(t==='mot'){view='motoristas';filters.mid=a;render();return window.scrollTo(0,0)}
    if(t==='edit'){const o=S[a]?.find(x=>x.id===c);if(!o)return;return ({viaturas:formViatura,clientes:formCliente,postos:formPosto,utilizadores:formUtilizador,abastecimentos:formAbast,despesas:formDespesa,reservas:formReserva,planos:formPlano,servicos:formServico})[a]?.(o)}
    return }
  const d=b.dataset;
  try{
    if('tema' in d){tema={auto:'claro',claro:'escuro',escuro:'auto'}[tema];lsSet('frotamz-tema',tema==='auto'?null:tema);aplicarTema();toast('Tema: '+TEMAS[tema]+'.');return render()}
    if(d.login){lsSet(SESS_KEY,d.login);view='painel';filters={};render();return toast('Olá, '+(eu()?.nome||'')+'.')}
    if('logout' in d){lsSet(SESS_KEY,null);closeDrawer();return render()}
    // Guardas: mesmo que um botão fique visível por engano, a ação só corre com permissão.
    for(const [k,a] of [['ent','reservas'],['dev','reservas'],['cancel','reservas'],['faturar','fat.emitir'],['rqver','req.verificar'],['rqpag','req.pagar'],['rqanular','req.emitir'],['srv','manutencao'],['ferias','motoristas'],['feriasFim','motoristas'],['abastv','abastecimentos']])
      if(d[k]!==undefined&&!precisa(a))return;
    if(d.new&&!precisa({viatura:'viaturas',motorista:'motoristas',requisicao:'req.emitir',posto:'postos',abast:'abastecimentos',despesa:'despesas',plano:'manutencao',servico:'manutencao',cliente:'clientes',reserva:'reservas',utilizador:'utilizadores'}[d.new]))return;
    if(d.print){const [t,id]=d.print.split(':');
      if(t==='fat'){const f=S.faturas.find(x=>x.id===id);return f&&imprimir(fatHTML(f),nomeFich('Fatura '+f.numero))}
      if(t==='rq'){const r=S.requisicoes.find(x=>x.id===id);return r&&imprimir(reqHTML(r),nomeFich('Requisição '+r.numero))}
      if(t==='sub'){const x=SB(id);return x&&imprimir(subHTML(x),nomeFich(`Recibo subsídio ${M(x.motoristaId)?.nome||''} ${dd(x.dataPag)}`))}
      if(t==='auto'||t==='autodev'){const r=S.reservas.find(x=>x.id===id);if(!r)return;const dev=t==='autodev';return imprimir(autoHTML(r,dev?'dev':'ent'),nomeFich(`Auto de ${dev?'receção':'entrega'} ${V(r.viaturaId)?.matricula||''} ${dd((dev?r.checkDevolucao:r.checkEntrega)?.data)}`))}}
    if(d.rsgo){view='reservas';filters.rs=d.rsgo;filters.mid=null;filters.vid=null;try{history.replaceState(null,'','#reservas')}catch(e){}render();return window.scrollTo(0,0)}
    if('vback' in d){filters.vid=null;return render()}
    if('busca' in d)return abrirBusca();
    if(d.ckall){ const box=document.getElementById('f_'+d.ckall); box?.querySelectorAll('input[value="sim"]').forEach(x=>{x.checked=true}); box?.querySelectorAll('.ck-row').forEach(x=>x.classList.remove('nao')); box?.closest('.fld')?.classList.remove('invalid'); box?.dispatchEvent(new Event('change',{bubbles:true})); return; }
    if(d.reativar){ if(!precisa('reservas'))return; const r=S.reservas.find(x=>x.id===d.reativar); if(!r)return; closeDrawer();
      return formReserva({...r,estado:'reservada',inicio:TODAY,fim:'',expiradaEm:'',motivoExpira:''}); }
    if(d.subpag){ const x=SB(d.subpag); return x&&x.estado==='pendente'&&pagarSub(x); }
    if(d.subconf){ const x=SB(d.subconf); return x&&x.estado==='pago'&&confirmarSub(x); }
    if(d.subanular){ const x=SB(d.subanular); if(!x||x.estado!=='pendente')return; await patch('subsidios',x.id,{estado:'anulado',anuladoMotivo:`Anulado por ${eu()?.nome||''} a ${dd(TODAY)}`}); closeDrawer();
      return toast('Subsídio anulado.',desfazer(()=>patch('subsidios',x.id,{estado:'pendente',anuladoMotivo:''}))); }
    if(d.pag){ filters.pag=d.pag; return render(); }
    if('ss' in d&&b.closest('.steps')){ filters.ss=d.ss; return render(); }
    if(d.openSub){ const x=SB(d.openSub); return x&&verSub(x); }
    if(d.openRes){ const r=S.reservas.find(x=>x.id===d.openRes); return r&&verReserva(r); }
    if(d.antecip){ const r=S.reservas.find(x=>x.id===d.antecip); return r&&formAntecipada(r); }
    if(d.extra){ const r=S.reservas.find(x=>x.id===d.extra); return r&&formDiasExtra(r); }
    if(d.desativar){ if(!precisa('viaturas'))return; const v=V(d.desativar); return v&&formDesativar(v); }
    if(d.more){filters[d.more+'All']=!filters[d.more+'All'];return render()}
    if(d.cons)return verConsumo(d.cons);
    if(d.hall){filters.hAll=d.hall==='1';return verConsumo(filters.hv)}
    if(d.abastv)return formAbast({viaturaId:d.abastv});
    if(d.rqs){filters.rqs=d.rqs;return render()}
    const RQ=id=>S.requisicoes.find(x=>x.id===id);
    if(d.rqver){const r=RQ(d.rqver);return r&&r.estado==='pendente'&&verificarReq(r)}
    if(d.rqpag){const r=RQ(d.rqpag);return r&&r.estado==='verificada'&&pagarReq(r)}
    if(d.rqvi){const r=RQ(d.rqvi);return r&&verReq(r)}
    if(d.resdup){ if(!precisa('reservas'))return; const r=S.reservas.find(x=>x.id===d.resdup); if(!r)return; closeDrawer();
      const vOk=V(r.viaturaId)?.estado!=='inativa';
      return formReserva({clienteId:r.clienteId,viaturaId:vOk?r.viaturaId:undefined,tarifa:vOk?r.tarifa:undefined,caucao:r.caucao,motoristaId:r.motoristaId||'',tarifaMotorista:r.tarifaMotorista,condutores:r.condutores||''}) }
    if(d.rqdup){ if(!precisa('req.emitir'))return; const r=RQ(d.rqdup); return r&&formRequisicao({viaturaId:r.viaturaId,postoId:r.postoId,motoristaId:r.motoristaId||'',litros:r.litros,finalidade:r.finalidade||''}) }
    if(d.rqanular){ const r=RQ(d.rqanular); if(!r)return; const antes=r.estado; await patch('requisicoes',r.id,{estado:'anulada'}); if(!$('#drawer').hidden)closeDrawer();
      return toast(`Requisição ${r.numero} anulada.`,desfazer(()=>patch('requisicoes',r.id,{estado:antes}))) }
    if(d.view)return go(d.view);
    if(d.go&&d.ca){filters.ct='abast';filters.ca=d.ca;filters.per='3m';return go(d.go)}
    if(d.go)return go(d.go);
    if(d.vs){filters.vs=d.vs;return render()}
    if(d.rs){filters.rs=d.rs;return render()}
    if(d.ct){filters.ct=d.ct;return render()}
    if(d.ms){filters.ms=d.ms;return render()}
    if(d.per){filters.per=d.per;return render()}
    if(d.ca){filters.ca=d.ca;return render()}
    if('mot' in d){view='motoristas';filters.mid=d.mot||null;try{history.replaceState(null,'','#motoristas')}catch(e){}render();return window.scrollTo(0,0)}
    if(d.ferias){const m=M(d.ferias);return m&&formFerias(m)}
    if(d.feriasFim){const m=M(d.feriasFim);if(!m)return;
      // Férias já a decorrer terminam ontem; férias futuras são apagadas.
      const antes={feriasInicio:m.feriasInicio,feriasFim:m.feriasFim};
      await patch('motoristas',m.id,m.feriasInicio<=TODAY?{feriasFim:addDays(TODAY,-1)}:{feriasInicio:'',feriasFim:''});return toast('Férias terminadas.',desfazer(()=>patch('motoristas',m.id,antes)))}
    if(d.new)return ({viatura:()=>formViatura(),motorista:()=>formMotorista(),requisicao:()=>formRequisicao(),subsidio:()=>formSubsidio(),utilizador:()=>formUtilizador(),posto:()=>formPosto(),abast:()=>formAbast(),despesa:()=>formDespesa(),plano:()=>formPlano(),servico:()=>formServico(),cliente:()=>formCliente(),reserva:()=>formReserva()})[d.new]();
    if(d.edit){const[col,id]=d.edit.split(':');const o=S[col].find(x=>x.id===id);if(!o)return;
      return ({viaturas:formViatura,motoristas:formMotorista,abastecimentos:formAbast,requisicoes:formRequisicao,postos:formPosto,utilizadores:formUtilizador,subsidios:formSubsidio,despesas:formDespesa,planos:formPlano,servicos:formServico,clientes:formCliente,reservas:formReserva})[col](o);}
    if(d.srv){const p=S.planos.find(x=>x.id===d.srv);return p&&formServico({},p)}
    if(d.ent){const r=S.reservas.find(x=>x.id===d.ent);return r&&entregar(r)}
    if(d.dev){const r=S.reservas.find(x=>x.id===d.dev);return r&&devolver(r)}
    if(d.faturar){const r=S.reservas.find(x=>x.id===d.faturar);if(!r||r.faturaId)return;b.disabled=true;return faturar(r)}
    if(d.fat)return verFatura(d.fat);
    if(d.cancel){ const r=S.reservas.find(x=>x.id===d.cancel); return r&&r.estado==='reservada'&&formCancelar(r); }
    if(b.id==='editEmp')return formEmpresa();
  }catch(err){}
});
document.addEventListener('input',e=>{ if(e.target.id==='vq'){filters.vq=e.target.value;render()} if(e.target.id==='cq'){filters.cq=e.target.value;render()} if(e.target.id==='mq'){filters.mq=e.target.value;render()} if(e.target.id==='rqq'){filters.rqq=e.target.value;render()} });
document.addEventListener('change',e=>{ if(e.target.id==='cv'){filters.cv=e.target.value;render()}
  if(e.target.id==='rqv'){filters.rqv=e.target.value;render()}
  if(e.target.id==='per'){filters.per=e.target.value;render()}
  if(e.target.id==='sm'){filters.sm=e.target.value;render()}
  if(e.target.id==='pDe'||e.target.id==='pAte'){filters[e.target.id]=e.target.value;render()} });

const h=(location.hash||'').slice(1); if(VIEWS[h])view=h;
loadDemo(); mode='loading'; render(); connect();
