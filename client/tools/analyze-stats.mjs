import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const statsPath = resolve(process.cwd(), 'dist', 'school-portal-frontend', 'stats.json');

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(2)} kB`;
}

try {
  const stats = JSON.parse(readFileSync(statsPath, 'utf-8'));
  const outputs = Object.entries(stats.outputs || {})
    .filter(([name, meta]) => name.endsWith('.js') && (meta.bytes || 0) > 0)
    .map(([name, meta]) => ({ name, bytes: meta.bytes || 0, meta }))
    .sort((a, b) => b.bytes - a.bytes);

  if (!outputs.length) {
    console.log('No JavaScript outputs found in stats.json.');
    process.exit(0);
  }

  console.log('Top JS outputs:');
  for (const output of outputs.slice(0, 10)) {
    const entry = output.meta.entryPoint ? ` (entry: ${output.meta.entryPoint})` : '';
    console.log(`- ${output.name}: ${formatBytes(output.bytes)}${entry}`);
  }

  const biggest = outputs[0];
  const biggestInputs = Object.entries(biggest.meta.inputs || {})
    .map(([inputName, inputMeta]) => ({
      inputName,
      bytes: inputMeta.bytesInOutput || 0
    }))
    .filter((x) => x.bytes > 0)
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 20);

  console.log(`\nTop contributors in ${biggest.name}:`);
  for (const input of biggestInputs) {
    console.log(`- ${formatBytes(input.bytes)}: ${input.inputName}`);
  }
} catch (error) {
  console.error(`Failed to read ${statsPath}`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

