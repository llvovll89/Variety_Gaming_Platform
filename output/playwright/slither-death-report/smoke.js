async(page)=>{
 await page.getByRole('button',{name:'플레이',exact:true}).click();
 await page.waitForFunction(()=>window.__engine);
 await page.clock.install();await page.clock.pauseAt(new Date());
 const cases=[['wall',null,false],['body','검증 상대',false],['head-on','검증 상대',true],['head-on','긴 이름의 검증 상대',false]];
 for(let i=0;i<cases.length;i++){
  if(i){await page.getByRole('button',{name:'다시 출발',exact:true}).click();await page.waitForFunction(()=>window.__engine?.world.player.alive);if(await page.getByRole('region',{name:'사망 원인'}).count())throw Error('Old death');}
  await page.evaluate(([reason,name,mutual])=>{
   const e=window.__engine,w=e.world,p=w.player;w.snakes=[p];p.head={x:0,y:0};p.pathHistory=[{x:0,y:0}];p.heading=0;
   if(reason==='wall'){p.head={x:4498,y:-123};p.pathHistory=[{...p.head}];}
   else {const rival={...p,id:-999,isPlayer:false,name,head:{x:reason==='body'?1000:10,y:0},pathHistory:reason==='body'?[{x:0,y:0},{x:100,y:0},{x:200,y:0}]:[{x:10,y:0}],heading:Math.PI,upgrades:{...p.upgrades}};w.snakes.push(rival);if(!mutual&&reason==='head-on')p.heading=Math.PI/2;}
   w.update(0,{angle:p.heading,boosting:false});e.tick(performance.now());
  },cases[i]);
  const report=page.getByRole('region',{name:'사망 원인'});await report.waitFor();
  const text=await report.textContent();if(i===0&&!text.includes('경계'))throw Error('Wall');if(i===1&&!text.includes('검증 상대의 몸통'))throw Error('Body');if(i===2&&!text.includes('함께 탈락'))throw Error('Mutual');if(i===3&&!text.includes('머리가 부딪혀'))throw Error('Head-on');
  await page.screenshot({path:'output/playwright/slither-death-report/case-'+i+'.png'});
 }
 for(const [width,height] of [[320,568],[390,844],[740,390],[1440,900]]){
  await page.setViewportSize({width,height});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow');
  await page.getByRole('region',{name:'사망 원인'}).scrollIntoViewIfNeeded();await page.screenshot({path:'output/playwright/slither-death-report/result-'+width+'.png'});
  await page.getByRole('button',{name:'게임 메뉴',exact:true}).scrollIntoViewIfNeeded();if(!await page.getByRole('button',{name:'게임 메뉴',exact:true}).isVisible())throw Error('Menu unreachable');
 }
 await page.getByRole('button',{name:'게임 메뉴',exact:true}).click();await page.getByRole('button',{name:'플레이',exact:true}).waitFor();await page.clock.resume();
 return 'PASS: wall/body/mutual/head-on actual collision path, restart reset, 4 viewports, menu return';
}
