// ═══════════════════════════════════════════════
// LIFTSCALE — app.js  (v2)
// ═══════════════════════════════════════════════

function defaultState() {
  return {
    unit: 'kg',
    workouts: [],
    prs: {},
    checkins: [],
    customExercises: [],
    profile: { name:'', gender:'', height:0, weight:0, goal:'build' }
  };
}
let S = defaultState();

// ═══════════════════════════════════════════════
// EXERCISE LIBRARY
// ═══════════════════════════════════════════════
const PRESET_EXERCISES = [
  // ── CHEST
  'Bench Press','Incline Bench Press','Decline Bench Press',
  'Close-Grip Bench Press','Dumbbell Bench Press','Incline Dumbbell Press',
  'Dumbbell Fly','Incline Dumbbell Fly','Cable Fly','Low Cable Fly',
  'High Cable Fly','Pec Deck','Push-Up','Wide Push-Up','Diamond Push-Up',
  'Chest Dip','Landmine Press',
  // ── BACK
  'Deadlift','Sumo Deadlift','Romanian Deadlift','Stiff-Leg Deadlift',
  'Pull-Up','Chin-Up','Wide-Grip Pull-Up','Neutral-Grip Pull-Up',
  'Barbell Row','Pendlay Row','Dumbbell Row','Single-Arm Dumbbell Row',
  'Lat Pulldown','Wide-Grip Lat Pulldown','Close-Grip Lat Pulldown',
  'Seated Cable Row','T-Bar Row','Chest-Supported Row',
  'Face Pull','Straight-Arm Pulldown','Back Extension','Good Morning',
  // ── SHOULDERS
  'Overhead Press','Seated Dumbbell Press','Arnold Press',
  'Lateral Raise','Cable Lateral Raise','Dumbbell Front Raise',
  'Cable Front Raise','Reverse Fly','Bent-Over Lateral Raise',
  'Upright Row','Barbell Shrug','Dumbbell Shrug','Face Pull',
  'Landmine Lateral Raise',
  // ── BICEPS
  'Barbell Curl','EZ-Bar Curl','Dumbbell Curl','Alternating Dumbbell Curl',
  'Hammer Curl','Cross-Body Hammer Curl','Preacher Curl','Spider Curl',
  'Concentration Curl','Cable Curl','Incline Dumbbell Curl',
  'Zottman Curl','Reverse Curl',
  // ── TRICEPS
  'Tricep Dip','Bench Dip','Skull Crusher','EZ-Bar Skull Crusher',
  'Tricep Pushdown','Rope Pushdown','Overhead Tricep Extension',
  'Dumbbell Overhead Tricep Extension','Close-Grip Push-Up',
  'Diamond Push-Up','Kickback','Single-Arm Pushdown',
  // ── LEGS — QUADS
  'Squat','Front Squat','Hack Squat','Leg Press','45-Degree Leg Press',
  'Bulgarian Split Squat','Lunge','Walking Lunge','Reverse Lunge',
  'Step-Up','Box Squat','Goblet Squat','Leg Extension','Wall Sit',
  // ── LEGS — HAMSTRINGS & GLUTES
  'Romanian Deadlift','Leg Curl','Seated Leg Curl','Lying Leg Curl',
  'Nordic Curl','Glute Bridge','Hip Thrust','Single-Leg Hip Thrust',
  'Sumo Squat','Cable Kickback','Donkey Kick','Good Morning',
  // ── CALVES
  'Standing Calf Raise','Seated Calf Raise','Leg Press Calf Raise',
  'Single-Leg Calf Raise','Donkey Calf Raise',
  // ── CORE
  'Plank','Side Plank','Hollow Hold','Dead Bug',
  'Crunch','Bicycle Crunch','Reverse Crunch','Decline Crunch',
  'Leg Raise','Hanging Leg Raise','Hanging Knee Raise',
  'Russian Twist','Cable Crunch','Ab Wheel Rollout',
  'Woodchop','Pallof Press','Dragon Flag','L-Sit',
  // ── OLYMPIC & POWER
  'Clean and Jerk','Snatch','Power Clean','Hang Clean',
  'Push Press','Push Jerk','Split Jerk','Hang Snatch',
  // ── CALISTHENICS
  'Muscle-Up','Bar Dip','Ring Dip','Ring Push-Up',
  'Pistol Squat','Handstand Push-Up','Pike Push-Up',
  'Australian Pull-Up','Tuck Planche','Front Lever Row',
  // ── MACHINES
  'Chest Press Machine','Shoulder Press Machine','Rowing Machine',
  'Leg Press Machine','Leg Curl Machine','Leg Extension Machine',
  'Pec Deck Machine','Cable Crossover','Smith Machine Squat',
  'Smith Machine Bench Press','Smith Machine Row',
  // ── FULL BODY / OTHER
  'Thruster','Kettlebell Swing','Kettlebell Goblet Squat',
  'Kettlebell Clean','Kettlebell Press','Farmer Carry',
  'Battle Ropes','Sled Push','Sled Pull','Tire Flip',
  'Box Jump','Broad Jump','Burpee'
];

// ═══════════════════════════════════════════════
// CARDIO ACTIVITIES
// ═══════════════════════════════════════════════
const CARDIO_ACTIVITIES = [
  // Standard cardio
  'Running','Treadmill','Cycling','Indoor Cycling','Swimming',
  'Rowing','Elliptical','Stair Climber','Jump Rope','Walking',
  'HIIT','Circuit Training',
  // Sports
  'Football','Basketball','Tennis','Badminton','Squash','Table Tennis',
  'Boxing','Kickboxing','MMA','Wrestling','Judo','Muay Thai',
  'HEMA','Fencing','Rock Climbing','Bouldering',
  // Outdoor
  'Hiking','Trail Running','Kayaking','Canoeing','Surfing',
  'Skateboarding','Skiing','Snowboarding','Cycling (Outdoor)',
  'Stand-Up Paddleboarding',
  // Just for fun 😄
  'Sex'
];

const INTENSITY_LEVELS = [
  { value:'low',      label:'Low',      desc:'Light effort, easy breathing' },
  { value:'moderate', label:'Moderate', desc:'Steady effort, can hold a conversation' },
  { value:'high',     label:'High',     desc:'Hard effort, difficult to speak' },
  { value:'maximum',  label:'Maximum',  desc:'All-out, unsustainable' }
];

// ─── SESSION ─────────────────────────────────────
let session = { type:'strength', exercise:'', sets:[] };

// ─── HISTORY FILTER ──────────────────────────────
let historyFilter = 'all'; // 'all' | 'week' | 'month' | 'year'

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
function initApp() {
  populateExerciseSelect();
  populateCardioSelect();
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
  document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(b){ b.classList.remove('active'); });
  var screen = document.getElementById('screen-' + name);
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
  var now    = new Date();
  var days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var label  = days[now.getDay()] + ', ' + now.getDate() + ' ' + months[now.getMonth()];
  var el = document.getElementById('log-day-title');
  if (el) el.textContent = label;
  var hd = document.getElementById('header-date');
  if (hd) hd.textContent = label;
}

function populateExerciseSelect() {
  var sel = document.getElementById('exercise-select');
  if (!sel) return;
  var all = PRESET_EXERCISES.concat(S.customExercises || []).sort();
  sel.innerHTML = all.map(function(e){ return '<option value="'+e+'">'+e+'</option>'; }).join('');
  if (all.length > 0) session.exercise = all[0];
}

function populateCardioSelect() {
  var sel = document.getElementById('cardio-select');
  if (!sel) return;
  sel.innerHTML = CARDIO_ACTIVITIES.map(function(a){ return '<option value="'+a+'">'+a+'</option>'; }).join('');
}

function setWorkoutType(type) {
  session.type = type;
  document.getElementById('strength-inputs').style.display = type === 'strength' ? 'block' : 'none';
  document.getElementById('cardio-inputs').style.display   = type === 'cardio'   ? 'block' : 'none';
  document.getElementById('type-strength').classList.toggle('active', type === 'strength');
  document.getElementById('type-cardio').classList.toggle('active',   type === 'cardio');
}

function addSet() {
  var ex   = document.getElementById('exercise-select').value;
  var wt   = parseFloat(document.getElementById('weight-input').value);
  var reps = parseInt(document.getElementById('reps-input').value);
  if (!ex || isNaN(wt) || wt < 0 || isNaN(reps) || reps < 1) {
    showToast('Fill in weight and reps first'); return;
  }
  session.exercise = ex;
  session.sets.push({ weight:wt, reps:reps });
  document.getElementById('reps-input').value = '';
  renderSetList();
  document.getElementById('reps-input').focus();
}

function removeSet(i) {
  session.sets.splice(i, 1);
  renderSetList();
}

function renderSetList() {
  var container = document.getElementById('set-list');
  if (!container) return;
  if (session.sets.length === 0) {
    container.innerHTML = '<div class="empty-state">No sets yet \u2014 add your first one above</div>';
    return;
  }
  container.innerHTML = session.sets.map(function(s, i){
    return '<div class="set-item">' +
      '<div class="set-number">Set '+(i+1)+'</div>' +
      '<div class="set-details">'+s.weight+S.unit+' \u00d7 '+s.reps+' reps</div>' +
      '<button class="btn-icon-sm" onclick="removeSet('+i+')">&#x2715;</button>' +
    '</div>';
  }).join('');
}

async function saveWorkout() {
  if (session.type === 'strength') {
    if (session.sets.length === 0) { showToast('Add at least one set first'); return; }
    var workout = {
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
    var type      = document.getElementById('cardio-select').value;
    var mins      = parseInt(document.getElementById('cardio-duration').value);
    var dist      = parseFloat(document.getElementById('cardio-distance').value) || 0;
    var intensity = document.getElementById('cardio-intensity').value;
    if (!mins || mins < 1) { showToast('Enter duration in minutes'); return; }
    S.workouts.push({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: 'cardio',
      cardio: { type:type, mins:mins, dist:dist, intensity:intensity }
    });
    document.getElementById('cardio-duration').value  = '';
    document.getElementById('cardio-distance').value  = '';
    showToast('Cardio logged!');
  }
  updateStreakBadge();
  await save();
}

// ─── CUSTOM EXERCISE MODAL ───────────────────────
function openAddExerciseModal() {
  document.getElementById('custom-ex-modal').classList.add('active');
  document.getElementById('custom-ex-input').value = '';
  setTimeout(function(){ document.getElementById('custom-ex-input').focus(); }, 100);
}
function closeModal() {
  document.getElementById('custom-ex-modal').classList.remove('active');
}
async function saveCustomExercise() {
  var name = document.getElementById('custom-ex-input').value.trim();
  if (!name) { showToast('Enter an exercise name'); return; }
  if (!S.customExercises) S.customExercises = [];
  if (S.customExercises.includes(name) || PRESET_EXERCISES.includes(name)) {
    showToast('Exercise already exists'); return;
  }
  S.customExercises.push(name);
  populateExerciseSelect();
  var sel = document.getElementById('exercise-select');
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
  var ex      = workout.exercise;
  var bestSet = workout.sets.reduce(function(best, s){ return s.weight > best.weight ? s : best; }, { weight:-1, reps:0 });
  if (bestSet.weight < 0) return;
  var existing = S.prs[ex];
  if (!existing || bestSet.weight > existing.weight) {
    S.prs[ex] = { weight:bestSet.weight, reps:bestSet.reps, date:workout.date, workoutId:workout.id };
    showPRPopup(ex, bestSet.weight, bestSet.reps);
  }
}

function showPRPopup(exercise, weight, reps) {
  var popup = document.getElementById('pr-popup');
  if (!popup) return;
  document.getElementById('pr-popup-exercise').textContent = exercise;
  document.getElementById('pr-popup-weight').textContent   = weight + S.unit + ' \u00d7 ' + reps + ' reps';
  popup.classList.add('active');
  spawnConfetti();
}

function closePRPopup() {
  var popup = document.getElementById('pr-popup');
  if (popup) popup.classList.remove('active');
  var c = document.getElementById('pr-confetti');
  if (c) c.innerHTML = '';
}

function spawnConfetti() {
  var container = document.getElementById('pr-confetti');
  if (!container) return;
  container.innerHTML = '';
  var colors = ['#c8ff00','#ffffff','#ff4d4d','#4dc8ff','#ff9f00','#c84dff','#ff69b4'];
  for (var i = 0; i < 90; i++) {
    var p    = document.createElement('div');
    var size = 6 + Math.random() * 8;
    p.style.cssText =
      'position:absolute;left:'+(Math.random()*100)+'%;top:0;' +
      'width:'+size+'px;height:'+size+'px;' +
      'background:'+colors[Math.floor(Math.random()*colors.length)]+';' +
      'border-radius:'+(Math.random()>0.5?'50%':'2px')+';opacity:1;' +
      'animation:confettiFall '+(0.8+Math.random()*1.4)+'s ease-out forwards;' +
      'animation-delay:'+(Math.random()*0.5)+'s;' +
      'transform:rotate('+(Math.random()*360)+'deg);';
    container.appendChild(p);
  }
}

// ═══════════════════════════════════════════════
// HISTORY TAB
// ═══════════════════════════════════════════════
function setHistoryFilter(filter, btn) {
  historyFilter = filter;
  document.querySelectorAll('.history-filter-btn').forEach(function(b){ b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  renderHistory();
}

function filterWorkouts(workouts) {
  if (historyFilter === 'all') return workouts;
  var now   = new Date();
  var cutoff = new Date();
  if (historyFilter === 'week')  cutoff.setDate(now.getDate() - 7);
  if (historyFilter === 'month') cutoff.setMonth(now.getMonth() - 1);
  if (historyFilter === 'year')  cutoff.setFullYear(now.getFullYear() - 1);
  return workouts.filter(function(w){ return new Date(w.date) >= cutoff; });
}

function renderHistory() {
  var container = document.getElementById('history-list');
  if (!container) return;
  var filtered  = filterWorkouts((S.workouts || []).slice().reverse());

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state">No workouts in this period</div>';
    return;
  }
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var intensityLabels = { low:'Low', moderate:'Moderate', high:'High', maximum:'Maximum' };

  container.innerHTML = filtered.map(function(w){
    var d       = new Date(w.date);
    var dateStr = d.getDate()+' '+months[d.getMonth()]+' '+d.getFullYear();
    var dayStr  = days[d.getDay()];

    if (w.type === 'cardio' && w.cardio) {
      var intensity = w.cardio.intensity ? intensityLabels[w.cardio.intensity] || w.cardio.intensity : '';
      return '<div class="history-card history-card-cardio">' +
        '<div class="history-card-header">' +
          '<div>' +
            '<div class="history-exercise cardio-text">'+( w.cardio.type||'Cardio')+'</div>' +
            '<div class="history-date">'+dayStr+', '+dateStr+'</div>' +
          '</div>' +
          '<div class="history-badge cardio-badge">Cardio</div>' +
        '</div>' +
        '<div class="history-meta">' +
          '<span>'+w.cardio.mins+' min</span>' +
          (w.cardio.dist ? '<span>'+w.cardio.dist+' km</span>' : '') +
          (intensity ? '<span class="intensity-tag intensity-'+w.cardio.intensity+'">'+intensity+'</span>' : '') +
        '</div>' +
      '</div>';
    }

    var totalVol = (w.sets||[]).reduce(function(sum,s){ return sum+s.weight*s.reps; },0);
    var prSet    = (w.sets||[]).reduce(function(best,s){ return s.weight>best.weight?s:best; },{ weight:0,reps:0 });
    var isPR     = S.prs[w.exercise] && S.prs[w.exercise].workoutId === w.id;

    return '<div class="history-card">' +
      '<div class="history-card-header">' +
        '<div>' +
          '<div class="history-exercise">'+w.exercise+(isPR?' <span class="pr-badge">PR</span>':' ')+'</div>' +
          '<div class="history-date">'+dayStr+', '+dateStr+'</div>' +
        '</div>' +
        '<div class="history-sets-count">'+(w.sets||[]).length+' sets</div>' +
      '</div>' +
      '<div class="history-sets">' +
        (w.sets||[]).map(function(s,i){
          return '<div class="history-set-row">' +
            '<span class="history-set-num">Set '+(i+1)+'</span>' +
            '<span>'+s.weight+S.unit+' \u00d7 '+s.reps+' reps</span>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div class="history-meta">' +
        '<span>Best: '+prSet.weight+S.unit+'</span>' +
        '<span>Vol: '+Math.round(totalVol)+S.unit+'</span>' +
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
  var container = document.getElementById('volume-chart');
  if (!container) return;
  var now   = new Date();
  var weeks = [];
  for (var i = 7; i >= 0; i--) {
    var start = new Date(now);
    start.setDate(now.getDate() - (i*7 + now.getDay()));
    start.setHours(0,0,0,0);
    var end = new Date(start);
    end.setDate(start.getDate()+6);
    end.setHours(23,59,59,999);
    var label = (start.getMonth()+1)+'/'+start.getDate();
    var vol = (S.workouts||[])
      .filter(function(w){ var d=new Date(w.date); return w.type==='strength'&&d>=start&&d<=end; })
      .reduce(function(sum,w){ return sum+(w.sets||[]).reduce(function(s2,set){ return s2+set.weight*set.reps; },0); },0);
    weeks.push({ label:label, vol:Math.round(vol) });
  }
  var maxVol = Math.max.apply(null, weeks.map(function(w){ return w.vol; }).concat([1]));
  container.innerHTML = '<div class="chart-bars">'+
    weeks.map(function(w){
      var pct = Math.round((w.vol/maxVol)*100);
      return '<div class="chart-bar-wrap">'+
        '<div class="chart-bar-val">'+(w.vol>0?Math.round(w.vol/1000)+'k':'')+'</div>'+
        '<div class="chart-bar-track"><div class="chart-bar-fill" style="height:'+pct+'%"></div></div>'+
        '<div class="chart-bar-label">'+w.label+'</div>'+
      '</div>';
    }).join('')+
  '</div>';
}

function renderStreakDots() {
  var container = document.getElementById('streak-dots');
  if (!container) return;
  var today = new Date(); today.setHours(0,0,0,0);
  var dots  = [];
  for (var i = 29; i >= 0; i--) {
    var d = new Date(today); d.setDate(today.getDate()-i);
    var ts = d.getTime();
    var hasWorkout = (S.workouts||[]).some(function(w){
      var wd = new Date(w.date); wd.setHours(0,0,0,0); return wd.getTime()===ts;
    });
    dots.push({ active:hasWorkout });
  }
  container.innerHTML = dots.map(function(dot){
    return '<div class="streak-dot'+(dot.active?' active':'')+'"></div>';
  }).join('');
}

function renderCheckinSection() {
  var list = document.getElementById('checkin-history');
  if (!list) return;
  var checkins = (S.checkins||[]).slice().reverse();
  if (checkins.length === 0) {
    list.innerHTML = '<div class="empty-state">No check-ins yet \u2014 log your first weight below</div>';
    return;
  }
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  list.innerHTML = checkins.map(function(c){
    var d   = new Date(c.date);
    var bmi = calcBMI(c.weight, S.profile.height);
    return '<div class="checkin-row">'+
      '<div>'+
        '<div class="checkin-weight">'+c.weight+S.unit+'</div>'+
        '<div class="checkin-date">'+d.getDate()+' '+months[d.getMonth()]+' '+d.getFullYear()+'</div>'+
      '</div>'+
      (bmi?'<div class="checkin-bmi">BMI '+bmi+'</div>':'')+
    '</div>';
  }).join('');
}

async function saveCheckin() {
  var input  = document.getElementById('checkin-weight');
  if (!input) return;
  var weight = parseFloat(input.value);
  if (!weight||weight<20||weight>500) { showToast('Enter a valid weight'); return; }
  if (!S.checkins) S.checkins = [];
  S.checkins.push({ date:new Date().toISOString(), weight:weight });
  S.profile.weight = weight;
  input.value = '';
  renderCheckinSection();
  renderBMITrend();
  renderProfile();
  showToast('Weight logged!');
  await save();
}

function renderBMITrend() {
  var container = document.getElementById('bmi-trend');
  if (!container) return;
  if (!S.checkins||S.checkins.length<2||!S.profile.height) {
    container.innerHTML = '<div class="empty-state">Log at least 2 check-ins to see your BMI trend</div>';
    return;
  }
  var last6   = S.checkins.slice(-6);
  var months  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var bmiVals = last6.map(function(c){ return parseFloat(calcBMI(c.weight,S.profile.height))||0; });
  var maxBMI  = Math.max.apply(null,bmiVals.concat([1]));
  container.innerHTML = '<div class="chart-bars">'+
    last6.map(function(c,i){
      var bmi = bmiVals[i];
      var pct = Math.round((bmi/maxBMI)*100);
      var d   = new Date(c.date);
      return '<div class="chart-bar-wrap">'+
        '<div class="chart-bar-val">'+bmi+'</div>'+
        '<div class="chart-bar-track"><div class="chart-bar-fill bmi-bar-fill" style="height:'+pct+'%"></div></div>'+
        '<div class="chart-bar-label">'+months[d.getMonth()]+'</div>'+
      '</div>';
    }).join('')+
  '</div>';
}

// ═══════════════════════════════════════════════
// STATS TAB
// ═══════════════════════════════════════════════
function renderStats() {
  var workouts   = S.workouts || [];
  var strengthW  = workouts.filter(function(w){ return w.type==='strength'; });
  var cardioW    = workouts.filter(function(w){ return w.type==='cardio'; });
  var totalVol   = strengthW.reduce(function(sum,w){
    return sum+(w.sets||[]).reduce(function(s2,s){ return s2+s.weight*s.reps; },0);
  },0);
  var cardioMins = cardioW.reduce(function(sum,w){ return sum+(w.cardio?w.cardio.mins:0); },0);
  var prCount    = Object.keys(S.prs||{}).length;

  function el(id){ return document.getElementById(id); }
  if (el('stat-workouts'))     el('stat-workouts').textContent     = strengthW.length;
  if (el('stat-cardio-count')) el('stat-cardio-count').textContent = cardioW.length;
  if (el('stat-volume'))       el('stat-volume').textContent       = totalVol>=1000?(totalVol/1000).toFixed(1)+'k':Math.round(totalVol);
  if (el('stat-vol-unit'))     el('stat-vol-unit').textContent     = S.unit;
  if (el('stat-prs'))          el('stat-prs').textContent          = prCount;
  if (el('stat-cardio-mins'))  el('stat-cardio-mins').textContent  = cardioMins;

  renderPRList();
}

function renderPRList() {
  var container = document.getElementById('pr-list');
  if (!container) return;
  var prs  = S.prs || {};
  var keys = Object.keys(prs);
  if (keys.length === 0) {
    container.innerHTML = '<div class="empty-state">No PRs yet \u2014 log some sets and beat your bests!</div>';
    return;
  }
  keys.sort(function(a,b){ return prs[b].weight-prs[a].weight; });
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  container.innerHTML = keys.map(function(ex){
    var pr      = prs[ex];
    var d       = new Date(pr.date);
    var dateStr = d.getDate()+' '+months[d.getMonth()]+' '+d.getFullYear();
    return '<div class="pr-row">'+
      '<div class="pr-row-left">'+
        '<div class="pr-row-exercise">\uD83C\uDFC6 '+ex+'</div>'+
        '<div class="pr-row-date">Set on '+dateStr+'</div>'+
      '</div>'+
      '<div class="pr-row-weight">'+pr.weight+S.unit+' \u00d7 '+pr.reps+'</div>'+
    '</div>';
  }).join('');
}

// ═══════════════════════════════════════════════
// PROFILE TAB
// ═══════════════════════════════════════════════
function renderProfile() {
  var p = S.profile || {};
  var avatarEl = document.getElementById('profile-avatar');
  if (avatarEl) {
    var initials = p.name
      ? p.name.trim().split(' ').map(function(n){ return n[0]; }).join('').toUpperCase().slice(0,2)
      : '?';
    avatarEl.textContent = initials;
  }
  var nameDisplay = document.getElementById('profile-name-display');
  if (nameDisplay) nameDisplay.textContent = p.name || 'Your Name';
  var emailDisplay = document.getElementById('profile-email-display');
  if (emailDisplay && typeof currentUser !== 'undefined' && currentUser)
    emailDisplay.textContent = currentUser.email || '';
  var goalBadge = document.getElementById('profile-goal-badge');
  if (goalBadge) {
    var goalLabels = { lose:'Lose weight', maintain:'Stay healthy', build:'Build muscle' };
    goalBadge.textContent = goalLabels[p.goal] || '';
  }
  var bmi    = calcBMI(p.weight, p.height);
  var bmiEl  = document.getElementById('bmi-number');
  if (bmiEl) bmiEl.textContent = bmi || '\u2014';
  var bmiCatEl = document.getElementById('bmi-category');
  if (bmiCatEl) {
    var cat = getBMICategory(parseFloat(bmi));
    bmiCatEl.textContent = cat;
    bmiCatEl.className   = 'bmi-category'+(cat?' bmi-'+cat.toLowerCase():'');
  }
  var marker = document.getElementById('bmi-marker');
  if (marker && bmi) {
    var pct = Math.min(100,Math.max(0,((parseFloat(bmi)-15)/25)*100));
    marker.style.left = pct+'%';
  }
  var hDisp = document.getElementById('profile-height-display');
  if (hDisp) hDisp.textContent = p.height ? p.height+(S.unit==='kg'?' cm':' ft') : '\u2014';
  var wDisp = document.getElementById('profile-weight-display');
  if (wDisp) wDisp.textContent = p.weight ? p.weight+S.unit : '\u2014';
  var nameIn = document.getElementById('profile-name-input');
  if (nameIn) nameIn.value = p.name || '';
  var heightIn = document.getElementById('profile-height-input');
  if (heightIn) heightIn.value = p.height || '';
  var weightIn = document.getElementById('profile-weight-input');
  if (weightIn) weightIn.value = p.weight || '';
  var goalIn = document.getElementById('profile-goal-input');
  if (goalIn) goalIn.value = p.goal || 'build';
  var kgBtn = document.getElementById('unit-kg');
  var lbBtn = document.getElementById('unit-lb');
  if (kgBtn) kgBtn.classList.toggle('active', S.unit==='kg');
  if (lbBtn) lbBtn.classList.toggle('active', S.unit==='lb');
}

async function saveProfile() {
  S.profile.name   = (document.getElementById('profile-name-input').value||'').trim();
  S.profile.height = parseFloat(document.getElementById('profile-height-input').value)||0;
  S.profile.weight = parseFloat(document.getElementById('profile-weight-input').value)||0;
  S.profile.goal   = document.getElementById('profile-goal-input').value||'build';
  renderProfile();
  showToast('Profile saved!');
  await save();
}

async function setUnit(unit) {
  S.unit = unit;
  renderProfile(); renderStats(); renderSetList();
  await save();
}

async function clearAllData() {
  var pwd = prompt('Enter your password to confirm deleting ALL data:');
  if (!pwd) return;
  try {
    var email = currentUser && currentUser.email;
    if (!email) { showToast('Not logged in'); return; }
    var result = await sb.auth.signInWithPassword({ email:email, password:pwd });
    if (result.error) { showToast('Wrong password \u2014 data not deleted'); return; }
  } catch(e) { showToast('Could not verify password'); return; }
  var profileBackup = JSON.parse(JSON.stringify(S.profile));
  var unitBackup    = S.unit;
  S         = defaultState();
  S.profile = profileBackup;
  S.unit    = unitBackup;
  renderHistory(); renderProgress(); renderStats(); renderProfile(); updateStreakBadge();
  showToast('All data cleared');
  await save();
}

// ═══════════════════════════════════════════════
// BMI HELPERS
// ═══════════════════════════════════════════════
function calcBMI(weight, height) {
  if (!weight||!height||weight<=0||height<=0) return null;
  var w = weight, h = height;
  if (S.unit === 'lb') { w = weight*0.453592; h = height*30.48; }
  var hm = h/100;
  return (w/(hm*hm)).toFixed(1);
}
function getBMICategory(bmi) {
  if (!bmi||isNaN(bmi)) return '';
  if (bmi<18.5) return 'Underweight';
  if (bmi<25)   return 'Normal';
  if (bmi<30)   return 'Overweight';
  return 'Obese';
}

// ═══════════════════════════════════════════════
// STREAK
// ═══════════════════════════════════════════════
function updateStreakBadge() {
  var badge = document.getElementById('streak-badge');
  if (!badge) return;
  var streak = calcStreak();
  if (streak > 0) { badge.textContent='\uD83D\uDD25 '+streak; badge.style.display='flex'; }
  else            { badge.textContent=''; badge.style.display='none'; }
}
function calcStreak() {
  if (!S.workouts||S.workouts.length===0) return 0;
  var today = new Date(); today.setHours(0,0,0,0);
  var streak=0, check=new Date(today);
  while(true) {
    var ts = check.getTime();
    var has = S.workouts.some(function(w){ var d=new Date(w.date); d.setHours(0,0,0,0); return d.getTime()===ts; });
    if (!has) break;
    streak++;
    check.setDate(check.getDate()-1);
  }
  return streak;
}

// ═══════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════
var toastTimer = null;
function showToast(msg) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ toast.classList.remove('show'); }, 2500);
}

// ═══════════════════════════════════════════════
// CONFETTI KEYFRAME
// ═══════════════════════════════════════════════
(function(){
  if (document.getElementById('confetti-style')) return;
  var style = document.createElement('style');
  style.id  = 'confetti-style';
  style.textContent =
    '@keyframes confettiFall{' +
    '0%{transform:translateY(-10px) rotate(0deg);opacity:1;}' +
    '100%{transform:translateY(350px) rotate(720deg);opacity:0;}}';
  document.head.appendChild(style);
})();