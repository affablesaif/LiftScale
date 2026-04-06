// ═══════════════════════════════════════════════
// LIFTSCALE — app.js
// Handles: all 5 sections logic, state, UI
// Log | History | Progress | Stats | Profile
// ═══════════════════════════════════════════════

// ─── DEFAULT STATE ───────────────────────────────
function defaultState() {
  return {
    unit: 'kg',
    workouts: [],
    // workouts: [{
    //   id, date, type:'strength'|'cardio',
    //   exercise, sets:[{weight,reps}],
    //   cardio:{type,mins,dist}
    // }]
    prs: {},
    // prs: { exerciseName: { weight, reps, date, workoutId } }
    checkins: [],
    // checkins: [{ date, weight }]
    customExercises: [],
    profile: {
      name: '',
      gender: '',
      height: 0,
      weight: 0,
      goal: 'build'
    }
  };
}

let S = defaultState();

// ─── PRESET EXERCISES ────────────────────────────
const PRESET_EXERCISES = [
  // Chest
  'Bench Press','Incline Bench Press','Decline Bench Press',
  'Dumbbell Fly','Cable Fly','Push-Up','Chest Dip',
  // Back
  'Deadlift','Pull-Up','Chin-Up','Barbell Row','Dumbbell Row',
  'Lat Pulldown','Cable Row','T-Bar Row','Face Pull',
  // Shoulders
  'Overhead Press','Dumbbell Shoulder Press','Arnold Press',
  'Lateral Raise','Front Raise','Reverse Fly','Shrug',
  // Arms
  'Barbell Curl','Dumbbell Curl','Hammer Curl','Preacher Curl',
  'Tricep Dip','Skull Crusher','Tricep Pushdown','Overhead Tricep Extension',
  // Legs
  'Squat','Front Squat','Leg Press','Hack Squat',
  'Romanian Deadlift','Leg Curl','Leg Extension',
  'Calf Raise','Bulgarian Split Squat','Lunge',
  // Core
  'Plank','Crunch','Leg Raise','Russian Twist','Ab Wheel','Cable Crunch'
];

// ─── SESSION (current workout being built) ───────
let session = {
  type: 'strength',
  exercise: '',
  sets: []
};

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
function initApp() {
  populateExerciseSelect();
  renderLogDayTitle();
  renderSetList();
  renderHistory();
  renderProgress();
  renderStats();
  renderProfile();
  updateStreakBadge();
  const firstNav = document.querySelector('.nav-item');
  if (firstNav) showScreen('log', firstNav);
}

// ═══════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════
function showScreen(name, btn) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(b) { b.classList.remove('active'); });
  const screen = document.getElementById('screen-' + name);
  if (screen) screen.classList.add('active');
  if (btn) btn.classList.add('active');
  if (name === 'history')  renderHistory();
  if (name === 'progress') renderProgress();
  if (name === 'stats')    renderStats();
  if (name === 'profile')  renderProfile();
}

// ═══════════════════════════════════════════════
// LOG TAB
// ═══════════════════════════════════════════════

function renderLogDayTitle() {
  const now    = new Date();
  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const label  = days[now.getDay()] + ', ' + now.getDate() + ' ' + months[now.getMonth()];
  const el = document.getElementById('log-day-title');
  if (el) el.textContent = label;
  const hd = document.getElementById('header-date');
  if (hd) hd.textContent = label;
}

function populateExerciseSelect() {
  const sel = document.getElementById('exercise-select');
  if (!sel) return;
  const all = [...PRESET_EXERCISES, ...(S.customExercises || [])].sort();
  sel.innerHTML = all.map(function(e) {
    return '<option value="' + e + '">' + e + '</option>';
  }).join('');
  if (all.length > 0) session.exercise = all[0];
}

function setWorkoutType(type) {
  session.type = type;
  document.getElementById('strength-inputs').style.display = type === 'strength' ? 'block' : 'none';
  document.getElementById('cardio-inputs').style.display   = type === 'cardio'   ? 'block' : 'none';
  document.getElementById('type-strength').classList.toggle('active', type === 'strength');
  document.getElementById('type-cardio').classList.toggle('active',   type === 'cardio');
}

function addSet() {
  const ex   = document.getElementById('exercise-select').value;
  const wt   = parseFloat(document.getElementById('weight-input').value);
  const reps = parseInt(document.getElementById('reps-input').value);
  if (!ex || isNaN(wt) || wt < 0 || isNaN(reps) || reps < 1) {
    showToast('Fill in weight and reps first');
    return;
  }
  session.exercise = ex;
  session.sets.push({ weight: wt, reps: reps });
  document.getElementById('reps-input').value = '';
  renderSetList();
  document.getElementById('reps-input').focus();
}

function removeSet(i) {
  session.sets.splice(i, 1);
  renderSetList();
}

function renderSetList() {
  const container = document.getElementById('set-list');
  if (!container) return;
  if (session.sets.length === 0) {
    container.innerHTML = '<div class="empty-state">No sets yet — add your first one above</div>';
    return;
  }
  container.innerHTML = session.sets.map(function(s, i) {
    return '<div class="set-item">' +
      '<div class="set-number">Set ' + (i + 1) + '</div>' +
      '<div class="set-details">' + s.weight + S.unit + ' \u00d7 ' + s.reps + ' reps</div>' +
      '<button class="btn-icon-sm" onclick="removeSet(' + i + ')">&#x2715;</button>' +
    '</div>';
  }).join('');
}

async function saveWorkout() {
  if (session.type === 'strength') {
    if (session.sets.length === 0) { showToast('Add at least one set first'); return; }
    const workout = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: 'strength',
      exercise: session.exercise,
      sets: session.sets.slice()
    };
    S.workouts.push(workout);
    checkPR(workout);
    session.sets = [];
    renderSetList();
    document.getElementById('weight-input').value = '';
    document.getElementById('reps-input').value   = '';
    showToast('Workout saved!');
  } else {
    const type = document.getElementById('cardio-select').value;
    const mins = parseInt(document.getElementById('cardio-duration').value);
    const dist = parseFloat(document.getElementById('cardio-distance').value) || 0;
    if (!mins || mins < 1) { showToast('Enter duration in minutes'); return; }
    S.workouts.push({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: 'cardio',
      cardio: { type: type, mins: mins, dist: dist }
    });
    document.getElementById('cardio-duration').value = '';
    document.getElementById('cardio-distance').value = '';
    showToast('Cardio logged!');
  }
  updateStreakBadge();
  await save();
}

// ─── CUSTOM EXERCISE MODAL ───────────────────────
function openAddExerciseModal() {
  document.getElementById('custom-ex-modal').classList.add('active');
  document.getElementById('custom-ex-input').value = '';
  setTimeout(function() { document.getElementById('custom-ex-input').focus(); }, 100);
}

function closeModal() {
  document.getElementById('custom-ex-modal').classList.remove('active');
}

async function saveCustomExercise() {
  const name = document.getElementById('custom-ex-input').value.trim();
  if (!name) { showToast('Enter an exercise name'); return; }
  if (!S.customExercises) S.customExercises = [];
  if (S.customExercises.includes(name) || PRESET_EXERCISES.includes(name)) {
    showToast('Exercise already exists');
    return;
  }
  S.customExercises.push(name);
  populateExerciseSelect();
  const sel = document.getElementById('exercise-select');
  if (sel) sel.value = name;
  closeModal();
  showToast(name + ' added!');
  await save();
}

// ═══════════════════════════════════════════════
// PR LOGIC
// ═══════════════════════════════════════════════
function checkPR(workout) {
  if (workout.type !== 'strength' || !workout.sets || workout.sets.length === 0) return;
  const ex = workout.exercise;
  const bestSet = workout.sets.reduce(function(best, s) {
    return s.weight > best.weight ? s : best;
  }, { weight: -1, reps: 0 });
  if (bestSet.weight < 0) return;
  const existing = S.prs[ex];
  if (!existing || bestSet.weight > existing.weight) {
    S.prs[ex] = {
      weight: bestSet.weight,
      reps: bestSet.reps,
      date: workout.date,
      workoutId: workout.id
    };
    showPRPopup(ex, bestSet.weight, bestSet.reps);
  }
}

function showPRPopup(exercise, weight, reps) {
  const popup = document.getElementById('pr-popup');
  if (!popup) return;
  document.getElementById('pr-popup-exercise').textContent = exercise;
  document.getElementById('pr-popup-weight').textContent   = weight + S.unit + ' \u00d7 ' + reps + ' reps';
  popup.classList.add('active');
  spawnConfetti();
}

function closePRPopup() {
  const popup = document.getElementById('pr-popup');
  if (popup) popup.classList.remove('active');
  const c = document.getElementById('pr-confetti');
  if (c) c.innerHTML = '';
}

function spawnConfetti() {
  const container = document.getElementById('pr-confetti');
  if (!container) return;
  container.innerHTML = '';
  const colors = ['#c8ff00','#ffffff','#ff4d4d','#4dc8ff','#ff9f00','#c84dff','#ff69b4'];
  for (let i = 0; i < 90; i++) {
    const p = document.createElement('div');
    const size = 6 + Math.random() * 8;
    p.style.cssText =
      'position:absolute;' +
      'left:' + (Math.random() * 100) + '%;' +
      'top:0;' +
      'width:' + size + 'px;' +
      'height:' + size + 'px;' +
      'background:' + colors[Math.floor(Math.random() * colors.length)] + ';' +
      'border-radius:' + (Math.random() > 0.5 ? '50%' : '2px') + ';' +
      'opacity:1;' +
      'animation:confettiFall ' + (0.8 + Math.random() * 1.4) + 's ease-out forwards;' +
      'animation-delay:' + (Math.random() * 0.5) + 's;' +
      'transform:rotate(' + (Math.random() * 360) + 'deg);';
    container.appendChild(p);
  }
}

// ═══════════════════════════════════════════════
// HISTORY TAB
// ═══════════════════════════════════════════════
function renderHistory() {
  const container = document.getElementById('history-list');
  if (!container) return;
  const workouts = (S.workouts || []).slice().reverse();
  if (workouts.length === 0) {
    container.innerHTML = '<div class="empty-state">No workouts yet \u2014 log your first session in the Log tab</div>';
    return;
  }
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  container.innerHTML = workouts.map(function(w) {
    const d       = new Date(w.date);
    const dateStr = d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    const dayStr  = days[d.getDay()];

    if (w.type === 'cardio' && w.cardio) {
      return '<div class="history-card">' +
        '<div class="history-card-header">' +
          '<div>' +
            '<div class="history-exercise">' + (w.cardio.type || 'Cardio') + '</div>' +
            '<div class="history-date">' + dayStr + ', ' + dateStr + '</div>' +
          '</div>' +
          '<div class="history-badge cardio-badge">Cardio</div>' +
        '</div>' +
        '<div class="history-meta">' +
          '<span>' + w.cardio.mins + ' min</span>' +
          (w.cardio.dist ? '<span>' + w.cardio.dist + ' km</span>' : '') +
        '</div>' +
      '</div>';
    }

    const totalVol = (w.sets || []).reduce(function(sum, s) { return sum + s.weight * s.reps; }, 0);
    const prSet    = (w.sets || []).reduce(function(best, s) { return s.weight > best.weight ? s : best; }, { weight: 0, reps: 0 });
    const isPR     = S.prs[w.exercise] && S.prs[w.exercise].workoutId === w.id;

    return '<div class="history-card">' +
      '<div class="history-card-header">' +
        '<div>' +
          '<div class="history-exercise">' + w.exercise + (isPR ? ' <span class="pr-badge">PR</span>' : '') + '</div>' +
          '<div class="history-date">' + dayStr + ', ' + dateStr + '</div>' +
        '</div>' +
        '<div class="history-sets-count">' + (w.sets || []).length + ' sets</div>' +
      '</div>' +
      '<div class="history-sets">' +
        (w.sets || []).map(function(s, i) {
          return '<div class="history-set-row">' +
            '<span class="history-set-num">Set ' + (i + 1) + '</span>' +
            '<span>' + s.weight + S.unit + ' \u00d7 ' + s.reps + ' reps</span>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div class="history-meta">' +
        '<span>Best: ' + prSet.weight + S.unit + '</span>' +
        '<span>Vol: ' + Math.round(totalVol) + S.unit + '</span>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ═══════════════════════════════════════════════
// PROGRESS TAB
// ═══════════════════════════════════════════════
function renderProgress() {
  renderVolumeChart();
  renderStreakDots();
  renderCheckinSection();
  renderBMITrend();
}

function renderVolumeChart() {
  const container = document.getElementById('volume-chart');
  if (!container) return;
  const now   = new Date();
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(now.getDate() - (i * 7 + now.getDay()));
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    const label = (start.getMonth() + 1) + '/' + start.getDate();
    const vol = (S.workouts || [])
      .filter(function(w) {
        const d = new Date(w.date);
        return w.type === 'strength' && d >= start && d <= end;
      })
      .reduce(function(sum, w) {
        return sum + (w.sets || []).reduce(function(s2, set) { return s2 + set.weight * set.reps; }, 0);
      }, 0);
    weeks.push({ label: label, vol: Math.round(vol) });
  }
  const maxVol = Math.max.apply(null, weeks.map(function(w) { return w.vol; }).concat([1]));

  container.innerHTML = '<div class="chart-bars">' +
    weeks.map(function(w) {
      const pct = Math.round((w.vol / maxVol) * 100);
      return '<div class="chart-bar-wrap">' +
        '<div class="chart-bar-val">' + (w.vol > 0 ? Math.round(w.vol / 1000) + 'k' : '') + '</div>' +
        '<div class="chart-bar-track">' +
          '<div class="chart-bar-fill" style="height:' + pct + '%"></div>' +
        '</div>' +
        '<div class="chart-bar-label">' + w.label + '</div>' +
      '</div>';
    }).join('') +
  '</div>';
}

function renderStreakDots() {
  const container = document.getElementById('streak-dots');
  if (!container) return;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dots = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const hasWorkout = (S.workouts || []).some(function(w) {
      const wd = new Date(w.date);
      wd.setHours(0, 0, 0, 0);
      return wd.getTime() === d.getTime();
    });
    dots.push({ date: d, active: hasWorkout });
  }
  container.innerHTML = dots.map(function(dot) {
    return '<div class="streak-dot' + (dot.active ? ' active' : '') + '"></div>';
  }).join('');
}

// ─── MONTHLY CHECK-IN ────────────────────────────
function renderCheckinSection() {
  const list = document.getElementById('checkin-history');
  if (!list) return;
  const checkins = (S.checkins || []).slice().reverse();
  if (checkins.length === 0) {
    list.innerHTML = '<div class="empty-state">No check-ins yet \u2014 log your first weight below</div>';
    return;
  }
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  list.innerHTML = checkins.map(function(c) {
    const d   = new Date(c.date);
    const bmi = calcBMI(c.weight, S.profile.height);
    return '<div class="checkin-row">' +
      '<div>' +
        '<div class="checkin-weight">' + c.weight + S.unit + '</div>' +
        '<div class="checkin-date">' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear() + '</div>' +
      '</div>' +
      (bmi ? '<div class="checkin-bmi">BMI ' + bmi + '</div>' : '') +
    '</div>';
  }).join('');
}

async function saveCheckin() {
  const input = document.getElementById('checkin-weight');
  if (!input) return;
  const weight = parseFloat(input.value);
  if (!weight || weight < 20 || weight > 500) { showToast('Enter a valid weight'); return; }
  if (!S.checkins) S.checkins = [];
  S.checkins.push({ date: new Date().toISOString(), weight: weight });
  S.profile.weight = weight;
  input.value = '';
  renderCheckinSection();
  renderBMITrend();
  renderProfile();
  showToast('Weight logged!');
  await save();
}

function renderBMITrend() {
  const container = document.getElementById('bmi-trend');
  if (!container) return;
  if (!S.checkins || S.checkins.length < 2 || !S.profile.height) {
    container.innerHTML = '<div class="empty-state">Log at least 2 weight check-ins to see your BMI trend</div>';
    return;
  }
  const last6  = S.checkins.slice(-6);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const bmiVals = last6.map(function(c) { return parseFloat(calcBMI(c.weight, S.profile.height)) || 0; });
  const maxBMI  = Math.max.apply(null, bmiVals.concat([1]));

  container.innerHTML = '<div class="chart-bars">' +
    last6.map(function(c, i) {
      const bmi = bmiVals[i];
      const pct = Math.round((bmi / maxBMI) * 100);
      const d   = new Date(c.date);
      return '<div class="chart-bar-wrap">' +
        '<div class="chart-bar-val">' + bmi + '</div>' +
        '<div class="chart-bar-track">' +
          '<div class="chart-bar-fill bmi-bar-fill" style="height:' + pct + '%"></div>' +
        '</div>' +
        '<div class="chart-bar-label">' + months[d.getMonth()] + '</div>' +
      '</div>';
    }).join('') +
  '</div>';
}

// ═══════════════════════════════════════════════
// STATS TAB
// ═══════════════════════════════════════════════
function renderStats() {
  const workouts  = S.workouts || [];
  const strengthW = workouts.filter(function(w) { return w.type === 'strength'; });
  const cardioW   = workouts.filter(function(w) { return w.type === 'cardio'; });
  const totalVol  = strengthW.reduce(function(sum, w) {
    return sum + (w.sets || []).reduce(function(s2, s) { return s2 + s.weight * s.reps; }, 0);
  }, 0);
  const cardioMins = cardioW.reduce(function(sum, w) { return sum + (w.cardio ? w.cardio.mins : 0); }, 0);
  const prCount    = Object.keys(S.prs || {}).length;

  function el(id) { return document.getElementById(id); }
  if (el('stat-workouts'))    el('stat-workouts').textContent    = workouts.length;
  if (el('stat-volume'))      el('stat-volume').textContent      = totalVol >= 1000 ? (totalVol / 1000).toFixed(1) + 'k' : Math.round(totalVol);
  if (el('stat-vol-unit'))    el('stat-vol-unit').textContent    = S.unit;
  if (el('stat-prs'))         el('stat-prs').textContent         = prCount;
  if (el('stat-cardio-mins')) el('stat-cardio-mins').textContent = cardioMins;

  renderPRList();
}

function renderPRList() {
  const container = document.getElementById('pr-list');
  if (!container) return;
  const prs  = S.prs || {};
  const keys = Object.keys(prs);
  if (keys.length === 0) {
    container.innerHTML = '<div class="empty-state">No PRs yet \u2014 log some sets and beat your bests!</div>';
    return;
  }
  keys.sort(function(a, b) { return prs[b].weight - prs[a].weight; });
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  container.innerHTML = keys.map(function(ex) {
    const pr      = prs[ex];
    const d       = new Date(pr.date);
    const dateStr = d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    return '<div class="pr-row">' +
      '<div class="pr-row-left">' +
        '<div class="pr-row-exercise">\uD83C\uDFC6 ' + ex + '</div>' +
        '<div class="pr-row-date">Set on ' + dateStr + '</div>' +
      '</div>' +
      '<div class="pr-row-weight">' + pr.weight + S.unit + ' \u00d7 ' + pr.reps + '</div>' +
    '</div>';
  }).join('');
}

// ═══════════════════════════════════════════════
// PROFILE TAB
// ═══════════════════════════════════════════════
function renderProfile() {
  const p = S.profile || {};

  // Avatar initials
  const avatarEl = document.getElementById('profile-avatar');
  if (avatarEl) {
    const initials = p.name
      ? p.name.trim().split(' ').map(function(n) { return n[0]; }).join('').toUpperCase().slice(0, 2)
      : '?';
    avatarEl.textContent = initials;
  }

  const nameDisplay = document.getElementById('profile-name-display');
  if (nameDisplay) nameDisplay.textContent = p.name || 'Your Name';

  const emailDisplay = document.getElementById('profile-email-display');
  if (emailDisplay && typeof currentUser !== 'undefined' && currentUser)
    emailDisplay.textContent = currentUser.email || '';

  const goalBadge = document.getElementById('profile-goal-badge');
  if (goalBadge) {
    const goalLabels = { lose: 'Lose weight', maintain: 'Stay healthy', build: 'Build muscle' };
    goalBadge.textContent = goalLabels[p.goal] || '';
  }

  // BMI
  const bmi    = calcBMI(p.weight, p.height);
  const bmiEl  = document.getElementById('bmi-number');
  if (bmiEl) bmiEl.textContent = bmi || '\u2014';

  const bmiCatEl = document.getElementById('bmi-category');
  if (bmiCatEl) {
    const cat = getBMICategory(parseFloat(bmi));
    bmiCatEl.textContent  = cat;
    bmiCatEl.className    = 'bmi-category' + (cat ? ' bmi-' + cat.toLowerCase() : '');
  }

  // BMI marker (map bmi 15–40 → 0–100%)
  const marker = document.getElementById('bmi-marker');
  if (marker && bmi) {
    const bmiVal = parseFloat(bmi);
    const pct    = Math.min(100, Math.max(0, ((bmiVal - 15) / 25) * 100));
    marker.style.left = pct + '%';
  }

  const hDisp = document.getElementById('profile-height-display');
  if (hDisp) hDisp.textContent = p.height ? p.height + (S.unit === 'kg' ? ' cm' : ' ft') : '\u2014';

  const wDisp = document.getElementById('profile-weight-display');
  if (wDisp) wDisp.textContent = p.weight ? p.weight + S.unit : '\u2014';

  // Fill edit inputs
  const nameIn = document.getElementById('profile-name-input');
  if (nameIn) nameIn.value = p.name || '';

  const heightIn = document.getElementById('profile-height-input');
  if (heightIn) heightIn.value = p.height || '';

  const weightIn = document.getElementById('profile-weight-input');
  if (weightIn) weightIn.value = p.weight || '';

  const goalIn = document.getElementById('profile-goal-input');
  if (goalIn) goalIn.value = p.goal || 'build';

  // Unit toggle
  const kgBtn = document.getElementById('unit-kg');
  const lbBtn = document.getElementById('unit-lb');
  if (kgBtn) kgBtn.classList.toggle('active', S.unit === 'kg');
  if (lbBtn) lbBtn.classList.toggle('active', S.unit === 'lb');
}

async function saveProfile() {
  S.profile.name   = (document.getElementById('profile-name-input').value   || '').trim();
  S.profile.height = parseFloat(document.getElementById('profile-height-input').value)  || 0;
  S.profile.weight = parseFloat(document.getElementById('profile-weight-input').value)  || 0;
  S.profile.goal   = document.getElementById('profile-goal-input').value || 'build';
  renderProfile();
  showToast('Profile saved!');
  await save();
}

async function setUnit(unit) {
  S.unit = unit;
  renderProfile();
  renderStats();
  renderSetList();
  await save();
}

async function clearAllData() {
  if (!confirm('This will permanently delete all your workouts, PRs, and check-ins. Are you sure?')) return;
  const profileBackup = JSON.parse(JSON.stringify(S.profile));
  const unitBackup    = S.unit;
  S         = defaultState();
  S.profile = profileBackup;
  S.unit    = unitBackup;
  renderHistory();
  renderProgress();
  renderStats();
  renderProfile();
  updateStreakBadge();
  showToast('All data cleared');
  await save();
}

// ═══════════════════════════════════════════════
// BMI HELPERS
// ═══════════════════════════════════════════════
function calcBMI(weight, height) {
  if (!weight || !height || weight <= 0 || height <= 0) return null;
  let w = weight;
  let h = height;
  if (S.unit === 'lb') {
    w = weight * 0.453592;
    h = height * 30.48;
  }
  const hm  = h / 100;
  const bmi = w / (hm * hm);
  return bmi.toFixed(1);
}

function getBMICategory(bmi) {
  if (!bmi || isNaN(bmi)) return '';
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25)   return 'Normal';
  if (bmi < 30)   return 'Overweight';
  return 'Obese';
}

// ═══════════════════════════════════════════════
// STREAK BADGE
// ═══════════════════════════════════════════════
function updateStreakBadge() {
  const badge = document.getElementById('streak-badge');
  if (!badge) return;
  const streak = calcStreak();
  if (streak > 0) {
    badge.textContent    = '\uD83D\uDD25 ' + streak;
    badge.style.display  = 'flex';
  } else {
    badge.textContent    = '';
    badge.style.display  = 'none';
  }
}

function calcStreak() {
  if (!S.workouts || S.workouts.length === 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  let check  = new Date(today);
  while (true) {
    const ts = check.getTime();
    const hasWorkout = S.workouts.some(function(w) {
      const d = new Date(w.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === ts;
    });
    if (!hasWorkout) break;
    streak++;
    check.setDate(check.getDate() - 1);
  }
  return streak;
}

// ═══════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function() {
    toast.classList.remove('show');
  }, 2500);
}

// ═══════════════════════════════════════════════
// CONFETTI KEYFRAME — injected once into <head>
// ═══════════════════════════════════════════════
(function() {
  if (document.getElementById('confetti-style')) return;
  const style = document.createElement('style');
  style.id = 'confetti-style';
  style.textContent =
    '@keyframes confettiFall {' +
    '0%   { transform: translateY(-10px) rotate(0deg);   opacity: 1; }' +
    '100% { transform: translateY(350px) rotate(720deg); opacity: 0; }' +
    '}';
  document.head.appendChild(style);
})();
