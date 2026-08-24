/* ============================================
   分享 · 导出 PDF
   ============================================ */
(function(){
  async function blobToDataURL(blob){
    return new Promise((res,rej)=>{
      const fr = new FileReader();
      fr.onload = ()=>res(fr.result);
      fr.onerror = rej;
      fr.readAsDataURL(blob);
    });
  }

  async function sharePDF(r){
    if(typeof window.jspdf === 'undefined'){
      toast('PDF 引擎加载中，请稍后再试');
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit:'mm', format:'a4', orientation:'portrait' });
    const pageW = 210, pageH = 297, M = 14;

    // 标题块
    doc.setFillColor(244, 250, 255);
    doc.rect(0, 0, pageW, 36, 'F');
    doc.setFontSize(22); doc.setTextColor(61, 143, 168);
    doc.text('Happy Recipe · 幸福食谱', pageW/2, 16, { align:'center' });
    doc.setFontSize(11); doc.setTextColor(90, 115, 132);
    doc.text('用心记录每一餐 · ' + new Date().toLocaleDateString(), pageW/2, 24, { align:'center' });
    doc.setDrawColor(191, 226, 236); doc.setLineDashPattern([2,2],0);
    doc.line(M, 30, pageW-M, 30);

    // 食谱标题
    let y = 42;
    doc.setFontSize(20); doc.setTextColor(61, 143, 168);
    doc.text(r.name || '未命名', pageW/2, y, { align:'center' });
    y += 7;
    doc.setFontSize(10); doc.setTextColor(90, 115, 132);
    const meta = [
      window.U.getCategory(r.category).emoji + ' ' + r.category,
      r.servings ? '🍽 ' + r.servings : '',
      r.prepTime ? '⏱ ' + r.prepTime : '',
      r.cookTime ? '🔥 ' + r.cookTime : '',
      r.favorite ? '❤️ 收藏' : ''
    ].filter(Boolean).join('   ');
    doc.text(meta, pageW/2, y, { align:'center' });
    y += 4;
    if((r.tags||[]).length){
      doc.setTextColor(193, 77, 99);
      doc.text(r.tags.map(t=>'#'+t).join(' '), pageW/2, y, { align:'center' });
      y += 6;
    } else y += 2;

    // 照片
    const photos = await DB.getPhotosForRecipe(r.id);
    const photoDataUrls = [];
    for(const p of photos){ try{ photoDataUrls.push(await blobToDataURL(p.blob)); }catch(e){} }

    if(photoDataUrls.length){
      const colW = (pageW - M*2 - 6) / 2;
      let px = M, py = y + 2; let col = 0;
      for(let i=0;i<photoDataUrls.length;i++){
        const size = colW;
        if(py + size > pageH - 30){
          doc.addPage(); y = M; px = M; py = M; col = 0;
        }
        try{ doc.addImage(photoDataUrls[i], 'JPEG', px, py, size, size, undefined, 'FAST'); }catch(e){
          try{ doc.addImage(photoDataUrls[i], 'PNG', px, py, size, size, undefined, 'FAST'); }catch(e2){}
        }
        col++;
        if(col===2){ col=0; px=M; py += size + 6; }
        else { px += colW + 6; }
      }
      if(col===1) y = py + size + 8;
      else y = py + 4;
    }

    if(y < 40) y = 40;
    // 检查是否新页
    if(y > pageH - 60){ doc.addPage(); y = M; }

    // 食材
    if(r.ingredients && r.ingredients.length){
      drawSectionTitle(doc, '🥣 食材 Ingredients', M, y);
      y += 8;
      const colCount = 2;
      const colW = (pageW - M*2 - 4) / colCount;
      const rowH = 7;
      for(let i=0;i<r.ingredients.length;i++){
        const ci = i % colCount;
        if(ci===0 && i>0) y += rowH;
        if(y > pageH - 20){ doc.addPage(); y = M; }
        const x = M + ci*(colW+4);
        // 圆点
        doc.setFillColor(255, 182, 193);
        doc.circle(x+2, y-1.5, 1.6, 'F');
        doc.setFontSize(11); doc.setTextColor(45, 74, 90);
        doc.text((r.ingredients[i].name||''), x+6, y);
        doc.setTextColor(61, 143, 168);
        const qty = r.ingredients[i].qty || '';
        if(qty) doc.text(qty, x + colW - 2, y, { align:'right' });
        doc.setDrawColor(217, 238, 245); doc.setLineDashPattern([1,1],0);
        doc.line(x, y+2, x+colW, y+2);
      }
      y += 8;
    }

    // 步骤
    if(r.steps && r.steps.length){
      if(y > pageH - 50){ doc.addPage(); y = M; }
      drawSectionTitle(doc, '👩🏻‍🍳 步骤 Steps', M, y);
      y += 8;
      const wrapW = pageW - M*2;
      for(let i=0;i<r.steps.length;i++){
        const lines = doc.splitTextToSize(r.steps[i]||'', wrapW - 12);
        const blockH = lines.length * 6 + 2;
        if(y + blockH > pageH - 18){ doc.addPage(); y = M; }
        // 编号圆
        doc.setFillColor(75, 167, 202);
        doc.circle(M+4, y+1, 4.5, 'F');
        doc.setTextColor(255); doc.setFontSize(11);
        doc.text(String(i+1), M+4, y+2, { align:'center' });
        doc.setTextColor(45, 74, 90); doc.setFontSize(11);
        doc.text(lines, M+12, y+2);
        y += blockH + 3;
      }
    }

    // 笔记
    if(r.notes){
      if(y > pageH - 30){ doc.addPage(); y = M; }
      drawSectionTitle(doc, '📝 小笔记 Notes', M, y);
      y += 8;
      const lines = doc.splitTextToSize(r.notes, pageW - M*2);
      doc.setFontSize(11); doc.setTextColor(45, 74, 90);
      doc.text(lines, M, y);
      y += lines.length * 6 + 6;
    }

    // 页脚
    const total = doc.internal.getNumberOfPages();
    for(let i=1;i<=total;i++){
      doc.setPage(i);
      doc.setFontSize(9); doc.setTextColor(150, 165, 178);
      doc.text('🍯 Happy Recipe · ' + (r.name||'') + '  · 第 ' + i + '/' + total + ' 页', pageW/2, pageH-8, { align:'center' });
    }

    const filename = (r.name||'recipe') + '.pdf';
    try{
      const blob = doc.output('blob');
      if(navigator.canShare && navigator.canShare({ files:[new File([blob], filename, { type:'application/pdf' })] })){
        const file = new File([blob], filename, { type:'application/pdf' });
        try{
          await navigator.share({ files:[file], title:r.name, text:'来自幸福食谱的分享 🍯' });
          toast('已分享 ✅');
          return;
        }catch(e){ /* fall through */ }
      }
      // 退化为下载
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 60000);
      toast('PDF 已下载到本地 ✅');
    }catch(e){
      console.warn(e);
      toast('生成 PDF 失败：'+ (e.message||e));
    }
  }

  function drawSectionTitle(doc, title, x, y){
    doc.setFillColor(75, 167, 202);
    doc.rect(x, y-4, 1.6, 6, 'F');
    doc.setFontSize(14); doc.setTextColor(61, 143, 168);
    doc.text(title, x+4, y);
  }

  window.ShareAPI = { sharePDF };
})();
