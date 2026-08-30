const PAYPAL_HANDLE = "Mitoumakeup";
const IG_HANDLE = "mitou_makeup";

const SUPABASE_URL = "https://VOTRE-PROJET.supabase.co"; // ⚠️ à remplacer
const SUPABASE_ANON_KEY = "VOTRE_CLE_ANON_PUBLIC";        // ⚠️ à remplacer

let supabase = null;
try{
  if(window.supabase && typeof window.supabase.createClient === 'function'){
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
    const { data, error } = await supabase
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
    const { error } = await supabase.from('avis').insert(nouvelAvis);
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
const OUVERTURE = 10*60, FERMETURE = 19*60;
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
  if(document.getElementById('dep-address')) document.getElementById('dep-address').value = '';
  goStep(2);
  document.getElementById('wizard').scrollIntoView({behavior:'smooth', block:'start'});
}

function validateStep1(){
  if(!current){ alert("Choisissez d'abord une prestation à l'étape 1."); return false; }
  return true;
}
function validateStep2(){
  const date = document.getElementById('date_rdv').value;
  const heure = document.getElementById('heure_rdv').value;
  if(!date){ alert("Merci de choisir une date avant de continuer."); return false; }
  if(current.type === 'slot' && !heure){ alert("Merci de choisir un créneau horaire avant de continuer."); return false; }
  if(current.type === 'slot' && depState.actif && !document.getElementById('dep-address').value.trim()){
    alert("Merci de renseigner votre adresse complète pour le déplacement.");
    return false;
  }
  return true;
}
function validateStep3(){
  const nom = document.getElementById('nom').value.trim();
  const email = document.getElementById('email').value.trim();
  if(!nom){ alert("Merci de renseigner votre nom avant de continuer."); return false; }
  if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ alert("Merci de renseigner un e-mail valide avant de continuer."); return false; }
  return true;
}
const STEP_VALIDATORS = { 2:validateStep1, 3:validateStep2, 4:validateStep3 };

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
    alert("Merci de compléter l'étape en cours avant de passer à la suivante.");
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
if(depPeopleSel){
  depPeopleSel.addEventListener('change', ()=>{ depState.personnes = depPeopleSel.value; });
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

const heureSel = document.getElementById('heure_rdv');
async function refreshHeureAvailability(){
  heureSel.innerHTML = '<option value="">Choisir un créneau</option>';
  for(let m = OUVERTURE; m <= FERMETURE; m += 60){
    const h = Math.floor(m/60);
    const opt = document.createElement('option');
    opt.value = `${h}:00`; opt.textContent = `${h}:00`;
    heureSel.appendChild(opt);
  }
  const date = document.getElementById('date_rdv').value;
  if(!date) return;
  try{
    const { data, error } = await supabase
      .from('creneaux_bloques')
      .select('heure_debut, heure_fin')
      .eq('date', date);
    if(error) throw error;
    (data||[]).forEach(bloc=>{
      Array.from(heureSel.options).forEach(opt=>{
        if(!opt.value) return;
        if(opt.value >= bloc.heure_debut && opt.value < bloc.heure_fin){
          opt.disabled = true;
          opt.textContent = opt.value + ' (indisponible)';
        }
      });
    });
  }catch(e){
    console.warn('Créneaux bloqués : lecture Supabase indisponible.', e);
  }
}
document.getElementById('date_rdv').addEventListener('change', refreshHeureAvailability);

function renderSummary(){
  const d = document.getElementById('date_rdv').value ? new Date(document.getElementById('date_rdv').value).toLocaleDateString('fr-FR') : '—';
  const h = document.getElementById('heure_rdv').value || '—';
  const depl = deplacementMontant();
  const total = prixNumerique(current.price) + depl;
  let deplRow = '';
  if(current.type === 'slot' && depState.actif){
    const nb = depState.personnes === '7+' ? '7 personnes ou plus' : `${depState.personnes} personnes`;
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
  const statusEl = document.getElementById('mariee-status');
  const nom = document.getElementById('mar-nom').value.trim();
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

  try{
    const { error } = await supabase.from('demandes_mariee').insert({
      nom, email, telephone:tel, date_mariage:date, formule, message: msg
    });
    if(error) throw error;
    statusEl.textContent = "Demande envoyée ✓ — je vous recontacte par Instagram, généralement sous 48h.";
    statusEl.style.color = "#9bcf9b";
    document.querySelectorAll('.mariee-form input,.mariee-form select,.mariee-form textarea,.mariee-form button').forEach(el=>el.disabled=true);
  }catch(e){
    console.error('Demande mariée : envoi Supabase impossible.', e);
    statusEl.textContent = "Une erreur est survenue, merci de réessayer ou de me contacter directement.";
    statusEl.style.color = "#d98787";
  }
}

/* ---------- réservation (Supabase + Storage pour la capture PayPal) ---------- */
async function submitReservation(){
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

  const depl = deplacementMontant();
  const total = prixNumerique(current.price) + depl;

  statusEl.textContent = "Envoi en cours…";
  statusEl.style.color = "";

  try{
    const cheminFichier = `${Date.now()}_${captureFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from('captures')
      .upload(cheminFichier, captureFile);
    if(uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from('captures').getPublicUrl(cheminFichier);
    const captureUrl = urlData.publicUrl;

    const { error: insertError } = await supabase.from('reservations').insert({
      type: current.type,
      prestation: current.name,
      prix: current.price,
      total: total + '€',
      acompte: current.dep + '€',
      date_rdv: date,
      heure_rdv: heure,
      deplacement: (current.type==='slot' && depState.actif) ? (depState.label || 'oui') : 'non',
      deplacement_personnes: (current.type==='slot' && depState.actif) ? depState.personnes : '',
      adresse: (current.type==='slot' && depState.actif) ? document.getElementById('dep-address').value.trim() : '',
      nom, email, telephone: tel, instagram: insta,
      capture_paiement: captureUrl,
      status: 'en attente'
    });
    if(insertError) throw insertError;
        // Bloquer ce créneau pour que personne d'autre ne le réserve
    if(current.type === 'slot' && heure){
      const { data: nouvelleResa } = await supabase
        .from('reservations')
        .select('id')
        .eq('email', email)
        .eq('date_rdv', date)
        .eq('heure_rdv', heure)
        .order('created_at', { ascending:false })
        .limit(1)
        .single();

      const [hDeb] = heure.split(':').map(Number);
      const heureFin = `${hDeb + 1}:00`;

      await supabase.from('creneaux_bloques').insert({
        date: date,
        heure_debut: heure,
        heure_fin: heureFin,
        reservation_id: nouvelleResa ? nouvelleResa.id : null
      });
    }

    statusEl.textContent = "Demande envoyée ✓ — vous recevrez une réponse dès qu'elle sera traitée.";
    statusEl.style.color = "#9bcf9b";
  }catch(e){
    console.error('Réservation : envoi Supabase impossible.', e);
    statusEl.textContent = "Une erreur est survenue lors de l'envoi, merci de réessayer.";
    statusEl.style.color = "#d98787";
  }
}
