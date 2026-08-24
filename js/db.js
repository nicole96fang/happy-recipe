/* ============================================
   DB · IndexedDB 封装
   数据全部存在本机，包括图片二进制
   ============================================ */
(function(){
  const DB_NAME = 'happy_recipe_db';
  const DB_VERSION = 1;
  const STORE_RECIPES = 'recipes';
  const STORE_PHOTOS = 'photos';

  let dbPromise = null;

  function openDB(){
    if(dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject)=>{
      if(!('indexedDB' in window)){
        reject(new Error('浏览器不支持 IndexedDB'));
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e)=>{
        const db = e.target.result;
        if(!db.objectStoreNames.contains(STORE_RECIPES)){
          const s = db.createObjectStore(STORE_RECIPES, { keyPath:'id' });
          s.createIndex('category','category',{unique:false});
          s.createIndex('favorite','favorite',{unique:false});
          s.createIndex('updatedAt','updatedAt',{unique:false});
        }
        if(!db.objectStoreNames.contains(STORE_PHOTOS)){
          const s2 = db.createObjectStore(STORE_PHOTOS, { keyPath:'id' });
          s2.createIndex('recipeId','recipeId',{unique:false});
        }
      };
      req.onsuccess = ()=>resolve(req.result);
      req.onerror = ()=>reject(req.error);
    });
    return dbPromise;
  }

  function reqToPromise(r){
    return new Promise((res, rej)=>{
      r.onsuccess = ()=>res(r.result);
      r.onerror = ()=>rej(r.error);
    });
  }

  function rid(){
    return 'r_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8);
  }

  function normalizeRecipe(r){
    return {
      id: r.id || rid(),
      name: r.name || '未命名食谱',
      category: r.category || '其它',
      favorite: !!r.favorite,
      cover: r.cover || '',
      servings: r.servings || '',
      prepTime: r.prepTime || '',
      cookTime: r.cookTime || '',
      tags: Array.isArray(r.tags) ? r.tags : [],
      ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
      steps: Array.isArray(r.steps) ? r.steps : [],
      notes: r.notes || '',
      createdAt: r.createdAt || Date.now(),
      updatedAt: r.updatedAt || Date.now()
    };
  }

  // ============ Recipes ============

  async function getAllRecipes(){
    const db = await openDB();
    return new Promise((res, rej)=>{
      const t = db.transaction(STORE_RECIPES, 'readonly');
      const r = t.objectStore(STORE_RECIPES).getAll();
      r.onsuccess = ()=>res((r.result||[]).map(normalizeRecipe));
      r.onerror = ()=>rej(r.error);
    });
  }

  async function getRecipe(id){
    const db = await openDB();
    return new Promise((res, rej)=>{
      const t = db.transaction(STORE_RECIPES, 'readonly');
      const r = t.objectStore(STORE_RECIPES).get(id);
      r.onsuccess = ()=>res(r.result ? normalizeRecipe(r.result) : null);
      r.onerror = ()=>rej(r.error);
    });
  }

  async function saveRecipe(recipe){
    const rec = normalizeRecipe(recipe);
    const db = await openDB();
    return new Promise((res, rej)=>{
      const t = db.transaction(STORE_RECIPES, 'readwrite');
      t.objectStore(STORE_RECIPES).put(rec);
      t.oncomplete = ()=>res(rec);
      t.onerror = ()=>rej(t.error);
    });
  }

  async function deleteRecipe(id){
    const db = await openDB();
    return new Promise((res, rej)=>{
      const t = db.transaction([STORE_RECIPES, STORE_PHOTOS], 'readwrite');
      t.objectStore(STORE_RECIPES).delete(id);
      const idx = t.objectStore(STORE_PHOTOS).index('recipeId');
      const cur = idx.openCursor(IDBKeyRange.only(id));
      cur.onsuccess = (e)=>{
        const c = e.target.result;
        if(c){ c.delete(); c.continue(); }
      };
      t.oncomplete = ()=>res(true);
      t.onerror = ()=>rej(t.error);
    });
  }

  // ============ Photos ============

  async function addPhoto(recipeId, blob){
    const id = 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8);
    const rec = { id, recipeId, blob, type: blob.type||'image/jpeg', addedAt: Date.now() };
    const db = await openDB();
    return new Promise((res,rej)=>{
      const t = db.transaction(STORE_PHOTOS, 'readwrite');
      t.objectStore(STORE_PHOTOS).put(rec);
      t.oncomplete = ()=>res(id);
      t.onerror = ()=>rej(t.error);
    });
  }

  async function getPhotosForRecipe(recipeId){
    const db = await openDB();
    return new Promise((res, rej)=>{
      const t = db.transaction(STORE_PHOTOS, 'readonly');
      const idx = t.objectStore(STORE_PHOTOS).index('recipeId');
      const r = idx.getAll(IDBKeyRange.only(recipeId));
      r.onsuccess = ()=>{
        const list = (r.result||[]).sort((a,b)=>a.addedAt-b.addedAt);
        res(list);
      };
      r.onerror = ()=>rej(r.error);
    });
  }

  async function getAllPhotos(){
    const db = await openDB();
    return new Promise((res, rej)=>{
      const t = db.transaction(STORE_PHOTOS, 'readonly');
      const r = t.objectStore(STORE_PHOTOS).getAll();
      r.onsuccess = ()=>res(r.result||[]);
      r.onerror = ()=>rej(r.error);
    });
  }

  async function deletePhoto(id){
    const db = await openDB();
    return new Promise((res, rej)=>{
      const t = db.transaction(STORE_PHOTOS, 'readwrite');
      t.objectStore(STORE_PHOTOS).delete(id);
      t.oncomplete=()=>res(true);
      t.onerror=()=>rej(t.error);
    });
  }

  // ============ Backup / Restore ============

  async function exportAll(){
    const recipes = await getAllRecipes();
    const photos = await getAllPhotos();
    return {
      app:'happy-recipe',
      version:1,
      exportedAt: new Date().toISOString(),
      recipes,
      photos
    };
  }

  async function importAll(payload, mode='merge'){
    if(!payload || payload.app !== 'happy-recipe') throw new Error('不兼容的备份文件');
    const db = await openDB();
    if(mode === 'replace'){
      await new Promise((res,rej)=>{
        const t = db.transaction([STORE_RECIPES, STORE_PHOTOS], 'readwrite');
        t.objectStore(STORE_RECIPES).clear();
        t.objectStore(STORE_PHOTOS).clear();
        t.oncomplete=()=>res();
        t.onerror=()=>rej(t.error);
      });
    }
    await new Promise((res,rej)=>{
      const t = db.transaction([STORE_RECIPES, STORE_PHOTOS], 'readwrite');
      const rs = t.objectStore(STORE_RECIPES);
      const ps = t.objectStore(STORE_PHOTOS);
      for(const r of (payload.recipes||[])){
        try{ rs.put(normalizeRecipe(r)); }catch(e){}
      }
      for(const p of (payload.photos||[])){
        try{ ps.put(p); }catch(e){}
      }
      t.oncomplete=()=>res();
      t.onerror=()=>rej(t.error);
    });
    return (payload.recipes||[]).length;
  }

  window.DB = {
    rid, normalizeRecipe,
    getAllRecipes, getRecipe, saveRecipe, deleteRecipe,
    addPhoto, getPhotosForRecipe, getAllPhotos, deletePhoto,
    exportAll, importAll
  };
})();
