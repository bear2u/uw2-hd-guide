(() => {
  const f=window.__flow,svg=document.querySelector('#stage svg.ondine'),stage=document.getElementById('stage');
  if(!f||!svg)return;
  svg.style.maxWidth="none";
  const width=svg.viewBox.baseVal.width,height=svg.viewBox.baseVal.height;
  const zoom=document.getElementById('zoom');
  const embedded=document.documentElement.classList.contains('is-embed');
  if(embedded){
    document.querySelectorAll('.player-header,.chapter-nav,.reading-note,.under-map,body>footer').forEach(el=>el.remove());
    zoom.value='fit';
    document.getElementById('show-all').textContent='전체 펼치기';
    addEventListener('message',event=>{
      if(event.source!==parent||event.origin!==location.origin)return;
      if(event.data?.type==='guide-flow-play')f.play();
      if(event.data?.type==='guide-flow-pause')f.pause();
    });
    document.addEventListener('visibilitychange',()=>{if(document.hidden)f.pause();});
  }
  function resize(){
    const value=zoom.value,padding=embedded?24:64;
    const fitWidth=(stage.clientWidth-padding)/width;
    const fit=embedded?Math.min(fitWidth,(stage.clientHeight-padding)/height):Math.max(.12,fitWidth);
    const factor=value==='fit'?Math.max(.01,fit):Number(value);
    svg.style.width=`${width*factor}px`;svg.style.height=`${height*factor}px`;
  }
  zoom.addEventListener('change',resize);window.addEventListener('resize',resize);resize();
  if(embedded){
    new ResizeObserver(resize).observe(stage);
    parent.postMessage({type:'guide-flow-ready'},location.origin);
  }
  document.getElementById('show-all').addEventListener('click',()=>{f.seek(f.TOTAL);zoom.value='fit';resize();stage.scrollTo({top:0,left:0,behavior:'auto'});});
  const list=document.getElementById('step-list');
  if(!list)return;
  document.getElementById('step-total').textContent=`${f.beats.length}단계`;
  f.beats.forEach(b=>{const li=document.createElement('li'),btn=document.createElement('button');btn.type='button';btn.textContent=b.text;btn.addEventListener('click',()=>{f.seek(b.end);const r=b.el.getBoundingClientRect(),s=stage.getBoundingClientRect();stage.scrollTo({left:Math.max(0,stage.scrollLeft+r.left-s.left+r.width/2-stage.clientWidth/2),top:Math.max(0,stage.scrollTop+r.top-s.top+r.height/2-stage.clientHeight/2),behavior:'auto'});});li.append(btn);list.append(li);});
})();
