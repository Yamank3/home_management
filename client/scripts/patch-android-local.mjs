// Local-testing only: let the https://localhost app page call the http dev server.
// Patches the generated (git-ignored) native config after `cap sync`.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const file = join(dirname(fileURLToPath(import.meta.url)), '../android/app/src/main/assets/capacitor.config.json');
const config = JSON.parse(readFileSync(file, 'utf8'));
config.android = { ...config.android, allowMixedContent: true };
writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
console.log('Patched', file, '-> android.allowMixedContent = true');
