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
 assert.equal(data.discoveries.filter(x=>x.activeHeroes.includes(heroId)).length,50);
}
for(const row of data.challenges) assert.ok(row.description && row.target>0 && row.category);
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(new URL(e.name+'/',dir)):[new URL(e.name,dir)]);}
const pages=walk(new URL('src/content/docs/',root)).filter(p=>p.pathname.endsWith('.mdx'));
const updates = pages.filter(p => /\/updates\//.test(p.pathname));
assert.equal(pages.length - updates.length,52,'기본 본문 페이지 수');
const strategies = pages.filter(p => /\/strategy\//.test(p.pathname)).map(p => p.pathname.split('/').pop()).sort();
assert.deepEqual(strategies, ['discoveries.mdx','fleet.mdx','index.mdx','ports.mdx','references.mdx','stories.mdx','survival.mdx','trade.mdx'], '공략 문서 구성');
const aiPages = pages.filter(p => /\/ai\//.test(p.pathname)).map(p => p.pathname.split('/').pop()).sort();
assert.deepEqual(aiPages, ['agent.mdx','connection.mdx','history.mdx','overview.mdx','personality.mdx'], 'AI 가이드 구성');
assert.ok(updates.length > 0, '날짜별 업데이트 문서 필요');
for (const p of updates) assert.match(p.pathname, /\/updates\/\d{4}-\d{2}-\d{2}\.mdx$/, '업데이트 문서 날짜 형식');
for(const p of pages){const text=fs.readFileSync(p,'utf8');assert.ok(text.length>350,`${p.pathname} 본문 부족`);assert.ok(!/CHANGE_ME|Your documentation starts here|TODO:|Lorem ipsum/.test(text));}
console.log(`공개 데이터 검증 통과: 6인·144과제·도감519항목·본문${pages.length}페이지`);
