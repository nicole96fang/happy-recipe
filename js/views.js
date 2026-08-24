/* ============================================
   视图渲染
   ============================================ */
(function(){
  const { CATEGORIES, getCategory, escape, toast, blobToUrl, compressImage } = window.U;

  // 工具：顶部 Brand Bar
  function topbarHTML(opts={}){
    return `
      <header class="topbar">
        <button class="icon-btn" data-action="home" aria-label="回到首页">🏠</button>
        <div class="brand">
          <span class="logo">🍯</span>
          <span>幸福食谱</span>
        </div>
        <div class="actions">
          ${opts.showSearch !== false ? '<button class="icon-btn" data-action="search" aria-label="搜索">🔍</button>' : ''}
          <button class="icon-btn" data-action="backup" aria-label="备份">☁️</button>
        </div>
      </header>
    `;
  }

  // ============================================
  // 首页
  // ============================================
  async function viewHome(searchQ=''){
    const app = document.getElementById('app');
    const all = await DB.getAllRecipes();

    // 每分类数量
    const counts = {};
    let favCount = 0;
    for(const r of all){
      counts[r.category] = (counts[r.category]||0) + 1;
      if(r.favorite) favCount++;
    }

    // 搜索过滤
    let filtered = all;
    if(searchQ){
      const q = searchQ.toLowerCase();
      filtered = all.filter(r => (r.name||'').toLowerCase().includes(q) || (r.tags||[]).join(' ').toLowerCase().includes(q));
    }

    app.innerHTML = `
      ${topbarHTML()}
      <section class="hero page-fade">
        <div class="ornament">🌸 🍯 🌸</div>
        <h1>幸福食谱</h1>
        <div class="script">Happy Recipe · 用心记录每一餐</div>
        <div class="sub">已收藏 ${favCount} 道 · 共 ${all.length} 道 · 全部保存在你的手机</div>
      </section>

      <div class="search-box">
        <span class="lens">🔍</span>
        <input id="search-input" placeholder="搜索食谱名字或标签…" value="${escape(searchQ)}" />
        ${searchQ ? '<button class="icon-btn" data-action="clearsearch" aria-label="清除">✖️</button>' : ''}
      </div>

      ${filtered.length>0 && searchQ ? `
        <div class="section-title"><span>🔍</span> 搜索结果 (${filtered.length})</div>
        <div class="recipe-list">
          ${filtered.map(recipeRowHTML).join('')}
        </div>
      ` : ''}

      ${!searchQ ? `
        <div class="section-title"><span>❤️</span> 收藏 (${favCount})</div>
        <div class="cat-grid" style="grid-template-columns:repeat(2,1fr);">
          <div class="cat-card fav" data-action="showfav">
            <span class="emoji">❤️</span>
            <div class="name">我的收藏</div>
            <span class="count">${favCount} 道</span>
          </div>
          <div class="cat-card" data-action="showrecent">
            <span class="emoji">🕒</span>
            <div class="name">最近添加</div>
            <span class="count">${all.length ? Math.min(all.length, 10) : 0} 道</span>
          </div>
        </div>

        <div class="section-title"><span>🍱</span> 食物分类 <span class="script">Categories</span></div>
        <div class="cat-grid">
          ${CATEGORIES.map(c=>`
            <div class="cat-card" data-action="category" data-id="${escape(c.id)}" style="--accent:${c.color};">
              <span class="emoji">${c.emoji}</span>
              <div class="name">${escape(c.id)}</div>
              <span class="count">${counts[c.id]||0} 道</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;

    bindHome();
  }

  function recipeRowHTML(r){
    return `
      <div class="recipe-card" data-action="openrecipe" data-id="${escape(r.id)}">
        <div class="thumb">
          ${r.cover ? `<img src="${escape(r.cover)}" alt="" loading="lazy"/>` : `<span>${getCategory(r.category).emoji}</span>`}
        </div>
        <div class="body">
          <p class="title">${escape(r.name)}</p>
          <p class="sub">${escape(getCategory(r.category).emoji+' '+r.category)}${r.servings?' · '+escape(r.servings):''}</p>
          ${r.favorite ? '<span class="badge">❤️ 已收藏</span>' : ''}
        </div>
        <div class="heart">${r.favorite?'❤️':'🤍'}</div>
      </div>
    `;
  }

  function bindHome(){
    document.querySelectorAll('[data-action="category"]').forEach(el=>{
      el.onclick = ()=> window.U.go('category', { id: el.dataset.id });
    });
    document.querySelectorAll('[data-action="openrecipe"]').forEach(el=>{
      el.onclick = ()=> window.U.go('recipe', { id: el.dataset.id });
    });
    document.querySelectorAll('[data-action="home"]').forEach(el=>{
      el.onclick = ()=> window.U.go('home');
    });
    document.querySelectorAll('[data-action="backup"]').forEach(el=>{
      el.onclick = ()=> showBackupSheet();
    });
    document.querySelectorAll('[data-action="search"]').forEach(el=>{
      el.onclick = ()=>{ const inp = document.getElementById('search-input'); if(inp){inp.focus(); inp.scrollIntoView({behavior:'smooth'});} else viewHome('').then(()=>setTimeout(()=>{document.getElementById('search-input')?.focus()},50)); };
    });
    document.querySelectorAll('[data-action="clearsearch"]').forEach(el=>{
      el.onclick = ()=> viewHome('');
    });
    document.querySelectorAll('[data-action="showfav"]').forEach(el=>{
      el.onclick = ()=> window.U.go('list', { id: 'favorites' });
    });
    document.querySelectorAll('[data-action="showrecent"]').forEach(el=>{
      el.onclick = ()=> window.U.go('list', { id: 'recent' });
    });
    // 实时搜索
    let timer=null;
    const inp = document.getElementById('search-input');
    if(inp){
      inp.addEventListener('input', (e)=>{
        clearTimeout(timer);
        const v = e.target.value;
        timer = setTimeout(()=> viewHome(v), 220);
      });
    }
  }

  // ============================================
  // 分类页
  // ============================================
  async function viewCategory(categoryId){
    const app = document.getElementById('app');
    const cat = getCategory(categoryId);
    const all = await DB.getAllRecipes();
    const list = all.filter(r=>r.category===categoryId).sort((a,b)=>b.updatedAt-a.updatedAt);

    app.innerHTML = `
      <div class="page-fade">
        <div class="cat-header">
          <button class="back-btn" data-action="home">←</button>
          <div class="ic">${cat.emoji}</div>
          <div class="info">
            <h2>${escape(cat.id)}</h2>
            <div class="meta">共 ${list.length} 道食谱</div>
          </div>
        </div>

        <div class="add-recipe-row">
          <button class="btn btn-pink btn-lg" data-action="newrecipe">
            <span style="font-size:20px;">＋</span> 加入新食谱
          </button>
        </div>

        ${list.length===0 ? `
          <div class="empty">
            <span class="emoji">🧁</span>
            <div>这里还没有食谱</div>
            <div style="margin-top:6px;font-size:13px;">点击上面的按钮，添加第一道美味 🍴</div>
          </div>
        ` : `
          <div class="recipe-list">
            ${list.map(recipeRowHTML).join('')}
          </div>
        `}
      </div>
    `;

    document.querySelectorAll('[data-action="home"]').forEach(el=>el.onclick = ()=> window.U.go('home'));
    document.querySelectorAll('[data-action="newrecipe"]').forEach(el=>el.onclick = ()=> window.U.go('edit', { id: 'new' }, { category: categoryId }));
    document.querySelectorAll('[data-action="openrecipe"]').forEach(el=>{
      el.onclick = ()=> window.U.go('recipe', { id: el.dataset.id });
    });
  }

  // ============================================
  // 列表页（收藏 / 最近添加）
  // ============================================
  async function viewList(listId){
    const app = document.getElementById('app');
    let list, title, emoji, sub;
    const all = await DB.getAllRecipes();
    if(listId==='favorites'){
      list = all.filter(r=>r.favorite).sort((a,b)=>b.updatedAt-a.updatedAt);
      title='我的收藏'; emoji='❤️'; sub=`${list.length} 道喜欢的食谱`;
    } else if(listId==='recent'){
      list = all.slice().sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,30);
      title='最近添加'; emoji='🕒'; sub=`最近 ${list.length} 道食谱`;
    } else {
      list = []; title='列表'; emoji='📚'; sub='';
    }

    app.innerHTML = `
      <div class="page-fade">
        <div class="cat-header">
          <button class="back-btn" data-action="home">←</button>
          <div class="ic">${emoji}</div>
          <div class="info">
            <h2>${title}</h2>
            <div class="meta">${sub}</div>
          </div>
        </div>
        ${list.length===0 ? `
          <div class="empty"><span class="emoji">🌷</span><div>暂无内容</div></div>
        ` : `
          <div class="recipe-list">${list.map(recipeRowHTML).join('')}</div>
        `}
      </div>
    `;
    document.querySelectorAll('[data-action="home"]').forEach(el=>el.onclick = ()=> window.U.go('home'));
    document.querySelectorAll('[data-action="openrecipe"]').forEach(el=>{
      el.onclick = ()=> window.U.go('recipe', { id: el.dataset.id });
    });
  }

  // ============================================
  // 食谱详情页
  // ============================================
  async function viewRecipe(id){
    const app = document.getElementById('app');
    const r = await DB.getRecipe(id);
    if(!r){
      toast('找不到这道食谱');
      return window.U.go('home');
    }
    const photos = await DB.getPhotosForRecipe(id);
    const photoUrls = photos.map(p => blobToUrl(p.blob));
    const cat = getCategory(r.category);

    app.innerHTML = `
      <div class="page-fade">
        <div class="cat-header">
          <button class="back-btn" data-action="back">←</button>
          <div class="ic">${cat.emoji}</div>
          <div class="info">
            <h2>${escape(r.name)}</h2>
            <div class="meta">${escape(r.category)} · ${photos.length} 张照片</div>
          </div>
          <button class="icon-btn primary" data-action="opt">⋯</button>
        </div>

        <div class="recipe-page" id="print-root">
          ${photos.length>0 ? `
            <div class="photos">
              ${photoUrls.map((u,i)=>`
                <div class="photo">
                  <img src="${escape(u)}" alt="photo ${i+1}" data-print-src="${escape(u)}"/>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="empty" style="padding:30px 10px;">
              <span class="emoji">📷</span>
              <div>还没有照片</div>
              <button class="btn btn-pink" data-action="addphoto" style="margin-top:10px;">＋ 添加照片</button>
            </div>
          `}

          <h1 style="margin-top:8px;">${escape(r.name)}</h1>
          <div class="recipe-meta">
            ${r.servings ? `<span>🍽 ${escape(r.servings)}</span>` : ''}
            ${r.prepTime ? `<span>⏱ 准备 ${escape(r.prepTime)}</span>` : ''}
            ${r.cookTime ? `<span>🔥 烹饪 ${escape(r.cookTime)}</span>` : ''}
            ${r.category ? `<span class="pink">${cat.emoji} ${escape(r.category)}</span>` : ''}
            ${r.favorite ? `<span class="pink">❤️ 收藏</span>` : ''}
          </div>
          ${(r.tags||[]).length ? `
            <div class="recipe-meta">
              ${(r.tags||[]).map(t=>`<span>#${escape(t)}</span>`).join('')}
            </div>
          ` : ''}

          ${r.ingredients && r.ingredients.length ? `
            <div class="section-title"><span>🥣</span> 食材 <span class="script">Ingredients</span></div>
            <div class="ing-list">
              ${r.ingredients.map((it,i)=>`
                <div class="ing-row">
                  <div class="dot">${i+1}</div>
                  <div class="name">${escape(it.name||'')}</div>
                  ${it.qty ? `<div class="qty">${escape(it.qty)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${r.steps && r.steps.length ? `
            <div class="section-title"><span>👩🏻‍🍳</span> 制作步骤 <span class="script">Steps</span></div>
            <div class="step-list">
              ${r.steps.map((s,i)=>`
                <div class="step">
                  <div class="num">${i+1}</div>
                  <div class="text">${escape(s)}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${r.notes ? `
            <div class="section-title"><span>📝</span> 小笔记 <span class="script">Notes</span></div>
            <div style="background:linear-gradient(160deg,#fff8f1,#fff0f5);border-radius:var(--r-md);padding:14px 18px;color:var(--c-ink);box-shadow:var(--shadow-soft);">
              ${escape(r.notes).replace(/\n/g,'<br/>')}
            </div>
          ` : ''}

          <div style="text-align:center;margin-top:18px;font-family:var(--font-script);font-size:18px;color:var(--c-blue-deep);">
            🍯 made with love · 幸福食谱
          </div>
        </div>

        ${photos.length>0 ? `
          <div class="section-title"><span>🖼️</span> 照片管理</div>
          <div class="thumbs-grid" id="photo-manage">
            ${photoUrls.map((u,i)=>`
              <div class="t">
                <img src="${escape(u)}" alt=""/>
                <button class="x" data-action="delphoto" data-pid="${escape(photos[i].id)}">✕</button>
              </div>
            `).join('')}
            <div class="t" data-action="addphoto" style="display:flex;align-items:center;justify-content:center;color:var(--c-blue-deep);font-size:28px;cursor:pointer;background:linear-gradient(135deg,var(--c-blue-light),var(--c-pink-light));">＋</div>
          </div>
        ` : ''}

        <div class="toolbar">
          <button class="btn btn-blue" data-action="fav">${r.favorite?'❤️ 已收藏':'🤍 收藏'}</button>
          <button class="btn btn-pink" data-action="edit">✏️ 编辑</button>
          <button class="btn btn-ghost" data-action="print">🖨️ 打印</button>
          <button class="btn btn-ghost" data-action="share">📤 分享 PDF</button>
        </div>
      </div>
    `;

    // 绑定行为
    document.querySelectorAll('[data-action="back"]').forEach(el=>el.onclick = ()=> window.U.go('category', { id: r.category }));
    document.querySelectorAll('[data-action="opt"]').forEach(el=>el.onclick = ()=> showRecipeSheet(r));
    document.querySelectorAll('[data-action="fav"]').forEach(el=>el.onclick = async ()=>{
      r.favorite = !r.favorite;
      await DB.saveRecipe(r);
      toast(r.favorite?'已加入收藏 ❤️':'已取消收藏');
      viewRecipe(id);
    });
    document.querySelectorAll('[data-action="edit"]').forEach(el=>el.onclick = ()=> window.U.go('edit', { id: r.id }));
    document.querySelectorAll('[data-action="print"]').forEach(el=>el.onclick = ()=> window.PrintAPI.printRecipe(r));
    document.querySelectorAll('[data-action="share"]').forEach(el=>el.onclick = ()=> window.ShareAPI.sharePDF(r));
    document.querySelectorAll('[data-action="addphoto"]').forEach(el=>el.onclick = ()=> addPhotosFlow(id));
    document.querySelectorAll('[data-action="delphoto"]').forEach(el=>el.onclick = async ()=>{
      if(!confirm('删除这张照片吗？')) return;
      await DB.deletePhoto(el.dataset.pid);
      toast('照片已删除');
      viewRecipe(id);
    });
  }

  function showRecipeSheet(r){
    openSheet(`
      <h3>🍯 ${escape(r.name)}</h3>
      <div class="opts">
        <button class="opt-btn" data-act="fav"><div class="ic">❤️</div><div><div style="font-weight:800;">${r.favorite?'取消收藏':'加入收藏'}</div><div style="font-size:12px;color:var(--c-ink-soft);">快速收藏常用食谱</div></div></button>
        <button class="opt-btn" data-act="edit"><div class="ic">✏️</div><div><div style="font-weight:800;">编辑食谱</div><div style="font-size:12px;color:var(--c-ink-soft);">修改名称、食材、步骤</div></div></button>
        <button class="opt-btn" data-act="addphoto"><div class="ic">📷</div><div><div style="font-weight:800;">添加照片</div><div style="font-size:12px;color:var(--c-ink-soft);">支持多张，自动保存到本机</div></div></button>
        <button class="opt-btn" data-act="duplicate"><div class="ic">📋</div><div><div style="font-weight:800;">复制食谱</div><div style="font-size:12px;color:var(--c-ink-soft);">快速基于现有食谱新建</div></div></button>
        <button class="opt-btn" data-act="print"><div class="ic">🖨️</div><div><div style="font-weight:800;">A4 打印</div><div style="font-size:12px;color:var(--c-ink-soft);">直接发送到打印机</div></div></button>
        <button class="opt-btn" data-act="share"><div class="ic">📤</div><div><div style="font-weight:800;">分享 PDF</div><div style="font-size:12px;color:var(--c-ink-soft);">导出 PDF 发送给朋友</div></div></button>
        <button class="opt-btn danger" data-act="delete"><div class="ic">🗑️</div><div><div style="font-weight:800;">删除食谱</div><div style="font-size:12px;color:#c0394d;">删除后无法恢复</div></div></button>
      </div>
    `, (root)=>{
      root.querySelector('[data-act="fav"]').onclick = async ()=>{
        r.favorite = !r.favorite;
        await DB.saveRecipe(r);
        toast(r.favorite?'已加入收藏 ❤️':'已取消收藏');
        closeSheet(); viewRecipe(r.id);
      };
      root.querySelector('[data-act="edit"]').onclick = ()=>{ closeSheet(); window.U.go('edit',{id:r.id}); };
      root.querySelector('[data-act="addphoto"]').onclick = ()=>{ closeSheet(); addPhotosFlow(r.id); };
      root.querySelector('[data-act="print"]').onclick = ()=>{ closeSheet(); window.PrintAPI.printRecipe(r); };
      root.querySelector('[data-act="share"]').onclick = ()=>{ closeSheet(); window.ShareAPI.sharePDF(r); };
      root.querySelector('[data-act="delete"]').onclick = async ()=>{
        if(!confirm('确定要删除这道食谱吗？')) return;
        await DB.deleteRecipe(r.id);
        toast('已删除');
        closeSheet(); window.U.go('category',{id:r.category});
      };
      root.querySelector('[data-act="duplicate"]').onclick = async ()=>{
        const copy = { ...r, id: undefined, name: r.name+' (副本)', favorite:false };
        const saved = await DB.saveRecipe(copy);
        closeSheet();
        toast('已复制');
        window.U.go('recipe', { id: saved.id });
      };
    });
  }

  // 上传照片
  async function addPhotosFlow(recipeId){
    const files = await window.U.pickFiles('image/*', true);
    if(!files || !files.length) return;
    toast('正在保存照片…');
    for(const f of files){
      try{
        const blob = await window.U.compressImage(f, 1600, 0.85);
        await DB.addPhoto(recipeId, blob);
      }catch(e){
        console.warn('upload fail', e);
      }
    }
    toast('已添加 '+files.length+' 张照片 ✅');
    viewRecipe(recipeId);
  }

  // ============================================
  // 编辑页（新增或编辑）
  // ============================================
  let _lastCategory = '其它';
  async function viewEdit(id, extra){
    const app = document.getElementById('app');
    let r;
    if(id==='new'){
      r = DB.normalizeRecipe({});
      const cat = (extra && extra.category) || _lastCategory;
      r.category = cat;
    } else {
      r = await DB.getRecipe(id);
      if(!r){
        toast('找不到食谱');
        return window.U.go('home');
      }
      _lastCategory = r.category;
    }

    app.innerHTML = `
      <div class="page-fade">
        <div class="cat-header">
          <button class="back-btn" data-action="cancel">←</button>
          <div class="ic">${getCategory(r.category).emoji}</div>
          <div class="info">
            <h2>${id==='new'?'新食谱':'编辑食谱'}</h2>
            <div class="meta">记得加照片哦 📷</div>
          </div>
        </div>

        <div class="recipe-page">
          <div class="form-grid">
            <div class="field">
              <label>📛 食谱名称</label>
              <input id="f-name" type="text" value="${escape(r.name)}" placeholder="比如：番茄炒蛋"/>
            </div>
            <div class="field-row">
              <div class="field">
                <label>🍱 分类</label>
                <select id="f-cat">
                  ${CATEGORIES.map(c=>`<option value="${escape(c.id)}" ${r.category===c.id?'selected':''}>${c.emoji} ${escape(c.id)}</option>`).join('')}
                </select>
              </div>
              <div class="field">
                <label>🍽 份量</label>
                <input id="f-serv" type="text" value="${escape(r.servings)}" placeholder="2 人份"/>
              </div>
            </div>
            <div class="field-row">
              <div class="field">
                <label>⏱ 准备时间</label>
                <input id="f-prep" type="text" value="${escape(r.prepTime)}" placeholder="10 分钟"/>
              </div>
              <div class="field">
                <label>🔥 烹饪时间</label>
                <input id="f-cook" type="text" value="${escape(r.cookTime)}" placeholder="15 分钟"/>
              </div>
            </div>
            <div class="field">
              <label>🏷️ 标签（用空格分隔）</label>
              <input id="f-tags" type="text" value="${escape((r.tags||[]).join(' '))}" placeholder="比如：家常 下饭"/>
            </div>
            <div class="field">
              <label>❤️ 收藏</label>
              <label style="display:flex;align-items:center;gap:10px;font-weight:600;color:var(--c-ink);">
                <input id="f-fav" type="checkbox" ${r.favorite?'checked':''} style="width:22px;height:22px;"/> 加入收藏夹
              </label>
            </div>

            <div class="section-title"><span>🥣</span> 食材 <span class="script">Ingredients</span></div>
            <div id="ing-edit"></div>
            <button class="add-line" data-action="add-ing">＋ 新增一行食材</button>

            <div class="section-title"><span>👩🏻‍🍳</span> 制作步骤 <span class="script">Steps</span></div>
            <div id="step-edit"></div>
            <button class="add-line" data-action="add-step">＋ 新增一个步骤</button>

            <div class="field">
              <label>📝 小笔记（可选）</label>
              <textarea id="f-notes" rows="3" placeholder="比如：加一点点糖更鲜甜～">${escape(r.notes)}</textarea>
            </div>

            <div class="field">
              <label>📷 ${id==='new'?'添加照片（可随后再添加）':'添加更多照片'}</label>
              <button class="btn btn-ghost" data-action="addphoto">＋ 选择照片（可多张）</button>
            </div>

            <div class="toolbar">
              <button class="btn btn-blue btn-lg" data-action="save">💾 保存食谱</button>
              ${id!=='new' ? '<button class="btn btn-ghost" data-action="delete">🗑️ 删除</button>' : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    function renderIngEdit(){
      const root = document.getElementById('ing-edit');
      const list = r.ingredients || [];
      root.innerHTML = list.map((it,i)=>`
        <div class="list-edit-row" data-i="${i}">
          <input class="ie-name" value="${escape(it.name)}" placeholder="食材名"/>
          <input class="ie-qty" value="${escape(it.qty)}" placeholder="分量" style="max-width:120px;"/>
          <button class="x" data-action="del-ing">✕</button>
        </div>
      `).join('') || '<div style="font-size:13px;color:var(--c-ink-soft);text-align:center;padding:8px;">还没有食材，点击下面按钮添加</div>';
      root.querySelectorAll('[data-action="del-ing"]').forEach((b)=>{
        b.onclick = ()=>{
          const i = +b.parentNode.dataset.i;
          list.splice(i,1); r.ingredients = list; renderIngEdit();
        };
      });
      root.querySelectorAll('.ie-name, .ie-qty').forEach((inp)=>{
        inp.oninput = ()=>{
          const row = inp.parentNode;
          const i = +row.dataset.i;
          list[i] = { name: row.querySelector('.ie-name').value, qty: row.querySelector('.ie-qty').value };
        };
      });
    }
    function renderStepEdit(){
      const root = document.getElementById('step-edit');
      const list = r.steps || [];
      root.innerHTML = list.map((s,i)=>`
        <div class="list-edit-row" data-i="${i}" style="align-items:flex-start;">
          <div style="background:linear-gradient(135deg,var(--c-blue),var(--c-blue-deep));color:#fff;border-radius:50%;min-width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-weight:800;">${i+1}</div>
          <textarea class="is-text" rows="2" placeholder="步骤描述…">${escape(s)}</textarea>
          <button class="x" data-action="del-step">✕</button>
        </div>
      `).join('') || '<div style="font-size:13px;color:var(--c-ink-soft);text-align:center;padding:8px;">还没有步骤，点击下面按钮添加</div>';
      root.querySelectorAll('[data-action="del-step"]').forEach((b)=>{
        b.onclick = ()=>{ const i=+b.parentNode.dataset.i; list.splice(i,1); r.steps=list; renderStepEdit(); };
      });
      root.querySelectorAll('.is-text').forEach((ta)=>{
        ta.oninput = ()=>{
          const i = +ta.parentNode.dataset.i;
          list[i] = ta.value;
        };
      });
    }
    renderIngEdit();
    renderStepEdit();

    // 绑定
    document.querySelectorAll('[data-action="cancel"]').forEach(el=>el.onclick = ()=>{
      if(confirm('放弃编辑吗？未保存的内容会丢失')){
        if(id==='new') window.U.go('home');
        else window.U.go('recipe', { id });
      }
    });
    document.querySelectorAll('[data-action="add-ing"]').forEach(el=>el.onclick = ()=>{
      r.ingredients = r.ingredients || []; r.ingredients.push({ name:'', qty:'' }); renderIngEdit();
    });
    document.querySelectorAll('[data-action="add-step"]').forEach(el=>el.onclick = ()=>{
      r.steps = r.steps || []; r.steps.push(''); renderStepEdit();
    });
    document.querySelectorAll('[data-action="addphoto"]').forEach(el=>el.onclick = async ()=>{
      // 需要先保存
      await saveCurrent();
      const files = await window.U.pickFiles('image/*', true);
      if(!files || !files.length) return;
      const saved = await DB.getRecipe(r.id);
      if(!saved) return;
      toast('正在保存照片…');
      for(const f of files){
        try{
          const blob = await window.U.compressImage(f, 1600, 0.85);
          await DB.addPhoto(r.id, blob);
        }catch(e){console.warn(e);}
      }
      toast('已添加 '+files.length+' 张照片 ✅');
      // 重新载入编辑
      window.U.go('edit', { id: r.id });
    });
    document.querySelectorAll('[data-action="delete"]').forEach(el=>el.onclick = async ()=>{
      if(!confirm('确定删除？此操作无法恢复')) return;
      await DB.deleteRecipe(r.id);
      toast('已删除');
      window.U.go('home');
    });
    document.querySelectorAll('[data-action="save"]').forEach(el=>el.onclick = saveCurrent);

    async function saveCurrent(){
      r.name = document.getElementById('f-name').value.trim() || '未命名食谱';
      r.category = document.getElementById('f-cat').value;
      r.servings = document.getElementById('f-serv').value.trim();
      r.prepTime = document.getElementById('f-prep').value.trim();
      r.cookTime = document.getElementById('f-cook').value.trim();
      r.tags = document.getElementById('f-tags').value.trim().split(/\s+/).filter(Boolean);
      r.favorite = document.getElementById('f-fav').checked;
      r.notes = document.getElementById('f-notes').value;
      // 清理空 ingredient
      r.ingredients = (r.ingredients||[]).filter(i => (i.name||'').trim() || (i.qty||'').trim());
      r.steps = (r.steps||[]).filter(s => (s||'').trim());
      const saved = await DB.saveRecipe(r);
      toast('已保存 ✅');
      window.U.go('recipe', { id: saved.id });
    }
  }

  // ============================================
  // 底部 Sheet
  // ============================================
  function openSheet(html, onMount){
    const back = document.createElement('div');
    back.className='sheet-backdrop';
    back.innerHTML = `<div class="sheet"><div class="sheet-handle"></div>${html}</div>`;
    document.body.appendChild(back);
    const root = back.querySelector('.sheet');
    if(onMount) onMount(root);
    back.addEventListener('click',(e)=>{
      if(e.target===back) closeSheet();
    });
  }
  function closeSheet(){
    document.querySelectorAll('.sheet-backdrop').forEach(el=>el.remove());
  }

  // ============================================
  // 备份弹层
  // ============================================
  function showBackupSheet(){
    openSheet(`
      <h3>☁️ 备份 & 恢复</h3>
      <div class="opts">
        <button class="opt-btn" data-act="backup"><div class="ic">📦</div><div><div style="font-weight:800;">一键备份全部食谱</div><div style="font-size:12px;color:var(--c-ink-soft);">包含所有照片和收藏</div></div></button>
        <button class="opt-btn" data-act="restore"><div class="ic">📥</div><div><div style="font-weight:800;">从备份恢复</div><div style="font-size:12px;color:var(--c-ink-soft);">上传之前导出的 JSON</div></div></button>
        <button class="opt-btn danger" data-act="wipe"><div class="ic">🧹</div><div><div style="font-weight:800;">清空全部数据</div><div style="font-size:12px;color:#c0394d;">谨慎使用，建议先备份</div></div></button>
        <button class="opt-btn" data-act="stats"><div class="ic">📊</div><div><div style="font-weight:800;">查看存储信息</div><div style="font-size:12px;color:var(--c-ink-soft);">食谱数量、占用空间</div></div></button>
      </div>
    `, async (root)=>{
      root.querySelector('[data-act="backup"]').onclick = async ()=>{
        closeSheet();
        await window.BackupAPI.doBackup();
      };
      root.querySelector('[data-act="restore"]').onclick = ()=>{
        closeSheet();
        window.BackupAPI.doRestore();
      };
      root.querySelector('[data-act="wipe"]').onclick = async ()=>{
        if(!confirm('确定清空所有食谱和照片？此操作无法恢复！')) return;
        const all = await DB.getAllRecipes();
        for(const r of all){ await DB.deleteRecipe(r.id); }
        closeSheet(); toast('已清空');
        window.U.go('home');
      };
      root.querySelector('[data-act="stats"]').onclick = async ()=>{
        closeSheet();
        const all = await DB.getAllRecipes();
        const photos = await DB.getAllPhotos();
        let size=0;
        for(const p of photos){ if(p.blob) size += p.blob.size || 0; }
        toast(`📊 ${all.length} 道食谱 · ${photos.length} 张照片 · ${(size/1024/1024).toFixed(2)} MB`, 3500);
      };
    });
  }

  window.Views = {
    viewHome, viewCategory, viewList, viewRecipe, viewEdit,
    openSheet, closeSheet, showBackupSheet
  };
})();
