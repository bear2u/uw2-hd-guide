(() => {
  const data = JSON.parse(document.getElementById('export-data').textContent);
  const stage = document.getElementById('stage');
  const svg = stage.querySelector('svg');
  svg.style.maxWidth = 'none';
  const zoom = document.getElementById('map-zoom');
  const status = document.getElementById('png-status');
  const button = document.getElementById('export-png');
  const applyZoom = () => {
    const box = svg.viewBox.baseVal;
    const padding = parseFloat(getComputedStyle(stage).paddingLeft) + parseFloat(getComputedStyle(stage).paddingRight);
    const ratio = zoom.value === 'fit' ? Math.min(1, (stage.clientWidth - padding) / box.width) : Number(zoom.value);
    svg.style.width = `${box.width * ratio}px`;
    svg.style.height = `${box.height * ratio}px`;
  };
  zoom.addEventListener('change', applyZoom);
  new ResizeObserver(applyZoom).observe(stage);
  applyZoom();
  document.getElementById('show-all').addEventListener('click', () => {
    window.__flow.seek(window.__flow.TOTAL);
    stage.scrollTo({top:0, left:0, behavior:'instant'});
  });
  button.addEventListener('click', async event => {
    button.disabled = true;
    status.textContent = '전체 그림을 저장하고 있습니다…';
    let imageUrl, downloadUrl;
    try {
      await document.fonts.ready;
      const transparent = event.shiftKey || document.getElementById('transparent-png').checked;
      const documentSvg = new DOMParser().parseFromString(data.svg, 'image/svg+xml').documentElement;
      const bounds = documentSvg.getAttribute('viewBox').split(/[ ,]+/).map(Number);
      const width = bounds[2], height = bounds[3];
      // Export the original completed SVG, independent of playback position and zoom.
      documentSvg.setAttribute('width', String(width));
      documentSvg.setAttribute('height', String(height));
      documentSvg.style.background = 'transparent';
      const scale = Math.min(2, 8192 / width, 8192 / height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(width * scale);
      canvas.height = Math.ceil(height * scale);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('이미지 저장을 사용할 수 없습니다.');
      if (!transparent) { context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); }
      imageUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(documentSvg)], {type:'image/svg+xml;charset=utf-8'}));
      const img = new Image();
      img.src = imageUrl;
      await img.decode();
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('이미지를 만들지 못했습니다.');
      downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = data.id + (transparent ? '-transparent' : '') + '.png';
      document.body.append(link); link.click(); link.remove();
      status.textContent = `전체 그림 저장 완료 · ${canvas.width} × ${canvas.height}${transparent ? ' · 투명 배경' : ''}`;
    } catch (error) {
      status.textContent = 'PNG 저장에 실패했습니다. SVG 링크로 전체 그림을 저장할 수 있습니다.';
      console.error(error);
    } finally {
      button.disabled = false;
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      if (downloadUrl) setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);
    }
  });
})();
