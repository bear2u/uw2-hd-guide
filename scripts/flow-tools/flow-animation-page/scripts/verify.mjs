#!/usr/bin/env node
// 결과 페이지 검증: 헤드리스 Chrome으로 *.animated.html 을 열어 에러·단계 수·마지막 프레임·모션 줄이기를 확인하고
// 재생 중간/마지막 스크린샷을 <dir>/.verify/ 에 남긴다. 하나라도 실패하면 종료 코드 1.
//
// usage: node verify.mjs <dir | page.animated.html ...>
// env:   CHROME=<Chrome 실행 파일 경로> (기본: macOS Google Chrome)

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const skillDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
let puppeteer
for (const base of [process.cwd(), skillDir]) {
  try { puppeteer = (await import(pathToFileURL(require.resolve('puppeteer-core', { paths: [base] })).href)).default; break } catch {}
}
if (!puppeteer) { console.error(`puppeteer-core 가 없습니다. 한 번만 설치하세요:\n  npm i --prefix "${skillDir}"`); process.exit(1) }

const CHROME = process.env.CHROME ?? [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find((p) => fs.existsSync(p))
if (!CHROME) { console.error('Chrome 을 찾지 못했습니다. CHROME=<경로> 로 지정하세요.'); process.exit(1) }

const args = process.argv.slice(2)
if (!args.length) { console.log('Usage: node verify.mjs <dir | page.animated.html ...>'); process.exit(1) }
const pages = args.flatMap((a) => {
  const p = path.resolve(a)
  if (fs.statSync(p).isDirectory()) return fs.readdirSync(p).filter((f) => f.endsWith('.animated.html')).sort().map((f) => path.join(p, f))
  return [p]
})

// root/컨테이너에서는 Chrome 샌드박스가 동작하지 않아 실행 자체가 실패한다.
// 그 경우에만 --no-sandbox를 붙이고, 일반 사용자 환경에서는 샌드박스를 유지한다.
const NO_SANDBOX = (typeof process.getuid === 'function' && process.getuid() === 0) || process.env.ONDINE_NO_SANDBOX === '1'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars', ...(NO_SANDBOX ? ['--no-sandbox', '--disable-setuid-sandbox'] : [])] })
let bad = 0
for (const file of pages) {
  const shotDir = process.env.FLOW_VERIFY_DIR ?? path.join(path.dirname(file), '.verify'); fs.mkdirSync(shotDir, { recursive: true })
  const name = path.basename(file, '.animated.html')
  const result = { page: path.basename(file) }
  for (const reduce of [false, true]) {
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }])
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(pathToFileURL(file).href, { waitUntil: 'load' })
    await new Promise((r) => setTimeout(r, 1200))
    const r = await page.evaluate(() => {
      const f = window.__flow
      if (!f) return { missing: true }
      const scrub = Number(document.getElementById('scrub')?.value ?? 0)
      const beats = f.beats.length, edges = f.beats.filter((b) => b.kind === 'edge').length
      return { beats, edges, total: Math.round(f.TOTAL), scrub }
    })
    if (r.missing) { result.error = '__flow 없음 (ondine-flow-motion 플레이어가 아님)'; bad++; await page.close(); break }
    if (!reduce) {
      Object.assign(result, { beats: r.beats, edges: r.edges, totalMs: r.total, plays: r.scrub > 0 })
      await page.evaluate((ms) => window.__flow.seek(ms), r.total * 0.45)
      await page.screenshot({ path: path.join(shotDir, `${name}-mid.png`), fullPage: true })
    } else {
      result.reducedStartsAtEnd = r.scrub === 1000
    }
    await page.evaluate((ms) => window.__flow.seek(ms), r.total)
    const end = await page.evaluate(() => ({
      hidden: [...document.querySelectorAll('.fx-pop')].filter((e) => getComputedStyle(e).opacity !== '1').length,
      undrawn: [...document.querySelectorAll('mask path')].filter((m) => m.getAttribute('stroke-dashoffset') !== '0').length,
    }))
    if (!reduce) {
      result.finalComplete = end.hidden === 0 && end.undrawn === 0
      await page.screenshot({ path: path.join(shotDir, `${name}-end.png`), fullPage: true })
    }
    result.errors = (result.errors ?? 0) + errors.length
    if (errors.length) result.errorMessages = [...(result.errorMessages ?? []), ...errors]
    await page.close()
  }
  const ok = !result.error && result.errors === 0 && result.plays && result.finalComplete && result.reducedStartsAtEnd && result.edges > 0
  if (!ok) bad++
  console.log(`${ok ? '✓' : '✗'} ${JSON.stringify(result)}`)
}
await browser.close()
console.log(bad ? `실패 ${bad}건` : `모두 통과. 스크린샷: <dir>/.verify/*-mid.png, *-end.png`)
process.exit(bad ? 1 : 0)
