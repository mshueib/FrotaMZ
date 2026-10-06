const SAMPLE = window.SAMPLE || {config:{}};
const COLS=['viaturas','motoristas','postos','requisicoes','abastecimentos','despesas','planos','servicos','clientes','reservas','faturas'];
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
  reservas:{t:'Reservas',g:'Rent-a-Car',i:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'},
  clientes:{t:'Clientes',g:'Rent-a-Car',i:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.8c1.6.8 2.6 2.5 3 5.2"/>'},
  faturas:{t:'Faturação',g:'Rent-a-Car',i:'<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/>'},
  custos:{t:'Combustível e custos',n:'Combustível',g:'Custos',i:'<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M6 9h6M14 11h2a2 2 0 0 1 2 2v4a1.5 1.5 0 0 0 3 0V8l-3-3"/>'},
  requisicoes:{t:'Requisições de combustível',n:'Requisições',g:'Custos',i:'<path d="M8 3h8l3 3v15H5V3z"/><path d="M9 3v3h6M9 11h6M9 15h3"/><path d="M16.5 13.5s-1.8 2-1.8 3.2a1.8 1.8 0 0 0 3.6 0c0-1.2-1.8-3.2-1.8-3.2z"/>'},
  postos:{t:'Bombas de combustível',n:'Bombas',g:'Custos',i:'<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M7 7h4v4H7z"/><path d="M14 9h2.5a1.5 1.5 0 0 1 1.5 1.5V16a1.5 1.5 0 0 0 3 0V8.5L18 6"/>'},
  manutencao:{t:'Manutenção',g:'Custos',i:'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>'},
  relatorios:{t:'Relatórios',g:'Análise',i:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'},
  definicoes:{t:'Empresa',g:'Análise',i:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.8 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.8-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.8H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.8-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.8 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.8H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'}
};

/* ---------- data layer ---------- */
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
async function remove(col,id){
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
    db.collection(c).onSnapshot(s=>{ S[c]=s.docs.map(d=>({...d.data(),id:d.id})); scheduleRender(); },
      e=>{ if(e&&e.code!=='revoked') toast('Não foi possível ler '+c+'.'); });
  });
  db.doc('config/empresa').onSnapshot(s=>{ S.config=s.exists?{...s.data()}:{}; scheduleRender(); },()=>{});
}

/* ---------- domain helpers ---------- */
const V=id=>S.viaturas.find(v=>v.id===id);
const C=id=>S.clientes.find(c=>c.id===id);
const M=id=>id?S.motoristas.find(m=>m.id===id):null;
const vLabel=v=>v?`${v.marca} ${v.modelo}`:'Viatura removida';
const plate=v=>v?`<span class="plate"><span>${esc(v.matricula)}</span></span>`:'<span class="muted">—</span>';
const IVA=()=>+(S.config.iva??16);
const ESTADO_V={disponivel:['Disponível','p-ok'],alugada:['Alugada','p-info'],manutencao:['Na oficina','p-warn'],inativa:['Inativa','p-mute']};
const ESTADO_R={reservada:['Reservada','p-mute'],curso:['Em curso','p-info'],concluida:['Concluída','p-ok'],cancelada:['Cancelada','p-mute']};
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
const resDias=r=>Math.max(1,days(r.inicio,r.fim));
const resMot=r=>r.motoristaId?+r.tarifaMotorista||0:0;
const resValor=r=>resDias(r)*((+r.tarifa||0)+resMot(r));
function overlap(r){
  return S.reservas.find(o=>o.id!==r.id&&o.viaturaId===r.viaturaId&&!['cancelada','concluida'].includes(o.estado)&&o.inicio<=r.fim&&r.inicio<=o.fim);
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
    else if(r.estado==='reservada'&&days(TODAY,r.inicio)<=3) out.push({lvl:'info',v,t:'Entrega agendada',m:`${esc(c?.nome||'Cliente')} levanta a ${dd(r.inicio)}`,s:20,go:'reservas',raw:true});
    if(['reservada','curso'].includes(r.estado)&&c&&c.cartaValidade&&c.cartaValidade<r.fim) out.push({lvl:'warn',v,t:'Carta de condução caduca durante o aluguer',m:`${esc(c.nome)} · válida até ${dd(c.cartaValidade)}`,s:5,go:'clientes',raw:true});
    const m=M(r.motoristaId);
    if(r.estado==='reservada'&&m&&emFerias(m,r.inicio,r.fim)) out.push({lvl:'crit',v,t:'Motorista de férias durante o aluguer',m:`${esc(m.nome)} · férias até ${dd(m.feriasFim)}; levantamento a ${dd(r.inicio)}`,s:-40,go:'reservas',raw:true});
  });
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
let toastT; function toast(msg){const t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,3200)}
const vOptions=(sel,filter)=>S.viaturas.filter(filter||(()=>true)).map(v=>`<option value="${esc(v.id)}"${v.id===sel?' selected':''}>${esc(v.matricula)} · ${esc(vLabel(v))}</option>`).join('');
const cOptions=sel=>S.clientes.map(c=>`<option value="${esc(c.id)}"${c.id===sel?' selected':''}>${esc(c.nome)}</option>`).join('');

let drawerSubmit=null;
function openDrawer(title,fields,init,onSubmit,opts={}){
  $('.drawer-p').classList.remove('wide'); $('#dTitle').textContent=title;
  const body=fields.map(f=>{
    if(f.type==='note')return `<div class="form-note">${f.html}</div>`;
    if(f.type==='section')return `<div class="form-sec">${esc(f.label)}</div>`;
    const id='f_'+f.k, v=init[f.k]??f.def??'';
    let input;
    if(f.type==='select') input=`<select id="${id}" name="${f.k}"${f.req?' required':''}>${f.optsHtml??(f.opts||[]).map(o=>{const[val,lab]=Array.isArray(o)?o:[o,o];return `<option value="${esc(val)}"${String(val)===String(v)?' selected':''}>${esc(lab)}</option>`}).join('')}</select>`;
    else if(f.type==='textarea') input=`<textarea id="${id}" name="${f.k}" rows="3">${esc(v)}</textarea>`;
    else input=`<input id="${id}" name="${f.k}" type="${f.type||'text'}" value="${esc(v)}"${f.step?` step="${f.step}"`:''}${f.min!=null?` min="${f.min}"`:''}${f.req?' required':''}${f.ro?' readonly tabindex="-1"':''}${f.ph?` placeholder="${esc(f.ph)}"`:''} autocomplete="off">`;
    return `<div class="fld${f.full?' full':''}"><label for="${id}">${esc(f.label)}${f.req?' *':''}</label>${input}${f.hint!=null?`<span class="hint" id="h_${f.k}">${esc(f.hint)}</span>`:''}</div>`;
  }).join('');
  $('#dBody').innerHTML=`<div class="form"><div class="form-err" id="dErr" role="alert" tabindex="-1" hidden></div>${body}${fields.some(f=>f.req)?'<div class="form-req">* campo obrigatório</div>':''}</div>`;
  $('#dFoot').innerHTML=`${opts.del?'<span class="confirm" id="delWrap"><button type="button" class="btn danger" id="dDel">Apagar</button></span><span style="flex:1"></span>':''}<button type="button" class="btn" data-close>Cancelar</button><button type="submit" class="btn primary" id="dOk">${esc(opts.ok||'Guardar')}</button>`;
  // Mostra o erro no topo e marca os campos em causa; o 1.º campo fica com o foco.
  const fail=(msg,keys=[])=>{ const err=$('#dErr'); err.textContent=msg; err.hidden=false;
    keys.forEach(k=>{const el=document.getElementById('f_'+k); if(el){el.closest('.fld').classList.add('invalid'); el.setAttribute('aria-invalid','true')}});
    const first=keys.length&&document.getElementById('f_'+keys[0]); (first||err).focus?.(); err.scrollIntoView({block:'nearest'}); };
  drawerSubmit=async()=>{
    const out={}; const miss=[];
    $('#dBody').querySelectorAll('.fld.invalid').forEach(x=>x.classList.remove('invalid'));
    fields.forEach(f=>{ if(!f.k||f.type==='note'||f.type==='section')return; const el=document.getElementById('f_'+f.k); let v=el.value.trim();
      if(f.req&&!v)miss.push(f);
      if(f.type==='number')v=v===''?null:+v; out[f.k]=v; });
    if(miss.length)return fail(miss.length===1?`Falta preencher: ${miss[0].label}.`:`Faltam ${miss.length} campos: ${miss.map(f=>f.label).join(', ')}.`,miss.map(f=>f.k));
    const res=opts.validate?opts.validate(out):null;
    if(res)return typeof res==='string'?fail(res):fail(res.msg,[res.k]);
    const ok=$('#dOk'), lab=ok.textContent; ok.disabled=true; ok.textContent='A guardar…';
    try{ await onSubmit(out); closeDrawer(); if(opts.done)toast(opts.done);}catch(e){ ok.disabled=false; ok.textContent=lab; }
  };
  if(opts.del){ $('#dDel').onclick=()=>{ $('#delWrap').innerHTML=`<span class="muted" style="font-size:13px">Apagar de vez?</span><button type="button" class="btn danger sm" id="dDelY">Sim, apagar</button><button type="button" class="btn sm" id="dDelN">Não</button>`;
    $('#dDelN').onclick=()=>openDrawer(title,fields,init,onSubmit,opts);
    $('#dDelY').onclick=async()=>{try{await opts.del();closeDrawer();toast('Registo apagado.')}catch(e){}}; }; }
  $('#dBody').onchange=opts.change?e=>opts.change(e):null; if(opts.change)opts.change(null);
  // Ao corrigir um campo, tira-lhe a marca de erro; os cálculos em direto (opts.change) também correm enquanto se escreve.
  $('#dBody').oninput=e=>{ const fl=e.target.closest('.fld.invalid'); if(fl){fl.classList.remove('invalid');e.target.removeAttribute('aria-invalid')} if(opts.change)opts.change(e); };
  $('#drawer').hidden=false;
  setTimeout(()=>{const f=$('#dBody input:not([readonly]),#dBody select');f&&f.focus()},30);
}
function closeDrawer(){$('#drawer').hidden=true;drawerSubmit=null;$('#dBody').onchange=null;$('#dBody').oninput=null;$('.drawer-p').classList.remove('wide')}
$('#dForm').addEventListener('submit',e=>{e.preventDefault();drawerSubmit&&drawerSubmit()});
$('#drawer').addEventListener('click',e=>{if(e.target.closest('[data-close]'))closeDrawer()});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('#drawer').hidden)return closeDrawer();
  // Linhas clicáveis também abrem com Enter (navegação por teclado).
  if(e.key==='Enter'&&e.target.matches?.('tr[data-open],tr[data-cons]'))e.target.click();
});

/* ---------- forms ---------- */
function formViatura(v={}){
  openDrawer(v.id?'Editar viatura':'Nova viatura',[
    {type:'section',label:'Identificação'},
    {k:'matricula',label:'Matrícula',req:1,ph:'AAA 123 MC'},
    {k:'estado',label:'Estado',type:'select',opts:Object.entries(ESTADO_V).map(([k,[t]])=>[k,t]),def:'disponivel'},
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
  ],v,async o=>{ o.matricula=o.matricula.toUpperCase().replace(/\s+/g,' '); await save('viaturas',{...v,...o}); },
  {done:v.id?'Viatura atualizada.':'Viatura adicionada.',del:v.id?()=>remove('viaturas',v.id):null,
   validate:o=>S.viaturas.some(x=>x.id!==v.id&&x.matricula.replace(/\s/g,'')===o.matricula.toUpperCase().replace(/\s/g,''))?'Já existe uma viatura com esta matrícula.':null});
}
function formAbast(a={}){
  if(!S.viaturas.length)return toast('Adicione primeiro uma viatura.');
  const v0=V(a.viaturaId)||S.viaturas[0];
  openDrawer(a.id?'Editar abastecimento':'Registar abastecimento',[
    {k:'viaturaId',label:'Viatura',type:'select',optsHtml:vOptions(a.viaturaId||v0.id),full:1,req:1},
    {k:'data',label:'Data',type:'date',def:TODAY,req:1},{k:'km',label:'Conta-quilómetros',type:'number',req:1,min:0,hint:'Leitura no momento do abastecimento'},
    {k:'litros',label:'Litros',type:'number',step:'0.01',req:1,min:0},{k:'precoLitro',label:'Preço por litro (MT)',type:'number',step:'0.01',req:1,def:87.97},
    {k:'posto',label:'Posto',full:1},
    ...(a.requisicaoId?[{type:'note',html:`Registado pela verificação da requisição <b>${esc(S.requisicoes.find(x=>x.id===a.requisicaoId)?.numero||'—')}</b>. Se corrigir litros ou preço aqui, a requisição mantém os valores verificados.`}]:[]),
    {type:'note',html:'O consumo médio (L/100 km) é calculado entre abastecimentos de depósito cheio da mesma viatura.'}
  ],a,async o=>{ await save('abastecimentos',{...a,...o}); const v=V(o.viaturaId); if(v&&o.km>(+v.km||0)) await patch('viaturas',v.id,{km:o.km}); },
  {done:'Abastecimento registado.',del:a.id?()=>remove('abastecimentos',a.id):null});
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
    {k:'nome',label:'Nome da bomba',req:1,full:1,ph:'Ex.: Petromoc 24 de Julho'},
    {k:'localizacao',label:'Localização',full:1,ph:'Av. 24 de Julho, Maputo'},
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
  },{done:p.id?'Bomba atualizada.':'Bomba adicionada.',del:p.id&&!usada?()=>remove('postos',p.id):null,
     validate:o=>{ if(o.nuit&&!/^\d{9}$/.test(o.nuit))return 'O NUIT tem 9 dígitos.';
       if(!(o.precoDiesel>0)&&!(o.precoGasolina>0))return 'Indique pelo menos um preço por litro.';
       return S.postos.some(x=>x.id!==p.id&&x.nome.trim().toLowerCase()===o.nome.trim().toLowerCase())?'Já existe uma bomba com este nome.':null; }});
}
function formRequisicao(r={}){
  if(!S.viaturas.length)return toast('Adicione primeiro uma viatura.');
  const ativos=S.postos.filter(p=>p.estado!=='inativo'||p.id===r.postoId).sort((a,b)=>a.nome.localeCompare(b.nome));
  if(!ativos.length)return toast('Registe primeiro uma bomba de combustível com o preço por litro.');
  const v0=V(r.viaturaId)||S.viaturas.find(v=>v.estado!=='inativa')||S.viaturas[0];
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
    {k:'postoId',label:'Bomba de combustível',type:'select',optsHtml:ativos.map(p=>`<option value="${esc(p.id)}"${p.id===r.postoId?' selected':''}>${esc(p.nome)}</option>`).join(''),full:1,req:1},
    {k:'motoristaId',label:'Motorista / requisitante',type:'select',full:1,optsHtml:`<option value="">— Nenhum —</option>`+S.motoristas.filter(m=>m.estado!=='inativo'||m.id===r.motoristaId).map(m=>`<option value="${esc(m.id)}"${m.id===r.motoristaId?' selected':''}>${esc(m.nome)}</option>`).join('')},
    {type:'section',label:'3. Quantidade'},
    {k:'litros',label:'Litros requisitados',type:'number',step:'0.01',min:0,req:1,ph:'0,00'},
    {k:'precoLitro',label:'Preço por litro (MT) · fixo',type:'number',step:'0.01',ro:1,hint:''},
    {type:'note',html:'<div class="sumline" id="rqResumo"></div><div class="muted" style="font-size:12.5px;margin-top:4px">O preço vem da bomba e não pode ser alterado aqui. Para o mudar, edite a bomba em <b>Bombas de combustível</b>.</div>'},
    {k:'finalidade',label:'Finalidade (opcional)',full:1,ph:'Ex.: Serviço de aluguer, deslocação a Xai-Xai'},
  ],r,async o=>{
    const p=PST(o.postoId), v=V(o.viaturaId);
    const rec={...r,...o,numero:normNum(o.numero),posto:p.nome,combustivel:combDe(v),precoLitro:preco(o.viaturaId,o.postoId)};
    await save('requisicoes',r.id?rec:{...rec,estado:'pendente'});
  },{done:r.id?'Requisição atualizada.':'Requisição emitida.',del:r.id&&r.estado==='pendente'?()=>remove('requisicoes',r.id):null,change:upd,
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
    await patch('requisicoes',r.id,{estado:'verificada',dataAbast:o.dataAbast,km:o.km,litrosReais:o.litrosReais,precoReal:o.precoReal,valorReal:+(o.litrosReais*o.precoReal).toFixed(2),obsVerif:o.obsVerif,abastecimentoId:aid,dataVerif:TODAY});
    if(v&&o.km>(+v.km||0)) await patch('viaturas',v.id,{km:o.km});
  },{ok:'Confirmar verificação',done:'Requisição verificada e abastecimento registado.',
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
  ],r,o=>patch('requisicoes',r.id,{...o,estado:'paga'}),{ok:'Confirmar pagamento',done:'Pagamento registado.',
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
      ${row('Valor verificado',`<b>${MT(r.valorReal)}</b> (${MT(r.precoReal)}/L)`)}${r.obsVerif?row('Observações',esc(r.obsVerif)):''}</tbody></table></div></section>`:''}
    ${r.estado==='paga'?`<section class="panel"><div class="panel-h"><h2>Pagamento</h2></div><div class="tbl-wrap"><table><tbody>
      ${row('Fatura nº',`<span class="mono">${esc(r.faturaNr)}</span>`)}${row('Recibo nº',`<span class="mono">${esc(r.reciboNr)}</span>`)}${row('Data',dd(r.dataPag))}
      ${row('Valor pago',`<b>${MT(r.valorPago)}</b>${Math.abs((+r.valorPago||0)-(+r.valorReal||0))>0.009?` <span class="pill p-warn">difere ${MT((+r.valorPago||0)-(+r.valorReal||0))}</span>`:''}`)}${row('Forma',esc(r.formaPag||'—'))}</tbody></table></div></section>`:''}
  </div>`;
  $('#dFoot').innerHTML=`${r.estado==='pendente'?`<button type="button" class="btn primary" data-rqver="${r.id}">Verificar</button><button type="button" class="btn" data-edit="requisicoes:${r.id}">Editar</button><button type="button" class="btn ghost danger" data-rqanular="${r.id}">Anular</button>`:r.estado==='verificada'?`<button type="button" class="btn primary" data-rqpag="${r.id}">Registar pagamento</button>`:''}<span style="flex:1"></span><button type="button" class="btn" data-close>Fechar</button>`;
  drawerSubmit=()=>closeDrawer(); $('#drawer').hidden=false;
}

function formDespesa(d={}){
  if(!S.viaturas.length)return toast('Adicione primeiro uma viatura.');
  openDrawer(d.id?'Editar despesa':'Registar despesa',[
    {k:'viaturaId',label:'Viatura',type:'select',optsHtml:vOptions(d.viaturaId),full:1,req:1},
    {k:'data',label:'Data',type:'date',def:TODAY,req:1},{k:'categoria',label:'Categoria',type:'select',opts:['Portagem','Multa','Lavagem','Pneus','Acidente','Seguro','Parqueamento','Outro'],def:'Portagem'},
    {k:'valor',label:'Valor (MT)',type:'number',step:'0.01',req:1,min:0},{k:'descricao',label:'Descrição',full:1},
  ],d,o=>save('despesas',{...d,...o}),{done:'Despesa registada.',del:d.id?()=>remove('despesas',d.id):null});
}
function formPlano(p={}){
  if(!S.viaturas.length)return toast('Adicione primeiro uma viatura.');
  openDrawer(p.id?'Editar plano de manutenção':'Novo plano de manutenção',[
    {k:'viaturaId',label:'Viatura',type:'select',optsHtml:vOptions(p.viaturaId),full:1,req:1},
    {k:'tipo',label:'Serviço',req:1,full:1,ph:'Ex.: Óleo e filtros'},
    {k:'intervaloKm',label:'Repetir a cada (km)',type:'number',min:0,def:10000},{k:'intervaloMeses',label:'ou a cada (meses)',type:'number',min:0,def:6},
    {k:'ultimoKm',label:'Último serviço (km)',type:'number',min:0,req:1},{k:'ultimaData',label:'Último serviço (data)',type:'date',req:1},
    {type:'note',html:'O alerta dispara no que chegar primeiro: quilómetros ou tempo. Aviso a 1 500 km ou 30 dias do prazo.'}
  ],p,o=>save('planos',{...p,...o}),{done:'Plano guardado.',del:p.id?()=>remove('planos',p.id):null});
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
  {done:'Serviço registado.',del:s.id?()=>remove('servicos',s.id):null});
}
function formCliente(c={}){
  openDrawer(c.id?'Editar cliente':'Novo cliente',[
    {k:'nome',label:'Nome ou firma',req:1,full:1},{k:'nuit',label:'NUIT',hint:'9 dígitos',ph:'100000000'},{k:'telefone',label:'Telefone',ph:'+258 84 000 0000'},
    {k:'documento',label:'Documento de identificação',full:1,ph:'BI, passaporte ou alvará'},
    {k:'carta',label:'Carta de condução nº'},{k:'cartaValidade',label:'Carta válida até',type:'date'},
  ],c,o=>save('clientes',{...c,...o}),{done:'Cliente guardado.',del:c.id?()=>remove('clientes',c.id):null,
   validate:o=>o.nuit&&!/^\d{9}$/.test(o.nuit)?'O NUIT tem 9 dígitos.':null});
}
const mOptions=sel=>`<option value="">Sem motorista (o cliente conduz)</option>`+S.motoristas.filter(m=>m.estado!=='inativo'||m.id===sel).sort((a,b)=>a.nome.localeCompare(b.nome))
  .map(m=>{const e=mEstado(m);return `<option value="${esc(m.id)}"${m.id===sel?' selected':''}>${esc(m.nome)}${e==='disponivel'?'':` (${ESTADO_M[e][0].toLowerCase()})`}</option>`}).join('');
function formReserva(r={}){
  if(!S.viaturas.length||!S.clientes.length)return toast('Precisa de pelo menos uma viatura e um cliente.');
  const v0=V(r.viaturaId)||S.viaturas.find(v=>v.estado==='disponivel')||S.viaturas[0];
  openDrawer(r.id?'Editar reserva':'Nova reserva',[
    {type:'section',label:'Cliente e viatura'},
    {k:'clienteId',label:'Cliente',type:'select',optsHtml:cOptions(r.clienteId),full:1,req:1},
    {k:'viaturaId',label:'Viatura',type:'select',optsHtml:vOptions(r.viaturaId||v0.id,v=>v.estado!=='inativa'),full:1,req:1},
    {type:'section',label:'Período e preço'},
    {k:'inicio',label:'Levantamento',type:'date',def:TODAY,req:1},{k:'fim',label:'Devolução',type:'date',req:1},
    {k:'tarifa',label:'Tarifa diária (MT)',type:'number',step:'0.01',def:v0.tarifa,hint:'Deixe vazio para usar a tarifa da viatura'},{k:'caucao',label:'Caução (MT)',type:'number',step:'0.01',def:0},
    {type:'section',label:'Motorista'},
    {k:'motoristaId',label:'Motorista da empresa',type:'select',optsHtml:mOptions(r.motoristaId)},
    {k:'tarifaMotorista',label:'Tarifa do motorista (MT/dia)',type:'number',step:'0.01',min:0,hint:'Vazio = tarifa do motorista'},
    {k:'condutores',label:'Condutores autorizados',full:1,ph:'Separe por ponto e vírgula',hint:'Pessoas do cliente autorizadas a conduzir, se não houver motorista'},
  ],r,async o=>{ if(o.tarifa==null)o.tarifa=V(o.viaturaId)?.tarifa||0;
    if(!o.motoristaId)o.tarifaMotorista=null; else if(o.tarifaMotorista==null)o.tarifaMotorista=+M(o.motoristaId)?.tarifa||0;
    await save('reservas',{estado:'reservada',...r,...o}); },
  {done:r.id?'Reserva atualizada.':'Reserva criada.',del:r.id&&!r.faturaId?()=>remove('reservas',r.id):null,
   validate:o=>{ if(o.fim<o.inicio)return 'A devolução tem de ser depois do levantamento.';
     const c=overlap({...r,...o}); if(c){const cl=C(c.clienteId);return `A viatura já está reservada de ${dd(c.inicio)} a ${dd(c.fim)} (${cl?.nome||'outro cliente'}).`}
     const mc=mConflito({...r,...o}); if(mc)return mc;
     const cli=C(o.clienteId); if(!o.motoristaId&&cli?.cartaValidade&&cli.cartaValidade<o.fim)return `A carta de condução de ${cli.nome} caduca a ${dd(cli.cartaValidade)}, antes da devolução.`;
     return null; }});
}
function formMotorista(m={}){
  const ativas=S.reservas.some(r=>r.motoristaId===m.id&&['reservada','curso'].includes(r.estado));
  openDrawer(m.id?'Editar motorista':'Novo motorista',[
    {type:'section',label:'Dados pessoais'},
    {k:'nome',label:'Nome completo',req:1,full:1},
    {k:'telefone',label:'Telefone',ph:'+258 84 000 0000'},{k:'documento',label:'BI nº',ph:'110100000000A'},
    {type:'section',label:'Carta e tarifa'},
    {k:'carta',label:'Carta de condução nº',req:1},{k:'cartaCategoria',label:'Categorias',ph:'B, C1'},
    {k:'cartaValidade',label:'Carta válida até',type:'date',req:1},{k:'tarifa',label:'Tarifa diária (MT)',type:'number',step:'0.01',min:0,def:1500,hint:'Cobrada no aluguer com motorista'},
    {type:'section',label:'Situação e férias'},
    {k:'estado',label:'Situação',type:'select',opts:[['ativo','Ativo no quadro'],['inativo','Inativo (saiu da empresa)']],def:'ativo',full:1},
    {k:'feriasInicio',label:'Férias de',type:'date'},{k:'feriasFim',label:'Férias até',type:'date'},
    {type:'note',html:'Durante as férias o motorista aparece como <b>De férias</b> e não pode ser atribuído a alugueres.'}
  ],m,o=>save('motoristas',{...m,...o}),{done:m.id?'Motorista atualizado.':'Motorista adicionado.',
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
  ],m,o=>patch('motoristas',m.id,o),{ok:'Marcar férias',done:'Férias registadas.',validate:o=>feriasErro(m,o.feriasInicio,o.feriasFim)});
}
async function entregar(r){
  const v=V(r.viaturaId);
  if(v&&v.estado==='manutencao')return toast('A viatura está na oficina. Mude o estado antes de entregar.');
  const mc=mConflito(r); if(mc)return toast(mc+' Edite a reserva antes de entregar.');
  await patch('reservas',r.id,{estado:'curso',kmSaida:v?.km||0});
  if(v) await patch('viaturas',v.id,{estado:'alugada'});
  toast('Viatura entregue ao cliente.');
}
function devolver(r){
  const v=V(r.viaturaId);
  openDrawer('Registar devolução',[
    {type:'note',html:`${esc(vLabel(v))} · saiu com <b>${fmt(r.kmSaida)} km</b> a ${dd(r.inicio)}.`},
    {k:'fim',label:'Data de devolução',type:'date',def:TODAY,req:1},{k:'kmEntrada',label:'Quilometragem na entrega',type:'number',req:1,min:r.kmSaida||0},
    {k:'extras',label:'Encargos extra (MT)',type:'number',step:'0.01',def:0,hint:'Combustível em falta, limpeza, danos'},{k:'extrasDesc',label:'Descrição dos encargos'},
  ],{fim:TODAY},async o=>{
    await patch('reservas',r.id,{estado:'concluida',fim:o.fim<r.inicio?r.inicio:o.fim,kmEntrada:o.kmEntrada,extras:o.extras||0,extrasDesc:o.extrasDesc||''});
    if(v) await patch('viaturas',v.id,{estado:'disponivel',km:Math.max(+v.km||0,o.kmEntrada)});
  },{ok:'Concluir aluguer',done:'Devolução registada. Já pode faturar.',validate:o=>o.kmEntrada<(r.kmSaida||0)?'A quilometragem não pode ser inferior à de saída.':null});
}
async function faturar(r){
  const v=V(r.viaturaId); const ano=TODAY.slice(0,4);
  const nums=S.faturas.map(f=>f.numero||'').filter(n=>n.includes(ano+'/')).map(n=>+n.split('/')[1]||0);
  const numero=`FT ${ano}/${pad((nums.length?Math.max(...nums):0)+1,4)}`;
  const linhas=[{desc:`Aluguer ${vLabel(v)} (${v?.matricula||''}), ${ddShort(r.inicio)} a ${ddShort(r.fim)}`,qtd:resDias(r),preco:+r.tarifa||0}];
  const m=M(r.motoristaId); if(resMot(r)>0)linhas.push({desc:`Serviço de motorista${m?` (${m.nome})`:''}`,qtd:resDias(r),preco:resMot(r)});
  if(+r.extras>0)linhas.push({desc:r.extrasDesc||'Encargos adicionais',qtd:1,preco:+r.extras});
  const id=uid();
  await save('faturas',{id,numero,data:TODAY,clienteId:r.clienteId,reservaId:r.id,viaturaId:r.viaturaId,iva:IVA(),estado:'pendente',linhas});
  await patch('reservas',r.id,{faturaId:id});
  toast(`Fatura ${numero} emitida.`); verFatura(id);
}
function verFatura(id){
  const f=S.faturas.find(x=>x.id===id); if(!f)return;
  const c=C(f.clienteId)||{}; const e=S.config;
  $('.drawer-p').classList.remove('wide'); $('#dTitle').textContent=f.numero;
  $('#dBody').innerHTML=`<div class="inv">
    <div class="row"><div><h4>${esc(e.nome||'A sua empresa')}</h4><div>${esc(e.endereco||'')}</div><div>NUIT <span class="mono">${esc(e.nuit||'—')}</span> · ${esc(e.telefone||'')}</div></div>
    <div style="text-align:right"><div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#666">Fatura</div><div class="mono" style="font-size:17px">${esc(f.numero)}</div><div>Data: ${dd(f.data)}</div><div>Moeda: MZN</div></div></div>
    <div style="margin:18px 0 12px;padding:10px 12px;background:#efefe9;border-radius:4px"><div style="font-size:11.5px;color:#666;text-transform:uppercase;letter-spacing:.07em">Cliente</div><b>${esc(c.nome||'—')}</b><div>NUIT <span class="mono">${esc(c.nuit||'Consumidor final')}</span></div></div>
    <div class="tbl-wrap"><table><thead><tr><th>Descrição</th><th class="n">Qtd.</th><th class="n">Preço unit.</th><th class="n">Valor</th></tr></thead><tbody>
    ${(f.linhas||[]).map(l=>`<tr><td>${esc(l.desc)}</td><td class="n">${fmt(l.qtd)}</td><td class="n">${MT(l.preco)}</td><td class="n">${MT(l.qtd*l.preco)}</td></tr>`).join('')}
    </tbody></table></div>
    <div class="tot"><div><span>Subtotal</span><span>${MT(fatSub(f))}</span></div><div><span>IVA ${fmt(f.iva)}%</span><span>${MT(fatIva(f))}</span></div><div class="g"><span>Total</span><span>${MT(fatTot(f))}</span></div></div>
    <div class="legal">Documento gerado por protótipo. Para uso fiscal, a numeração e emissão têm de passar por um programa de faturação autorizado pela Autoridade Tributária de Moçambique.</div>
  </div>`;
  $('#dFoot').innerHTML=`${f.estado==='paga'?'<span class="pill p-ok">Paga</span>':`<button type="button" class="btn" id="fPaga">Marcar como paga</button>`}<span style="flex:1"></span><button type="button" class="btn primary" data-close>Fechar</button>`;
  const b=$('#fPaga'); if(b)b.onclick=async()=>{await patch('faturas',f.id,{estado:'paga'});toast('Fatura marcada como paga.');verFatura(f.id)};
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
function formEmpresa(){
  openDrawer('Dados da empresa',[
    {k:'nome',label:'Nome da empresa',req:1,full:1},{k:'nuit',label:'NUIT',req:1},{k:'telefone',label:'Telefone'},
    {k:'endereco',label:'Endereço',full:1},{k:'iva',label:'Taxa de IVA (%)',type:'number',step:'0.1',def:16,hint:'Taxa geral em Moçambique: 16%'},
    {k:'toleranciaConsumo',label:'Tolerância de consumo (%)',type:'number',min:0,step:'1',def:20,hint:'Acima da referência conta como consumo anormal'},
  ],S.config,o=>saveConfig({...S.config,...o}),{done:'Dados da empresa guardados.',validate:o=>/^\d{9}$/.test(o.nuit)?null:'O NUIT tem 9 dígitos.'});
}

/* ---------- views ---------- */
function vCell(v){return `<div style="display:flex;gap:10px;align-items:center">${plate(v)}<div class="vname"><b>${esc(vLabel(v))}</b></div></div>`}

function viewPainel(){
  const vs=S.viaturas.filter(v=>v.estado!=='inativa'); const n=vs.length||1;
  const cnt=k=>vs.filter(v=>v.estado===k).length;
  const mes=TODAY.slice(0,7);
  const recMes=sum(S.faturas.filter(f=>(f.data||'').startsWith(mes)),fatSub);
  const custoMes=sum(S.abastecimentos.filter(a=>(a.data||'').startsWith(mes)),a=>a.litros*a.precoLitro)+sum(S.despesas.filter(d=>(d.data||'').startsWith(mes)),d=>d.valor)+sum(S.servicos.filter(s=>(s.data||'').startsWith(mes)),s=>s.custo);
  const pend=S.faturas.filter(f=>f.estado==='pendente');
  const al=alerts();
  const prox=S.reservas.filter(r=>(r.estado==='reservada'&&days(TODAY,r.inicio)<=7)||(r.estado==='curso')).sort((a,b)=>(a.estado==='curso'?a.fim:a.inicio).localeCompare(b.estado==='curso'?b.fim:b.inicio));
  // Listas curtas: mostra os primeiros N e um botão para ver o resto.
  const LIM=5, alAll=!!filters.alAll, prAll=!!filters.prAll;
  const mais=(n,k,on)=>n>LIM?`<button class="more" data-more="${k}">${on?'Mostrar menos':`Ver mais ${n-LIM}`}</button>`:'';
  const urg=al.filter(a=>a.lvl==='crit').length;
  return `<div class="kpis">
    <div class="kpi"><label>Frota</label><b>${cnt('alugada')}<span class="of">/${vs.length}</span></b><small>alugadas hoje · ${cnt('disponivel')} livres</small>
      <div class="fleetbar" aria-hidden="true"><span style="width:${cnt('disponivel')/n*100}%;background:var(--ok)"></span><span style="width:${cnt('alugada')/n*100}%;background:var(--info)"></span><span style="width:${cnt('manutencao')/n*100}%;background:var(--amber)"></span></div></div>
    <div class="kpi"><label>Faturado este mês</label><b>${MT0(recMes)}</b><small>${pend.length?`${MT0(sum(pend,fatTot))} por receber`:'tudo recebido'}</small></div>
    <div class="kpi"><label>Custos este mês</label><b>${MT0(custoMes)}</b><small>combustível, oficina e despesas</small></div>
  </div>
  <div class="cols">
    <section class="panel"><div class="panel-h"><h2>Precisa de atenção</h2>${urg?`<span class="pill p-crit">${urg} ${urg===1?'urgente':'urgentes'}</span>`:''}</div>
      ${al.length?`<ul class="alerts">${(alAll?al:al.slice(0,LIM)).map(a=>`<li class="${a.lvl}"><span class="sev"></span><div><div class="t">${esc(a.t)}</div><div class="m">${a.who?`<b>${esc(a.who)}</b>`:plate(a.v)} <span>${a.raw?a.m:esc(a.m)}</span></div></div><button class="btn sm ghost" data-go="${a.go}"${a.ca?' data-ca="anormal"':''} aria-label="Abrir">›</button></li>`).join('')}</ul>${mais(al.length,'al',alAll)}`:'<div class="empty">Tudo em dia.</div>'}
    </section>
    <section class="panel"><div class="panel-h"><h2>Entregas e devoluções</h2><span class="sub">próximos 7 dias</span></div>
      ${prox.length?`<ul class="alerts">${(prAll?prox:prox.slice(0,LIM)).map(r=>{const c=C(r.clienteId),v=V(r.viaturaId);const late=r.estado==='curso'&&r.fim<TODAY;return `<li class="${late?'crit':r.estado==='curso'?'info':'warn'}"><span class="sev"></span><div><div class="t">${esc(c?.nome||'—')}</div><div class="m">${plate(v)} ${late?`atrasada desde ${dd(r.fim)}`:r.estado==='curso'?`devolve ${dd(r.fim)}`:`levanta ${dd(r.inicio)}`}</div></div>${r.estado==='curso'?`<button class="btn sm" data-dev="${r.id}">Devolver</button>`:`<button class="btn sm" data-ent="${r.id}">Entregar</button>`}</li>`}).join('')}</ul>${mais(prox.length,'pr',prAll)}`:'<div class="empty">Nada agendado.</div>'}
    </section>
  </div>`;
}

function viewViaturas(){
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
    <tbody>${list.map(v=>`<tr class="row-link" data-open="edit:viaturas:${v.id}" tabindex="0" title="Abrir viatura"><td>${vCell(v)}</td><td class="n">${fmt(v.km)}</td><td class="n">${MT0(v.tarifa)}</td><td>${docs(v)}</td><td>${pill(ESTADO_V[v.estado]||ESTADO_V.inativa)}</td></tr>`).join('')}</tbody>
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

function viewReservas(){
  const st=filters.rs||'ativas';
  const list=S.reservas.filter(r=>st==='todas'||(st==='ativas'?['reservada','curso'].includes(r.estado):r.estado===st))
    .sort((a,b)=>(a.estado==='concluida')-(b.estado==='concluida')||a.inicio.localeCompare(b.inicio));
  return `<div class="toolbar"><div class="seg" role="group" aria-label="Filtrar reservas">${[['ativas','Ativas'],['concluida','Concluídas'],['cancelada','Canceladas'],['todas','Todas']].map(([k,t])=>`<button data-rs="${k}" aria-pressed="${st===k}">${t}</button>`).join('')}</div><span class="grow"></span><button class="btn primary" data-new="reserva">+ Nova reserva</button></div>
  <section class="panel"><div class="tbl-wrap"><table>
    <thead><tr><th>Cliente</th><th>Viatura</th><th>Período</th><th class="n">Valor s/ IVA</th><th>Estado</th><th></th></tr></thead>
    <tbody>${list.map(r=>{const c=C(r.clienteId),v=V(r.viaturaId);const late=r.estado==='curso'&&r.fim<TODAY;
      const f=r.faturaId&&S.faturas.find(x=>x.id===r.faturaId);
      let act='';
      if(r.estado==='reservada')act=`<button class="btn sm primary" data-ent="${r.id}">Entregar</button> <button class="btn sm ghost danger" data-cancel="${r.id}">Cancelar</button>`;
      else if(r.estado==='curso')act=`<button class="btn sm primary" data-dev="${r.id}">Devolver</button>`;
      else if(r.estado==='concluida')act=f?`<button class="btn sm" data-fat="${f.id}">${esc(f.numero)}</button>`:`<button class="btn sm primary" data-faturar="${r.id}">Faturar</button>`;
      const mo=M(r.motoristaId);
      return `<tr${r.estado==='reservada'?` class="row-link" data-open="edit:reservas:${r.id}" tabindex="0" title="Editar reserva"`:''}><td><b>${esc(c?.nome||'—')}</b></td><td>${plate(v)}${mo?`<br><small class="muted">com ${esc(mo.nome)}</small>`:''}</td><td class="nowrap">${dd(r.inicio)} → ${dd(r.fim)}<br><small class="muted">${resDias(r)} ${resDias(r)===1?'dia':'dias'}</small></td><td class="n">${MT0(resValor(r)+(+r.extras||0))}</td>
      <td>${late?pill(['Atrasada','p-crit']):pill(ESTADO_R[r.estado]||ESTADO_R.reservada)}</td><td class="act">${act}</td></tr>`}).join('')}</tbody>
  </table></div>${list.length?'':'<div class="empty">Sem reservas neste filtro.</div>'}</section>`;
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
  const rec=sum(feitos,r=>resDias(r)*resMot(r));
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
      ${agenda.length?`<ul class="alerts">${agenda.map(r=>{const late=r.estado==='curso'&&r.fim<TODAY;return `<li class="${late?'crit':r.estado==='curso'?'info':'warn'}"><span class="sev"></span><div><div class="t">${esc(C(r.clienteId)?.nome||'—')}</div><div class="m">${plate(V(r.viaturaId))} <span>${dd(r.inicio)} → ${dd(r.fim)}${late?' · devolução em atraso':''}</span></div></div>${r.estado==='curso'?`<button class="btn sm" data-dev="${r.id}">Devolver</button>`:`<button class="btn sm" data-ent="${r.id}">Entregar</button>`}</li>`}).join('')}</ul>`:'<div class="empty">Sem alugueres atribuídos.</div>'}
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
  </table></div>${hist.length?'':'<div class="empty">Ainda sem alugueres concluídos.</div>'}</section>`;
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
      <tr><td class="muted">Endereço</td><td>${esc(e.endereco||'—')}</td></tr><tr><td class="muted">Telefone</td><td>${esc(e.telefone||'—')}</td></tr><tr><td class="muted">IVA</td><td>${fmt(IVA(),1)}%</td></tr><tr><td class="muted">Tolerância de consumo</td><td>+${fmt(TOL())}% acima da referência</td></tr>
    </tbody></table></div></div></section>
    <section class="panel"><div class="panel-h"><h2>Sobre este protótipo</h2></div><div class="panel-b" style="display:grid;gap:8px;max-width:62ch">
      <p style="margin:0">Os dados ${mode==='db'?'ficam guardados na base de dados deste artefacto e são partilhados com quem tiver acesso de edição.':'ficam apenas neste navegador (modo demonstração).'}</p>
      <p style="margin:0" class="muted">As faturas seguem o formato de Moçambique (NUIT do emitente e do cliente, IVA discriminado, numeração sequencial por série anual). Para emissão com validade fiscal, a versão final precisa de certificação junto da Autoridade Tributária.</p>
    </div></section></div>`;
}

/* ---------- render & events ---------- */
function render(){
  const al=alerts(); const crit=al.filter(a=>a.lvl==='crit').length;
  let g='';
  // Contadores no menu: o que precisa de ação em cada módulo.
  const nPend=S.requisicoes.filter(r=>r.estado==='pendente').length, nPag=S.requisicoes.filter(r=>r.estado==='verificada').length;
  const nRes=S.reservas.filter(r=>r.estado==='curso'&&r.fim<TODAY).length;
  const badge=k=>k==='painel'&&crit?`<span class="count" title="Alertas urgentes">${crit}</span>`:k==='requisicoes'&&nPend+nPag?`<span class="count warn" title="${nPend} por verificar · ${nPag} por pagar">${nPend+nPag}</span>`:k==='reservas'&&nRes?`<span class="count" title="Devoluções em atraso">${nRes}</span>`:'';
  $('#nav').innerHTML=Object.entries(VIEWS).map(([k,v])=>{const head=v.g!==g?(g=v.g,`<div class="nav-group">${v.g}</div>`):'';
    return `${head}<button data-view="${k}"${view===k?' aria-current="page"':''}><svg viewBox="0 0 24 24" aria-hidden="true">${v.i}</svg>${v.n||v.t}${badge(k)}</button>`}).join('');
  $('#h1').textContent=VIEWS[view].t;
  const hoje=new Date().toLocaleDateString('pt-PT',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  $('#hsub').textContent=view==='painel'?`${S.config.nome||'A sua empresa'} · ${hoje}`:({viaturas:`${S.viaturas.length} viaturas registadas`,motoristas:M(filters.mid)?`Painel do motorista · ${M(filters.mid).nome}`:'Disponibilidade, férias e serviço atual',reservas:'Reservas, entregas e devoluções',clientes:`${S.clientes.length} clientes`,faturas:`Série FT ${TODAY.slice(0,4)} · IVA ${fmt(IVA())}%`,custos:'Abastecimentos, portagens, multas e outras despesas',requisicoes:'Pedidos aos postos, verificação e pagamento (fatura e recibo)',postos:'Postos fornecedores e preço por litro',manutencao:'Manutenção preventiva e histórico de oficina',relatorios:'Custo por quilómetro e rentabilidade por viatura',definicoes:'Emitente das faturas'})[view];
  $('#topActions').innerHTML=(view==='painel'?`<button class="btn" data-new="reserva">+ Reserva</button><button class="btn" data-new="requisicao">+ Requisição</button>`:'')+`<span class="sync ${mode==='db'?'on':''}" title="${mode==='db'?'Os dados ficam na base de dados partilhada.':'Dados de exemplo; as alterações ficam só neste navegador.'}"><i></i>${mode==='db'?'Guardado na nuvem':mode==='loading'?'A ligar…':'Modo demonstração'}</span>`;
  $('#demoNote').innerHTML=''; // o estado (demonstração / nuvem) já aparece no cabeçalho
  const fn={painel:viewPainel,viaturas:viewViaturas,motoristas:viewMotoristas,custos:viewCustos,requisicoes:viewRequisicoes,postos:viewPostos,manutencao:viewManutencao,reservas:viewReservas,clientes:viewClientes,faturas:viewFaturas,relatorios:viewRelatorios,definicoes:viewDefinicoes}[view];
  const active=document.activeElement; const aid=active&&active.id; const pos=aid&&active.selectionStart;
  $('#view').innerHTML=fn();
  if(aid&&['vq','cq','mq','rqq'].includes(aid)){const el=document.getElementById(aid);if(el){el.focus();try{el.setSelectionRange(pos,pos)}catch(e){}}}
}
function go(k){ if(!VIEWS[k])return; view=k; filters.mid=null; try{history.replaceState(null,'','#'+k)}catch(e){} render(); window.scrollTo(0,0); }

document.addEventListener('click',async e=>{
  const b=e.target.closest('button');
  if(!b){ if(e.target.closest('a,input,select,textarea'))return;
    const tr=e.target.closest('tr[data-cons],tr[data-open]'); if(!tr)return;
    if(tr.dataset.cons)return verConsumo(tr.dataset.cons);
    const [t,a,c]=tr.dataset.open.split(':');
    if(t==='rq'){const r=S.requisicoes.find(x=>x.id===a);return r&&verReq(r)}
    if(t==='fat')return verFatura(a);
    if(t==='mot'){view='motoristas';filters.mid=a;render();return window.scrollTo(0,0)}
    if(t==='edit'){const o=S[a]?.find(x=>x.id===c);if(!o)return;return ({viaturas:formViatura,clientes:formCliente,postos:formPosto,abastecimentos:formAbast,despesas:formDespesa,reservas:formReserva,planos:formPlano,servicos:formServico})[a]?.(o)}
    return }
  const d=b.dataset;
  try{
    if(d.more){filters[d.more+'All']=!filters[d.more+'All'];return render()}
    if(d.cons)return verConsumo(d.cons);
    if(d.hall){filters.hAll=d.hall==='1';return verConsumo(filters.hv)}
    if(d.abastv)return formAbast({viaturaId:d.abastv});
    if(d.rqs){filters.rqs=d.rqs;return render()}
    const RQ=id=>S.requisicoes.find(x=>x.id===id);
    if(d.rqver){const r=RQ(d.rqver);return r&&r.estado==='pendente'&&verificarReq(r)}
    if(d.rqpag){const r=RQ(d.rqpag);return r&&r.estado==='verificada'&&pagarReq(r)}
    if(d.rqvi){const r=RQ(d.rqvi);return r&&verReq(r)}
    if(d.rqanular){ if(b.dataset.armed){await patch('requisicoes',d.rqanular,{estado:'anulada'});if(!$('#drawer').hidden)closeDrawer();return toast('Requisição anulada.')} b.dataset.armed='1';b.textContent='Confirmar?';setTimeout(()=>{if(b.isConnected){delete b.dataset.armed;b.textContent='Anular'}},3000);return }
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
      await patch('motoristas',m.id,m.feriasInicio<=TODAY?{feriasFim:addDays(TODAY,-1)}:{feriasInicio:'',feriasFim:''});return toast('Férias terminadas.')}
    if(d.new)return ({viatura:()=>formViatura(),motorista:()=>formMotorista(),requisicao:()=>formRequisicao(),posto:()=>formPosto(),abast:()=>formAbast(),despesa:()=>formDespesa(),plano:()=>formPlano(),servico:()=>formServico(),cliente:()=>formCliente(),reserva:()=>formReserva()})[d.new]();
    if(d.edit){const[col,id]=d.edit.split(':');const o=S[col].find(x=>x.id===id);if(!o)return;
      return ({viaturas:formViatura,motoristas:formMotorista,abastecimentos:formAbast,requisicoes:formRequisicao,postos:formPosto,despesas:formDespesa,planos:formPlano,servicos:formServico,clientes:formCliente,reservas:formReserva})[col](o);}
    if(d.srv){const p=S.planos.find(x=>x.id===d.srv);return p&&formServico({},p)}
    if(d.ent){const r=S.reservas.find(x=>x.id===d.ent);return r&&entregar(r)}
    if(d.dev){const r=S.reservas.find(x=>x.id===d.dev);return r&&devolver(r)}
    if(d.faturar){const r=S.reservas.find(x=>x.id===d.faturar);if(!r||r.faturaId)return;b.disabled=true;return faturar(r)}
    if(d.fat)return verFatura(d.fat);
    if(d.cancel){ if(b.dataset.armed){await patch('reservas',d.cancel,{estado:'cancelada'});return toast('Reserva cancelada.')} b.dataset.armed='1';b.textContent='Confirmar?';setTimeout(()=>{if(b.isConnected){delete b.dataset.armed;b.textContent='Cancelar'}},3000);return }
    if(b.id==='editEmp')return formEmpresa();
  }catch(err){}
});
document.addEventListener('input',e=>{ if(e.target.id==='vq'){filters.vq=e.target.value;render()} if(e.target.id==='cq'){filters.cq=e.target.value;render()} if(e.target.id==='mq'){filters.mq=e.target.value;render()} if(e.target.id==='rqq'){filters.rqq=e.target.value;render()} });
document.addEventListener('change',e=>{ if(e.target.id==='cv'){filters.cv=e.target.value;render()}
  if(e.target.id==='rqv'){filters.rqv=e.target.value;render()}
  if(e.target.id==='per'){filters.per=e.target.value;render()}
  if(e.target.id==='pDe'||e.target.id==='pAte'){filters[e.target.id]=e.target.value;render()} });

const h=(location.hash||'').slice(1); if(VIEWS[h])view=h;
loadDemo(); mode='loading'; render(); connect();
