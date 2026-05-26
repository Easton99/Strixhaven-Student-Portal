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

async function togglePlayerClub(clubId, isCurrentlyJoined) {
  const userId = getUserId();
  if (!userId) return false;
  if (isCurrentlyJoined) {
    const { error } = await sb.from('player_clubs').delete().eq('user_id', userId).eq('club_id', clubId);
    if (error) { showToast('Error leaving club', 'error'); return false; }
  } else {
    const { error } = await sb.from('player_clubs').insert({ user_id: userId, club_id: clubId });
    if (error) { showToast('Error joining club', 'error'); return false; }
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

async function setPlayerJob(jobId) {
  const userId = getUserId();
  if (!userId) return false;
  const { error } = await sb.from('player_jobs')
    .upsert({ user_id: userId, job_id: jobId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) { showToast('Error saving job', 'error'); return false; }
  return true;
}
