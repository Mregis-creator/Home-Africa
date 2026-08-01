#!/usr/bin/env node
/**
 * Home Africa — minimal smoke test (zero dependencies).
 *
 * Fast safety net for a zero-build static site. Run: `npm test`.
 * Checks:
 *   1. Every js/*.js parses (node --check).
 *   2. JSON config files (vercel.json, package.json) are valid JSON.
 *   3. No live/dead payment-gateway keys leaked into source.
 *   4. Key modules expose their public API (config PRICING, HABilling, HAComponents).
 *   5. Pricing pages contain no USD ($) prices.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
let failures = 0;
function ok(msg) { console.log('  ok   ' + msg); }
function fail(msg) { console.error('  FAIL ' + msg); failures++; }
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }

// 1. JS syntax check for everything in js/
console.log('\n[1] JS syntax');
for (const f of fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js'))) {
  try {
    execSync(`node --check "${path.join(ROOT, 'js', f)}"`, { stdio: 'pipe' });
    ok('js/' + f);
  } catch (e) {
    fail('js/' + f + ' — ' + (e.stderr ? e.stderr.toString().split('\n')[0] : e.message));
  }
}

// 2. JSON validity
console.log('\n[2] JSON validity');
for (const f of ['vercel.json', 'package.json']) {
  try { JSON.parse(read(f)); ok(f); }
  catch (e) { fail(f + ' — ' + e.message); }
}

// 3. No leaked payment-gateway keys in source (exclude comments/placeholders)
console.log('\n[3] No leaked payment keys');
const scanFiles = [];
for (const dir of ['.', 'js']) {
  for (const f of fs.readdirSync(path.join(ROOT, dir))) {
    if (f.endsWith('.html') || f.endsWith('.js')) scanFiles.push(path.join(dir, f));
  }
}
const badKey = /(pk_live_[0-9A-Za-z]{10,}|FLWPUBK-[0-9A-Za-z]{10,}|FLWSECK[-_][0-9A-Za-z]{10,})/;
let keyHits = 0;
for (const rel of scanFiles) {
  const txt = read(rel);
  if (badKey.test(txt)) { fail('possible live key in ' + rel); keyHits++; }
}
if (keyHits === 0) ok('no live Stripe/Flutterwave keys in source');

// 4. Public API surface
console.log('\n[4] Module API surface');
const checks = [
  ['js/config.js', /PRICING\s*:/, 'config.js exposes PRICING'],
  ['js/config.js', /formatPrice/, 'config.js exposes formatPrice'],
  ['js/billing-gate.js', /window\.HABilling/, 'billing-gate.js exposes HABilling'],
  ['js/components.js', /window\.HAComponents/, 'components.js exposes HAComponents'],
  ['supabase/security-hardening.sql', /is_admin/, 'security migration defines is_admin'],
  ['supabase/security-hardening.sql', /billing_enabled/, 'security migration adds billing_enabled'],
];
for (const [file, re, label] of checks) {
  if (!exists(file)) { fail(label + ' (missing ' + file + ')'); continue; }
  re.test(read(file)) ? ok(label) : fail(label);
}

// 5. Pricing pages have no USD prices
console.log('\n[5] RWF-only pricing pages');
const pricingPages = ['partnerships.html', 'merchant-dashboard.html', 'premium.html'];
const usdPrice = /\$\s?\d/;
for (const p of pricingPages) {
  if (!exists(p)) { fail(p + ' missing'); continue; }
  usdPrice.test(read(p)) ? fail(p + ' still contains a $-price') : ok(p + ' RWF-only');
}

console.log('\n' + (failures ? `SMOKE TEST FAILED: ${failures} problem(s)` : 'SMOKE TEST PASSED'));
process.exit(failures ? 1 : 0);
