/* =============================================================
   STRIXHAVEN PORTAL — AUTH
   ============================================================= */

let _currentUser = null;
let _dmMode = false;

async function initAuth(requireAuth = true) {
  const { data: { session } } = await sb.auth.getSession();
  _currentUser = session?.user ?? null;

  if (requireAuth && !_currentUser) {
    window.location.href = getBasePath() + 'login.html';
    return false;
  }

  _dmMode = _currentUser?.email === DM_EMAIL;
  updateNavUser();
  if (_dmMode) document.body.classList.add('dm-mode');
  else ensurePlayerProfile?.();
  if (_currentUser) {
    await maybeLogLogin();
  }
  return true;
}

async function maybeLogLogin() {
  if (typeof logActivity !== 'function') return;
  if (!_currentUser || _dmMode) return;
  const lastLogin = parseInt(localStorage.getItem('last_login_log_v3') || '0');
  if (Date.now() - lastLogin <= 30 * 60 * 1000) return;
  try {
    const { error } = await sb.from('activity_log').insert({
      user_id: _currentUser.id,
      user_name: getUserName(),
      user_avatar: getUserAvatar(),
      action_type: 'login',
      entity_type: null, entity_id: null, entity_name: null,
      old_value: null, new_value: null,
    });
    if (error) { console.error('Login log failed:', error); return; }
    localStorage.setItem('last_login_log_v3', String(Date.now()));
  } catch (e) {
    console.error('Login log threw:', e);
  }
}

sb.auth.onAuthStateChange((event, session) => {
  _currentUser = session?.user ?? null;
  _dmMode = _currentUser?.email === DM_EMAIL;
  if (event === 'SIGNED_OUT') {
    window.location.href = getBasePath() + 'login.html';
  }
  if (event === 'SIGNED_IN') {
    updateNavUser();
    maybeLogLogin();
  }
});

function getCurrentUser() { return _currentUser; }
function isDM() { return _dmMode; }
function getUserId() { return _currentUser?.id ?? null; }
function getUserName() {
  const meta = _currentUser?.user_metadata;
  return meta?.full_name || meta?.name || _currentUser?.email?.split('@')[0] || 'Student';
}
function getUserAvatar() { return _currentUser?.user_metadata?.avatar_url ?? null; }

function getBasePath() {
  const path = window.location.pathname;
  const idx = path.lastIndexOf('/');
  return path.substring(0, idx + 1);
}

async function signInWithGoogle() {
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: SITE_URL }
  });
  if (error) { showToast('Sign-in failed: ' + error.message, 'error'); }
}

async function signOut() {
  await sb.auth.signOut();
  window.location.href = getBasePath() + 'login.html';
}

function updateNavUser() {
  const container = document.getElementById('nav-user');
  if (!container || !_currentUser) return;

  const avatar = getUserAvatar();
  const name = getUserName();
  const dmBadge = _dmMode
    ? `<span style="font-size:0.68rem;background:rgba(200,169,90,0.15);color:var(--gold);border:1px solid var(--gold-dim);padding:0.15rem 0.5rem;border-radius:999px;font-weight:600;">DM</span>`
    : '';

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.5rem;">
      ${dmBadge}
      ${avatar
        ? `<img src="${avatar}" alt="${name}" style="width:28px;height:28px;border-radius:50%;border:1px solid var(--border);">`
        : `<div style="width:28px;height:28px;border-radius:50%;background:var(--bg-panel);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:0.8rem;">👤</div>`}
      <span style="font-size:0.8rem;color:var(--text-secondary);max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}</span>
      <button onclick="signOut()" class="btn btn-ghost btn-sm" style="font-size:0.72rem;padding:0.25rem 0.5rem;" title="Sign out">↩</button>
    </div>`;

  if (_dmMode) {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && !navLinks.querySelector('.dm-nav-link')) {
      const a = document.createElement('a');
      a.href = getBasePath() + 'dm.html';
      a.className = 'dm-nav-link';
      a.textContent = '⚙ DM';
      a.style.cssText = 'color:var(--gold)!important;font-weight:700;';
      navLinks.appendChild(a);
    }
  }
}
