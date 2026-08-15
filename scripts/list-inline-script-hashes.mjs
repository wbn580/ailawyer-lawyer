#!/usr/bin/env node
// Scans public/**/*.html for inline <script> blocks (excluding src= and
// application/ld+json, which browsers don't gate behind CSP script-src) and
// prints the sha256 CSP hash for each distinct block. Use this after editing
// any inline <script> in public/ to refresh INLINE_SCRIPT_HASHES in
// src/worker.js — otherwise the new inline script gets silently blocked by
// the site's Content-Security-Policy in real browsers.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';

const scriptRe = /<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g;

const seen = new Map();
for await (const file of glob('public/**/*.html')) {
  const content = readFileSync(file, 'utf-8');
  for (const m of content.matchAll(scriptRe)) {
    const body = m[1];
    if (!body.trim()) continue;
    const hash = createHash('sha256').update(body, 'utf-8').digest('base64');
    if (!seen.has(hash)) seen.set(hash, file);
  }
}

for (const [hash, file] of seen) {
  console.log(`'sha256-${hash}' // first seen in ${file}`);
}
console.log(`\n${seen.size} distinct inline script hash(es).`);
