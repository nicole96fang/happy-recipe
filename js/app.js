/* ============================================
   幸福食谱 · App 入口
   ============================================ */
(async function(){
  // 检测 iOS 需要 root 滚动
  document.documentElement.style.scrollBehavior='smooth';
  // iOS Safari 防弹窗
  window.addEventListener('hashchange', ()=>{});

  // 启动环境动画 (雪花 + 气泡)
  window.U.startAmbient();

  // 首次种子
  try{ await window.Seed.seedIfEmpty(); }catch(e){ console.warn(e); }

  // SW 注册 + 自动升级提示
  if('serviceWorker' in navigator){
    try{
      navigator.serviceWorker.register('sw.js').then(reg => {
        // 1) 监听新 SW 等待激活
        function promptRefresh(worker){
          if(!worker) return;
          worker.addEventListener('statechange', ()=>{
            if(worker.state === 'activated' && navigator.serviceWorker.controller){
              // 新 SW 激活成功 → 提示用户刷新一次
              window.U.toast('🍯 新版本已就绪，正在刷新…', 1800);
              setTimeout(()=> location.reload(), 1200);
            }
          });
        }
        if(reg.waiting) promptRefresh(reg.waiting);
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          if(sw) promptRefresh(sw);
        });

        // 2) 每 60 秒检查一次更新
        setInterval(()=> reg.update().catch(()=>{}), 60000);
      }).catch(()=>{});

      // 3) 第一次进入时如果 SW 接管了页面（重新加载后），可选择性跳过
      navigator.serviceWorker.addEventListener('controllerchange', ()=>{
        // 让新 SW 立即生效
      });
    }catch(e){}
  }

  // 路由
  window.Router.route();

  // 暴露 app-ready
  window.HappyApp = { ready: true };
})();
