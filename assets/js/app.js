// ─── GLOBAL STATE ───────────────────────────────────────────────
var currentTheme = 'light';
var currentLang = 'en';

// ─── TRACKER DASHBOARD STATE ────────────────────────────────────
var TRACKER_STORAGE_KEY = 'wmc_tracker_dashboard_v2';
var WELLE_STORAGE_KEY = 'wmc_welle_number';
var REFLEKTION_STORAGE_KEY = 'wmc_reflektion_v1';
var trackerRowIds = [];

var TRACKER_PHASES = [
  {
    color: '#3b82f6',
    items_en: [
      'Idea clarified',
      'Requirement doc submitted for review',
      'Repo from template created',
      'Requirement doc approved'
    ],
    items_de: [
      'Ideenfindung abgeschlossen',
      'Anforderungsdokument zum Review eingereicht',
      'Repo aus Template erstellt',
      'Anforderungsdokument freigegeben'
    ]
  },
  {
    color: '#8b5cf6',
    items_en: [
      'Dev environment ready',
      'Strato domain requested',
      'Supabase prepared'
    ],
    items_de: [
      'Entwicklungsumgebung vorbereitet',
      'Strato Domäne angefragt',
      'Supabase vorbereitet'
    ]
  },
  {
    color: '#06b6d4',
    items_en: [
      'Scaffold 100%',
      'Core functions 100%',
      'Main processes 100%',
      'Bugfixing 100%',
      'User manual ready',
      'Landing page ready'
    ],
    items_de: [
      'Grundgerüst 100%',
      'Basisfunktionen 100%',
      'Hauptprozesse 100%',
      'Bugfixing 100%',
      'Produkthandbuch fertig',
      'Landingpage fertig'
    ]
  },
  {
    color: '#f59e0b',
    items_en: [
      'Strato domain secured',
      'Vercel preview deploy',
      'Vercel production deploy',
      'GitHub Pages landing page'
    ],
    items_de: [
      'Strato Domäne gesichert',
      'Vercel Preview Deploy',
      'Vercel Produktion Deploy',
      'Landingpage Gitpages Deploy'
    ]
  },
  {
    color: '#ec4899',
    items_en: [
      'Tests completed',
      'Presentation prepared',
      'Prep table maintained',
      'Reflection questions filled ⚠️ by end of week'
    ],
    items_de: [
      'Tests abgeschlossen',
      'Präsentation vorbereitet',
      'Vorbereitungstabelle gepflegt',
      'Reflektionsfragen ausgefüllt ⚠️ vor Ende der Woche'
    ]
  }
];

var RF_QUESTIONS = [
  {
    id: 'q1',
    de: 'Was habe ich in der letzten Welle gelernt?',
    en: 'What did I learn in the last wave?'
  },
  {
    id: 'q2',
    de: 'Was war mein größtes Hindernis und wie habe ich es gelöst?',
    en: 'What was my biggest obstacle and how did I solve it?'
  },
  {
    id: 'q3',
    de: 'Was empfehle ich für die nächste Welle?',
    en: 'What do I recommend for the next wave?'
  },
  {
    id: 'q4',
    de: 'Begründung, warum die Ziele der Welle nicht erreicht (wenn nicht erreicht):',
    en: 'Reason why wave goals were not achieved (if not achieved):'
  }
];

// ─── INCLUDE LOADER ─────────────────────────────────────────────
async function loadPartials() {
  var containers = document.querySelectorAll('[data-include]');
  var jobs = Array.prototype.map.call(containers, async function(container) {
    var path = container.getAttribute('data-include');
    try {
      var res = await fetch(path, { cache: 'no-cache' });
      if (!res.ok) {
        throw new Error('HTTP ' + res.status);
      }
      container.outerHTML = await res.text();
    } catch (err) {
      container.outerHTML = '<div style="padding:16px;color:#b91c1c">Failed to load: ' + path + '</div>';
      console.error('Include load failed:', path, err);
    }
  });
  await Promise.all(jobs);
}

// ─── THEME ──────────────────────────────────────────────────────
function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  var icon = document.getElementById('themeIcon');
  var text = document.getElementById('themeText');
  if (!icon || !text) {
    return;
  }
  if (currentTheme === 'light') {
    icon.textContent = '\u2600';
    text.textContent = 'Dark';
  } else {
    icon.textContent = '\u263E';
    text.textContent = 'Light';
  }
}

// ─── LANGUAGE ───────────────────────────────────────────────────
function setLang(lang) {
  currentLang = lang;
  var btns = document.querySelectorAll('.lang-btn');
  btns.forEach(function(b) {
    b.classList.toggle('active', b.textContent.trim().toLowerCase() === lang);
  });

  var all = document.querySelectorAll('[data-lang]');
  all.forEach(function(el) {
    el.classList.toggle('lang-visible', el.getAttribute('data-lang') === lang);
  });
}

// ─── SCROLL REVEAL ──────────────────────────────────────────────
function initRevealObserver() {
  var revealObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(function(el, i) {
    el.style.transitionDelay = (i % 5) * 0.07 + 's';
    revealObs.observe(el);
  });
}

// ─── CHECKLIST STATE (replaced by tracker below) ────────────────
function saveChecklistState() {}
function loadChecklistState() {}
function toggleChk(el) {}
function updateProg() {}

// ─── UI INTERACTIONS ────────────────────────────────────────────
function initPhaseJump() {
  var jumpItems = document.querySelectorAll('.week-link[data-scroll-target]');
  jumpItems.forEach(function(item) {
    function goToPhase() {
      var targetId = item.getAttribute('data-scroll-target');
      var target = document.getElementById(targetId);
      if (!target) {
        return;
      }
      target.classList.remove('collapsed');
      var head = target.querySelector('.phase-head');
      if (head) {
        head.setAttribute('aria-expanded', 'true');
      }
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    item.addEventListener('click', goToPhase);
    item.addEventListener('keydown', function(ev) {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        goToPhase();
      }
    });
  });
}

function initMainPhaseDropdowns() {
  var sections = document.querySelectorAll('section.phase-section[id^="phase"]');
  sections.forEach(function(section) {
    var head = section.querySelector('.phase-head');
    if (!head) {
      return;
    }
    section.classList.add('phase-collapsible', 'collapsed');
    head.setAttribute('role', 'button');
    head.setAttribute('tabindex', '0');
    head.setAttribute('aria-expanded', 'false');

    function toggleSection() {
      var isCollapsed = section.classList.toggle('collapsed');
      head.setAttribute('aria-expanded', String(!isCollapsed));
    }
    head.addEventListener('click', toggleSection);
    head.addEventListener('keydown', function(ev) {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        toggleSection();
      }
    });
  });
}

function initChecklistDropdowns() {
  // No-op: old check-group dropdowns replaced by dashboard tracker
}

// ─── WELLE NUMBER ───────────────────────────────────────────────
function saveWelleNumber() {
  var input = document.getElementById('welleInput');
  if (!input) { return; }
  var num = parseInt(input.value) || 1;
  if (num < 1) { num = 1; }
  input.value = num;
  try { localStorage.setItem(WELLE_STORAGE_KEY, String(num)); } catch (e) {}
  updateWelleExample(num);
}

function loadWelleNumber() {
  try {
    var saved = localStorage.getItem(WELLE_STORAGE_KEY);
    if (saved) {
      var num = parseInt(saved) || 1;
      var input = document.getElementById('welleInput');
      if (input) { input.value = num; }
      updateWelleExample(num);
    }
  } catch (e) {}
}

function updateWelleExample(num) {
  if (!num) {
    var input = document.getElementById('welleInput');
    num = input ? (parseInt(input.value) || 1) : 1;
  }
  var nextWeek = num + 1;
  var en = document.getElementById('welleExampleEn');
  var de = document.getElementById('welleExampleDe');
  if (en) {
    en.innerHTML = 'For <strong>Welle ' + num + '</strong>: submit requirements by Tuesday EOD of week ' + num + ' &rarr; submit Supabase &amp; Strato inquiries by Wednesday EOD of week ' + num + ' &rarr; develop &amp; deploy Wednesday&ndash;Friday of week ' + num + ' &rarr; present Monday evening of week ' + nextWeek + '.';
  }
  if (de) {
    de.innerHTML = 'F&uuml;r <strong>Welle ' + num + '</strong>: Anforderungen bis Dienstag EOD von Woche ' + num + ' einreichen &rarr; Supabase &amp; Strato Anfragen bis Mittwoch EOD von Woche ' + num + ' stellen &rarr; Entwickeln &amp; Deployen Mittwoch bis Freitag von Woche ' + num + ' &rarr; Pr&auml;sentation Montagabend von Woche ' + nextWeek + '.';
  }
}

// ─── TRACKER DASHBOARD ──────────────────────────────────────────
function escHtml(str) {
  if (!str) { return ''; }
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildRowHTML(id, rowData) {
  var html = '';

  // App name
  html += '<td><input type="text" class="trk-input" id="trk-name-' + id + '" placeholder="App Name" oninput="trkSave()"';
  if (rowData && rowData.name) { html += ' value="' + escHtml(rowData.name) + '"'; }
  html += '></td>';

  // Person
  html += '<td><input type="text" class="trk-input" id="trk-person-' + id + '" placeholder="Name" oninput="trkSave()"';
  if (rowData && rowData.person) { html += ' value="' + escHtml(rowData.person) + '"'; }
  html += '></td>';

  // Phase columns
  TRACKER_PHASES.forEach(function(phase, pi) {
    html += '<td class="phase-col">';
    phase.items_en.forEach(function(itemEn, ii) {
      var isAlert = (pi === 4 && ii === 3);
      var cbId = 'trk-' + id + '-p' + pi + '-' + ii;
      html += '<label class="trk-chk' + (isAlert ? ' trk-chk-alert' : '') + '">';
      html += '<input type="checkbox" id="' + cbId + '" onchange="trkRowProg(\'' + id + '\')">';
      html += '<span><span data-lang="en" class="lang-visible">' + escHtml(itemEn) + '</span>';
      html += '<span data-lang="de">' + escHtml(phase.items_de[ii]) + '</span></span>';
      html += '</label>';
    });
    html += '</td>';
  });

  // Progress
  html += '<td class="trk-prog-cell"><div class="trk-prog-text" id="trk-pt-' + id + '">0%</div>';
  html += '<div class="trk-prog-bar-wrap"><div class="trk-prog-bar" id="trk-pb-' + id + '"></div></div></td>';

  // Risk
  html += '<td><textarea class="trk-textarea" id="trk-risk-' + id + '" placeholder="Risiken / Kommentar..." oninput="trkSave()" rows="4">';
  if (rowData && rowData.risk) { html += escHtml(rowData.risk); }
  html += '</textarea></td>';

  // Remove
  html += '<td><button class="trk-remove" onclick="trkRemoveRow(\'' + id + '\')" title="Remove row">\u2715</button></td>';

  return html;
}

function trackerAddRow(rowData) {
  var id = rowData && rowData.id ? rowData.id : 'r' + Date.now();
  var tbody = document.getElementById('trackerBody');
  if (!tbody) { return; }
  var tr = document.createElement('tr');
  tr.id = 'trow-' + id;
  tr.innerHTML = buildRowHTML(id, rowData);
  tbody.appendChild(tr);
  trackerRowIds.push(id);

  // Restore checkboxes
  if (rowData && rowData.checks) {
    TRACKER_PHASES.forEach(function(phase, pi) {
      phase.items_en.forEach(function(_, ii) {
        var cb = document.getElementById('trk-' + id + '-p' + pi + '-' + ii);
        if (cb && rowData.checks['p' + pi + '-' + ii]) { cb.checked = true; }
      });
    });
  }

  trkRowProg(id);
  setLang(currentLang); // refresh bilingual visibility for new elements
}

function trkRemoveRow(id) {
  var idx = trackerRowIds.indexOf(id);
  if (idx !== -1) { trackerRowIds.splice(idx, 1); }
  var row = document.getElementById('trow-' + id);
  if (row) { row.remove(); }
  trkSave();
  trkOverallProg();
}

function trkRowProg(id) {
  var total = 0;
  var done = 0;
  TRACKER_PHASES.forEach(function(phase, pi) {
    phase.items_en.forEach(function(_, ii) {
      var cb = document.getElementById('trk-' + id + '-p' + pi + '-' + ii);
      if (cb) {
        total++;
        if (cb.checked) { done++; }
      }
    });
  });
  var pct = total > 0 ? Math.round(done / total * 100) : 0;
  var textEl = document.getElementById('trk-pt-' + id);
  var barEl = document.getElementById('trk-pb-' + id);
  if (textEl) { textEl.textContent = pct + '%'; }
  if (barEl) { barEl.style.width = pct + '%'; }
  trkSave();
  trkOverallProg();
}

function trkOverallProg() {
  var totalAll = 0;
  var doneAll = 0;
  trackerRowIds.forEach(function(id) {
    TRACKER_PHASES.forEach(function(phase, pi) {
      phase.items_en.forEach(function(_, ii) {
        var cb = document.getElementById('trk-' + id + '-p' + pi + '-' + ii);
        if (cb) {
          totalAll++;
          if (cb.checked) { doneAll++; }
        }
      });
    });
  });
  var pct = totalAll > 0 ? Math.round(doneAll / totalAll * 100) : 0;
  var bar = document.getElementById('pgBar');
  var label = document.getElementById('pgLabel');
  var doneBanner = document.getElementById('done-banner');
  if (bar) { bar.style.width = pct + '%'; }
  if (label) { label.textContent = doneAll + ' / ' + totalAll + ' completed \u2014 ' + pct + '%'; }
  if (doneBanner) {
    doneBanner.style.display = (totalAll > 0 && doneAll === totalAll) ? 'block' : 'none';
  }
}

function trkSave() {
  var data = { rows: [] };
  trackerRowIds.forEach(function(id) {
    var row = { id: id, name: '', person: '', risk: '', checks: {} };
    var nameEl = document.getElementById('trk-name-' + id);
    var personEl = document.getElementById('trk-person-' + id);
    var riskEl = document.getElementById('trk-risk-' + id);
    if (nameEl) { row.name = nameEl.value; }
    if (personEl) { row.person = personEl.value; }
    if (riskEl) { row.risk = riskEl.value; }
    TRACKER_PHASES.forEach(function(phase, pi) {
      phase.items_en.forEach(function(_, ii) {
        var cb = document.getElementById('trk-' + id + '-p' + pi + '-' + ii);
        if (cb) { row.checks['p' + pi + '-' + ii] = cb.checked; }
      });
    });
    data.rows.push(row);
  });
  try { localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
}

function trkLoad() {
  try {
    var raw = localStorage.getItem(TRACKER_STORAGE_KEY);
    if (!raw) { return false; }
    var data = JSON.parse(raw);
    if (!data || !Array.isArray(data.rows) || data.rows.length === 0) { return false; }
    data.rows.forEach(function(row) { trackerAddRow(row); });
    return true;
  } catch (e) { return false; }
}

function trackerReset() {
  if (!confirm('Alle Daten zurücksetzen? / Reset all data?')) { return; }
  trackerRowIds.slice().forEach(function(id) { trkRemoveRow(id); });
  trackerRowIds = [];
  var tbody = document.getElementById('trackerBody');
  if (tbody) { tbody.innerHTML = ''; }
  try { localStorage.removeItem(TRACKER_STORAGE_KEY); } catch (e) {}
  trkOverallProg();
}

function trackerExport() {
  var welle = '';
  try { welle = localStorage.getItem(WELLE_STORAGE_KEY) || '?'; } catch (e) { welle = '?'; }
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Sprint Tracker \u2014 Welle ' + welle + '</title>';
  html += '<style>body{font-family:Arial,sans-serif;font-size:13px;padding:20px;color:#111}h2{margin-bottom:16px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px 10px;vertical-align:top;text-align:left}th{background:#f0f0f0;font-weight:700;font-size:11px;text-transform:uppercase}.chk-done{color:#16a34a}.chk-open{color:#9ca3af}.prog{font-weight:800}</style>';
  html += '</head><body><h2>Sprint Tracker \u2014 Welle ' + welle + '</h2><table><thead><tr>';
  html += '<th>App-Name</th><th>Verantwortlicher</th><th>Phase 0</th><th>Phase 1</th><th>Phase 2</th><th>Phase 3</th><th>Phase 4</th><th>Fortschritt</th><th>Risiken / Kommentar</th>';
  html += '</tr></thead><tbody>';
  trackerRowIds.forEach(function(id) {
    var nameEl = document.getElementById('trk-name-' + id);
    var personEl = document.getElementById('trk-person-' + id);
    var riskEl = document.getElementById('trk-risk-' + id);
    var progEl = document.getElementById('trk-pt-' + id);
    html += '<tr>';
    html += '<td>' + escHtml(nameEl ? nameEl.value : '') + '</td>';
    html += '<td>' + escHtml(personEl ? personEl.value : '') + '</td>';
    TRACKER_PHASES.forEach(function(phase, pi) {
      html += '<td>';
      phase.items_de.forEach(function(item, ii) {
        var cb = document.getElementById('trk-' + id + '-p' + pi + '-' + ii);
        var checked = cb && cb.checked;
        html += '<div class="' + (checked ? 'chk-done' : 'chk-open') + '">' + (checked ? '\u2713' : '\u25cb') + ' ' + item + '</div>';
      });
      html += '</td>';
    });
    html += '<td class="prog">' + (progEl ? progEl.textContent : '0%') + '</td>';
    html += '<td>' + escHtml(riskEl ? riskEl.value : '').replace(/\n/g, '<br>') + '</td>';
    html += '</tr>';
  });
  html += '</tbody></table></body></html>';
  var blob = new Blob([html], { type: 'text/html' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'sprint-tracker-welle-' + welle + '.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── REFLEKTIONSFRAGEN ──────────────────────────────────────────
function rfSave() {
  var data = {};
  RF_QUESTIONS.forEach(function(q) {
    var ta = document.getElementById('rfq-' + q.id);
    if (ta) { data[q.id] = ta.value; }
  });
  try { localStorage.setItem(REFLEKTION_STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
}

function rfLoad() {
  try {
    var raw = localStorage.getItem(REFLEKTION_STORAGE_KEY);
    if (!raw) { return; }
    var data = JSON.parse(raw);
    RF_QUESTIONS.forEach(function(q) {
      var ta = document.getElementById('rfq-' + q.id);
      if (ta && data[q.id]) { ta.value = data[q.id]; }
    });
  } catch (e) {}
}

function rfReset() {
  if (!confirm('Alle Antworten löschen? / Delete all answers?')) { return; }
  RF_QUESTIONS.forEach(function(q) {
    var ta = document.getElementById('rfq-' + q.id);
    if (ta) { ta.value = ''; }
  });
  try { localStorage.removeItem(REFLEKTION_STORAGE_KEY); } catch (e) {}
}

function rfExport() {
  var welle = '';
  try { welle = localStorage.getItem(WELLE_STORAGE_KEY) || '?'; } catch (e) { welle = '?'; }
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reflektionsfragen \u2014 Welle ' + welle + '</title>';
  html += '<style>body{font-family:Arial,sans-serif;font-size:14px;padding:20px;color:#111}h2{margin-bottom:16px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:12px 14px;vertical-align:top}th{background:#f0f0f0;font-weight:700;width:35%}</style>';
  html += '</head><body><h2>Reflektionsfragen \u2014 Welle ' + welle + '</h2><table>';
  RF_QUESTIONS.forEach(function(q) {
    var ta = document.getElementById('rfq-' + q.id);
    var answer = ta ? escHtml(ta.value).replace(/\n/g, '<br>') : '';
    html += '<tr><th>' + q.de + '</th><td>' + answer + '</td></tr>';
  });
  html += '</table></body></html>';
  var blob = new Blob([html], { type: 'text/html' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'reflektionsfragen-welle-' + welle + '.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function rfCopy() {
  var lines = [];
  RF_QUESTIONS.forEach(function(q) {
    var ta = document.getElementById('rfq-' + q.id);
    lines.push(q.de);
    lines.push(ta ? ta.value : '');
    lines.push('');
  });
  var text = lines.join('\n');
  var btn = document.getElementById('rfCopyBtn');
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function() {
      if (btn) {
        var origHTML = btn.innerHTML;
        btn.innerHTML = '<span>\u2713 Copied!</span>';
        btn.classList.add('rfq-copy-flash');
        setTimeout(function() { btn.innerHTML = origHTML; btn.classList.remove('rfq-copy-flash'); }, 2000);
      }
    }).catch(function() {});
  } else {
    // Fallback for older browsers
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    if (btn) {
      var origHTML2 = btn.innerHTML;
      btn.innerHTML = '<span>\u2713 Copied!</span>';
      setTimeout(function() { btn.innerHTML = origHTML2; }, 2000);
    }
  }
}

function initNavScrollEffect() {
  window.addEventListener('scroll', function() {
    var nav = document.getElementById('nav');
    if (!nav) {
      return;
    }
    nav.style.boxShadow = window.scrollY > 20 ? '0 1px 30px rgba(0,0,0,0.4)' : 'none';
  }, { passive: true });
}

function initVideoGuides() {
  var videos = document.querySelectorAll('.guide-video');
  if (!videos.length) {
    return;
  }

  function toTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) {
      return '00:00';
    }
    var total = Math.floor(sec);
    var mins = String(Math.floor(total / 60)).padStart(2, '0');
    var secs = String(total % 60).padStart(2, '0');
    return mins + ':' + secs;
  }

  videos.forEach(function(video) {
    video.loop = false;
    var card = video.closest('.media-card') || video.parentElement;
    if (!card) {
      return;
    }

    var speedSelect = card.querySelector('.video-speed');
    var durationEl = card.querySelector('.video-duration');
    var remainingEl = card.querySelector('.video-remaining');

    function updateTimes() {
      if (durationEl) {
        durationEl.textContent = toTime(video.duration || 0);
      }
      if (remainingEl) {
        remainingEl.textContent = toTime((video.duration || 0) - (video.currentTime || 0));
      }
    }

    video.addEventListener('loadedmetadata', updateTimes);
    video.addEventListener('timeupdate', updateTimes);
    video.addEventListener('ended', function() {
      updateTimes();
    });

    if (speedSelect) {
      speedSelect.addEventListener('change', function() {
        var rate = parseFloat(speedSelect.value);
        if (Number.isFinite(rate) && rate > 0) {
          video.playbackRate = rate;
        }
      });
      video.playbackRate = parseFloat(speedSelect.value) || 1;
    }

    updateTimes();
  });
}

// ─── BOOTSTRAP ──────────────────────────────────────────────────
async function initApp() {
  await loadPartials();
  setLang(currentLang);
  initRevealObserver();

  // Welle number
  loadWelleNumber();

  // Dashboard tracker
  var hadSaved = trkLoad();
  if (!hadSaved) {
    trackerAddRow(null); // start with one blank row
  }
  trkOverallProg();

  // Reflektionsfragen
  rfLoad();

  initPhaseJump();
  initChecklistDropdowns();
  initMainPhaseDropdowns();
  initNavScrollEffect();
  initVideoGuides();
}

window.addEventListener('DOMContentLoaded', initApp);
