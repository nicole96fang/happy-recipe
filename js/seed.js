/* ============================================
   种子数据：首次打开时放入几个示例食谱
   ============================================ */
(function(){
  const SAMPLES = [
    {
      name:'番茄炒蛋',
      category:'鸡蛋',
      servings:'2 人份',
      prepTime:'5 分钟',
      cookTime:'10 分钟',
      favorite:true,
      tags:['家常','下饭'],
      ingredients:[
        { name:'番茄', qty:'2 个' },
        { name:'鸡蛋', qty:'3 颗' },
        { name:'葱花', qty:'少许' },
        { name:'盐', qty:'1 茶匙' },
        { name:'糖', qty:'½ 茶匙' },
        { name:'食用油', qty:'2 汤匙' }
      ],
      steps:[
        '番茄顶部划十字，热水烫 30 秒后撕皮，切小块。',
        '鸡蛋打散加一点点盐，搅拌均匀。',
        '热锅冷油，倒入蛋液快速滑散，凝固后盛出。',
        '锅内余油下番茄翻炒出沙，加糖提鲜。',
        '倒入鸡蛋翻炒均匀，撒上葱花即可出锅。'
      ],
      notes:'加一点点糖能让番茄味道更鲜甜，是家常小秘诀。'
    },
    {
      name:'蒜香蜂蜜鸡翅',
      category:'鸡肉',
      servings:'3 人份',
      prepTime:'15 分钟',
      cookTime:'25 分钟',
      favorite:true,
      tags:['烤箱','派对'],
      ingredients:[
        { name:'鸡翅中', qty:'12 只' },
        { name:'蒜末', qty:'4 瓣' },
        { name:'生抽', qty:'2 汤匙' },
        { name:'蜂蜜', qty:'2 汤匙' },
        { name:'料酒', qty:'1 汤匙' },
        { name:'黑胡椒', qty:'少许' }
      ],
      steps:[
        '鸡翅洗净划两刀方便入味。',
        '加入蒜末、生抽、蜂蜜、料酒、黑胡椒，抓匀腌制 30 分钟以上。',
        '烤箱 200°C 预热 5 分钟，鸡翅摆在铺了锡纸的烤盘上。',
        '放入中层烤 18 分钟，中途翻面刷一层腌料。',
        '出炉撒上白芝麻，趁热享用。'
      ],
      notes:'想要更脆可以最后 3 分钟开上火 230°C。'
    },
    {
      name:'奶油蘑菇意面',
      category:'面食',
      servings:'2 人份',
      prepTime:'10 分钟',
      cookTime:'15 分钟',
      favorite:false,
      tags:['西式','奶香'],
      ingredients:[
        { name:'意面', qty:'200 克' },
        { name:'白蘑菇', qty:'150 克' },
        { name:'淡奶油', qty:'100 毫升' },
        { name:'蒜末', qty:'2 瓣' },
        { name:'黄油', qty:'15 克' },
        { name:'盐和黑胡椒', qty:'适量' },
        { name:'欧芹碎', qty:'少许' }
      ],
      steps:[
        '烧一锅水，加盐煮意面，按包装时间煮到 al dente。',
        '蘑菇洗净切片。',
        '黄油化开，爆香蒜末，加入蘑菇炒到金黄。',
        '倒入淡奶油，小火煮 2 分钟，加盐和黑胡椒调味。',
        '沥干意面拌入酱汁，撒上欧芹碎即可。'
      ],
      notes:'用新鲜现磨的帕玛森奶酪会更香。'
    },
    {
      name:'红烧肉',
      category:'猪肉',
      servings:'4 人份',
      prepTime:'15 分钟',
      cookTime:'60 分钟',
      favorite:false,
      tags:['招牌','下饭'],
      ingredients:[
        { name:'五花肉', qty:'500 克' },
        { name:'冰糖', qty:'30 克' },
        { name:'生抽', qty:'3 汤匙' },
        { name:'老抽', qty:'1 汤匙' },
        { name:'料酒', qty:'2 汤匙' },
        { name:'八角', qty:'2 颗' },
        { name:'香叶', qty:'2 片' },
        { name:'葱姜', qty:'适量' }
      ],
      steps:[
        '五花肉切块，冷水下锅焯水去腥。',
        '锅内少许油，下冰糖小火炒出糖色。',
        '放入肉块翻炒上色，加生抽、老抽、料酒。',
        '加入热水、八角、香叶、葱姜，水开后转小火炖 50 分钟。',
        '最后开大火收汁到浓稠即可。'
      ],
      notes:'炖的时间越长越软糯，看个人口味调整。'
    },
    {
      name:'草莓奶油蛋糕',
      category:'甜点',
      servings:'6 人份',
      prepTime:'40 分钟',
      cookTime:'25 分钟',
      favorite:true,
      tags:['生日','浪漫'],
      ingredients:[
        { name:'鸡蛋', qty:'4 颗' },
        { name:'低筋面粉', qty:'80 克' },
        { name:'细砂糖', qty:'80 克' },
        { name:'淡奶油', qty:'300 毫升' },
        { name:'草莓', qty:'1 盒' },
        { name:'黄油', qty:'20 克' },
        { name:'牛奶', qty:'40 毫升' }
      ],
      steps:[
        '蛋清蛋黄分离，蛋黄加牛奶和融化黄油拌匀。',
        '筛入低筋面粉拌成面糊。',
        '蛋清分三次加糖打发至硬性发泡。',
        '蛋白霜分三次翻拌入面糊，倒入模具。',
        '烤箱 150°C 烤 25 分钟，倒扣冷却。',
        '淡奶油打发，蛋糕分层夹奶油和草莓片。',
        '表面抹平奶油，装饰草莓即可。'
      ],
      notes:'打发蛋白的盆必须无水无油，否则打不起来。'
    },
    {
      name:'冰美式',
      category:'咖啡',
      servings:'1 人份',
      prepTime:'3 分钟',
      cookTime:'0 分钟',
      favorite:false,
      tags:['提神','简单'],
      ingredients:[
        { name:'意式浓缩', qty:'1 份（30ml）' },
        { name:'冰块', qty:'满杯' },
        { name:'冷水', qty:'150 毫升' },
        { name:'糖浆', qty:'可选' }
      ],
      steps:[
        '杯中装满冰块。',
        '倒入冷水至八分满。',
        '缓缓倒入萃取好的意式浓缩。',
        '按个人口味加入糖浆搅匀即可。'
      ],
      notes:'想要更浓郁的奶咖风味，可以加 30ml 燕麦奶。'
    }
  ];

  // localStorage 标记：一旦用户在 app 里有过任意一条数据（包括示例），就不再自动种
  // 这样在极端情况下（IndexedDB 被 iOS 清掉、用户清缓存、备份恢复后空数据库），
  // 删除的食谱也不会"复活"，保持用户当前意图
  const SEED_DONE_KEY = 'happy_recipe.seeded';

  async function seedIfEmpty(){
    try{
      // 关键：用户曾经有过数据 → 永远不再种示例，避免删了的食谱"复活"
      if(localStorage.getItem(SEED_DONE_KEY) === '1') return;

      const list = await DB.getAllRecipes();
      if(list && list.length===0){
        for(const s of SAMPLES){
          await DB.saveRecipe({ ...s });
        }
        localStorage.setItem(SEED_DONE_KEY, '1');
      } else if(list && list.length > 0){
        // 已经手动加了数据 / 恢复了备份 → 也标记为 done
        localStorage.setItem(SEED_DONE_KEY, '1');
      }
    }catch(e){
      console.warn('seed failed', e);
    }
  }

  // 暴露：手动重新种子（仅开发/重置用，正常代码不应调用）
  async function forceReseed(){
    const list = await DB.getAllRecipes();
    for(const r of list){ await DB.deleteRecipe(r.id); }
    for(const s of SAMPLES){ await DB.saveRecipe({ ...s }); }
    try{ localStorage.setItem(SEED_DONE_KEY, '1'); }catch(e){}
  }

  window.Seed = { seedIfEmpty, forceReseed, SAMPLES };
})();
