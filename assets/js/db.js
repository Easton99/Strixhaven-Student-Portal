/* =============================================================
   STRIXHAVEN PORTAL — DATABASE LAYER
   All Supabase read/write operations live here.
   ============================================================= */

/* --- REVEALS (DM-controlled field visibility) --- */

let _revealsCache = null;

async function loadReveals() {
  if (_revealsCache) return _revealsCache;
  const { data, error } = await sb.from('reveals').select('*');
  if (error) { console.error('loadReveals:', error); return {}; }
  _revealsCache = {};
  (data || []).forEach(r => { _revealsCache[r.key] = r.revealed; });
  return _revealsCache;
}

function isRevealed(key) {
  return _revealsCache ? !!_revealsCache[key] : false;
}

async function toggleReveal(key, currentValue) {
  if (!isDM()) return;
  const newVal = !currentValue;
  const { error } = await sb.from('reveals').upsert({ key, revealed: newVal }, { onConflict: 'key' });
  if (error) { showToast('Error saving reveal', 'error'); return; }
  if (!_revealsCache) _revealsCache = {};
  _revealsCache[key] = newVal;
  showToast(newVal ? '🔓 Revealed to players' : '🔒 Hidden from players', newVal ? 'success' : 'info');
}

/* --- MYSTERIES (shared party clue board) --- */

async function getMysteries() {
  const { data, error } = await sb.from('mysteries').select('*').order('date_added', { ascending: true });
  if (error) { console.error('getMysteries:', error); return []; }
  return data || [];
}

async function upsertMystery(mystery) {
  const { error } = await sb.from('mysteries').upsert(mystery, { onConflict: 'id' });
  if (error) { showToast('Error saving clue', 'error'); return false; }
  return true;
}

async function deleteMystery(id) {
  const { error } = await sb.from('mysteries').delete().eq('id', id);
  if (error) { showToast('Error deleting entry', 'error'); return false; }
  return true;
}

/* --- PARTY NOTES (shared) --- */

async function getPartyNotes() {
  const { data, error } = await sb.from('party_notes').select('*');
  if (error) { console.error('getPartyNotes:', error); return {}; }
  const result = {};
  (data || []).forEach(n => { result[n.section] = n.content; });
  return result;
}

async function savePartyNote(section, content) {
  const userId = getUserId();
  const { error } = await sb.from('party_notes')
    .upsert({ section, content, updated_by: userId, updated_at: new Date().toISOString() }, { onConflict: 'section' });
  if (error) { showToast('Error saving note', 'error'); return false; }
  return true;
}

/* --- PLAYER PRIVATE NOTES --- */

async function getPlayerNotes() {
  const userId = getUserId();
  if (!userId) return {};
  const { data, error } = await sb.from('player_notes').select('*').eq('user_id', userId);
  if (error) { console.error('getPlayerNotes:', error); return {}; }
  const result = {};
  (data || []).forEach(n => { result[n.section] = n.content; });
  return result;
}

async function savePlayerNote(section, content) {
  const userId = getUserId();
  if (!userId) return false;
  const { error } = await sb.from('player_notes')
    .upsert({ user_id: userId, section, content, updated_at: new Date().toISOString() },
             { onConflict: 'user_id,section' });
  if (error) { showToast('Error saving note', 'error'); return false; }
  logActivity('note_saved', 'note_section', section, section, null, null);
  return true;
}

/* --- PLAYER RELATIONSHIPS --- */

async function getPlayerRelationships() {
  const userId = getUserId();
  if (!userId) return {};
  const { data, error } = await sb.from('player_relationships').select('*').eq('user_id', userId);
  if (error) { console.error('getPlayerRelationships:', error); return {}; }
  const result = {};
  (data || []).forEach(r => { result[r.npc_id] = r; });
  return result;
}

async function savePlayerRelationship(npcId, relData) {
  const userId = getUserId();
  if (!userId) return false;
  const { error } = await sb.from('player_relationships')
    .upsert({ user_id: userId, npc_id: npcId, ...relData }, { onConflict: 'user_id,npc_id' });
  if (error) { showToast('Error saving relationship', 'error'); return false; }
  return true;
}

/* --- PLAYER CLUBS --- */

async function getPlayerClubs() {
  const userId = getUserId();
  if (!userId) return [];
  const { data, error } = await sb.from('player_clubs').select('club_id').eq('user_id', userId);
  if (error) { console.error('getPlayerClubs:', error); return []; }
  return (data || []).map(r => r.club_id);
}

async function togglePlayerClub(clubId, isCurrentlyJoined, clubName) {
  const userId = getUserId();
  if (!userId) return false;
  if (isCurrentlyJoined) {
    const { error } = await sb.from('player_clubs').delete().eq('user_id', userId).eq('club_id', clubId);
    if (error) { showToast('Error leaving club', 'error'); return false; }
    logActivity('club_left', 'club', clubId, clubName || clubId, null, null);
  } else {
    const { error } = await sb.from('player_clubs').insert({ user_id: userId, club_id: clubId });
    if (error) { showToast('Error joining club', 'error'); return false; }
    logActivity('club_joined', 'club', clubId, clubName || clubId, null, null);
  }
  return true;
}

/* --- PLAYER JOB --- */

async function getPlayerJob() {
  const userId = getUserId();
  if (!userId) return null;
  const { data, error } = await sb.from('player_jobs').select('job_id').eq('user_id', userId).maybeSingle();
  if (error) { console.error('getPlayerJob:', error); return null; }
  return data?.job_id ?? null;
}

async function setPlayerJob(jobId, jobName) {
  const userId = getUserId();
  if (!userId) return false;
  const { error } = await sb.from('player_jobs')
    .upsert({ user_id: userId, job_id: jobId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) { showToast('Error saving job', 'error'); return false; }
  logActivity(jobId ? 'job_taken' : 'job_quit', 'job', jobId, jobName || jobId, null, null);
  return true;
}

/* --- ACTIVITY LOG --- */

async function logActivity(actionType, entityType, entityId, entityName, oldValue, newValue) {
  const userId = getUserId();
  if (!userId) return;
  await sb.from('activity_log').insert({
    user_id: userId,
    user_name: getUserName(),
    user_avatar: getUserAvatar(),
    action_type: actionType,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    old_value: oldValue != null ? String(oldValue) : null,
    new_value: newValue != null ? String(newValue) : null,
  });
}

async function getActivityLog(limit = 150) {
  if (!isDM()) return [];
  const { data, error } = await sb.from('activity_log')
    .select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) { console.error('getActivityLog:', error); return []; }
  return data || [];
}

/* --- PLAYER PROFILES --- */

async function ensurePlayerProfile() {
  const userId = getUserId();
  const email = getCurrentUser()?.email;
  if (!userId || isDM()) return;
  const { data: existing } = await sb.from('player_profiles')
    .select('id').or(`user_id.eq.${userId},email.eq.${email}`).maybeSingle();
  if (existing) {
    await sb.from('player_profiles').update({
      user_id: userId,
      avatar_url: getUserAvatar(),
      last_seen: new Date().toISOString(),
    }).eq('id', existing.id);
  } else {
    await sb.from('player_profiles').insert({
      user_id: userId,
      player_name: getUserName(),
      email,
      avatar_url: getUserAvatar(),
    });
  }
}

async function getKnownUsers() {
  if (!isDM()) return [];
  const { data, error } = await sb.from('known_users')
    .select('id, email, display_name, avatar_url').order('display_name');
  if (error) { console.error('getKnownUsers:', error); return []; }
  return data || [];
}

async function getPlayerProfiles() {
  if (!isDM()) return [];
  const { data, error } = await sb.from('player_profiles')
    .select('*').order('created_at', { ascending: true });
  if (error) { console.error('getPlayerProfiles:', error); return []; }
  return data || [];
}

async function upsertPlayerProfile(profile) {
  if (!isDM()) return false;
  const { error } = await sb.from('player_profiles')
    .upsert(profile, { onConflict: 'id' });
  if (error) { showToast('Error saving player', 'error'); return false; }
  return true;
}

async function deletePlayerProfile(id) {
  if (!isDM()) return false;
  const { error } = await sb.from('player_profiles').delete().eq('id', id);
  if (error) { showToast('Error removing player', 'error'); return false; }
  return true;
}

/* --- DM: READ ALL PLAYER DATA --- */

async function getAllRelationships() {
  if (!isDM()) return [];
  const { data, error } = await sb.from('player_relationships').select('*');
  if (error) { console.error('getAllRelationships:', error); return []; }
  return data || [];
}

async function getAllPlayerNotes() {
  if (!isDM()) return [];
  const { data, error } = await sb.from('player_notes').select('*')
    .order('updated_at', { ascending: false });
  if (error) { console.error('getAllPlayerNotes:', error); return []; }
  return data || [];
}

async function getPlayerNotesForUser(userId) {
  if (!isDM() || !userId) return [];
  const { data, error } = await sb.from('player_notes')
    .select('section, content, updated_at').eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) { console.error('getPlayerNotesForUser:', error); return []; }
  return data || [];
}

/* --- VISIBILITY (DM HIDE / SHOW) --- */

function isHidden(type, id) {
  if (!_revealsCache) return false;
  // revealed=true means hidden — this way all users can read the row via RLS
  return _revealsCache[`hidden_${type}_${id}`] === true;
}

async function toggleHidden(type, id) {
  if (!isDM()) return null;
  const key = `hidden_${type}_${id}`;
  const currentlyHidden = isHidden(type, id);
  const newVal = !currentlyHidden;
  const { error } = await sb.from('reveals')
    .upsert({ key, revealed: newVal }, { onConflict: 'key' });
  if (error) { showToast('Error toggling visibility', 'error'); return null; }
  if (!_revealsCache) _revealsCache = {};
  _revealsCache[key] = newVal;
  showToast(newVal ? '🔴 Hidden from players' : '🟢 Visible to players', newVal ? 'warn' : 'success');
  return newVal;
}
