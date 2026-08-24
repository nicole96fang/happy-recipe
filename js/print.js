/* ============================================
   打印 (A4) - 收据风格 + 可爱排版
   ============================================ */
(function(){

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
  .header{
    text-align: center;
    padding-bottom: 14px;
    border-bottom: 2px dashed #bfe2ec;
    margin-bottom: 18px;
  }
  .header h1{
    margin: 0;
    font-size: 32px;
    color: #3d8fa8;
    letter-spacing: 1px;
  }
  .header .sub{
    margin-top: 6px;
    color: #5a7384;
    font-size: 13px;
  }
  .photos-grid{
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
    margin-bottom: 18px;
    page-break-inside: avoid;
  }
  .photos-grid.cols-1{grid-template-columns:1fr;}
  .photos-grid.cols-3{grid-template-columns:repeat(3,1fr);}
  .photo{
    width: 100%; aspect-ratio: 1/1; border-radius: 16px; overflow: hidden;
    box-shadow: 0 4px 14px rgba(75,167,202,.18);
  }
  .photo img{width:100%;height:100%;object-fit:cover;display:block;}

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
  <div class="header">
    <div style="font-size:30px;">🍯</div>
    <h1>幸福食谱</h1>
    <div class="sub">Happy Recipe · 用心记录每一餐</div>
  </div>

  ${photoData.length ? `
    <div class="photos-grid ${photoData.length===1?'cols-1':photoData.length>=3?'cols-3':''}">
      ${photoData.map(u=>`<div class="photo"><img src="${window.U.escape(u)}"/></div>`).join('')}
    </div>
  ` : ''}

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

  async function printRecipe(r){
    const html = await buildPrintHTML(r);
    const w = window.open('', '_blank');
    if(!w){
      // iOS Safari 不能开新窗口 → 退化为 iframe
      const iframe = document.createElement('iframe');
      iframe.style.position='fixed'; iframe.style.right='-9999px'; iframe.style.width='0'; iframe.style.height='0';
      document.body.appendChild(iframe);
      const idoc = iframe.contentDocument || iframe.contentWindow.document;
      idoc.open(); idoc.write(html); idoc.close();
      iframe.contentWindow.focus();
      setTimeout(()=>{ try{ iframe.contentWindow.print(); }catch(e){ toast('请允许弹窗以打印'); } }, 600);
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(()=>{
      try{ w.focus(); w.print(); }catch(e){}
    }, 700);
  }

  window.PrintAPI = { printRecipe, buildPrintHTML };
})();
