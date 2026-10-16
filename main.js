const $=(s,r=document)=>[...r.querySelectorAll(s)];

// ---------- Menú (los títulos llevan a secciones reales) ----------
const L=[['Inicio','v1'],['Historia','v2#hist'],['Gente','v1#g1'],['Festival','v1#f1'],['Galería','v3#gal'],['Descarga','v1#dl']];
$('header.nav').forEach(h=>{
  const pc=h.classList.contains('nav2')?'btn2':h.classList.contains('nav3')?'pill pa':'pill p-red';
  h.innerHTML=`<a class="logo" href="#" data-to="v1" aria-label="Cuerda Clave, ir al inicio"><span class="wm"></span></a>
  <ul>${L.map(([t,k])=>`<li><a href="#" data-to="${k}">${t}</a></li>`).join('')}</ul>
  <div class="row"><button class="${pc}" data-crew>PARTICIPA</button><button class="burger" aria-label="Menú">☰</button></div>`;
});
const showV=v=>{if(!au.paused&&own!==v)au.pause();$('.sw button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));$('.v').forEach(m=>m.classList.toggle('on',m.id===v))};
const go=k=>{const[v,id]=k.split('#');showV(v);setTimeout(()=>{const t=id&&document.getElementById(id);t?t.scrollIntoView({behavior:'smooth'}):scrollTo({top:0,behavior:'smooth'})},40)};

// ---------- Audio: cada sección arranca con una canción distinta (editable en TRACKS) ----------
const TRACKS=[{src:'assets/audio/claro-que-te-amo.mp3',name:'Claro que te amo (cover de guitarra)'},{src:'assets/audio/agustin-codazzi-cesar.mp3',name:'Agustín Codazzi – Cesar'},{src:'assets/audio/pista-3.mp3',name:'Pista 3'},{src:'assets/audio/pista-4.mp3',name:'Pista 4'},{src:'assets/audio/pista-5.mp3',name:'Pista 5'},{src:'assets/audio/pista-6.mp3',name:'Pista 6'},{src:'assets/audio/pista-7.mp3',name:'Pista 7'},{src:'assets/audio/pista-8.mp3',name:'Pista 8'},{src:'assets/audio/pista-9.mp3',name:'Pista 9'}];
const ts={v1:0,v2:1,v3:2};let own='v1',cur=-1,tn=0;const au=new Audio();au.preload='none';
const sec=el=>el.closest('.v').id;
const setP=()=>{const on=!au.paused;$('.v').forEach(v=>v.classList.toggle('playing',on&&v.id===own));$('.play').forEach(b=>{b.dataset.o=b.dataset.o||b.textContent;b.textContent=on&&sec(b)===own?'❚❚ PAUSAR':b.dataset.o})};
const play=s=>{if(own!==s||cur!==ts[s]){own=s;cur=ts[s];au.src=TRACKS[cur].src;au.playbackRate=au.defaultPlaybackRate=2**(tn/12)}au.play().catch(()=>{})};
const showT=()=>$('.trsel').forEach(t=>t.value=ts[sec(t)]);
const pick=(s,i)=>{ts[s]=(i+TRACKS.length)%TRACKS.length;showT();if(!au.paused&&own===s)play(s)};
au.onplay=()=>{setP();$('video').forEach(v=>v.pause())};au.onpause=setP;au.onended=()=>{ts[own]=(ts[own]+1)%TRACKS.length;showT();play(own)};
$('.play').forEach(b=>b.onclick=()=>{const s=sec(b);!au.paused&&own===s?au.pause():play(s)});
document.addEventListener('play',e=>{if(e.target.tagName==='VIDEO'){au.pause();$('video').forEach(v=>v!==e.target&&v.pause())}},true);
document.addEventListener('change',e=>{if(e.target.classList.contains('trsel'))pick(sec(e.target),+e.target.value)});

// ---------- Ecualizador + control de tono (semitonos, -6 a +6) ----------
$('.eq').forEach(e=>{
  for(let i=0;i<30;i++){const b=document.createElement('i');b.style.setProperty('--d',i%12);e.append(b)}
  const t=document.createElement('div');t.className='tone';
  t.innerHTML=`<span>TONO</span><button data-tn="-1" aria-label="Bajar tono">−</button><b class="tv">0</b><button data-tn="1" aria-label="Subir tono">+</button><button data-tn="0" aria-label="Tono original" title="Restablecer">↺</button><span class="sp"></span><button data-prev aria-label="Canción anterior" title="Anterior">⏮</button><select class="trsel" aria-label="Elegir canción">${TRACKS.map((t,i)=>`<option value="${i}">${t.name}</option>`).join('')}</select><button data-next aria-label="Siguiente canción" title="Siguiente">⏭</button>`;
  e.after(t);
});
showT();
const setTone=n=>{tn=Math.max(-6,Math.min(6,n));au.playbackRate=au.defaultPlaybackRate=2**(tn/12);au.preservesPitch=au.mozPreservesPitch=au.webkitPreservesPitch=false;$('.tv').forEach(v=>v.textContent=tn>0?'+'+tn:tn)};

// ---------- Punteo de guitarra (síntesis Karplus-Strong) ----------
let ac;function ks(f){try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();ac.resume();const sr=ac.sampleRate,N=Math.round(sr/f),len=sr*2,b=ac.createBuffer(1,len,sr),d=b.getChannelData(0);for(let i=0;i<N;i++)d[i]=Math.random()*2-1;for(let i=N;i<len;i++)d[i]=.997*.5*(d[i-N]+d[i-N+1]);const s=ac.createBufferSource(),g=ac.createGain();s.buffer=b;g.gain.value=.6;s.connect(g);g.connect(ac.destination);s.start()}catch(e){}}

// ---------- Filtros de la línea de tiempo ----------
$('.flt button').forEach(b=>b.onclick=()=>{$('.flt button').forEach(x=>x.classList.toggle('on',x===b));$('.tli div').forEach(d=>d.classList.toggle('hide',b.dataset.f!=='all'&&!d.dataset.t.includes(b.dataset.f)))});

// ---------- Galería: cargar fotos (se guardan en IndexedDB de este navegador) ----------
const DB=new Promise(r=>{try{const q=indexedDB.open('cuerdaclave',1);q.onupgradeneeded=()=>q.result.createObjectStore('f',{autoIncrement:true});q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)}catch(e){r(null)}});
const st=async(m,f)=>{const d=await DB;if(!d)return;return new Promise(r=>{const t=d.transaction('f',m),q=f(t.objectStore('f'));t.oncomplete=()=>r(q&&q.result);t.onerror=()=>r()})};
const say=m=>$('#ok')[0].textContent=m;
const addFig=(src,alt='Foto cargada por la comunidad')=>{const f=document.createElement('figure'),i=new Image();i.src=src;i.alt=alt;f.append(i);$('#galeria')[0].prepend(f)};
const shrink=async file=>{const b=await createImageBitmap(file),k=Math.min(1,1000/Math.max(b.width,b.height)),c=document.createElement('canvas');c.width=b.width*k;c.height=b.height*k;c.getContext('2d').drawImage(b,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.8)};
$('#lf')[0].onclick=e=>{if(!$('#ac')[0].checked){e.preventDefault();say('Acepta los términos y condiciones para cargar tus fotos.')}};
$('#fi')[0].onchange=async e=>{let n=0;for(const f of e.target.files){if(!f.type.startsWith('image/'))continue;try{const u=await shrink(f);await st('readwrite',s=>s.add(u));addFig(u);n++}catch(x){}}e.target.value='';say(n?`¡Listo! Se agregaron ${n} foto${n>1?'s':''} a la galería.`:'No se pudo cargar ninguna imagen.')};
st('readonly',s=>s.getAll()).then(a=>(a||[]).forEach(u=>addFig(u)));

// ---------- Clics globales: navegación, tono, burger, lightbox, términos, imprimir ----------
document.addEventListener('click',e=>{
  if(e.target.closest('[data-crew]')){e.preventDefault();$('#cm')[0].textContent='';$('.nav.open').forEach(n=>n.classList.remove('open'));$('#crew')[0].showModal();return}
  const nx=e.target.closest('[data-next],[data-prev]');if(nx){const s=sec(nx);pick(s,ts[s]+(nx.hasAttribute('data-next')?1:-1));return}
  if(e.target.closest('[data-map]')){window.open('https://www.google.com/maps/search/Parque+de+la+Guitarra+Agustín+Codazzi+Cesar','_blank');return}
  const nt=e.target.closest('[data-note]');if(nt){ks(+nt.dataset.note);nt.classList.add('on');setTimeout(()=>nt.classList.remove('on'),180);return}
  const g=e.target.closest('[data-to]');
  if(g){e.preventDefault();go(g.dataset.to);$('.nav.open').forEach(n=>n.classList.remove('open'));return}
  const t=e.target.closest('[data-tn]');if(t){setTone(t.dataset.tn==='0'?0:tn+ +t.dataset.tn);return}
  const b=e.target.closest('.burger');if(b){b.closest('.nav').classList.toggle('open');return}
  const f=e.target.closest('.gal figure');if(f){$('#lb img')[0].src=f.querySelector('img').src;$('#lb')[0].showModal();return}
  if(e.target.closest('[data-tyc]')){e.preventDefault();$('#tyc')[0].showModal();return}
  if(e.target.closest('dialog .x')||e.target.tagName==='DIALOG'){e.target.closest('dialog').close();return}
  if(e.target.closest('#pr')){document.body.classList.add('pp');print()}
});
addEventListener('afterprint',()=>document.body.classList.remove('pp'));

// ---------- Datos curiosos (cambian cada vez que se presiona el botón) ----------
const FACTS=['El festival nació en 1987, por iniciativa del compositor y folclorista codacense Armando León Quintero, quien propuso una competencia dedicada al vallenato interpretado con guitarra.','La primera edición se realizó entre el 14 y el 16 de agosto de 1987, cuando los festivales de acordeoneros ya eran muy populares en la región Caribe.','A diferencia del vallenato tradicional, aquí el protagonista no es el acordeón, sino la guitarra, que se convierte en el instrumento principal para interpretar paseos y merengues vallenatos.','En 2022, el Festival de Música Vallenata en Guitarra de Codazzi fue declarado Patrimonio Cultural de la Nación por el Congreso de Colombia.','El evento se realiza en Agustín Codazzi, Cesar, un municipio considerado parte de la zona vallenata y ubicado a unos 60 kilómetros de Valledupar.','Los concursantes participan en varias categorías: Infantil, Juvenil, Aficionado, Profesional y Canción Inédita.','Los concursos suelen centrarse en los aires musicales del vallenato, especialmente el paseo y el merengue.','Desde 2014, el festival se celebra en el Parque de la Guitarra, un espacio creado especialmente para este evento cultural.','El festival es considerado la principal festividad de Agustín Codazzi y uno de los eventos más reconocidos del vallenato en versión guitarra en Colombia.','En su edición de 2025, el festival se realizó del 15 al 17 de agosto y dejó cifras récord en turismo y comercio para el municipio.','El vallenato, género musical que celebra el festival, fue declarado Patrimonio Cultural Inmaterial de la Humanidad por la UNESCO.','El festival ha servido como escenario para artistas y tríos nuevos; en 2022 compitieron grupos como Trío Futuro, Trío Fénix, Trío Tayrona y Trío Son Plateños, entre otros.'];
let fi=Math.floor(Math.random()*FACTS.length)-1;
const nextF=()=>{fi=(fi+1)%FACTS.length;const p=$('#dt')[0];p.classList.remove('flip');void p.offsetWidth;p.classList.add('flip');p.textContent=FACTS[fi];$('#dn')[0].textContent=`${fi+1}/${FACTS.length}`};
$('#dnx')[0].onclick=nextF;nextF();

// ---------- Crew Cuerda Clave (PARTICIPA) ----------
const CREW_ENDPOINT=''; // pega aquí la URL de tu formulario (Formspree, Google Apps Script...) para recibir los datos
const cm=m=>$('#cm')[0].textContent=m;
$('#cs')[0].onclick=async()=>{
  const n=$('#cn')[0].value.trim(),e=$('#ce')[0].value.trim();
  if(n.length<2)return cm('Escribe tu nombre.');
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))return cm('Escribe un correo válido.');
  if(!$('#cc')[0].checked)return cm('Acepta los términos y condiciones.');
  const d={nombre:n,correo:e,fecha:new Date().toISOString()};
  try{const l=JSON.parse(localStorage.getItem('crew')||'[]');l.push(d);localStorage.setItem('crew',JSON.stringify(l))}catch(x){}
  if(CREW_ENDPOINT){try{await fetch(CREW_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})}catch(x){return cm('No pudimos enviar tus datos. Intenta de nuevo.')}}
  cm(`¡Listo, ${n}! Quedaste registrad@ en el Crew Cuerda Clave.`);$('#cn')[0].value=$('#ce')[0].value='';$('#cc')[0].checked=false};
