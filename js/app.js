const SAMPLE = window.SAMPLE || {config:{}};
const COLS=['viaturas','abastecimentos','despesas','planos','servicos','clientes','reservas','faturas'];
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
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const sum=(a,f)=>a.reduce((s,x)=>s+(+f(x)||0),0);

let S={config:{},...Object.fromEntries(COLS.map(c=>[c,[]]))};
let mode='loading', db=null, view='painel', filters={};
const VIEWS={
  painel:{t:'Painel',g:'Operação',i:'<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>'},
  viaturas:{t:'Viaturas',g:'Operação',i:'<path d="M5 17h14M3 13l2-6h14l2 6v4h-2M5 17H3v-4"/><circle cx="7.5" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/>'},
  reservas:{t:'Reservas',g:'Rent-a-Car',i:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'},
  clientes:{t:'Clientes',g:'Rent-a-Car',i:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.8c1.6.8 2.6 2.5 3 5.2"/>'},
  faturas:{t:'Faturação',g:'Rent-a-Car',i:'<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/>'},
  custos:{t:'Combustível e custos',g:'Custos',i:'<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M6 9h6M14 11h2a2 2 0 0 1 2 2v4a1.5 1.5 0 0 0 3 0V8l-3-3"/>'},
  manutencao:{t:'Manutenção',g:'Custos',i:'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>'},
  relatorios:{t:'Relatórios',g:'Análise',i:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'},
  definicoes:{t:'Empresa',g:'Análise',i:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.8 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.8-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.8H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.8-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.8 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.8H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'}
};

/* ---------- data layer ---------- */
const DEMO_KEY='frotamz-demo-v1';
function loadDemo(){
  let saved=null; try{saved=JSON.parse(localStorage.getItem(DEMO_KEY)||'null')}catch(e){}
  const src=saved||SAMPLE;
  S={config:{...src.config},...Object.fromEntries(COLS.map(c=>[c,(src[c]||[]).map(x=>({...x}))]))};
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
const vLabel=v=>v?`${v.marca} ${v.modelo}`:'Viatura removida';
const plate=v=>v?`<span class="plate"><span>${esc(v.matricula)}</span></span>`:'<span class="muted">—</span>';
const IVA=()=>+(S.config.iva??16);
const ESTADO_V={disponivel:['Disponível','p-ok'],alugada:['Alugada','p-info'],manutencao:['Na oficina','p-warn'],inativa:['Inativa','p-mute']};
const ESTADO_R={reservada:['Reservada','p-mute'],curso:['Em curso','p-info'],concluida:['Concluída','p-ok'],cancelada:['Cancelada','p-mute']};
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
function vStats(v){
  const f=S.abastecimentos.filter(a=>a.viaturaId===v.id).sort((a,b)=>a.km-b.km);
  const fuel=sum(f,a=>a.litros*a.precoLitro), litros=sum(f,a=>a.litros);
  const kmRun=f.length>1?f[f.length-1].km-f[0].km:0;
  const cons=kmRun>0?sum(f.slice(1),a=>a.litros)/kmRun*100:null;
  const desp=sum(S.despesas.filter(d=>d.viaturaId===v.id),d=>d.valor);
  const serv=sum(S.servicos.filter(s=>s.viaturaId===v.id),s=>s.custo);
  const total=fuel+desp+serv;
  const receita=sum(S.faturas.filter(x=>x.viaturaId===v.id&&x.estado!=='anulada'),x=>fatSub(x));
  return {fuel,litros,kmRun,cons,desp,serv,total,cpk:kmRun>0?total/kmRun:null,receita};
}
const fatSub=f=>sum(f.linhas||[],l=>l.qtd*l.preco);
const fatIva=f=>fatSub(f)*(+f.iva||0)/100;
const fatTot=f=>fatSub(f)+fatIva(f);
const resDias=r=>Math.max(1,days(r.inicio,r.fim));
const resValor=r=>resDias(r)*(+r.tarifa||0);
function overlap(r){
  return S.reservas.find(o=>o.id!==r.id&&o.viaturaId===r.viaturaId&&!['cancelada','concluida'].includes(o.estado)&&o.inicio<=r.fim&&r.inicio<=o.fim);
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
  });
  return out.sort((a,b)=>a.s-b.s);
}

/* ---------- UI helpers ---------- */
let toastT; function toast(msg){const t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,3200)}
const vOptions=(sel,filter)=>S.viaturas.filter(filter||(()=>true)).map(v=>`<option value="${esc(v.id)}"${v.id===sel?' selected':''}>${esc(v.matricula)} · ${esc(vLabel(v))}</option>`).join('');
const cOptions=sel=>S.clientes.map(c=>`<option value="${esc(c.id)}"${c.id===sel?' selected':''}>${esc(c.nome)}</option>`).join('');

let drawerSubmit=null;
function openDrawer(title,fields,init,onSubmit,opts={}){
  $('#dTitle').textContent=title;
  const body=fields.map(f=>{
    if(f.type==='note')return `<div class="form-note">${f.html}</div>`;
    const id='f_'+f.k, v=init[f.k]??f.def??'';
    let input;
    if(f.type==='select') input=`<select id="${id}" name="${f.k}"${f.req?' required':''}>${f.optsHtml??(f.opts||[]).map(o=>{const[val,lab]=Array.isArray(o)?o:[o,o];return `<option value="${esc(val)}"${String(val)===String(v)?' selected':''}>${esc(lab)}</option>`}).join('')}</select>`;
    else if(f.type==='textarea') input=`<textarea id="${id}" name="${f.k}" rows="3">${esc(v)}</textarea>`;
    else input=`<input id="${id}" name="${f.k}" type="${f.type||'text'}" value="${esc(v)}"${f.step?` step="${f.step}"`:''}${f.min!=null?` min="${f.min}"`:''}${f.req?' required':''}${f.ph?` placeholder="${esc(f.ph)}"`:''} autocomplete="off">`;
    return `<div class="fld${f.full?' full':''}"><label for="${id}">${esc(f.label)}${f.req?' *':''}</label>${input}${f.hint?`<span class="hint">${esc(f.hint)}</span>`:''}</div>`;
  }).join('');
  $('#dBody').innerHTML=`<div class="form">${body}<div class="form-err" id="dErr" hidden></div></div>`;
  $('#dFoot').innerHTML=`${opts.del?'<span class="confirm" id="delWrap"><button type="button" class="btn danger" id="dDel">Apagar</button></span><span style="flex:1"></span>':''}<button type="button" class="btn" data-close>Cancelar</button><button type="submit" class="btn primary">${esc(opts.ok||'Guardar')}</button>`;
  drawerSubmit=async()=>{
    const out={}; let miss=[];
    fields.forEach(f=>{ if(!f.k||f.type==='note')return; const el=document.getElementById('f_'+f.k); let v=el.value.trim();
      if(f.req&&!v)miss.push(f.label);
      if(f.type==='number')v=v===''?null:+v; out[f.k]=v; });
    const err=$('#dErr');
    if(miss.length){err.textContent='Preencha: '+miss.join(', ')+'.';err.hidden=false;return}
    const msg=opts.validate?opts.validate(out):null;
    if(msg){err.textContent=msg;err.hidden=false;return}
    try{ await onSubmit(out); closeDrawer(); if(opts.done)toast(opts.done);}catch(e){}
  };
  if(opts.del){ $('#dDel').onclick=()=>{ $('#delWrap').innerHTML=`<span class="muted" style="font-size:13px">Apagar de vez?</span><button type="button" class="btn danger sm" id="dDelY">Sim, apagar</button><button type="button" class="btn sm" id="dDelN">Não</button>`;
    $('#dDelN').onclick=()=>openDrawer(title,fields,init,onSubmit,opts);
    $('#dDelY').onclick=async()=>{try{await opts.del();closeDrawer();toast('Registo apagado.')}catch(e){}}; }; }
  $('#drawer').hidden=false;
  setTimeout(()=>{const f=$('#dBody input,#dBody select');f&&f.focus()},30);
}
function closeDrawer(){$('#drawer').hidden=true;drawerSubmit=null}
$('#dForm').addEventListener('submit',e=>{e.preventDefault();drawerSubmit&&drawerSubmit()});
$('#drawer').addEventListener('click',e=>{if(e.target.closest('[data-close]'))closeDrawer()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#drawer').hidden)closeDrawer()});

/* ---------- forms ---------- */
function formViatura(v={}){
  openDrawer(v.id?'Editar viatura':'Nova viatura',[
    {k:'matricula',label:'Matrícula',req:1,ph:'AAA 123 MC'},
    {k:'estado',label:'Estado',type:'select',opts:Object.entries(ESTADO_V).map(([k,[t]])=>[k,t]),def:'disponivel'},
    {k:'marca',label:'Marca',req:1},{k:'modelo',label:'Modelo',req:1},
    {k:'ano',label:'Ano',type:'number',min:1980},{k:'categoria',label:'Categoria',type:'select',opts:['Económico','Ligeiro','SUV','Pick-up','Minibus','Camião','Moto'],def:'Ligeiro'},
    {k:'combustivel',label:'Combustível',type:'select',opts:['Diesel','Gasolina','Híbrido','Elétrico'],def:'Diesel'},
    {k:'km',label:'Quilometragem atual',type:'number',min:0,req:1},
    {k:'tarifa',label:'Tarifa diária (MT)',type:'number',min:0,step:'0.01',hint:'Preço de aluguer sem IVA'},
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
    {type:'note',html:'O consumo médio (L/100 km) é calculado entre abastecimentos de depósito cheio da mesma viatura.'}
  ],a,async o=>{ await save('abastecimentos',{...a,...o}); const v=V(o.viaturaId); if(v&&o.km>(+v.km||0)) await patch('viaturas',v.id,{km:o.km}); },
  {done:'Abastecimento registado.',del:a.id?()=>remove('abastecimentos',a.id):null});
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
function formReserva(r={}){
  if(!S.viaturas.length||!S.clientes.length)return toast('Precisa de pelo menos uma viatura e um cliente.');
  const v0=V(r.viaturaId)||S.viaturas.find(v=>v.estado==='disponivel')||S.viaturas[0];
  openDrawer(r.id?'Editar reserva':'Nova reserva',[
    {k:'clienteId',label:'Cliente',type:'select',optsHtml:cOptions(r.clienteId),full:1,req:1},
    {k:'viaturaId',label:'Viatura',type:'select',optsHtml:vOptions(r.viaturaId||v0.id,v=>v.estado!=='inativa'),full:1,req:1},
    {k:'inicio',label:'Levantamento',type:'date',def:TODAY,req:1},{k:'fim',label:'Devolução',type:'date',req:1},
    {k:'tarifa',label:'Tarifa diária (MT)',type:'number',step:'0.01',def:v0.tarifa,hint:'Deixe vazio para usar a tarifa da viatura'},{k:'caucao',label:'Caução (MT)',type:'number',step:'0.01',def:0},
    {k:'condutores',label:'Condutores autorizados',full:1,ph:'Separe por ponto e vírgula'},
  ],r,async o=>{ if(o.tarifa==null)o.tarifa=V(o.viaturaId)?.tarifa||0; await save('reservas',{estado:'reservada',...r,...o}); },
  {done:r.id?'Reserva atualizada.':'Reserva criada.',del:r.id&&!r.faturaId?()=>remove('reservas',r.id):null,
   validate:o=>{ if(o.fim<o.inicio)return 'A devolução tem de ser depois do levantamento.';
     const c=overlap({...r,...o}); if(c){const cl=C(c.clienteId);return `A viatura já está reservada de ${dd(c.inicio)} a ${dd(c.fim)} (${cl?.nome||'outro cliente'}).`}
     const cli=C(o.clienteId); if(cli?.cartaValidade&&cli.cartaValidade<o.fim)return `A carta de condução de ${cli.nome} caduca a ${dd(cli.cartaValidade)}, antes da devolução.`;
     return null; }});
}
async function entregar(r){
  const v=V(r.viaturaId);
  if(v&&v.estado==='manutencao')return toast('A viatura está na oficina. Mude o estado antes de entregar.');
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
  if(+r.extras>0)linhas.push({desc:r.extrasDesc||'Encargos adicionais',qtd:1,preco:+r.extras});
  const id=uid();
  await save('faturas',{id,numero,data:TODAY,clienteId:r.clienteId,reservaId:r.id,viaturaId:r.viaturaId,iva:IVA(),estado:'pendente',linhas});
  await patch('reservas',r.id,{faturaId:id});
  toast(`Fatura ${numero} emitida.`); verFatura(id);
}
function verFatura(id){
  const f=S.faturas.find(x=>x.id===id); if(!f)return;
  const c=C(f.clienteId)||{}; const e=S.config;
  $('#dTitle').textContent=f.numero;
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
function formEmpresa(){
  openDrawer('Dados da empresa',[
    {k:'nome',label:'Nome da empresa',req:1,full:1},{k:'nuit',label:'NUIT',req:1},{k:'telefone',label:'Telefone'},
    {k:'endereco',label:'Endereço',full:1},{k:'iva',label:'Taxa de IVA (%)',type:'number',step:'0.1',def:16,hint:'Taxa geral em Moçambique: 16%'},
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
  return `<div class="kpis">
    <div class="kpi"><label>Frota ativa</label><b>${vs.length}</b><small>${cnt('disponivel')} disponíveis · ${cnt('alugada')} alugadas · ${cnt('manutencao')} na oficina</small>
      <div class="fleetbar" aria-hidden="true"><span style="width:${cnt('disponivel')/n*100}%;background:var(--ok)"></span><span style="width:${cnt('alugada')/n*100}%;background:var(--info)"></span><span style="width:${cnt('manutencao')/n*100}%;background:var(--amber)"></span></div></div>
    <div class="kpi"><label>Taxa de ocupação hoje</label><b>${fmt(cnt('alugada')/n*100)}%</b><small>viaturas alugadas sobre a frota ativa</small></div>
    <div class="kpi"><label>Faturado este mês</label><b>${MT0(recMes)}</b><small>sem IVA · ${pend.length} ${pend.length===1?'fatura':'faturas'} por receber (${MT0(sum(pend,fatTot))})</small></div>
    <div class="kpi"><label>Custos este mês</label><b>${MT0(custoMes)}</b><small>combustível, despesas e oficina</small></div>
  </div>
  <div class="cols">
    <section class="panel"><div class="panel-h"><h2>Alertas</h2><span class="sub">${al.filter(a=>a.lvl==='crit').length} urgentes · ${al.filter(a=>a.lvl!=='crit').length} a acompanhar</span></div>
      ${al.length?`<ul class="alerts">${al.map(a=>`<li class="${a.lvl}"><span class="sev"></span><div><div class="t">${esc(a.t)}</div><div class="m">${plate(a.v)} <span>${a.raw?a.m:esc(a.m)}</span></div></div><button class="btn sm" data-go="${a.go}">Abrir</button></li>`).join('')}</ul>`:'<div class="empty">Sem alertas. Documentos e manutenções em dia.</div>'}
    </section>
    <div class="grid">
      <section class="panel"><div class="panel-h"><h2>Rent-a-Car em curso e próximos 7 dias</h2></div>
        ${prox.length?`<ul class="alerts">${prox.map(r=>{const c=C(r.clienteId),v=V(r.viaturaId);const late=r.estado==='curso'&&r.fim<TODAY;return `<li class="${late?'crit':r.estado==='curso'?'info':'warn'}"><span class="sev"></span><div><div class="t">${esc(c?.nome||'—')}</div><div class="m">${plate(v)} ${r.estado==='curso'?`devolve ${dd(r.fim)}`:`levanta ${dd(r.inicio)}`}</div></div>${r.estado==='curso'?`<button class="btn sm" data-dev="${r.id}">Devolver</button>`:`<button class="btn sm" data-ent="${r.id}">Entregar</button>`}</li>`}).join('')}</ul>`:'<div class="empty">Nada agendado.</div>'}
      </section>
      <section class="panel"><div class="panel-h"><h2>Estado da frota</h2><button class="link" data-go="viaturas">Ver todas</button></div>
        <div class="tbl-wrap"><table><tbody>${S.viaturas.map(v=>`<tr><td>${vCell(v)}</td><td class="n muted">${fmt(v.km)} km</td><td class="act">${pill(ESTADO_V[v.estado]||ESTADO_V.inativa)}</td></tr>`).join('')||'<tr><td class="empty">Sem viaturas.</td></tr>'}</tbody></table></div>
      </section>
    </div>
  </div>`;
}

function viewViaturas(){
  const q=(filters.vq||'').toLowerCase(), st=filters.vs||'todas';
  const list=S.viaturas.filter(v=>(st==='todas'||v.estado===st)&&(`${v.matricula} ${v.marca} ${v.modelo}`.toLowerCase().includes(q)));
  const dc=(v,k)=>{const s=docState(v[k]);return `<span class="docdate ${s==='ok'?'':s||''}">${dd(v[k])}</span>`};
  return `<div class="toolbar"><input class="search" id="vq" type="search" placeholder="Procurar matrícula ou modelo" value="${esc(filters.vq||'')}" aria-label="Procurar viaturas">
    <div class="seg" role="group" aria-label="Filtrar por estado">${[['todas','Todas'],...Object.entries(ESTADO_V).map(([k,[t]])=>[k,t])].map(([k,t])=>`<button data-vs="${k}" aria-pressed="${st===k}">${t}</button>`).join('')}</div>
    <span class="grow"></span><button class="btn primary" data-new="viatura">+ Nova viatura</button></div>
  <section class="panel"><div class="tbl-wrap"><table>
    <thead><tr><th>Viatura</th><th>Categoria</th><th class="n">Km</th><th class="n">Tarifa/dia</th><th>Seguro</th><th>Inspeção</th><th>Imposto anual</th><th>Estado</th><th></th></tr></thead>
    <tbody>${list.map(v=>`<tr><td>${vCell(v)}<small class="muted">${esc(v.ano||'')} · ${esc(v.combustivel||'')}</small></td><td>${esc(v.categoria||'')}</td><td class="n">${fmt(v.km)}</td><td class="n">${MT0(v.tarifa)}</td><td>${dc(v,'seguro')}</td><td>${dc(v,'inspecao')}</td><td>${dc(v,'licenca')}</td><td>${pill(ESTADO_V[v.estado]||ESTADO_V.inativa)}</td><td class="act"><button class="btn sm" data-edit="viaturas:${v.id}">Editar</button></td></tr>`).join('')}</tbody>
  </table></div>${list.length?'':'<div class="empty">Nenhuma viatura corresponde ao filtro.</div>'}</section>`;
}

function viewCustos(){
  const tab=filters.ct||'abast';
  const vf=filters.cv||'';
  const inV=x=>!vf||x.viaturaId===vf;
  let body;
  if(tab==='abast'){
    const list=S.abastecimentos.filter(inV).sort((a,b)=>b.data.localeCompare(a.data)||b.km-a.km);
    body=`<thead><tr><th>Data</th><th>Viatura</th><th class="n">Km</th><th class="n">Litros</th><th class="n">MT/L</th><th class="n">Total</th><th class="n">L/100 km</th><th>Posto</th><th></th></tr></thead><tbody>${list.map(a=>{
      const prev=S.abastecimentos.filter(x=>x.viaturaId===a.viaturaId&&x.km<a.km).sort((x,y)=>y.km-x.km)[0];
      const c=prev&&a.km>prev.km?a.litros/(a.km-prev.km)*100:null;
      return `<tr><td class="nowrap">${dd(a.data)}</td><td>${plate(V(a.viaturaId))}</td><td class="n">${fmt(a.km)}</td><td class="n">${fmt(a.litros,1)}</td><td class="n">${fmt(a.precoLitro,2)}</td><td class="n">${MT(a.litros*a.precoLitro)}</td><td class="n">${c?fmt(c,1):'<span class="muted">—</span>'}</td><td class="muted">${esc(a.posto||'')}</td><td class="act"><button class="btn sm" data-edit="abastecimentos:${a.id}">Editar</button></td></tr>`}).join('')}</tbody>`;
    body+=list.length?'':'<tbody><tr><td colspan="9" class="empty">Sem abastecimentos.</td></tr></tbody>';
  }else{
    const list=S.despesas.filter(inV).sort((a,b)=>b.data.localeCompare(a.data));
    body=`<thead><tr><th>Data</th><th>Viatura</th><th>Categoria</th><th>Descrição</th><th class="n">Valor</th><th></th></tr></thead><tbody>${list.map(d=>`<tr><td class="nowrap">${dd(d.data)}</td><td>${plate(V(d.viaturaId))}</td><td>${esc(d.categoria)}</td><td class="muted">${esc(d.descricao||'')}</td><td class="n">${MT(d.valor)}</td><td class="act"><button class="btn sm" data-edit="despesas:${d.id}">Editar</button></td></tr>`).join('')}</tbody>`;
    body+=list.length?'':'<tbody><tr><td colspan="6" class="empty">Sem despesas.</td></tr></tbody>';
  }
  const fuelT=sum(S.abastecimentos.filter(inV),a=>a.litros*a.precoLitro), litros=sum(S.abastecimentos.filter(inV),a=>a.litros), despT=sum(S.despesas.filter(inV),d=>d.valor);
  const cons=S.viaturas.filter(v=>!vf||v.id===vf).map(vStats).filter(s=>s.cons);
  return `<div class="kpis">
    <div class="kpi"><label>Combustível</label><b>${MT0(fuelT)}</b><small>${fmt(litros)} litros abastecidos</small></div>
    <div class="kpi"><label>Consumo médio</label><b>${cons.length?fmt(sum(cons,s=>s.cons)/cons.length,1):'—'} <span style="font-size:15px">L/100 km</span></b><small>${vf?'desta viatura':'média das viaturas'}</small></div>
    <div class="kpi"><label>Outras despesas</label><b>${MT0(despT)}</b><small>portagens, multas, pneus, acidentes…</small></div>
  </div>
  <div class="toolbar"><div class="seg" role="group" aria-label="Tipo de registo"><button data-ct="abast" aria-pressed="${tab==='abast'}">Abastecimentos</button><button data-ct="desp" aria-pressed="${tab==='desp'}">Despesas</button></div>
    <select class="search" id="cv" aria-label="Filtrar por viatura" style="width:auto"><option value="">Todas as viaturas</option>${vOptions(vf)}</select>
    <span class="grow"></span><button class="btn primary" data-new="${tab==='abast'?'abast':'despesa'}">+ ${tab==='abast'?'Abastecimento':'Despesa'}</button></div>
  <section class="panel"><div class="tbl-wrap"><table>${body}</table></div></section>`;
}

function viewManutencao(){
  const planos=S.planos.map(p=>({p,st:planStatus(p),v:V(p.viaturaId)})).sort((a,b)=>({crit:0,warn:1,ok:2}[a.st.lvl]-{crit:0,warn:1,ok:2}[b.st.lvl])||b.st.used-a.st.used);
  const hist=S.servicos.slice().sort((a,b)=>b.data.localeCompare(a.data));
  return `<div class="toolbar"><span class="muted">Planos preventivos por quilómetros e por tempo. Registe o serviço para reiniciar a contagem.</span><span class="grow"></span><button class="btn" data-new="servico">Registar serviço</button><button class="btn primary" data-new="plano">+ Novo plano</button></div>
  <section class="panel" style="margin-bottom:18px"><div class="panel-h"><h2>Planos preventivos</h2><span class="sub">${planos.filter(x=>x.st.lvl!=='ok').length} a precisar de atenção</span></div><div class="tbl-wrap"><table>
    <thead><tr><th>Viatura</th><th>Serviço</th><th>Intervalo</th><th>Último</th><th style="min-width:130px">Uso do intervalo</th><th>Próximo</th><th>Estado</th><th></th></tr></thead>
    <tbody>${planos.map(({p,st,v})=>`<tr><td>${plate(v)}</td><td><b>${esc(p.tipo)}</b></td><td class="muted nowrap">${p.intervaloKm?fmt(p.intervaloKm)+' km':''}${p.intervaloKm&&p.intervaloMeses?' / ':''}${p.intervaloMeses?p.intervaloMeses+' meses':''}</td>
      <td class="nowrap">${fmt(p.ultimoKm)} km<br><small class="muted">${dd(p.ultimaData)}</small></td>
      <td><div class="meter ${st.lvl==='ok'?'':st.lvl}"><span style="width:${Math.round(st.used*100)}%"></span></div><small class="muted">${Math.round(st.used*100)}%</small></td>
      <td class="nowrap">${p.intervaloKm?fmt(st.nextKm)+' km':''}<br><small class="muted">${st.nextDate?dd(st.nextDate):''}</small></td>
      <td>${pill(st.lvl==='crit'?['Em atraso','p-crit']:st.lvl==='warn'?['Brevemente','p-warn']:['Em dia','p-ok'])}</td>
      <td class="act"><button class="btn sm" data-srv="${p.id}">Feito</button> <button class="btn sm ghost" data-edit="planos:${p.id}">Editar</button></td></tr>`).join('')}</tbody></table></div>${planos.length?'':'<div class="empty">Sem planos. Crie um para receber alertas.</div>'}</section>
  <section class="panel"><div class="panel-h"><h2>Histórico de oficina</h2><span class="sub">${MT0(sum(hist,s=>s.custo))} no total</span></div><div class="tbl-wrap"><table>
    <thead><tr><th>Data</th><th>Viatura</th><th>Serviço</th><th class="n">Km</th><th>Oficina</th><th class="n">Custo</th><th></th></tr></thead>
    <tbody>${hist.map(s=>`<tr><td class="nowrap">${dd(s.data)}</td><td>${plate(V(s.viaturaId))}</td><td>${esc(s.tipo)}</td><td class="n">${fmt(s.km)}</td><td class="muted">${esc(s.oficina||'')}</td><td class="n">${MT(s.custo)}</td><td class="act"><button class="btn sm" data-edit="servicos:${s.id}">Editar</button></td></tr>`).join('')}</tbody></table></div>${hist.length?'':'<div class="empty">Sem serviços registados.</div>'}</section>`;
}

function viewReservas(){
  const st=filters.rs||'ativas';
  const list=S.reservas.filter(r=>st==='todas'||(st==='ativas'?['reservada','curso'].includes(r.estado):r.estado===st))
    .sort((a,b)=>(a.estado==='concluida')-(b.estado==='concluida')||a.inicio.localeCompare(b.inicio));
  return `<div class="toolbar"><div class="seg" role="group" aria-label="Filtrar reservas">${[['ativas','Ativas'],['concluida','Concluídas'],['cancelada','Canceladas'],['todas','Todas']].map(([k,t])=>`<button data-rs="${k}" aria-pressed="${st===k}">${t}</button>`).join('')}</div><span class="grow"></span><button class="btn primary" data-new="reserva">+ Nova reserva</button></div>
  <section class="panel"><div class="tbl-wrap"><table>
    <thead><tr><th>Cliente</th><th>Viatura</th><th>Período</th><th class="n">Dias</th><th class="n">Valor s/ IVA</th><th class="n">Km</th><th>Estado</th><th></th></tr></thead>
    <tbody>${list.map(r=>{const c=C(r.clienteId),v=V(r.viaturaId);const late=r.estado==='curso'&&r.fim<TODAY;
      const f=r.faturaId&&S.faturas.find(x=>x.id===r.faturaId);
      let act='';
      if(r.estado==='reservada')act=`<button class="btn sm primary" data-ent="${r.id}">Entregar</button> <button class="btn sm ghost" data-edit="reservas:${r.id}">Editar</button> <button class="btn sm ghost danger" data-cancel="${r.id}">Cancelar</button>`;
      else if(r.estado==='curso')act=`<button class="btn sm primary" data-dev="${r.id}">Devolver</button>`;
      else if(r.estado==='concluida')act=f?`<button class="btn sm" data-fat="${f.id}">${esc(f.numero)}</button>`:`<button class="btn sm primary" data-faturar="${r.id}">Faturar</button>`;
      return `<tr><td><b>${esc(c?.nome||'—')}</b><br><small class="muted">${esc(r.condutores||'')}</small></td><td>${plate(v)}</td><td class="nowrap">${dd(r.inicio)} → ${dd(r.fim)}</td><td class="n">${resDias(r)}</td><td class="n">${MT0(resValor(r)+(+r.extras||0))}</td>
      <td class="n muted">${r.kmEntrada?fmt(r.kmEntrada-r.kmSaida):'—'}</td><td>${late?pill(['Atrasada','p-crit']):pill(ESTADO_R[r.estado]||ESTADO_R.reservada)}</td><td class="act">${act}</td></tr>`}).join('')}</tbody>
  </table></div>${list.length?'':'<div class="empty">Sem reservas neste filtro.</div>'}</section>`;
}

function viewClientes(){
  const q=(filters.cq||'').toLowerCase();
  const list=S.clientes.filter(c=>`${c.nome} ${c.nuit}`.toLowerCase().includes(q)).sort((a,b)=>a.nome.localeCompare(b.nome));
  return `<div class="toolbar"><input class="search" id="cq" type="search" placeholder="Procurar nome ou NUIT" value="${esc(filters.cq||'')}" aria-label="Procurar clientes"><span class="grow"></span><button class="btn primary" data-new="cliente">+ Novo cliente</button></div>
  <section class="panel"><div class="tbl-wrap"><table><thead><tr><th>Cliente</th><th>NUIT</th><th>Identificação</th><th>Telefone</th><th>Carta de condução</th><th class="n">Alugueres</th><th class="n">Faturado</th><th></th></tr></thead>
  <tbody>${list.map(c=>{const s=docState(c.cartaValidade);return `<tr><td><b>${esc(c.nome)}</b></td><td style="font-family:var(--f-mono);font-size:13px">${esc(c.nuit||'—')}</td><td class="muted">${esc(c.documento||'')}</td><td class="nowrap">${esc(c.telefone||'')}</td>
    <td>${c.carta?`${esc(c.carta)}<br><span class="docdate ${s==='ok'?'':s}">válida até ${dd(c.cartaValidade)}</span>`:'<span class="muted">Empresa</span>'}</td>
    <td class="n">${S.reservas.filter(r=>r.clienteId===c.id).length}</td><td class="n">${MT0(sum(S.faturas.filter(f=>f.clienteId===c.id),fatTot))}</td><td class="act"><button class="btn sm" data-edit="clientes:${c.id}">Editar</button></td></tr>`}).join('')}</tbody></table></div>${list.length?'':'<div class="empty">Sem clientes.</div>'}</section>`;
}

function viewFaturas(){
  const list=S.faturas.slice().sort((a,b)=>(b.numero||'').localeCompare(a.numero||''));
  const pend=list.filter(f=>f.estado==='pendente');
  const porFaturar=S.reservas.filter(r=>r.estado==='concluida'&&!r.faturaId);
  return `<div class="kpis">
    <div class="kpi"><label>Total faturado</label><b>${MT0(sum(list,fatTot))}</b><small>com IVA · ${list.length} faturas</small></div>
    <div class="kpi"><label>Por receber</label><b>${MT0(sum(pend,fatTot))}</b><small>${pend.length} ${pend.length===1?'fatura pendente':'faturas pendentes'}</small></div>
    <div class="kpi"><label>IVA liquidado</label><b>${MT0(sum(list,fatIva))}</b><small>a declarar à AT</small></div>
  </div>
  ${porFaturar.length?`<section class="panel" style="margin-bottom:18px"><div class="panel-h"><h2>Alugueres por faturar</h2></div><ul class="alerts">${porFaturar.map(r=>`<li class="warn"><span class="sev"></span><div><div class="t">${esc(C(r.clienteId)?.nome||'—')}</div><div class="m">${plate(V(r.viaturaId))} ${dd(r.inicio)} → ${dd(r.fim)} · ${MT0(resValor(r)+(+r.extras||0))} s/ IVA</div></div><button class="btn sm primary" data-faturar="${r.id}">Emitir fatura</button></li>`).join('')}</ul></section>`:''}
  <section class="panel"><div class="tbl-wrap"><table><thead><tr><th>Número</th><th>Data</th><th>Cliente</th><th>Viatura</th><th class="n">Subtotal</th><th class="n">IVA</th><th class="n">Total</th><th>Estado</th><th></th></tr></thead>
  <tbody>${list.map(f=>`<tr><td style="font-family:var(--f-mono);font-size:13px" class="nowrap">${esc(f.numero)}</td><td class="nowrap">${dd(f.data)}</td><td>${esc(C(f.clienteId)?.nome||'—')}</td><td>${plate(V(f.viaturaId))}</td><td class="n">${MT(fatSub(f))}</td><td class="n">${MT(fatIva(f))}</td><td class="n"><b>${MT(fatTot(f))}</b></td><td>${pill(f.estado==='paga'?['Paga','p-ok']:['Pendente','p-warn'])}</td><td class="act"><button class="btn sm" data-fat="${f.id}">Ver</button></td></tr>`).join('')}</tbody></table></div>${list.length?'':'<div class="empty">Ainda não há faturas. Conclua um aluguer para faturar.</div>'}</section>`;
}

function viewRelatorios(){
  const rows=S.viaturas.map(v=>({v,s:vStats(v)}));
  const maxT=Math.max(1,...rows.map(r=>Math.max(r.s.total,r.s.receita)));
  const T=k=>sum(rows,r=>r.s[k]);
  const kmT=T('kmRun');
  return `<div class="kpis">
    <div class="kpi"><label>Custo total da frota</label><b>${MT0(T('total'))}</b><small>todo o período registado</small></div>
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
  <section class="panel"><div class="tbl-wrap"><table><thead><tr><th>Viatura</th><th class="n">Km percorridos</th><th class="n">L/100 km</th><th class="n">Combustível</th><th class="n">Oficina</th><th class="n">Despesas</th><th class="n">Custo total</th><th class="n">MT/km</th><th class="n">Receita</th><th class="n">Margem</th></tr></thead>
  <tbody>${rows.map(({v,s})=>`<tr><td>${vCell(v)}</td><td class="n">${fmt(s.kmRun)}</td><td class="n">${s.cons?fmt(s.cons,1):'—'}</td><td class="n">${MT0(s.fuel)}</td><td class="n">${MT0(s.serv)}</td><td class="n">${MT0(s.desp)}</td><td class="n"><b>${MT0(s.total)}</b></td><td class="n">${s.cpk?fmt(s.cpk,2):'—'}</td><td class="n">${MT0(s.receita)}</td><td class="n" style="color:${s.receita-s.total>=0?'var(--ok)':'var(--crit)'}">${MT0(s.receita-s.total)}</td></tr>`).join('')}</tbody></table></div></section>`;
}

function viewDefinicoes(){
  const e=S.config;
  return `<div class="set-grid"><section class="panel"><div class="panel-h"><h2>Dados da empresa</h2><button class="btn sm" id="editEmp">Editar</button></div><div class="panel-b">
    <div class="tbl-wrap"><table><tbody>
      <tr><td class="muted">Nome</td><td><b>${esc(e.nome||'—')}</b></td></tr><tr><td class="muted">NUIT</td><td style="font-family:var(--f-mono)">${esc(e.nuit||'—')}</td></tr>
      <tr><td class="muted">Endereço</td><td>${esc(e.endereco||'—')}</td></tr><tr><td class="muted">Telefone</td><td>${esc(e.telefone||'—')}</td></tr><tr><td class="muted">IVA</td><td>${fmt(IVA(),1)}%</td></tr>
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
  $('#nav').innerHTML=Object.entries(VIEWS).map(([k,v])=>{const head=v.g!==g?(g=v.g,`<div class="nav-group">${v.g}</div>`):'';
    return `${head}<button data-view="${k}"${view===k?' aria-current="page"':''}><svg viewBox="0 0 24 24" aria-hidden="true">${v.i}</svg>${v.t}${k==='painel'&&crit?`<span class="count">${crit}</span>`:''}</button>`}).join('');
  $('#h1').textContent=VIEWS[view].t;
  const hoje=new Date().toLocaleDateString('pt-PT',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  $('#hsub').textContent=view==='painel'?`${S.config.nome||'A sua empresa'} · ${hoje}`:({viaturas:`${S.viaturas.length} viaturas registadas`,reservas:'Reservas, entregas e devoluções',clientes:`${S.clientes.length} clientes`,faturas:`Série FT ${TODAY.slice(0,4)} · IVA ${fmt(IVA())}%`,custos:'Abastecimentos, portagens, multas e outras despesas',manutencao:'Manutenção preventiva e histórico de oficina',relatorios:'Custo por quilómetro e rentabilidade por viatura',definicoes:'Emitente das faturas'})[view];
  $('#topActions').innerHTML=`<span class="sync ${mode==='db'?'on':''}"><i></i>${mode==='db'?'Guardado na nuvem':mode==='loading'?'A ligar…':'Modo demonstração'}</span>`;
  $('#demoNote').innerHTML=mode==='demo'?'<div class="demo-note">Modo demonstração: os dados de exemplo e as suas alterações ficam só neste navegador.</div>':'';
  const fn={painel:viewPainel,viaturas:viewViaturas,custos:viewCustos,manutencao:viewManutencao,reservas:viewReservas,clientes:viewClientes,faturas:viewFaturas,relatorios:viewRelatorios,definicoes:viewDefinicoes}[view];
  const active=document.activeElement; const aid=active&&active.id; const pos=aid&&active.selectionStart;
  $('#view').innerHTML=fn();
  if(aid&&(aid==='vq'||aid==='cq')){const el=document.getElementById(aid);if(el){el.focus();try{el.setSelectionRange(pos,pos)}catch(e){}}}
}
function go(k){ if(!VIEWS[k])return; view=k; try{history.replaceState(null,'','#'+k)}catch(e){} render(); window.scrollTo(0,0); }

document.addEventListener('click',async e=>{
  const b=e.target.closest('button'); if(!b)return;
  const d=b.dataset;
  try{
    if(d.view)return go(d.view);
    if(d.go)return go(d.go);
    if(d.vs){filters.vs=d.vs;return render()}
    if(d.rs){filters.rs=d.rs;return render()}
    if(d.ct){filters.ct=d.ct;return render()}
    if(d.new)return ({viatura:()=>formViatura(),abast:()=>formAbast(),despesa:()=>formDespesa(),plano:()=>formPlano(),servico:()=>formServico(),cliente:()=>formCliente(),reserva:()=>formReserva()})[d.new]();
    if(d.edit){const[col,id]=d.edit.split(':');const o=S[col].find(x=>x.id===id);if(!o)return;
      return ({viaturas:formViatura,abastecimentos:formAbast,despesas:formDespesa,planos:formPlano,servicos:formServico,clientes:formCliente,reservas:formReserva})[col](o);}
    if(d.srv){const p=S.planos.find(x=>x.id===d.srv);return p&&formServico({},p)}
    if(d.ent){const r=S.reservas.find(x=>x.id===d.ent);return r&&entregar(r)}
    if(d.dev){const r=S.reservas.find(x=>x.id===d.dev);return r&&devolver(r)}
    if(d.faturar){const r=S.reservas.find(x=>x.id===d.faturar);if(!r||r.faturaId)return;b.disabled=true;return faturar(r)}
    if(d.fat)return verFatura(d.fat);
    if(d.cancel){ if(b.dataset.armed){await patch('reservas',d.cancel,{estado:'cancelada'});return toast('Reserva cancelada.')} b.dataset.armed='1';b.textContent='Confirmar?';setTimeout(()=>{if(b.isConnected){delete b.dataset.armed;b.textContent='Cancelar'}},3000);return }
    if(b.id==='editEmp')return formEmpresa();
  }catch(err){}
});
document.addEventListener('input',e=>{ if(e.target.id==='vq'){filters.vq=e.target.value;render()} if(e.target.id==='cq'){filters.cq=e.target.value;render()} });
document.addEventListener('change',e=>{ if(e.target.id==='cv'){filters.cv=e.target.value;render()} });

const h=(location.hash||'').slice(1); if(VIEWS[h])view=h;
loadDemo(); mode='loading'; render(); connect();
