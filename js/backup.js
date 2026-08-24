/* ============================================
   备份 & 恢复
   ============================================ */
(function(){
  async function doBackup(){
    const view = window.U.toast;
    view('正在打包备份数据…', 60000);
    try{
      const data = await DB.exportAll();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type:'application/json' });
      const filename = `happy-recipe-backup-${new Date().toISOString().slice(0,10)}.json`;
      window.U.downloadFile(filename, blob);
      toast('✅ 已下载备份文件（含照片）');
    }catch(e){
      toast('备份失败：'+(e.message||e));
      console.error(e);
    }
  }

  function doRestore(){
    const inp = document.getElementById('restore-input');
    inp.value = '';
    inp.onchange = async ()=>{
      const f = inp.files && inp.files[0];
      if(!f) return;
      try{
        const text = await f.text();
        const data = JSON.parse(text);
        const choice = confirm(
          '检测到备份文件\n\n' +
          '包含 ' + (data.recipes?.length || 0) + ' 道食谱，' + (data.photos?.length || 0) + ' 张照片。\n\n' +
          '点 "确定" = 合并到现有数据\n' +
          '点 "取消" = 放弃恢复\n\n' +
          '是否要完全替换当前数据？请输入 1（替换）或 2（合并）后确认。'
        );
        let mode = 'merge';
        if(!choice){
          const sub = prompt('输入 1 = 替换    输入 2 = 合并', '2');
          mode = (sub==='1') ? 'replace' : 'merge';
        }
        const count = await DB.importAll(data, mode);
        toast('✅ 已恢复 ' + count + ' 道食谱');
        setTimeout(()=>window.U.go('home'), 500);
      }catch(e){
        toast('恢复失败：'+(e.message||e));
        console.error(e);
      }
      inp.onchange = null;
    };
    inp.click();
  }

  window.BackupAPI = { doBackup, doRestore };
})();
