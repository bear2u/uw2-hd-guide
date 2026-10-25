#!/usr/bin/env node
// .mmd 파일들 → 애니메이션 결과 페이지(*.animated.html) + 정적 SVG + 갤러리(index.html)
//
// usage:
//   node make-pages.mjs <dir | file.mmd ...> [--out-dir DIR] [--index-title "제목"]
//
// 각 .mmd의 첫 줄 근처 `%% title: 제목` 주석이 페이지 제목이 된다(없으면 파일 이름).
// 변환 엔진은 ondine-flow-motion 스킬의 build.mjs (ONDINE_FLOW_MOTION_DIR 로 경로 변경 가능).

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const skillDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const engineDir = process.env.ONDINE_FLOW_MOTION_DIR ?? path.join(os.homedir(), '.claude', 'skills', 'ondine-flow-motion')
const engine = path.join(engineDir, 'scripts', 'build.mjs')

const argv = process.argv.slice(2)
const take = (name) => { const i = argv.indexOf(name); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v }
const outDirArg = take('--out-dir')
const indexTitle = take('--index-title') ?? '흐름 애니메이션'
if (!argv.length) {
  console.log('Usage: node make-pages.mjs <dir | file.mmd ...> [--out-dir DIR] [--index-title "제목"]')
  process.exit(1)
}
if (!fs.existsSync(engine)) {
  console.error(`ondine-flow-motion 스킬이 없습니다: ${engine}\n먼저 설치하세요 (cp -R skills/ondine-flow-motion ~/.claude/skills/ && npm i --prefix ~/.claude/skills/ondine-flow-motion)`)
  process.exit(1)
}

const inputs = argv.flatMap((a) => {
  const p = path.resolve(a)
  if (fs.statSync(p).isDirectory()) return fs.readdirSync(p).filter((f) => /\.(mmd|mermaid)$/i.test(f)).sort().map((f) => path.join(p, f))
  return [p]
})
if (!inputs.length) { console.error('변환할 .mmd 파일이 없습니다.'); process.exit(1) }
const outDir = path.resolve(outDirArg ?? path.dirname(inputs[0]))
fs.mkdirSync(outDir, { recursive: true })

const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const pages = []
let failed = 0
for (const file of inputs) {
  const src = fs.readFileSync(file, 'utf8')
  const name = path.basename(file).replace(/\.(mmd|mermaid)$/i, '')
  const title = src.match(/^\s*%%\s*title:\s*(.+)$/m)?.[1].trim() ?? name
  try {
    execFileSync(process.execPath, [engine, file, '--title', title, '--out-dir', outDir, '--name', name], { stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (e) {
    failed++
    console.error(`✗ ${path.basename(file)}: ${(e.stderr?.toString() || e.message).trim()}`)
    continue
  }
  const svg = fs.readFileSync(path.join(outDir, `${name}.ondine.svg`), 'utf8')
  const type = svg.match(/class="ondine ondine-([a-z]+)"/)?.[1] ?? 'diagram'
  const steps = type === 'sequence'
    ? (svg.match(/class="ondine-edge ondine-message"/g) || []).length
    : (svg.match(/class="ondine-edge"/g) || []).length
  const sections = (svg.match(/class="ondine-note"/g) || []).length
  const rejects = (svg.match(/class="ondine-marker" d="[^"Z]*"/g) || []).length
  pages.push({ name, title, type, steps, sections, rejects })
  console.log(`✓ ${path.basename(file)} → ${name}.animated.html (${type}, 단계 ${steps}${sections ? `, 구간 ${sections}` : ''}${rejects ? `, 거절 ${rejects}` : ''})`)
}

const TYPE_LABEL = { sequence: '시퀀스', flowchart: '플로차트' }
const cards = pages.map((p) => `
    <a class="card" href="${encodeURIComponent(p.name)}.animated.html">
      <div class="thumb"><img src="${encodeURIComponent(p.name)}.ondine.svg" alt="" loading="lazy"></div>
      <div class="meta">
        <span class="kind">${escapeHtml(TYPE_LABEL[p.type] ?? p.type)}</span>
        <h2>${escapeHtml(p.title)}</h2>
        <p>단계 ${p.steps}${p.sections ? ` · 구간 ${p.sections}` : ''}${p.rejects ? ` · 거절 ${p.rejects}` : ''}</p>
      </div>
    </a>`).join('')
const index = fs.readFileSync(path.join(skillDir, 'templates', 'index.html'), 'utf8')
  .replaceAll('__TITLE__', () => escapeHtml(indexTitle))
  .replace('<!--CARDS-->', () => cards)
fs.writeFileSync(path.join(outDir, 'index.html'), index)
console.log(`→ ${path.relative(process.cwd(), path.join(outDir, 'index.html'))} (${pages.length}개 페이지)`)
process.exit(failed ? 1 : 0)
