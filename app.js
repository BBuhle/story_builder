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
  {id:'9x16',label:'9:16',H:1920,pad:150,side:110,mark:90,eye:48,logo:220,meta:76,learn:76,word:113,body:45,bl:3,bt:61,splash:872,dealer:150},
  {id:'4x5',label:'4:5',H:1350,pad:88,side:96,mark:80,eye:46,logo:190,meta:62,learn:62,word:100,body:40,bl:2,bt:56,splash:720,dealer:120},
];
const ratioFor=st=>RATIOS.find(r=>r.id===(st.def.ratio||'9x16'))||RATIOS[0];
const STAGE_DEFS=[
  {id:'announce',name:'Announcement',when:'Pre-show',head:"We'll See You Soon!",body:'{pitch}',product:true},
  {id:'countdown',name:'Countdown',when:'Pre-show',head:'{days} Days to Go',body:'{pitch}',product:true},
  {id:'day1',name:'Day 1',when:'At show',head:'Day 1 Is Here',body:'Doors are open. Come find us on the floor.',product:true},
  {id:'mid',name:'Middle days',when:'At show',head:'Day {n} Is Here',body:'Live demos running all day. Come say hi.',product:true},
  {id:'last',name:'Last day',when:'At show',head:'Last Day to Visit',body:'Final chance to catch live demos at {show}.',product:true},
  {id:'thanks',name:'Thank you',when:'Post-show',head:'Thank You, {show}!',body:'Thanks to everyone who stopped by. See you next time.',product:false},
  {id:'feed',name:'Feed post (4:5)',when:'Post-show',head:'Thanks for Visiting Us',body:'Great seeing everyone at {show}. See you next time.',product:true,ratio:'4x5'},
];

const DEFAULT={
  show:'Printing United Expo',city:'Las Vegas, NV',booth:'C2591',start:'2026-11-04',end:'2026-11-06',
  product:'versiflex',lead:'Learn About',pitch:PRODUCTS[0].pitch,pitchEdited:false,
  grad:'vf',arch:true,scale:{eye:100,mark:100,logo:100,meta:100,dealer:100,learn:100,word:100,body:100,booth:100},splashOn:true,splashSize:100,panel:true,ratios:{'1x1':true,'4x5':true,'9x16':true},daysOut:7,
  stages:Object.fromEntries(STAGE_DEFS.map(s=>[s.id,{on:true,head:s.head,body:s.body,product:s.product}])),
  logo:null,logoName:'',splash:null,example:true,
  dealerOn:false,dealer:'',dealerLead:'Find Us With',dealerLogo:null,dealerLogoName:'',dealerPanel:false,
  logoShape:'round',logoShapeColor:'#FFFFFF',dealerShape:'none',dealerShapeColor:'#FFFFFF',link:{on:true,y:79,w:46},frozen:{},safe:true,
  w:{eye:500,logo:700,meta:700,dealer:500,learn:700,body:400,booth:500}
};
let S=load();
// one-time migration from the old white-panel checkboxes to shapes
if(S.panel===false&&S.logoShape==='round'&&!S._shapesMigrated){S.logoShape='none'}
if(S.dealerPanel&&S.dealerShape==='none'&&!S._shapesMigrated){S.dealerShape='round'}
S._shapesMigrated=true;
if(!S._postReady){S.safe=true;if(S.link&&S.link.y===76){S.link.y=79;S.link.w=46}S._postReady=true}
window.SG_KEY=KEY;window.SG_STATE=()=>S;
let active='announce';
const imgs={};
let fontFamily='"Helvetica Neue", Helvetica, Arial, sans-serif';

function load(){
  try{const raw=localStorage.getItem(KEY);if(raw){const o=JSON.parse(raw);return Object.assign(structuredClone(DEFAULT),o,{stages:Object.assign(structuredClone(DEFAULT.stages),o.stages||{}),ratios:{'9x16':true},scale:Object.assign({},DEFAULT.scale,o.scale||{}),w:Object.assign({},DEFAULT.w,o.w||{})});}}catch(e){}
  return structuredClone(DEFAULT);
}
let saveT;
function save(){clearTimeout(saveT);saveT=setTimeout(()=>{if(window.SG_BOOTED){try{localStorage.setItem('sg-updated',String(Date.now()))}catch(e){}window.dispatchEvent(new CustomEvent('sg:save',{detail:S}))}try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){try{const t=Object.assign({},S,{splash:null,hol:Object.assign({},S.hol,{img:null})});localStorage.setItem(KEY,JSON.stringify(t))}catch(e2){}}},300)}

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
  add(d('thanks'));add(d('feed'));
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
/* Per-element font weight, set from the weight menus beside each size slider */
const WT=(o,k,d)=>(o&&o.w&&o.w[k])||d;
const WEIGHTS=[[300,'Light'],[400,'Book'],[500,'Medium'],[700,'Bold']];
const SHAPES=[['none','No shape'],['round','Rounded box'],['rect','Square box'],['pill','Pill'],['circle','Circle']];
const SHAPE_COLORS=[['#FFFFFF','White'],['#101921','Black'],['#E04584','Pink'],['#FF7F39','Orange'],['#888B95','Gray'],['#DAD8D9','Light gray']];
function lum(hex){const n=parseInt(String(hex).replace('#',''),16);if(isNaN(n))return 1;return (0.299*(n>>16&255)+0.587*(n>>8&255)+0.114*(n&255))/255}
/* Draw a logo (or its name as text) centered on cx,cy, with an optional shape behind it */
function logoBlock(ctx,{img,text,weight,shape,color,cx,cy,maxW,maxH,onColor}){
  const has=shape&&shape!=='none',pad=has?Math.min(maxH*0.16,40):0;let bw=maxW-pad*2,bh=maxH-pad*2;
  if(shape==='circle'){bw=Math.min(bw,maxH*0.62);bh=maxH*0.46}
  let w,h,drawIt;
  if(img){const k=Math.min(bw/img.width,bh/img.height);w=img.width*k;h=img.height*k;drawIt=(x,y)=>ctx.drawImage(img,x,y,w,h)}
  else{const name=(text||'').trim()||'Name';let fs=bh*0.62,ls;const fit=()=>{ctx.font=F(weight,fs);ls=wrap(ctx,name,bw)};fit();
    while((ls.length>2||ls.length*fs*1.08>bh||ls.some(l=>ctx.measureText(l).width>bw))&&fs>12){fs-=2;fit()}
    w=Math.max(...ls.map(l=>ctx.measureText(l).width));h=ls.length*fs*1.08;
    const tc=has?(lum(color)>0.6?'#101921':'#FFFFFF'):(onColor||'#FFFFFF');
    drawIt=(x,y)=>{ctx.save();ctx.font=F(weight,fs);ctx.fillStyle=tc;ctx.textAlign='center';ctx.textBaseline='top';let ty=y;for(const l of ls){ctx.fillText(l,x+w/2,ty+fs*0.04);ty+=fs*1.08}ctx.restore()}}
  if(has){ctx.save();ctx.fillStyle=color||'#FFFFFF';ctx.beginPath();
    if(shape==='circle'){const r=Math.max(w,h)/2+pad*1.2;ctx.arc(cx,cy,Math.min(r,maxH/2),0,Math.PI*2)}
    else{const x=cx-w/2-pad,y=cy-h/2-pad,ww=w+pad*2,hh=h+pad*2,r=shape==='pill'?hh/2:shape==='round'?Math.min(24,hh*0.14):0;rr(ctx,x,y,ww,hh,r)}
    ctx.fill();ctx.restore()}
  drawIt(cx-w/2,cy-h/2);
}
function shapeControls(boxId,obj,shapeKey,colorKey,cb){
  const box=$(boxId);box.innerHTML='';
  const sel=document.createElement('select');sel.setAttribute('aria-label','Shape');SHAPES.forEach(([v,n])=>{const o=document.createElement('option');o.value=v;o.textContent=n;sel.appendChild(o)});
  sel.value=obj[shapeKey]||'none';
  const sw=document.createElement('div');sw.className='colorrow';
  const paint=()=>{sw.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.c.toLowerCase()===String(obj[colorKey]).toLowerCase())));sw.hidden=sel.value==='none';};
  SHAPE_COLORS.forEach(([c,n])=>{const b=document.createElement('button');b.type='button';b.className='dot';b.title=n;b.setAttribute('aria-label',n+' shape');b.style.background=c;b.dataset.c=c;b.addEventListener('click',()=>{obj[colorKey]=c;paint();cb()});sw.appendChild(b)});
  const pick=document.createElement('input');pick.type='color';pick.title='Custom color';pick.setAttribute('aria-label','Custom shape color');pick.value=/^#[0-9a-f]{6}$/i.test(obj[colorKey])?obj[colorKey]:'#ffffff';
  pick.addEventListener('input',()=>{obj[colorKey]=pick.value;paint();cb()});sw.appendChild(pick);
  sel.addEventListener('change',()=>{obj[shapeKey]=sel.value;paint();cb()});
  const lab=document.createElement('label');lab.className='f';lab.textContent='Shape behind it';lab.appendChild(sel);box.appendChild(lab);box.appendChild(sw);paint();
}
/* Preview-only overlays: link sticker zone and Instagram safety guides. Never drawn into exports. */
function drawLinkZone(ctx,W,H,link){
  if(!link||!link.on)return;const w=W*(link.w||48)/100,h=Math.round(w*0.23),cy=H*(link.y||76)/100;
  ctx.save();ctx.setLineDash([16,12]);ctx.lineWidth=4;ctx.strokeStyle='rgba(255,255,255,.85)';ctx.shadowColor='rgba(16,25,33,.35)';ctx.shadowBlur=6;
  rr(ctx,W/2-w/2,cy-h/2,w,h,h/2);ctx.stroke();ctx.shadowBlur=0;ctx.setLineDash([]);
  ctx.font=F(500,Math.round(h*0.3));ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='rgba(255,255,255,.95)';ctx.fillText('Link sticker',W/2,cy);ctx.restore();
}
function drawGuides(ctx,W,H){
  if(!S.safe)return;ctx.save();ctx.fillStyle='rgba(0,184,82,.22)';ctx.strokeStyle='rgba(0,184,82,.9)';ctx.lineWidth=3;
  const lab=(t,x,y)=>{ctx.font=F(600,30);ctx.textAlign='left';ctx.textBaseline='top';ctx.fillStyle='rgba(255,255,255,.9)';ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=4;ctx.fillText(t,x,y);ctx.shadowBlur=0;ctx.fillStyle='rgba(0,184,82,.22)'};
  if(H/W>1.7){const t=250,b=340,s=64;
    ctx.fillRect(0,0,W,t);ctx.fillRect(0,H-b,W,b);ctx.fillRect(0,t,s,H-t-b);ctx.fillRect(W-s,t,s,H-t-b);ctx.strokeRect(s,t,W-2*s,H-t-b);
    lab('Profile and progress bar',s+12,t-40);lab('Reply bar and stickers',s+12,H-b+12)}
  else if(Math.abs(H/W-1.25)<0.02){const s=Math.round((W-H*0.75)/2);ctx.fillRect(0,0,s,H);ctx.fillRect(W-s,0,s,H);ctx.strokeRect(s,0,W-2*s,H);lab('Profile grid crops to 3:4',s+12,16)}
  ctx.restore();
}
function linkControls(boxId,get,cb){
  const box=$(boxId);if(!box)return;box.innerHTML='';const L=get();
  box.innerHTML=`<label class="mini"><input type="checkbox"> Show the link sticker zone</label>
    <div class="sl"><span>Up and down</span><input type="range" min="40" max="92" step="1" aria-label="Link zone position"><output></output><span></span></div>
    <div class="sl"><span>Width</span><input type="range" min="25" max="80" step="1" aria-label="Link zone width"><output></output><span></span></div>
    <p class="hint">Preview only. It marks where the Instagram link sticker goes and never appears in the download.</p>`;
  const [on,y,w]=box.querySelectorAll('input'),[oy,ow]=box.querySelectorAll('output');
  on.checked=!!L.on;y.value=L.y;w.value=L.w;oy.textContent=L.y+'%';ow.textContent=L.w+'%';
  on.addEventListener('change',()=>{get().on=on.checked;cb()});
  y.addEventListener('input',()=>{get().y=Number(y.value);oy.textContent=y.value+'%';cb()});
  w.addEventListener('input',()=>{get().w=Number(w.value);ow.textContent=w.value+'%';cb()});
}
function guideToggles(){
  document.querySelectorAll('[data-guides]').forEach(el=>{el.innerHTML='<label class="mini guidetoggle"><input type="checkbox"> Safety guides</label>';const c=el.querySelector('input');c.checked=!!S.safe;
    c.addEventListener('change',()=>{S.safe=c.checked;document.querySelectorAll('[data-guides] input').forEach(x=>x.checked=S.safe);save();redrawAll()})});
}
function previewOverlays(canvas,link){const ctx=canvas.getContext('2d');drawLinkZone(ctx,canvas.width,canvas.height,link);drawGuides(ctx,canvas.width,canvas.height)}
function wsel(o,k,label,cb){
  if(!o.w||!(k in o.w)){const sp=document.createElement('span');return sp}
  const s=document.createElement('select');s.className='wsel';s.setAttribute('aria-label',label+' weight');
  for(const [v,n] of WEIGHTS){const op=document.createElement('option');op.value=v;op.textContent=n;s.appendChild(op)}
  s.value=String(o.w[k]);s.addEventListener('change',()=>{o.w[k]=Number(s.value);cb()});return s}
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

const SCALE_KEYS={eye:'eye',mark:'mark',logo:'logo',meta:'meta',dealer:'dealer',learn:'learn',word:'word',body:'body',booth:'bt'};
/* Where content may sit. Stories keep clear of Instagram's top bar (250 px) and reply bar (340 px),
   and stop above the link sticker when it is on, so the defaults are post-ready. */
const SAFE_TOP=250,SAFE_BOTTOM=340;
function tsBounds(R,W,H){
  if(H<1500)return{top:R.pad,bottom:H-R.pad};
  let top=SAFE_TOP+40,bottom=H-SAFE_BOTTOM-30;
  const L=S.link;if(L&&L.on){const lh=W*(L.w||48)/100*0.23,lt=H*(L.y||78)/100-lh/2;if(lt>H*0.55)bottom=Math.min(bottom,lt-36)}
  return{top,bottom};
}
function layout(ctx,R0,stage,W,H){
  R0=Object.assign({},R0);const sc=S.scale||{};
  for(const k in SCALE_KEYS)R0[SCALE_KEYS[k]]*=((sc[k]??100)/100);
  // Try the ratio's full sizes; shrink uniformly only if the stack would not fit.
  for(let s=1;s>=0.6;s-=0.03){
    const R={};for(const k in R0)R[k]=typeof R0[k]==='number'&&!['H','bl'].includes(k)?R0[k]*s:R0[k];
    R.pad=R0.pad;R.side=R0.side;
    // readability floors: shrink spacing and logos before small type gets unreadable
    if(R0.H>1500){R.body=Math.max(R.body,Math.min(R0.body,38));R.bt=Math.max(R.bt,Math.min(R0.bt,50));R.eye=Math.max(R.eye,Math.min(R0.eye,44));R.meta=Math.max(R.meta,Math.min(R0.meta,54));R.learn=Math.max(R.learn,Math.min(R0.learn,56))}
    const L=measure(ctx,R,stage,W,H);
    const B=tsBounds(R0,W,H),minGap=H*0.017;L.bounds=B;
    if(L.used+minGap*(L.groups.length+1)<=B.bottom-B.top||s<=0.61)return L;
  }
}
function measure(ctx,R,stage,W,H){
  const maxW=W-R.side*2;const L={R,maxW};
  L.head=fill(stage.st.head,stage);
  L.eyeSize=fitFont(ctx,L.head,WT(S,'eye',500),R.eye,maxW,R.eye*0.55);
  const markIm=imgs.mark;L.markH=R.mark;L.markW=markIm?R.mark*markIm.width/markIm.height:0;
  ctx.font=F(WT(S,'eye',500),L.eyeSize);L.headW=ctx.measureText(L.head).width;
  L.arcR=W*0.62;L.sag=S.arch?L.arcR*(1-Math.cos(Math.min(1.2,L.headW/2/L.arcR))):0;
  L.g1=L.eyeSize*1.05+L.sag+R.eye*0.55+L.markH;
  // Location and date: one line when it fits, otherwise location wraps and the date drops to its own line
  const city=S.city.trim(),dl=dateLine();L.metaLines=[];L.metaSize=0;
  if(city||dl){
    const one=[city,dl].filter(Boolean).join('  |  ');let sz=R.meta;ctx.font=F(WT(S,'meta',700),sz);
    while(ctx.measureText(one).width>maxW&&sz>R.meta*0.7){sz-=1;ctx.font=F(WT(S,'meta',700),sz)}
    if(ctx.measureText(one).width<=maxW){L.metaLines=[one]}
    else{
      sz=R.meta*0.82;const build=()=>{ctx.font=F(WT(S,'meta',700),sz);return [...(city?wrap(ctx,city,maxW):[]),...(dl?[dl]:[])]};
      let ls=build();while((ls.length>(dl?3:2)||ls.some(l=>ctx.measureText(l).width>maxW))&&sz>R.meta*0.45){sz-=1;ls=build()}
      L.metaLines=ls;
    }
    L.metaSize=sz;
  }
  L.logoH=R.logo;
  L.metaH=L.metaLines.length?R.meta*0.75+L.metaLines.length*L.metaSize*1.22:0;
  // Dealer lockup: "Find Us With" + dealer logo (or name)
  L.dealer=null;
  if(S.dealerOn&&(imgs.dealerLogo||S.dealer.trim())){
    const lead=S.dealerLead.trim(),ls=R.meta*0.72,dh=R.dealer;
    L.dealer={lead,ls,dh,top:R.meta*1.1};
    L.dealer.h=L.dealer.top+(lead?ls*1.45:0)+dh;
  }
  L.g2=L.logoH+L.metaH+(L.dealer?L.dealer.h:0);
  const showProduct=stage.st.product&&S.product!=='none';
  L.pb=showProduct?productBlock(ctx,R,maxW):null;
  L.lead=S.lead.trim();
  L.g3=L.pb?((L.lead?R.learn*1.15+R.learn*0.3:0)+L.pb.h):0;
  L.bodyTxt=fill(stage.st.body,stage);/*book*/L.bodySize=R.body;L.lines=[];
  if(L.bodyTxt){ctx.font=F(WT(S,'body',400),L.bodySize);L.lines=wrap(ctx,L.bodyTxt,maxW*0.94);while(L.lines.length>R.bl&&L.bodySize>R.body*0.6){L.bodySize-=1;ctx.font=F(WT(S,'body',400),L.bodySize);L.lines=wrap(ctx,L.bodyTxt,maxW*0.94)}}
  L.g4=L.lines.length?L.lines.length*L.bodySize*1.36:0;
  L.boothTxt=S.booth.trim()?`Booth ${S.booth.trim()}`:'';
  L.boothSize=L.boothTxt?fitFont(ctx,L.boothTxt,WT(S,'booth',500),R.bt,maxW,R.bt*0.6):0;
  L.g5=L.boothTxt?L.boothSize*1.05:0;
  L.groups=[L.g1,L.g2,L.g3,L.g4,L.g5].filter(v=>v>0);
  L.used=L.groups.reduce((a,b)=>a+b,0);
  return L;
}

const FROZEN_KEYS=['scale','w','splashSize','link'];
function styleSnapshot(){const o={};FROZEN_KEYS.forEach(k=>o[k]=structuredClone(S[k]));return o}
function render(canvas,R0,stage,guide){
  const fz=S.frozen&&S.frozen[stage.key];const base=S;
  if(fz)S=Object.assign({},base,structuredClone(fz));
  try{renderRaw(canvas,R0,stage);if(guide)previewOverlays(canvas,R0.H>1500?S.link:null)}finally{S=base}
}
function renderRaw(canvas,R0,stage){
  const W=1080,H=R0.H;canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');ctx.imageSmoothingQuality='high';
  ctx.clearRect(0,0,W,H);drawBg(ctx,W,H);
  ctx.textAlign='center';ctx.textBaseline='top';
  const L=layout(ctx,R0,stage,W,H);const R=L.R;
  const n=L.groups.length;
  const tight=L.pb&&L.lines.length?0.55:0;       // product logo sits closer to the body line
  const units=Math.max(1,(n-1)+2-tight);         // gaps before and after the logo group count double
  const B=L.bounds||{top:R.pad,bottom:H-R.pad};
  const free=B.bottom-B.top-L.used;
  const g=Math.min(Math.max(H*0.012,free/units),H*0.07);
  let y=B.top+Math.max(0,(B.bottom-B.top-(L.used+g*units))/2);
  const G=(i)=>i<=1?g*2:g;                       // gap after group i

  // 1. headline + logomark (Bold header)
  ctx.font=F(WT(S,'eye',500),L.eyeSize);ctx.fillStyle='#fff';
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
  logoBlock(ctx,{img:imgs.logo,text:S.show,weight:WT(S,'logo',700),shape:S.logoShape,color:S.logoShapeColor,cx:W/2,cy:zoneY+zoneH/2,maxW:L.maxW,maxH:zoneH});
  let my=zoneY+zoneH+R.meta*0.75;
  if(L.metaLines.length){ctx.fillStyle='#fff';ctx.font=F(WT(S,'meta',700),L.metaSize);for(const l of L.metaLines){ctx.fillText(l,W/2,my);my+=L.metaSize*1.22}}
  if(L.dealer){
    const D=L.dealer;let dy=zoneY+zoneH+L.metaH+D.top;
    if(D.lead){ctx.fillStyle='#fff';ctx.font=F(WT(S,'dealer',500),D.ls);ctx.fillText(D.lead,W/2,dy);dy+=D.ls*1.45}
    logoBlock(ctx,{img:imgs.dealerLogo,text:S.dealer,weight:700,shape:S.dealerShape,color:S.dealerShapeColor,cx:W/2,cy:dy+D.dh/2,maxW:L.maxW*0.62,maxH:D.dh});
  }
  y+=L.g2+G(1);

  // 3. lead-in (Medium) + product wordmark
  if(L.pb){
    if(L.lead){ctx.font=F(WT(S,'learn',700),R.learn);ctx.fillStyle='#fff';ctx.fillText(L.lead,W/2,y);y+=R.learn*1.15+R.learn*0.3}
    L.pb.draw(W/2,y);y+=L.pb.h+(L.lines.length?g*0.45:g);
  }
  // 4. body (Book)
  if(L.lines.length){ctx.font=F(WT(S,'body',400),L.bodySize);ctx.fillStyle='#fff';for(const l of L.lines){ctx.fillText(l,W/2,y);y+=L.bodySize*1.36}y+=g}
  // 5. booth: plain Bold white type, like the original template
  if(L.boothTxt){ctx.font=F(WT(S,'booth',500),L.boothSize);ctx.fillStyle='#fff';ctx.fillText(L.boothTxt,W/2,y)}
}

/* ---------- UI build ---------- */
function bindText(id,key,after){const el=$(id);el.value=S[key]??'';el.addEventListener('input',()=>{S[key]=el.value;S.example=false;after&&after();changed()})}
bindText('show','show');bindText('city','city');bindText('booth','booth');
bindText('start','start');bindText('end','end');bindText('lead','lead');
bindText('pitch','pitch',()=>{S.pitchEdited=true});
bindText('dealer','dealer');bindText('dealerLead','dealerLead');
$('dealerOn').checked=!!S.dealerOn;$('dealerOn').addEventListener('change',e=>{S.dealerOn=e.target.checked;changed()});
shapeControls('dealerShapeBox',S,'dealerShape','dealerShapeColor',()=>changed());
$('dealerLogoBtn').addEventListener('click',()=>$('dealerLogoFile').click());
$('dealerLogoFile').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;S.dealerLogo=await readFile(f);S.dealerLogoName=f.name;imgs.dealerLogo=await loadImg(S.dealerLogo);e.target.value='';changed()});
$('dealerLogoClear').addEventListener('click',()=>{S.dealerLogo=null;S.dealerLogoName='';imgs.dealerLogo=null;changed()});
/* "This story" editor above the preview: edits the headline and body of the stage being previewed */
function activeStage(){return stageList().find(s=>s.key===active)}
function syncStoryEdit(){
  const st=activeStage();const box=$('storyEdit');box.hidden=!st;if(!st)return;
  const h=$('seHead'),b=$('seBody');$('seTitle').textContent=st.label;$('seProd').checked=!!st.st.product;
  if(document.activeElement!==h)h.value=st.st.head;
  if(document.activeElement!==b)b.value=st.st.body;
  const notes=[];if(st.def.id==='mid')notes.push('Applies to every middle day. {n} is the day number.');if(st.def.id==='thanks')notes.push('{show} is the show name.');if(st.def.id==='countdown')notes.push('{days} is the number of days out.');
  if(/\{pitch\}/.test(st.st.body))notes.push('{pitch} pulls in the pitch line from Product focus.');$('seNote').textContent=notes.join(' ');
}
function seInput(field){const st=activeStage();if(!st)return;st.st[field]=$(field==='head'?'seHead':'seBody').value;
  const mirror=$(`st-${st.def.id}-${field}`);if(mirror)mirror.value=st.st[field];changed()}
$('seProd').addEventListener('change',()=>{const st=activeStage();if(!st)return;st.st.product=$('seProd').checked;changed()});
$('seHead').addEventListener('input',()=>seInput('head'));$('seBody').addEventListener('input',()=>seInput('body'));
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
shapeControls('logoShapeBox',S,'logoShape','logoShapeColor',()=>changed());
const SLIDERS=[['eye','Headline'],['mark','Logomark'],['logo','Show logo'],['meta','Location and date'],['dealer','Dealer'],['learn','Lead-in'],['word','Product logo'],['body','Body line'],['booth','Booth'],['splash','Ink splash']];
function buildSliders(){
  const box=$('sliders');box.innerHTML='';
  SLIDERS.forEach(([k,label])=>{
    const row=document.createElement('div');row.className='sl';
    const val=k==='splash'?S.splashSize:S.scale[k];
    row.innerHTML=`<span>${label}</span><input type="range" id="size-${k}" min="25" max="250" step="1" aria-label="${label} size"><output>${val}%</output>`;
    const inp=row.querySelector('input'),out=row.querySelector('output');inp.value=val;
    inp.addEventListener('input',()=>{const v=Number(inp.value);if(k==='splash')S.splashSize=v;else S.scale[k]=v;out.textContent=v+'%';changed()});
    row.appendChild(wsel(S,k,label,changed));box.appendChild(row);
  });
}
buildSliders();
$('resetSizes').addEventListener('click',()=>{Object.keys(S.scale).forEach(k=>S.scale[k]=100);S.splashSize=100;S.w=structuredClone(DEFAULT.w);buildSliders();changed()});

function buildStages(){
  const box=$('stages');box.innerHTML='';
  STAGE_DEFS.forEach(def=>{
    const st=S.stages[def.id];
    const l=document.createElement('label');
    l.innerHTML=`<input type="checkbox" id="st-${def.id}-on"> ${def.id==='mid'?'Middle days':def.name}<span class="when">${def.when}</span>`;
    const on=l.querySelector('input');on.checked=st.on;
    on.addEventListener('change',()=>{st.on=on.checked;changed(true);tsIntroList()});
    box.appendChild(l);
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

/* Benton Sans: loaded from the person's own files and remembered in this browser (IndexedDB), never uploaded */
const FONT_SET='"SG Benton Sans","Helvetica Neue",Helvetica,Arial,sans-serif';
async function applyFonts(list){let n=0;
  for(const {w,buf} of list){try{const ff=new FontFace('SG Benton Sans',buf,{weight:String(w)});await ff.load();document.fonts.add(ff);n++}catch(err){}}
  if(n){fontFamily=FONT_SET;const ws=[...new Set(list.map(f=>f.w))].sort().map(w=>({300:'Light',400:'Book',500:'Medium',700:'Bold'})[w]).join(', ');
    $('fontStatus').textContent=`Benton Sans loaded (${ws}). Remembered in this browser.`;$('fontClear').hidden=false;redrawAll()}
  return n}
function redrawAll(){try{changed()}catch(e){}for(const f of [()=>prDraw(),()=>holDraw(),()=>iywDraw(),()=>bcDraw(),()=>fpDraw()]){try{f()}catch(e){}}}
$('fontBtn').addEventListener('click',()=>$('fontFile').click());
$('fontFile').addEventListener('change',async e=>{
  const list=[];for(const f of e.target.files){const nm=f.name.toLowerCase();list.push({w:nm.includes('bold')?700:nm.includes('medium')?500:(nm.includes('light')||nm.includes('thin'))?300:400,buf:await f.arrayBuffer()})}
  const n=await applyFonts(list.map(x=>({w:x.w,buf:x.buf.slice(0)})));
  if(n){bcIdb.set('fonts',list)}else $('fontStatus').textContent='Those files could not be read as fonts. Try .otf or .ttf.';
  e.target.value='';
});
$('fontClear').addEventListener('click',()=>{bcIdb.del('fonts');$('fontStatus').textContent='Fonts forgotten. Reload the page to switch back to Helvetica.';$('fontClear').hidden=true});

/* tabs + previews */
function buildTabs(){
  const list=stageList();const t=$('tabs');t.innerHTML='';
  if(!list.find(s=>s.key===active))active=list[0]?.key||'';
  list.forEach((s,i)=>{const b=document.createElement('button');b.type='button';b.className='tab';b.role='tab';
    b.innerHTML=`<span></span><span class="n">${i+1}/${list.length}</span>`;b.firstChild.textContent=s.label;b.setAttribute('aria-selected',String(s.key===active));
    if(S.frozen&&S.frozen[s.key])b.classList.add('done');
    b.addEventListener('click',()=>tsSelect(s.key));t.appendChild(b)});
  $('tsCount').textContent=list.length?`${list.length} stories`:'';
  $('pkgCount').textContent=`Package: ${list.length} files, Stories at 1080 × 1920 and the feed post at 1080 × 1350`;
  tsNav();
}
function draw(){
  const pv=$('previews');pv.innerHTML='';
  const st=stageList().find(s=>s.key===active);
  const rs=st?[ratioFor(st)]:[];
  if(!st||!rs.length){pv.innerHTML='<p class="empty">Turn on at least one stage and one size to see a preview.</p>';return}
  rs.forEach(r=>{const fig=document.createElement('figure');fig.className='r'+r.id;const c=document.createElement('canvas');c.setAttribute('aria-label',`${st.label} at ${r.label}`);
    fig.appendChild(c);const cap=document.createElement('figcaption');cap.textContent=`${r.label} · 1080×${r.H}`;fig.appendChild(cap);pv.appendChild(fig);render(c,r,st,true)});
}
function syncUI(){
  document.querySelectorAll('#swatches .sw').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===S.grad)));
  const g=GRADS.find(x=>x.id===S.grad);$('swName').textContent=g.name;$('contrastWarn').hidden=!g.low;
  const p=PRODUCTS.find(x=>x.id===S.product);$('productWarn').hidden=!p.warn;$('productWarn').textContent=p.warn||'';
  $('logoName').textContent=S.logo?S.logoName||'Logo loaded':'No logo yet. The show name stands in for it.';$('logoClear').hidden=!S.logo;
  $('splashReset').hidden=!S.splash;
  $('exampleChip').hidden=!S.example;
  $('dealerFields').hidden=!S.dealerOn;
  $('dealerLogoName').textContent=S.dealerLogo?(S.dealerLogoName||'Logo loaded'):'No logo yet. The dealer name stands in for it.';$('dealerLogoClear').hidden=!S.dealerLogo;
  const dl=dateLine();const n=showDays();$('datePreview').textContent=dl?`Reads as “${dl}” · ${n} show day${n>1?'s':''}`:'Add the first day to set the date line.';
}
let raf;
function changed(rebuildTabs){syncUI();save();buildTabs();syncStoryEdit();cancelAnimationFrame(raf);raf=requestAnimationFrame(draw)}

/* export */
let downloads=null;
function slug(s){return (s||'show').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'show'}
function toBlob(c){return new Promise(r=>c.toBlob(r,'image/png'))}
async function exportStages(list){
  if(!downloads){$('status').textContent='Downloads are not available in this browser.';return}
  if(!list.length){$('status').textContent='Nothing to export. Turn on a stage and a size.';return}
  const btns=[$('exportOne'),$('exportAll'),$('tsNext')];btns.forEach(b=>b.disabled=true);
  try{
    $('status').textContent='Rendering…';
    const zip=new JSZip();const base=slug(S.show);
    const c=document.createElement('canvas');let i=0;
    for(const st of list){const sk=slug(st.label.replace(/\(.*\)/,''));for(const r of [ratioFor(st)]){render(c,r,st);i++;const b=await toBlob(c);zip.file(`${base}/${String(list.indexOf(st)+1).padStart(2,'0')}_${base}_${sk}.png`,b)}}
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
function show(view){['home','stories','tradeshow','pr','holiday','words','blog','fast'].forEach(v=>$(v).hidden=v!==view);window.scrollTo(0,0);if(view==='tradeshow'){tsGoto('intro')}if(view==='pr')prDraw();if(view==='holiday')holDraw();if(view==='words')iywDraw();if(view==='blog')bcDraw();if(view==='fast')fpDraw()}
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{show(b.dataset.go);try{history.replaceState(null,'','#'+b.dataset.go)}catch(e){}}));
document.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.back;show(v);try{history.replaceState(null,'','#'+v)}catch(e){}}));
/* Tradeshow journey: start → show details → review each story → finish and download */
let tsStep='intro';
function tsIntroList(){const ul=$('tsIntroList');ul.innerHTML='';stageList().forEach(s=>{const li=document.createElement('li');li.textContent=s.label;ul.appendChild(li)})}
function tsGoto(step){
  tsStep=step;['intro','setup','review'].forEach(k=>{$('ts'+k[0].toUpperCase()+k.slice(1)).hidden=k!==step});
  const order=['intro','setup','review'];document.querySelectorAll('#tsJourney li').forEach(li=>{const i=order.indexOf(li.dataset.step),c=order.indexOf(step);li.classList.toggle('on',i===c);li.classList.toggle('done',i<c)});
  if(step==='intro'){tsIntroList();const has=!S.example;$('tsResume').hidden=!has;$('tsResumeNote').textContent=has?`Picks up ${S.show.trim()||'your last package'} where you left off.`:''}
  if(step==='review'){buildTabs();syncStoryEdit();draw()}
  window.scrollTo(0,0);
}
function tsNav(){
  const list=stageList(),i=list.findIndex(s=>s.key===active),last=i===list.length-1;
  $('tsPrev').textContent=i<=0?'← Show details':'← Back';
  $('tsNext').textContent=last?'Finish and download':'Next →';
}
/* Moving off a story locks its sizes, weights and link zone, so edits on later stories never change it.
   Coming back to a story unlocks it and loads its settings into the controls. */
function tsSelect(key,freezeCurrent=true){
  if(freezeCurrent&&active&&active!==key){S.frozen=S.frozen||{};S.frozen[active]=styleSnapshot()}
  const fz=S.frozen&&S.frozen[key];
  if(fz){FROZEN_KEYS.forEach(k=>S[k]=structuredClone(fz[k]));delete S.frozen[key];buildSliders();tsLinkUI()}
  active=key;save();buildTabs();syncStoryEdit();draw();window.scrollTo(0,0);
}
function tsLinkUI(){linkControls('tsLink',()=>S.link,()=>{save();draw()})}
$('tsStart').addEventListener('click',()=>{S.frozen={};tsGoto('setup')});
$('tsResume').addEventListener('click',()=>{const k=stageList()[0]?.key||'';active=null;tsGoto('review');tsSelect(k,false)});
document.querySelectorAll('[data-step-go]').forEach(b=>b.addEventListener('click',()=>tsGoto(b.dataset.stepGo)));
$('tsGo').addEventListener('click',()=>{
  if(!S.show.trim()&&!S.logo){$('tsSetupMsg').textContent='Add the show name or upload its logo first.';$('show').focus();return}
  if(!stageList().length){$('tsSetupMsg').textContent='Turn on at least one story.';return}
  $('tsSetupMsg').textContent='';const k=stageList()[0].key;active=null;tsGoto('review');tsSelect(k,false);
});
$('tsPrev').addEventListener('click',()=>{const list=stageList(),i=list.findIndex(s=>s.key===active);if(i<=0){tsGoto('setup');return}tsSelect(list[i-1].key)});
$('tsNext').addEventListener('click',()=>{const list=stageList(),i=list.findIndex(s=>s.key===active);if(i>=list.length-1){S.frozen=S.frozen||{};S.frozen[active]=styleSnapshot();save();buildTabs();exportStages(list);return}tsSelect(list[i+1].key)});
$('exportAll').addEventListener('click',()=>exportStages(stageList()));
$('exportOne').addEventListener('click',()=>exportStages(stageList().filter(s=>s.key===active)));

/* ================= PR Hit Stories ================= */
const PR_DEFAULT={pub:'Ink World',logo:null,logoName:'',panel:true,featOn:true,quoteOn:true,
  label:'Featured In',head:'Sawgrass Leads Way in Sublimation Ink, Printing Market',byline:'By David Savastano, Editor',
  quote:"Decorators shouldn't have to choose between capability and ease of use. When the printer, ink and software are designed to work together, you stop thinking about the equipment. You just make things.",
  grad:'bp',ink:'white',glow:false,mark:true,guide:true,example:true,link:{on:true,y:85,w:48},
  scale:{logo:100,label:100,head:100,byline:100,quote:100}};
S.pr=Object.assign(structuredClone(PR_DEFAULT),S.pr||{});S.pr.w=Object.assign({logo:700,label:500,head:700,byline:400,quote:400},S.pr.w||{});S.pr.scale=Object.assign({},PR_DEFAULT.scale,S.pr.scale||{});
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
    const name=P.pub.trim()||'Publication';let fs=maxH*0.62;ctx.font=F(WT(P,'logo',700),fs);
    while(ctx.measureText(name).width>maxW-pad*2&&fs>14){fs-=2;ctx.font=F(WT(P,'logo',700),fs)}
    w=ctx.measureText(name).width;h=fs*0.95;
    draw=(dx,dy)=>{ctx.save();ctx.font=F(WT(P,'logo',700),fs);ctx.fillStyle=P.panel?INK:ink;ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(name,dx,dy-fs*0.04);ctx.restore()};
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
    if(label){const ls=56*sc('label');ctx.font=F(WT(P,'label',500),ls);ctx.textAlign='center';ctx.fillText(label,W/2,y);y+=ls*1.45}
    y+=prLogo(ctx,W/2,y,800,200*sc('logo'),'center',ink)+80;
    // headline + byline fit the space above the divider
    const head=P.head.trim(),by=P.byline.trim();
    let hs=88*sc('head'),bs=47*sc('byline'),hl=[],bl=[];
    const fit=()=>{ctx.font=F(WT(P,'head',700),hs);hl=head?wrap(ctx,head,900):[];ctx.font=F(WT(P,'byline',400),bs);bl=by?wrap(ctx,by,880):[];
      return hl.length*hs*1.26+(bl.length?60+bl.length*bs*1.4:0)};
    let tot=fit();while(y+tot>limit&&hs>40){hs-=2;bs=Math.max(30,bs-1);tot=fit()}
    ctx.textAlign='center';ctx.fillStyle=ink;
    ctx.font=F(WT(P,'head',700),hs);for(const l of hl){ctx.fillText(l,W/2,y);y+=hs*1.26}
    if(bl.length){y+=60;ctx.font=F(WT(P,'byline',400),bs);for(const l of bl){ctx.fillText(l,W/2,y);y+=bs*1.4}}
  }else{
    const x0=140,maxW=800;let y=245;
    y+=prLogo(ctx,x0,y,560,130*sc('logo'),'left',ink)+90;
    const q=smartQuote(P.quote);let qs=55*sc('quote'),ql=[];
    const fit=()=>{ctx.font=F(WT(P,'quote',400),qs);ql=q?wrap(ctx,q,maxW):[];return ql.length*qs*1.55};
    while(y+fit()>limit&&qs>30)qs-=1;
    ctx.textAlign='left';ctx.fillStyle=ink;ctx.font=F(WT(P,'quote',400),qs);
    for(const l of ql){ctx.fillText(l,x0,y);y+=qs*1.55}
  }
}
function prStories(){const o=[];if(P.featOn)o.push({key:'feature',label:'Feature'});if(P.quoteOn)o.push({key:'quote',label:'Quote'});return o}
function prDraw(){
  const pv=$('prPreviews');pv.innerHTML='';const list=prStories();
  if(!list.length){pv.innerHTML='<p class="empty">Turn on the feature or quote story to see a preview.</p>';return}
  list.forEach(s=>{const fig=document.createElement('figure');const c=document.createElement('canvas');c.setAttribute('aria-label',`${s.label} story`);fig.appendChild(c);
    const cap=document.createElement('figcaption');cap.textContent=`${s.label} · 1080×1920`;fig.appendChild(cap);pv.appendChild(fig);prRender(c,s.key,false);previewOverlays(c,P.link)});
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
[['prPub','pub'],['prLabel','label'],['prHead','head'],['prByline','byline'],['prQuote','quote'],['prPanel','panel'],['prFeatOn','featOn'],['prQuoteOn','quoteOn'],['prGlow','glow'],['prMark','mark']].forEach(([i,k])=>prBind(i,k));
prBind('prInk','ink','change');
GRADS.forEach(g=>{const b=document.createElement('button');b.type='button';b.className='sw';b.title=g.name;b.setAttribute('aria-label',g.name);
  b.style.background=g.img?`center/cover url(${ASSETS.vfbg})`:`linear-gradient(180deg,${g.a},${g.b})`;b.dataset.id=g.id;
  b.addEventListener('click',()=>{P.grad=g.id;prChanged()});$('prSwatches').appendChild(b)});
const PR_SLIDERS=[['logo','Publication logo'],['label','Label'],['head','Headline'],['byline','Byline'],['quote','Quote']];
function prBuildSliders(){const box=$('prSliders');box.innerHTML='';PR_SLIDERS.forEach(([k,label])=>{const row=document.createElement('div');row.className='sl';
  row.innerHTML=`<span>${label}</span><input type="range" id="pr-size-${k}" min="25" max="250" step="1" aria-label="${label} size"><output>${P.scale[k]}%</output>`;
  const i=row.querySelector('input'),o=row.querySelector('output');i.value=P.scale[k];i.addEventListener('input',()=>{P.scale[k]=Number(i.value);o.textContent=i.value+'%';prChanged()});row.appendChild(wsel(P,k,label,prChanged));box.appendChild(row)})}
prBuildSliders();
$('prResetSizes').addEventListener('click',()=>{Object.keys(P.scale).forEach(k=>P.scale[k]=100);Object.assign(P.w,{logo:700,label:500,head:700,byline:400,quote:400});prBuildSliders();prChanged()});
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
const HOL_PRESETS=[
  {id:'hours',name:'Holiday Hours',head:'Holiday Hours',p1:'{team} will be out of the office {closed}.',p2:'We’ll return to normal hours on {return}.',p3:'While we’re away, our online resources are available anytime at care.sawgrassink.com.',sign:'Thank you!'},
  {id:'closure',name:'Office Closure',head:'Office Closure',p1:'{team} will be closed {closed}.',p2:'We’ll be back on {return}.',p3:'Our online resources are available anytime at care.sawgrassink.com.',sign:'Thank you!'},
  {id:'shipping',name:'Shipping Update',head:'Shipping Update',p1:'Orders placed {closed} will ship starting {return}.',p2:'Thank you for your patience while our team catches up.',p3:'Questions? Visit care.sawgrassink.com.',sign:'Thank you!'},
  {id:'maint',name:'Scheduled Maintenance',head:'Scheduled Maintenance',p1:'Our website will be down for maintenance {closed}.',p2:'Everything will be back up by {return}.',p3:'Need help in the meantime? Visit care.sawgrassink.com.',sign:'Thanks for your patience!'},
  {id:'custom',name:'Custom message',head:'Heads Up',p1:'',p2:'',p3:'',sign:''},
];
const HOL_COPY={p1:'{team} will be out of the office {closed}.',p2:"We’ll return to normal hours on {return}.",p3:"While we’re away, our online resources are available anytime at care.sawgrassink.com.",sign:'Thank you!'};
const HOL_DEFAULT=Object.assign({preset:'hours',link:{on:false,y:80,w:48},layout:'hours',head:'Holiday Hours',headEdited:false,teamPick:'Our Global Care Teams',team:'',
  start:'2026-12-24',end:'2026-12-26',back:'2026-12-29',grad:'po',word:true,mark:true,img:null,
  scale:{logo:100,head:100,body:100,sign:100,img:100}},HOL_COPY);
S.hol=Object.assign(structuredClone(HOL_DEFAULT),S.hol||{});S.hol.w=Object.assign({head:700,body:400,sign:500},S.hol.w||{});S.hol.scale=Object.assign({},HOL_DEFAULT.scale,S.hol.scale||{});
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
      ctx.font=F(WT(Hh,'body',400),bs);const pl=paras.map(p=>wrapPara(ctx,p,880));
      ctx.font=F(WT(Hh,'head',700),hs);const hl=head?wrap(ctx,head,940):[];
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
    ctx.font=F(WT(Hh,'head',700),hs);let yy=y;for(const l of blocks.hl){ctx.fillText(l,W/2,yy);yy+=hs*1.2}step(1);
    ctx.font=F(WT(Hh,'body',400),bs);yy=y;blocks.pl.forEach((ls_,i)=>{for(const l of ls_){ctx.fillText(l,W/2,yy);yy+=bs*1.4}yy+=bs*1.0});step(2);
    if(sign){ctx.font=F(WT(Hh,'sign',500),ss);ctx.fillText(sign,W/2,y)}step(3);
    if(blocks.markH){const im=imgs.mark,h=blocks.markH,w=h*im.width/im.height;ctx.drawImage(im,W/2-w/2,y,w,h)}
  }else{
    // Closure: logomark, very large Bold headline, short Book line, photo bleeding off the bottom
    let y=135;
    if(imgs.mark){const h=150*sc('logo'),w=h*imgs.mark.width/imgs.mark.height;ctx.drawImage(imgs.mark,W/2-w/2,y,w,h);y+=h+50}
    let hs=183*sc('head');ctx.font=F(WT(Hh,'head',700),hs);let hl=head?wrap(ctx,head,960):[];
    while(hl.some(l=>ctx.measureText(l).width>980)&&hs>80){hs-=4;ctx.font=F(WT(Hh,'head',700),hs);hl=wrap(ctx,head,960)}
    for(const l of hl){ctx.fillText(l,W/2,y);y+=hs*1.17}
    y+=30;
    const body=[holFill(Hh.p1),holFill(Hh.p2)].filter(Boolean).join(' ');
    const bs=43*sc('body');ctx.font=F(WT(Hh,'body',400),bs);for(const l of wrapPara(ctx,body,900)){ctx.fillText(l,W/2,y);y+=bs*1.4}
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
function holDraw(){const pv=$('holPreviews');pv.innerHTML='';const fig=document.createElement('figure');const c=document.createElement('canvas');c.setAttribute('aria-label','Alert story');fig.appendChild(c);
  const cap=document.createElement('figcaption');cap.textContent=(Hh.head||'Alert')+' · 1080×1920';fig.appendChild(cap);pv.appendChild(fig);holRender(c,true);previewOverlays(c,Hh.link)}
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
document.querySelectorAll('input[name=holLayout]').forEach(r=>r.addEventListener('change',()=>{Hh.layout=r.value;holChanged()}));
HOL_PRESETS.forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=p.name;$('holPreset').appendChild(o)});
$('holPreset').value=Hh.preset||'hours';
function holApplyPreset(){const p=HOL_PRESETS.find(x=>x.id===Hh.preset)||HOL_PRESETS[0];['head','p1','p2','p3','sign'].forEach(k=>Hh[k]=p[k]);Hh.headEdited=false;
  $('holHead').value=Hh.head;$('holP1').value=Hh.p1;$('holP2').value=Hh.p2;$('holP3').value=Hh.p3;$('holSign').value=Hh.sign;holChanged()}
$('holPreset').addEventListener('change',e=>{Hh.preset=e.target.value;holApplyPreset()});
$('holResetCopy').addEventListener('click',()=>holApplyPreset());
GRADS.forEach(g=>{const b=document.createElement('button');b.type='button';b.className='sw';b.title=g.name;b.setAttribute('aria-label',g.name);
  b.style.background=g.img?`center/cover url(${ASSETS.vfbg})`:`linear-gradient(180deg,${g.a},${g.b})`;b.dataset.id=g.id;
  b.addEventListener('click',()=>{Hh.grad=g.id;holChanged()});$('holSwatches').appendChild(b)});
const HOL_SLIDERS=[['logo','Logos'],['head','Headline'],['body','Body copy'],['sign','Sign-off'],['img','Photo']];
function holBuildSliders(){const box=$('holSliders');box.innerHTML='';HOL_SLIDERS.forEach(([k,label])=>{const row=document.createElement('div');row.className='sl';
  row.innerHTML=`<span>${label}</span><input type="range" id="hol-size-${k}" min="25" max="250" step="1" aria-label="${label} size"><output>${Hh.scale[k]}%</output>`;
  const i=row.querySelector('input'),o=row.querySelector('output');i.value=Hh.scale[k];i.addEventListener('input',()=>{Hh.scale[k]=Number(i.value);o.textContent=i.value+'%';holChanged()});row.appendChild(wsel(Hh,k,label,holChanged));box.appendChild(row)})}
holBuildSliders();
$('holResetSizes').addEventListener('click',()=>{Object.keys(Hh.scale).forEach(k=>Hh.scale[k]=100);Object.assign(Hh.w,{head:700,body:400,sign:500});holBuildSliders();holChanged()});
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
const IYW_DEFAULT={link:{on:false,y:86,w:48},grad:'yo',marks:true,word:true,example:true,active:0,
  items:[{quote:"I'm over the moon to be up and running thanks to you! You handled my situation with extreme professionalism, in a kind, understanding and caring manner. I truly can't thank you enough, Lauren.",name:'Sharron',role:'Sawgrass Customer'}],
  scale:{marks:100,quote:100,attr:100,logo:100}};
S.iyw=Object.assign(structuredClone(IYW_DEFAULT),S.iyw||{});S.iyw.w=Object.assign({quote:700,attr:400},S.iyw.w||{});S.iyw.scale=Object.assign({},IYW_DEFAULT.scale,S.iyw.scale||{});
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
  const fit=()=>{ctx.font=F(WT(Q,'quote',700),qs);ql=q?wrap(ctx,q,maxW):[];return ql.length*qs*1.4+(attr?as*0.9+as*1.3:0)};
  while(y+fit()>limit&&qs>34){qs-=1;as=Math.max(32,as-0.5)}
  ctx.fillStyle='#fff';ctx.font=F(WT(Q,'quote',700),qs);
  for(const l of ql){ctx.fillText(l,x0,y);y+=qs*1.4}
  if(attr){
    y+=as*0.9;const lineW=67*(as/48.5);ctx.fillRect(x0,y+as*0.62,lineW,5);
    ctx.font=F(WT(Q,'attr',400),as);ctx.fillText(attr,x0+lineW+21*(as/48.5),y);
  }
}
function iywDraw(){
  const t=$('iywTabs');t.innerHTML='';Q.active=Math.min(Q.active,Q.items.length-1);
  Q.items.forEach((it,i)=>{const b=document.createElement('button');b.type='button';b.className='tab';b.role='tab';
    b.textContent=(it.name||'').trim()||`Quote ${i+1}`;b.setAttribute('aria-selected',String(i===Q.active));
    b.addEventListener('click',()=>{Q.active=i;iywDraw()});t.appendChild(b)});
  const pv=$('iywPreviews');pv.innerHTML='';const fig=document.createElement('figure');const c=document.createElement('canvas');c.setAttribute('aria-label','Quote story');
  fig.appendChild(c);const cap=document.createElement('figcaption');cap.textContent=`Quote ${Q.active+1} of ${Q.items.length} · 1080×1920`;fig.appendChild(cap);pv.appendChild(fig);
  iywRender(c,Q.items[Q.active]);previewOverlays(c,Q.link);
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
function iywBuildSliders(){const box=$('iywSliders');box.innerHTML='';IYW_SLIDERS.forEach(([k,label])=>{const row=document.createElement('div');row.className='sl';
  row.innerHTML=`<span>${label}</span><input type="range" id="iyw-size-${k}" min="25" max="250" step="1" aria-label="${label} size"><output>${Q.scale[k]}%</output>`;
  const i=row.querySelector('input'),o=row.querySelector('output');i.value=Q.scale[k];i.addEventListener('input',()=>{Q.scale[k]=Number(i.value);o.textContent=i.value+'%';iywChanged()});row.appendChild(wsel(Q,k,label,iywChanged));box.appendChild(row)})}
iywBuildSliders();iywBuildList();
$('iywResetSizes').addEventListener('click',()=>{Object.keys(Q.scale).forEach(k=>Q.scale[k]=100);Object.assign(Q.w,{quote:700,attr:400});iywBuildSliders();iywChanged()});
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

/* ================= Blog Carousel (4 × 4:5 from one 16:5 photo) ================= */
const BC_SLIDE_DEFAULTS=[
  {head:'Plan Now.\nThank Yourself\nIn December.',body:'',pos:'top',strength:20},
  {head:'Set Your Cutoff\nBefore Your\nCustomers Do',body:'No published cutoff means the last customer to call sets it for you.',pos:'top',strength:70},
  {head:'Count Back From\nDecember 25',body:'',pos:'top',strength:92},
  {head:'Read All About It\nAnd More\nOn The Blog',body:'',pos:'center',strength:92},
];
const BC_DEFAULT={grad:'pk',dir:'h',fade:40,zoom:100,x:50,y:50,mark:true,
  slides:BC_SLIDE_DEFAULTS.map(s=>Object.assign({},s)),scale:{mark:100,head:100,body:100,gfx:100}};
S.bc=Object.assign(structuredClone(BC_DEFAULT),S.bc||{});S.bc.w=Object.assign({head:500,body:400},S.bc.w||{});S.bc.scale=Object.assign({},BC_DEFAULT.scale,S.bc.scale||{});
const B=S.bc;while(B.slides.length<4)B.slides.push(Object.assign({},BC_SLIDE_DEFAULTS[B.slides.length]));

/* The wide photo and slide graphics are kept in this browser's IndexedDB at full resolution
   (too big for cloud sync without losing quality). */
const bcIdb=(()=>{let dbp=null;const open=()=>dbp||(dbp=new Promise((res,rej)=>{try{const r=indexedDB.open('sg-builder',1);r.onupgradeneeded=()=>r.result.createObjectStore('files');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}catch(e){rej(e)}}));
  const tx=async(mode,fn)=>{const db=await open();return new Promise((res,rej)=>{const t=db.transaction('files',mode);const st=t.objectStore('files');const q=fn(st);t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error)})};
  return{get:k=>tx('readonly',s=>s.get(k)).catch(()=>null),set:(k,v)=>tx('readwrite',s=>s.put(v,k)).catch(()=>{}),del:k=>tx('readwrite',s=>s.delete(k)).catch(()=>{})}})();
const bcImgs={photo:null,gfx:[null,null,null,null]};

const PW=4320,PH=1350,SW=1080;
let bcPano=null;
function bcRenderPano(guide){
  const c=bcPano||(bcPano=document.createElement('canvas'));c.width=PW;c.height=PH;
  const x=c.getContext('2d');x.imageSmoothingQuality='high';
  // photo, cover-fit with zoom and position
  if(bcImgs.photo){
    const im=bcImgs.photo,base=Math.max(PW/im.width,PH/im.height),sc=base*B.zoom/100,w=im.width*sc,h=im.height*sc;
    x.drawImage(im,(PW-w)*B.x/100,(PH-h)*B.y/100,w,h);
  }else{
    const g=x.createLinearGradient(0,0,PW,PH);g.addColorStop(0,'#DAD8D9');g.addColorStop(1,'#888B95');x.fillStyle=g;x.fillRect(0,0,PW,PH);
  }
  // gradient overlay with a per-slide strength ramp (stops at slide centers) and an optional fade toward the bottom
  const o=document.createElement('canvas');o.width=PW;o.height=PH;const ox=o.getContext('2d');
  const gr=GRADS.find(g=>g.id===B.grad)||GRADS[0];
  if(gr.img&&imgs[gr.img]){
    if(B.dir==='h'){ox.save();ox.translate(PW,0);ox.rotate(Math.PI/2);ox.drawImage(imgs[gr.img],0,0,PH,PW);ox.restore()}
    else ox.drawImage(imgs[gr.img],0,0,PW,PH);
  }else{
    const lg=B.dir==='h'?ox.createLinearGradient(0,0,PW,0):ox.createLinearGradient(0,0,0,PH);lg.addColorStop(0,gr.a);lg.addColorStop(1,gr.b);ox.fillStyle=lg;ox.fillRect(0,0,PW,PH);
  }
  ox.globalCompositeOperation='destination-in';
  const st=B.slides.map(s=>Math.max(0,Math.min(100,Number(s.strength)||0))/100);
  const ha=ox.createLinearGradient(0,0,PW,0);ha.addColorStop(0,`rgba(0,0,0,${st[0]})`);
  st.forEach((v,i)=>ha.addColorStop((i*SW+SW/2)/PW,`rgba(0,0,0,${v})`));ha.addColorStop(1,`rgba(0,0,0,${st[3]})`);
  ox.fillStyle=ha;ox.fillRect(0,0,PW,PH);
  if(B.fade>0){const va=ox.createLinearGradient(0,0,0,PH);va.addColorStop(0,'rgba(0,0,0,1)');va.addColorStop(0.42,'rgba(0,0,0,1)');va.addColorStop(1,`rgba(0,0,0,${1-B.fade/100})`);ox.fillStyle=va;ox.fillRect(0,0,PW,PH)}
  x.drawImage(o,0,0);
  if(guide&&!bcImgs.photo){x.save();x.setLineDash([24,16]);x.lineWidth=6;x.strokeStyle='rgba(255,255,255,.8)';rr(x,60,PH-260,PW-120,200,40);x.stroke();
    x.font=F(500,56);x.textAlign='center';x.textBaseline='middle';x.fillStyle='rgba(255,255,255,.95)';x.fillText('Upload a 16:5 photo. It runs across all four slides.',PW/2,PH-160);x.restore()}
  return c;
}
function bcLines(ctx,text,maxW){const out=[];for(const para of String(text||'').split('\n')){const t=para.trim();if(!t){continue}out.push(...wrap(ctx,t,maxW))}return out}
function bcRenderSlide(canvas,i,pano){
  canvas.width=SW;canvas.height=PH;const ctx=canvas.getContext('2d');ctx.imageSmoothingQuality='high';
  ctx.drawImage(pano,i*SW,0,SW,PH,0,0,SW,PH);
  const s=B.slides[i],sc=k=>(B.scale[k]??100)/100;ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='top';
  // logomark (template: 142 px wide, 172 px from the top)
  let markBottom=150;
  if(B.mark&&imgs.mark){const w=142*sc('mark'),h=w*imgs.mark.height/imgs.mark.width;ctx.drawImage(imgs.mark,SW/2-w/2,172,w,h);markBottom=172+h}
  // headline (Medium) and body (Book)
  const big=s.pos==='center'?1.125:1;let hs=75*sc('head')*big,bs=39*sc('body');
  ctx.font=F(WT(B,'head',500),hs);let hl=bcLines(ctx,s.head,900);while(hl.some(l=>ctx.measureText(l).width>960)&&hs>30){hs-=2;ctx.font=F(WT(B,'head',500),hs);hl=bcLines(ctx,s.head,900)}
  ctx.font=F(WT(B,'body',400),bs);const bl=bcLines(ctx,s.body,815);
  const headH=hl.length*hs*1.2,bodyH=bl.length?44+bl.length*bs*1.25:0,block=headH+bodyH;
  let y=s.pos==='center'?Math.max(markBottom+60,PH*0.45-block/2):markBottom+(B.mark?80:20);
  ctx.font=F(WT(B,'head',500),hs);for(const l of hl){ctx.fillText(l,SW/2,y);y+=hs*1.2}
  if(bl.length){y+=44;ctx.font=F(WT(B,'body',400),bs);for(const l of bl){ctx.fillText(l,SW/2,y);y+=bs*1.25}}
  // optional graphic (a calendar, chart or product cut-out) under the text
  const gf=bcImgs.gfx[i];
  if(gf){const top=y+60,maxW=900*sc('gfx'),maxH=Math.max(80,(PH-80-top))*Math.min(1,sc('gfx'));const k=Math.min(maxW/gf.width,maxH/gf.height);const w=gf.width*k,h=gf.height*k;ctx.drawImage(gf,SW/2-w/2,top,w,h)}
}
function bcDraw(){
  const pano=bcRenderPano(true);const pv=$('bcPreviews');pv.innerHTML='';
  for(let i=0;i<4;i++){const fig=document.createElement('figure');const c=document.createElement('canvas');c.setAttribute('aria-label',`Slide ${i+1}`);fig.appendChild(c);
    const cap=document.createElement('figcaption');cap.textContent=`Slide ${i+1}`;fig.appendChild(cap);pv.appendChild(fig);bcRenderSlide(c,i,pano);previewOverlays(c,null)}
}
function bcSync(){
  document.querySelectorAll('#bcSwatches .sw').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===B.grad)));
  $('bcSwName').textContent=(GRADS.find(g=>g.id===B.grad)||GRADS[0]).name;
  $('bcZoomVal').textContent=B.zoom+'%';$('bcXVal').textContent=B.x+'%';$('bcYVal').textContent=B.y+'%';$('bcFadeVal').textContent=B.fade+'%';
  $('bcImgClear').hidden=!bcImgs.photo;
  const im=bcImgs.photo;
  $('bcImgInfo').textContent=!im?'Best at 4320 × 1350 px. Other sizes are cropped to fill.':
    `${im.width} × ${im.height} px${Math.abs(im.width/im.height-3.2)>0.05?' · not 16:5, cropped to fill':''}${im.width<3200?' · under 3200 px wide, slides may look soft':''}`;
}
let bcRaf;function bcChanged(){bcSync();save();cancelAnimationFrame(bcRaf);bcRaf=requestAnimationFrame(bcDraw)}
function bcBuildSlides(){
  const box=$('bcSlides');box.innerHTML='';
  B.slides.forEach((s,i)=>{
    const d=document.createElement('div');d.className='stage';
    d.innerHTML=`<div class="hd"><b>Slide ${i+1}</b><span class="when">${i===0?'Cover':i===3?'Call to action':'Middle'}</span></div>
      <textarea rows="3" aria-label="Slide ${i+1} headline" placeholder="Headline (press Enter for a new line)" style="font:inherit;font-size:13px;color:var(--fg);background:var(--panel);border:1px solid var(--line);border-radius:7px;padding:6px 9px;resize:vertical;min-width:0"></textarea>
      <input type="text" aria-label="Slide ${i+1} body line" placeholder="Body line (optional)">
      <div class="row"><label class="f">Text position<select aria-label="Slide ${i+1} text position"><option value="top">Top</option><option value="center">Centered</option></select></label>
      <label class="f">Overlay <span class="tok"></span><input type="range" min="0" max="100" step="5" aria-label="Slide ${i+1} overlay strength" style="accent-color:var(--accent)"></label></div>
      <div class="upl"><input type="file" accept="image/png,image/webp,image/svg+xml,image/jpeg" hidden><button class="btn" type="button">Add graphic</button><button class="btn" type="button" hidden>Remove graphic</button></div>`;
    const ta=d.querySelector('textarea'),bd=d.querySelector('input[type=text]'),pos=d.querySelector('select'),rg=d.querySelector('input[type=range]'),tok=d.querySelector('.tok'),
      file=d.querySelector('input[type=file]'),[add,rm]=d.querySelectorAll('.upl .btn');
    ta.value=s.head;bd.value=s.body;pos.value=s.pos;rg.value=s.strength;tok.textContent=s.strength+'%';rm.hidden=!bcImgs.gfx[i];
    ta.addEventListener('input',()=>{s.head=ta.value;bcChanged()});bd.addEventListener('input',()=>{s.body=bd.value;bcChanged()});
    pos.addEventListener('change',()=>{s.pos=pos.value;bcChanged()});
    rg.addEventListener('input',()=>{s.strength=Number(rg.value);tok.textContent=rg.value+'%';bcChanged()});
    add.addEventListener('click',()=>file.click());
    file.addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;const url=await readFile(f);bcImgs.gfx[i]=await loadImg(url);bcIdb.set('bcGfx'+i,url);rm.hidden=false;e.target.value='';bcChanged()});
    rm.addEventListener('click',()=>{bcImgs.gfx[i]=null;bcIdb.del('bcGfx'+i);rm.hidden=true;bcChanged()});
    box.appendChild(d);
  });
}
function bcBindRange(id,key){const el=$(id);el.value=B[key];el.addEventListener('input',()=>{B[key]=Number(el.value);bcChanged()})}
bcBindRange('bcZoom','zoom');bcBindRange('bcX','x');bcBindRange('bcY','y');bcBindRange('bcFade','fade');
$('bcDir').value=B.dir;$('bcDir').addEventListener('change',e=>{B.dir=e.target.value;bcChanged()});
$('bcMark').checked=!!B.mark;$('bcMark').addEventListener('change',e=>{B.mark=e.target.checked;bcChanged()});
GRADS.forEach(g=>{const b=document.createElement('button');b.type='button';b.className='sw';b.title=g.name;b.setAttribute('aria-label',g.name);
  b.style.background=g.img?`center/cover url(${ASSETS.vfbg})`:`linear-gradient(180deg,${g.a},${g.b})`;b.dataset.id=g.id;
  b.addEventListener('click',()=>{B.grad=g.id;bcChanged()});$('bcSwatches').appendChild(b)});
const BC_SLIDERS=[['mark','Logomark'],['head','Headlines'],['body','Body lines'],['gfx','Graphics']];
function bcBuildSliders(){const box=$('bcSliders');box.innerHTML='';BC_SLIDERS.forEach(([k,label])=>{const row=document.createElement('div');row.className='sl';
  row.innerHTML=`<span>${label}</span><input type="range" id="bc-size-${k}" min="25" max="250" step="1" aria-label="${label} size"><output>${B.scale[k]}%</output>`;
  const i=row.querySelector('input'),o=row.querySelector('output');i.value=B.scale[k];i.addEventListener('input',()=>{B.scale[k]=Number(i.value);o.textContent=i.value+'%';bcChanged()});row.appendChild(wsel(B,k,label,bcChanged));box.appendChild(row)})}
bcBuildSlides();bcBuildSliders();
$('bcResetSizes').addEventListener('click',()=>{Object.keys(B.scale).forEach(k=>B.scale[k]=100);Object.assign(B.w,{head:500,body:400});bcBuildSliders();bcChanged()});
$('bcResetCopy').addEventListener('click',()=>{B.slides.forEach((s,i)=>{const d=BC_SLIDE_DEFAULTS[i];s.head=d.head;s.body=d.body;s.pos=d.pos});bcBuildSlides();bcChanged()});
$('bcImgBtn').addEventListener('click',()=>$('bcImgFile').click());
$('bcImgFile').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;const url=await readFile(f);bcImgs.photo=await loadImg(url);bcIdb.set('bcPhoto',url);
  B.zoom=100;B.x=50;B.y=50;['bcZoom','bcX','bcY'].forEach(id=>$(id).value=id==='bcZoom'?100:50);e.target.value='';bcChanged()});
$('bcImgClear').addEventListener('click',()=>{bcImgs.photo=null;bcIdb.del('bcPhoto');bcChanged()});
$('bcExport').addEventListener('click',async()=>{
  const st=$('bcStatus');if(!downloads){st.textContent='Downloads are not available in this browser.';return}
  const btn=$('bcExport');btn.disabled=true;
  try{st.textContent='Rendering…';const pano=bcRenderPano(false);const c=document.createElement('canvas');const zip=new JSZip();
    const base=slug((B.slides[0].head||'blog').split('\n').join(' ')).slice(0,40)||'blog';
    for(let i=0;i<4;i++){bcRenderSlide(c,i,pano);zip.file(`${base}_carousel/${String(i+1).padStart(2,'0')}_${base}.png`,await toBlob(c))}
    const name=`${base}_carousel.zip`;await downloads.save({filename:name,data:await zip.generateAsync({type:'blob'})});st.textContent=`Saved ${name}`}
  catch(err){console.error(err);const code=err&&err.code;st.textContent=code==='declined'?'Download cancelled.':'Export failed. Try again.'}
  finally{btn.disabled=false}
});
async function bcLoadStored(){
  const p=await bcIdb.get('bcPhoto');if(p)bcImgs.photo=await loadImg(p);
  for(let i=0;i<4;i++){const g=await bcIdb.get('bcGfx'+i);if(g)bcImgs.gfx[i]=await loadImg(g)}
  bcBuildSlides();bcSync();
}

/* ================= Fast Promo (9:16 Story + 4:5 feed from one set of inputs) ================= */
const FP_BGS=[{id:'s-ink',name:'Black',c:'#101921'},{id:'s-white',name:'White',c:'#FFFFFF'},{id:'s-lgray',name:'Light gray',c:'#DAD8D9'},
  {id:'s-pink',name:'Pink',c:'#E04584'},{id:'s-orange',name:'Orange',c:'#FF7F39'},...GRADS.map(g=>Object.assign({},g,{id:'g-'+g.id}))];
const FP_DEFAULT={link:{on:false,y:80,w:48},gap:{mark:0,eyebrow:0,lead:0,offer:0,caption:0},f169:false,eyebrow:'Limited-Time Savings',caps:true,lead:'Up To',offer:'$100\nOff',caption:'Sublijet Standard Bundles',
  bg:'s-ink',accent:'grad',text:'auto',mark:'brand',f916:true,f45:true,nudge:0,example:true,
  scale:{mark:100,eyebrow:100,lead:100,offer:100,caption:100,img:100},w:{eyebrow:500,lead:500,offer:700,caption:400}};
S.fp=Object.assign(structuredClone(FP_DEFAULT),S.fp||{});S.fp.gap=Object.assign({},FP_DEFAULT.gap,S.fp.gap||{});S.fp.scale=Object.assign({},FP_DEFAULT.scale,S.fp.scale||{});S.fp.w=Object.assign({},FP_DEFAULT.w,S.fp.w||{});
const FPS=S.fp;const fpImgs={product:null};
/* Layout per format. 4:5 matches the Canva promo (scaled from 960 × 1200); 9:16 keeps clear of Story UI at top and bottom. */
const FP_FORMATS=[{id:'9x16',label:'9:16',W:1080,H:1920,top:300,bottom:300,cls:'f916',key:'f916',k:1.18},{id:'4x5',label:'4:5',W:1080,H:1350,top:128,bottom:100,cls:'f45',key:'f45'},{id:'16x9',label:'16:9',W:1920,H:1080,top:0,bottom:0,cls:'f169',key:'f169',land:true}];
function fpLum(hex){const n=parseInt(hex.slice(1),16),r=n>>16&255,g=n>>8&255,b=n&255;return (0.299*r+0.587*g+0.114*b)/255}
function fpBg(){return FP_BGS.find(b=>b.id===FPS.bg)||FP_BGS[0]}
function fpIsLight(){const b=fpBg();if(b.c)return fpLum(b.c)>0.6;if(b.img)return false;return (fpLum(b.a)+fpLum(b.b))/2>0.72}
function fpTextColor(){return FPS.text!=='auto'?FPS.text:(fpIsLight()?'#101921':'#FFFFFF')}
function fpRender(canvas,fmt,guide){
  const W=fmt.W||1080,H=fmt.H;canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');ctx.imageSmoothingQuality='high';
  const bg=fpBg();
  if(bg.c){ctx.fillStyle=bg.c;ctx.fillRect(0,0,W,H)}
  else if(bg.img&&imgs[bg.img]){const im=imgs[bg.img],k=Math.max(W/im.width,H/im.height);ctx.drawImage(im,(W-im.width*k)/2,(H-im.height*k)/2,im.width*k,im.height*k)}
  else{const lg=ctx.createLinearGradient(0,0,0,H);lg.addColorStop(0,bg.a);lg.addColorStop(1,bg.b);ctx.fillStyle=lg;ctx.fillRect(0,0,W,H)}
  const K=fmt.k||1,sc=k=>(FPS.scale[k]??100)/100*K,tc=fpTextColor(),gp=k=>Number(FPS.gap[k]||0);
  ctx.textAlign='center';ctx.textBaseline='top';
  // text column: centered for portrait; left half for 16:9
  const land=!!fmt.land,cx=land?W*0.29:W/2,colW=land?W*0.5:960;
  // ---- measure the stack ----
  const parts=[];
  let markW=0,markH=0;if(FPS.mark!=='off'&&imgs.mark){markW=67*sc('mark');markH=markW*imgs.mark.height/imgs.mark.width;parts.push({k:'mark',h:markH,after:24+gp('mark')})}
  const eb=(FPS.caps?FPS.eyebrow.toUpperCase():FPS.eyebrow).trim();let es=45*sc('eyebrow');
  if(eb){ctx.font=F(WT(FPS,'eyebrow',500),es);while(ctx.measureText(eb).width>colW&&es>16){es-=1;ctx.font=F(WT(FPS,'eyebrow',500),es)}parts.push({k:'eyebrow',h:es,after:es*0.5+gp('eyebrow')})}
  const lead=FPS.lead.trim(),ls=60*sc('lead');if(lead)parts.push({k:'lead',h:ls,after:ls*0.25+gp('lead')});
  const offer=String(FPS.offer||'').split('\n').map(l=>l.trim()).filter(Boolean);let os=225*sc('offer');ctx.font=F(WT(FPS,'offer',700),os);
  while(offer.some(l=>ctx.measureText(l).width>colW+20)&&os>50){os-=4;ctx.font=F(WT(FPS,'offer',700),os)}
  const step=os*0.91;if(offer.length)parts.push({k:'offer',h:offer.length*step,after:gp('offer')});
  const cap=FPS.caption.trim(),cs=30*sc('caption');
  // ---- place ----
  let y,capY,boxTop,boxBot,boxL,boxR;
  if(land){
    const capH=cap?cs*1.2+30+gp('caption'):0,stackH=parts.reduce((t,p)=>t+p.h+p.after,0)+capH;
    y=Math.max(60,(H-stackH)/2);boxL=W*0.56;boxR=W-80;boxTop=100;boxBot=H-100;
  }else{
    y=fmt.top;capY=H-fmt.bottom-(cap?cs*1.2:0);boxL=60;boxR=W-60;
  }
  for(const p of parts){
    if(p.k==='mark'){const off=document.createElement('canvas');off.width=Math.ceil(markW);off.height=Math.ceil(markH);const ox=off.getContext('2d');ox.drawImage(imgs.mark,0,0,markW,markH);ox.globalCompositeOperation='source-in';
      if(FPS.mark==='brand'){const g=ox.createLinearGradient(0,0,markW,0);g.addColorStop(0.35,'#E04584');g.addColorStop(0.65,'#FF7F39');ox.fillStyle=g}else ox.fillStyle=FPS.mark;ox.fillRect(0,0,markW,markH);ctx.drawImage(off,cx-markW/2,y)}
    if(p.k==='eyebrow'){ctx.font=F(WT(FPS,'eyebrow',500),es);ctx.fillStyle=tc;ctx.fillText(eb,cx,y)}
    if(p.k==='lead'||p.k==='offer'){
      if(!p.fill){const accTop=y,accH=parts.filter(q=>q.k==='lead'||q.k==='offer').reduce((t,q)=>t+q.h+(q.k==='lead'?q.after:0),0);
        let f=FPS.accent;if(f==='grad'){const g=ctx.createLinearGradient(0,accTop,0,accTop+accH);g.addColorStop(0,'#E04584');g.addColorStop(1,'#FF7F39');f=g}
        parts.forEach(q=>{if(q.k==='lead'||q.k==='offer')q.fill=f})}
      ctx.fillStyle=p.fill;
      if(p.k==='lead'){ctx.font=F(WT(FPS,'lead',500),ls);ctx.fillText(lead,cx,y)}
      else{ctx.font=F(WT(FPS,'offer',700),os);let yy=y;for(const l of offer){ctx.fillText(l,cx,yy-os*0.08);yy+=step}}
    }
    y+=p.h+p.after;
  }
  if(land){if(cap){y+=30+gp('caption');ctx.font=F(WT(FPS,'caption',400),cs);ctx.fillStyle=tc;ctx.fillText(cap,cx,y)}}
  else{boxTop=y+20;boxBot=capY-18-gp('caption');if(cap){ctx.font=F(WT(FPS,'caption',400),cs);ctx.fillStyle=tc;ctx.fillText(cap,cx,capY)}}
  const boxW=boxR-boxL,boxH=Math.max(60,boxBot-boxTop);
  if(fpImgs.product){const im=fpImgs.product,k=Math.min(Math.min(boxW,920)*sc('img')/K/im.width,boxH*sc('img')/K/im.height),w=im.width*k,h=im.height*k;
    ctx.drawImage(im,boxL+(boxW-w)/2,boxTop+(boxH-h)/2+FPS.nudge,w,h)}
  else if(guide){ctx.save();ctx.setLineDash([16,12]);ctx.lineWidth=4;ctx.strokeStyle=fpIsLight()?'rgba(16,25,33,.45)':'rgba(255,255,255,.55)';rr(ctx,boxL+30,boxTop,boxW-60,boxH,24);ctx.stroke();
    ctx.font=F(500,34);ctx.textBaseline='middle';ctx.fillStyle=ctx.strokeStyle;ctx.fillText('Upload a product cut-out',boxL+boxW/2,boxTop+boxH/2);ctx.restore()}
}
function fpDraw(){const pv=$('fpPreviews');pv.innerHTML='';const fs=FP_FORMATS.filter(f=>FPS[f.key]);
  if(!fs.length){pv.innerHTML='<p class="empty">Turn on at least one format.</p>';return}
  fs.forEach(f=>{const fig=document.createElement('figure');fig.className=f.cls;const c=document.createElement('canvas');c.setAttribute('aria-label',`Promo at ${f.label}`);fig.appendChild(c);
    const cap=document.createElement('figcaption');cap.textContent=`${f.label} · ${f.W}×${f.H}`;fig.appendChild(cap);pv.appendChild(fig);fpRender(c,f,true);previewOverlays(c,f.id==='9x16'?FPS.link:null)})}
function fpSync(){
  document.querySelectorAll('#fpSwatches .sw').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===FPS.bg)));
  $('fpBgName').textContent=fpBg().name;$('fpExample').hidden=!FPS.example;$('fpImgClear').hidden=!fpImgs.product;$('fpNudgeVal').textContent=(FPS.nudge>0?'+':'')+FPS.nudge+' px';
  const warns=[];const bg=fpBg();
  if(FPS.accent==='grad'||FPS.accent==='#E04584'||FPS.accent==='#FF7F39'){if(bg.c==='#E04584'||bg.c==='#FF7F39'||(!bg.c))warns.push('The offer color is close to the background. Switch the offer to white or the background to black.')}
  if(FPS.accent==='grad')warns.push('Gradient text needs approval under the brand guide. It matches the current Sublijet promo.');
  $('fpWarn').hidden=!warns.length;$('fpWarn').textContent=warns.join(' ');
}
let fpRaf;function fpChanged(){fpSync();save();cancelAnimationFrame(fpRaf);fpRaf=requestAnimationFrame(fpDraw)}
[['fpEyebrow','eyebrow'],['fpLead','lead'],['fpOffer','offer'],['fpCaption','caption']].forEach(([id,k])=>{const el=$(id);el.value=FPS[k];el.addEventListener('input',()=>{FPS[k]=el.value;FPS.example=false;fpChanged()})});
[['fpCaps','caps'],['fpF916','f916'],['fpF45','f45'],['fpF169','f169']].forEach(([id,k])=>{const el=$(id);el.checked=!!FPS[k];el.addEventListener('change',()=>{FPS[k]=el.checked;fpChanged()})});
[['fpAccent','accent'],['fpText','text'],['fpMark','mark']].forEach(([id,k])=>{const el=$(id);el.value=FPS[k];el.addEventListener('change',()=>{FPS[k]=el.value;fpChanged()})});
$('fpNudge').value=FPS.nudge;$('fpNudge').addEventListener('input',e=>{FPS.nudge=Number(e.target.value);fpChanged()});
FP_BGS.forEach(g=>{const b=document.createElement('button');b.type='button';b.className='sw'+(g.c?' solid':'');b.title=g.name;b.setAttribute('aria-label',g.name);
  b.style.background=g.c?g.c:g.img?`center/cover url(${ASSETS.vfbg})`:`linear-gradient(180deg,${g.a},${g.b})`;b.dataset.id=g.id;
  b.addEventListener('click',()=>{FPS.bg=g.id;fpChanged()});$('fpSwatches').appendChild(b)});
const FP_GAPS=[['mark','Logomark → eyebrow'],['eyebrow','Eyebrow → lead-in'],['lead','Lead-in → offer'],['offer','Offer → product'],['caption','Product → caption']];
function fpBuildGaps(){const box=$('fpGaps');box.innerHTML='';FP_GAPS.forEach(([k,label])=>{const row=document.createElement('div');row.className='sl';
  row.innerHTML=`<span>${label}</span><input type="range" min="-80" max="240" step="1" aria-label="${label} spacing"><output>${FPS.gap[k]} px</output><span></span>`;
  const i=row.querySelector('input'),o=row.querySelector('output');i.value=FPS.gap[k];i.addEventListener('input',()=>{FPS.gap[k]=Number(i.value);o.textContent=i.value+' px';fpChanged()});box.appendChild(row)})}
const FP_SLIDERS=[['mark','Logomark'],['eyebrow','Eyebrow'],['lead','Lead-in'],['offer','Offer'],['caption','Caption'],['img','Product image']];
function fpBuildSliders(){const box=$('fpSliders');box.innerHTML='';FP_SLIDERS.forEach(([k,label])=>{const row=document.createElement('div');row.className='sl';
  row.innerHTML=`<span>${label}</span><input type="range" id="fp-size-${k}" min="25" max="250" step="1" aria-label="${label} size"><output>${FPS.scale[k]}%</output>`;
  const i=row.querySelector('input'),o=row.querySelector('output');i.value=FPS.scale[k];i.addEventListener('input',()=>{FPS.scale[k]=Number(i.value);o.textContent=i.value+'%';fpChanged()});
  row.appendChild(wsel(FPS,k,label,fpChanged));box.appendChild(row)})}
fpBuildSliders();fpBuildGaps();
$('fpResetGaps')&&$('fpResetGaps').addEventListener('click',()=>{Object.keys(FPS.gap).forEach(k=>FPS.gap[k]=0);fpBuildGaps();fpChanged()});
$('fpResetSizes').addEventListener('click',()=>{Object.keys(FPS.scale).forEach(k=>FPS.scale[k]=100);FPS.w=structuredClone(FP_DEFAULT.w);FPS.nudge=0;$('fpNudge').value=0;fpBuildSliders();fpChanged()});
$('fpImgBtn').addEventListener('click',()=>$('fpImgFile').click());
$('fpImgFile').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;const url=await readFile(f);fpImgs.product=await loadImg(url);bcIdb.set('fpImg',url);e.target.value='';fpChanged()});
$('fpImgClear').addEventListener('click',()=>{fpImgs.product=null;bcIdb.del('fpImg');fpChanged()});
$('fpExport').addEventListener('click',async()=>{
  const st=$('fpStatus');const fs=FP_FORMATS.filter(f=>FPS[f.key]);if(!fs.length){st.textContent='Turn on at least one format.';return}
  const btn=$('fpExport');btn.disabled=true;
  try{st.textContent='Rendering…';const base=slug([FPS.lead,FPS.offer.split('\n').join(' '),FPS.caption].join(' ')).slice(0,50)||'promo';const c=document.createElement('canvas');
    if(fs.length===1){fpRender(c,fs[0],false);const name=`${base}_${fs[0].id}.png`;await downloads.save({filename:name,data:await toBlob(c)});st.textContent=`Saved ${name}`}
    else{const zip=new JSZip();for(const f of fs){fpRender(c,f,false);zip.file(`${base}_${f.id}.png`,await toBlob(c))}const name=`${base}_promo.zip`;await downloads.save({filename:name,data:await zip.generateAsync({type:'blob'})});st.textContent=`Saved ${name}`}}
  catch(err){console.error(err);st.textContent='Export failed. Try again.'}
  finally{btn.disabled=false}
});
async function fpLoadStored(){const p=await bcIdb.get('fpImg');if(p)fpImgs.product=await loadImg(p);fpSync()}

/* Collapsible rail sections: click a section title to fold it; the state is remembered in this browser */
(function(){
  let saved={};try{saved=JSON.parse(localStorage.getItem('sg-collapsed')||'{}')}catch(e){}
  const keep=()=>{try{localStorage.setItem('sg-collapsed',JSON.stringify(saved))}catch(e){}};
  document.querySelectorAll('.wrap').forEach(w=>{
    const secs=[...w.querySelectorAll('.rail > .sec')];if(!secs.length)return;
    secs.forEach((sec,i)=>{const h=sec.querySelector(':scope > h2');if(!h)return;const key=w.id+':'+i;
      if(saved[key]===undefined?i>0&&w.id!=='tradeshow':saved[key])sec.classList.add('collapsed');
      h.setAttribute('role','button');h.tabIndex=0;h.setAttribute('aria-expanded',String(!sec.classList.contains('collapsed')));
      const tog=e=>{if(e.target.closest('button,input,select,a'))return;if(e.type==='keydown'&&e.key!=='Enter'&&e.key!==' ')return;e.preventDefault();
        sec.classList.toggle('collapsed');saved[key]=sec.classList.contains('collapsed');h.setAttribute('aria-expanded',String(!saved[key]));keep()};
      h.addEventListener('click',tog);h.addEventListener('keydown',tog)});
    const rail=w.querySelector('.rail');const tools=document.createElement('div');tools.className='railtools';
    tools.innerHTML='<button type="button">Expand all</button><button type="button">Collapse all</button>';
    const [ex,co]=tools.querySelectorAll('button');
    const setAll=c=>{secs.forEach((sec,i)=>{sec.classList.toggle('collapsed',c);saved[w.id+':'+i]=c;const h=sec.querySelector(':scope > h2');if(h)h.setAttribute('aria-expanded',String(!c))});keep()};
    ex.addEventListener('click',()=>setAll(false));co.addEventListener('click',()=>setAll(true));rail.prepend(tools);
  });
})();

/* boot */
(async function(){
  const keys=['mark','versiflex','sublijet','splash','vfbg','qmarks'];
  await Promise.all(keys.map(async k=>{imgs[k]=await loadImg(ASSETS[k])}));
  imgs.splashCur=imgs.splash;
  if(S.splash){const s=await loadImg(S.splash);if(s)imgs.splashCur=s}
  if(S.logo)imgs.logo=await loadImg(S.logo);
  if(S.dealerLogo)imgs.dealerLogo=await loadImg(S.dealerLogo);
  try{await document.fonts.ready}catch(e){}
  changed(true);
  if(P.logo)imgs.prLogo=await loadImg(P.logo);
  imgs.sawgrass=await loadImg(ASSETS.sawgrass);prSync();
  if(Hh.img)imgs.holImg=await loadImg(Hh.img);holSync();iywSync();tsLinkUI();guideToggles();
  linkControls('prLink',()=>P.link,()=>{save();prDraw()});linkControls('holLink',()=>Hh.link,()=>{save();holDraw()});linkControls('iywLink',()=>Q.link,()=>{save();iywDraw()});linkControls('fpLink',()=>FPS.link,()=>{save();fpDraw()});await bcLoadStored();await fpLoadStored();
  try{const fl=await bcIdb.get('fonts');if(fl&&fl.length)await applyFonts(fl)}catch(e){}
  show(['#stories','#tradeshow','#pr','#holiday','#words','#blog','#fast'].includes(location.hash)?location.hash.slice(1):'home');
  // Only edits made after the page has loaded count as changes worth syncing.
  setTimeout(()=>{window.SG_BOOTED=true},1200);
  // Standalone: save files with a normal browser download.
  downloads={save:async({filename,data})=>{const blob=data instanceof Blob?data:new Blob([data]);const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);return{status:'saved'}}};
})();
})();
