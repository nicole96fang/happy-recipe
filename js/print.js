/* ============================================
   打印 (A4) - iOS 友好方案 v3
   策略：
   1) 屏幕模式：print-root 是一个 inline preview div，显示完整内容
      + 顶部一个工具栏（🖨️打印 / ✕关闭）
   2) 打印模式：隐藏工具栏，隐藏主页其他内容
   3) 直接调顶层 window.print() → iOS AirPrint
   4) iOS PDF 引擎读的是 print-root 当前 DOM（不是隐藏的）
   ============================================ */
(function(){

  // 把 Blob 转成 data URL
  function blobToDataURL(blob){
    return new Promise((resolve, reject)=>{
      const fr = new FileReader();
      fr.onload = ()=>resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  }

  function pickColumns(n){
    if(n <= 1) return 1;
    if(n <= 4) return 2;
    if(n <= 9) return 3;
    return 4;
  }

  function renderPhotosHTML(photoData){
    if(!photoData || !photoData.length) return '';
    const total = photoData.length;
    const cols = pickColumns(total);
    const perPage = Math.max(6, cols * 3);
    const groups = [];
    for(let i=0;i<total;i+=perPage) groups.push(photoData.slice(i, i+perPage));
    return groups.map(g => {
      const realCols = pickColumns(g.length);
      return `<div class="print-photo-group">
        <div class="print-photo-grid print-n${realCols}">
          ${g.map(u=>`<div class="print-photo"><img src="${window.U.escape(u)}" alt=""/></div>`).join('')}
        </div>
      </div>`;
    }).join('');
  }

  async function buildPrintHTML(r){
    const photos = await DB.getPhotosForRecipe(r.id);
    const cat = window.U.getCategory(r.category);
    const photoData = [];
    for(const p of photos){
      try{ photoData.push(await blobToDataURL(p.blob)); }catch(e){}
    }

    return `
<div class="print-sheet">
  ${renderPhotosHTML(photoData)}

  <div class="print-title-block">
    <h2>${window.U.escape(r.name)}</h2>
    <div class="print-meta-line">
      <span class="print-chip">${cat.emoji} ${window.U.escape(r.category)}</span>
      ${r.servings?`<span class="print-chip">🍽 ${window.U.escape(r.servings)}</span>`:''}
      ${r.prepTime?`<span class="print-chip">⏱ ${window.U.escape(r.prepTime)}</span>`:''}
      ${r.cookTime?`<span class="print-chip">🔥 ${window.U.escape(r.cookTime)}</span>`:''}
      ${r.favorite?'<span class="print-chip pink">❤️ 收藏</span>':''}
      ${(r.tags||[]).map(t=>`<span class="print-chip">#${window.U.escape(t)}</span>`).join('')}
    </div>
  </div>

  ${r.ingredients && r.ingredients.length ? `
    <div class="print-section">
      <h3>🥣 食材 Ingredients</h3>
      <div class="print-ing-grid">
        ${r.ingredients.map(it=>`
          <div class="print-ing">
            <div class="print-ing-dot"></div>
            <div class="print-ing-nm">${window.U.escape(it.name||'')}</div>
            ${it.qty?`<div class="print-ing-qt">${window.U.escape(it.qty)}</div>`:''}
          </div>
        `).join('')}
      </div>
    </div>
  ` : ''}

  ${r.steps && r.steps.length ? `
    <div class="print-section">
      <h3>👩🏻‍🍳 步骤 Steps</h3>
      ${r.steps.map((s,i)=>`
        <div class="print-step">
          <div class="print-step-n">${i+1}</div>
          <div class="print-step-t">${window.U.escape(s)}</div>
        </div>
      `).join('')}
    </div>
  ` : ''}

  ${r.notes ? `<div class="print-notes"><strong>📝 小笔记：</strong><br/>${window.U.escape(r.notes).replace(/\n/g,'<br/>')}</div>` : ''}

  <div class="print-footer">
    <div class="print-brand">made with love · ${new Date().toLocaleDateString()}</div>
    <div>🍯 幸福食谱 · 本食谱保存在你的手机本地</div>
  </div>
</div>`;
  }

  function ensureStyle(){
    if(document.getElementById('print-style')) return;
    const s = document.createElement('style');
    s.id = 'print-style';
    s.textContent = `
      /* === 屏幕模式 === */
      #print-root{
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,.55);
        z-index: 9999;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        padding: 16px;
        animation: printRootIn .2s ease;
      }
      @keyframes printRootIn{ from{opacity:0;} to{opacity:1;} }
      .print-toolbar{
        position: sticky;
        top: 0;
        z-index: 10;
        display: flex; align-items: center; gap: 10px;
        padding: 10px 12px;
        background: linear-gradient(135deg, #4ba7ca, #ffb6c1);
        color: #fff;
        border-radius: 14px;
        margin-bottom: 12px;
        box-shadow: 0 6px 20px rgba(0,0,0,.18);
      }
      .print-toolbar .pt-title{
        flex: 1; text-align: center; font-weight: 700; font-size: 14px;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .pt-btn{
        border: none; padding: 8px 14px; border-radius: 999px;
        cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 700;
      }
      .pt-close{ background: rgba(255,255,255,.2); color: #fff; }
      .pt-print{ background: #fff; color: #3d8fa8; }
      #print-root .print-sheet{
        max-width: 720px; margin: 0 auto;
        box-shadow: 0 12px 40px rgba(0,0,0,.3);
      }

      /* === 打印时 === */
      @media print {
        /* 加在 body 上的 class，控制全屏隐藏所有非打印内容 */
        body.printing > *:not(#print-root){ display: none !important; }
        body.printing{ background: #fff !important; }
        #print-root{
          position: static !important;
          background: #fff !important;
          padding: 0 !important;
          overflow: visible !important;
        }
        .print-toolbar{ display: none !important; }
        #print-root .print-sheet{
          max-width: none !important; margin: 0 !important;
          box-shadow: none !important;
        }
        @page { size: A4; margin: 14mm; }
      }

      /* === 打印内容样式（与 modal 版一致）=== */
      .print-sheet{
        width: 100%;
        border: 2px dashed #4ba7ca;
        border-radius: 22px;
        padding: 22px 26px;
        background: linear-gradient(180deg, #f4faff 0%, #fff7f9 100%);
        font-family: "LXGW WenKai TC","LXGW WenKai","霞鹜文楷","PingFang SC","Microsoft YaHei", sans-serif;
        color: #2d4a5a;
        box-sizing: border-box;
      }
      .print-photo-group{ margin-bottom: 12px; page-break-inside: avoid; break-inside: avoid; }
      .print-photo-grid{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .print-photo-grid.print-n1{ grid-template-columns: 1fr; }
      .print-photo-grid.print-n2{ grid-template-columns: repeat(2, 1fr); }
      .print-photo-grid.print-n3{ grid-template-columns: repeat(3, 1fr); }
      .print-photo-grid.print-n4{ grid-template-columns: repeat(4, 1fr); }
      .print-photo-grid.print-n5{ grid-template-columns: repeat(5, 1fr); }
      .print-photo-grid.print-n6{ grid-template-columns: repeat(6, 1fr); }
      .print-photo{
        width: 100%; aspect-ratio: 1/1; border-radius: 14px; overflow: hidden;
        background: #fff; box-shadow: 0 4px 14px rgba(75,167,202,.18);
        page-break-inside: avoid; break-inside: avoid;
      }
      .print-photo img{ width: 100%; height: 100%; object-fit: cover; display: block; }
      .print-title-block{ text-align: center; margin-bottom: 12px; }
      .print-title-block h2{
        margin: 8px 0 6px; font-size: 26px; color: #3d8fa8;
        font-weight: 400; letter-spacing: 1px;
      }
      .print-meta-line{ text-align: center; font-size: 13px; color: #5a7384; }
      .print-chip{
        display: inline-block; background: rgba(75,167,202,.10); color: #3d8fa8;
        padding: 3px 10px; border-radius: 999px; margin: 2px;
      }
      .print-chip.pink{ background: rgba(255,182,193,.22); color: #c14d63; }
      .print-section{
        margin-top: 16px; padding: 14px 16px; border-radius: 18px;
        background: rgba(255,255,255,.95); border: 1px solid #d9eef5;
        page-break-inside: avoid; break-inside: avoid;
      }
      .print-section h3{
        margin: 0 0 10px; color: #3d8fa8; font-size: 18px; font-weight: 400;
        padding-left: 10px; border-left: 5px solid #4ba7ca; letter-spacing: 1px;
      }
      .print-ing-grid{ display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; }
      .print-ing{
        display: flex; align-items: center; gap: 8px; padding: 5px 0;
        border-bottom: 1px dashed #d9eef5; font-size: 13px;
      }
      .print-ing:last-child{ border-bottom: none; }
      .print-ing-dot{
        width: 14px; height: 14px; border-radius: 50%;
        background: linear-gradient(135deg, #ffb6c1, #ff8fa3);
        flex-shrink: 0;
      }
      .print-ing-nm{ flex: 1; font-weight: 600; }
      .print-ing-qt{ color: #3d8fa8; font-size: 12px; }
      .print-step{
        display: flex; gap: 10px; align-items: flex-start;
        padding: 8px 0; border-bottom: 1px dashed #d9eef5;
      }
      .print-step:last-child{ border-bottom: none; }
      .print-step-n{
        width: 26px; height: 26px; border-radius: 50%;
        background: linear-gradient(135deg, #4ba7ca, #3d8fa8);
        color: #fff; font-weight: 400; font-size: 16px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .print-step-t{ flex: 1; font-size: 13px; line-height: 1.7; color: #2d4a5a; }
      .print-notes{
        background: linear-gradient(160deg, #fff8f1, #fff0f5);
        border-radius: 14px; padding: 12px 14px;
        font-size: 13px; line-height: 1.7; color: #2d4a5a;
        margin-top: 14px; page-break-inside: avoid;
      }
      .print-footer{
        margin-top: 18px; text-align: center; color: #5a7384; font-size: 11px;
        border-top: 2px dashed #bfe2ec; padding-top: 10px;
      }
      .print-brand{
        font-family: "Caveat","Long Cang","LXGW WenKai TC", cursive;
        font-size: 18px; color: #c14d63;
      }
    `;
    document.head.appendChild(s);
  }

  function waitForPrintImages(){
    return new Promise(resolve=>{
      const root = document.getElementById('print-root');
      if(!root){ resolve(); return; }
      const imgs = Array.from(root.querySelectorAll('img'));
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
      setTimeout(finish, 10000);
    });
  }

  function cleanup(){
    document.body.classList.remove('printing');
    const root = document.getElementById('print-root');
    if(root) root.remove();
    const st = document.getElementById('print-style');
    if(st) st.remove();
  }

  async function printRecipe(r){
    window.U.toast('正在准备打印页…');
    // 先清理旧的 print-root（保留 style 块）
    const old = document.getElementById('print-root');
    if(old) old.remove();
    // 再注入/确保 style
    ensureStyle();

    const root = document.createElement('div');
    root.id = 'print-root';
    root.innerHTML = `
      <div class="print-toolbar">
        <button class="pt-btn pt-close" type="button">✕ 关闭</button>
        <div class="pt-title">打印预览 · ${window.U.escape(r.name||'')}</div>
        <button class="pt-btn pt-print" type="button">🖨️ 开始打印</button>
      </div>
      ${await buildPrintHTML(r)}
    `;
    document.body.appendChild(root);

    // 等图片加载完
    await waitForPrintImages();

    // 关闭按钮
    root.querySelector('.pt-close').onclick = ()=>{
      cleanup();
    };

    // 打印按钮
    root.querySelector('.pt-print').onclick = ()=>{
      window.U.toast('正在打开系统打印面板…');
      try{
        document.body.classList.add('printing');
        // 给浏览器一点时间应用 print 样式
        setTimeout(()=>{ window.print(); }, 50);
      }catch(e){ window.U.toast('打印失败：'+(e.message||e)); }
    };

    // 监听 afterprint 自动清理
    const onAfter = ()=>{
      document.body.classList.remove('printing');
      cleanup();
      window.removeEventListener('afterprint', onAfter);
    };
    window.addEventListener('afterprint', onAfter);

    window.U.toast('预览已就绪，点右上"开始打印" 🖨️', 3000);
  }

  window.PrintAPI = { printRecipe, buildPrintHTML, renderPhotosHTML, pickColumns, cleanup };
})();
