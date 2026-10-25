import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import puppeteer from './flow-tools/flow-animation-page/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'public/flow');
const evidence=path.resolve(root,'../Logs/flow-site-20261025');
fs.mkdirSync(evidence,{recursive:true});
execFileSync(process.execPath,[path.join(root,'scripts/flow-tools/flow-animation-page/scripts/verify.mjs'),out],{stdio:'inherit',env:{...process.env,FLOW_VERIFY_DIR:path.join(evidence,'engine')}});
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const results=[];
try{
 const pages=JSON.parse(fs.readFileSync(path.join(out,'manifest.json'),'utf8'));
 assert.equal(pages.length,7);
 for(const p of pages){
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewport({width:1440,height:1000});
  await page.goto(pathToFileURL(path.join(out,p.id+'.animated.html')).href);
  await page.waitForFunction(()=>!!window.__flow);
  await page.click('#show-all');
  const complete=await page.evaluate(()=>Number(document.getElementById('scrub').value));assert.equal(complete,1000);
  await page.click('#prev');assert.ok(await page.evaluate(()=>Number(document.getElementById('scrub').value)<1000));
  await page.click('#next');
  await page.click('#speed [data-speed="2"]');assert.equal(await page.$eval('#speed [data-speed="2"]',e=>e.getAttribute('aria-checked')),'true');
  await page.select('#zoom','1.25');
  const zoom=await page.$eval('#stage svg',e=>e.getBoundingClientRect().width/e.viewBox.baseVal.width);assert.ok(Math.abs(zoom-1.25)<.01);
  await page.click('.steps summary');await page.click('#step-list li:nth-child(2) button');
  const expected=await page.evaluate(()=>Math.round(window.__flow.beats[1].end/window.__flow.TOTAL*1000));
  assert.equal(await page.$eval('#scrub',e=>Number(e.value)),expected);
  await page.click('#show-all');
  const geometry=await page.evaluate(()=>{
   const svg=document.querySelector('#stage svg');
   const overflow=[...svg.querySelectorAll('.ondine-node')].flatMap(g=>{
    const shape=g.querySelector('rect,polygon,path,ellipse');if(!shape)return[];
    const s=shape.getBoundingClientRect();return[...g.querySelectorAll('text')].flatMap(t=>{const r=t.getBoundingClientRect();return(r.left<s.left-3||r.right>s.right+3||r.top<s.top-3||r.bottom>s.bottom+3)?[{node:g.dataset.id,text:t.textContent,spill:Math.round(Math.max(s.left-r.left,r.right-s.right,s.top-r.top,r.bottom-s.bottom))}]:[];});
   });
   return{nodes:svg.querySelectorAll('.ondine-node').length,edges:window.__flow.beats.length,overflow};
  });
  await page.screenshot({path:path.join(evidence,p.id+'-desktop.png'),fullPage:true});
  // Full diagram evidence preserves every branch for visual review.
  await page.addStyleTag({content:'.stage{max-height:none!important;overflow:visible!important}.bar{position:static!important}'});
  await page.evaluate(()=>document.documentElement.scrollHeight);
  await new Promise(resolve=>setTimeout(resolve,150));
  await page.screenshot({path:path.join(evidence,p.id+'-complete.png'),fullPage:true});
  await page.setViewport({width:390,height:844});
  await page.reload();await page.waitForFunction(()=>!!window.__flow);await page.click('#show-all');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'Mobile page overflow '+p.id);
  await page.screenshot({path:path.join(evidence,p.id+'-mobile.png'),fullPage:true});
  assert.deepEqual(errors,[]);results.push({page:p.id,...geometry,controls:'passed',mobileOverflow:false,errors:0});await page.close();
 }
 const home=await browser.newPage();await home.setViewport({width:1440,height:1000});await home.goto(pathToFileURL(path.join(out,'index.html')).href);
 assert.equal(await home.$$eval('.atlas-card',a=>a.length),7);await home.screenshot({path:path.join(evidence,'index-desktop.png'),fullPage:true});
 await home.setViewport({width:390,height:844});assert.equal(await home.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await home.screenshot({path:path.join(evidence,'index-mobile.png'),fullPage:true});
 fs.writeFileSync(path.join(evidence,'interaction-results.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify(results,null,2));
 assert.equal(results.flatMap(x=>x.overflow).length,0,'Diagram labels exceed node boundaries; inspect interaction-results.json');
 console.log('7개 흐름도 재생 조작·확대·단계 선택 및 데스크톱·모바일 레이아웃 통과');
}finally{await browser.close();}
