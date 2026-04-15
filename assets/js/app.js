// ─── GLOBAL STATE ───────────────────────────────────────────────
var currentTheme = 'light';
var currentLang = 'en';
var CHECKLIST_STORAGE_KEY = 'wmc_sprint_tracker_checks_v1';
var TOTAL_ITEMS = 0;

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

// ─── CHECKLIST STATE ────────────────────────────────────────────
function saveChecklistState() {
  try {
    var state = [];
    document.querySelectorAll('.chk-item').forEach(function(item) {
      state.push(item.classList.contains('done'));
    });
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    // ignore storage failures
  }
}

function loadChecklistState() {
  try {
    var raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (!raw) {
      return;
    }
    var state = JSON.parse(raw);
    if (!Array.isArray(state)) {
      return;
    }
    var items = document.querySelectorAll('.chk-item');
    items.forEach(function(item, idx) {
      item.classList.toggle('done', Boolean(state[idx]));
    });
  } catch (err) {
    // ignore parsing/storage errors
  }
}

function toggleChk(el) {
  el.classList.toggle('done');
  updateProg();
  saveChecklistState();
}

function updateProg() {
  var bar = document.getElementById('pgBar');
  var label = document.getElementById('pgLabel');
  var doneBanner = document.getElementById('done-banner');
  if (!bar || !label || !doneBanner) {
    return;
  }

  var done = document.querySelectorAll('.chk-item.done').length;
  var pct = TOTAL_ITEMS > 0 ? Math.round((done / TOTAL_ITEMS) * 100) : 0;
  bar.style.width = pct + '%';
  label.textContent = done + ' / ' + TOTAL_ITEMS + ' completed';
  doneBanner.style.display = done === TOTAL_ITEMS && TOTAL_ITEMS > 0 ? 'block' : 'none';
}

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
  var groups = document.querySelectorAll('#progress-wrap .check-group');
  groups.forEach(function(group) {
    var title = group.querySelector('.check-section-title');
    if (!title) {
      return;
    }
    group.classList.add('collapsed');
    title.setAttribute('role', 'button');
    title.setAttribute('tabindex', '0');
    title.addEventListener('click', function() {
      group.classList.toggle('collapsed');
    });
    title.addEventListener('keydown', function(ev) {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        group.classList.toggle('collapsed');
      }
    });
  });
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

// ─── BOOTSTRAP ──────────────────────────────────────────────────
async function initApp() {
  await loadPartials();
  setLang(currentLang);
  initRevealObserver();

  TOTAL_ITEMS = document.querySelectorAll('.chk-item').length;
  loadChecklistState();
  updateProg();

  initPhaseJump();
  initChecklistDropdowns();
  initMainPhaseDropdowns();
  initNavScrollEffect();
}

window.addEventListener('DOMContentLoaded', initApp);
