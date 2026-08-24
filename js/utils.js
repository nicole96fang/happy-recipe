/* ============================================
   工具函数 + 分类定义
   ============================================ */
(function(){
  // 全部分类 + 表情 (参考你给的列表)
  const CATEGORIES = [
    { id:'鸡肉', emoji:'🍗', color:'#ffb6c1' },
    { id:'猪肉', emoji:'🐷', color:'#ffa5b9' },
    { id:'鱼肉', emoji:'🐟', color:'#bfe2ec' },
    { id:'虾类', emoji:'🦐', color:'#ffb6c1' },
    { id:'鱿鱼', emoji:'🦑', color:'#bfe2ec' },
    { id:'螃蟹', emoji:'🦀', color:'#ffb6c1' },
    { id:'蚌类', emoji:'🐚', color:'#bfe2ec' },
    { id:'蔬菜', emoji:'🥬', color:'#a8e6cf' },
    { id:'豆腐', emoji:'🟫', color:'#ffe9b0' },
    { id:'鸡蛋', emoji:'🥚', color:'#fff0b0' },
    { id:'甜点', emoji:'🍰', color:'#ffb6c1' },
    { id:'烘培', emoji:'🥐', color:'#ffd6a0' },
    { id:'咖啡', emoji:'☕', color:'#c8a985' },
    { id:'饮料', emoji:'🥤', color:'#bfe2ec' },
    { id:'面食', emoji:'🍜', color:'#ffb6c1' },
    { id:'其它', emoji:'🍯', color:'#ffe9b0' }
  ];

  function getCategory(id){
    return CATEGORIES.find(c=>c.id===id) || CATEGORIES[CATEGORIES.length-1];
  }

  function escape(s){
    if(s == null) return '';
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  // 雪花 + 气泡
  function startAmbient(){
    // 雪花
    const snow = document.querySelector('.snow-layer');
    const flakes = ['❄','❅','❆','✻','✼'];
    for(let i=0;i<14;i++){
      const el = document.createElement('div');
      el.className='snowflake';
      el.textContent = flakes[Math.floor(Math.random()*flakes.length)];
      const size = 10 + Math.random()*16;
      el.style.fontSize = size+'px';
      el.style.left = Math.random()*100+'vw';
      el.style.opacity = .25 + Math.random()*.55;
      el.style.animationDuration = 14 + Math.random()*18+'s';
      el.style.animationDelay = -Math.random()*30+'s';
      el.style.color = '#ffffff';
      el.style.textShadow = '0 0 6px rgba(75,167,202,.5)';
      snow.appendChild(el);
    }
    // 气泡
    const bub = document.querySelector('.bubble-layer');
    for(let i=0;i<8;i++){
      const el = document.createElement('div');
      el.className='bubble';
      const size = 10 + Math.random()*30;
      el.style.width = size+'px';
      el.style.height = size+'px';
      el.style.left = Math.random()*100+'vw';
      el.style.animationDuration = 18 + Math.random()*22+'s';
      el.style.animationDelay = -Math.random()*40+'s';
      bub.appendChild(el);
    }
  }

  // Toast
  const toastEl = ()=>document.getElementById('toast');
  function toast(msg, dur=2000){
    const el = toastEl();
    if(!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(()=>el.classList.remove('show'), dur);
  }

  // 简易 hash router
  function parseHash(){
    const h = location.hash.replace(/^#\/?/,'');
    if(!h) return { name:'home', params:{} };
    const parts = h.split('/').map(decodeURIComponent);
    return { name: parts[0], params:{ id: parts[1] } };
  }
  function go(name, params={}, extra){
    const id = params.id ? '/' + encodeURIComponent(params.id) : '';
    location.hash = '#/' + name + id;
    // 把 extra 暂存在 window 全局，给 viewEdit 用
    window.__pendingExtra = extra || null;
    setTimeout(()=>{ window.__pendingExtra = null; }, 1200);
  }

  // blob -> object url
  function blobToUrl(blob){
    if(!blob) return '';
    try{ return URL.createObjectURL(blob); }catch(e){ return ''; }
  }

  // 图片自动压缩 (长边 max 1600, jpeg 0.85)，保证本地存储不爆
  function compressImage(file, maxEdge=1600, quality=0.85){
    return new Promise((resolve, reject)=>{
      const fr = new FileReader();
      fr.onload = ev=>{
        const img = new Image();
        img.onload = ()=>{
          let { width:w, height:h } = img;
          const ratio = Math.min(1, maxEdge / Math.max(w,h));
          w = Math.round(w*ratio); h = Math.round(h*ratio);
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          c.toBlob(b=>{
            if(!b){ reject(new Error('compress failed')); return; }
            resolve(b);
          }, 'image/jpeg', quality);
        };
        img.onerror = ()=>reject(new Error('image load failed'));
        img.src = ev.target.result;
      };
      fr.onerror = ()=>reject(new Error('file read failed'));
      fr.readAsDataURL(file);
    });
  }

  // 下载文件
  function downloadFile(filename, blob){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 60000);
  }

  // 全局点击关闭 sheet
  document.addEventListener('click',(e)=>{
    if(e.target.classList && e.target.classList.contains('sheet-backdrop')){
      e.target.remove();
    }
  });

  // 把上传图片封装成 promise
  function pickFiles(accept='image/*', multiple=true){
    return new Promise(resolve=>{
      const inp = document.getElementById('file-input');
      inp.value = '';
      inp.multiple = multiple;
      inp.accept = accept;
      inp.onchange = ()=>{
        const fs = Array.from(inp.files||[]);
        resolve(fs);
        inp.onchange = null;
      };
      inp.click();
    });
  }

  window.U = {
    CATEGORIES, getCategory,
    escape, toast, startAmbient,
    parseHash, go,
    blobToUrl, compressImage,
    downloadFile, pickFiles
  };
})();
