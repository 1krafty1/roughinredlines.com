// Rough-In Redlines savings calculator (roughinredlines.com/roi.html). One ES module: the maths (exported, tested by
// _tests/roi.test.mjs, `node --test _tests/*.test.mjs`) and, in a browser, the page wiring (sliders + number boxes, results,
// Copy link, Email me this report). The maths is copied into the Tools & Equip project's
// equipment-service/supabase/functions/roi-report/calc.ts for the emailed report; its logic.test.ts compares the two.
// Prices (US dollars, as on the home page #pricing and crew.html): Rough-In Pro $39.99 once per person (Windows key on
// 2 PCs; Apple and Windows bought separately); Crew $15 per person per month, Pro included (CA$19.00 on the App Store
// in Canada).

export const PRICES = { proOnce: 39.99, crewMonthly: 15 };
export const WEEKS = 50; // working weeks in a year

// Inputs: q = the short key in a shared link, min/max = what the number box accepts, def = the example value,
// int = whole numbers only.
export const FIELDS = {
  people: { q: 'n', min: 1, max: 1000, def: 5, int: true },
  hours: { q: 'h', min: 0, max: 60, def: 3 },
  rate: { q: 'r', min: 0, max: 1000, def: 75 },
  savedPct: { q: 's', min: 0, max: 100, def: 20 },
  sets: { q: 'k', min: 0, max: 1000, def: 10 },
  setCost: { q: 'c', min: 0, max: 10000, def: 40 },
  printCutPct: { q: 'x', min: 0, max: 100, def: 50 },
};
export const CHOICES = { plan: { q: 'w', values: { crew: 'c', pro: 'p' }, def: 'crew' } };

export const defaults = () => ({ ...Object.fromEntries(Object.entries(FIELDS).map(([k, f]) => [k, f.def])), plan: CHOICES.plan.def });

const clamp = (v, f) => Math.min(f.max, Math.max(f.min, v));

/** Any input object -> a complete, in-range one (missing or non-numbers fall back to the example value). */
export function clean(raw = {}) {
  const out = defaults();
  for (const [k, f] of Object.entries(FIELDS)) {
    const v = typeof raw[k] === 'string' && raw[k].trim() === '' ? NaN : Number(raw[k]);
    if (raw[k] !== undefined && raw[k] !== null && Number.isFinite(v)) out[k] = clamp(f.int ? Math.round(v) : v, f);
  }
  if (raw.plan === 'crew' || raw.plan === 'pro') out.plan = raw.plan;
  return out;
}

/** Days until the savings cover the cost: 0 = no cost, Infinity = never. */
export function payback(cost, savings) {
  if (cost == null) return null;
  if (cost <= 0) return 0;
  if (!(savings > 0)) return Infinity;
  return cost / (savings / 365);
}

export function calculate(raw) {
  const i = clean(raw);
  const people = i.people;
  const hoursToday = people * i.hours * WEEKS;
  const hoursSaved = hoursToday * i.savedPct / 100;
  const laborSaved = hoursSaved * i.rate;
  const printToday = i.sets * i.setCost * 12;
  const printSaved = printToday * i.printCutPct / 100;
  const savings = laborSaved + printSaved;
  const crew = i.plan === 'crew';
  // Crew: every person, every month, every year. Pro: one purchase per person, then nothing.
  const cost = Math.round((crew ? people * PRICES.crewMonthly * 12 : people * PRICES.proOnce) * 100) / 100;
  const laterCost = crew ? cost : 0;
  return {
    inputs: i, people, hoursToday, hoursSaved, laborSaved, printToday, printSaved, savings, crew,
    cost, laterCost, net: savings - cost, laterNet: savings - laterCost,
    paybackDays: payback(cost, savings), roi: cost ? savings / cost : null,
  };
}

// ---- formatting (en-US: commas, $; whole dollars unless cents are asked for)
const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const num0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
export function money(n, cents = false) {
  const v = Math.abs(n) < 0.005 ? 0 : n;
  const s = (cents && Math.round(v) !== Math.round(v * 100) / 100 ? usd2 : usd0).format(Math.abs(v));
  return v < 0 ? `−${s}` : s;
}
export const count = (n) => num0.format(Math.round(n));
export function paybackText(days) {
  if (days == null) return '—';
  if (days === 0) return 'Right away';
  if (!Number.isFinite(days)) return 'Not at these numbers';
  if (days <= 1) return '1 day';
  if (days <= 31) return `${Math.ceil(days)} days`;
  if (days <= 120) return `${Math.ceil(days / 7)} weeks`;
  if (days <= 730) return `${Math.ceil(days / 30.44)} months`;
  return `${(days / 365).toFixed(1)} years`;
}
export function roiText(roi) {
  if (roi == null || !Number.isFinite(roi)) return '—';
  return `${roi < 10 ? roi.toFixed(1) : count(roi)}×`;
}

// ---- shared links: ?n=5&h=3&… (short keys; every input is written out)
export function toQuery(raw) {
  const i = clean(raw);
  const p = new URLSearchParams();
  for (const [k, f] of Object.entries(FIELDS)) p.set(f.q, String(Math.round(i[k] * 100) / 100));
  p.set(CHOICES.plan.q, CHOICES.plan.values[i.plan]);
  return p.toString();
}
export function fromQuery(search) {
  const p = new URLSearchParams(search);
  const raw = {};
  let any = false;
  for (const [k, f] of Object.entries(FIELDS)) if (p.has(f.q)) { raw[k] = p.get(f.q); any = true; }
  const w = p.get(CHOICES.plan.q);
  if (w) { any = true; raw.plan = Object.entries(CHOICES.plan.values).find(([, v]) => v === w)?.[0]; }
  return any ? clean(raw) : null;
}

// ---- the page
if (typeof document !== 'undefined' && document.getElementById('roi-calc')) wire();

function wire() {
  const $ = (id) => document.getElementById(id);
  const form = $('roi-calc');
  const shared = fromQuery(location.search);
  let values = shared ?? defaults();
  if (shared) $('roi-shared').hidden = false;

  function show() {
    for (const k of Object.keys(FIELDS)) {
      const box = form.querySelector(`input[type="number"][data-k="${k}"]`);
      const range = form.querySelector(`input[type="range"][data-k="${k}"]`);
      if (document.activeElement !== box) box.value = String(Math.round(values[k] * 100) / 100);
      range.value = String(values[k]);
    }
    for (const r of form.querySelectorAll('input[name="plan"]')) r.checked = r.value === values.plan;
    render();
  }

  function render() {
    const r = calculate(values);
    const set = (id, text) => { const e = $(id); if (e) e.textContent = text; };
    set('out-net', money(r.net));
    set('out-net-note', r.crew ? 'a year, after paying for Crew' : 'in the first year, after buying Pro');
    set('out-hours-saved', `${count(r.hoursSaved)} hours`);
    set('out-hours-today', `of ${count(r.hoursToday)} a year on markups today`);
    set('out-labor', money(r.laborSaved));
    set('out-print', money(r.printSaved));
    set('out-print-today', `of ${money(r.printToday)} a year printing today`);
    set('out-savings', money(r.savings));
    set('out-plan', r.crew ? `Crew, ${r.people.toLocaleString('en-US')} × $15 a month` : `Rough-In Pro, ${r.people.toLocaleString('en-US')} × $39.99 once`);
    set('out-cost', r.crew ? `${money(r.cost, true)}/yr` : money(r.cost, true));
    set('out-later', r.crew ? `${money(r.laterNet)} a year` : `${money(r.laterNet)} a year (Pro is paid for)`);
    set('out-payback', paybackText(r.paybackDays));
    set('out-roi', roiText(r.roi));
    set('peek-net', money(r.net));
    $('out-net').classList.toggle('neg', r.net < 0);
  }

  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('input', (e) => {
    const t = e.target;
    if (t.name === 'plan') { values = clean({ ...values, plan: t.value }); render(); return; }
    const k = t.dataset.k;
    if (!k) return;
    const v = Number(t.value);
    if (t.value.trim() === '' || !Number.isFinite(v)) return; // half-typed: wait
    values = clean({ ...values, [k]: v });
    if (t.type === 'range') form.querySelector(`input[type="number"][data-k="${k}"]`).value = String(values[k]);
    else form.querySelector(`input[type="range"][data-k="${k}"]`).value = String(values[k]);
    render();
  });
  form.addEventListener('change', (e) => { if (e.target.type === 'number') e.target.value = String(values[e.target.dataset.k]); });
  $('roi-reset').addEventListener('click', () => {
    values = defaults(); $('roi-shared').hidden = true;
    history.replaceState(null, '', location.pathname + location.hash); show();
  });

  const peek = $('roi-peek');
  if (peek && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => peek.classList.toggle('away', en.isIntersecting), { threshold: 0.15 }).observe($('roi-results'));
  }

  const shareMsg = $('share-msg');
  $('share-copy').addEventListener('click', async () => {
    const url = `${location.origin}${location.pathname}?${toQuery(values)}#roi`;
    const field = $('share-url');
    field.value = url; field.hidden = false;
    history.replaceState(null, '', url);
    try { await navigator.clipboard.writeText(url); shareMsg.textContent = 'Link copied. Anyone who opens it sees these numbers.'; }
    catch { field.select(); shareMsg.textContent = 'Copy the link above to share these numbers.'; }
  });

  emailForm({ form: $('roi-email'), site: 'roughinredlines', inputs: () => values });
  show();
}

export function emailForm({ form, site, inputs }) {
  if (!form) return;
  const endpoint = form.dataset.endpoint;
  const msg = form.querySelector('.calc-msg');
  const btn = form.querySelector('button[type="submit"]');
  const started = Date.now();
  const unavailable = () => { form.classList.add('off'); msg.textContent = "Email isn't available yet. Use Copy link to keep or share these numbers."; };
  if (!endpoint || typeof fetch !== 'function') { unavailable(); btn.disabled = true; return; }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const email = String(data.email ?? '').trim();
    const emailBox = form.querySelector('input[name="email"]');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      emailBox.setAttribute('aria-invalid', 'true'); emailBox.focus();
      msg.textContent = 'Enter the email address to send the report to.'; return;
    }
    emailBox.removeAttribute('aria-invalid');
    btn.disabled = true; msg.textContent = 'Sending…';
    try {
      const r = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site, email, name: data.name ?? '', company: data.company ?? '', website: data.website ?? '', elapsed: Date.now() - started, inputs: inputs() }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.ok) { msg.textContent = `Sent to ${email}. It should arrive in a minute; check spam if it doesn't.`; setTimeout(() => { btn.disabled = false; }, 30000); return; }
      if (r.status === 429) msg.textContent = 'Too many reports from here for now. Try again in an hour, or use Copy link.';
      else if (j?.error && r.status !== 404) msg.textContent = j.error;
      else unavailable();
    } catch { unavailable(); }
    btn.disabled = false;
  });
}
