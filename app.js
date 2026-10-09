/* Sawgrass Story Builder: app logic. Brand assets live in assets.js; cloud sync lives in sync.js. */
(function(){
const $=id=>document.getElementById(id);
const KEY='sg-teaser-builder-v1';
const INK='#101921';

const GRADS=[
  {id:'vf',name:'VersiFlex',img:'vfbg'},
  {id:'po',name:'Pink to Orange',a:'#E04584',b:'#FF7F39'},
  {id:'oy',name:'Orange to Yellow',a:'#FF7F39',b:'#FFCF00',low:true},
  {id:'yg',name:'Yellow to Green',a:'#FFCF00',b:'#00B852',low:true},
  {id:'gb',name:'Green to Blue',a:'#00B852',b:'#57CCF6'},
  {id:'bp',name:'Blue to Purple',a:'#57CCF6',b:'#8C84E3'},
  {id:'pp',name:'Purple to Pink',a:'#8C84E3',b:'#E04584'},
  {id:'pk',name:'Pink to Purple',a:'#E04584',b:'#8C84E3'},
  {id:'yo',name:'Yellow to Orange',a:'#FFCF00',b:'#FF7F39',low:true},
];
const PRODUCTS=[
  {id:'versiflex',name:'VersiFlex',pitch:'Meet our team, watch live demos and see the quality for yourself.'},
  {id:'max',name:'VersiFlex MAX',pitch:'Meet our team and see VersiFlex MAX printing live.',warn:'MAX uses the VersiFlex logo with MAX set in bold type. Swap in the official lockup when one exists.'},
  {id:'truesub',name:'TrueSub',pitch:'Meet our team and see what TrueSub can do.',warn:'TrueSub has no logo file in the 2026 brand guide, so it is set in bold type.'},
  {id:'sublijet',name:'Sublijet',pitch:'Meet our team and see Sublijet printing live.'},
  {id:'none',name:'Sawgrass only (no product)',pitch:'Meet our team, watch live demos and see the quality for yourself.'},
];
/* Sizes are the target at 1080 px wide. Each ratio has its own hierarchy; the renderer scales a ratio down only if its content would not fit. */
const RATIOS=[
  {id:'9x16',label:'9:16',H:1920,pad:150,side:110,mark:90,eye:48,logo:220,meta:76,learn:76,word:113,body:45,bl:3,bt:61,splash:872},
];
const STAGE_DEFS=[
  {id:'announce',name:'Announcement',when:'Pre-show',head:"We'll See You Soon!",body:'{pitch}',product:true},
  {id:'countdown',name:'Countdown',when:'Pre-show',head:'{days} Days to Go',body:'{pitch}',product:true},
  {id:'day1',name:'Day 1',when:'At show',head:'Day 1 Is Here',body:'Doors are open. Come find us on the floor.',product:true},
  {id:'mid',name:'Middle days',when:'At show',head:'Day {n} Is Here',body:'Live demos running all day. Come say hi.',product:true},
  {id:'last',name:'Last day',when:'At show',head:'Last Day to Visit',body:'Final chance to catch live demos at {show}.',product:true},
  {id:'thanks',name:'Thank you',when:'Post-show',head:'Thank You, {show}!',body:'Thanks to everyone who stopped by. See you next time.',product:false},
];

const DEFAULT={
  show:'Printing United Expo',city:'Las Vegas, NV',booth:'C2591',start:'2026-11-04',end:'2026-11-06',
  product:'versiflex',lead:'Learn About',pitch:PRODUCTS[0].pitch,pitchEdited:false,
  grad:'vf',arch:true,scale:{eye:100,mark:100,logo:100,meta:100,learn:100,word:100,body:100,booth:100},splashOn:true,splashSize:100,panel:true,ratios:{'1x1':true,'4x5':true,'9x16':true},daysOut:7,
  stages:Object.fromEntries(STAGE_DEFS.map(s=>[s.id,{on:true,head:s.head,body:s.body,product:s.product}])),
  logo:null,logoName:'',splash:null,example:true
};
let S=load();
window.SG_KEY=KEY;window.SG_STATE=()=>S;
let active='announce';
const imgs={};
let fontFamily='"Helvetica Neue", Helvetica, Arial, sans-serif';

function load(){
  try{const raw=localStorage.getItem(KEY);if(raw){const o=JSON.parse(raw);return Object.assign(structuredClone(DEFAULT),o,{stages:Object.assign(structuredClone(DEFAULT.stages),o.stages||{}),ratios:{'9x16':true},scale:Object.assign({},DEFAULT.scale,o.scale||{})});}}catch(e){}
  return structuredClone(DEFAULT);
}
let saveT;
function save(){clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem('sg-updated',String(Date.now()))}catch(e){}window.dispatchEvent(new CustomEvent('sg:save',{detail:S}));try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){try{const t=Object.assign({},S,{splash:null,hol:Object.assign({},S.hol,{img:null})});localStorage.setItem(KEY,JSON.stringify(t))}catch(e2){}}},300)}

function loadImg(src){return new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src})}

/* ---------- dates ---------- */
const MON=['Jan','Feb','March','April','May','June','July','Aug','Sept','Oct','Nov','Dec'];
function pd(s){if(!s)return null;const [y,m,d]=s.split('-').map(Number);if(!y||!m||!d)return null;return new Date(y,m-1,d)}
function dateLine(){
  const a=pd(S.start),b=pd(S.end);
  if(!a)return '';
  if(!b||b<=a)return `${MON[a.getMonth()]} ${a.getDate()}, ${a.getFullYear()}`;
  if(a.getMonth()===b.getMonth()&&a.getFullYear()===b.getFullYear())return `${MON[a.getMonth()]} ${a.getDate()} to ${b.getDate()}, ${b.getFullYear()}`;
  if(a.getFullYear()===b.getFullYear())return `${MON[a.getMonth()]} ${a.getDate()} to ${MON[b.getMonth()]} ${b.getDate()}, ${b.getFullYear()}`;
  return `${MON[a.getMonth()]} ${a.getDate()}, ${a.getFullYear()} to ${MON[b.getMonth()]} ${b.getDate()}, ${b.getFullYear()}`;
}
function showDays(){const a=pd(S.start),b=pd(S.end);if(!a||!b||b<a)return 1;return Math.min(10,Math.round((b-a)/864e5)+1)}

/* ---------- stages actually produced ---------- */
function stageList(){
  const n=showDays(),out=[];
  const add=(def,extra)=>{const st=S.stages[def.id];if(st&&st.on)out.push(Object.assign({key:def.id,def,st,n:1,label:def.name},extra||{}))};
  const d=id=>STAGE_DEFS.find(s=>s.id===id);
  add(d('announce'));add(d('countdown'),{label:S.daysOut==1?'Countdown (Tomorrow)':`Countdown (${S.daysOut} days)`});
  if(n===1){add(d('day1'),{label:'Show day'})}
  else{
    add(d('day1'));
    for(let i=2;i<n;i++)add(d('mid'),{key:'day'+i,n:i,label:'Day '+i});
    add(d('last'),{n});
  }
  add(d('thanks'));
  return out;
}
function fill(t,stage){
  const days=Number(S.daysOut)||7;
  let s=String(t||'');
  if(stage.def.id==='countdown'&&days===1&&s==='{days} Days to Go')s='Starts Tomorrow';
  return s.replaceAll('{show}',S.show.trim()).replaceAll('{city}',S.city.trim()).replaceAll('{booth}',S.booth.trim())
    .replaceAll('{days}',String(days)).replaceAll('{n}',String(stage.n)).replaceAll('{pitch}',S.pitch.trim()).replace(/\s+/g,' ').trim();
}

/* ---------- drawing ---------- */
const F=(w,px)=>`${w} ${px}px ${fontFamily}`;
function fitFont(ctx,text,weight,size,maxW,min){let s=size;ctx.font=F(weight,s);while(ctx.measureText(text).width>maxW&&s>min){s-=1;ctx.font=F(weight,s)}return s}
function wrap(ctx,text,maxW){const words=text.split(' ');const lines=[];let cur='';for(const w of words){const t=cur?cur+' '+w:w;if(ctx.measureText(t).width>maxW&&cur){lines.push(cur);cur=w}else cur=t}if(cur)lines.push(cur);return lines}
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}

function drawBg(ctx,W,H,gid){
  const g=GRADS.find(x=>x.id===(gid||S.grad))||GRADS[0];
  if(g.img&&imgs[g.img]){
    const im=imgs[g.img];const sc=Math.max(W/im.width,H/im.height);
    const w=im.width*sc,h=im.height*sc;ctx.drawImage(im,(W-w)/2,(H-h)/2,w,h);
  }else{
    const lg=ctx.createLinearGradient(0,0,0,H);lg.addColorStop(0,g.a||'#E04584');lg.addColorStop(1,g.b||'#FF7F39');ctx.fillStyle=lg;ctx.fillRect(0,0,W,H);
  }
}

function productBlock(ctx,R,maxW){
  // returns {h, draw(x center,y top)}
  const p=S.product;const h=R.word;
  if(p==='none')return null;
  let parts=[];
  if(p==='versiflex'||p==='max'){const im=imgs.versiflex;if(im){const w=h*im.width/im.height;parts.push({kind:'img',im,w,h})}}
  if(p==='max'){ctx.font=F(700,h*0.92);parts.push({kind:'txt',t:'MAX',w:ctx.measureText('MAX').width,h:h*0.92,gap:h*0.28})}
  if(p==='sublijet'){const im=imgs.sublijet;if(im){const hh=h*1.32;parts.push({kind:'img',im,w:hh*im.width/im.height,h:hh,top:-h*0.05})}}
  if(p==='truesub'){ctx.font=F(700,h*1.02);parts.push({kind:'txt',t:'TrueSub',w:ctx.measureText('TrueSub').width,h:h*1.02})}
  let total=parts.reduce((a,b)=>a+b.w+(b.gap||0),0);
  const sc=total>maxW?maxW/total:1;
  return {h:h*sc,draw(cx,y){
    ctx.save();let x=cx-total*sc/2;
    for(const pt of parts){
      x+=(pt.gap||0)*sc;
      if(pt.kind==='img'){ctx.drawImage(pt.im,x,y+(pt.top||0)*sc,pt.w*sc,pt.h*sc)}
      else{ctx.font=F(700,pt.h*sc);ctx.fillStyle='#fff';ctx.textBaseline='alphabetic';ctx.textAlign='left';ctx.fillText(pt.t,x,y+h*sc*0.97)}
      x+=pt.w*sc;
    }
    ctx.restore();
  }};
}

const SCALE_KEYS={eye:'eye',mark:'mark',logo:'logo',meta:'meta',learn:'learn',word:'word',body:'body',booth:'bt'};
function layout(ctx,R0,stage,W,H){
  R0=Object.assign({},R0);const sc=S.scale||{};
  for(const k in SCALE_KEYS)R0[SCALE_KEYS[k]]*=((sc[k]??100)/100);
  // Try the ratio's full sizes; shrink uniformly only if the stack would not fit.
  for(let s=1;s>=0.6;s-=0.03){
    const R={};for(const k in R0)R[k]=typeof R0[k]==='number'&&!['H','bl'].includes(k)?R0[k]*s:R0[k];
    R.pad=R0.pad;R.side=R0.side;
    const L=measure(ctx,R,stage,W,H);
    const minGap=H*0.03;
    if(L.used+minGap*(L.groups.length+1)<=H-R.pad*2||s<=0.61)return L;
  }
}
function measure(ctx,R,stage,W,H){
  const maxW=W-R.side*2;const L={R,maxW};
  L.head=fill(stage.st.head,stage);
  L.eyeSize=fitFont(ctx,L.head,500,R.eye,maxW,R.eye*0.55);
  const markIm=imgs.mark;L.markH=R.mark;L.markW=markIm?R.mark*markIm.width/markIm.height:0;
  ctx.font=F(500,L.eyeSize);L.headW=ctx.measureText(L.head).width;
  L.arcR=W*0.62;L.sag=S.arch?L.arcR*(1-Math.cos(Math.min(1.2,L.headW/2/L.arcR))):0;
  L.g1=L.eyeSize*1.05+L.sag+R.eye*0.55+L.markH;
  L.metaTxt=[S.city.trim(),dateLine()].filter(Boolean).join('  |  ');
  L.metaSize=L.metaTxt?fitFont(ctx,L.metaTxt,700,R.meta,maxW,R.meta*0.55):0;
  L.logoH=R.logo;
  L.g2=L.logoH+(L.metaTxt?R.meta*0.75+L.metaSize*1.15:0);
  const showProduct=stage.st.product&&S.product!=='none';
  L.pb=showProduct?productBlock(ctx,R,maxW):null;
  L.lead=S.lead.trim();
  L.g3=L.pb?((L.lead?R.learn*1.15+R.learn*0.3:0)+L.pb.h):0;
  L.bodyTxt=fill(stage.st.body,stage);/*book*/L.bodySize=R.body;L.lines=[];
  if(L.bodyTxt){ctx.font=F(400,L.bodySize);L.lines=wrap(ctx,L.bodyTxt,maxW*0.94);while(L.lines.length>R.bl&&L.bodySize>R.body*0.6){L.bodySize-=1;ctx.font=F(400,L.bodySize);L.lines=wrap(ctx,L.bodyTxt,maxW*0.94)}}
  L.g4=L.lines.length?L.lines.length*L.bodySize*1.36:0;
  L.boothTxt=S.booth.trim()?`Booth ${S.booth.trim()}`:'';
  L.boothSize=L.boothTxt?fitFont(ctx,L.boothTxt,500,R.bt,maxW,R.bt*0.6):0;
  L.g5=L.boothTxt?L.boothSize*1.05:0;
  L.groups=[L.g1,L.g2,L.g3,L.g4,L.g5].filter(v=>v>0);
  L.used=L.groups.reduce((a,b)=>a+b,0);
  return L;
}

function render(canvas,R0,stage){
  const W=1080,H=R0.H;canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');ctx.imageSmoothingQuality='high';
  ctx.clearRect(0,0,W,H);drawBg(ctx,W,H);
  ctx.textAlign='center';ctx.textBaseline='top';
  const L=layout(ctx,R0,stage,W,H);const R=L.R;
  const n=L.groups.length;
  const units=Math.max(1,(n-1)+2);              // gaps before and after the logo group count double
  const free=H-R.pad*2-L.used;
  const g=Math.min(Math.max(H*0.022,free/units),H*0.07);
  let y=(H-(L.used+g*units))/2;
  const G=(i)=>i<=1?g*2:g;                       // gap after group i

  // 1. headline + logomark (Bold header)
  ctx.font=F(500,L.eyeSize);ctx.fillStyle='#fff';
  if(S.arch){
    // set each glyph along a circle at its natural advance (no added letter-spacing)
    const r=L.arcR,base=y+L.eyeSize*0.8,cy=base+r;
    let a=-L.headW/2/r;ctx.save();ctx.textBaseline='alphabetic';ctx.textAlign='center';
    for(const ch of [...L.head]){const w=ctx.measureText(ch).width;const m=a+w/2/r;
      ctx.save();ctx.translate(W/2+r*Math.sin(m),cy-r*Math.cos(m));ctx.rotate(m);ctx.fillText(ch,0,0);ctx.restore();a+=w/r}
    ctx.restore();
  }else ctx.fillText(L.head,W/2,y);
  if(imgs.mark)ctx.drawImage(imgs.mark,W/2-L.markW/2,y+L.eyeSize*1.05+L.sag+R.eye*0.55,L.markW,L.markH);
  y+=L.g1+G(0);

  // 2. splash + show logo (panel optional) + location/date (Medium subhead)
  const zoneH=L.logoH,zoneY=y;
  if(S.splashOn&&imgs.splashCur){
    const sp=imgs.splashCur;const k=(S.splashSize||100)/100;
    const sh=R.splash*k,sw=sh*sp.width/sp.height;
    ctx.save();ctx.translate(W/2,zoneY+zoneH/2);ctx.rotate(5*Math.PI/180);ctx.drawImage(sp,-sw/2,-sh/2,sw,sh);ctx.restore();
  }
  const panel=!!S.panel;
  const cardW=panel?Math.min(L.maxW,zoneH*3.2):L.maxW,cardX=W/2-cardW/2;
  if(panel){rr(ctx,cardX,zoneY,cardW,zoneH,zoneH*0.09);ctx.fillStyle='#fff';ctx.fill()}
  const ip=panel?zoneH*0.13:0;
  if(imgs.logo){
    const lw=cardW-ip*2,lh=zoneH-ip*2,lg=imgs.logo;const sc=Math.min(lw/lg.width,lh/lg.height);
    ctx.drawImage(lg,W/2-lg.width*sc/2,zoneY+zoneH/2-lg.height*sc/2,lg.width*sc,lg.height*sc);
  }else{
    const name=S.show.trim()||'Show Name';ctx.fillStyle=panel?INK:'#fff';
    const box=cardW-ip*2;let fs=zoneH*(panel?0.42:0.7);ctx.font=F(700,fs);let ls=wrap(ctx,name,box);
    while((ls.length>2||ls.some(l=>ctx.measureText(l).width>box))&&fs>14){fs-=2;ctx.font=F(700,fs);ls=wrap(ctx,name,box)}
    const th=ls.length*fs*1.08;let ty=zoneY+zoneH/2-th/2;
    for(const l of ls){ctx.fillText(l,W/2,ty+fs*0.04);ty+=fs*1.08}
  }
  if(L.metaTxt){ctx.fillStyle='#fff';ctx.font=F(700,L.metaSize);ctx.fillText(L.metaTxt,W/2,zoneY+zoneH+R.meta*0.75)}
  y+=L.g2+G(1);

  // 3. lead-in (Medium) + product wordmark
  if(L.pb){
    if(L.lead){ctx.font=F(700,R.learn);ctx.fillStyle='#fff';ctx.fillText(L.lead,W/2,y);y+=R.learn*1.15+R.learn*0.3}
    L.pb.draw(W/2,y);y+=L.pb.h+g;
  }
  // 4. body (Book)
  if(L.lines.length){ctx.font=F(400,L.bodySize);ctx.fillStyle='#fff';for(const l of L.lines){ctx.fillText(l,W/2,y);y+=L.bodySize*1.36}y+=g}
  // 5. booth: plain Bold white type, like the original template
  if(L.boothTxt){ctx.font=F(500,L.boothSize);ctx.fillStyle='#fff';ctx.fillText(L.boothTxt,W/2,y)}
}

/* ---------- UI build ---------- */
function bindText(id,key,after){const el=$(id);el.value=S[key]??'';el.addEventListener('input',()=>{S[key]=el.value;S.example=false;after&&after();changed()})}
bindText('show','show');bindText('city','city');bindText('booth','booth');
bindText('start','start');bindText('end','end');bindText('lead','lead');
bindText('pitch','pitch',()=>{S.pitchEdited=true});
const dO=$('daysOut');dO.value=S.daysOut;dO.addEventListener('input',()=>{S.daysOut=Math.max(1,parseInt(dO.value)||1);changed(true)});

const sel=$('product');PRODUCTS.forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=p.name;sel.appendChild(o)});
sel.value=S.product;
sel.addEventListener('change',()=>{S.product=sel.value;const p=PRODUCTS.find(x=>x.id===S.product);if(!S.pitchEdited){S.pitch=p.pitch;$('pitch').value=S.pitch}changed()});

const swWrap=$('swatches');
GRADS.forEach(g=>{const b=document.createElement('button');b.type='button';b.className='sw';b.title=g.name;b.setAttribute('aria-label',g.name);
  b.style.background=g.img?`center/cover url(${ASSETS.vfbg})`:`linear-gradient(180deg,${g.a},${g.b})`;
  b.addEventListener('click',()=>{S.grad=g.id;changed()});b.dataset.id=g.id;swWrap.appendChild(b)});


$('splashOn').checked=!!S.splashOn;$('splashOn').addEventListener('change',e=>{S.splashOn=e.target.checked;changed()});
$('archOn').checked=!!S.arch;$('archOn').addEventListener('change',e=>{S.arch=e.target.checked;changed()});
$('panelOn').checked=!!S.panel;$('panelOn').addEventListener('change',e=>{S.panel=e.target.checked;changed()});
const SLIDERS=[['eye','Headline'],['mark','Logomark'],['logo','Show logo'],['meta','Location and date'],['learn','Lead-in'],['word','Product logo'],['body','Body line'],['booth','Booth'],['splash','Ink splash']];
function buildSliders(){
  const box=$('sliders');box.innerHTML='';
  SLIDERS.forEach(([k,label])=>{
    const row=document.createElement('label');row.className='sl';
    const val=k==='splash'?S.splashSize:S.scale[k];
    row.innerHTML=`<span>${label}</span><input type="range" id="size-${k}" min="50" max="200" step="5" aria-label="${label} size"><output>${val}%</output>`;
    const inp=row.querySelector('input'),out=row.querySelector('output');inp.value=val;
    inp.addEventListener('input',()=>{const v=Number(inp.value);if(k==='splash')S.splashSize=v;else S.scale[k]=v;out.textContent=v+'%';changed()});
    box.appendChild(row);
  });
}
buildSliders();
$('resetSizes').addEventListener('click',()=>{Object.keys(S.scale).forEach(k=>S.scale[k]=100);S.splashSize=100;buildSliders();changed()});

function buildStages(){
  const box=$('stages');box.innerHTML='';
  STAGE_DEFS.forEach(def=>{
    const st=S.stages[def.id];
    const d=document.createElement('div');d.className='stage'+(st.on?'':' off');
    d.innerHTML=`<div class="hd"><label><input type="checkbox" id="st-${def.id}-on"> ${def.name}</label><span class="when">${def.when}</span></div>
      <input type="text" id="st-${def.id}-head" aria-label="${def.name} headline" placeholder="Headline">
      <input type="text" id="st-${def.id}-body" aria-label="${def.name} body line" placeholder="Body line (optional)">
      <label class="mini"><input type="checkbox" id="st-${def.id}-prod"> Show product block</label>
      ${def.id==='mid'?'<p class="hint">Repeats for every day between Day 1 and the last day.</p>':''}`;
    const on=d.querySelector(`#st-${def.id}-on`),h=d.querySelector(`#st-${def.id}-head`),b=d.querySelector(`#st-${def.id}-body`),p=d.querySelector(`#st-${def.id}-prod`);
    on.checked=st.on;h.value=st.head;b.value=st.body;p.checked=st.product;
    on.addEventListener('change',()=>{st.on=on.checked;d.classList.toggle('off',!st.on);changed(true)});
    h.addEventListener('input',()=>{st.head=h.value;changed()});
    b.addEventListener('input',()=>{st.body=b.value;changed()});
    p.addEventListener('change',()=>{st.product=p.checked;changed()});
    box.appendChild(d);
  });
}
buildStages();
$('resetCopy').addEventListener('click',()=>{STAGE_DEFS.forEach(s=>{const st=S.stages[s.id];st.head=s.head;st.body=s.body;st.product=s.product});S.lead='Learn About';$('lead').value=S.lead;S.pitchEdited=false;S.pitch=PRODUCTS.find(x=>x.id===S.product).pitch;$('pitch').value=S.pitch;buildStages();changed()});

/* uploads */
function readFile(f){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f)})}
$('logoBtn').addEventListener('click',()=>$('logoFile').click());
$('logoFile').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;S.logo=await readFile(f);S.logoName=f.name;imgs.logo=await loadImg(S.logo);e.target.value='';changed()});
$('logoClear').addEventListener('click',()=>{S.logo=null;S.logoName='';imgs.logo=null;changed()});
$('splashBtn').addEventListener('click',()=>$('splashFile').click());
$('splashFile').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;S.splash=await readFile(f);imgs.splashCur=await loadImg(S.splash);e.target.value='';changed()});
$('splashReset').addEventListener('click',()=>{S.splash=null;imgs.splashCur=imgs.splash;changed()});

$('fontBtn').addEventListener('click',()=>$('fontFile').click());
$('fontFile').addEventListener('change',async e=>{
  const files=[...e.target.files];let n=0;
  for(const f of files){const nm=f.name.toLowerCase();const w=nm.includes('bold')?700:nm.includes('medium')?500:400;
    try{const ff=new FontFace('SG Benton Sans',await f.arrayBuffer(),{weight:String(w)});await ff.load();document.fonts.add(ff);n++}catch(err){}}
  if(n){fontFamily='"SG Benton Sans","Helvetica Neue",Helvetica,Arial,sans-serif';$('fontStatus').textContent=`Benton Sans loaded (${n} file${n>1?'s':''}). Fonts load per session, so reload them next time.`;changed()}
  else $('fontStatus').textContent='Those files could not be read as fonts. Try .otf or .ttf.';
  e.target.value='';
});

/* tabs + previews */
function buildTabs(){
  const list=stageList();const t=$('tabs');t.innerHTML='';
  if(!list.find(s=>s.key===active))active=list[0]?.key||'';
  list.forEach(s=>{const b=document.createElement('button');b.type='button';b.className='tab';b.role='tab';b.textContent=s.label;b.setAttribute('aria-selected',String(s.key===active));
    b.addEventListener('click',()=>{active=s.key;buildTabs();draw()});t.appendChild(b)});
  const rs=RATIOS.filter(r=>S.ratios[r.id]).length;
  $('pkgCount').textContent=`Package: ${list.length} stor${list.length===1?'y':'ies'}, one 1080 × 1920 PNG each`;
}
function draw(){
  const pv=$('previews');pv.innerHTML='';
  const st=stageList().find(s=>s.key===active);
  const rs=RATIOS.filter(r=>S.ratios[r.id]);
  if(!st||!rs.length){pv.innerHTML='<p class="empty">Turn on at least one stage and one size to see a preview.</p>';return}
  rs.forEach(r=>{const fig=document.createElement('figure');fig.className='r'+r.id;const c=document.createElement('canvas');c.setAttribute('aria-label',`${st.label} at ${r.label}`);
    fig.appendChild(c);const cap=document.createElement('figcaption');cap.textContent=`${r.label} · 1080×${r.H}`;fig.appendChild(cap);pv.appendChild(fig);render(c,r,st)});
}
function syncUI(){
  document.querySelectorAll('.sw').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===S.grad)));
  const g=GRADS.find(x=>x.id===S.grad);$('swName').textContent=g.name;$('contrastWarn').hidden=!g.low;
  const p=PRODUCTS.find(x=>x.id===S.product);$('productWarn').hidden=!p.warn;$('productWarn').textContent=p.warn||'';
  $('logoName').textContent=S.logo?S.logoName||'Logo loaded':'No logo yet. The show name stands in for it.';$('logoClear').hidden=!S.logo;
  $('splashReset').hidden=!S.splash;
  $('exampleChip').hidden=!S.example;
  const dl=dateLine();const n=showDays();$('datePreview').textContent=dl?`Reads as “${dl}” · ${n} show day${n>1?'s':''}`:'Add the first day to set the date line.';
}
let raf;
function changed(rebuildTabs){syncUI();save();buildTabs();cancelAnimationFrame(raf);raf=requestAnimationFrame(draw)}

/* export */
let downloads=null;
function slug(s){return (s||'show').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'show'}
function toBlob(c){return new Promise(r=>c.toBlob(r,'image/png'))}
async function exportStages(list){
  const rs=RATIOS.filter(r=>S.ratios[r.id]);
  if(!downloads){$('status').textContent='Downloads are not available in this browser.';return}
  if(!list.length||!rs.length){$('status').textContent='Nothing to export. Turn on a stage and a size.';return}
  const btns=[$('exportOne'),$('exportAll')];btns.forEach(b=>b.disabled=true);
  try{
    $('status').textContent='Rendering…';
    const zip=new JSZip();const base=slug(S.show);
    const c=document.createElement('canvas');let i=0;
    for(const st of list){const sk=slug(st.label.replace(/\(.*\)/,''));for(const r of rs){render(c,r,st);i++;const b=await toBlob(c);zip.file(`${base}/${String(list.indexOf(st)+1).padStart(2,'0')}_${base}_${sk}.png`,b)}}
    const blob=await zip.generateAsync({type:'blob'});
    const name=list.length===1?`${base}_${slug(list[0].label.replace(/\(.*\)/,''))}.zip`:`${base}_stories.zip`;
    $('status').textContent=`Saving ${i} PNGs…`;
    await downloads.save({filename:name,data:blob});
    $('status').textContent=`Saved ${name}`;
  }catch(err){
    const code=err&&err.code;
    $('status').textContent=code==='declined'?'Download cancelled.':code==='rate_limited'?'A save prompt is already open.':'Export failed. Try again.';
  }finally{btns.forEach(b=>b.disabled=false)}
}
/* views */
try{document.querySelector('.t-trade').style.backgroundImage=`url(${ASSETS.vfbg})`}catch(e){}
function show(view){['home','tradeshow','pr','holiday','words'].forEach(v=>$(v).hidden=v!==view);window.scrollTo(0,0);if(view==='tradeshow')draw();if(view==='pr')prDraw();if(view==='holiday')holDraw();if(view==='words')iywDraw()}
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{show(b.dataset.go);try{history.replaceState(null,'','#'+b.dataset.go)}catch(e){}}));
[$('backHome'),...document.querySelectorAll('[data-home]')].forEach(b=>b.addEventListener('click',()=>{show('home');try{history.replaceState(null,'','#home')}catch(e){}}));
$('exportAll').addEventListener('click',()=>exportStages(stageList()));
$('exportOne').addEventListener('click',()=>exportStages(stageList().filter(s=>s.key===active)));

/* ================= PR Hit Stories ================= */
const PR_DEFAULT={pub:'Ink World',logo:null,logoName:'',panel:true,featOn:true,quoteOn:true,
  label:'Featured In',head:'Sawgrass Leads Way in Sublimation Ink, Printing Market',byline:'By David Savastano, Editor',
  quote:"Decorators shouldn't have to choose between capability and ease of use. When the printer, ink and software are designed to work together, you stop thinking about the equipment. You just make things.",
  grad:'bp',ink:'white',glow:false,mark:true,guide:true,example:true,
  scale:{logo:100,label:100,head:100,byline:100,quote:100}};
S.pr=Object.assign(structuredClone(PR_DEFAULT),S.pr||{});S.pr.scale=Object.assign({},PR_DEFAULT.scale,S.pr.scale||{});
const P=S.pr;
const tinted={};
function tint(im,color){const k=color;if(tinted[k])return tinted[k];const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);x.globalCompositeOperation='source-in';x.fillStyle=color;x.fillRect(0,0,c.width,c.height);tinted[k]=c;return c}
function smartQuote(q){q=q.trim().replace(/^["“”']+|["“”']+$/g,'');return q?`“${q}”`:''}

function prLogo(ctx,x,y,maxW,maxH,align,ink){
  // returns drawn height; align 'center' | 'left'
  const pad=P.panel?maxH*0.16:0;
  let w,h,draw;
  if(imgs.prLogo){
    const lg=imgs.prLogo;const sc=Math.min((maxW-pad*2)/lg.width,(maxH-pad*2)/lg.height);
    w=lg.width*sc;h=lg.height*sc;draw=(dx,dy)=>ctx.drawImage(lg,dx,dy,w,h);
  }else{
    const name=P.pub.trim()||'Publication';let fs=maxH*0.62;ctx.font=F(700,fs);
    while(ctx.measureText(name).width>maxW-pad*2&&fs>14){fs-=2;ctx.font=F(700,fs)}
    w=ctx.measureText(name).width;h=fs*0.95;
    draw=(dx,dy)=>{ctx.save();ctx.font=F(700,fs);ctx.fillStyle=P.panel?INK:ink;ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(name,dx,dy-fs*0.04);ctx.restore()};
  }
  const bw=w+pad*2,bh=h+pad*2;const bx=align==='center'?x-bw/2:x;
  if(P.panel){rr(ctx,bx,y,bw,bh,Math.min(bh*0.14,24));ctx.fillStyle='#fff';ctx.fill()}
  draw(bx+pad,y+pad);
  return bh;
}

function prRender(canvas,kind,guide){
  const W=1080,H=1920;canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');ctx.imageSmoothingQuality='high';
  drawBg(ctx,W,H,P.grad);
  if(P.glow){const g=ctx.createLinearGradient(0,0,0,H*0.31);g.addColorStop(0,'rgba(255,255,255,0.55)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H*0.31)}
  const ink=P.ink==='black'?INK:'#fff';const sc=k=>(P.scale[k]??100)/100;
  const divY=1359,limit=P.mark?divY-70:1500;
  // footer: divider + Sawgrass wordmark (solid color, like the Canva file)
  if(P.mark){
    ctx.fillStyle=ink;ctx.fillRect(140,divY,800,3);
    if(imgs.sawgrass){const im=tint(imgs.sawgrass,ink);const h=48,w=h*im.width/im.height;ctx.drawImage(im,W/2-w/2,1450,w,h)}
  }
  ctx.textBaseline='top';ctx.fillStyle=ink;
  if(kind==='feature'){
    let y=175;
    const label=P.label.trim();
    if(label){const ls=56*sc('label');ctx.font=F(500,ls);ctx.textAlign='center';ctx.fillText(label,W/2,y);y+=ls*1.45}
    y+=prLogo(ctx,W/2,y,800,200*sc('logo'),'center',ink)+80;
    // headline + byline fit the space above the divider
    const head=P.head.trim(),by=P.byline.trim();
    let hs=88*sc('head'),bs=47*sc('byline'),hl=[],bl=[];
    const fit=()=>{ctx.font=F(700,hs);hl=head?wrap(ctx,head,900):[];ctx.font=F(400,bs);bl=by?wrap(ctx,by,880):[];
      return hl.length*hs*1.26+(bl.length?60+bl.length*bs*1.4:0)};
    let tot=fit();while(y+tot>limit&&hs>40){hs-=2;bs=Math.max(30,bs-1);tot=fit()}
    ctx.textAlign='center';ctx.fillStyle=ink;
    ctx.font=F(700,hs);for(const l of hl){ctx.fillText(l,W/2,y);y+=hs*1.26}
    if(bl.length){y+=60;ctx.font=F(400,bs);for(const l of bl){ctx.fillText(l,W/2,y);y+=bs*1.4}}
  }else{
    const x0=140,maxW=800;let y=245;
    y+=prLogo(ctx,x0,y,560,130*sc('logo'),'left',ink)+90;
    const q=smartQuote(P.quote);let qs=55*sc('quote'),ql=[];
    const fit=()=>{ctx.font=F(400,qs);ql=q?wrap(ctx,q,maxW):[];return ql.length*qs*1.55};
    while(y+fit()>limit&&qs>30)qs-=1;
    ctx.textAlign='left';ctx.fillStyle=ink;ctx.font=F(400,qs);
    for(const l of ql){ctx.fillText(l,x0,y);y+=qs*1.55}
  }
  if(guide){
    ctx.save();ctx.setLineDash([16,12]);ctx.lineWidth=4;ctx.strokeStyle=P.ink==='black'?'rgba(16,25,33,.55)':'rgba(255,255,255,.75)';
    rr(ctx,W/2-260,1580,520,120,60);ctx.stroke();ctx.setLineDash([]);
    ctx.font=F(500,34);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=ctx.strokeStyle;ctx.fillText('Read More sticker',W/2,1640);ctx.restore();
  }
}
function prStories(){const o=[];if(P.featOn)o.push({key:'feature',label:'Feature'});if(P.quoteOn)o.push({key:'quote',label:'Quote'});return o}
function prDraw(){
  const pv=$('prPreviews');pv.innerHTML='';const list=prStories();
  if(!list.length){pv.innerHTML='<p class="empty">Turn on the feature or quote story to see a preview.</p>';return}
  list.forEach(s=>{const fig=document.createElement('figure');const c=document.createElement('canvas');c.setAttribute('aria-label',`${s.label} story`);fig.appendChild(c);
    const cap=document.createElement('figcaption');cap.textContent=`${s.label} · 1080×1920`;fig.appendChild(cap);pv.appendChild(fig);prRender(c,s.key,P.guide)});
}
function prSync(){
  document.querySelectorAll('#prSwatches .sw').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===P.grad)));
  const g=GRADS.find(x=>x.id===P.grad)||GRADS[0];$('prSwName').textContent=g.name;
  $('prInkWarn').hidden=P.ink!=='black';
  $('prLogoName').textContent=P.logo?(P.logoName||'Logo loaded'):'No logo yet. The publication name stands in for it.';$('prLogoClear').hidden=!P.logo;
  $('prExample').hidden=!P.example;
  const words=P.quote.trim()?P.quote.trim().split(/\s+/).length:0;$('prQuoteCount').textContent=`${words} words`;
}
let prRaf;function prChanged(){prSync();save();cancelAnimationFrame(prRaf);prRaf=requestAnimationFrame(prDraw)}
function prBind(id,key,ev){const el=$(id);if(el.type==='checkbox'){el.checked=!!P[key];el.addEventListener('change',()=>{P[key]=el.checked;prChanged()})}
  else{el.value=P[key]??'';el.addEventListener(ev||'input',()=>{P[key]=el.value;if(['pub','head','byline','quote','label'].includes(key))P.example=false;prChanged()})}}
[['prPub','pub'],['prLabel','label'],['prHead','head'],['prByline','byline'],['prQuote','quote'],['prPanel','panel'],['prFeatOn','featOn'],['prQuoteOn','quoteOn'],['prGlow','glow'],['prMark','mark'],['prGuide','guide']].forEach(([i,k])=>prBind(i,k));
prBind('prInk','ink','change');
GRADS.forEach(g=>{const b=document.createElement('button');b.type='button';b.className='sw';b.title=g.name;b.setAttribute('aria-label',g.name);
  b.style.background=g.img?`center/cover url(${ASSETS.vfbg})`:`linear-gradient(180deg,${g.a},${g.b})`;b.dataset.id=g.id;
  b.addEventListener('click',()=>{P.grad=g.id;prChanged()});$('prSwatches').appendChild(b)});
const PR_SLIDERS=[['logo','Publication logo'],['label','Label'],['head','Headline'],['byline','Byline'],['quote','Quote']];
function prBuildSliders(){const box=$('prSliders');box.innerHTML='';PR_SLIDERS.forEach(([k,label])=>{const row=document.createElement('label');row.className='sl';
  row.innerHTML=`<span>${label}</span><input type="range" id="pr-size-${k}" min="50" max="200" step="5" aria-label="${label} size"><output>${P.scale[k]}%</output>`;
  const i=row.querySelector('input'),o=row.querySelector('output');i.value=P.scale[k];i.addEventListener('input',()=>{P.scale[k]=Number(i.value);o.textContent=i.value+'%';prChanged()});box.appendChild(row)})}
prBuildSliders();
$('prResetSizes').addEventListener('click',()=>{Object.keys(P.scale).forEach(k=>P.scale[k]=100);prBuildSliders();prChanged()});
$('prLogoBtn').addEventListener('click',()=>$('prLogoFile').click());
$('prLogoFile').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;P.logo=await readFile(f);P.logoName=f.name;imgs.prLogo=await loadImg(P.logo);e.target.value='';prChanged()});
$('prLogoClear').addEventListener('click',()=>{P.logo=null;P.logoName='';imgs.prLogo=null;prChanged()});
$('prExport').addEventListener('click',async()=>{
  const list=prStories();const st=$('prStatus');
  if(!downloads){st.textContent='Downloads are not available in this browser.';return}
  if(!list.length){st.textContent='Nothing to export. Turn on a story.';return}
  const btn=$('prExport');btn.disabled=true;
  try{
    st.textContent='Rendering…';const zip=new JSZip();const base=slug(P.pub)+'_pr';const c=document.createElement('canvas');
    for(const [i,s] of list.entries()){prRender(c,s.key,false);zip.file(`${base}/${String(i+1).padStart(2,'0')}_${base}_${s.key}.png`,await toBlob(c))}
    const blob=await zip.generateAsync({type:'blob'});const name=`${base}_stories.zip`;
    await downloads.save({filename:name,data:blob});st.textContent=`Saved ${name}`;
  }catch(err){const code=err&&err.code;st.textContent=code==='declined'?'Download cancelled.':code==='rate_limited'?'A save prompt is already open.':'Export failed. Try again.'}
  finally{btn.disabled=false}
});

/* ================= Holiday Closure Stories ================= */
const HOL_COPY={p1:'{team} will be out of the office {closed}.',p2:"We’ll return to normal hours on {return}.",p3:"While we’re away, our online resources are available anytime at care.sawgrassink.com.",sign:'Thank you!'};
const HOL_DEFAULT=Object.assign({layout:'hours',head:'Holiday Hours',headEdited:false,teamPick:'Our Global Care Teams',team:'',
  start:'2026-12-24',end:'2026-12-26',back:'2026-12-29',grad:'po',word:true,mark:true,img:null,
  scale:{logo:100,head:100,body:100,sign:100,img:100}},HOL_COPY);
S.hol=Object.assign(structuredClone(HOL_DEFAULT),S.hol||{});S.hol.scale=Object.assign({},HOL_DEFAULT.scale,S.hol.scale||{});
const Hh=S.hol;
const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const longDate=(d,yr)=>`${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}${yr?', '+d.getFullYear():''}`;
function holTokens(){
  const a=pd(Hh.start),b=pd(Hh.end),r=pd(Hh.back);
  const team=(Hh.teamPick==='custom'?Hh.team:Hh.teamPick).trim()||'Our team';
  let closed='';
  if(a&&b&&b>a){const sameYr=a.getFullYear()===b.getFullYear();closed=`from ${longDate(a,!sameYr)} through ${longDate(b,true)}`}
  else if(a)closed=`on ${longDate(a,true)}`;
  return {team,closed,ret:r?longDate(r,true):''};
}
function holFill(t){const k=holTokens();return String(t||'').replaceAll('{team}',k.team).replaceAll('{closed}',k.closed).replaceAll('{return}',k.ret).replace(/\s+/g,' ').replace(/\s+\./g,'.').trim()}
function wrapPara(ctx,text,maxW){return text?wrap(ctx,text,maxW):[]}

function holRender(canvas,guide){
  const W=1080,H=1920;canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');ctx.imageSmoothingQuality='high';
  drawBg(ctx,W,H,Hh.grad);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='top';
  const sc=k=>(Hh.scale[k]??100)/100;
  const head=Hh.head.trim();
  if(Hh.layout==='hours'){
    // Sawgrass logo, Bold headline, Book paragraphs, Medium sign-off, logomark
    let ls=sc('logo'),hs=100*sc('head'),bs=52*sc('body'),ss=85*sc('sign');
    const paras=[holFill(Hh.p1),holFill(Hh.p2),holFill(Hh.p3)].filter(Boolean);const sign=Hh.sign.trim();
    let blocks;
    const build=()=>{
      ctx.font=F(400,bs);const pl=paras.map(p=>wrapPara(ctx,p,880));
      ctx.font=F(700,hs);const hl=head?wrap(ctx,head,940):[];
      const wordH=Hh.word&&imgs.sawgrass?94*ls:0,markH=Hh.mark&&imgs.mark?117*ls:0;
      const paraH=pl.reduce((a,l)=>a+l.length*bs*1.4,0)+Math.max(0,pl.length-1)*bs*1.0;
      blocks={pl,hl,wordH,markH,paraH};
      return [wordH,hl.length*hs*1.2,paraH,sign?ss*1.2:0,markH];
    };
    let parts=build();const gaps=[45,140,120,90];
    const total=()=>parts.reduce((a,b)=>a+b,0)+gaps.reduce((a,g,i)=>a+(parts[i]&&parts.slice(i+1).some(Boolean)?g:0),0);
    while(total()>1640&&bs>30){bs-=1;hs=Math.max(60,hs-1.5);ss=Math.max(50,ss-1);parts=build()}
    let y=Math.max(150,(H-total())/2-40);
    const step=i=>{y+=parts[i];if(parts[i]&&parts.slice(i+1).some(Boolean))y+=gaps[i]||0};
    if(blocks.wordH){const im=imgs.sawgrass,h=blocks.wordH,w=h*im.width/im.height;ctx.drawImage(im,W/2-w/2,y,w,h)}step(0);
    ctx.font=F(700,hs);let yy=y;for(const l of blocks.hl){ctx.fillText(l,W/2,yy);yy+=hs*1.2}step(1);
    ctx.font=F(400,bs);yy=y;blocks.pl.forEach((ls_,i)=>{for(const l of ls_){ctx.fillText(l,W/2,yy);yy+=bs*1.4}yy+=bs*1.0});step(2);
    if(sign){ctx.font=F(500,ss);ctx.fillText(sign,W/2,y)}step(3);
    if(blocks.markH){const im=imgs.mark,h=blocks.markH,w=h*im.width/im.height;ctx.drawImage(im,W/2-w/2,y,w,h)}
  }else{
    // Closure: logomark, very large Bold headline, short Book line, photo bleeding off the bottom
    let y=135;
    if(imgs.mark){const h=150*sc('logo'),w=h*imgs.mark.width/imgs.mark.height;ctx.drawImage(imgs.mark,W/2-w/2,y,w,h);y+=h+50}
    let hs=183*sc('head');ctx.font=F(700,hs);let hl=head?wrap(ctx,head,960):[];
    while(hl.some(l=>ctx.measureText(l).width>980)&&hs>80){hs-=4;ctx.font=F(700,hs);hl=wrap(ctx,head,960)}
    for(const l of hl){ctx.fillText(l,W/2,y);y+=hs*1.17}
    y+=30;
    const body=[holFill(Hh.p1),holFill(Hh.p2)].filter(Boolean).join(' ');
    const bs=43*sc('body');ctx.font=F(400,bs);for(const l of wrapPara(ctx,body,900)){ctx.fillText(l,W/2,y);y+=bs*1.4}
    const top=Math.max(y+40,800);
    if(imgs.holImg){
      const im=imgs.holImg;const w=W*1.55*sc('img'),h=w*im.height/im.width;
      const iy=Math.min(top,H-h*0.85);ctx.drawImage(im,W/2-w/2+W*0.18*sc('img'),iy,w,h);
    }else if(guide){
      ctx.save();ctx.setLineDash([16,12]);ctx.lineWidth=4;ctx.strokeStyle='rgba(255,255,255,.75)';rr(ctx,90,top,900,H-top-90,28);ctx.stroke();
      ctx.font=F(500,38);ctx.textBaseline='middle';ctx.fillStyle='rgba(255,255,255,.85)';ctx.fillText('Upload a photo',W/2,top+(H-top-90)/2);ctx.restore();
    }
  }
}
function holDraw(){const pv=$('holPreviews');pv.innerHTML='';const fig=document.createElement('figure');const c=document.createElement('canvas');c.setAttribute('aria-label','Holiday story');fig.appendChild(c);
  const cap=document.createElement('figcaption');cap.textContent=(Hh.layout==='hours'?'Holiday Hours':'Holiday Closure')+' · 1080×1920';fig.appendChild(cap);pv.appendChild(fig);holRender(c,true)}
function holSync(){
  document.querySelectorAll('input[name=holLayout]').forEach(r=>r.checked=r.value===Hh.layout);
  const hours=Hh.layout==='hours';
  $('holP3Wrap').hidden=!hours;$('holSignWrap').hidden=!hours;$('holWordWrap').hidden=!hours;$('holMarkWrap').hidden=!hours;$('holPhotoSec').hidden=hours;
  $('holTeam').hidden=Hh.teamPick!=='custom';
  document.querySelectorAll('#holSwatches .sw').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===Hh.grad)));
  $('holSwName').textContent=(GRADS.find(g=>g.id===Hh.grad)||GRADS[0]).name;
  $('holImgClear').hidden=!Hh.img;
  const k=holTokens();$('holDates').textContent=k.closed?`Reads as “out of the office ${k.closed}”${k.ret?`, back ${k.ret}`:''}.`:'Set the first closed day.';
}
let holRaf;function holChanged(){holSync();save();cancelAnimationFrame(holRaf);holRaf=requestAnimationFrame(holDraw)}
function holBind(id,key,ev,after){const el=$(id);if(el.type==='checkbox'){el.checked=!!Hh[key];el.addEventListener('change',()=>{Hh[key]=el.checked;holChanged()})}
  else{el.value=Hh[key]??'';el.addEventListener(ev||'input',()=>{Hh[key]=el.value;after&&after();holChanged()})}}
holBind('holHead','head','input',()=>{Hh.headEdited=true});
[['holTeam','team'],['holStart','start'],['holEnd','end'],['holBack','back'],['holP1','p1'],['holP2','p2'],['holP3','p3'],['holSign','sign'],['holWord','word'],['holMark','mark']].forEach(([i,k])=>holBind(i,k));
holBind('holTeamPick','teamPick','change');
document.querySelectorAll('input[name=holLayout]').forEach(r=>r.addEventListener('change',()=>{Hh.layout=r.value;
  if(!Hh.headEdited){Hh.head=Hh.layout==='hours'?'Holiday Hours':'Holiday Closure';$('holHead').value=Hh.head}holChanged()}));
$('holResetCopy').addEventListener('click',()=>{Object.assign(Hh,HOL_COPY);['p1','p2','p3','sign'].forEach(k=>$('hol'+(k==='sign'?'Sign':k.toUpperCase())).value=Hh[k]);
  Hh.headEdited=false;Hh.head=Hh.layout==='hours'?'Holiday Hours':'Holiday Closure';$('holHead').value=Hh.head;holChanged()});
GRADS.forEach(g=>{const b=document.createElement('button');b.type='button';b.className='sw';b.title=g.name;b.setAttribute('aria-label',g.name);
  b.style.background=g.img?`center/cover url(${ASSETS.vfbg})`:`linear-gradient(180deg,${g.a},${g.b})`;b.dataset.id=g.id;
  b.addEventListener('click',()=>{Hh.grad=g.id;holChanged()});$('holSwatches').appendChild(b)});
const HOL_SLIDERS=[['logo','Logos'],['head','Headline'],['body','Body copy'],['sign','Sign-off'],['img','Photo']];
function holBuildSliders(){const box=$('holSliders');box.innerHTML='';HOL_SLIDERS.forEach(([k,label])=>{const row=document.createElement('label');row.className='sl';
  row.innerHTML=`<span>${label}</span><input type="range" id="hol-size-${k}" min="50" max="200" step="5" aria-label="${label} size"><output>${Hh.scale[k]}%</output>`;
  const i=row.querySelector('input'),o=row.querySelector('output');i.value=Hh.scale[k];i.addEventListener('input',()=>{Hh.scale[k]=Number(i.value);o.textContent=i.value+'%';holChanged()});box.appendChild(row)})}
holBuildSliders();
$('holResetSizes').addEventListener('click',()=>{Object.keys(Hh.scale).forEach(k=>Hh.scale[k]=100);holBuildSliders();holChanged()});
$('holImgBtn').addEventListener('click',()=>$('holImgFile').click());
$('holImgFile').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;Hh.img=await readFile(f);imgs.holImg=await loadImg(Hh.img);e.target.value='';holChanged()});
$('holImgClear').addEventListener('click',()=>{Hh.img=null;imgs.holImg=null;holChanged()});
$('holExport').addEventListener('click',async()=>{
  const st=$('holStatus');if(!downloads){st.textContent='Downloads are not available in this browser.';return}
  const btn=$('holExport');btn.disabled=true;
  try{const c=document.createElement('canvas');holRender(c,false);const blob=await toBlob(c);
    const name=`${slug(Hh.head)}_${Hh.start||'story'}.png`;await downloads.save({filename:name,data:blob});st.textContent=`Saved ${name}`}
  catch(err){const code=err&&err.code;st.textContent=code==='declined'?'Download cancelled.':code==='rate_limited'?'A save prompt is already open.':'Export failed. Try again.'}
  finally{btn.disabled=false}
});

/* ================= In Your Words ================= */
const IYW_DEFAULT={grad:'yo',marks:true,word:true,example:true,active:0,
  items:[{quote:"I'm over the moon to be up and running thanks to you! You handled my situation with extreme professionalism, in a kind, understanding and caring manner. I truly can't thank you enough, Lauren.",name:'Sharron',role:'Sawgrass Customer'}],
  scale:{marks:100,quote:100,attr:100,logo:100}};
S.iyw=Object.assign(structuredClone(IYW_DEFAULT),S.iyw||{});S.iyw.scale=Object.assign({},IYW_DEFAULT.scale,S.iyw.scale||{});
const Q=S.iyw;if(!Q.items.length)Q.items.push({quote:'',name:'',role:'Sawgrass Customer'});
const stripQ=q=>q.trim().replace(/^["“”']+|["“”']+$/g,'').trim();

function iywRender(canvas,item){
  const W=1080,H=1920;canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');ctx.imageSmoothingQuality='high';
  drawBg(ctx,W,H,Q.grad);ctx.textBaseline='top';ctx.textAlign='left';
  const sc=k=>(Q.scale[k]??100)/100;const x0=128,maxW=844;
  // Sawgrass wordmark, fixed at the bottom
  const logoTop=1703;
  if(Q.word&&imgs.sawgrass){const h=69*sc('logo'),w=h*imgs.sawgrass.width/imgs.sawgrass.height;ctx.drawImage(imgs.sawgrass,W/2-w/2,logoTop+(69-h)/2,w,h)}
  // large quote marks at 33% white, top left
  let y=210;
  if(Q.marks){
    // quote marks artwork from the Canva file, drawn at 33% white
    const h=640*sc('marks');
    if(imgs.qmarks){const im=imgs.qmarks,w=h*im.width/im.height;ctx.save();ctx.globalAlpha=0.33;ctx.drawImage(im,x0-22,y-14,w,h);ctx.restore()}
    y+=h+77;
  }else y=440;
  // quote (Bold) + attribution rule and line (Book)
  const q=stripQ(item.quote||'');const attr=[item.name,item.role].map(s=>(s||'').trim()).filter(Boolean).join(', ');
  let qs=56.7*sc('quote'),as=48.5*sc('attr'),ql=[];
  const limit=Q.word?logoTop-120:1800;
  const fit=()=>{ctx.font=F(700,qs);ql=q?wrap(ctx,q,maxW):[];return ql.length*qs*1.4+(attr?as*0.9+as*1.3:0)};
  while(y+fit()>limit&&qs>34){qs-=1;as=Math.max(32,as-0.5)}
  ctx.fillStyle='#fff';ctx.font=F(700,qs);
  for(const l of ql){ctx.fillText(l,x0,y);y+=qs*1.4}
  if(attr){
    y+=as*0.9;const lineW=67*(as/48.5);ctx.fillRect(x0,y+as*0.62,lineW,5);
    ctx.font=F(400,as);ctx.fillText(attr,x0+lineW+21*(as/48.5),y);
  }
}
function iywDraw(){
  const t=$('iywTabs');t.innerHTML='';Q.active=Math.min(Q.active,Q.items.length-1);
  Q.items.forEach((it,i)=>{const b=document.createElement('button');b.type='button';b.className='tab';b.role='tab';
    b.textContent=(it.name||'').trim()||`Quote ${i+1}`;b.setAttribute('aria-selected',String(i===Q.active));
    b.addEventListener('click',()=>{Q.active=i;iywDraw()});t.appendChild(b)});
  const pv=$('iywPreviews');pv.innerHTML='';const fig=document.createElement('figure');const c=document.createElement('canvas');c.setAttribute('aria-label','Quote story');
  fig.appendChild(c);const cap=document.createElement('figcaption');cap.textContent=`Quote ${Q.active+1} of ${Q.items.length} · 1080×1920`;fig.appendChild(cap);pv.appendChild(fig);
  iywRender(c,Q.items[Q.active]);
}
function iywBuildList(){
  const box=$('iywList');box.innerHTML='';
  Q.items.forEach((it,i)=>{
    const d=document.createElement('div');d.className='stage';
    d.innerHTML=`<div class="hd"><b>Quote ${i+1}</b>${Q.items.length>1?`<button class="btn" type="button" style="font-size:12px;padding:3px 9px">Remove</button>`:''}</div>
      <textarea rows="5" aria-label="Quote ${i+1} text" style="font:inherit;font-size:13px;color:var(--fg);background:var(--panel);border:1px solid var(--line);border-radius:7px;padding:6px 9px;resize:vertical;min-width:0"></textarea>
      <div class="row"><input type="text" aria-label="Quote ${i+1} name" placeholder="Name"><input type="text" aria-label="Quote ${i+1} descriptor" placeholder="Sawgrass Customer"></div>
      <span class="hint"></span>`;
    const ta=d.querySelector('textarea'),[nm,rl]=d.querySelectorAll('input[type=text]'),hint=d.querySelector('.hint');
    const count=()=>{const n=stripQ(it.quote).split(/\s+/).filter(Boolean).length;hint.textContent=`${n} words${n>60?' · long, the type will shrink':''}`};
    ta.value=it.quote;nm.value=it.name;rl.value=it.role;count();
    const upd=()=>{it.quote=ta.value;it.name=nm.value;it.role=rl.value;Q.example=false;Q.active=i;count();iywChanged()};
    [ta,nm,rl].forEach(el=>el.addEventListener('input',upd));
    const rm=d.querySelector('.hd button');if(rm)rm.addEventListener('click',()=>{Q.items.splice(i,1);iywBuildList();iywChanged()});
    box.appendChild(d);
  });
}
function iywSync(){
  document.querySelectorAll('#iywSwatches .sw').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===Q.grad)));
  const g=GRADS.find(x=>x.id===Q.grad)||GRADS[0];$('iywSwName').textContent=g.name;$('iywWarn').hidden=!g.low;$('iywExample').hidden=!Q.example;
  $('iywMarks').checked=!!Q.marks;$('iywWord').checked=!!Q.word;
}
let iywRaf;function iywChanged(){iywSync();save();cancelAnimationFrame(iywRaf);iywRaf=requestAnimationFrame(iywDraw)}
$('iywAdd').addEventListener('click',()=>{Q.items.push({quote:'',name:'',role:'Sawgrass Customer'});Q.active=Q.items.length-1;iywBuildList();iywChanged()});
$('iywMarks').addEventListener('change',e=>{Q.marks=e.target.checked;iywChanged()});
$('iywWord').addEventListener('change',e=>{Q.word=e.target.checked;iywChanged()});
GRADS.forEach(g=>{const b=document.createElement('button');b.type='button';b.className='sw';b.title=g.name;b.setAttribute('aria-label',g.name);
  b.style.background=g.img?`center/cover url(${ASSETS.vfbg})`:`linear-gradient(180deg,${g.a},${g.b})`;b.dataset.id=g.id;
  b.addEventListener('click',()=>{Q.grad=g.id;iywChanged()});$('iywSwatches').appendChild(b)});
const IYW_SLIDERS=[['marks','Quote marks'],['quote','Quote'],['attr','Attribution'],['logo','Sawgrass logo']];
function iywBuildSliders(){const box=$('iywSliders');box.innerHTML='';IYW_SLIDERS.forEach(([k,label])=>{const row=document.createElement('label');row.className='sl';
  row.innerHTML=`<span>${label}</span><input type="range" id="iyw-size-${k}" min="50" max="200" step="5" aria-label="${label} size"><output>${Q.scale[k]}%</output>`;
  const i=row.querySelector('input'),o=row.querySelector('output');i.value=Q.scale[k];i.addEventListener('input',()=>{Q.scale[k]=Number(i.value);o.textContent=i.value+'%';iywChanged()});box.appendChild(row)})}
iywBuildSliders();iywBuildList();
$('iywResetSizes').addEventListener('click',()=>{Object.keys(Q.scale).forEach(k=>Q.scale[k]=100);iywBuildSliders();iywChanged()});
$('iywExport').addEventListener('click',async()=>{
  const st=$('iywStatus');if(!downloads){st.textContent='Downloads are not available in this browser.';return}
  const items=Q.items.filter(it=>stripQ(it.quote));if(!items.length){st.textContent='Add a quote first.';return}
  const btn=$('iywExport');btn.disabled=true;
  try{st.textContent='Rendering…';const c=document.createElement('canvas');const zip=new JSZip();
    for(const [i,it] of items.entries()){iywRender(c,it);zip.file(`in-your-words/${String(i+1).padStart(2,'0')}_${slug(it.name||'quote')}.png`,await toBlob(c))}
    const name='in-your-words_stories.zip';await downloads.save({filename:name,data:await zip.generateAsync({type:'blob'})});st.textContent=`Saved ${name}`}
  catch(err){const code=err&&err.code;st.textContent=code==='declined'?'Download cancelled.':code==='rate_limited'?'A save prompt is already open.':'Export failed. Try again.'}
  finally{btn.disabled=false}
});

/* boot */
(async function(){
  const keys=['mark','versiflex','sublijet','splash','vfbg','qmarks'];
  await Promise.all(keys.map(async k=>{imgs[k]=await loadImg(ASSETS[k])}));
  imgs.splashCur=imgs.splash;
  if(S.splash){const s=await loadImg(S.splash);if(s)imgs.splashCur=s}
  if(S.logo)imgs.logo=await loadImg(S.logo);
  try{await document.fonts.ready}catch(e){}
  changed(true);
  if(P.logo)imgs.prLogo=await loadImg(P.logo);
  imgs.sawgrass=await loadImg(ASSETS.sawgrass);prSync();
  if(Hh.img)imgs.holImg=await loadImg(Hh.img);holSync();iywSync();
  show(['#tradeshow','#pr','#holiday','#words'].includes(location.hash)?location.hash.slice(1):'home');
  // Standalone: save files with a normal browser download.
  downloads={save:async({filename,data})=>{const blob=data instanceof Blob?data:new Blob([data]);const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);return{status:'saved'}}};
})();
})();
