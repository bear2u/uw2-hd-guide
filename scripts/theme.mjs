import fs from 'node:fs';
const source = JSON.parse(fs.readFileSync(new URL('../tokens/theme.json', import.meta.url), 'utf8'));
const css = Object.entries(source).map(([mode, values]) => `${mode === 'light' ? ':root' : '[data-mode="dark"]'} {\n${Object.entries(values).map(([key, value]) => `  ${key}: ${value};`).join('\n')}\n}`).join('\n\n') + '\n';
fs.writeFileSync(new URL('../src/styles/theme.css', import.meta.url), `/* Generated from tokens/theme.json by scripts/theme.mjs. */\n${css}`);
