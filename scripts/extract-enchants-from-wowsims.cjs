const fs = require('fs');

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node scripts/extract-enchants-from-wowsims.cjs <input-file>');
  process.exit(1);
}

const text = fs.readFileSync(inputPath, 'utf8');
const regex = /\{\s*EffectId:\s*(\d+),[\s\S]*?Name:\s*"([^"]+)"[\s\S]*?\}/g;
const map = new Map();
let match;
while ((match = regex.exec(text)) !== null) {
  const id = Number(match[1]);
  const name = String(match[2] || '').trim();
  if (!Number.isFinite(id) || id <= 0 || !name) {
    continue;
  }
  if (!map.has(id)) {
    map.set(id, name);
  }
}

const sorted = [...map.entries()].sort((a, b) => a[0] - b[0]);
const lines = sorted.map(([id, name]) => `  ${id}: ${JSON.stringify(name)},`);
console.log('export const ENCHANT_NAME_BY_ID = {');
console.log(lines.join('\n'));
console.log('};');
console.error(`Extracted ${sorted.length} enchant names.`);
