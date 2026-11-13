async(page)=>{
 await page.evaluate(()=>{localStorage.removeItem('rune-ranger-difficulty');for(const[d,n]of[['easy',11],['normal',22],['hard',33],['nightmare',44]])localStorage.setItem('rune-ranger-best-'+d,String(n));});
 await page.reload();await page.getByRole('button',{name:'룬 레인저 시작하기',exact:true}).click();
 const difficulty=()=>page.locator('.prep-difficulty');
 const assertSelected=async(label,best)=>{if(await difficulty().getByRole('button',{name:label,exact:true}).getAttribute('aria-pressed')!=='true')throw Error('Wrong difficulty '+label);if(!await page.locator('.prep-launch small[aria-live]').textContent().then(s=>s.includes(label)&&s.includes('최고 '+best+' 처치')))throw Error('Wrong best');};
 await assertSelected('쉬움',11);
 for(const[d,label,n]of[['normal','보통',22],['hard','어려움',33],['nightmare','악몽',44],['easy','쉬움',11]]){
  await difficulty().getByRole('button',{name:label,exact:true}).click();await assertSelected(label,n);
  if(await page.evaluate(()=>localStorage.getItem('rune-ranger-difficulty'))!==d)throw Error('Not saved');
  await page.reload();await page.getByRole('button',{name:'룬 레인저 시작하기',exact:true}).click();await assertSelected(label,n);
 }
 await difficulty().getByRole('button',{name:'어려움',exact:true}).click();
 await page.getByRole('button',{name:'원정 시작',exact:false}).click();
 if(!await page.locator('.survivor-stage').textContent().then(s=>s.includes('어려움')))throw Error('Game difficulty');
 await page.getByRole('button',{name:'일시정지',exact:true}).click();await page.getByRole('button',{name:'원정 종료 · 메뉴로',exact:true}).click();await assertSelected('어려움',33);
 await page.getByRole('button',{name:'게임 허브',exact:true}).click();await page.getByRole('button',{name:'룬 레인저 시작하기',exact:true}).click();await assertSelected('어려움',33);
 for(const[width,height]of[[320,568],[390,844],[740,390],[1440,900]]){
  await page.setViewportSize({width,height});await difficulty().scrollIntoViewIfNeeded();
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow '+width);
  await page.screenshot({path:'output/playwright/ranger-difficulty/preparation-'+width+'.png'});
 }
 for(const raw of ['__proto__','HARD','oops']){await page.evaluate(v=>localStorage.setItem('rune-ranger-difficulty',v),raw);await page.reload();await page.getByRole('button',{name:'룬 레인저 시작하기',exact:true}).click();await assertSelected('쉬움',11);}
 const records=await page.evaluate(()=>['easy','normal','hard','nightmare'].map(d=>localStorage.getItem('rune-ranger-best-'+d)));
 if(JSON.stringify(records)!==JSON.stringify(['11','22','33','44']))throw Error('Records changed');
 const context=await page.context().browser().newContext();await context.addInitScript(()=>{const get=Storage.prototype.getItem,set=Storage.prototype.setItem;Storage.prototype.getItem=function(k){if(k==='rune-ranger-difficulty')throw Error('QA blocked');return get.call(this,k);};Storage.prototype.setItem=function(k,v){if(k==='rune-ranger-difficulty')throw Error('QA quota');return set.call(this,k,v);};});
 const blocked=await context.newPage();await blocked.goto('http://127.0.0.1:5184');await blocked.getByRole('button',{name:'룬 레인저 시작하기',exact:true}).click();
 if(await blocked.getByRole('button',{name:'쉬움',exact:true}).getAttribute('aria-pressed')!=='true')throw Error('Blocked fallback');
 await blocked.getByRole('button',{name:'악몽',exact:true}).click();await blocked.getByRole('button',{name:'원정 시작',exact:false}).click();
 if(!await blocked.locator('.survivor-stage').textContent().then(s=>s.includes('악몽')))throw Error('Blocked memory selection');await context.close();
 return 'PASS: easy default, all four preferences/reload/best records, game/pause/menu/hub roundtrip, invalid/blocked storage, four viewports';
}
