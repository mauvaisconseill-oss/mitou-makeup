/* ============================================================
   ADMIN — Mitou Makeup (version simple, mot de passe en dur)
   ============================================================ */
const SUPABASE_URL = "https://cayadmbypnfukskotrma.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNheWFkbWJ5cG5mdWtza290cm1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0OTcxODIsImV4cCI6MjEwMzA3MzE4Mn0._j5jQ1kXYOz5NhJLBsRlGXI8HEBRMQCo3ka3QrjYUe0";

const ADMIN_PASSWORD = "makeup00Mitou@"; // ⚠️ mets ton propre mot de passe ici

let supabaseClient = null;
try{
  if(window.supabase && typeof window.supabase.createClient === 'function'){
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}catch(e){
  console.warn('Supabase : initialisation impossible.', e);
}

/* ---------- connexion ---------- */
const loginScreen = document.getElementById('admin-login');
const dashScreen  = document.getElementById('admin-dash');
const passInput   = document.getElementById('admin-pass');
const loginBtn    = document.getElementById('admin-login-btn');
const loginErr    = document.getElementById('admin-login-err');

function tryLogin(){
  if(passInput.value === ADMIN_PASSWORD){
    loginErr.textContent = "";
    showDash();
  } else {
    loginErr.textContent = "Mot de passe incorrect.";
  }
}

loginBtn.addEventListener('click', tryLogin);
passInput.addEventListener('keydown', e=>{ if(e.key==='Enter') tryLogin(); });

function showDash(){
  loginScreen.style.display = 'none';
  dashScreen.style.display = 'block';
  loadData();
}

document.getElementById('logout-btn').addEventListener('click', ()=>{
  location.reload();
});
document.getElementById('refresh-btn').addEventListener('click', loadData);

/* ---------- filtres ---------- */
let activeFilter = 'all';
document.querySelectorAll('.admin-chip').forEach(chip=>{
  chip.addEventListener('click', ()=>{
    document.querySelectorAll('.admin-chip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    renderBoard();
  });
});

/* ---------- chargement des données ---------- */
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

/* ---------- rendu ---------- */
function fmtDate(d){
  if(!d) return '—';
  try{ return new Date(d).toLocaleDateString('fr-FR'); }catch(e){ return d; }
}

function renderBoard(){
  const filtered = activeFilter === 'all' ? ALL_CARDS : ALL_CARDS.filter(c=>c.type===activeFilter);

  const groups = { 'en attente':[], 'acceptée':[], 'refusée':[] };
  filtered.forEach(c=>{
    const s = groups[c.status] ? c.status : 'en attente';
    groups[s].push(c);
  });

  renderColumn('col-attente', 'count-attente', groups['en attente']);
  renderColumn('col-acceptee', 'count-acceptee', groups['acceptée']);
  renderColumn('col-refusee', 'count-refusee', groups['refusée']);

  document.getElementById('admin-stats').innerHTML = `
    <div class="admin-stat"><span class="admin-stat-num">${ALL_CARDS.length}</span><span class="admin-stat-label">Total</span></div>
    <div class="admin-stat"><span class="admin-stat-num">${groups['en attente'].length}</span><span class="admin-stat-label">En attente</span></div>
    <div class="admin-stat"><span class="admin-stat-num">${groups['acceptée'].length}</span><span class="admin-stat-label">Acceptées</span></div>
    <div class="admin-stat"><span class="admin-stat-num">${groups['refusée'].length}</span><span class="admin-stat-label">Refusées</span></div>
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
    if(card.status === 'en attente'){
      actions.innerHTML = `<button class="accept">Accepter</button><button class="refuse">Refuser</button>`;
      actions.querySelector('.accept').addEventListener('click', ()=>updateStatus(card, 'acceptée'));
      actions.querySelector('.refuse').addEventListener('click', ()=>updateStatus(card, 'refusée'));
    } else {
      actions.innerHTML = `<button class="revert">Remettre en attente</button>`;
      actions.querySelector('.revert').addEventListener('click', ()=>updateStatus(card, 'en attente'));
    }

    body.appendChild(node);
  });
}

async function updateStatus(card, newStatus){
  try{
    const { error } = await supabaseClient
      .from(card.table)
      .update({ status:newStatus })
      .eq('id', card.id);
    if(error) throw error;
    card.status = newStatus;
    renderBoard();
  }catch(e){
    console.error('Mise à jour du statut impossible.', e);
    alert("Impossible de mettre à jour cette demande.");
  }
}
