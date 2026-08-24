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

  // SW 注册 (可选)
  if('serviceWorker' in navigator){
    try{
      navigator.serviceWorker.register('sw.js').catch(()=>{});
    }catch(e){}
  }

  // 路由
  window.Router.route();

  // 暴露 app-ready
  window.HappyApp = { ready: true };
})();
