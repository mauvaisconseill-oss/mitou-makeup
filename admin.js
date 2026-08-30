/* ============================================================
   ADMIN — Mitou Makeup (vraie authentification Supabase + planning)
   ============================================================ */
const SUPABASE_URL = "https://cayadmbypnfukskotrma.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNheWFkbWJ5cG5mdWtza290cm1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0OTcxODIsImV4cCI6MjEwMzA3MzE4Mn0._j5jQ1kXYOz5NhJLBsRlGXI8HEBRMQCo3ka3QrjYUe0";

/* ★★★ EmailJS — mets tes vrais identifiants ici ★★★ */
const EMAILJS_PUBLIC_KEY = "bCBYuvyqokoudzupP";
const EMAILJS_SERVICE_ID = "service_sa3nlab";
const EMAILJS_TEMPLATE_ACCEPT_SLOT = "template_zesivlq";      // "Invitée acceptée"
const EMAILJS_TEMPLATE_ACCEPT_FORMATION = "template_c3yqwma"; // "Formation acceptée"

let supabaseClient = null;
try{
  if(window.supabase && typeof window.supabase.createClient === 'function'){
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}catch(e){
  console.warn('Supabase : initialisation impossible.', e);
}
try{
  if(window.emailjs) emailjs.init(EMAILJS_PUBLIC_KEY);
}catch(e){
  console.warn('EmailJS : initialisation impossible.', e);
}

/* ---------- toast discret (remplace les popups natives pour les confirmations) ---------- */
function showToast(message){
  let toast = document.getElementById('toast-msg');
  if(toast) toast.remove();
  toast = document.createElement('div');
  toast.id = 'toast-msg';
  toast.className = 'toast-msg';
  toast.innerHTML = `<span class="toast-dot">✓</span> ${message}`;
  document.body.appendChild(toast);
  requestAnimationFrame(()=> toast.classList.add('show'));
  setTimeout(()=>{
    toast.classList.remove('show');
    setTimeout(()=> toast.remove(), 300);
  }, 2000);
}

/* ---------- connexion (vraie auth Supabase) ---------- */
const loginScreen = document.getElementById('admin-login');
const dashScreen  = document.getElementById('admin-dash');
const emailInput  = document.getElementById('admin-email');
const passInput   = document.getElementById('admin-pass');
const loginBtn    = document.getElementById('admin-login-btn');
const loginErr    = document.getElementById('admin-login-err');

async function tryLogin(){
  loginErr.textContent = "";
  const email = emailInput.value.trim();
  const password = passInput.value;
  if(!email || !password){
    loginErr.textContent = "Merci de remplir l'e-mail et le mot de passe.";
    return;
  }
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if(error){
    loginErr.textContent = "Identifiants incorrects.";
    return;
  }
  showDash();
}

loginBtn.addEventListener('click', tryLogin);
passInput.addEventListener('keydown', e=>{ if(e.key==='Enter') tryLogin(); });

function showDash(){
  loginScreen.style.display = 'none';
  dashScreen.style.display = 'block';
  refreshAllData();
}

document.getElementById('logout-btn').addEventListener('click', async ()=>{
  await supabaseClient.auth.signOut();
  location.reload();
});

async function refreshAllData(){
  await loadData();
  await loadPlanning();
  await loadCalendrier();
}

document.getElementById('refresh-btn').addEventListener('click', refreshAllData);

// Reste connectée si une session existe déjà (pas besoin de se reconnecter à chaque visite)
supabaseClient.auth.getSession().then(({data})=>{
  if(data.session) showDash();
});

/* ---------- navigation entre onglets principaux ---------- */
document.getElementById('tab-reservations').addEventListener('click', ()=>switchMainView('reservations'));
document.getElementById('tab-planning').addEventListener('click', ()=>switchMainView('planning'));
document.getElementById('tab-calendrier').addEventListener('click', ()=>switchMainView('calendrier'));

function switchMainView(view){
  document.querySelectorAll('.main-tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.view===view));
  document.getElementById('reservations-view').style.display = view==='reservations' ? 'block' : 'none';
  document.getElementById('planning-view').style.display = view==='planning' ? 'block' : 'none';
  document.getElementById('calendrier-view').style.display = view==='calendrier' ? 'block' : 'none';
  if(view === 'planning') loadPlanning();
  if(view === 'calendrier') loadCalendrier();
}

/* ---------- filtres réservations ---------- */
let activeFilter = 'all';
document.querySelectorAll('.admin-chip').forEach(chip=>{
  chip.addEventListener('click', ()=>{
    document.querySelectorAll('.admin-chip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    renderBoard();
  });
});

/* ---------- chargement des données réservations ---------- */
let ALL_CARDS = [];

async function loadData(){
  if(!supabaseClient){
    document.getElementById('admin-stats').innerHTML =
      '<p style="color:#d98787;font-size:12px">Supabase non configuré.</p>';
    return;
  }

  const cards = [];

  try{
    const { data, error } = await supabaseClient
      .from('reservations')
      .select('*')
      .order('created_at', { ascending:false });
    if(error) throw error;
    (data||[]).forEach(r=>{
      cards.push({
        table:'reservations',
        id:r.id,
        type: r.type === 'formation' ? 'formation' : 'slot',
        typeLabel: r.type === 'formation' ? 'Formation' : 'Invitée',
        name:r.nom, email:r.email, tel:r.telephone, insta:r.instagram,
        service:r.prestation,
        date:r.date_rdv, heure:r.heure_rdv,
        total:r.total || r.prix, acompte:r.acompte,
        deplacement: r.deplacement && r.deplacement !== 'non' ? r.deplacement : null,
        deplacement_personnes: r.deplacement_personnes || '',
        adresse: r.adresse || '',
        capture: r.capture_paiement || '',
        status: r.status || 'en attente'
      });
    });
  }catch(e){
    console.warn('Lecture "reservations" impossible.', e);
  }

  try{
    const { data, error } = await supabaseClient
      .from('demandes_mariee')
      .select('*')
      .order('created_at', { ascending:false });
    if(error) throw error;
    (data||[]).forEach(r=>{
      cards.push({
        table:'demandes_mariee',
        id:r.id,
        type:'mariee',
        typeLabel:'Mariée',
        name:r.nom, email:r.email, tel:r.telephone, insta:'',
        service:r.formule,
        date:r.date_mariage, heure:'',
        total:'', acompte:'',
        deplacement:null, deplacement_personnes:'', adresse:'',
        capture:'',
        message:r.message || '',
        status: r.status || 'en attente'
      });
    });
  }catch(e){
    console.warn('Lecture "demandes_mariee" impossible.', e);
  }

  ALL_CARDS = cards;
  renderBoard();
}

/* ---------- rendu réservations ---------- */
function fmtDate(d){
  if(!d) return '—';
  try{ return new Date(d).toLocaleDateString('fr-FR'); }catch(e){ return d; }
}

function renderBoard(){
  const filtered = activeFilter === 'all' ? ALL_CARDS : ALL_CARDS.filter(c=>c.type===activeFilter);

  // "refusée" n'existe plus dans le flux, mais si d'anciennes lignes
  // en base ont encore ce statut, on les range avec "en attente" pour
  // ne rien perdre de vue.
  const groups = { 'en attente':[], 'acceptée':[] };
  filtered.forEach(c=>{
    const s = c.status === 'acceptée' ? 'acceptée' : 'en attente';
    groups[s].push(c);
  });

  renderColumn('col-attente', 'count-attente', groups['en attente']);
  renderColumn('col-acceptee', 'count-acceptee', groups['acceptée']);

  document.getElementById('admin-stats').innerHTML = `
    <div class="admin-stat"><span class="admin-stat-num">${ALL_CARDS.length}</span><span class="admin-stat-label">Total</span></div>
    <div class="admin-stat"><span class="admin-stat-num">${groups['en attente'].length}</span><span class="admin-stat-label">En attente</span></div>
    <div class="admin-stat"><span class="admin-stat-num">${groups['acceptée'].length}</span><span class="admin-stat-label">Acceptées</span></div>
  `;
}

function renderColumn(bodyId, countId, list){
  const body = document.getElementById(bodyId);
  document.getElementById(countId).textContent = list.length;
  body.innerHTML = '';
  if(!list.length){
    body.innerHTML = '<p class="admin-empty">Aucune demande ici.</p>';
    return;
  }
  const tpl = document.getElementById('card-template');
  list.forEach(card=>{
    const node = tpl.content.cloneNode(true);
    node.querySelector('.admin-card-type').textContent = card.typeLabel;
    node.querySelector('.admin-card-total').textContent = card.total || '';
    node.querySelector('.admin-card-name').textContent = card.name || 'Sans nom';
    node.querySelector('.admin-card-service').textContent = card.service || '';

    const meta = node.querySelector('.admin-card-meta');
    let metaHtml = '';
    if(card.date) metaHtml += `<span>Date · <b>${fmtDate(card.date)}</b>${card.heure ? ' à '+card.heure : ''}</span>`;
    if(card.email) metaHtml += `<span>E-mail · <b>${card.email}</b></span>`;
    if(card.tel) metaHtml += `<span>Tél · <b>${card.tel}</b></span>`;
    if(card.insta) metaHtml += `<span>Instagram · <b>${card.insta}</b></span>`;
    if(card.deplacement) metaHtml += `<span>Déplacement · <b>${card.deplacement_personnes} pers. · ${card.deplacement}</b></span>`;
    if(card.adresse) metaHtml += `<span>Adresse · <b>${card.adresse}</b></span>`;
    if(card.message) metaHtml += `<span>Message · <b>${card.message}</b></span>`;
    meta.innerHTML = metaHtml;

    const captureLink = node.querySelector('.admin-card-capture');
    if(card.capture){
      captureLink.href = card.capture;
    } else {
      captureLink.remove();
    }

    const actions = node.querySelector('.admin-card-actions');
    if(card.status === 'acceptée'){
      actions.innerHTML = `<button class="revert">Remettre en attente</button><button class="delete">Supprimer</button>`;
      actions.querySelector('.revert').addEventListener('click', ()=>updateStatus(card, 'en attente'));
      actions.querySelector('.delete').addEventListener('click', ()=>deleteCard(card));
    } else {
      actions.innerHTML = `<button class="accept">Accepter</button><button class="delete">Supprimer</button>`;
      actions.querySelector('.accept').addEventListener('click', ()=>updateStatus(card, 'acceptée'));
      actions.querySelector('.delete').addEventListener('click', ()=>deleteCard(card));
    }

    body.appendChild(node);
  });
}

/* ---------- envoi email à l'acceptation ---------- */
async function envoyerEmailAcceptation(card){
  if(!window.emailjs) return;
  const templateId = card.type === 'formation' ? EMAILJS_TEMPLATE_ACCEPT_FORMATION : EMAILJS_TEMPLATE_ACCEPT_SLOT;
  const params = {
    to_name: card.name || '',
    to_email: card.email || '',
    date: fmtDate(card.date),
    heure: card.heure || '',
    lieu: card.deplacement ? (card.adresse || 'à votre domicile') : 'chez Mitou Makeup'
  };
  await emailjs.send(EMAILJS_SERVICE_ID, templateId, params);
}

/* ---------- mise à jour statut ---------- */
async function updateStatus(card, newStatus){
  try{
    const { error } = await supabaseClient
      .from(card.table)
      .update({ status:newStatus })
      .eq('id', card.id);
    if(error) throw error;
    card.status = newStatus;

    // Si on accepte, envoyer l'e-mail de confirmation
    if(newStatus === 'acceptée' && card.table === 'reservations'){
      try{
        await envoyerEmailAcceptation(card);
        showToast(`Demande acceptée — e-mail envoyé à ${card.name || 'la cliente'}`);
      }catch(e){
        console.error('Email non envoyé :', e);
        alert("Statut mis à jour, mais l'e-mail n'a pas pu être envoyé — vérifie les identifiants EmailJS.");
      }
    } else if(newStatus === 'acceptée'){
      showToast(`Demande de ${card.name || 'cette personne'} acceptée`);
    } else if(newStatus === 'en attente'){
      showToast('Remise en attente');
    }

    renderBoard();
    await refreshAllData();
  }catch(e){
    console.error('Mise à jour du statut impossible.', e);
    alert("Impossible de mettre à jour cette demande.");
  }
}

/* ---------- suppression d'une demande + libération du créneau ---------- */
async function deleteCard(card){
  const label = card.type === 'mariee' ? 'cette demande mariée' : 'cette demande';
  if(!confirm(`Supprimer définitivement ${label} ? Cette action est irréversible.`)) return;

  try{
    // Libérer le créneau bloqué si c'était une réservation "invitée"
    if(card.table === 'reservations'){
      await supabaseClient
        .from('creneaux_bloques')
        .delete()
        .eq('reservation_id', card.id);

      if(card.date){
        await supabaseClient
          .from('creneaux_bloques')
          .delete()
          .eq('date', card.date)
          .eq('heure_debut', card.heure || '10:00');
      }

      if(card.type === 'formation' && card.date){
        await supabaseClient
          .from('creneaux_bloques')
          .delete()
          .eq('date', card.date)
          .eq('heure_debut', '00:00');
      }
    }

    const { error } = await supabaseClient
      .from(card.table)
      .delete()
      .eq('id', card.id);
    if(error) throw error;

    ALL_CARDS = ALL_CARDS.filter(c => !(c.table === card.table && c.id === card.id));
    renderBoard();
    await refreshAllData();
    showToast('Demande supprimée');
  }catch(e){
    console.error('Suppression impossible.', e);
    alert("Impossible de supprimer cette demande.");
  }
}

/* ============================================================
   PLANNING
   ============================================================ */
const JOURS_SEMAINE = [
  { key: 'lundi',    label: 'Lundi' },
  { key: 'mardi',    label: 'Mardi' },
  { key: 'mercredi', label: 'Mercredi' },
  { key: 'jeudi',    label: 'Jeudi' },
  { key: 'vendredi', label: 'Vendredi' },
  { key: 'samedi',   label: 'Samedi' },
  { key: 'dimanche', label: 'Dimanche' }
];

let horairesActuels = {};

async function loadPlanning(){
  await loadHoraires();
  await loadSemaine();
}

async function loadHoraires(){
  const { data, error } = await supabaseClient.from('planning_config').select('*').eq('id', 1).maybeSingle();
  if(error || !data){
    alert("Impossible de charger les horaires. Vérifie que la table planning_config existe (script SQL).");
    return;
  }
  horairesActuels = data.jours || {};
  renderJoursList();
}

function renderJoursList(){
  const el = document.getElementById('jours-list');
  el.innerHTML = JOURS_SEMAINE.map(j => {
    const cfg = horairesActuels[j.key] || { ouvert:false };
    const debut = cfg.debut || '10:00';
    const fin = cfg.fin || '19:00';
    return `
    <div class="jour-row" data-jour="${j.key}">
      <div class="jour-nom">${j.label}</div>
      <label class="jour-toggle">
        <input type="checkbox" class="jour-ouvert-check" ${cfg.ouvert ? 'checked' : ''}>
        Ouvert
      </label>
      <div class="jour-heures" id="heures-${j.key}" style="${cfg.ouvert ? '' : 'display:none'}">
        <input type="time" id="debut-${j.key}" value="${debut}">
        <span>à</span>
        <input type="time" id="fin-${j.key}" value="${fin}">
      </div>
      <span class="jour-ferme-label" id="ferme-${j.key}" style="${cfg.ouvert ? 'display:none' : ''}">Fermé</span>
    </div>`;
  }).join('');

  // écouteurs (pas d'attributs inline onclick, tout en JS externe)
  JOURS_SEMAINE.forEach(j=>{
    const check = document.querySelector(`#jours-list [data-jour="${j.key}"] .jour-ouvert-check`);
    check.addEventListener('change', ()=>{
      document.getElementById('heures-'+j.key).style.display = check.checked ? 'flex' : 'none';
      document.getElementById('ferme-'+j.key).style.display = check.checked ? 'none' : 'inline';
    });
  });
}

document.getElementById('save-horaires-btn').addEventListener('click', saveHoraires);

async function saveHoraires(){
  const nouveauxJours = {};
  JOURS_SEMAINE.forEach(j => {
    const ouvert = document.querySelector(`#jours-list [data-jour="${j.key}"] .jour-ouvert-check`).checked;
    if(ouvert){
      nouveauxJours[j.key] = {
        ouvert: true,
        debut: document.getElementById('debut-'+j.key).value || '10:00',
        fin: document.getElementById('fin-'+j.key).value || '19:00'
      };
    } else {
      nouveauxJours[j.key] = { ouvert: false };
    }
  });

  const { error } = await supabaseClient.from('planning_config')
    .update({ jours: nouveauxJours, updated_at: new Date().toISOString() })
    .eq('id', 1);

  if(error){ alert("Erreur lors de l'enregistrement des horaires."); return; }
  horairesActuels = nouveauxJours;
  showToast("Horaires enregistrés");
  await loadSemaine();
}

/* ---------- vue par semaine ---------- */
let semaineAffichee = getLundiDeLaSemaine(new Date());

function getLundiDeLaSemaine(d){
  const date = new Date(d);
  const jour = date.getDay();
  const diff = jour === 0 ? -6 : 1 - jour;
  date.setDate(date.getDate() + diff);
  date.setHours(0,0,0,0);
  return date;
}
function toISODate(d){
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function fmtDateCourt(d){
  return d.toLocaleDateString('fr-FR', { day:'2-digit', month:'short' });
}

document.getElementById('semaine-prec-btn').addEventListener('click', ()=>{
  semaineAffichee.setDate(semaineAffichee.getDate() - 7);
  loadSemaine();
});
document.getElementById('semaine-suiv-btn').addEventListener('click', ()=>{
  semaineAffichee.setDate(semaineAffichee.getDate() + 7);
  loadSemaine();
});
document.getElementById('semaine-today-btn').addEventListener('click', ()=>{
  semaineAffichee = getLundiDeLaSemaine(new Date());
  loadSemaine();
});

async function loadSemaine(){
  const debutSemaine = new Date(semaineAffichee);
  const finSemaine = new Date(semaineAffichee);
  finSemaine.setDate(finSemaine.getDate() + 6);

  document.getElementById('semaine-sublabel').textContent =
    `${fmtDateCourt(debutSemaine)} — ${fmtDateCourt(finSemaine)}`;
  document.getElementById('semaine-label').firstChild.textContent =
    `Semaine du ${debutSemaine.getDate()} au ${finSemaine.getDate()}`;

  const debutISO = toISODate(debutSemaine);
  const finISO = toISODate(finSemaine);

  const { data, error } = await supabaseClient.from('planning_overrides')
    .select('*')
    .gte('date', debutISO)
    .lte('date', finISO);

  const overrides = {};
  if(!error && data){
    data.forEach(o => { overrides[o.date] = o; });
  }

  renderSemaineJours(debutSemaine, overrides);
}

function renderSemaineJours(debutSemaine, overrides){
  const el = document.getElementById('semaine-jours-list');
  el.innerHTML = JOURS_SEMAINE.map((j, i) => {
    const dateObj = new Date(debutSemaine);
    dateObj.setDate(dateObj.getDate() + i);
    const dateISO = toISODate(dateObj);
    const override = overrides[dateISO];

    const defaut = horairesActuels[j.key] || { ouvert:false };
    const estOverride = !!override;

    const ouvert = estOverride ? override.ouvert : defaut.ouvert;
    const debut = estOverride ? (override.debut || '10:00') : (defaut.debut || '10:00');
    const fin = estOverride ? (override.fin || '19:00') : (defaut.fin || '19:00');

    return `
    <div class="jour-row ${estOverride ? 'override' : ''}" data-sem-jour="${j.key}" data-date="${dateISO}">
      <div class="jour-date">${fmtDateCourt(dateObj)}</div>
      <div class="jour-nom">${j.label}${estOverride ? '<span class="override-badge">MODIFIÉ</span>' : ''}</div>
      <label class="jour-toggle">
        <input type="checkbox" class="sem-ouvert-check">
        Ouvert
      </label>
      <div class="jour-heures" id="sem-heures-${dateISO}" style="${ouvert ? '' : 'display:none'}">
        <input type="time" id="sem-debut-${dateISO}" value="${debut}">
        <span>à</span>
        <input type="time" id="sem-fin-${dateISO}" value="${fin}">
      </div>
      <span class="jour-ferme-label" id="sem-ferme-${dateISO}" style="${ouvert ? 'display:none' : ''}">Fermé</span>
      ${estOverride ? `<button class="btn-reset-jour" data-reset="${dateISO}">Revenir à l'horaire habituel</button>` : ''}
    </div>`;
  }).join('');

  // état initial des cases (fait après l'injection HTML pour éviter les soucis de "checked" en string)
  JOURS_SEMAINE.forEach((j,i)=>{
    const dateObj = new Date(debutSemaine);
    dateObj.setDate(dateObj.getDate() + i);
    const dateISO = toISODate(dateObj);
    const override = overrides[dateISO];
    const defaut = horairesActuels[j.key] || { ouvert:false };
    const ouvert = override ? override.ouvert : defaut.ouvert;
    const check = document.querySelector(`[data-date="${dateISO}"] .sem-ouvert-check`);
    check.checked = ouvert;
    check.addEventListener('change', ()=>onSemaineJourChange(dateISO));
    document.getElementById('sem-debut-'+dateISO).addEventListener('change', ()=>onSemaineJourChange(dateISO));
    document.getElementById('sem-fin-'+dateISO).addEventListener('change', ()=>onSemaineJourChange(dateISO));
  });

  el.querySelectorAll('[data-reset]').forEach(btn=>{
    btn.addEventListener('click', ()=>resetJourSemaine(btn.dataset.reset));
  });
}

function onSemaineJourChange(dateISO){
  const check = document.querySelector(`[data-date="${dateISO}"] .sem-ouvert-check`);
  const ouvert = check.checked;
  document.getElementById('sem-heures-'+dateISO).style.display = ouvert ? 'flex' : 'none';
  document.getElementById('sem-ferme-'+dateISO).style.display = ouvert ? 'none' : 'inline';
  sauvegarderOverride(dateISO);
}

async function sauvegarderOverride(dateISO){
  const check = document.querySelector(`[data-date="${dateISO}"] .sem-ouvert-check`);
  const ouvert = check.checked;
  const debut = ouvert ? (document.getElementById('sem-debut-'+dateISO).value || '10:00') : null;
  const fin = ouvert ? (document.getElementById('sem-fin-'+dateISO).value || '19:00') : null;

  const { error } = await supabaseClient.from('planning_overrides')
    .upsert({ date: dateISO, ouvert, debut, fin, updated_at: new Date().toISOString() }, { onConflict: 'date' });

  if(error){ alert("Erreur lors de l'enregistrement de ce jour."); return; }
  showToast("Modification enregistrée");
  await loadSemaine();
}

async function resetJourSemaine(dateISO){
  if(!confirm("Revenir à l'horaire habituel pour ce jour ?")) return;
  const { error } = await supabaseClient.from('planning_overrides').delete().eq('date', dateISO);
  if(error){ alert("Erreur lors de la suppression."); return; }
  showToast("Horaire habituel rétabli");
  await loadSemaine();}


/* ============================================================
   CALENDRIER — vue mois de tous les rendez-vous acceptés
   (invitées, formations, mariées) pour repérer les journées chargées
   ============================================================ */
const MOIS_NOMS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
let moisAffiche = new Date();
moisAffiche.setDate(1);
let CAL_EVENTS = []; // liste plate d'événements acceptés, tous types confondus

document.getElementById('mois-prec-btn').addEventListener('click', ()=>{
  moisAffiche.setMonth(moisAffiche.getMonth() - 1);
  renderCalendrier();
});
document.getElementById('mois-suiv-btn').addEventListener('click', ()=>{
  moisAffiche.setMonth(moisAffiche.getMonth() + 1);
  renderCalendrier();
});
document.getElementById('mois-today-btn').addEventListener('click', ()=>{
  moisAffiche = new Date();
  moisAffiche.setDate(1);
  renderCalendrier();
});

async function loadCalendrier(){
  const events = [];

  try{
    const { data, error } = await supabaseClient
      .from('reservations')
      .select('*')
      .eq('status', 'acceptée');
    if(error) throw error;
    (data||[]).forEach(r=>{
      if(!r.date_rdv) return;
      events.push({
        date: r.date_rdv,
        type: r.type === 'formation' ? 'formation' : 'slot',
        typeLabel: r.type === 'formation' ? 'Formation' : 'Invitée',
        nom: r.nom || 'Sans nom',
        service: r.prestation || '',
        heure: r.heure_rdv || '',
        email: r.email || '',
        tel: r.telephone || ''
      });
    });
  }catch(e){
    console.warn('Calendrier : lecture "reservations" impossible.', e);
  }

  try{
    const { data, error } = await supabaseClient
      .from('demandes_mariee')
      .select('*')
      .eq('status', 'acceptée');
    if(error) throw error;
    (data||[]).forEach(r=>{
      if(!r.date_mariage) return;
      events.push({
        date: r.date_mariage,
        type: 'mariee',
        typeLabel: 'Mariée',
        nom: r.nom || 'Sans nom',
        service: r.formule || '',
        heure: '',
        email: r.email || '',
        tel: r.telephone || ''
      });
    });
  }catch(e){
    console.warn('Calendrier : lecture "demandes_mariee" impossible.', e);
  }

  CAL_EVENTS = events;
  renderCalendrier();
}

function renderCalendrier(){
  const y = moisAffiche.getFullYear();
  const m = moisAffiche.getMonth();
  document.getElementById('mois-label').textContent = `${MOIS_NOMS[m]} ${y}`;

  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';

  ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].forEach(j=>{
    const head = document.createElement('div');
    head.className = 'cal-day-head';
    head.textContent = j;
    grid.appendChild(head);
  });

  const premierJour = new Date(y, m, 1);
  const dernierJour = new Date(y, m + 1, 0);
  const nbJours = dernierJour.getDate();

  // décalage lundi=0 ... dimanche=6
  let decalage = premierJour.getDay() - 1;
  if(decalage < 0) decalage = 6;

  const todayISO = toISODateCal(new Date());

  for(let i = 0; i < decalage; i++){
    const empty = document.createElement('div');
    empty.className = 'cal-cell empty';
    grid.appendChild(empty);
  }

  for(let d = 1; d <= nbJours; d++){
    const dateObj = new Date(y, m, d);
    const dateISO = toISODateCal(dateObj);
    const evsJour = CAL_EVENTS.filter(e => e.date === dateISO);

    const cell = document.createElement('div');
    cell.className = 'cal-cell' + (dateISO === todayISO ? ' today' : '');

    const num = document.createElement('div');
    num.className = 'cal-daynum';
    num.textContent = d;
    cell.appendChild(num);

    if(evsJour.length){
      const dots = document.createElement('div');
      dots.className = 'cal-dots';
      evsJour.slice(0, 3).forEach(ev=>{
        const dot = document.createElement('div');
        dot.className = 'cal-dot ' + ev.type;
        dot.textContent = ev.nom;
        dots.appendChild(dot);
      });
      if(evsJour.length > 3){
        const more = document.createElement('div');
        more.className = 'cal-more';
        more.textContent = `+${evsJour.length - 3} autre(s)`;
        dots.appendChild(more);
      }
      cell.appendChild(dots);
      cell.addEventListener('click', ()=>showCalDetail(dateISO, evsJour));
    }

    grid.appendChild(cell);
  }
}

function toISODateCal(d){
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function showCalDetail(dateISO, evsJour){
  const card = document.getElementById('cal-detail-card');
  const title = document.getElementById('cal-detail-title');
  const body = document.getElementById('cal-detail-body');

  const dateAffiche = new Date(dateISO + 'T00:00:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  title.textContent = dateAffiche;

  const alerte = evsJour.length > 1
    ? `<p style="font-size:12px;color:var(--gold);margin-bottom:16px">⚠ ${evsJour.length} rendez-vous ce jour-là — vérifiez que ça reste gérable.</p>`
    : '';

  body.innerHTML = alerte + evsJour.map(ev => `
    <div class="cal-detail-item">
      <div>
        <div class="cal-detail-name">${ev.nom}</div>
        <div class="cal-detail-meta">
          ${ev.service}${ev.heure ? ' · ' + ev.heure : ''}
          ${ev.email ? '<br>' + ev.email : ''}
          ${ev.tel ? ' · ' + ev.tel : ''}
        </div>
      </div>
      <span class="cal-detail-type ${ev.type}">${ev.typeLabel}</span>
    </div>
  `).join('');

  card.style.display = 'block';
  card.scrollIntoView({behavior:'smooth', block:'nearest'});
}
