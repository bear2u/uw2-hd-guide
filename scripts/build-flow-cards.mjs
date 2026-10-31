import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'diagrams/unity-2d-hd');
const out = path.join(root, 'public/flow-cards');
const skills = process.env.ODIN_RUNTIME
  ? path.join(path.resolve(process.env.ODIN_RUNTIME), 'skills')
  : path.join(root, 'scripts/flow-tools');
const pages = [
  ['01-overview', '항구를 중심으로 교역·탐험·전투와 이야기가 이어집니다.', '모든 활동을 순서대로 할 필요는 없습니다. 주인공과 이야기 조건에 따라 다음 목표가 달라집니다.'],
  ['02-start', '처음 시작하는 항해와 저장한 모험을 이어가는 길입니다.', '조안·카탈리나·오토·에르네스트·피에트로·알리 중 선택합니다. 도입부와 첫 배를 마련하는 과정은 주인공마다 다릅니다.'],
  ['03-trade', '출발항·내 함대·도착항 사이의 한 번의 교역을 따라갑니다.', '대표적인 한 항차를 보여 줍니다. 도착 시세와 보급·수리 비용에 따라 실제 손익이 달라지며, 모든 거래에서 이익이 나는 것은 아닙니다.'],
  ['04-voyage', '항로와 보급 준비, 바다의 갈림길, 입항과 보고를 연결합니다.', '상륙·전투는 선택과 상황에 따른 갈림길입니다. 항해 중에는 시간과 보급품이 소모되므로 귀항에 필요한 여유를 남겨 두세요.'],
  ['05-combat', '배의 차례별 행동에서 승패와 전리품 처리까지 이어집니다.', '백병전 중에는 일기토가 성립할 수 있습니다. 알아서 싣기 후에도 남은 전리품은 직접 배분하거나 버리기를 확인해야 합니다.'],
  ['06-ai-agent', '자동 교역의 순서와 플레이어가 직접 처리할 순간입니다.', '정상 교역 한 항차 뒤에 중단 상황의 예를 따로 보여 줍니다. 경고는 어느 단계에서나 생길 수 있습니다. 기존 화물은 보호하며, 화면을 벗어나면 일시정지합니다. 목표 금화에 도달하면 멈춥니다.'],
  ['07-coop', '가족과 모여 역할을 나누고, 공동 저장으로 모험을 이어갑니다.', '본편의 금화·함대·이야기와 별도로 진행합니다. 가족 초대 코드는 가족 등록용, 방 코드는 모험 참가용입니다. 방이 종료되면 저장 지점에서 새 방을 만듭니다.'],
  ['08-save', '수동·입항 자동 저장과 계정으로 이어하기를 구분합니다.', '중요한 분기 전에는 수동 저장을 남기세요. 클라우드 업로드 완료를 확인한 뒤 종료합니다. 돈·함대·이야기는 선택한 저장으로 돌아가며 도전과제 기록은 별도로 유지됩니다.'],
];
const escape = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
execFileSync(process.execPath, [path.join(skills, 'flow-animation-page/scripts/make-pages.mjs'), source,
  '--out-dir', out, '--index-title', '대항해시대 II HD 흐름'], {
  stdio: 'inherit', env: {...process.env, ONDINE_FLOW_MOTION_DIR: path.join(skills, 'ondine-flow-motion')},
});

const addon = fs.readFileSync(path.join(source, 'player-tools.js'), 'utf8');
const style = `<style>
  header{display:flex;align-items:center;flex-wrap:wrap;gap:12px;padding-bottom:16px}
  header h1{flex:1;min-width:230px}header a{color:var(--accent);text-decoration:none;font-size:13px}
  .export-tools{display:flex;align-items:center;gap:10px}.export-tools button{min-width:56px}
  .reading-note{color:var(--ink-soft);font-size:14px;max-width:900px;margin:0 0 18px;line-height:1.7}
  .stage{max-height:72vh;overflow:auto;overscroll-behavior:contain}
  .stage svg.ondine{max-width:none}
  .caption{overflow-wrap:anywhere}.bar-inner{align-items:center}
  #png-status{display:block;min-height:1.5em;color:var(--ink-soft);font-size:13px;margin:10px 0}
  select{font:inherit;color:var(--ink);background:var(--panel);border:1px solid var(--rule);border-radius:6px;padding:6px}
  .back-bottom{color:var(--accent)}
  @media(max-width:600px){header h1{order:3;flex-basis:100%}.export-tools{margin-left:auto}.caption{flex-basis:100%}}
</style>`;
for (const [id, description, note] of pages) {
  const file = path.join(out, id + '.animated.html');
  const svg = fs.readFileSync(path.join(out, id + '.ondine.svg'), 'utf8');
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace('</head>', style + '</head>');
  html = html.replace('<header>', '<header><a href="index.html">← 모든 흐름</a>');
  html = html.replace('</header>', `<div class="export-tools"><a href="${id}.ondine.svg" download>SVG</a><button id="export-png" type="button" title="전체 다이어그램 저장 · Shift 클릭: 투명 배경">PNG</button><label><input id="transparent-png" type="checkbox"> 투명 배경</label></div></header>`);
  html = html.replace('<label class="follow">', '<button id="show-all" type="button">전체 보기</button><select id="map-zoom" aria-label="다이어그램 확대"><option value="fit">화면 맞춤</option><option value="1">100%</option><option value="1.5">150%</option></select><label class="follow">');
  html = html.replace('<main>', `<main><p class="reading-note">${escape(description)}<br>${escape(note)}</p><span id="png-status" role="status"></span>`);
  html = html.replace('class="stage" id="stage"', 'class="stage" id="stage" tabindex="0" aria-label="다이어그램. 확대 후 가로와 세로로 스크롤할 수 있습니다"');
  html = html.replace('</footer>', ' · PNG: 전체 그림 저장 (Shift: 투명 배경) · <a class="back-bottom" href="index.html">모든 흐름</a></footer>');
  html = html.replace("closest('input[type=\"range\"]')", "closest('input,select,textarea,button,a,[contenteditable=\"true\"]')");
  // Keep the control bar visible while following a step in the scrollable diagram.
  const followStart = html.indexOf('  function followTo(b) {');
  const followEnd = html.indexOf('  function frame(now)', followStart);
  if (followStart < 0 || followEnd < 0) throw new Error('Unsupported player: follow function missing');
  html = html.slice(0, followStart) + `  function followTo(b) {
    const stage = document.getElementById('stage');
    const r = b.el.getBoundingClientRect(), s = stage.getBoundingClientRect();
    if (r.top < s.top + 25 || r.bottom > s.bottom - 25 || r.left < s.left + 25 || r.right > s.right - 25) {
      stage.scrollTo({top: Math.max(0,stage.scrollTop+r.top-s.top+r.height/2-stage.clientHeight/2),
        left: Math.max(0,stage.scrollLeft+r.left-s.left+r.width/2-stage.clientWidth/2),behavior: reduced?'auto':'smooth'});
    }
  }
` + html.slice(followEnd);
  const data = JSON.stringify({id, svg}).replaceAll('<', '\\u003c');
  html = html.replace('</body>', `<script type="application/json" id="export-data">${data}</script><script>${addon}</script></body>`);
  fs.writeFileSync(file, html);
  fs.copyFileSync(path.join(source, id + '.mmd'), path.join(out, id + '.mmd'));
}
let index = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
index = index.replace('<html lang="ko">', '<html lang="ko" data-theme="light">');
index = index.replace('</style>', `
  :root{--page-max:1000px}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .meta .description{margin:8px 0;line-height:1.65}.card:focus-visible{outline-offset:4px}
  @media(max-width:640px){.grid{grid-template-columns:1fr}}
  @media(prefers-reduced-motion:reduce){.card{transition:none}.card:hover,.card:active{transform:none}}
</style>`);
index = index.replace('←/→ 단계 이동.</p>', '←/→ 단계 이동.<br>각 페이지 오른쪽 상단 <b>PNG</b> 버튼으로 전체 그림을 저장합니다. Shift 클릭 또는 투명 배경 선택 시 배경 없이 저장합니다.</p>');
for (const [id, description] of pages) {
  const expression = new RegExp(`(<a class="card" href="${id}\\.animated\\.html">[\\s\\S]*?<h2>[^<]+</h2>)`);
  index = index.replace(expression, `$1\n        <p class="description">${escape(description)}</p>`);
}
index = index.replace('Mermaid → Ondine SVG → ondine-flow-motion 플레이어', '대항해시대 II HD · 8개의 게임 흐름<br>실선은 주요 진행, 점선은 돌아오는 길과 상황별 분기입니다. 모든 길을 순서대로 거칠 필요는 없습니다.');
fs.writeFileSync(path.join(out, 'index.html'), index);
console.log('카드형 흐름도 8장과 전체 PNG 저장 기능을 생성했습니다.');
