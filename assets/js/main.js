/* =============================================================
   STRIXHAVEN STUDENT PORTAL — MAIN JAVASCRIPT
   ============================================================= */

/* --- NAV & INIT --- */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initSparkles();
  markActiveNavLink();
});

function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (!toggle || !mobileMenu) return;
  toggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', mobileMenu.classList.contains('open'));
  });
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.remove('open');
    }
  });
}

function markActiveNavLink() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

/* --- SPARKLES --- */
function initSparkles() {
  const containers = document.querySelectorAll('.sparkle-container');
  containers.forEach(c => {
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('div');
      s.className = 'sparkle';
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 100 + '%';
      s.style.animationDelay = (Math.random() * 4) + 's';
      s.style.animationDuration = (3 + Math.random() * 3) + 's';
      c.appendChild(s);
    }
  });
}

/* --- BADGE HELPERS --- */
function collegeBadge(college) {
  if (!college) return '';
  const cls = 'badge badge-college-' + college.toLowerCase();
  const icons = { Lorehold:'🏛️', Prismari:'🎨', Quandrix:'🔮', Silverquill:'✒️', Witherbloom:'🌿' };
  return `<span class="${cls}">${icons[college] || ''} ${college}</span>`;
}

function relStatusBadge(status) {
  const map = { 'Unknown':'rel-unknown','Acquaintance':'rel-acquaintance','Friend':'rel-friend','Beloved':'rel-beloved','Rival':'rel-rival','Suspicious':'rel-suspicious','Trusted':'rel-trusted','Positive':'rel-friend','Tense':'rel-suspicious' };
  return `<span class="badge ${map[status]||'rel-unknown'}">${status||'Unknown'}</span>`;
}

function npcImageSrc(npc) {
  if (npc.image) return `assets/images/${npc.image}`;
  if (npc.type === 'student') return `assets/images/students/${npc.id}.jpg`;
  return null;
}

function openPortraitLightbox(src, name) {
  const lb = document.createElement('div');
  lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;';
  lb.innerHTML = `<img src="${src}" alt="${name}" style="max-height:90vh;max-width:90vw;border-radius:10px;box-shadow:0 0 60px rgba(0,0,0,0.9);">`;
  lb.addEventListener('click', () => lb.remove());
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { lb.remove(); document.removeEventListener('keydown', esc); } });
  document.body.appendChild(lb);
}

/* --- FETCH JSON DATA --- */
async function fetchData(file) {
  try {
    const r = await fetch(`data/${file}`);
    if (!r.ok) throw new Error(r.statusText);
    return await r.json();
  } catch (e) { console.error('Failed to load', file, e); return []; }
}

/* --- LOCAL STORAGE (fallback only) --- */
const LS = {
  get(key, def = null) { try { return JSON.parse(localStorage.getItem('strix_' + key)) ?? def; } catch { return def; } },
  set(key, val) { try { localStorage.setItem('strix_' + key, JSON.stringify(val)); } catch {} }
};

/* --- MODAL --- */
function openModal(contentHtml) {
  let overlay = document.getElementById('modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
      <button class="modal-close" aria-label="Close">&times;</button>
      <div id="modal-body"></div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  }
  overlay.querySelector('#modal-body').innerHTML = contentHtml;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) { overlay.classList.remove('open'); document.body.style.overflow = ''; }
}

/* --- TOAST --- */
function showToast(msg, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;';
    document.body.appendChild(container);
  }
  const colors = { info:'#2ab8c8', success:'#48b878', warn:'#c8a95a', error:'#e07070' };
  const toast = document.createElement('div');
  toast.style.cssText = `background:var(--bg-panel);border:1px solid ${colors[type]||colors.info};color:var(--text-primary);padding:0.75rem 1.25rem;border-radius:8px;font-size:0.85rem;box-shadow:0 4px 16px rgba(0,0,0,0.4);max-width:280px;`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity='0'; toast.style.transition='opacity 0.4s'; setTimeout(()=>toast.remove(),400); }, 2500);
}

/* ============================================================
   REVEAL SYSTEM
   ============================================================ */

/* Renders a field that may be hidden — DM sees lock toggle, players see lock icon */
function revealField(npcId, field, label, content, icon = '') {
  const key = `${npcId}_${field}`;
  const revealed = isRevealed(key);
  const dm = typeof isDM === 'function' && isDM();

  const lockBtn = dm
    ? `<button class="reveal-toggle-btn" onclick="handleRevealToggle('${key}', ${revealed})"
         title="${revealed ? 'Hide from players' : 'Reveal to players'}"
         style="background:none;border:none;cursor:pointer;font-size:0.9rem;padding:0.15rem;opacity:0.7;transition:opacity 0.2s;"
         onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.7">
         ${revealed ? '🔓' : '🔒'}
       </button>`
    : '';

  const lockedHtml = `
    <div style="background:rgba(100,100,120,0.06);border:1px solid var(--border);border-radius:8px;padding:0.75rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.3rem;">
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);">${icon} ${label}</div>
        ${lockBtn}
      </div>
      <p style="font-size:0.83rem;color:var(--text-muted);font-style:italic;">🔒 Not yet revealed</p>
    </div>`;

  const revealedHtml = `
    <div style="background:rgba(100,100,120,0.06);border:1px solid var(--border);border-radius:8px;padding:0.75rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.3rem;">
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);">${icon} ${label}</div>
        ${lockBtn}
      </div>
      <p style="font-size:0.83rem;">${content}</p>
    </div>`;

  return (dm || revealed) ? revealedHtml : lockedHtml;
}

async function handleRevealToggle(key, currentValue) {
  await toggleReveal(key, currentValue);
  // Re-render the current modal by re-opening with updated state
  const modalBody = document.getElementById('modal-body');
  if (modalBody && window._lastModalNpc) {
    const npc = window._lastModalNpc;
    openNpcModal(npc, false); // false = don't re-load relationships
  }
}

/* ============================================================
   PAGE: STUDENTS & FACULTY
   ============================================================ */
async function initStudentsPage() {
  const [students, faculty] = await Promise.all([fetchData('students.json'), fetchData('faculty.json')]);
  const all = [...students, ...faculty];
  await _renderNpcGrid('npc-grid', 'npc-count', all, all, {
    searchId: 'npc-search',
    collegeSelector: '.college-filter-btn',
    typeSelector: '.type-filter-btn'
  });
}

async function _renderNpcGrid(gridId, countId, all, initialFiltered, opts = {}) {
  const relData = await getPlayerRelationships();
  let filtered = [...initialFiltered];
  let activeCollege = 'all', activeType = 'all', searchQuery = '';
  const grid = document.getElementById(gridId);
  const count = document.getElementById(countId);

  function render() {
    if (!grid) return;
    if (!filtered.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔍</div><p>No results found.</p></div>`;
      if (count) count.textContent = '0'; return;
    }
    if (count) count.textContent = filtered.length;
    grid.innerHTML = filtered.map(npc => npcCard(npc, relData)).join('');
    grid.querySelectorAll('.npc-card').forEach(card => {
      const handler = () => { const n = all.find(x => x.id === card.dataset.id); if (n) openNpcModal(n); };
      card.addEventListener('click', handler);
      card.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') handler(); });
    });
  }

  function applyFilters() {
    filtered = all.filter(npc => {
      const mc = activeCollege === 'all' || (npc.college||'').toLowerCase() === activeCollege.toLowerCase();
      const mt = activeType === 'all' || npc.type === activeType;
      const ms = !searchQuery || ['name','personality','vibe','college'].some(f => (npc[f]||'').toLowerCase().includes(searchQuery.toLowerCase()));
      return mc && mt && ms;
    });
    render();
  }

  if (opts.searchId) {
    document.getElementById(opts.searchId)?.addEventListener('input', function(){ searchQuery=this.value; applyFilters(); });
  }
  if (opts.collegeSelector) {
    document.querySelectorAll(opts.collegeSelector).forEach(btn => btn.addEventListener('click', () => {
      document.querySelectorAll(opts.collegeSelector).forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); activeCollege = btn.dataset.college||'all'; applyFilters();
    }));
  }
  if (opts.typeSelector) {
    document.querySelectorAll(opts.typeSelector).forEach(btn => btn.addEventListener('click', () => {
      document.querySelectorAll(opts.typeSelector).forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); activeType = btn.dataset.type||'all'; applyFilters();
    }));
  }

  render();
}

function npcCard(npc, relData = {}) {
  const savedRel = relData[npc.id] || {};
  const relStatus = savedRel.status || npc.relationshipStatus || 'Unknown';
  const isFav = savedRel.is_favorite || savedRel.isFavorite || false;
  const imgSrc = npcImageSrc(npc);
  const avatarHtml = imgSrc
    ? `<div style="width:48px;height:60px;flex-shrink:0;border-radius:5px;overflow:hidden;border:1px solid var(--border);cursor:zoom-in;" onclick="event.stopPropagation();openPortraitLightbox('${imgSrc}','${npc.name}')"><img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;object-position:top center;" alt="${npc.name}" loading="lazy"></div>`
    : `<div class="card-avatar">${npc.emoji||'👤'}</div>`;
  return `
    <div class="card npc-card card-clickable" data-id="${npc.id}" data-college="${npc.college||''}" role="button" tabindex="0" aria-label="View ${npc.name}">
      <div class="card-header">
        ${avatarHtml}
        <div>
          <div class="card-title">${npc.name}${isFav?'<span style="color:var(--gold);margin-left:0.3rem;font-size:0.85rem;">★</span>':''}</div>
          <div class="card-subtitle">${npc.race||''} ${npc.role?'· '+npc.role:''}</div>
        </div>
      </div>
      <div class="card-body" style="margin-bottom:0.5rem;">
        ${npc.vibe?`<em style="font-size:0.82rem;color:var(--text-muted);">${npc.vibe}</em>`:''}
      </div>
      <div class="card-footer">
        ${npc.college?collegeBadge(npc.college):''}
        ${relStatusBadge(relStatus)}
        ${npc.type==='faculty'?'<span class="badge badge-gold">Faculty</span>':''}
      </div>
    </div>`;
}

async function openNpcModal(npc, loadRel = true) {
  window._lastModalNpc = npc;
  let savedRel = {};
  if (loadRel) {
    const allRel = await getPlayerRelationships();
    savedRel = allRel[npc.id] || {};
  } else {
    const allRel = await getPlayerRelationships();
    savedRel = allRel[npc.id] || {};
  }

  const currentStatus = savedRel.status || npc.relationshipStatus || 'Unknown';
  const bondScore = savedRel.bond_score ?? savedRel.bondScore ?? 0;
  const notes = savedRel.notes || '';
  const isFavorite = savedRel.is_favorite || false;

  const statuses = ['Unknown','Acquaintance','Friend','Beloved','Rival','Suspicious','Trusted'];
  const statusOptions = statuses.map(s => `<option value="${s}" ${s===currentStatus?'selected':''}>${s}</option>`).join('');

  const extras = npc.extracurriculars?.length ? `<p style="font-size:0.85rem;"><strong style="color:var(--text-secondary);">Clubs:</strong> ${npc.extracurriculars.join(', ')}</p>` : '';
  const job = npc.job ? `<p style="font-size:0.85rem;"><strong style="color:var(--text-secondary);">Job:</strong> ${npc.job}</p>` : '';
  const locations = npc.favoriteLocations?.length ? `<p style="font-size:0.85rem;"><strong style="color:var(--text-secondary);">Haunts:</strong> ${npc.favoriteLocations.join(', ')}</p>` : '';

  /* Reveal-gated fields */
  const boonHtml = npc.bondBoon ? revealField(npc.id, 'boon', 'Bond Boon', npc.bondBoon, '⬆') : '';
  const baneHtml = npc.bondBane ? revealField(npc.id, 'bane', 'Bond Bane', npc.bondBane, '⬇') : '';
  const rumorHtml = npc.rumors ? revealField(npc.id, 'rumors', 'Campus Whisper', npc.rumors, '💬') : '';
  const gossipHtml = npc.gossip ? revealField(npc.id, 'gossip', 'Gossip', npc.gossip, '🗣️') : '';

  const imgSrc = npcImageSrc(npc);
  const modalAvatarHtml = imgSrc
    ? `<div style="width:85px;flex-shrink:0;border-radius:8px;overflow:hidden;border:1px solid var(--border);cursor:zoom-in;" onclick="openPortraitLightbox('${imgSrc}','${npc.name}')"><img src="${imgSrc}" style="width:100%;display:block;" alt="${npc.name}" loading="lazy"></div>`
    : `<div class="card-avatar" style="width:60px;height:60px;font-size:2rem;">${npc.emoji||'👤'}</div>`;

  openModal(`
    <div style="display:flex;align-items:flex-start;gap:1rem;margin-bottom:1.25rem;">
      ${modalAvatarHtml}
      <div>
        <h2 style="font-size:1.3rem;margin-bottom:0.25rem;">${npc.name}</h2>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.3rem;">
          ${npc.college?collegeBadge(npc.college):''}
          ${npc.type==='faculty'?'<span class="badge badge-gold">Faculty</span>':''}
          <span class="badge badge-neutral">${npc.race||''}</span>
        </div>
      </div>
    </div>
    <p style="color:var(--text-secondary);margin-bottom:1rem;">${npc.personality||npc.playerSummary||''}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:1rem;font-size:0.85rem;">
      ${extras}${job}${locations}
    </div>
    ${(boonHtml||baneHtml) ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1rem;">${boonHtml}${baneHtml}</div>` : ''}
    ${rumorHtml ? `<div style="margin-bottom:0.75rem;">${rumorHtml}</div>` : ''}
    ${gossipHtml ? `<div style="margin-bottom:0.75rem;">${gossipHtml}</div>` : ''}
    <div style="border-top:1px solid var(--border);padding-top:1rem;margin-top:1rem;">
      <h4 style="font-size:0.85rem;margin-bottom:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;">Your Ledger</h4>
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem;">
        <label for="modal-rel-status" style="font-size:0.82rem;color:var(--text-secondary);white-space:nowrap;">Relationship:</label>
        <select id="modal-rel-status" class="filter-select" style="flex:1;">${statusOptions}</select>
        <button onclick="toggleFavoriteFromModal('${npc.id}')" id="modal-fav-btn" class="favorite-btn ${isFavorite?'active':''}" title="Favorite">⭐</button>
      </div>
      <div style="margin-bottom:0.75rem;">
        <label for="modal-bond-score" style="font-size:0.82rem;color:var(--text-secondary);display:block;margin-bottom:0.3rem;">Bond Points: <span id="modal-bond-display">${bondScore}</span></label>
        <input type="range" id="modal-bond-score" min="-2" max="4" value="${bondScore}" style="width:100%;accent-color:var(--gold);">
      </div>
      <textarea id="modal-notes" placeholder="Your personal notes about this person..." style="width:100%;height:80px;background:var(--bg-panel);border:1px solid var(--border);border-radius:8px;padding:0.75rem;color:var(--text-primary);font-family:'Crimson Pro',serif;font-size:0.95rem;resize:vertical;outline:none;">${notes}</textarea>
      <div style="display:flex;justify-content:flex-end;gap:0.5rem;margin-top:0.5rem;">
        <button class="btn btn-primary btn-sm" onclick="saveNpcRelationship('${npc.id}')">Save</button>
      </div>
    </div>
  `);

  document.getElementById('modal-bond-score')?.addEventListener('input', function() {
    document.getElementById('modal-bond-display').textContent = this.value;
  });
}

async function saveNpcRelationship(id) {
  const status = document.getElementById('modal-rel-status')?.value;
  const bondScore = parseInt(document.getElementById('modal-bond-score')?.value || '0');
  const notes = document.getElementById('modal-notes')?.value || '';
  const existing = (await getPlayerRelationships())[id] || {};
  await savePlayerRelationship(id, { status, bond_score: bondScore, notes, is_favorite: existing.is_favorite || false });
  showToast('Relationship saved!', 'success');
  closeModal();
}

async function toggleFavoriteFromModal(id) {
  const allRel = await getPlayerRelationships();
  const existing = allRel[id] || {};
  const newFav = !existing.is_favorite;
  await savePlayerRelationship(id, { ...existing, is_favorite: newFav });
  const btn = document.getElementById('modal-fav-btn');
  if (btn) btn.classList.toggle('active', newFav);
}

/* ============================================================
   PAGE: RELATIONSHIPS
   ============================================================ */
async function initRelationshipsPage() {
  const [data, relData] = await Promise.all([fetchData('relationships.json'), getPlayerRelationships()]);
  const merged = data.map(r => ({ ...r, ...(relData[r.id]||{}), status: (relData[r.id]?.status) || r.relationshipStatus || 'Unknown', bondScore: relData[r.id]?.bond_score ?? 0, isFavorite: relData[r.id]?.is_favorite || false }));
  let filtered = [...merged];
  let activeStatus = 'all', searchQuery = '';
  const grid = document.getElementById('rel-grid');
  const count = document.getElementById('rel-count');

  function render() {
    if (!grid) return;
    if (!filtered.length) { grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">💝</div><p>No relationships match.</p></div>`; return; }
    if (count) count.textContent = filtered.length;
    grid.innerHTML = filtered.map(r => relCard(r)).join('');
    grid.querySelectorAll('.rel-card').forEach(card => {
      const handler = () => { const n = merged.find(r=>r.id===card.dataset.id); if (n) openNpcModal(n); };
      card.addEventListener('click', handler);
      card.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' ') handler(); });
    });
  }

  function applyFilters() {
    filtered = merged.filter(r => {
      const ms = activeStatus==='all'||r.status===activeStatus;
      const mq = !searchQuery||r.name.toLowerCase().includes(searchQuery.toLowerCase());
      return ms && mq;
    });
    filtered.sort((a,b)=>(b.isFavorite?1:0)-(a.isFavorite?1:0));
    render();
  }

  document.getElementById('rel-search')?.addEventListener('input', function(){ searchQuery=this.value; applyFilters(); });
  document.querySelectorAll('.rel-filter-btn').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.rel-filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); activeStatus=btn.dataset.status||'all'; applyFilters();
  }));
  document.getElementById('rel-sort')?.addEventListener('change', function(){
    if(this.value==='college') filtered.sort((a,b)=>(a.college||'').localeCompare(b.college||''));
    else if(this.value==='bond') filtered.sort((a,b)=>(b.bondScore||0)-(a.bondScore||0));
    else if(this.value==='name') filtered.sort((a,b)=>a.name.localeCompare(b.name));
    render();
  });

  applyFilters();
}

function relCard(r) {
  const bond = r.bondScore || r.bond_score || 0;
  const bondWidth = Math.max(0, Math.min(100, ((bond+2)/6)*100));
  return `
    <div class="card rel-card" data-id="${r.id}" role="button" tabindex="0">
      <div class="card-header">
        <div class="card-avatar">${r.emoji||'👤'}</div>
        <div style="flex:1;">
          <div class="card-title">${r.name}${r.isFavorite?'<span style="color:var(--gold);margin-left:0.3rem;font-size:0.9rem;">★</span>':''}</div>
          <div class="card-subtitle">${r.college||''}</div>
        </div>
        ${r.needsFollowUp?'<span class="badge badge-neutral" style="font-size:0.65rem;">Follow Up</span>':''}
      </div>
      <div class="bond-bar-container">
        <div class="bond-bar-label">Bond Points: ${bond}</div>
        <div class="bond-bar"><div class="bond-fill" style="width:${bondWidth}%"></div></div>
      </div>
      <div class="card-footer">${collegeBadge(r.college)}${relStatusBadge(r.status||'Unknown')}</div>
    </div>`;
}

/* ============================================================
   PAGE: MYSTERY BOARD
   ============================================================ */
async function initMysteryPage() {
  const [defaults, supabaseMysteries] = await Promise.all([fetchData('mysteries.json'), getMysteries()]);
  const data = supabaseMysteries.length ? supabaseMysteries : defaults;
  let filtered = [...data];
  let activeCategory = 'all';
  const grid = document.getElementById('mystery-grid');
  const count = document.getElementById('mystery-count');

  function render() {
    if (!grid) return;
    if (!filtered.length) {
      grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🕵️</div><p>No entries yet. Add your first lead.</p></div>`;
      return;
    }
    if (count) count.textContent = filtered.length;
    grid.innerHTML = filtered.map(c=>clueCard(c)).join('');
    grid.querySelectorAll('.clue-card').forEach(card=>{
      card.addEventListener('click',()=>openClueModal(card.dataset.id, data));
      card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')card.click();});
    });
  }

  function applyFilters() {
    filtered = activeCategory==='all' ? [...data] : data.filter(c=>c.category===activeCategory);
    render();
  }

  document.querySelectorAll('.mystery-cat-btn').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.mystery-cat-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); activeCategory=btn.dataset.cat||'all'; applyFilters();
  }));

  document.getElementById('add-clue-btn')?.addEventListener('click',()=>openAddClueModal(data));
  render();
}

function clueCard(c) {
  const catClass = 'cat-'+(c.category||'clue').toLowerCase().replace(/\s+/g,'-');
  const statusColors = {Open:'#2ab8c8',Solved:'#48b878','False Lead':'#888'};
  return `
    <div class="card clue-card" data-id="${c.id}" role="button" tabindex="0">
      <div class="clue-category ${catClass}">${c.category}</div>
      <div class="card-title" style="margin-bottom:0.5rem;">${c.title}</div>
      <div class="card-body">${c.description}</div>
      ${c.status?`<div style="margin-top:0.75rem;"><span class="badge badge-neutral" style="color:${statusColors[c.status]||'var(--text-muted)'};">${c.status}</span></div>`:''}
      ${c.player_notes||c.playerNotes?`<p style="font-size:0.78rem;color:var(--text-muted);margin-top:0.5rem;font-style:italic;">${(c.player_notes||c.playerNotes).slice(0,80)}${((c.player_notes||c.playerNotes).length>80?'...':'')}</p>`:''}
    </div>`;
}

function openClueModal(id, data) {
  const clue = data.find(c=>c.id===id);
  if (!clue) return;
  const categories = ['Clue','Rumor','Suspect','Location','Question','Theory','Solved','False Lead'];
  const catOptions = categories.map(c=>`<option ${c===clue.category?'selected':''}>${c}</option>`).join('');
  const statuses = ['Open','Solved','False Lead'];
  const statOptions = statuses.map(s=>`<option ${s===clue.status?'selected':''}>${s}</option>`).join('');
  const canDelete = typeof isDM==='function' && isDM();

  openModal(`
    <h2 style="margin-bottom:0.5rem;">${clue.title}</h2>
    <div class="clue-category cat-${(clue.category||'clue').toLowerCase().replace(/\s+/g,'-')}" style="margin-bottom:1rem;">${clue.category}</div>
    <p style="color:var(--text-secondary);margin-bottom:1.25rem;">${clue.description}</p>
    <div style="border-top:1px solid var(--border);padding-top:1rem;">
      <h4 style="font-size:0.85rem;margin-bottom:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;">Update</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem;">
        <div><label style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:0.3rem;">Category</label>
          <select id="clue-cat" class="filter-select" style="width:100%;">${catOptions}</select></div>
        <div><label style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:0.3rem;">Status</label>
          <select id="clue-status" class="filter-select" style="width:100%;">${statOptions}</select></div>
      </div>
      <textarea id="clue-notes" placeholder="Notes, connections, theories..." style="width:100%;height:80px;background:var(--bg-panel);border:1px solid var(--border);border-radius:8px;padding:0.75rem;color:var(--text-primary);font-family:'Crimson Pro',serif;font-size:0.95rem;resize:vertical;outline:none;">${clue.player_notes||clue.playerNotes||''}</textarea>
      <div style="display:flex;justify-content:space-between;margin-top:0.5rem;">
        ${canDelete?`<button class="btn btn-ghost btn-sm" style="color:#f09090;" onclick="handleDeleteClue('${id}')">Delete</button>`:'<div></div>'}
        <button class="btn btn-primary btn-sm" onclick="handleSaveClue('${id}')">Save</button>
      </div>
    </div>
  `);
}

async function handleSaveClue(id) {
  const category = document.getElementById('clue-cat')?.value;
  const status = document.getElementById('clue-status')?.value;
  const player_notes = document.getElementById('clue-notes')?.value||'';
  await upsertMystery({ id, category, status, player_notes });
  showToast('Clue updated!','success');
  closeModal();
  initMysteryPage();
}

async function handleDeleteClue(id) {
  if (!confirm('Delete this entry?')) return;
  await deleteMystery(id);
  showToast('Entry deleted.','info');
  closeModal();
  initMysteryPage();
}

function openAddClueModal(data) {
  const categories = ['Clue','Rumor','Suspect','Location','Question','Theory'];
  openModal(`
    <h2 style="margin-bottom:1.25rem;">Add New Entry</h2>
    <div style="display:flex;flex-direction:column;gap:0.75rem;">
      <div><label style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:0.3rem;">Title</label>
        <input id="new-clue-title" type="text" placeholder="What is this lead about?" style="width:100%;background:var(--bg-panel);border:1px solid var(--border);border-radius:8px;padding:0.6rem 0.75rem;color:var(--text-primary);font-family:inherit;font-size:0.9rem;outline:none;"></div>
      <div><label style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:0.3rem;">Category</label>
        <select id="new-clue-cat" class="filter-select" style="width:100%;">${categories.map(c=>`<option>${c}</option>`).join('')}</select></div>
      <div><label style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:0.3rem;">Description</label>
        <textarea id="new-clue-desc" placeholder="Describe the clue, rumor, or lead..." style="width:100%;height:80px;background:var(--bg-panel);border:1px solid var(--border);border-radius:8px;padding:0.75rem;color:var(--text-primary);font-family:'Crimson Pro',serif;font-size:0.95rem;resize:vertical;outline:none;"></textarea></div>
      <div style="display:flex;justify-content:flex-end;gap:0.5rem;">
        <button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="handleAddClue()">Add Entry</button>
      </div>
    </div>
  `);
}

async function handleAddClue() {
  const title = document.getElementById('new-clue-title')?.value.trim();
  const category = document.getElementById('new-clue-cat')?.value;
  const description = document.getElementById('new-clue-desc')?.value.trim();
  if (!title) { showToast('Please enter a title.','warn'); return; }
  const newEntry = { id:'mystery-'+Date.now(), title, category, description:description||'', status:'Open', player_notes:'', date_added:new Date().toLocaleDateString(), created_by: getUserId() };
  await upsertMystery(newEntry);
  showToast('Entry added!','success');
  closeModal();
  initMysteryPage();
}

/* ============================================================
   PAGE: SHARED NOTES
   ============================================================ */
const SHARED_SECTIONS = ['Party Notes'];
const ALL_NOTE_SECTIONS = ['Party Notes','NPC Notes','Clues','Theories','Session Reminders','Funny Moments','Questions for DM'];

async function initNotesPage() {
  let activeSection = ALL_NOTE_SECTIONS[0];
  const [partyNotes, privateNotes] = await Promise.all([getPartyNotes(), getPlayerNotes()]);
  const noteCache = { ...privateNotes };
  Object.keys(partyNotes).forEach(k => { noteCache[k] = partyNotes[k]; });

  const sidebar = document.getElementById('notes-sidebar');
  const textarea = document.getElementById('notes-textarea');
  const sectionTitle = document.getElementById('notes-section-title');

  function getSectionKey(s) { return s.toLowerCase().replace(/\s+/g,'-'); }
  function isShared(s) { return SHARED_SECTIONS.includes(s); }

  function loadSection(s) {
    const key = getSectionKey(s);
    if (textarea) textarea.value = noteCache[key]||'';
    if (sectionTitle) {
      sectionTitle.textContent = s;
      const sharedBadge = isShared(s) ? `<span style="font-size:0.68rem;background:rgba(72,184,120,0.1);color:#78d898;border:1px solid #256840;padding:0.1rem 0.4rem;border-radius:999px;margin-left:0.5rem;">shared</span>` : `<span style="font-size:0.68rem;background:rgba(100,100,200,0.1);color:#9090d8;border:1px solid #404080;padding:0.1rem 0.4rem;border-radius:999px;margin-left:0.5rem;">private</span>`;
      sectionTitle.innerHTML = s + sharedBadge;
    }
    activeSection = s;
    renderSidebar();
  }

  async function saveCurrentSection() {
    const key = getSectionKey(activeSection);
    const content = textarea?.value||'';
    noteCache[key] = content;
    if (isShared(activeSection)) await savePartyNote(key, content);
    else await savePlayerNote(key, content);
    showToast('Saved!','success');
  }

  function renderSidebar() {
    if (!sidebar) return;
    const icons = {'Party Notes':'🧙','NPC Notes':'👥','Clues':'🔍','Theories':'💡','Session Reminders':'📌','Funny Moments':'😄','Questions for DM':'❓'};
    sidebar.innerHTML = ALL_NOTE_SECTIONS.map(s=>`
      <div class="notes-sidebar-item ${s===activeSection?'active':''}" data-section="${s}" role="button" tabindex="0">
        <span>${icons[s]||'📝'}</span> ${s}
        ${isShared(s)?`<span style="font-size:0.6rem;color:#78d898;margin-left:auto;">⟳</span>`:''}
      </div>`).join('');
    sidebar.querySelectorAll('.notes-sidebar-item').forEach(item=>{
      item.addEventListener('click',()=>loadSection(item.dataset.section));
    });
  }

  let saveTimer;
  textarea?.addEventListener('input', ()=>{
    clearTimeout(saveTimer);
    noteCache[getSectionKey(activeSection)] = textarea.value;
    saveTimer = setTimeout(saveCurrentSection, 1500);
  });

  document.getElementById('notes-save-btn')?.addEventListener('click', saveCurrentSection);

  document.getElementById('notes-export-btn')?.addEventListener('click',()=>{
    const blob = new Blob([JSON.stringify(noteCache,null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='strixhaven-notes.json';a.click();
    showToast('Notes exported!','success');
  });

  document.getElementById('notes-import-btn')?.addEventListener('click',()=>{
    const input=document.createElement('input');input.type='file';input.accept='.json';
    input.onchange=e=>{
      const file=e.target.files[0];if(!file)return;
      const reader=new FileReader();
      reader.onload=async ev=>{
        try {
          const data=JSON.parse(ev.target.result);
          for (const [k,v] of Object.entries(data)) {
            const section = ALL_NOTE_SECTIONS.find(s=>getSectionKey(s)===k);
            if (section && isShared(section)) await savePartyNote(k, v);
            else if (section) await savePlayerNote(k, v);
            noteCache[k]=v;
          }
          loadSection(activeSection);
          showToast('Notes imported!','success');
        } catch { showToast('Invalid JSON.','error'); }
      };
      reader.readAsText(file);
    };
    input.click();
  });

  renderSidebar();
  loadSection(activeSection);
}

/* ============================================================
   PAGE: COLLEGES
   ============================================================ */
async function initCollegesPage() {
  const colleges = await fetchData('colleges.json');
  const grid = document.getElementById('colleges-grid');
  if (!grid) return;
  grid.innerHTML = colleges.map(c=>collegeCard(c)).join('');
  grid.querySelectorAll('.college-card').forEach(card=>{
    const handler=()=>{const c=colleges.find(x=>x.id===card.dataset.id);if(c)openCollegeModal(c);};
    card.addEventListener('click',handler);
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')handler();});
  });
}

function collegeCard(c) {
  return `
    <div class="card college-card college-${c.id}" data-id="${c.id}" role="button" tabindex="0" style="cursor:pointer;border-color:${c.color}30;">
      <div class="college-header">
        <div class="college-emblem">${c.emblem}</div>
        <div class="college-name" style="color:${c.colorLight};">${c.name}</div>
        <div class="college-tagline">"${c.tagline}"</div>
      </div>
      <div class="college-body">
        <div class="college-section"><div class="college-section-label">Focus</div><p>${c.magical_focus}</p></div>
        <div class="college-section"><div class="college-section-label">Campus Vibe</div><p>${c.campus_vibe}</p></div>
      </div>
    </div>`;
}

function openCollegeModal(c) {
  const stereotypes = c.student_stereotypes?.map(s=>`<li style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.3rem;">• ${s}</li>`).join('')||'';
  openModal(`
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.25rem;">
      <div style="font-size:3rem;">${c.emblem}</div>
      <div>
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.12em;color:${c.colorLight};margin-bottom:0.25rem;">${c.name} College</div>
        <h2 style="color:${c.colorLight};">"${c.tagline}"</h2>
      </div>
    </div>
    <p style="color:var(--text-secondary);margin-bottom:1.25rem;font-family:'Crimson Pro',serif;font-size:1.05rem;line-height:1.8;">${c.philosophy}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
      <div><div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:0.5rem;">Aesthetic</div><p style="font-size:0.85rem;">${c.aesthetic}</p></div>
      <div><div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:0.5rem;">Magic Focus</div><p style="font-size:0.85rem;">${c.magical_focus}</p></div>
    </div>
    <div><div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:0.5rem;">You Might Be ${c.name} If...</div><ul style="list-style:none;">${stereotypes}</ul></div>
  `);
}

/* ============================================================
   PAGE: LOCATIONS
   ============================================================ */
async function initLocationsPage() {
  const locations = await fetchData('locations.json');
  let filtered=[...locations], activeTag='all', searchQuery='';
  const grid=document.getElementById('locations-grid'), count=document.getElementById('loc-count');

  function render() {
    if (!grid) return;
    if (!filtered.length){grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🗺️</div><p>No locations found.</p></div>`;return;}
    if (count) count.textContent=filtered.length;
    grid.innerHTML=filtered.map(loc=>locationCard(loc)).join('');
    grid.querySelectorAll('.location-card').forEach(card=>{
      const handler=()=>{const l=locations.find(x=>x.id===card.dataset.id);if(l)openLocationModal(l);};
      card.addEventListener('click',handler);
      card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')handler();});
    });
  }

  function applyFilters() {
    filtered=locations.filter(loc=>{
      const mt=activeTag==='all'||loc.tags?.some(t=>t.toLowerCase()===activeTag.toLowerCase());
      const ms=!searchQuery||['name','description','vibe','region'].some(f=>(loc[f]||'').toLowerCase().includes(searchQuery.toLowerCase()));
      return mt&&ms;
    });
    render();
  }

  document.getElementById('loc-search')?.addEventListener('input',function(){searchQuery=this.value;applyFilters();});
  document.querySelectorAll('.loc-filter-btn').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.loc-filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');activeTag=btn.dataset.tag||'all';applyFilters();
  }));
  render();
}

function locationCard(loc) {
  const regionColors={Lorehold:'var(--lorehold)',Prismari:'var(--prismari)',Quandrix:'var(--quandrix)',Silverquill:'var(--silverquill)',Witherbloom:'var(--witherbloom)','Central Campus':'var(--gold)'};
  const imgHtml = loc.image
    ? `<div style="width:100%;height:160px;overflow:hidden;border-radius:var(--radius) var(--radius) 0 0;margin:-1.25rem -1.25rem 1rem -1.25rem;width:calc(100% + 2.5rem);"><img src="assets/images/locations/${loc.image}" alt="${loc.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;"></div>`
    : '';
  return `
    <div class="card location-card" data-id="${loc.id}" role="button" tabindex="0" style="cursor:pointer;">
      ${imgHtml}
      <div class="location-region" style="color:${regionColors[loc.region]||'var(--text-muted)'};">${loc.region}</div>
      <div class="card-header" style="margin-bottom:0.5rem;">
        <div style="font-size:2rem;">${loc.emoji}</div>
        <div><div class="card-title">${loc.name}</div></div>
      </div>
      <div class="location-vibe">${loc.vibe}</div>
      <div class="card-body" style="margin-top:0.4rem;">${loc.description.slice(0,120)}...</div>
      <div class="card-footer" style="margin-top:0.75rem;">${loc.tags?.slice(0,3).map(t=>`<span class="tag">${t}</span>`).join('')||''}</div>
    </div>`;
}

async function openLocationModal(loc) {
  const saved = await getPlayerNotes();
  const key = 'loc_'+loc.id;
  const npcs=loc.commonNPCs?.map(n=>`<span class="tag">${n}</span>`).join('')||'';
  const activities=loc.activities?.map(a=>`<li style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.3rem;">• ${a}</li>`).join('')||'';
  const modalImgSrc = loc.image && loc.image !== loc.map ? loc.image : null;
  const modalImgHtml = modalImgSrc
    ? `<div style="width:calc(100% + 3rem);margin:-1.5rem -1.5rem 1.25rem -1.5rem;height:220px;overflow:hidden;border-radius:var(--radius-xl) var(--radius-xl) 0 0;"><img src="assets/images/locations/${modalImgSrc}" alt="${loc.name}" style="width:100%;height:100%;object-fit:cover;display:block;"></div>`
    : '';
  window._locMapAreas = loc.mapAreas || [];
  let mapHtml = '';
  if (loc.map) {
    const hotspots = (loc.mapAreas||[]).filter(a=>a.x!=null).map((a,i)=>{
      const tipPos = a.y > 18 ? 'bottom:calc(100% + 5px);top:auto' : 'top:calc(100% + 5px);bottom:auto';
      const cursor = a.desc ? 'pointer' : 'default';
      return `<div style="position:absolute;left:${a.x}%;top:${a.y}%;transform:translate(-50%,-50%);width:22px;height:22px;background:rgba(155,105,25,0.88);border-radius:50%;border:1.5px solid rgba(255,255,255,0.8);display:flex;align-items:center;justify-content:center;font-size:0.5rem;font-weight:700;color:#fff;cursor:${cursor};z-index:5;line-height:1;transition:transform 0.1s,background 0.1s;" onmouseenter="this.style.background='rgba(210,160,50,0.95)';this.style.transform='translate(-50%,-50%) scale(1.3)';this.querySelector('span').style.opacity='1'" onmouseleave="this.style.background='rgba(155,105,25,0.88)';this.style.transform='translate(-50%,-50%)';this.querySelector('span').style.opacity='0'" onclick="showMapArea(${i})">${a.key}<span style="position:absolute;${tipPos};left:50%;transform:translateX(-50%);background:rgba(15,10,5,0.93);color:#f5edd6;padding:3px 8px;border-radius:4px;font-size:0.68rem;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity 0.15s;font-weight:400;z-index:10;border:1px solid rgba(255,255,255,0.12);">${a.key}: ${a.name}</span></div>`;
    }).join('');
    mapHtml = `<div style="margin-bottom:1rem;"><div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:0.5rem;">📍 Campus Map</div><div style="position:relative;display:block;"><img src="assets/images/locations/${loc.map}" alt="${loc.name} campus map" style="width:100%;border-radius:8px;border:1px solid var(--border);display:block;">${hotspots}</div><div id="map-area-info" style="display:none;margin-top:0.6rem;background:var(--bg-panel);border:1px solid var(--border);border-radius:8px;padding:0.75rem 1rem 0.75rem 1rem;"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;"><div id="map-area-info-content" style="flex:1;"></div><button onclick="document.getElementById('map-area-info').style.display='none'" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1.1rem;line-height:1;padding:0;flex-shrink:0;">×</button></div></div></div>`;
  }
  openModal(`
    ${modalImgHtml}
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;">
      <div style="font-size:2.5rem;">${loc.emoji}</div>
      <div>
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:0.2rem;">${loc.region}</div>
        <h2>${loc.name}</h2><div class="location-vibe">${loc.vibe}</div>
      </div>
    </div>
    <p style="color:var(--text-secondary);margin-bottom:1rem;">${loc.description}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
      <div><div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:0.5rem;">Common Faces</div><div style="display:flex;flex-wrap:wrap;gap:0.3rem;">${npcs}</div></div>
      <div><div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:0.5rem;">Activities</div><ul style="list-style:none;">${activities}</ul></div>
    </div>
    ${mapHtml}
    <div style="border-top:1px solid var(--border);padding-top:1rem;">
      <label style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:0.5rem;">Your Notes</label>
      <textarea id="loc-notes" style="width:100%;height:80px;background:var(--bg-panel);border:1px solid var(--border);border-radius:8px;padding:0.75rem;color:var(--text-primary);font-family:'Crimson Pro',serif;font-size:0.95rem;resize:vertical;outline:none;">${saved[key]||''}</textarea>
      <div style="display:flex;justify-content:flex-end;margin-top:0.5rem;">
        <button class="btn btn-primary btn-sm" onclick="saveLocationNotes('${loc.id}')">Save Notes</button>
      </div>
    </div>
  `);
}

function showMapArea(idx) {
  const a = (window._locMapAreas||[])[idx];
  if (!a) return;
  const info = document.getElementById('map-area-info');
  const content = document.getElementById('map-area-info-content');
  if (!info || !content) return;
  content.innerHTML = `<div style="font-size:0.68rem;font-weight:700;letter-spacing:0.05em;color:var(--gold,#c9a84c);margin-bottom:0.15rem;">${a.key}</div><div style="font-weight:600;font-size:0.9rem;margin-bottom:${a.desc?'0.4rem':'0'}">${a.name}</div>${a.desc?`<div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.55;">${a.desc}</div>`:''}`;
  info.style.display = 'block';
}

async function saveLocationNotes(id) {
  const content = document.getElementById('loc-notes')?.value||'';
  await savePlayerNote('loc_'+id, content);
  showToast('Notes saved!','success');
  closeModal();
}

/* ============================================================
   PAGE: CLUBS
   ============================================================ */
async function initClubsPage() {
  const [clubs, joinedIds] = await Promise.all([fetchData('clubs.json'), getPlayerClubs()]);
  let filtered=[...clubs], activeTag='all', searchQuery='';
  const grid=document.getElementById('clubs-grid');

  function render() {
    if (!grid) return;
    if (!filtered.length){grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🎭</div><p>No clubs found.</p></div>`;return;}
    const currentJoined = [...joinedIds];
    grid.innerHTML=filtered.map(c=>clubCard(c,currentJoined.includes(c.id))).join('');
    grid.querySelectorAll('.club-card').forEach(card=>{
      const handler=()=>{const c=clubs.find(x=>x.id===card.dataset.id);if(c)openClubModal(c,joinedIds.includes(c.id));};
      card.addEventListener('click',handler);
      card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')handler();});
    });
  }

  function applyFilters() {
    filtered=clubs.filter(c=>{
      const mt=activeTag==='all'||c.tags?.some(t=>t.toLowerCase()===activeTag.toLowerCase());
      const ms=!searchQuery||[c.name,c.vibe,c.description].some(f=>(f||'').toLowerCase().includes(searchQuery.toLowerCase()));
      return mt&&ms;
    });
    render();
  }

  document.getElementById('club-search')?.addEventListener('input',function(){searchQuery=this.value;applyFilters();});
  document.querySelectorAll('.club-filter-btn').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.club-filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');activeTag=btn.dataset.tag||'all';applyFilters();
  }));
  render();
}

function clubCard(c,joined) {
  return `
    <div class="card club-card" data-id="${c.id}" role="button" tabindex="0" style="cursor:pointer;">
      <div class="club-icon">${c.emoji}</div>
      <div class="card-title" style="margin-bottom:0.4rem;">${c.name}</div>
      <div style="font-size:0.8rem;font-style:italic;color:var(--text-muted);margin-bottom:0.75rem;">${c.vibe}</div>
      <div class="card-body">${c.description.slice(0,120)}...</div>
      <div class="card-footer">${joined?'<span class="badge badge-positive">Joined</span>':(c.recruiting?'<span class="badge badge-gold">Recruiting</span>':'')}${c.tags?.slice(0,2).map(t=>`<span class="tag">${t}</span>`).join('')||''}</div>
    </div>`;
}

function openClubModal(c,joined) {
  const npcs=c.relatedNPCs?.map(n=>`<span class="tag">${n}</span>`).join('')||'<span class="text-muted" style="font-size:0.85rem;">Various</span>';
  const events=c.eventIdeas?.map(e=>`<li style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.3rem;">• ${e}</li>`).join('')||'';
  openModal(`
    <div style="text-align:center;margin-bottom:1.25rem;">
      <div style="font-size:3rem;margin-bottom:0.5rem;">${c.emoji}</div>
      <h2>${c.name}</h2><p style="font-style:italic;color:var(--text-muted);margin-top:0.3rem;">${c.vibe}</p>
    </div>
    <p style="color:var(--text-secondary);margin-bottom:1.25rem;font-family:'Crimson Pro',serif;font-size:1.05rem;line-height:1.8;">${c.description}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
      <div><div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:0.5rem;">Known Members</div><div style="display:flex;flex-wrap:wrap;gap:0.3rem;">${npcs}</div></div>
      <div><div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:0.5rem;">Meeting Style</div><p style="font-size:0.85rem;">${c.meetingStyle}</p></div>
    </div>
    <div style="margin-bottom:1rem;background:rgba(200,169,90,0.07);border:1px solid var(--gold-dim);border-radius:8px;padding:0.75rem;">
      <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--gold);margin-bottom:0.3rem;">Social Hook</div>
      <p style="font-size:0.88rem;font-style:italic;">${c.socialHooks}</p>
    </div>
    <div style="display:flex;justify-content:center;margin-top:1rem;">
      <button class="btn ${joined?'btn-secondary':'btn-primary'}" onclick="handleToggleClub('${c.id}',${joined})">
        ${joined?'✓ Member — Click to leave':'Join This Club'}
      </button>
    </div>
  `);
}

async function handleToggleClub(id,currently) {
  await togglePlayerClub(id,currently);
  showToast(currently?'Left the club.':'Joined!',currently?'info':'success');
  closeModal();
  initClubsPage();
}

/* ============================================================
   PAGE: JOBS
   ============================================================ */
async function initJobsPage() {
  const [jobs, myJobId] = await Promise.all([fetchData('jobs.json'), getPlayerJob()]);
  const grid=document.getElementById('jobs-grid');
  if (!grid) return;
  grid.innerHTML=jobs.map(j=>jobListingHtml(j,myJobId===j.id)).join('');
  grid.querySelectorAll('.job-listing').forEach(item=>{
    const handler=()=>{const j=jobs.find(x=>x.id===item.dataset.id);if(j)openJobModal(j,myJobId===j.id);};
    item.addEventListener('click',handler);
    item.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')handler();});
  });
  updateJobDisplay(jobs, myJobId);
}

function jobListingHtml(j,isMyJob) {
  return `
    <div class="job-listing" data-id="${j.id}" role="button" tabindex="0">
      <div class="job-icon">${j.emoji}</div>
      <div class="job-info">
        <div class="job-title">${j.name}</div>
        <div class="job-location">📍 ${j.location}</div>
        <div class="job-desc">${j.description.slice(0,100)}...</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.4rem;min-width:90px;">
        ${isMyJob?'<span class="badge badge-positive">My Job</span>':''}
        ${j.tags?.slice(0,1).map(t=>`<span class="tag">${t}</span>`).join('')||''}
      </div>
    </div>`;
}

function openJobModal(j,isMyJob) {
  const coworkers=j.commonCoworkers?.map(n=>`<span class="tag">${n}</span>`).join('')||'<span style="font-size:0.85rem;color:var(--text-muted);">Various</span>';
  const resp=j.responsibilities?.map(r=>`<li style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.25rem;">• ${r}</li>`).join('')||'';
  openModal(`
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;">
      <div style="font-size:2.5rem;">${j.emoji}</div>
      <div><h2 style="margin-bottom:0.2rem;">${j.name}</h2><p style="color:var(--text-muted);font-size:0.85rem;">📍 ${j.location}</p></div>
    </div>
    <p style="color:var(--text-secondary);margin-bottom:1.25rem;">${j.description}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
      <div><div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:0.5rem;">Responsibilities</div><ul style="list-style:none;">${resp}</ul></div>
      <div><div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:0.5rem;">Coworkers</div><div style="display:flex;flex-wrap:wrap;gap:0.3rem;">${coworkers}</div></div>
    </div>
    <div style="background:rgba(200,169,90,0.07);border:1px solid var(--gold-dim);border-radius:8px;padding:0.75rem;margin-bottom:1rem;">
      <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--gold);margin-bottom:0.3rem;">Roleplay Opportunities</div>
      <p style="font-size:0.85rem;">${j.roleplaying_hooks}</p>
    </div>
    <div style="display:flex;justify-content:center;margin-top:1rem;">
      <button class="btn ${isMyJob?'btn-secondary':'btn-primary'}" onclick="handleToggleJob('${j.id}',${isMyJob})">
        ${isMyJob?'Quit This Job':'Take This Job'}
      </button>
    </div>
  `);
}

async function handleToggleJob(id,currently) {
  await setPlayerJob(currently ? null : id);
  showToast(currently?'Job vacated.':'Job taken! Good luck.',currently?'info':'success');
  closeModal();
  initJobsPage();
}

function updateJobDisplay(jobs, myJobId) {
  const el=document.getElementById('my-job-display');
  if (!el) return;
  if (myJobId) { const j=jobs?.find(x=>x.id===myJobId); el.textContent=j?j.name+' at '+j.location:'None'; }
  else el.textContent='None — click a listing below to take it';
}

/* ============================================================
   PAGE: DOCUMENTS
   ============================================================ */
async function initDocumentsPage() {
  const docs=await fetchData('documents.json');
  let filtered=[...docs], activeTag='all', searchQuery='';
  const grid=document.getElementById('docs-grid');

  function render() {
    if (!grid) return;
    if (!filtered.length){grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📜</div><p>No documents found.</p></div>`;return;}
    grid.innerHTML=filtered.map(d=>docCard(d)).join('');
    grid.querySelectorAll('.document-card').forEach(card=>{
      const handler=()=>{const d=docs.find(x=>x.id===card.dataset.id);if(d)openDocModal(d);};
      card.addEventListener('click',handler);
      card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')handler();});
    });
  }

  function applyFilters() {
    filtered=docs.filter(d=>{
      const mt=activeTag==='all'||d.tags?.some(t=>t.toLowerCase()===activeTag.toLowerCase());
      const ms=!searchQuery||[d.title,d.type].some(f=>(f||'').toLowerCase().includes(searchQuery.toLowerCase()));
      return mt&&ms;
    });
    render();
  }

  document.getElementById('doc-search')?.addEventListener('input',function(){searchQuery=this.value;applyFilters();});
  document.querySelectorAll('.doc-filter-btn').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.doc-filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');activeTag=btn.dataset.tag||'all';applyFilters();
  }));
  render();
}

function docCard(d) {
  return `
    <div class="card document-card" data-id="${d.id}" role="button" tabindex="0">
      <div class="doc-icon">${d.emoji}</div>
      <div class="doc-type">${d.type}</div>
      <div class="card-title">${d.title}</div>
      <div class="card-footer" style="margin-top:0.75rem;">${d.tags?.slice(0,3).map(t=>`<span class="tag">${t}</span>`).join('')||''}</div>
    </div>`;
}

function openDocModal(d) {
  openModal(`
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.25rem;">
      <div style="font-size:2.5rem;">${d.emoji}</div>
      <div><div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--gold);margin-bottom:0.2rem;">${d.type}</div><h2>${d.title}</h2></div>
    </div>
    <div style="font-family:'Crimson Pro',serif;font-size:1rem;line-height:1.9;color:var(--parchment-dark);background:#1a1810;border:1px solid #3a3520;border-radius:8px;padding:1.5rem;white-space:pre-wrap;">${d.content}</div>
  `);
}

/* ============================================================
   PAGE: HOME
   ============================================================ */
async function initHomePage() {
  const [students, locations] = await Promise.all([fetchData('students.json'), fetchData('locations.json')]);
  const rumors = [
    "Greta Gorunn has reportedly issued an open challenge to anyone brave enough to join her on an unauthorized dig.",
    "The Firejolt Café's latest seasonal drink allegedly changes color based on the drinker's emotional state.",
    "A spirit echo was seen wandering outside the Lorehold campus last night, humming something no one recognizes.",
    "Quentillius has circulated a three-page artistic manifesto. Critiques are being accepted through an official process.",
    "The Biblioplex closed an entire reading room this week for 'preventative maintenance.' The locks look new.",
    "Zanther set his own notes on fire during a particularly exciting study session. They were later described as 'expressive.'",
    "Someone left a bouquet of Witherbloom-grown flowers outside three different dormitory rooms. No note.",
    "Rubina Larkingdale is working on something for the Star and being extremely quiet about it."
  ];

  const rumor=document.getElementById('campus-rumor');
  if (rumor) rumor.textContent=rumors[Math.floor(Math.random()*rumors.length)];
  let idx=0;
  document.getElementById('rumor-refresh')?.addEventListener('click',()=>{
    idx=(idx+1)%rumors.length;
    if(rumor){rumor.style.opacity='0';setTimeout(()=>{rumor.textContent=rumors[idx];rumor.style.opacity='1';},200);}
  });
  if(rumor)rumor.style.transition='opacity 0.2s';

  const featuredStudents=document.getElementById('featured-students');
  if(featuredStudents&&students.length){
    const picks=students.sort(()=>0.5-Math.random()).slice(0,3);
    featuredStudents.innerHTML=picks.map(s=>`
      <a href="students.html" class="card card-sm" style="text-decoration:none;display:flex;align-items:center;gap:0.75rem;">
        <div class="card-avatar">${s.emoji}</div>
        <div><div class="card-title" style="font-size:0.88rem;">${s.name}</div><div style="font-size:0.75rem;color:var(--text-muted);">${s.college}</div></div>
      </a>`).join('');
  }

  const featuredLocs=document.getElementById('featured-locations');
  if(featuredLocs&&locations.length){
    const picks=locations.sort(()=>0.5-Math.random()).slice(0,3);
    featuredLocs.innerHTML=picks.map(l=>`
      <a href="locations.html" class="card card-sm" style="text-decoration:none;display:flex;align-items:center;gap:0.75rem;">
        <div style="font-size:1.6rem;">${l.emoji}</div>
        <div><div class="card-title" style="font-size:0.88rem;">${l.name}</div><div style="font-size:0.75rem;color:var(--text-muted);">${l.region}</div></div>
      </a>`).join('');
  }
}
