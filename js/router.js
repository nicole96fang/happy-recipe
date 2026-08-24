/* ============================================
   路由
   ============================================ */
(function(){
  async function route(){
    const r = window.U.parseHash();
    switch(r.name){
      case 'category':
        await window.Views.viewCategory(r.params.id || '其它');
        break;
      case 'list':
        await window.Views.viewList(r.params.id || 'favorites');
        break;
      case 'recipe':
        await window.Views.viewRecipe(r.params.id);
        break;
      case 'edit':
        await window.Views.viewEdit(r.params.id, window.__pendingExtra);
        window.__pendingExtra = null;
        break;
      case 'home':
      case '':
      default:
        await window.Views.viewHome('');
        break;
    }
    // 滚到顶部
    window.scrollTo({ top:0, behavior:'instant' });
  }

  window.addEventListener('hashchange', route);
  window.Router = { route };
})();
