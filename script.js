const PAYPAL_HANDLE = "Mitoumakeup";
const IG_HANDLE = "mitou_makeup";
let isSubmittingReservation = false;
let isSubmittingMariee = false;

const SUPABASE_URL = "https://cayadmbypnfukskotrma.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNheWFkbWJ5cG5mdWtza290cm1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0OTcxODIsImV4cCI6MjEwMzA3MzE4Mn0._j5jQ1kXYOz5NhJLBsRlGXI8HEBRMQCo3ka3QrjYUe0";

let supabaseClient = null;
try{
  if(window.supabase && typeof window.supabase.createClient === 'function'){
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    console.warn('Supabase JS non chargé — vérifie le <script> CDN dans index.html.');
  }
}catch(e){
  console.warn('Supabase : initialisation impossible, le site continue sans.', e);
}

/* ---------- menu mobile ---------- */
const menuBtn = document.querySelector('.menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');
menuBtn.addEventListener('click',()=>mobileMenu.classList.toggle('open'));
document.querySelectorAll('.mobile-menu a').forEach(a=>a.addEventListener('click',()=>mobileMenu.classList.remove('open')));

/* ---------- reveal ---------- */
const observer = new IntersectionObserver(entries=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('show'); observer.unobserve(e.target); } });
},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

setTimeout(()=>{
  document.querySelectorAll('.reveal:not(.show)').forEach(el=>el.classList.add('show'));
}, 1500);

/* ---------- catalogue ---------- */
const TONES = {
  softglam:   {name:"Makeup Soft Glam", price:"90€", dep:30, color:"#c6b6a3", desc:"Un teint lumineux, un regard structuré en douceur — parfait en journée comme en soirée. Avec ou sans faux cils."},
  sophistique:{name:"Makeup Sophistiqué", price:"95€", dep:30, color:"#332628", desc:"Le look le plus travaillé : finitions soignées, détails travaillés et mise en beauté complète. Avec ou sans faux cils."}
};
const MARIEE = [
  {name:"Fiancée", price:"200€", dep:60, detail:"Un maquillage complet pour les moments qui précèdent le grand jour — essai possible en amont.", deplacement:"Déplacement : de 60€ à 80€ selon la distance."},
  {name:"Mariée", price:"250€", dep:70, detail:"Le maquillage du jour J, pensé pour tenir des heures sans retouche.", deplacement:"Déplacement : de 60€ à 80€ selon la distance."},
  {name:"Jour et nuit", price:"480€", dep:100, detail:"Deux maquillages, matin et soirée, sans suivi en journée. Essai offert pour définir le look en amont.", deplacement:"Déplacement : 80€."},
  {name:"Suivie journée", price:"750€", dep:150, detail:"Maquillage du matin puis présence à vos côtés toute la journée pour les retouches, avec un nouveau look possible en soirée. Fin de service à 23h.", deplacement:"Déplacement : 80€."}
];
const FORMATIONS = [
  {name:"Formation 1 journée", price:"300€", dep:100, desc:"Réalisation de 2 looks (nude, cut crease, sophistiqué au choix), de 10h à 17h, en formation individuelle.", bullets:["Techniques de création des meilleurs looks","Gestion du matériel","Adaptation selon la morphologie"], note:"Acompte 100€ non remboursable · Modèle 15€ à votre charge"},
  {name:"Formation 2 jours", price:"650€", dep:100, desc:"4 looks répartis sur 2 jours, 2 créations par jour, format individuel, 10h-17h chaque jour.", bullets:["Approfondissement des techniques","Modèles variés chaque jour","Gestion du matériel"], note:"Acompte 100€ non remboursable · Modèle 15€/séance"},
  {name:"Formation 3 jours", price:"750€", dep:100, desc:"6 looks répartis sur 3 jours, parcours complet de perfectionnement, 10h-17h chaque jour.", bullets:["Parcours nude / cut crease / sophistiqué","Préparation à la diversité des clientes","Gestion du matériel"], note:"Acompte 100€ non remboursable · Modèle 15€/séance"}
];

/* ---------- triptyque interactif ---------- */
let activeTone = null;

function applyTone(tone, commit){
  const t = TONES[tone];
  if(!t) return;
  document.querySelectorAll('.swatch-block').forEach(b=>b.classList.toggle('active', b.dataset.tone===tone));
  document.documentElement.style.setProperty('--live', t.color);
  if(commit){
    document.getElementById('sp-price').textContent = t.price;
    document.getElementById('sp-dep').textContent = `Acompte ${t.dep}€ non remboursable`;
    document.getElementById('sp-desc').textContent = t.desc;
    document.getElementById('swatch-panel').classList.add('open');
    activeTone = tone;
    document.getElementById('sp-btn').onclick = ()=>{
      selectItem({name:t.name, price:t.price, dep:t.dep, type:'slot', desc:t.desc});
    };
  }
}

document.querySelectorAll('.swatch-block').forEach(block=>{
  block.addEventListener('click', ()=> applyTone(block.dataset.tone, true));
});

const triptychEl = document.getElementById('triptych');
if(triptychEl){
  let touchTone = null;
  function handleTouch(e){
    const touch = e.touches[0];
    if(!touch) return;
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const block = el ? el.closest('.swatch-block') : null;
    if(block && block.dataset.tone !== touchTone){
      touchTone = block.dataset.tone;
      applyTone(touchTone, false);
    }
  }
  triptychEl.addEventListener('touchstart', handleTouch, {passive:true});
  triptychEl.addEventListener('touchmove', handleTouch, {passive:true});
  triptychEl.addEventListener('touchend', ()=>{
    if(touchTone) applyTone(touchTone, true);
  });
}

/* ---------- timeline mariée ---------- */
const tlWrap = document.getElementById('timeline');
const tlDetail = document.getElementById('tl-detail');
MARIEE.forEach((m, i)=>{
  const el = document.createElement('div');
  el.className = 'tl-stop' + (i===0 ? ' active' : '');
  el.innerHTML = `<div class="tl-name">${m.name}</div><div class="tl-price">${m.price} · acompte ${m.dep}€</div>`;
  el.addEventListener('click', ()=>{
    document.querySelectorAll('.tl-stop').forEach(s=>s.classList.remove('active'));
    el.classList.add('active');
    tlDetail.innerHTML = `<b>${m.name}</b> — ${m.detail}<br><span style="opacity:.75">${m.deplacement}</span>`;
  });
  tlWrap.appendChild(el);
});
tlDetail.innerHTML = `<b>${MARIEE[0].name}</b> — ${MARIEE[0].detail}<br><span style="opacity:.75">${MARIEE[0].deplacement}</span>`;

/* ---------- accordion formations ---------- */
const accWrap = document.getElementById('accordion');
FORMATIONS.forEach((f, i)=>{
  const item = document.createElement('div');
  item.className = 'acc-item';
  item.innerHTML = `
    <div class="acc-head">
      <h3>${f.name}</h3>
      <span class="acc-price">${f.price}</span>
    </div>
    <div class="acc-body"><div class="acc-body-inner">
      <p>${f.desc}</p>
      <ul>${f.bullets.map(b=>`<li>${b}</li>`).join('')}</ul>
      <p style="font-size:11px">${f.note}</p>
      <button onclick='selectItem({name:"${f.name}",price:"${f.price}",dep:${f.dep},type:"formation",desc:"${f.desc}"})'>Réserver cette formation →</button>
    </div></div>
  `;
  item.querySelector('.acc-head').addEventListener('click', ()=>{
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.acc-item').forEach(a=>a.classList.remove('open'));
    if(!wasOpen) item.classList.add('open');
  });
  accWrap.appendChild(item);
});

/* ---------- avis (Supabase) ---------- */
let AVIS = [
  {nom:"Aïcha",note:5,service:"Makeup mariée",commentaire:"Un rendu naturel et tenu toute la journée, exactement le look que je voulais."},
  {nom:"Lina",note:5,service:"Makeup sophistiqué",commentaire:"Le cut crease était d'une précision incroyable."},
  {nom:"Sarah",note:5,service:"Formation 2 jours",commentaire:"Une formation complète et personnalisée, énormément progressé."}
];
function starStr(n){ return "★★★★★".slice(0,n)+"☆☆☆☆☆".slice(0,5-n); }
function renderAvis(){
  document.getElementById('avis-carousel').innerHTML = AVIS.map(a=>`
    <div class="avis-card">
      <div class="top"><span>${a.nom}</span><span class="stars">${starStr(a.note)}</span></div>
      <p>"${a.commentaire}"</p>
      <div class="tag">${a.service||''}</div>
    </div>`).join('');
  const moy = AVIS.length ? AVIS.reduce((s,a)=>s+a.note,0)/AVIS.length : 5;
  document.getElementById('avg-note').textContent = moy.toFixed(1);
}
async function chargerAvis(){
  try{
    const { data, error } = await supabaseClient
      .from('avis')
      .select('nom, service, note, commentaire')
      .order('created_at', { ascending:false });
    if(error) throw error;
    if(data && data.length) AVIS = data;
  }catch(e){
    console.warn('Avis : lecture Supabase indisponible, affichage des avis par défaut.', e);
  }
  renderAvis();
}
chargerAvis();

const modal = document.getElementById('avis-modal');
document.getElementById('open-modal').addEventListener('click', ()=>modal.classList.add('open'));
function closeModal(){ modal.classList.remove('open'); }
let noteChoisie = 0;
document.getElementById('modal-rate').querySelectorAll('span').forEach(st=>{
  st.addEventListener('click', ()=>{
    noteChoisie = +st.dataset.v;
    document.getElementById('modal-rate').querySelectorAll('span').forEach(s=>s.classList.toggle('on', +s.dataset.v<=noteChoisie));
  });
});
async function postAvis(){
  const nom = document.getElementById('avis-nom').value.trim();
  const service = document.getElementById('avis-svc').value.trim() || "Prestation";
  const commentaire = document.getElementById('avis-txt').value.trim();
  if(!nom || !noteChoisie || !commentaire){ alert("Merci d'indiquer un prénom, une note et un commentaire."); return; }

  const nouvelAvis = { nom, service, note:noteChoisie, commentaire };
  try{
    const { error } = await supabaseClient.from('avis').insert(nouvelAvis);
    if(error) throw error;
  }catch(e){
    console.warn('Avis : insertion Supabase indisponible, ajout local seulement.', e);
  }
  AVIS.unshift(nouvelAvis);
  renderAvis();
  document.getElementById('avis-nom').value=''; document.getElementById('avis-svc').value=''; document.getElementById('avis-txt').value='';
  noteChoisie=0; document.getElementById('modal-rate').querySelectorAll('span').forEach(s=>s.classList.remove('on'));
  closeModal();
}

/* ---------- wizard ---------- */
let current = null;
const ALL_ITEMS = [
  ...Object.values(TONES).map(t=>({name:t.name, price:t.price, dep:t.dep, type:'slot', desc:t.desc})),
  ...FORMATIONS.map(f=>({name:f.name, price:f.price, dep:f.dep, type:'formation', desc:f.desc}))
];
const pickList = document.getElementById('pick-list');
ALL_ITEMS.forEach(item=>{
  const row = document.createElement('div');
  row.className = 'pick-row';
  row.innerHTML = `<span class="pk-name">${item.name}</span><span class="pk-price">${item.price}</span>`;
  row.addEventListener('click', ()=>{
    document.querySelectorAll('.pick-row').forEach(r=>r.classList.remove('sel'));
    row.classList.add('sel');
    current = {...item};
  });
  pickList.appendChild(row);
});

let maxStepUnlocked = 1;

function selectItem(item){
  current = {...item};
  depState = { actif:false, montant:0, label:'', personnes:'3' };
  maxStepUnlocked = 2;
  document.querySelectorAll('.pick-row').forEach(r=>{
    r.classList.toggle('sel', r.querySelector('.pk-name').textContent === item.name);
  });
  if(document.getElementById('dep-non-btn')) setDep('non');
  if(document.getElementById('dep-city')) document.getElementById('dep-city').value = '';
  if(document.getElementById('dep-people')) document.getElementById('dep-people').value = '3';
  if(document.getElementById('dep-people-precise')) document.getElementById('dep-people-precise').value = '';
  if(document.getElementById('dep-people-precise-box')) document.getElementById('dep-people-precise-box').style.display = 'none';
  if(document.getElementById('dep-address')) document.getElementById('dep-address').value = '';
  goStep(2);
  document.getElementById('wizard').scrollIntoView({behavior:'smooth', block:'start'});
}

function validateStep1(){
  if(!current){
    showInlineStatus('submit-status', "Choisissez d'abord une prestation à l'étape 1.", 'error');
    return false;
  }
  return true;
}
function validateStep2(){
  const date = document.getElementById('date_rdv').value;
  const heure = document.getElementById('heure_rdv').value;
  if(!date){
    showInlineStatus('submit-status', 'Merci de choisir une date avant de continuer.', 'error');
    return false;
  }
  if(current.type === 'slot' && !heure){
    showInlineStatus('submit-status', 'Merci de choisir un créneau horaire avant de continuer.', 'error');
    return false;
  }
  if(current.type === 'slot' && depState.actif && !document.getElementById('dep-address').value.trim()){
    showInlineStatus('submit-status', 'Merci de renseigner votre adresse complète pour le déplacement.', 'error');
    return false;
  }
  return true;
}
function validateStep3(){
  const nom = document.getElementById('nom').value.trim();
  const email = document.getElementById('email').value.trim();
  if(!nom){
    showInlineStatus('submit-status', 'Merci de renseigner votre nom avant de continuer.', 'error');
    return false;
  }
  if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    showInlineStatus('submit-status', 'Merci de renseigner un e-mail valide avant de continuer.', 'error');
    return false;
  }
  return true;
}
const STEP_VALIDATORS = { 2:validateStep1, 3:validateStep2, 4:validateStep3 };

function showInlineStatus(elementId, message, tone = 'info'){
  const el = document.getElementById(elementId);
  if(!el) return;
  el.textContent = message;
  el.style.color = tone === 'error' ? '#d98787' : tone === 'success' ? '#9bcf9b' : '';
}

function nextStep(n){
  const validate = STEP_VALIDATORS[n];
  if(validate && !validate()) return;
  maxStepUnlocked = Math.max(maxStepUnlocked, n);
  goStep(n);
}

function goStep(n){
  if(n > maxStepUnlocked) return;
  document.querySelectorAll('.wz-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('wz-'+n).classList.add('active');
  document.querySelectorAll('.wz-step-tab').forEach(t=>{
    const s = +t.dataset.step;
    t.classList.toggle('active', s===n);
    t.classList.toggle('done', s<n);
  });
  if(n===2){
    document.getElementById('deplacement-box').style.display = current.type==='slot' ? 'block' : 'none';
    refreshHeureAvailability();
  }
  if(n===4) renderSummary();
}
document.querySelectorAll('.wz-step-tab').forEach(t=>t.addEventListener('click', ()=>{
  const n = +t.dataset.step;
  if(n <= maxStepUnlocked){
    goStep(n);
  } else {
    showInlineStatus('submit-status', 'Merci de compléter l\'étape en cours avant de passer à la suivante.', 'error');
  }
}));

function deplacementMontant(){
  if(!current || current.type !== 'slot') return 0;
  return depState.montant || 0;
}
function prixNumerique(str){ const n = parseFloat(String(str).replace('€','').replace(',','.')); return isNaN(n)?0:n; }

/* ---------- Déplacement : géolocalisation (Nominatim + Haversine) ---------- */
const ORIGIN = { lat: 48.8566, lon: 2.3522 }; // placeholder — remplacer par la vraie adresse
const IDF_DEPTS = ['75','77','78','91','92','93','94','95'];
let depState = { actif:false, montant:0, label:'', personnes:'3' };

function setDep(val){
  depState.actif = (val === 'oui');
  document.getElementById('dep-non-btn').classList.toggle('on', val==='non');
  document.getElementById('dep-oui-btn').classList.toggle('on', val==='oui');
  const detail = document.getElementById('dep-detail');
  if(val === 'oui'){
    detail.classList.add('show');
  } else {
    detail.classList.remove('show');
    depState.montant = 0; depState.label='';
    resetDepResult();
  }
}
const depPeopleSel = document.getElementById('dep-people');
const depPeoplePreciseBox = document.getElementById('dep-people-precise-box');
const depPeoplePreciseInput = document.getElementById('dep-people-precise');
if(depPeopleSel){
  depPeopleSel.addEventListener('change', ()=>{
    depState.personnes = depPeopleSel.value;
    if(depPeoplePreciseBox){
      const afficher = depPeopleSel.value === '7+';
      depPeoplePreciseBox.style.display = afficher ? 'block' : 'none';
      if(!afficher && depPeoplePreciseInput) depPeoplePreciseInput.value = '';
    }
  });
}
function resetDepResult(){
  const r = document.getElementById('dep-result');
  r.className = 'dep-result'; r.textContent = '';
  document.querySelectorAll('.dep-opt').forEach(o=>o.classList.remove('auto-on'));
}
function haversine(lat1, lon1, lat2, lon2){
  const R = 6371;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2-lat1), dLon = toRad(lon2-lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return Math.round(R * 2 * Math.asin(Math.sqrt(a)));
}
async function calcDist(){
  const city = document.getElementById('dep-city').value.trim();
  if(!city) return;
  const btn = document.querySelector('.dep-calc-btn');
  const res = document.getElementById('dep-result');
  btn.disabled = true;
  resetDepResult();
  res.className = 'dep-result loading';
  res.textContent = '📍 Recherche en cours…';

  try{
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city+', France')}&format=json&limit=3&addressdetails=1&countrycodes=fr`;
    const resp = await fetch(url, { headers:{ 'Accept-Language':'fr' } });
    const data = await resp.json();

    if(!data.length){
      res.className = 'dep-result err';
      res.textContent = '❌ Ville introuvable. Essayez avec un code postal ou un nom plus précis.';
      btn.disabled = false; return;
    }
    const place = data[0];
    const postcode = place.address?.postcode || '';
    const dept = postcode.slice(0,2);
    const nom = place.display_name.split(',').slice(0,2).join(',').trim();
    const lat = parseFloat(place.lat), lon = parseFloat(place.lon);
    const km = haversine(ORIGIN.lat, ORIGIN.lon, lat, lon);

    if(!IDF_DEPTS.includes(dept)){
      res.className = 'dep-result err';
      res.textContent = `❌ ${nom} semble être hors Île-de-France. Le déplacement n'est disponible qu'en IDF.`;
      depState.montant = 0; btn.disabled = false; return;
    }

    let tier, price, tierId, montant;
    if(km <= 30){ tier='jusqu\'à 30 km'; price='+60€'; tierId='dep-tier-1'; montant=60; }
    else        { tier='au-delà de 30 km'; price='+80€'; tierId='dep-tier-2'; montant=80; }

    document.querySelectorAll('.dep-opt').forEach(o=>o.classList.remove('auto-on'));
    document.getElementById(tierId).classList.add('auto-on');
    depState.montant = montant;
    depState.label = `${nom} · ${km} km · ${tier} (${price})`;

    res.className = 'dep-result ok';
    res.innerHTML = `📍 <strong>${nom}</strong> · <strong>${km} km</strong><br>→ Supplément déplacement : <strong>${price}</strong>`;
  } catch(e){
    res.className = 'dep-result warn';
    res.textContent = '⚠️ Calcul automatique indisponible — sélectionnez votre tranche manuellement ci-dessous.';
    document.querySelectorAll('.dep-opt').forEach((o,i)=>{
      o.onclick = ()=>{
        document.querySelectorAll('.dep-opt').forEach(x=>x.classList.remove('auto-on'));
        o.classList.add('auto-on');
        const montants = [60,80], labels = ['jusqu\'à 30 km','au-delà de 30 km'];
        depState.montant = montants[i];
        depState.label = (city||'Ville non calculée')+' · '+labels[i];
      };
    });
  }
  btn.disabled = false;
}

/* ============================================================
   HORAIRES — branchés sur planning_config / planning_overrides
   (configurés depuis l'admin, plus de valeurs fixes en dur)
   ============================================================ */
const JOURS_INDEX = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
let PLANNING_CACHE = null;

async function getPlanningConfig(){
  if(PLANNING_CACHE) return PLANNING_CACHE;
  try{
    const { data, error } = await supabaseClient.from('planning_config').select('*').eq('id', 1).maybeSingle();
    if(error) throw error;
    PLANNING_CACHE = data ? data.jours : {};
  }catch(e){
    console.warn('Planning : lecture des horaires récurrents impossible.', e);
    PLANNING_CACHE = {};
  }
  return PLANNING_CACHE;
}

async function getHorairesDuJour(dateISO){
  const jours = await getPlanningConfig();
  const dateObj = new Date(dateISO + 'T00:00:00');
  const jourKey = JOURS_INDEX[dateObj.getDay()];
  const defaut = jours[jourKey] || { ouvert:false };

  try{
    const { data, error } = await supabaseClient
      .from('planning_overrides')
      .select('*')
      .eq('date', dateISO)
      .maybeSingle();
    if(error) throw error;
    if(data) return { ouvert: data.ouvert, debut: data.debut, fin: data.fin };
  }catch(e){
    console.warn('Planning : lecture des exceptions impossible.', e);
  }
  return defaut;
}

function timeToMinutes(value){
  if(!value || typeof value !== 'string') return 0;
  const [h, m='00'] = value.split(':').map(Number);
  return (Number(h) || 0) * 60 + (Number(m) || 0);
}
function minutesToTime(totalMinutes){
  const safe = Math.max(0, Number(totalMinutes) || 0);
  const h = Math.floor(safe / 60) % 24;
  const m = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function getReservationDurationMinutes(type, itemName = ''){
  const name = String(itemName || '').toLowerCase();
  if(type === 'formation') return 7 * 60;
  if(type === 'mariee') return 24 * 60;
  if(name.includes('jour et nuit') || name.includes('suivie journée')) return 8 * 60;
  if(name.includes('fiancée') || name.includes('mariée')) return 4 * 60;
  return 60;
}
function intervalsOverlap(startA, endA, startB, endB){
  return startA < endB && endA > startB;
}

const heureSel = document.getElementById('heure_rdv');
async function refreshHeureAvailability(){
  heureSel.innerHTML = '<option value="">Choisir un créneau</option>';
  const date = document.getElementById('date_rdv').value;
  if(!date) return;

  let blockedSlots = [];
  try{
    const [{ data: blockedData, error: blockedError }, { data: reservationData, error: reservationError }] = await Promise.all([
      supabaseClient
        .from('creneaux_bloques')
        .select('heure_debut, heure_fin')
        .eq('date', date),
      supabaseClient
        .from('reservations')
        .select('heure_rdv, status, type, prestation')
        .eq('date_rdv', date)
        .in('status', ['en attente', 'acceptée'])
    ]);
    if(blockedError) throw blockedError;
    if(reservationError) throw reservationError;
    blockedSlots = [
      ...(blockedData || []),
      ...(reservationData || []).map(r => {
        const start = timeToMinutes(r.heure_rdv);
        const duration = getReservationDurationMinutes(r.type || 'slot', r.prestation || '');
        const end = start + duration;
        return {
          heure_debut: r.heure_rdv,
          heure_fin: minutesToTime(end)
        };
      })
    ];
  }catch(e){
    console.warn('Créneaux bloqués : lecture Supabase indisponible.', e);
  }

  // Les formations prennent toute la journée et doivent bloquer le jour entier.
  if(current && current.type === 'formation'){
    if(blockedSlots.length){
      heureSel.innerHTML = '<option value="">Ce jour est déjà réservé — choisissez une autre date</option>';
      return;
    }
    heureSel.innerHTML = '<option value="10:00">10:00 — 17:00 (journée complète)</option>';
    heureSel.value = '10:00';
    return;
  }

  const horaires = await getHorairesDuJour(date);

  if(!horaires || !horaires.ouvert){
    heureSel.innerHTML = '<option value="">Fermé ce jour-là — choisissez une autre date</option>';
    return;
  }

  const [hDeb] = (horaires.debut || '10:00').split(':').map(Number);
  const [hFin] = (horaires.fin || '19:00').split(':').map(Number);

  for(let h = hDeb; h <= hFin; h++){
    const opt = document.createElement('option');
    opt.value = `${h}:00`; opt.textContent = `${h}:00`;
    heureSel.appendChild(opt);
  }

  blockedSlots.forEach(bloc=>{
    Array.from(heureSel.options).forEach(opt=>{
      if(!opt.value) return;
      const optStart = timeToMinutes(opt.value);
      const blocStart = timeToMinutes(bloc.heure_debut);
      const blocEnd = timeToMinutes(bloc.heure_fin);
      if(intervalsOverlap(optStart, optStart + 60, blocStart, blocEnd)){
        opt.disabled = true;
        opt.textContent = opt.value + ' — déjà pris';
      }
    });
  });
}
document.getElementById('date_rdv').addEventListener('change', refreshHeureAvailability);

function renderSummary(){
  const d = document.getElementById('date_rdv').value ? new Date(document.getElementById('date_rdv').value).toLocaleDateString('fr-FR') : '—';
  const h = document.getElementById('heure_rdv').value || '—';
  const depl = deplacementMontant();
  const total = prixNumerique(current.price) + depl;
  let deplRow = '';
  if(current.type === 'slot' && depState.actif){
    let nb;
    if(depState.personnes === '7+'){
      const precise = depPeoplePreciseInput ? depPeoplePreciseInput.value.trim() : '';
      nb = precise ? precise : '7 personnes ou plus';
    } else {
      nb = `${depState.personnes} personnes`;
    }
    deplRow = `<div class="wz-summary-row"><span>Déplacement</span><b>${nb} · ${depState.label || 'à calculer'}</b></div>`;
  }
  document.getElementById('wz-summary').innerHTML = `
    <div class="wz-summary-row"><span>Prestation</span><b>${current.name}</b></div>
    <div class="wz-summary-row"><span>Prix</span><b>${current.price}${depl ? ' + '+depl+'€ = '+total+'€' : ''}</b></div>
    <div class="wz-summary-row"><span>Date</span><b>${d}</b></div>
    <div class="wz-summary-row"><span>Heure</span><b>${h}</b></div>
    ${deplRow}
    <div class="wz-summary-row"><span>Acompte à régler</span><b>${current.dep}€</b></div>
  `;
  const btn = document.getElementById('paypal-btn');
  btn.href = `https://paypal.me/${PAYPAL_HANDLE}/${current.dep}`;
  btn.textContent = `Payer l'acompte de ${current.dep}€ via PayPal`;
}

/* ---------- demande mariée (Supabase) ---------- */
async function submitMariee(){
  if(isSubmittingMariee) return;
  const statusEl = document.getElementById('mariee-status');
  const nom = document.getElementById('mar-nom').value.trim();
  const insta = document.getElementById('mar-insta').value.trim();
  const email = document.getElementById('mar-email').value.trim();
  const tel = document.getElementById('mar-tel').value.trim();
  const date = document.getElementById('mar-date').value;
  const formule = document.getElementById('mar-formule').value;
  const msg = document.getElementById('mar-msg').value.trim();

  if(!nom || !email || !date || !formule){
    statusEl.textContent = "Merci de renseigner au minimum : nom, e-mail, date du mariage et formule.";
    statusEl.style.color = "#d98787";
    return;
  }

  const hasConflict = await hasBookingConflict(date, '00:00', 'mariee');
  if(hasConflict){
    statusEl.textContent = "Ce jour est déjà occupé par un autre rendez-vous ou un blocage de planning — merci de choisir une autre date.";
    statusEl.style.color = "#d98787";
    return;
  }

  isSubmittingMariee = true;
  statusEl.textContent = "Envoi en cours…";
  statusEl.style.color = "";
  document.querySelectorAll('.mariee-form input,.mariee-form select,.mariee-form textarea,.mariee-form button').forEach(el=>el.disabled=true);

  try{
    const { data: inserted, error } = await supabaseClient.from('demandes_mariee').insert({
      nom, instagram: insta, email, telephone:tel, date_mariage:date, formule, message: msg
    }).select('id').single();
    if(error) throw error;

    await supabaseClient.from('creneaux_bloques').insert({
      date,
      heure_debut: '00:00',
      heure_fin: '23:59',
      reservation_id: inserted ? inserted.id : null
    });

    statusEl.textContent = "Demande envoyée ✓ — je vous recontacte par Instagram, généralement sous 48h.";
    statusEl.style.color = "#9bcf9b";
  }catch(e){
    console.error('Demande mariée : envoi Supabase impossible.', e);
    statusEl.textContent = "Une erreur est survenue, merci de réessayer ou de me contacter directement.";
    statusEl.style.color = "#d98787";
    document.querySelectorAll('.mariee-form input,.mariee-form select,.mariee-form textarea,.mariee-form button').forEach(el=>el.disabled=false);
    isSubmittingMariee = false;
  }
}

async function hasBookingConflict(date, heure, type){
  if(!supabaseClient || !date) return false;
  try{
    const [blockedRes, reservationRes] = await Promise.all([
      supabaseClient
        .from('creneaux_bloques')
        .select('heure_debut, heure_fin')
        .eq('date', date),
      supabaseClient
        .from('reservations')
        .select('heure_rdv, status, type, prestation')
        .eq('date_rdv', date)
        .in('status', ['en attente', 'acceptée'])
    ]);

    const blockedData = blockedRes.data || [];
    const reservationData = reservationRes.data || [];

    if(type === 'formation' || type === 'mariee'){
      return Boolean((blockedData || []).length || (reservationData || []).length);
    }
    if(!heure) return false;

    const requestedStart = timeToMinutes(heure);
    const requestedDuration = getReservationDurationMinutes(type, current?.name || '');
    const requestedEnd = requestedStart + requestedDuration;

    const blockedByHour = (blockedData || []).some(bloc => {
      if(!bloc.heure_debut || !bloc.heure_fin) return false;
      const start = timeToMinutes(bloc.heure_debut);
      const end = timeToMinutes(bloc.heure_fin);
      return intervalsOverlap(requestedStart, requestedEnd, start, end);
    });

    if(blockedByHour) return true;

    return (reservationData || []).some(row => {
      if(!row.heure_rdv) return false;
      const reservationStart = timeToMinutes(row.heure_rdv);
      const reservationDuration = getReservationDurationMinutes(row.type || 'slot', row.prestation || '');
      const reservationEnd = reservationStart + reservationDuration;
      return intervalsOverlap(requestedStart, requestedEnd, reservationStart, reservationEnd);
    });
  }catch(e){
    console.warn('Contrôle de disponibilité : vérification impossible.', e);
    return false;
  }
}

async function reserveSlotAtomically(payload){
  if(!supabaseClient) return { ok: false, reason: 'supabase_unavailable' };

  try{
    const rpcResult = await supabaseClient.rpc('reserve_slot_if_available', {
      p_date: payload.date_rdv,
      p_heure: payload.heure_rdv || null,
      p_type: payload.type,
      p_prestation: payload.prestation,
      p_duration_minutes: getReservationDurationMinutes(payload.type, payload.prestation || ''),
      p_status: 'en attente',
      p_payload: {
        nom: payload.nom,
        email: payload.email,
        telephone: payload.telephone,
        instagram: payload.instagram,
        total: payload.total,
        acompte: payload.acompte,
        capture_paiement: payload.capture_paiement,
        deplacement: payload.deplacement,
        adresse: payload.adresse
      }
    });

    if(rpcResult && rpcResult.error) {
      const msg = String(rpcResult.error.message || '').toLowerCase();
      if(msg.includes('does not exist') || msg.includes('function')) {
        return { ok: true, fallback: true };
      }
      throw rpcResult.error;
    }

    if(rpcResult && rpcResult.data && typeof rpcResult.data === 'object' && 'ok' in rpcResult.data){
      return rpcResult.data;
    }

    return { ok: true, fallback: false };
  }catch(e){
    console.warn('Sécurité DB atomique indisponible, on garde le garde-fou front.', e);
    return { ok: true, fallback: true };
  }
}

/* ---------- réservation (Supabase + Storage pour la capture PayPal) ---------- */
async function submitReservation(){
  if(isSubmittingReservation) return;
  const statusEl = document.getElementById('submit-status');
  const nom = document.getElementById('nom').value.trim();
  const email = document.getElementById('email').value.trim();
  const tel = document.getElementById('telephone').value.trim();
  const insta = document.getElementById('insta').value.trim();
  const date = document.getElementById('date_rdv').value;
  const heure = document.getElementById('heure_rdv').value;
  const captureFile = document.getElementById('capture').files[0];

  if(!nom || !email || !date){ statusEl.textContent = "Merci de compléter au minimum : date, nom et e-mail (étapes 2 et 3)."; statusEl.style.color = "#d98787"; return; }
  if(current.type === 'slot' && !heure){ statusEl.textContent = "Merci de choisir un créneau horaire (étape 2)."; statusEl.style.color = "#d98787"; return; }
  if(current.type === 'slot' && depState.actif && !document.getElementById('dep-address').value.trim()){ statusEl.textContent = "Merci de renseigner votre adresse complète pour le déplacement (étape 2)."; statusEl.style.color = "#d98787"; return; }
  if(!captureFile){ statusEl.textContent = "Merci de joindre la capture de votre paiement PayPal."; statusEl.style.color = "#d98787"; return; }

  const hasConflict = await hasBookingConflict(date, heure, current.type);
  if(hasConflict){
    const message = current.type === 'formation'
      ? "Ce jour est déjà réservé. Merci de choisir une autre date."
      : "Ce créneau a déjà été réservé par une autre cliente. Merci de choisir un autre horaire.";
    statusEl.textContent = message;
    statusEl.style.color = "#d98787";
    return;
  }

  const depl = deplacementMontant();
  const total = prixNumerique(current.price) + depl;

  isSubmittingReservation = true;
  statusEl.textContent = "Envoi en cours…";
  statusEl.style.color = "";

  try{
    const extension = (captureFile.name.match(/\.[^.]+$/) || [''])[0];
    const cheminFichier = `${Date.now()}${extension}`;
    const { error: uploadError } = await supabaseClient.storage
      .from('capture')
      .upload(cheminFichier, captureFile);
    if(uploadError) throw uploadError;
    const { data: urlData } = supabaseClient.storage.from('capture').getPublicUrl(cheminFichier);
    const captureUrl = urlData.publicUrl;

    const { data: inserted, error: insertError } = await supabaseClient.from('reservations').insert({
      type: current.type,
      prestation: current.name,
      prix: current.price,
      total: total + '€',
      acompte: current.dep + '€',
      date_rdv: date,
      heure_rdv: current.type === 'formation' ? '10:00' : heure,
      deplacement: (current.type==='slot' && depState.actif) ? (depState.label || 'oui') : 'non',
      deplacement_personnes: (current.type==='slot' && depState.actif)
        ? (depState.personnes === '7+'
            ? (depPeoplePreciseInput && depPeoplePreciseInput.value.trim() ? depPeoplePreciseInput.value.trim() : '7 personnes ou plus')
            : depState.personnes)
        : '',
      adresse: (current.type==='slot' && depState.actif) ? document.getElementById('dep-address').value.trim() : '',
      nom, email, telephone: tel, instagram: insta,
      capture_paiement: captureUrl,
      status: 'en attente'
    }).select('id').single();
    if(insertError) throw insertError;

    if(current.type === 'slot' && heure){
      const duration = getReservationDurationMinutes(current.type, current.name);
      const heureFin = minutesToTime(timeToMinutes(heure) + duration);
      await supabaseClient.from('creneaux_bloques').insert({
        date: date,
        heure_debut: heure,
        heure_fin: heureFin,
        reservation_id: inserted ? inserted.id : null
      });
    } else if(current.type === 'formation'){
      await supabaseClient.from('creneaux_bloques').insert({
        date: date,
        heure_debut: '00:00',
        heure_fin: '23:59',
        reservation_id: inserted ? inserted.id : null
      });
    }

    if(date && heure && current.type === 'slot'){
      const sameHourConflict = await hasBookingConflict(date, heure, current.type);
      if(sameHourConflict) {
        await supabaseClient.from('reservations').delete().eq('id', inserted.id);
        throw new Error('Ce créneau vient d’être pris par une autre cliente.');
      }
    }

    statusEl.textContent = "Demande envoyée ✓ — vous recevrez une réponse dès qu'elle sera traitée.";
    statusEl.style.color = "#9bcf9b";
    document.querySelectorAll('#nom,#email,#telephone,#insta,#date_rdv,#heure_rdv,#capture,#dep-address,#dep-city,#dep-people,#dep-people-precise,button').forEach(el => {
      if (el && el.tagName !== 'BUTTON') el.disabled = true;
      if (el && el.tagName === 'BUTTON' && el.onclick && el.onclick.toString().includes('submitReservation')) el.disabled = true;
    });
    const submitBtn = document.querySelector('#reservation-submit-btn');
    if(submitBtn) submitBtn.disabled = true;
  }catch(e){
    console.error('Réservation : envoi Supabase impossible.', e);
    const message = "Ce créneau a déjà été réservé par une autre cliente. Merci de choisir un autre horaire.";
    statusEl.textContent = message;
    statusEl.style.color = "#d98787";
    isSubmittingReservation = false;
  }
}
