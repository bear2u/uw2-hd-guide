#!/usr/bin/env node
// Mermaid (.mmd) -> Ondine SVG -> self-contained animated flow player (.html)
//
// Usage:
//   node build.mjs <diagram.mmd> [--out-dir DIR] [--title "제목"] [--name base]
//
// Writes <out-dir>/<name>.ondine.svg (static) and <out-dir>/<name>.animated.html (player).
// Ondine is resolved from the current project first, then from this skill's folder.

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const skillDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function parseArgs(argv) {
  const args = { input: null, outDir: null, title: null, name: null }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--out-dir' || a === '-o') args.outDir = argv[++i]
    else if (a === '--title') args.title = argv[++i]
    else if (a === '--name') args.name = argv[++i]
    else if (a === '-h' || a === '--help') args.help = true
    else if (!args.input) args.input = a
    else throw new Error(`알 수 없는 인자: ${a}`)
  }
  return args
}

async function loadOndine() {
  const require = createRequire(import.meta.url)
  for (const base of [process.cwd(), skillDir]) {
    try {
      const entry = require.resolve('ondine/compiler', { paths: [base] })
      return await import(pathToFileURL(entry).href)
    } catch {}
  }
  throw new Error(`ondine 패키지를 찾지 못했습니다. 한 번만 설치하세요:\n  npm i --prefix "${skillDir}"`)
}

const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help || !args.input) {
    console.log('Usage: node build.mjs <diagram.mmd> [--out-dir DIR] [--title "제목"] [--name base]')
    process.exit(args.help ? 0 : 1)
  }
  const input = path.resolve(args.input)
  const source = fs.readFileSync(input, 'utf8')
  const name = args.name ?? path.basename(input).replace(/\.(mmd|mermaid)$/i, '')
  const outDir = path.resolve(args.outDir ?? path.dirname(input))
  const title = args.title ?? name

  const { render, RenderError } = await loadOndine()
  let out
  try {
    out = render(source)
  } catch (e) {
    if (RenderError && e instanceof RenderError) {
      console.error(`${args.input}:${e.line}:${e.column}: ${e.message}`)
      process.exit(1)
    }
    throw e
  }
  if (!['sequence', 'flowchart'].includes(out.type)) {
    console.warn(`주의: '${out.type}' 다이어그램은 간선만 순서대로 그립니다. sequence, flowchart에 최적화돼 있습니다.`)
  }

  const template = fs.readFileSync(path.join(skillDir, 'templates', 'player.html'), 'utf8')
  const html = template
    .replaceAll('__TITLE__', () => escapeHtml(title))
    .replace('<!--ONDINE_SVG-->', () => out.svg)

  fs.mkdirSync(outDir, { recursive: true })
  const svgPath = path.join(outDir, `${name}.ondine.svg`)
  const htmlPath = path.join(outDir, `${name}.animated.html`)
  fs.writeFileSync(svgPath, out.svg)
  fs.writeFileSync(htmlPath, html)
  console.log(`${args.input} -> ${path.relative(process.cwd(), svgPath)} (${out.type}, ${out.width}x${out.height})`)
  console.log(`${args.input} -> ${path.relative(process.cwd(), htmlPath)}`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
