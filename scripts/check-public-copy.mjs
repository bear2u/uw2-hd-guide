import fs from 'node:fs';
import assert from 'node:assert/strict';

// This check applies to reader-facing copy, not private maintenance documents or code.
const built = process.argv.includes('--built');
const root = new URL(built ? '../dist/' : '../src/content/docs/', import.meta.url);
assert.ok(fs.existsSync(root), `Missing ${built ? 'built site' : 'document sources'}`);
const forbidden = /codex\/|\/Users\/|PLAYTEST[-_]|ScenarioVm|\b(?:UGS|PlayerId|CloudSync|SNR|README)\b|C#|(?:Assets|Packages|Logs|Tools)\/[\w/.-]+|\b[\w.-]+\.(?:cs|asmdef)\b|브랜치|저장소|커밋|개발 소스|비트 필드|테스트 계정|자동 테스트|엔딩 [0-5](?=[,\s])|(?:기함|본대) (?:60|61)(?=[,\s])/g;
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const path = new URL(e.name + (e.isDirectory() ? '/' : ''), dir);
    return e.isDirectory() ? walk(path) : [path];
  });
}
const files = walk(root).filter(p => built ? /\.(?:html|md|txt)$/.test(p.pathname) : p.pathname.endsWith('.mdx'));
assert.ok(files.length > 0, 'No public documents found');
const failures = [];
for (const file of files) {
  let copy = fs.readFileSync(file, 'utf8');
  copy = copy.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^import\s.*?;?\s*$/gm, '')
    .replace(/<[^>]*>/g, ' ');
  const hits = [...copy.matchAll(forbidden)];
  if (hits.length) failures.push(`${file.pathname}: ${[...new Set(hits.map(h => h[0]))].join(', ')}`);
}
assert.equal(failures.length, 0, 'Internal details in public copy:\n' + failures.join('\n'));
console.log(`공개 문구 검사 통과: ${built ? '배포 출력' : '본문'} ${files.length}개 파일`);
