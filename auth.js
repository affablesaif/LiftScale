// ═══════════════════════════════════════════════
// LIFTSCALE — auth.js
// Handles: Supabase init, login, signup,
//           onboarding, session management
// ═══════════════════════════════════════════════

const SUPABASE_URL  = 'https://aikipfszpwqlmsvvgvxm.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpa2lwZnN6cHdxbG1zdnZndnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjIyOTQsImV4cCI6MjA5MDc5ODI5NH0.6o9JZVhOwV9e_ez8YODozlWPyHJyMP_sCdAoJNGgKcA';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── STATE ───────────────────────────────────────
let currentUser   = null;
let authMode      = 'signin'; // 'signin' | 'signup'
let obStep        = 1;
let obUnit        = 'metric';
let obGoal        = '';

// ─── STARTUP ─────────────────────────────────────
async function startup() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    currentUser = session.user;
    await loadAndStart();
  } else {
    showAuthScreen();
  }
}

async function loadAndStart() {
  await loadUserData();
  const needsOnboarding = !S.profile.name && !S.profile.height;
  if (needsOnboarding) {
    showOnboarding();
  } else {
    showMainApp();
  }
}

// ─── SCREEN HELPERS ──────────────────────────────
function showAuthScreen() {
  document.getElementById('loading-screen').style.display  = 'none';
  document.getElementById('auth-screen').style.display     = 'flex';
  document.getElementById('onboarding-screen').style.display = 'none';
  document.getElementById('main-app').style.display        = 'none';
}

function showOnboarding() {
  document.getElementById('loading-screen').style.display  = 'none';
  document.getElementById('auth-screen').style.display     = 'none';
  document.getElementById('onboarding-screen').style.display = 'flex';
  document.getElementById('main-app').style.display        = 'none';
  obStep = 1;
  renderObStep();
}

function showMainApp() {
  document.getElementById('loading-screen').style.display  = 'none';
  document.getElementById('auth-screen').style.display     = 'none';
  document.getElementById('onboarding-screen').style.display = 'none';
  document.getElementById('main-app').style.display        = 'flex';
  initApp();
}

// ─── AUTH MODE TOGGLE ────────────────────────────
function toggleAuthMode() {
  authMode = authMode === 'signin' ? 'signup' : 'signin';
  const isSignIn = authMode === 'signin';
  document.getElementById('auth-title').textContent       = isSignIn ? 'Sign in' : 'Create account';
  document.getElementById('auth-btn').textContent         = isSignIn ? 'Sign in' : 'Sign up';
  document.getElementById('forgot-wrap').style.display    = isSignIn ? 'block' : 'none';
  document.getElementById('auth-switch').innerHTML        = isSignIn
    ? 'New to LiftScale? <a onclick="toggleAuthMode()">Create an account</a>'
    : 'Already have an account? <a onclick="toggleAuthMode()">Sign in</a>';
  clearAuthMessages();
}

// ─── HANDLE AUTH ─────────────────────────────────
async function handleAuth() {
  const email    = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const btn      = document.getElementById('auth-btn');

  if (!email || !password) { showAuthError('Please fill in all fields'); return; }
  if (password.length < 6)  { showAuthError('Password must be at least 6 characters'); return; }

  btn.disabled   = true;
  btn.textContent = 'Please wait...';
  clearAuthMessages();

  if (authMode === 'signin') {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { showAuthError(error.message); btn.disabled = false; btn.textContent = 'Sign in'; return; }
    currentUser = data.user;
    await loadAndStart();
  } else {
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) { showAuthError(error.message); btn.disabled = false; btn.textContent = 'Sign up'; return; }
    if (data.user && !data.session) {
      showAuthSuccess('Check your email to confirm your account, then sign in.');
      btn.disabled = false; btn.textContent = 'Sign up';
    } else if (data.session) {
      currentUser = data.user;
      await loadAndStart();
    }
  }
}

// ─── FORGOT PASSWORD ─────────────────────────────
async function handleForgotPassword() {
  const email = document.getElementById('auth-email').value.trim();
  if (!email) { showAuthError('Enter your email first'); return; }
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin
  });
  if (error) showAuthError(error.message);
  else showAuthSuccess('Password reset email sent — check your inbox');
}

// ─── AUTH MESSAGE HELPERS ─────────────────────────
function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg; el.style.display = 'block';
  document.getElementById('auth-success').style.display = 'none';
}
function showAuthSuccess(msg) {
  const el = document.getElementById('auth-success');
  el.textContent = msg; el.style.display = 'block';
  document.getElementById('auth-error').style.display = 'none';
}
function clearAuthMessages() {
  document.getElementById('auth-error').style.display   = 'none';
  document.getElementById('auth-success').style.display = 'none';
}

// ─── SIGN OUT ────────────────────────────────────
async function signOut() {
  await sb.auth.signOut();
  currentUser = null;
  S = defaultState();
  document.getElementById('auth-email').value    = '';
  document.getElementById('auth-password').value = '';
  authMode = 'signin';
  document.getElementById('auth-title').textContent  = 'Sign in';
  document.getElementById('auth-btn').textContent    = 'Sign in';
  document.getElementById('forgot-wrap').style.display = 'block';
  document.getElementById('auth-switch').innerHTML   =
    'New to LiftScale? <a onclick="toggleAuthMode()">Create an account</a>';
  showAuthScreen();
}

// ─── ONBOARDING ──────────────────────────────────
function renderObStep() {
  [1,2,3].forEach(i => {
    document.getElementById(`ob-step-${i}`).style.display = i === obStep ? 'block' : 'none';
  });
  const fill = ((obStep - 1) / 3) * 100;
  document.getElementById('onboarding-fill').style.width = fill + '%';
  document.getElementById('onboarding-step-label').textContent = `Step ${obStep} of 3`;
  document.getElementById('ob-next-btn').textContent =
    obStep === 3 ? 'Get started' : 'Continue';
}

function setObUnit(unit) {
  obUnit = unit;
  const isMetric = unit === 'metric';
  document.getElementById('unit-kg-btn').classList.toggle('active', isMetric);
  document.getElementById('unit-lb-btn').classList.toggle('active', !isMetric);
  document.getElementById('ob-height-label').textContent = isMetric ? 'Height (cm)' : 'Height (ft)';
  document.getElementById('ob-weight-label').textContent = isMetric ? 'Current weight (kg)' : 'Current weight (lbs)';
  document.getElementById('ob-height').placeholder       = isMetric ? '175' : '5.9';
  document.getElementById('ob-weight').placeholder       = isMetric ? '75' : '165';
}

function selectGoal(goal) {
  obGoal = goal;
  ['lose','maintain','build'].forEach(g => {
    document.getElementById(`goal-${g}`).classList.toggle('active', g === goal);
  });
}

async function onboardingNext() {
  if (obStep === 1) {
    obStep = 2; renderObStep(); return;
  }
  if (obStep === 2) {
    obStep = 3; renderObStep(); return;
  }
  if (obStep === 3) {
    await saveOnboardingData();
    showMainApp();
  }
}

async function skipOnboarding() {
  await saveOnboardingData();
  showMainApp();
}

async function saveOnboardingData() {
  const name   = document.getElementById('ob-name').value.trim();
  const height = parseFloat(document.getElementById('ob-height').value) || 0;
  const weight = parseFloat(document.getElementById('ob-weight').value) || 0;

  S.profile.name   = name;
  S.profile.height = height;
  S.profile.weight = weight;
  S.profile.goal   = obGoal || 'build';
  S.profile.gender = document.getElementById('ob-gender').value;
  S.unit           = obUnit === 'metric' ? 'kg' : 'lb';

  await save();
}

// ─── SUPABASE DATA SYNC ──────────────────────────
async function loadUserData() {
  if (!currentUser) return;
  try {
    const { data, error } = await sb
      .from('profiles')
      .select('data')
      .eq('id', currentUser.id)
      .single();

    if (data && data.data) {
      const remote = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
      S = { ...defaultState(), ...remote };
    } else {
      S = defaultState();
    }
  } catch(e) {
    S = defaultState();
  }
}

async function save() {
  setSyncIndicator('syncing');
  if (currentUser) {
    try {
      await sb.from('profiles').upsert({
        id: currentUser.id,
        data: JSON.stringify(S),
        updated_at: new Date().toISOString()
      });
      setSyncIndicator('synced');
    } catch(e) {
      setSyncIndicator('');
    }
  }
}

function setSyncIndicator(state) {
  const el = document.getElementById('sync-indicator');
  if (!el) return;
  el.className = `sync-indicator ${state}`;
  el.textContent = state === 'syncing' ? 'syncing...' : state === 'synced' ? 'synced' : '';
}

// ─── EVENT LISTENERS ─────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('auth-email').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('auth-password').focus();
  });
  document.getElementById('auth-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleAuth();
  });
  startup();
});
