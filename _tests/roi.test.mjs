// The savings calculator on roughinredlines.com/roi.html (roi.js): the maths, the prices on the site, the formatting
// and the shared-link round trip.   node --test _tests/*.test.mjs
// (_tests/ starts with an underscore, so GitHub Pages' Jekyll build leaves it off the website.)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import * as R from '../roi.js';

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);
const page = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

describe('prices match the website', () => {
  it('Pro $39.99 once, Crew $15 per person per month', () => {
    assert.equal(R.PRICES.proOnce, 39.99);
    assert.equal(R.PRICES.crewMonthly, 15);
    const home = page('index.html');
    assert.ok(home.includes('<div class="price"><b>$39.99</b><span>once</span></div>'), 'home: Pro $39.99 once');
    assert.ok(home.includes('<p class="crew-price"><b>$15</b><span>per person per month'), 'home: Crew $15');
    assert.ok(page('crew.html').includes('<div class="price"><b>$15</b><span>per license / month</span></div>'), 'crew.html: $15 per license');
  });
});

describe('calculate', () => {
  it('the example numbers (Crew)', () => {
    const r = R.calculate(R.defaults());
    close(r.hoursToday, 750);      // 5 people × 3 h × 50 weeks
    close(r.hoursSaved, 150);      // 20%
    close(r.laborSaved, 11250);    // × $75
    close(r.printToday, 4800);     // 10 sets × $40 × 12
    close(r.printSaved, 2400);     // 50%
    close(r.savings, 13650);
    assert.equal(r.cost, 900);     // 5 × $15 × 12
    close(r.net, 12750);
    assert.equal(Math.ceil(r.paybackDays), 25);
    close(r.roi, 15.1666666667, 1e-6);
    assert.equal(r.laterCost, 900);
  });
  it('Rough-In Pro: one purchase per person, nothing after', () => {
    const r = R.calculate({ ...R.defaults(), plan: 'pro' });
    assert.equal(r.cost, 199.95);
    assert.equal(r.laterCost, 0);
    close(r.net, 13650 - 199.95);
    close(r.laterNet, 13650);
    assert.equal(R.paybackText(r.paybackDays), '6 days');
  });
  it('no time saved and no printing cut: never pays back', () => {
    const r = R.calculate({ ...R.defaults(), savedPct: 0, printCutPct: 0 });
    assert.equal(r.savings, 0);
    assert.equal(r.paybackDays, Infinity);
    assert.equal(R.paybackText(r.paybackDays), 'Not at these numbers');
  });
  it('clean: clamps, rounds people, junk falls back to the example', () => {
    const i = R.clean({ people: 2.6, hours: 99, rate: 'x', savedPct: -3, plan: 'gold' });
    assert.deepEqual({ people: i.people, hours: i.hours, rate: i.rate, savedPct: i.savedPct, plan: i.plan }, { people: 3, hours: 60, rate: 75, savedPct: 0, plan: 'crew' });
  });
});

describe('formatting', () => {
  it('money, payback, multiple', () => {
    assert.equal(R.money(12750), '$12,750');
    assert.equal(R.money(199.95, true), '$199.95');
    assert.equal(R.money(900, true), '$900');
    assert.equal(R.money(-50), '−$50');
    assert.equal(R.paybackText(24.07), '25 days');
    assert.equal(R.paybackText(60), '9 weeks');
    assert.equal(R.roiText(15.17), '15×');
    assert.equal(R.roiText(3.21), '3.2×');
  });
});

describe('shared links', () => {
  it('round-trip every input with short keys', () => {
    const v = { people: 12, hours: 4.5, rate: 82, savedPct: 25, sets: 18, setCost: 55, printCutPct: 60, plan: 'pro' };
    const q = R.toQuery(v);
    assert.equal(q, 'n=12&h=4.5&r=82&s=25&k=18&c=55&x=60&w=p');
    assert.deepEqual(R.fromQuery(`?${q}`), v);
  });
  it('no keys: null; bad values are clamped', () => {
    assert.equal(R.fromQuery('?utm_source=x'), null);
    assert.equal(R.fromQuery('?n=5000').people, 1000);
  });
});
