import fs from 'node:fs';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const data = JSON.parse(fs.readFileSync(new URL('src/data/game-reference.json',root),'utf8'));
assert.equal(data.schemaVersion,1);
const counts={heroes:6,ports:130,goods:46,ships:25,items:100,sailors:120,discoveries:98,challenges:144};
for(const [key,count] of Object.entries(counts)){
 assert.equal(data[key].length,count,`${key} 항목 수`);
 assert.equal(new Set(data[key].map(x=>x.id)).size,count,`${key} 중복 ID`);
 for(const row of data[key])assert.ok(row.name && !/[\ufffd\u00bd]/.test(row.name),`${key} 이름 누락/디코딩 오류`);
}
for(let heroId=0;heroId<6;heroId++){
 assert.equal(data.challenges.filter(x=>x.heroId===heroId).length,24);
}
for(const row of data.challenges) assert.ok(row.description && row.target>0 && row.category);
assert.deepEqual(data.sideHeroes.map(h=>h.id),[6,7,8,9,10,11,12,13],'외전 주인공');
assert.equal(data.sideChallenges.length,104,'외전 도전과제 수');
for(const heroId of [6,7,8,9]) assert.equal(data.sideChallenges.filter(x=>x.heroId===heroId).length,12);
assert.equal(data.sideChallenges.filter(x=>x.heroId===10).length,13,'류큐 외전 도전과제 (만국 장부 하나 더)');
assert.equal(data.sideChallenges.filter(x=>x.heroId===11).length,13,'히라도 외전 도전과제 (국제항 하나 더)');
assert.equal(data.sideChallenges.filter(x=>x.heroId===12).length,15,'심해 외전 도전과제 (주인공 과제 셋 더)');
assert.equal(data.sideChallenges.filter(x=>x.heroId===13).length,15,'인도양 외전 도전과제 (주인공 과제 셋 더)');
for(const row of data.sideChallenges) assert.ok(row.description && row.target>0 && row.category);
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(new URL(e.name+'/',dir)):[new URL(e.name,dir)]);}
const pages=walk(new URL('src/content/docs/',root)).filter(p=>p.pathname.endsWith('.mdx'));
const updates = pages.filter(p => /\/updates\//.test(p.pathname));
const novelAll = pages.filter(p => /\/novel\//.test(p.pathname));
assert.equal(pages.length - updates.length - novelAll.length,106,'기본 본문 페이지 수 (소설 제외)');
const shipPages = pages.filter(p => /\/ships\//.test(p.pathname)).map(p => p.pathname.split('/').pop()).sort();
assert.deepEqual(shipPages, ['choose.mdx','details.mdx','index.mdx','new.mdx','shipyards.mdx'], '함선 메뉴 구성');
const shipGuide = JSON.parse(fs.readFileSync(new URL('src/data/ship-guide.json',root),'utf8'));
assert.deepEqual(shipGuide.ships.map(s=>s.id), data.ships.map(s=>s.id), '함선 안내 자료와 기준값의 배 목록');
for(const s of shipGuide.ships){
 assert.ok(['sail','oar'].includes(s.hull) && s.industry>0 && s.description, `함선 안내 자료 ${s.id}`);
 assert.ok(fs.existsSync(new URL(`src/assets/ships/${s.image}`,root)), `함선 그림 ${s.image}`);
 assert.ok(shipGuide.shipyards.some(y=>y.models.includes(s.id)), `짓는 조선소 없음 ${s.id}`);
}
// 엔딩 뒤 새 배 (ship-catalog): 50척 = 여덟 지역 44척 (지역마다 2등급 한 척 넘게, 3등급 한 척) + 숨은 조선소 6척
const catalog = JSON.parse(fs.readFileSync(new URL('src/data/ship-catalog.json',root),'utf8'));
assert.equal(catalog.schemaVersion,1);
assert.equal(catalog.ships.length,50,'새 배 수');
assert.equal(new Set(catalog.ships.map(s=>s.slug)).size,50,'새 배 slug 중복');
assert.equal(catalog.regions.length,8,'새 배 지역 수');
const regionKeys = catalog.regions.map(r=>r.key);
const portIds = new Set(data.ports.map(p=>p.id));
for(const s of catalog.ships){
 assert.ok(s.name && s.native && s.role && s.description, `새 배 ${s.slug} 이름·원어·역할·설명`);
 assert.ok(s.region==='hidden' || regionKeys.includes(s.region), `새 배 ${s.slug} 지역`);
 assert.ok(s.region==='hidden' ? s.tier===0 : [1,2,3].includes(s.tier), `새 배 ${s.slug} 등급`);
 assert.ok(s.price>0 && s.capacity>0 && s.minCrew>0 && s.maxCrew>=s.minCrew, `새 배 ${s.slug} 값·적재·선원`);
 assert.ok(['sail','oar'].includes(s.hull) && typeof s.stormProof==='boolean', `새 배 ${s.slug} 구분`);
 assert.ok(s.ports.length>0 && s.ports.every(p=>portIds.has(p)), `새 배 ${s.slug} 짓는 항구`);
 if(s.region!=='hidden') assert.ok(s.industry>0 && (s.tier===1 ? s.economy===0 : s.economy>0) && (s.tier===3) === Boolean(s.challenge), `새 배 ${s.slug} 여는 조건`);
 assert.ok(fs.existsSync(new URL(`src/assets/ships/${s.image}`,root)), `새 배 그림 ${s.image}`);
}
for(const key of regionKeys){
 const rows = catalog.ships.filter(s=>s.region===key);
 assert.ok(rows.length>0, `지역 ${key} 새 배 없음`);
 assert.equal(rows.filter(s=>s.tier===3).length,1,`지역 ${key} 3등급 한 척`);
 assert.ok(rows.filter(s=>s.tier===2).length>=1,`지역 ${key} 2등급 한 척 넘게`);
}
assert.equal(catalog.ships.filter(s=>s.region!=='hidden').length,44,'지역 새 배 수');
assert.deepEqual([1,2,3].map(t=>catalog.ships.filter(s=>s.region!=='hidden'&&s.tier===t).length),[25,11,8],'지역 새 배 등급별 수');
assert.equal(catalog.ships.filter(s=>s.region==='hidden').length,6,'숨은 조선소 배 수');
const yardPorts = shipGuide.shipyards.flatMap(y=>y.ports).sort((a,b)=>a-b);
assert.deepEqual(yardPorts, Array.from({length:100},(_,i)=>i), '일반 항구 100곳이 조선소 계열 하나씩');
const strategies = pages.filter(p => /\/strategy\//.test(p.pathname)).map(p => p.pathname.split('/').pop()).sort();
assert.deepEqual(strategies, ['discoveries.mdx','fleet.mdx','index.mdx','ports.mdx','references.mdx','stories.mdx','survival.mdx','trade.mdx'], '공략 문서 구성');
const aiPages = pages.filter(p => /\/ai\//.test(p.pathname)).map(p => p.pathname.split('/').pop()).sort();
assert.deepEqual(aiPages, ['agent.mdx','connection.mdx','history.mdx','overview.mdx','personality.mdx'], 'AI 가이드 구성');
const sidePages = pages.filter(p => /\/side-story\//.test(p.pathname)).map(p => p.pathname.split('/').pop()).sort();
assert.deepEqual(sidePages, ['bounty.mdx','captive.mdx','deepsea-monsters.mdx','deepsea.mdx','help.mdx','hirado.mdx','index.mdx','joseon.mdx','milanda.mdx','ryukyu.mdx','salvador.mdx','voyage.mdx'], '외전 가이드 구성');
const novels = new Map();
for (const p of novelAll) { const parts = p.pathname.split('/novel/')[1].split('/'); if (parts.length === 2) novels.set(parts[0], [...(novels.get(parts[0]) ?? []), parts[1]]); }
assert.ok(novelAll.some(p => p.pathname.endsWith('/novel/index.mdx')), '소설 목록 페이지');
assert.ok(novels.has('joseon'), '조선 외전 소설');
for (const [id, files] of novels) {
  assert.ok(files.includes('index.mdx') && files.includes('prologue.mdx'), `${id} 소설: 소개와 서장`);
  assert.ok(files.some(f => /^part\d+\.mdx$/.test(f)), `${id} 소설: 본문`);
  assert.ok(files.some(f => /^(ending|endings|epilogue)\.mdx$/.test(f)), `${id} 소설: 결말`);
}
assert.ok(updates.length > 0, '날짜별 업데이트 문서 필요');
for (const p of updates) assert.match(p.pathname, /\/updates\/\d{4}-\d{2}-\d{2}\.mdx$/, '업데이트 문서 날짜 형식');
for(const p of pages){const text=fs.readFileSync(p,'utf8');assert.ok(text.length>350,`${p.pathname} 본문 부족`);assert.ok(!/CHANGE_ME|Your documentation starts here|TODO:|Lorem ipsum/.test(text));}
console.log(`공개 데이터 검증 통과: 6인·144과제·외전 8인 104과제·도감519항목·새 배 ${catalog.ships.length}척·본문${pages.length}페이지`);
