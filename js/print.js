/* ============================================
   打印 (A4) - 收据风格 + 可爱排版
   ============================================ */
(function(){

  // 根据照片数量选择合适的列数
  // 1张=全宽，2-4张=2列，5-9张=3列，10-16=4列，17+ = 4 列 分组
  function pickColumns(n){
    if(n <= 1) return 1;
    if(n <= 4) return 2;
    if(n <= 9) return 3;
    return 4;
  }

  // 渲染所有照片：按列数和分组渲染，确保每一张都被渲染
  function renderPhotosHTML(photoData){
    if(!photoData || !photoData.length) return '';
    const total = photoData.length;
    const cols = pickColumns(total);
    const perPage = Math.max(6, cols * 3); // 每 6-12 张一组，避免一页塞太满
    const groups = [];
    for(let i=0;i<total;i+=perPage){
      groups.push(photoData.slice(i, i+perPage));
    }
    return groups.map((g, gi)=>{
      const realCols = pickColumns(g.length);
      return `
        <div class="photo-group">
          <div class="photos-grid n${realCols}">
            ${g.map(u=>`<div class="photo"><img src="${window.U.escape(u)}" loading="eager" decoding="async"/></div>`).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  async function buildPrintHTML(r){
    const photos = await DB.getPhotosForRecipe(r.id);
    const cat = window.U.getCategory(r.category);
    const photoData = [];
    for(const p of photos){
      try{
        const url = window.U.blobToUrl(p.blob);
        photoData.push(url);
      }catch(e){}
    }

    return `
<!doctype html><html lang="zh-CN"><head>
<meta charset="utf-8"/>
<title>${window.U.escape(r.name)} - 幸福食谱</title>
<style>
  @page { size: A4; margin: 14mm; }
  *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  body{
    font-family: "Helvetica Neue","PingFang SC","Microsoft YaHei", system-ui, sans-serif;
    color:#2d4a5a; background:#fff;
    margin:0;
    padding:0;
  }
  .sheet{
    width: 100%;
    border: 2px dashed #4ba7ca;
    border-radius: 22px;
    padding: 22px 26px;
    background: linear-gradient(180deg, #f4faff 0%, #fff7f9 100%);
  }
  .photos-grid{
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
    margin-bottom: 18px;
  }
  .photos-grid.n1{grid-template-columns:1fr;}
  .photos-grid.n2{grid-template-columns:repeat(2,1fr);}
  .photos-grid.n3{grid-template-columns:repeat(3,1fr);}
  .photos-grid.n4{grid-template-columns:repeat(4,1fr);}
  .photos-grid.n5{grid-template-columns:repeat(5,1fr);}
  .photos-grid.n6{grid-template-columns:repeat(6,1fr);}
  .photo{
    width: 100%; aspect-ratio: 1/1; border-radius: 14px; overflow: hidden;
    box-shadow: 0 4px 14px rgba(75,167,202,.18);
    background:#fff;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .photo img{width:100%;height:100%;object-fit:cover;display:block;}
  /* 大量照片时按页分组：每 6 张一组（单列3列2行 / 6列1行 均可） */
  .photo-group{
    margin-bottom: 12px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .title-block{
    text-align: center;
    margin-bottom: 12px;
  }
  .title-block h2{
    margin: 8px 0 6px;
    font-size: 26px;
    color: #3d8fa8;
  }
  .meta-line{
    text-align:center; font-size: 13px; color: #5a7384;
  }
  .meta-line .chip{
    display:inline-block; background: rgba(75,167,202,.10); color: #3d8fa8;
    padding: 3px 10px; border-radius: 999px; margin: 2px;
  }
  .meta-line .chip.pink{background: rgba(255,182,193,.22); color:#c14d63;}
  .section{
    margin-top: 16px;
    padding: 14px 16px;
    border-radius: 18px;
    background: rgba(255,255,255,.95);
    border: 1px solid #d9eef5;
    page-break-inside: avoid;
  }
  .section h3{
    margin:0 0 10px;
    color: #3d8fa8;
    font-size: 18px;
    padding-left: 10px;
    border-left: 5px solid #4ba7ca;
  }
  .ing-grid{
    display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px;
  }
  .ing-grid .ing{
    display:flex; align-items:center; gap:8px;
    padding: 5px 0;
    border-bottom: 1px dashed #d9eef5;
    font-size: 13px;
  }
  .ing .dot{
    width:14px;height:14px;border-radius:50%; background: linear-gradient(135deg,#ffb6c1,#ff8fa3); flex-shrink:0;
  }
  .ing .nm{flex:1; font-weight:600;}
  .ing .qt{color:#3d8fa8; font-size:12px;}
  .step{
    display:flex; gap:10px; align-items:flex-start;
    padding: 8px 0;
    border-bottom: 1px dashed #d9eef5;
  }
  .step:last-child{border-bottom:none;}
  .step .n{
    width: 26px; height: 26px; border-radius: 50%;
    background: linear-gradient(135deg,#4ba7ca,#3d8fa8);
    color:#fff; font-weight: 800; font-size: 13px;
    display:flex; align-items:center; justify-content:center;
    flex-shrink: 0;
  }
  .step .t{flex:1; font-size: 13px; line-height: 1.6; color:#2d4a5a;}
  .notes{
    background: linear-gradient(160deg,#fff8f1,#fff0f5);
    border-radius: 14px; padding: 12px 14px;
    font-size: 13px; line-height: 1.6;
    color: #2d4a5a;
    margin-top: 14px;
    page-break-inside: avoid;
  }
  .footer{
    margin-top: 18px; text-align: center; color: #5a7384; font-size: 11px;
    border-top: 2px dashed #bfe2ec; padding-top: 10px;
  }
  .footer .brand{
    font-family: "Bradley Hand","Snell Roundhand","Comic Sans MS", cursive;
    font-size: 18px; color: #c14d63;
  }
  @media print {
    .noprint{display:none;}
  }
  .noprint{padding:10px;text-align:center;}
  .noprint button{
    border:none; background:#4ba7ca; color:#fff; padding:10px 22px;
    border-radius: 999px; font-family: inherit; font-weight: 700; cursor:pointer; font-size:15px;
  }
</style>
</head>
<body>
<div class="sheet">
  ${renderPhotosHTML(photoData)}

  <div class="title-block">
    <h2>${window.U.escape(r.name)}</h2>
    <div class="meta-line">
      <span class="chip">${cat.emoji} ${window.U.escape(r.category)}</span>
      ${r.servings?`<span class="chip">🍽 ${window.U.escape(r.servings)}</span>`:''}
      ${r.prepTime?`<span class="chip">⏱ ${window.U.escape(r.prepTime)}</span>`:''}
      ${r.cookTime?`<span class="chip">🔥 ${window.U.escape(r.cookTime)}</span>`:''}
      ${r.favorite?'<span class="chip pink">❤️ 收藏</span>':''}
      ${(r.tags||[]).map(t=>`<span class="chip">#${window.U.escape(t)}</span>`).join('')}
    </div>
  </div>

  ${r.ingredients && r.ingredients.length ? `
    <div class="section">
      <h3>🥣 食材 Ingredients</h3>
      <div class="ing-grid">
        ${r.ingredients.map(it=>`
          <div class="ing">
            <div class="dot"></div>
            <div class="nm">${window.U.escape(it.name||'')}</div>
            ${it.qty?`<div class="qt">${window.U.escape(it.qty)}</div>`:''}
          </div>
        `).join('')}
      </div>
    </div>
  ` : ''}

  ${r.steps && r.steps.length ? `
    <div class="section">
      <h3>👩🏻‍🍳 步骤 Steps</h3>
      ${r.steps.map((s,i)=>`
        <div class="step">
          <div class="n">${i+1}</div>
          <div class="t">${window.U.escape(s)}</div>
        </div>
      `).join('')}
    </div>
  ` : ''}

  ${r.notes ? `<div class="notes"><strong>📝 小笔记：</strong><br/>${window.U.escape(r.notes).replace(/\n/g,'<br/>')}</div>` : ''}

  <div class="footer">
    <div class="brand">made with love · ${new Date().toLocaleDateString()}</div>
    <div>🍯 幸福食谱 · 本食谱保存在你的手机本地</div>
  </div>

  <div class="noprint">
    <button onclick="window.print()">🖨️ 打印此页 (A4)</button>
  </div>
</div>
</body></html>`;
  }

  // 等所有图片加载完成（promise 化）
  function waitForImagesIn(win){
    return new Promise(resolve=>{
      try{
        const imgs = Array.from(win.document.images || []);
        if(imgs.length === 0){ resolve(); return; }
        let pending = imgs.length;
        let done = false;
        const finish = ()=>{ if(!done){ done = true; resolve(); } };
        const tick = ()=>{ if(--pending <= 0) finish(); };
        imgs.forEach(img=>{
          if(img.complete && img.naturalWidth>0){ tick(); return; }
          img.addEventListener('load', tick, { once:true });
          img.addEventListener('error', tick, { once:true });
        });
        // 兜底：最多等 8 秒
        setTimeout(finish, 8000);
      }catch(e){ resolve(); }
    });
  }

  // 把 HTML 注入到一个 target window 并等待所有图片加载完成，再触发打印
  async function injectAndWait(targetDoc, targetWin, html){
    targetDoc.open();
    targetDoc.write(html);
    targetDoc.close();
    // 等 DOM 完成解析
    await new Promise(res=>{
      if(targetDoc.readyState === 'complete') return res();
      targetWin.addEventListener('load', res, { once:true });
      setTimeout(res, 500);
    });
    await waitForImagesIn(targetWin);
  }

  async function printRecipe(r){
    window.U.toast('正在准备打印页…');
    const html = await buildPrintHTML(r);
    const w = window.open('', '_blank');
    if(!w){
      // iOS Safari 不能开新窗口 → 退化为 iframe
      const iframe = document.createElement('iframe');
      iframe.style.position='fixed'; iframe.style.right='-9999px'; iframe.style.width='0'; iframe.style.height='0';
      iframe.style.border='0';
      document.body.appendChild(iframe);
      const idoc = iframe.contentDocument || iframe.contentWindow.document;
      // 必须先 src 设个 about:blank，然后用 document.write
      iframe.src = 'about:blank';
      await new Promise(res=>{ iframe.onload = res; setTimeout(res, 200); });
      await injectAndWait(idoc, iframe.contentWindow, html);
      try{ iframe.contentWindow.focus(); iframe.contentWindow.print(); }catch(e){ window.U.toast('请允许弹窗以打印'); }
      setTimeout(()=>iframe.remove(), 30000);
      window.U.toast('打印已发送 ✅');
      return;
    }
    await injectAndWait(w.document, w, html);
    try{ w.focus(); w.print(); }catch(e){}
    window.U.toast('打印已发送 ✅');
  }

  window.PrintAPI = { printRecipe, buildPrintHTML, renderPhotosHTML, pickColumns };
})();
