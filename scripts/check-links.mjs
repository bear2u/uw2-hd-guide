import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist');
const base=(process.env.GUIDE_BASE_PATH||'/').replace(/\/$/,'');
const origin=new URL(process.env.GUIDE_SITE_URL||'http://localhost:4321').origin;
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else files.push(p);}}
walk(root);
const errors=[];let checked=0,anchors=0;
for(const file of files.filter(p=>p.endsWith('.html'))){
 const html=fs.readFileSync(file,'utf8');
 const current=origin+base+'/'+path.relative(root,file).replaceAll(path.sep,'/');
 for(const [,raw] of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)){
  const value=raw.replaceAll('&amp;','&');
  if(!value||/^(mailto:|data:|tel:|javascript:)/.test(value))continue;
  const url=new URL(value,current);
  if(url.origin!==origin)continue;
  const pathname=decodeURIComponent(url.pathname);
  if(base&&!(pathname===base||pathname.startsWith(base+'/'))){errors.push(`${file}: base 누락 ${value}`);continue;}
  const logical=pathname.slice(base.length).replace(/^\//,'');
  let target=path.join(root,logical);
  if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
  if(!fs.existsSync(target) && logical === '404/') target=path.join(root,'404.html');
  if(!fs.existsSync(target)){errors.push(`${file}: 없음 ${value}`);continue;}
  if(url.hash&&target.endsWith('.html')){
   const anchor=decodeURIComponent(url.hash.slice(1));
   const targetHtml=fs.readFileSync(target,'utf8');
   const ids=[...targetHtml.matchAll(/(?:id|name)=["']([^"']+)["']/g)].map(m=>m[1]);
   if(!ids.includes(anchor))errors.push(`${file}: anchor 없음 ${value}`);
   anchors++;
  }
  checked++;
 }
}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
if(!files.some(p=>p.endsWith('/pagefind/pagefind.js')))throw new Error('검색 인덱스 없음');
console.log(`내부 링크·자산 ${checked}개, anchor ${anchors}개 확인, 검색 번들 존재, base=${base||'/'}`);
