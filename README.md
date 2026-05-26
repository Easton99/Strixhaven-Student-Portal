# Strixhaven Student Portal

A player-facing campaign hub for **Strixhaven: A Curriculum of Chaos** (D&D 5e).

Live site: https://easton99.github.io/Strixhaven-Student-Portal/

---

## What Is This?

A beautiful, immersive GitHub Pages website that acts as a fictional student intranet for Strixhaven University. Players can browse NPCs, track relationships, log clues, read handouts, and keep session notes — all without spoilers.

---

## Pages

| Page | File | Description |
|------|------|-------------|
| Home | `index.html` | Dashboard with campus buzz, quick navigation, and featured content |
| Students | `students.html` | Filterable directory of recurring student NPCs |
| Faculty | `faculty.html` | Deans, professors, and staff |
| Colleges | `colleges.html` | The five colleges with detailed profiles |
| Locations | `locations.html` | Campus location directory with notes |
| Clubs | `clubs.html` | Extracurricular directory — join/leave clubs |
| Jobs | `jobs.html` | Student employment board — take/leave jobs |
| Relationships | `relationships.html` | Track bond scores and relationship status |
| Mystery Board | `mystery-board.html` | Conspiracy board for clues and theories |
| Documents | `documents.html` | Handouts, notices, menus, and letters |
| Study Notes | `shared-notes.html` | Browser-based notes with export/import |

---

## Enabling GitHub Pages

1. Push this repository to GitHub
2. Go to **Settings → Pages**
3. Under **Source**, select **Deploy from a branch**
4. Choose **main** branch, **/ (root)** folder
5. Click **Save**
6. Your site will be live at `https://[username].github.io/[repo-name]/`

---

## Local Preview

Open any HTML file directly in a browser, **or** use a local server to avoid CORS issues with JSON loading:

```bash
# Python 3
python -m http.server 8000
# then open http://localhost:8000

# Node.js (npx)
npx serve .
```

---

## Editing Content

All content lives in the `data/` folder as easy-to-edit JSON files:

### Adding / Editing Students
Edit `data/students.json`. Each entry follows this structure:
```json
{
  "id": "unique-kebab-id",
  "name": "Full Name",
  "type": "student",
  "college": "Prismari",
  "emoji": "🎨",
  "race": "Human",
  "role": "Student",
  "year": "First Year",
  "personality": "Description of personality...",
  "vibe": "Short vibe summary",
  "extracurriculars": ["Club Name"],
  "job": null,
  "bondBoon": "What they provide as a friend...",
  "bondBane": "What happens as a rival...",
  "favoriteLocations": ["Location Name"],
  "tags": ["prismari", "student"],
  "relationshipStatus": "Unknown",
  "bondScore": 0,
  "playerNotes": "",
  "rumors": "Campus rumor about them.",
  "gossip": "Another piece of gossip."
}
```

### Adding Locations
Edit `data/locations.json`. Add a new object with `id`, `name`, `region`, `emoji`, `description`, `vibe`, `commonNPCs`, `activities`, and `tags`.

### Adding Documents / Handouts
Edit `data/documents.json`. Add a new object with `id`, `title`, `type`, `emoji`, `tags`, and `content` (the full text of the handout).

### Adding Mystery Entries
Edit `data/mysteries.json`. Or add them live through the Mystery Board page — they save to localStorage.

---

## Player Data & Privacy

All player-specific data (relationship status, bond scores, notes, mystery additions) is stored in **browser localStorage** with the prefix `strix_`. This data:
- Stays in that browser only
- Is never sent anywhere
- Can be exported as JSON from the Notes and Mystery Board pages
- Can be cleared via browser settings if needed

---

## Tech Stack

- Pure HTML, CSS, JavaScript — no build tools required
- Google Fonts (Cinzel, Crimson Pro, Inter) — loaded via CDN
- No backend, no framework, no dependencies
- Works on GitHub Pages as-is

---

## Spoiler Policy

This portal is **player-facing only**. It contains:
- Player-safe NPC summaries and relationship mechanics
- Setting flavor and college information
- No DM-only secrets, stat blocks, villain reveals, or future plot twists
- Original handouts and notices inspired by the setting

---

## Updating After Sessions

After each session, the DM or a player can:
1. Update relationship statuses in `data/relationships.json` or via the Relationships page
2. Add new clues to `data/mysteries.json` or via the Mystery Board
3. Add new handouts to `data/documents.json`
4. Add new NPCs to `data/students.json` as they're introduced
5. Commit and push — GitHub Pages updates automatically

---

*For D&D campaign use. Content inspired by Strixhaven: A Curriculum of Chaos by Wizards of the Coast.*
