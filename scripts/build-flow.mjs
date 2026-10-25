import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'flow-src');
const out=path.join(root,'public/flow');
const tools=path.join(root,'scripts/flow-tools');
const pages=[
 {id:'01-overview',title:'모든 항해의 연결',tag:'전체 지도',description:'새 모험부터 엔딩까지. 항구를 중심으로 교역·탐험·전투가 이어지는 큰 흐름을 살펴보세요.',guide:'start/game-flow',hint:'전체 지도는 주요 활동의 연결입니다. 모든 길을 정해진 순서로 거칠 필요는 없습니다.',notes:['본편의 항구는 교역·정비·이야기가 만나는 곳입니다.','AI 자동 교역은 본편의 선택 기능입니다.','함께하기는 본편의 금화·함대·이야기와 분리된 모험입니다.']},
 {id:'02-start',title:'모험의 시작과 이어하기',tag:'시작 · 이야기',description:'여섯 주인공의 첫 항해, 저장한 모험 불러오기, 이야기 진행과 엔딩의 흐름입니다.',guide:'heroes/selection',hint:'주인공마다 도입부와 이야기 조건이 다릅니다. 각 인물의 공략을 함께 참고하세요.',notes:['새 모험에서는 먼저 도입부를 진행하고 배와 항해 준비를 갖춥니다.','이야기는 발견·교역·전투와 인물 만남 등 각 주인공의 조건에 따라 이어집니다.','엔딩을 마치면 타이틀로 돌아갑니다. 이어가려면 저장한 항해를 불러오세요.']},
 {id:'03-town-trade',title:'항구에서 다음 항해까지',tag:'도시 · 교역',description:'교역소의 매입과 매각, 시세 확인, 투자와 함대 정비를 한 흐름으로 연결합니다.',guide:'systems/trade',hint:'시설은 필요에 따라 이용합니다. 출항 전에는 모든 배의 선원과 물·식량을 확인하세요.',notes:['시세·물가에서 상품 분류를 고르면 해당 분류의 물가를 확인할 수 있습니다.','투자는 상업·공업의 발전을 돕습니다. 효과가 반영되는 시점에 유의하세요.','물품·장비와 항구 정보는 마을에서도 확인할 수 있습니다.']},
 {id:'04-voyage',title:'바다를 건너 새로운 세계로',tag:'항해 · 탐험',description:'목적항을 정하고 출항해 발견·돌발 상황을 거쳐 입항하는 항해의 순환입니다.',guide:'systems/navigation',hint:'항해 중에는 시간과 보급품이 소모됩니다. 선체와 선원을 살피며 가까운 항구에서 정비하세요.',notes:['지도와 목적항을 확인한 뒤 보급과 함대를 준비합니다.','발견과 보고는 탐험 활동과 이야기 진행에 연결됩니다.','항해 중 생기는 전투와 날씨 상황은 현재 상태에 맞게 대처하세요.']},
 {id:'05-combat',title:'해전과 결투, 그 이후',tag:'전투 · 보상',description:'교전에서 차례별 행동, 승패와 전리품 처리까지. 결투는 별도의 흐름으로 구분합니다.',guide:'systems/battle',hint:'전리품을 다 싣지 못하면 남은 화물을 처리해야 합니다. 알아서 싣기만으로 남은 전리품을 버리지 않습니다.',notes:['해전은 각 배의 차례에 이동과 공격을 선택하며 진행합니다.','포격과 백병전은 사거리와 배의 상태를 살펴 선택합니다.','승리 후에는 전리품과 함대 상태를 확인하고 다음 항해를 준비하세요.']},
 {id:'06-ai-agent',title:'AI에게 맡기는 반복 교역',tag:'AI 자동 교역',description:'계획·매입·보급·항해·매각의 순환과, 직접 확인이 필요한 정지 지점을 살펴봅니다.',guide:'ai/agent',hint:'게임 화면이 앞에 열려 있을 때 진행됩니다. 게임을 닫아 둔 동안의 수익은 누적되지 않습니다.',notes:['첫 배·항해 선원·자금·적재 공간을 준비한 뒤 설정에서 AI 에이전트를 켭니다.','원래 가지고 있던 화물은 보호하고 자동 교역으로 산 상품을 판매합니다.','이야기·해전·날씨 안내·보급 경고에서는 일시정지합니다.','오른쪽 진행창은 접거나 펼칠 수 있습니다. 멈췄다면 이유를 확인하고 재개하세요.']},
 {id:'07-coop',title:'세 선장이 함께 만드는 모험',tag:'협동 미니게임',description:'가족 등록부터 방 만들기, 여섯 도전, 공동 저장과 다시 도전까지 이어집니다.',guide:'challenges/mini-challenges',hint:'1~3명이 참가하며 빈자리는 컴퓨터 선장이 돕습니다. 웹과 Android에서 함께 참가할 수 있습니다.',notes:['가족 초대 코드는 가족 등록용, 방 코드는 현재 모험 참가용입니다.','짧은 모험: 세 항구의 배달부 · 새로운 바닷길 · 우리 바다 지키기.','긴 원정: 세 개의 해도 · 폭풍 구조대 · 안개 항구 잠입.','본편의 개인 저장·금화·함대·이야기와 분리되어 진행됩니다.']},
];
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
fs.mkdirSync(out,{recursive:true});
execFileSync(process.execPath,[path.join(tools,'flow-animation-page/scripts/make-pages.mjs'),source,'--out-dir',out,'--index-title','항해의 모든 흐름'],{stdio:'inherit',env:{...process.env,ONDINE_FLOW_MOTION_DIR:path.join(tools,'ondine-flow-motion')}});
const css=fs.readFileSync(path.join(source,'atlas.css'),'utf8');
fs.writeFileSync(path.join(out,'atlas.css'),css);
for(const [i,p] of pages.entries()){
 const file=path.join(out,`${p.id}.animated.html`);
 let html=fs.readFileSync(file,'utf8');
 const nav=pages.map((v,k)=>`<a href="${v.id}.animated.html" ${v===p?'aria-current="page"':''}><span>${String(k).padStart(2,'0')}</span>${escape(v.tag)}</a>`).join('');
 const header=`<header class="player-header"><a class="wordmark" href="index.html">UW II <span>항해 흐름도</span></a><a class="guide-back" href="../start/game-flow/">항해 수첩 ↗</a><div class="player-heading"><p class="eyebrow">CHAPTER ${String(i).padStart(2,'0')} / ${escape(p.tag)}</p><h1>${escape(p.title)}</h1><p>${escape(p.description)}</p></div></header><nav class="chapter-nav" aria-label="흐름 선택">${nav}</nav>`;
 html=html.replace('<header><h1>__TITLE__</h1></header>',header);
 // Engine already substitutes its title, so replace the generated original header.
 html=html.replace(/<header><h1>.*?<\/h1><\/header>/,header);
 html=html.replace('</head>','<link rel="stylesheet" href="atlas.css">\n<script>if(new URLSearchParams(location.search).has("embed"))document.documentElement.classList.add("is-embed");</script>\n</head>');
 html=html.replace('<label class="follow">','<button id="show-all" type="button">전체 펼치기</button><label class="zoom-label">확대 <select id="zoom" aria-label="흐름도 확대"><option value="fit">화면 맞춤</option><option value="0.6">60%</option><option value="0.8">80%</option><option value="1" selected>100%</option><option value="1.25">125%</option></select></label><label class="follow">');
 html=html.replace('<main><div class="stage"',`<main><div class="reading-note"><span class="note-mark">i</span><p>${escape(p.hint)}</p></div><div class="stage" tabindex="0" aria-label="흐름도. 가로와 세로로 스크롤할 수 있습니다"`);
 html=html.replace('</div></main>',`</div><section class="under-map"><details class="steps"><summary>단계 목록으로 살펴보기 <span id="step-total"></span></summary><ol id="step-list"></ol></details><aside class="guide-notes"><h2>이 흐름에서 기억할 것</h2><ul>${p.notes.map(n=>`<li>${escape(n)}</li>`).join('')}</ul><a href="../${p.guide}/">관련 가이드 읽기 ↗</a></aside></section></main>`);
 html=html.replace('</body>',`<script src="atlas.js"></script></body>`);
 // Keep the line's intended mask width (the upstream copy accidentally comments this statement out).
 html=html.replace("// ds-allow-hardcode: mask luminance, white = visible mp.setAttribute('stroke-width', '14');","// mask luminance: white is visible\n      mp.setAttribute('stroke-width', '14');");
 html=html.replace("const nameOf = (g) => lines(g)[0] || '';","const nameOf = (g) => labelText(g);");
 // Guide embeds start complete and paused. The parent starts playback only after a reader clicks.
 html=html.replace("const VIDEO = new URLSearchParams(location.search).has('video');", "const EMBED = document.documentElement.classList.contains('is-embed');\n  const VIDEO = !EMBED && new URLSearchParams(location.search).has('video');");
 html=html.replace('let t = reduced && !VIDEO ? TOTAL : 0, playing = !reduced && !VIDEO,', 'let t = (reduced || EMBED) && !VIDEO ? TOTAL : 0, playing = !reduced && !VIDEO && !EMBED,');
 html=html.replace('  function sync() {\n    render(t);', `  let lastPlaying = null;
  function sync() {
    if (EMBED && playing !== lastPlaying) {
      lastPlaying = playing;
      parent.postMessage({type:'guide-flow-state', playing}, location.origin);
    }
    render(t);`);
 html=html.replace('    playing = v; last = 0;', '    playing = v; last = 0;\n    if (!playing) { cancelAnimationFrame(raf); raf = 0; }');
 html=html.replace('  window.__flow = { beats, TOTAL, seek:', '  window.__flow = { beats, TOTAL, play: () => setPlaying(true), pause: () => setPlaying(false), seek:');
 // Keyboard shortcuts must not hijack buttons, links, selects or editable elements.
 html=html.replace("if (e.target.closest && e.target.closest('input[type=\"range\"]')) return;","if (e.target.closest && e.target.closest('input, select, textarea, button, a, summary, [contenteditable=\"true\"]')) return;");
 // Follow inside the scrollable map instead of scrolling the entire document away from the controls.
 const followStart=html.indexOf('  function followTo(b) {');
 const followEnd=html.indexOf('  function frame(now)',followStart);
 html=html.slice(0,followStart)+`  function followTo(b) {
    const stage=document.getElementById('stage');
    const r=b.el.getBoundingClientRect(), s=stage.getBoundingClientRect();
    if(r.top<s.top+30 || r.bottom>s.bottom-30 || r.left<s.left+30 || r.right>s.right-30){
      stage.scrollTo({top:Math.max(0,stage.scrollTop+r.top-s.top+r.height/2-stage.clientHeight/2),left:Math.max(0,stage.scrollLeft+r.left-s.left+r.width/2-stage.clientWidth/2),behavior:reduced?'auto':'smooth'});
    }
  }
`+html.slice(followEnd);
 fs.writeFileSync(file,html);
 const svg=fs.readFileSync(path.join(out,`${p.id}.ondine.svg`),'utf8');
 p.steps=(svg.match(/class="ondine-edge"/g)||[]).length;
}
fs.copyFileSync(path.join(source,'atlas.js'),path.join(out,'atlas.js'));
let index=fs.readFileSync(path.join(source,'index.html'),'utf8');
const card=(p,i)=>`<a class="atlas-card ${i===0?'overview-card':''}" href="${p.id}.animated.html"><div class="card-copy"><div class="card-kicker"><span>${String(i).padStart(2,'0')}</span><span>${escape(p.tag)}</span><span class="arrow">↗</span></div><h2>${escape(p.title)}</h2><p>${escape(p.description)}</p><div class="card-footer"><span>${p.steps}개의 연결</span><span>흐름 따라가기 →</span></div></div><div class="map-thumb"><img src="${p.id}.ondine.svg" alt="${escape(p.tag)} 흐름도 미리보기" loading="lazy"></div></a>`;
index=index.replace('<!--OVERVIEW-->',card(pages[0],0)).replace('<!--CHAPTERS-->',pages.slice(1).map((p,i)=>card(p,i+1)).join(''));
fs.writeFileSync(path.join(out,'index.html'),index);
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(pages.map(({id,title,tag,steps})=>({id,title,tag,steps})),null,2));
console.log(`항해 흐름도 ${pages.length}장 생성 완료: ${out}`);
