/* =============================================================
   STRIXHAVEN STUDENT PORTAL — MAIN JAVASCRIPT
   ============================================================= */

/* --- NAV --- */
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

/* --- COLLEGE BADGE HELPER --- */
function collegeBadge(college) {
  if (!college) return '';
  const cls = 'badge badge-college-' + college.toLowerCase();
  const icons = { Lorehold:'🏛️', Prismari:'🎨', Quandrix:'🔮', Silverquill:'✒️', Witherbloom:'🌿' };
  return `<span class="${cls}">${icons[college] || ''} ${college}</span>`;
}

function relStatusBadge(status) {
  const map = {
    'Unknown': 'rel-unknown',
    'Acquaintance': 'rel-acquaintance',
    'Friend': 'rel-friend',
    'Beloved': 'rel-beloved',
    'Rival': 'rel-rival',
    'Suspicious': 'rel-suspicious',
    'Trusted': 'rel-trusted',
    'Positive': 'rel-friend',
    'Tense': 'rel-suspicious',
  };
  const cls = map[status] || 'rel-unknown';
  return `<span class="badge ${cls}">${status || 'Unknown'}</span>`;
}

/* --- FETCH JSON DATA --- */
async function fetchData(file) {
  try {
    const r = await fetch(`data/${file}`);
    if (!r.ok) throw new Error(r.statusText);
    return await r.json();
  } catch (e) {
    console.error('Failed to load', file, e);
    return [];
  }
}

/* --- SEARCH / FILTER UTILITIES --- */
function filterItems(items, query, fields) {
  if (!query.trim()) return items;
  const q = query.toLowerCase();
  return items.filter(item =>
    fields.some(f => (item[f] || '').toString().toLowerCase().includes(q))
  );
}

function filterByTag(items, tag, field) {
  if (!tag || tag === 'all') return items;
  return items.filter(item => {
    const val = item[field];
    if (Array.isArray(val)) return val.some(v => v.toLowerCase() === tag.toLowerCase());
    return (val || '').toLowerCase() === tag.toLowerCase();
  });
}

function setupSearch(inputId, callback) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('input', () => callback(input.value));
}

function setupFilterBtns(containerSelector, callback) {
  const btns = document.querySelectorAll(containerSelector + ' .filter-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      callback(btn.dataset.value || btn.textContent.trim());
    });
  });
}

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
  if (overlay) {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
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
  const toast = document.createElement('div');
  const colors = { info: '#2ab8c8', success: '#48b878', warn: '#c8a95a', error: '#e07070' };
  toast.style.cssText = `background:var(--bg-panel);border:1px solid ${colors[type]||colors.info};color:var(--text-primary);padding:0.75rem 1.25rem;border-radius:8px;font-size:0.85rem;box-shadow:0 4px 16px rgba(0,0,0,0.4);max-width:280px;`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.4s'; setTimeout(() => toast.remove(), 400); }, 2500);
}

/* --- LOCAL STORAGE HELPERS --- */
const LS = {
  get(key, def = null) {
    try { return JSON.parse(localStorage.getItem('strix_' + key)) ?? def; } catch { return def; }
  },
  set(key, val) {
    try { localStorage.setItem('strix_' + key, JSON.stringify(val)); } catch {}
  }
};

/* ============================================================
   PAGE: STUDENTS & FACULTY
   ============================================================ */
async function initStudentsPage() {
  const [students, faculty] = await Promise.all([fetchData('students.json'), fetchData('faculty.json')]);
  const all = [...students, ...faculty];
  let filtered = [...all];
  let activeCollege = 'all';
  let activeType = 'all';
  let searchQuery = '';

  const grid = document.getElementById('npc-grid');
  const count = document.getElementById('npc-count');

  function render() {
    let items = filtered;
    if (!grid) return;
    if (!items.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔍</div><p>No results found. Try adjusting your filters.</p></div>`;
      if (count) count.textContent = '0';
      return;
    }
    if (count) count.textContent = items.length;
    grid.innerHTML = items.map(npc => npcCard(npc)).join('');
    grid.querySelectorAll('.npc-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const npc = all.find(n => n.id === id);
        if (npc) openNpcModal(npc);
      });
    });
  }

  function applyFilters() {
    filtered = all.filter(npc => {
      const matchCollege = activeCollege === 'all' || (npc.college || '').toLowerCase() === activeCollege.toLowerCase();
      const matchType = activeType === 'all' || npc.type === activeType;
      const matchSearch = !searchQuery || ['name','personality','vibe','college'].some(f => (npc[f]||'').toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCollege && matchType && matchSearch;
    });
    render();
  }

  setupSearch('npc-search', q => { searchQuery = q; applyFilters(); });
  document.querySelectorAll('.college-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.college-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCollege = btn.dataset.college || 'all';
      applyFilters();
    });
  });
  document.querySelectorAll('.type-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeType = btn.dataset.type || 'all';
      applyFilters();
    });
  });

  render();
}

function npcCard(npc) {
  const relStorage = LS.get('relationships', {});
  const relStatus = relStorage[npc.id]?.status || npc.relationshipStatus || 'Unknown';
  return `
    <div class="card npc-card card-clickable" data-id="${npc.id}" data-college="${npc.college || ''}" role="button" tabindex="0" aria-label="View ${npc.name}">
      <div class="card-header">
        <div class="card-avatar">${npc.emoji || '👤'}</div>
        <div>
          <div class="card-title">${npc.name}</div>
          <div class="card-subtitle">${npc.race || ''} ${npc.role ? '· ' + npc.role : ''}</div>
        </div>
      </div>
      <div class="card-body" style="margin-bottom:0.5rem;">
        ${npc.vibe ? `<em style="font-size:0.82rem;color:var(--text-muted);">${npc.vibe}</em>` : ''}
      </div>
      <div class="card-footer">
        ${npc.college ? collegeBadge(npc.college) : ''}
        ${relStatusBadge(relStatus)}
        ${npc.type === 'faculty' ? '<span class="badge badge-gold">Faculty</span>' : ''}
      </div>
    </div>`;
}

function openNpcModal(npc) {
  const relStorage = LS.get('relationships', {});
  const savedRel = relStorage[npc.id] || {};
  const currentStatus = savedRel.status || npc.relationshipStatus || 'Unknown';
  const bondScore = savedRel.bondScore ?? npc.bondScore ?? 0;
  const notes = savedRel.notes || '';
  const isFavorite = savedRel.isFavorite || false;

  const statuses = ['Unknown','Acquaintance','Friend','Beloved','Rival','Suspicious','Trusted'];
  const statusOptions = statuses.map(s => `<option value="${s}" ${s===currentStatus?'selected':''}>${s}</option>`).join('');

  const extras = npc.extracurriculars?.length ? `<p><strong>Clubs:</strong> ${npc.extracurriculars.join(', ')}</p>` : '';
  const job = npc.job ? `<p><strong>Job:</strong> ${npc.job}</p>` : '';
  const locations = npc.favoriteLocations?.length ? `<p><strong>Haunts:</strong> ${npc.favoriteLocations.join(', ')}</p>` : '';
  const rumors = npc.rumors ? `<div style="background:rgba(200,169,90,0.07);border:1px solid var(--gold-dim);border-radius:8px;padding:0.75rem;margin-top:1rem;"><p style="font-size:0.82rem;color:var(--gold-light);">💬 Campus Whisper: <em>${npc.rumors}</em></p></div>` : '';

  openModal(`
    <div style="display:flex;align-items:flex-start;gap:1rem;margin-bottom:1.25rem;">
      <div class="card-avatar" style="width:60px;height:60px;font-size:2rem;">${npc.emoji || '👤'}</div>
      <div>
        <h2 style="font-size:1.3rem;margin-bottom:0.25rem;">${npc.name}</h2>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.3rem;">
          ${npc.college ? collegeBadge(npc.college) : ''}
          ${npc.type === 'faculty' ? '<span class="badge badge-gold">Faculty</span>' : ''}
          <span class="badge badge-neutral">${npc.race || ''}</span>
        </div>
      </div>
    </div>
    <p style="color:var(--text-secondary);margin-bottom:1rem;">${npc.personality || npc.playerSummary || ''}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:1rem;font-size:0.85rem;">
      ${extras}${job}${locations}
    </div>
    ${npc.bondBoon ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1rem;">
      <div style="background:rgba(72,184,120,0.06);border:1px solid #256840;border-radius:8px;padding:0.75rem;">
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:#78d898;margin-bottom:0.3rem;">⬆ Bond Boon</div>
        <p style="font-size:0.83rem;">${npc.bondBoon}</p>
      </div>
      <div style="background:rgba(220,80,80,0.06);border:1px solid #903030;border-radius:8px;padding:0.75rem;">
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:#f09090;margin-bottom:0.3rem;">⬇ Bond Bane</div>
        <p style="font-size:0.83rem;">${npc.bondBane}</p>
      </div>
    </div>` : ''}
    ${rumors}
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
      <textarea id="modal-notes" placeholder="Your notes about this person..." style="width:100%;height:80px;background:var(--bg-panel);border:1px solid var(--border);border-radius:8px;padding:0.75rem;color:var(--text-primary);font-family:'Crimson Pro',serif;font-size:0.95rem;resize:vertical;outline:none;">${notes}</textarea>
      <div style="display:flex;justify-content:flex-end;gap:0.5rem;margin-top:0.5rem;">
        <button class="btn btn-primary btn-sm" onclick="saveNpcRelationship('${npc.id}')">Save</button>
      </div>
    </div>
  `);

  document.getElementById('modal-bond-score')?.addEventListener('input', function() {
    document.getElementById('modal-bond-display').textContent = this.value;
  });
}

function saveNpcRelationship(id) {
  const status = document.getElementById('modal-rel-status')?.value;
  const bondScore = parseInt(document.getElementById('modal-bond-score')?.value || '0');
  const notes = document.getElementById('modal-notes')?.value || '';
  const relStorage = LS.get('relationships', {});
  relStorage[id] = { ...relStorage[id], status, bondScore, notes };
  LS.set('relationships', relStorage);
  showToast('Relationship saved!', 'success');
  closeModal();
  if (typeof initStudentsPage === 'function' && document.getElementById('npc-grid')) {
    initStudentsPage();
  }
}

function toggleFavoriteFromModal(id) {
  const relStorage = LS.get('relationships', {});
  const current = !!(relStorage[id]?.isFavorite);
  relStorage[id] = { ...relStorage[id], isFavorite: !current };
  LS.set('relationships', relStorage);
  const btn = document.getElementById('modal-fav-btn');
  if (btn) btn.classList.toggle('active', !current);
}

/* ============================================================
   PAGE: SHARED NOTES
   ============================================================ */
function initNotesPage() {
  const sections = ['Party Notes','NPC Notes','Clues','Theories','Session Reminders','Funny Moments','Questions for DM'];
  let activeSection = sections[0];
  const sidebar = document.getElementById('notes-sidebar');
  const textarea = document.getElementById('notes-textarea');
  const sectionTitle = document.getElementById('notes-section-title');
  const storageKey = 'notes';

  function getSectionKey(s) { return s.toLowerCase().replace(/\s+/g, '-'); }

  function loadSection(s) {
    const notes = LS.get(storageKey, {});
    if (textarea) textarea.value = notes[getSectionKey(s)] || '';
    if (sectionTitle) sectionTitle.textContent = s;
    activeSection = s;
    renderSidebar();
  }

  function saveCurrentSection() {
    const notes = LS.get(storageKey, {});
    notes[getSectionKey(activeSection)] = textarea?.value || '';
    LS.set(storageKey, notes);
    showToast('Notes saved!', 'success');
  }

  function renderSidebar() {
    if (!sidebar) return;
    const icons = {'Party Notes':'🧙','NPC Notes':'👥','Clues':'🔍','Theories':'💡','Session Reminders':'📌','Funny Moments':'😄','Questions for DM':'❓'};
    sidebar.innerHTML = sections.map(s =>
      `<div class="notes-sidebar-item ${s===activeSection?'active':''}" data-section="${s}">
        <span>${icons[s]||'📝'}</span> ${s}
      </div>`
    ).join('');
    sidebar.querySelectorAll('.notes-sidebar-item').forEach(item => {
      item.addEventListener('click', () => loadSection(item.dataset.section));
    });
  }

  textarea?.addEventListener('input', () => {
    const notes = LS.get(storageKey, {});
    notes[getSectionKey(activeSection)] = textarea.value;
    LS.set(storageKey, notes);
  });

  document.getElementById('notes-save-btn')?.addEventListener('click', saveCurrentSection);

  document.getElementById('notes-export-btn')?.addEventListener('click', () => {
    const data = LS.get(storageKey, {});
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'strixhaven-notes.json'; a.click();
    showToast('Notes exported!', 'success');
  });

  document.getElementById('notes-import-btn')?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          LS.set(storageKey, data);
          loadSection(activeSection);
          showToast('Notes imported!', 'success');
        } catch { showToast('Invalid JSON file.', 'error'); }
      };
      reader.readAsText(file);
    };
    input.click();
  });

  renderSidebar();
  loadSection(activeSection);
}

/* ============================================================
   PAGE: MYSTERY BOARD
   ============================================================ */
async function initMysteryPage() {
  const mysteries = await fetchData('mysteries.json');
  const saved = LS.get('mysteries', null);
  const data = saved || mysteries;
  let filtered = [...data];
  let activeCategory = 'all';

  const grid = document.getElementById('mystery-grid');
  const count = document.getElementById('mystery-count');

  function render() {
    if (!grid) return;
    if (!filtered.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🕵️</div><p>No clues recorded yet. Add your first lead above.</p></div>`;
      return;
    }
    if (count) count.textContent = filtered.length;
    grid.innerHTML = filtered.map(c => clueCard(c)).join('');
    grid.querySelectorAll('.clue-card').forEach(card => {
      card.addEventListener('click', () => openClueModal(card.dataset.id, data));
    });
  }

  function applyFilters() {
    filtered = activeCategory === 'all' ? [...data] : data.filter(c => c.category === activeCategory);
    render();
  }

  document.querySelectorAll('.mystery-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mystery-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.cat || 'all';
      applyFilters();
    });
  });

  document.getElementById('add-clue-btn')?.addEventListener('click', () => openAddClueModal(data));

  render();
}

function clueCard(c) {
  const catClass = 'cat-' + (c.category || 'clue').toLowerCase().replace(/\s+/g, '-');
  const statusColors = { Open:'#2ab8c8', Solved:'#48b878', 'False Lead':'#888' };
  return `
    <div class="card clue-card" data-id="${c.id}" role="button" tabindex="0">
      <div class="clue-category ${catClass}">${c.category}</div>
      <div class="card-title" style="margin-bottom:0.5rem;">${c.title}</div>
      <div class="card-body">${c.description}</div>
      ${c.status ? `<div style="margin-top:0.75rem;"><span class="badge badge-neutral" style="color:${statusColors[c.status]||'var(--text-muted)'};">${c.status}</span></div>` : ''}
    </div>`;
}

function openClueModal(id, data) {
  const clue = data.find(c => c.id === id);
  if (!clue) return;
  const saved = LS.get('mysteries', null);
  const savedClue = (saved || []).find(c => c.id === id) || clue;
  const categories = ['Clue','Rumor','Suspect','Location','Question','Theory','Solved','False Lead'];
  const catOptions = categories.map(c => `<option ${c===savedClue.category?'selected':''}>${c}</option>`).join('');
  const statuses = ['Open','Solved','False Lead'];
  const statOptions = statuses.map(s => `<option ${s===savedClue.status?'selected':''}>${s}</option>`).join('');

  openModal(`
    <h2 style="margin-bottom:0.5rem;">${savedClue.title}</h2>
    <div class="clue-category cat-${(savedClue.category||'clue').toLowerCase().replace(/\s+/g,'-')}" style="margin-bottom:1rem;">${savedClue.category}</div>
    <p style="color:var(--text-secondary);margin-bottom:1.25rem;">${savedClue.description}</p>
    <div style="border-top:1px solid var(--border);padding-top:1rem;">
      <h4 style="font-size:0.85rem;margin-bottom:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;">Update Entry</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem;">
        <div>
          <label style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:0.3rem;">Category</label>
          <select id="clue-cat" class="filter-select" style="width:100%;">${catOptions}</select>
        </div>
        <div>
          <label style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:0.3rem;">Status</label>
          <select id="clue-status" class="filter-select" style="width:100%;">${statOptions}</select>
        </div>
      </div>
      <textarea id="clue-notes" placeholder="Add your notes, connections, theories..." style="width:100%;height:80px;background:var(--bg-panel);border:1px solid var(--border);border-radius:8px;padding:0.75rem;color:var(--text-primary);font-family:'Crimson Pro',serif;font-size:0.95rem;resize:vertical;outline:none;">${savedClue.playerNotes || ''}</textarea>
      <div style="display:flex;justify-content:flex-end;gap:0.5rem;margin-top:0.5rem;">
        <button class="btn btn-primary btn-sm" onclick="saveClue('${id}')">Save</button>
      </div>
    </div>
  `);
}

function saveClue(id) {
  const mysteries = LS.get('mysteries', null) || [];
  const idx = mysteries.findIndex(c => c.id === id);
  const update = {
    category: document.getElementById('clue-cat')?.value,
    status: document.getElementById('clue-status')?.value,
    playerNotes: document.getElementById('clue-notes')?.value || ''
  };
  if (idx >= 0) mysteries[idx] = { ...mysteries[idx], ...update };
  LS.set('mysteries', mysteries);
  showToast('Clue updated!', 'success');
  closeModal();
  initMysteryPage();
}

function openAddClueModal(data) {
  const categories = ['Clue','Rumor','Suspect','Location','Question','Theory'];
  const catOptions = categories.map(c => `<option>${c}</option>`).join('');
  openModal(`
    <h2 style="margin-bottom:1.25rem;">Add New Entry</h2>
    <div style="display:flex;flex-direction:column;gap:0.75rem;">
      <div>
        <label style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:0.3rem;">Title</label>
        <input id="new-clue-title" type="text" placeholder="What is this lead about?" style="width:100%;background:var(--bg-panel);border:1px solid var(--border);border-radius:8px;padding:0.6rem 0.75rem;color:var(--text-primary);font-family:inherit;font-size:0.9rem;outline:none;">
      </div>
      <div>
        <label style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:0.3rem;">Category</label>
        <select id="new-clue-cat" class="filter-select" style="width:100%;">${catOptions}</select>
      </div>
      <div>
        <label style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:0.3rem;">Description</label>
        <textarea id="new-clue-desc" placeholder="Describe the clue, rumor, or lead..." style="width:100%;height:80px;background:var(--bg-panel);border:1px solid var(--border);border-radius:8px;padding:0.75rem;color:var(--text-primary);font-family:'Crimson Pro',serif;font-size:0.95rem;resize:vertical;outline:none;"></textarea>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:0.5rem;margin-top:0.25rem;">
        <button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="addNewClue()">Add Entry</button>
      </div>
    </div>
  `);
}

function addNewClue() {
  const title = document.getElementById('new-clue-title')?.value.trim();
  const category = document.getElementById('new-clue-cat')?.value;
  const description = document.getElementById('new-clue-desc')?.value.trim();
  if (!title) { showToast('Please enter a title.', 'warn'); return; }
  const mysteries = LS.get('mysteries', null) || [];
  const newEntry = {
    id: 'mystery-' + Date.now(),
    title,
    category,
    description: description || '',
    status: 'Open',
    playerNotes: '',
    dateAdded: new Date().toLocaleDateString()
  };
  mysteries.push(newEntry);
  LS.set('mysteries', mysteries);
  showToast('New entry added!', 'success');
  closeModal();
  initMysteryPage();
}

/* ============================================================
   PAGE: RELATIONSHIPS
   ============================================================ */
async function initRelationshipsPage() {
  const data = await fetchData('relationships.json');
  const relStorage = LS.get('relationships', {});
  const merged = data.map(r => ({ ...r, ...(relStorage[r.id] || {}) }));
  let filtered = [...merged];
  let activeStatus = 'all';
  let searchQuery = '';

  const grid = document.getElementById('rel-grid');
  const count = document.getElementById('rel-count');

  function render() {
    if (!grid) return;
    if (!filtered.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">💝</div><p>No relationships match your filters.</p></div>`;
      return;
    }
    if (count) count.textContent = filtered.length;
    grid.innerHTML = filtered.map(r => relCard(r)).join('');
    grid.querySelectorAll('.rel-card').forEach(card => {
      card.addEventListener('click', () => {
        const npc = merged.find(r => r.id === card.dataset.id);
        if (npc) openNpcModal(npc);
      });
    });
  }

  function applyFilters() {
    filtered = merged.filter(r => {
      const matchStatus = activeStatus === 'all' || r.status === activeStatus;
      const matchSearch = !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
    filtered.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
    render();
  }

  setupSearch('rel-search', q => { searchQuery = q; applyFilters(); });
  document.querySelectorAll('.rel-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.rel-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeStatus = btn.dataset.status || 'all';
      applyFilters();
    });
  });

  document.getElementById('rel-sort')?.addEventListener('change', function() {
    if (this.value === 'college') filtered.sort((a,b) => (a.college||'').localeCompare(b.college||''));
    else if (this.value === 'bond') filtered.sort((a,b) => (b.bondScore||0) - (a.bondScore||0));
    else if (this.value === 'name') filtered.sort((a,b) => a.name.localeCompare(b.name));
    render();
  });

  applyFilters();
}

function relCard(r) {
  const bond = r.bondScore || 0;
  const bondWidth = Math.max(0, Math.min(100, ((bond + 2) / 6) * 100));
  return `
    <div class="card rel-card" data-id="${r.id}" role="button" tabindex="0">
      <div class="card-header">
        <div class="card-avatar">${r.emoji||'👤'}</div>
        <div style="flex:1;">
          <div class="card-title">${r.name}${r.isFavorite?'<span style="color:var(--gold);margin-left:0.3rem;font-size:0.9rem;">★</span>':''}</div>
          <div class="card-subtitle">${r.college||''}</div>
        </div>
        ${r.needsFollowUp ? '<span class="badge badge-neutral" style="font-size:0.65rem;">Follow Up</span>' : ''}
      </div>
      <div class="bond-bar-container">
        <div class="bond-bar-label">Bond Points: ${bond}</div>
        <div class="bond-bar"><div class="bond-fill" style="width:${bondWidth}%"></div></div>
      </div>
      <div class="card-footer">
        ${collegeBadge(r.college)}
        ${relStatusBadge(r.status || 'Unknown')}
      </div>
    </div>`;
}

/* ============================================================
   PAGE: COLLEGES
   ============================================================ */
async function initCollegesPage() {
  const colleges = await fetchData('colleges.json');
  const grid = document.getElementById('colleges-grid');
  if (!grid) return;
  grid.innerHTML = colleges.map(c => collegeCard(c)).join('');
  grid.querySelectorAll('.college-card').forEach(card => {
    card.addEventListener('click', () => {
      const college = colleges.find(c => c.id === card.dataset.id);
      if (college) openCollegeModal(college);
    });
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
        <div class="college-section">
          <div class="college-section-label">Focus</div>
          <p>${c.magical_focus}</p>
        </div>
        <div class="college-section">
          <div class="college-section-label">Campus Vibe</div>
          <p>${c.campus_vibe}</p>
        </div>
      </div>
    </div>`;
}

function openCollegeModal(c) {
  const stereotypes = c.student_stereotypes?.map(s => `<li style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.3rem;">• ${s}</li>`).join('') || '';
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
      <div>
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:0.5rem;">Aesthetic</div>
        <p style="font-size:0.85rem;">${c.aesthetic}</p>
      </div>
      <div>
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:0.5rem;">Magical Focus</div>
        <p style="font-size:0.85rem;">${c.magical_focus}</p>
      </div>
    </div>
    <div>
      <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:0.5rem;">You Might Be ${c.name} If...</div>
      <ul style="list-style:none;">${stereotypes}</ul>
    </div>
  `);
}

/* ============================================================
   PAGE: LOCATIONS
   ============================================================ */
async function initLocationsPage() {
  const locations = await fetchData('locations.json');
  let filtered = [...locations];
  let activeTag = 'all';
  let searchQuery = '';

  const grid = document.getElementById('locations-grid');
  const count = document.getElementById('loc-count');

  function render() {
    if (!grid) return;
    if (!filtered.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🗺️</div><p>No locations found.</p></div>`;
      return;
    }
    if (count) count.textContent = filtered.length;
    grid.innerHTML = filtered.map(loc => locationCard(loc)).join('');
    grid.querySelectorAll('.location-card').forEach(card => {
      card.addEventListener('click', () => {
        const loc = locations.find(l => l.id === card.dataset.id);
        if (loc) openLocationModal(loc);
      });
    });
  }

  function applyFilters() {
    filtered = locations.filter(loc => {
      const matchTag = activeTag === 'all' || loc.tags?.some(t => t.toLowerCase() === activeTag.toLowerCase());
      const matchSearch = !searchQuery || ['name','description','vibe','region'].some(f => (loc[f]||'').toLowerCase().includes(searchQuery.toLowerCase()));
      return matchTag && matchSearch;
    });
    render();
  }

  setupSearch('loc-search', q => { searchQuery = q; applyFilters(); });
  document.querySelectorAll('.loc-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.loc-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTag = btn.dataset.tag || 'all';
      applyFilters();
    });
  });

  render();
}

function locationCard(loc) {
  const regionColors = { Lorehold:'var(--lorehold)', Prismari:'var(--prismari)', Quandrix:'var(--quandrix)', Silverquill:'var(--silverquill)', Witherbloom:'var(--witherbloom)', 'Central Campus':'var(--gold)' };
  const rColor = regionColors[loc.region] || 'var(--text-muted)';
  return `
    <div class="card location-card" data-id="${loc.id}" role="button" tabindex="0" style="cursor:pointer;">
      <div class="location-region" style="color:${rColor};">${loc.region}</div>
      <div class="card-header" style="margin-bottom:0.5rem;">
        <div style="font-size:2rem;">${loc.emoji}</div>
        <div><div class="card-title">${loc.name}</div></div>
      </div>
      <div class="location-vibe">${loc.vibe}</div>
      <div class="card-body" style="margin-top:0.4rem;">${loc.description.slice(0,120)}...</div>
      <div class="card-footer" style="margin-top:0.75rem;">
        ${loc.tags?.slice(0,3).map(t => `<span class="tag">${t}</span>`).join('') || ''}
      </div>
    </div>`;
}

function openLocationModal(loc) {
  const npcs = loc.commonNPCs?.map(n => `<span class="tag">${n}</span>`).join('') || '';
  const activities = loc.activities?.map(a => `<li style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.3rem;">• ${a}</li>`).join('') || '';
  const saved = LS.get('locations', {});
  const savedLoc = saved[loc.id] || {};

  openModal(`
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;">
      <div style="font-size:2.5rem;">${loc.emoji}</div>
      <div>
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:0.2rem;">${loc.region}</div>
        <h2>${loc.name}</h2>
        <div class="location-vibe">${loc.vibe}</div>
      </div>
    </div>
    <p style="color:var(--text-secondary);margin-bottom:1rem;">${loc.description}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
      <div>
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:0.5rem;">Common Faces</div>
        <div style="display:flex;flex-wrap:wrap;gap:0.3rem;">${npcs}</div>
      </div>
      <div>
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:0.5rem;">Activities</div>
        <ul style="list-style:none;">${activities}</ul>
      </div>
    </div>
    <div style="border-top:1px solid var(--border);padding-top:1rem;">
      <label style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:0.5rem;">Your Notes About This Location</label>
      <textarea id="loc-notes" placeholder="What have you discovered here?" style="width:100%;height:80px;background:var(--bg-panel);border:1px solid var(--border);border-radius:8px;padding:0.75rem;color:var(--text-primary);font-family:'Crimson Pro',serif;font-size:0.95rem;resize:vertical;outline:none;">${savedLoc.notes||''}</textarea>
      <div style="display:flex;justify-content:flex-end;margin-top:0.5rem;">
        <button class="btn btn-primary btn-sm" onclick="saveLocationNotes('${loc.id}')">Save Notes</button>
      </div>
    </div>
  `);
}

function saveLocationNotes(id) {
  const saved = LS.get('locations', {});
  saved[id] = { notes: document.getElementById('loc-notes')?.value || '' };
  LS.set('locations', saved);
  showToast('Location notes saved!', 'success');
  closeModal();
}

/* ============================================================
   PAGE: CLUBS
   ============================================================ */
async function initClubsPage() {
  const clubs = await fetchData('clubs.json');
  const grid = document.getElementById('clubs-grid');
  const joined = LS.get('clubs_joined', []);
  if (!grid) return;
  grid.innerHTML = clubs.map(c => clubCard(c, joined.includes(c.id))).join('');
  grid.querySelectorAll('.club-card').forEach(card => {
    card.addEventListener('click', () => {
      const club = clubs.find(c => c.id === card.dataset.id);
      if (club) openClubModal(club, joined.includes(club.id));
    });
  });
}

function clubCard(c, joined) {
  return `
    <div class="card club-card" data-id="${c.id}" role="button" tabindex="0" style="cursor:pointer;">
      <div class="club-icon">${c.emoji}</div>
      <div class="card-title" style="margin-bottom:0.4rem;">${c.name}</div>
      <div style="font-size:0.8rem;font-style:italic;color:var(--text-muted);margin-bottom:0.75rem;">${c.vibe}</div>
      <div class="card-body">${c.description.slice(0,120)}...</div>
      <div class="card-footer">
        ${joined ? '<span class="badge badge-positive">Joined</span>' : (c.recruiting ? '<span class="badge badge-gold">Recruiting</span>' : '')}
        ${c.tags?.slice(0,2).map(t => `<span class="tag">${t}</span>`).join('') || ''}
      </div>
    </div>`;
}

function openClubModal(c, joined) {
  const npcs = c.relatedNPCs?.map(n => `<span class="tag">${n}</span>`).join('') || '<span class="text-muted" style="font-size:0.85rem;">Various students</span>';
  const events = c.eventIdeas?.map(e => `<li style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.3rem;">• ${e}</li>`).join('') || '';
  openModal(`
    <div style="text-align:center;margin-bottom:1.25rem;">
      <div style="font-size:3rem;margin-bottom:0.5rem;">${c.emoji}</div>
      <h2>${c.name}</h2>
      <p style="font-style:italic;color:var(--text-muted);margin-top:0.3rem;">${c.vibe}</p>
    </div>
    <p style="color:var(--text-secondary);margin-bottom:1.25rem;font-family:'Crimson Pro',serif;font-size:1.05rem;line-height:1.8;">${c.description}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
      <div>
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:0.5rem;">Known Members</div>
        <div style="display:flex;flex-wrap:wrap;gap:0.3rem;">${npcs}</div>
      </div>
      <div>
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:0.5rem;">Meeting Style</div>
        <p style="font-size:0.85rem;">${c.meetingStyle}</p>
      </div>
    </div>
    <div style="margin-bottom:1rem;">
      <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:0.5rem;">Social Hook</div>
      <p style="font-size:0.88rem;font-style:italic;color:var(--gold-light);">${c.socialHooks}</p>
    </div>
    <div style="margin-bottom:1rem;">
      <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:0.5rem;">Possible Events</div>
      <ul style="list-style:none;">${events}</ul>
    </div>
    <div style="display:flex;justify-content:center;margin-top:1rem;">
      <button class="btn ${joined ? 'btn-secondary' : 'btn-primary'}" onclick="toggleClubMembership('${c.id}', ${joined})">
        ${joined ? '✓ You are a member — Click to leave' : 'Join This Club'}
      </button>
    </div>
  `);
}

function toggleClubMembership(id, currently) {
  let joined = LS.get('clubs_joined', []);
  if (currently) { joined = joined.filter(x => x !== id); showToast('Left the club.', 'info'); }
  else { joined.push(id); showToast('Joined! Welcome to the club.', 'success'); }
  LS.set('clubs_joined', joined);
  closeModal();
  initClubsPage();
}

/* ============================================================
   PAGE: JOBS
   ============================================================ */
async function initJobsPage() {
  const jobs = await fetchData('jobs.json');
  const myJob = LS.get('my_job', null);
  const grid = document.getElementById('jobs-grid');
  if (!grid) return;
  grid.innerHTML = jobs.map(j => jobListingHtml(j, myJob === j.id)).join('');
  grid.querySelectorAll('.job-listing').forEach(item => {
    item.addEventListener('click', () => {
      const job = jobs.find(j => j.id === item.dataset.id);
      if (job) openJobModal(job, myJob === job.id);
    });
  });
}

function jobListingHtml(j, isMyJob) {
  return `
    <div class="job-listing" data-id="${j.id}" role="button" tabindex="0">
      <div class="job-icon">${j.emoji}</div>
      <div class="job-info">
        <div class="job-title">${j.name}</div>
        <div class="job-location">📍 ${j.location}</div>
        <div class="job-desc">${j.description.slice(0,100)}...</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.4rem;min-width:90px;">
        ${isMyJob ? '<span class="badge badge-positive">My Job</span>' : ''}
        ${j.tags?.slice(0,1).map(t => `<span class="tag">${t}</span>`).join('') || ''}
      </div>
    </div>`;
}

function openJobModal(j, isMyJob) {
  const coworkers = j.commonCoworkers?.map(n => `<span class="tag">${n}</span>`).join('') || '<span style="font-size:0.85rem;color:var(--text-muted);">Various</span>';
  const resp = j.responsibilities?.map(r => `<li style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.25rem;">• ${r}</li>`).join('') || '';
  openModal(`
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;">
      <div style="font-size:2.5rem;">${j.emoji}</div>
      <div>
        <h2 style="margin-bottom:0.2rem;">${j.name}</h2>
        <p style="color:var(--text-muted);font-size:0.85rem;">📍 ${j.location}</p>
      </div>
    </div>
    <p style="color:var(--text-secondary);margin-bottom:1.25rem;">${j.description}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
      <div>
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:0.5rem;">Responsibilities</div>
        <ul style="list-style:none;">${resp}</ul>
      </div>
      <div>
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:0.5rem;">Common Coworkers</div>
        <div style="display:flex;flex-wrap:wrap;gap:0.3rem;">${coworkers}</div>
      </div>
    </div>
    <div style="background:rgba(200,169,90,0.07);border:1px solid var(--gold-dim);border-radius:8px;padding:0.75rem;margin-bottom:1rem;">
      <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--gold);margin-bottom:0.3rem;">Roleplay Opportunities</div>
      <p style="font-size:0.85rem;">${j.roleplaying_hooks}</p>
    </div>
    <div style="display:flex;justify-content:center;margin-top:1rem;">
      <button class="btn ${isMyJob ? 'btn-secondary' : 'btn-primary'}" onclick="toggleJob('${j.id}', ${isMyJob})">
        ${isMyJob ? 'Quit This Job' : 'Take This Job'}
      </button>
    </div>
  `);
}

function toggleJob(id, currently) {
  if (currently) { LS.set('my_job', null); showToast('Job vacated.', 'info'); }
  else { LS.set('my_job', id); showToast('Job taken! Good luck.', 'success'); }
  closeModal();
  initJobsPage();
}

/* ============================================================
   PAGE: DOCUMENTS
   ============================================================ */
async function initDocumentsPage() {
  const docs = await fetchData('documents.json');
  const grid = document.getElementById('docs-grid');
  if (!grid) return;
  grid.innerHTML = docs.map(d => docCard(d)).join('');
  grid.querySelectorAll('.document-card').forEach(card => {
    card.addEventListener('click', () => {
      const doc = docs.find(d => d.id === card.dataset.id);
      if (doc) openDocModal(doc);
    });
  });
}

function docCard(d) {
  return `
    <div class="card document-card" data-id="${d.id}" role="button" tabindex="0">
      <div class="doc-icon">${d.emoji}</div>
      <div class="doc-type">${d.type}</div>
      <div class="card-title">${d.title}</div>
      <div class="card-footer" style="margin-top:0.75rem;">
        ${d.tags?.slice(0,3).map(t => `<span class="tag">${t}</span>`).join('') || ''}
      </div>
    </div>`;
}

function openDocModal(d) {
  openModal(`
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.25rem;">
      <div style="font-size:2.5rem;">${d.emoji}</div>
      <div>
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--gold);margin-bottom:0.2rem;">${d.type}</div>
        <h2>${d.title}</h2>
      </div>
    </div>
    <div style="font-family:'Crimson Pro',serif;font-size:1rem;line-height:1.9;color:var(--parchment-dark);background:#1a1810;border:1px solid #3a3520;border-radius:8px;padding:1.5rem;white-space:pre-wrap;">${d.content}</div>
  `);
}

/* ============================================================
   PAGE: HOME
   ============================================================ */
async function initHomePage() {
  const [students, locations, clubs] = await Promise.all([
    fetchData('students.json'), fetchData('locations.json'), fetchData('clubs.json')
  ]);
  const rumors = [
    "Greta Gorunn has reportedly issued an open challenge to anyone brave enough to join her on an unauthorized dig.",
    "The Firejolt Café's latest seasonal drink allegedly changes color based on the drinker's emotional state.",
    "A spirit echo was seen wandering outside the Lorehold campus last night, humming something no one recognizes.",
    "Quentillius has circulated a three-page artistic manifesto. Critiques are being... accepted... through an official process.",
    "The Biblioplex closed an entire reading room this week for 'preventative maintenance.' The locks look new.",
    "Zanther set his own notes on fire during a particularly exciting study session. The notes were later described as 'expressive.'",
    "Someone left a bouquet of Witherbloom-grown flowers outside three different dormitory rooms. No note. No explanation.",
    "Rubina Larkingdale is working on something for the Star and is being extremely quiet about it."
  ];

  const rumor = document.getElementById('campus-rumor');
  if (rumor) rumor.textContent = rumors[Math.floor(Math.random() * rumors.length)];

  const rumorRefresh = document.getElementById('rumor-refresh');
  if (rumorRefresh) {
    let idx = 0;
    rumorRefresh.addEventListener('click', () => {
      idx = (idx + 1) % rumors.length;
      if (rumor) { rumor.style.opacity = '0'; setTimeout(() => { rumor.textContent = rumors[idx]; rumor.style.opacity = '1'; }, 200); }
    });
    if (rumor) rumor.style.transition = 'opacity 0.2s';
  }

  const featuredStudents = document.getElementById('featured-students');
  if (featuredStudents && students.length) {
    const picks = students.sort(() => 0.5 - Math.random()).slice(0, 3);
    featuredStudents.innerHTML = picks.map(s => `
      <a href="students.html" class="card card-sm" style="text-decoration:none;display:flex;align-items:center;gap:0.75rem;">
        <div class="card-avatar">${s.emoji}</div>
        <div>
          <div class="card-title" style="font-size:0.88rem;">${s.name}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">${s.college}</div>
        </div>
      </a>`).join('');
  }

  const featuredLocs = document.getElementById('featured-locations');
  if (featuredLocs && locations.length) {
    const picks = locations.sort(() => 0.5 - Math.random()).slice(0, 3);
    featuredLocs.innerHTML = picks.map(l => `
      <a href="locations.html" class="card card-sm" style="text-decoration:none;display:flex;align-items:center;gap:0.75rem;">
        <div style="font-size:1.6rem;">${l.emoji}</div>
        <div>
          <div class="card-title" style="font-size:0.88rem;">${l.name}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">${l.region}</div>
        </div>
      </a>`).join('');
  }
}
