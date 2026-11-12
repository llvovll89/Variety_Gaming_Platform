async(page)=>{
 await page.clock.install();await page.clock.pauseAt(new Date());
 await page.getByRole('button',{name:'시작하기',exact:true}).click();
 const region=page.getByRole('region',{name:'첫 비행 연습'});await region.waitFor();
 await page.clock.runFor(5000);
 if(!await region.textContent().then(s=>s.includes('먼저 한 번')))throw Error('Wait for first tap');
 await page.keyboard.press('Space');await page.clock.runFor(100);await page.keyboard.press('Space');await page.clock.runFor(20);
 if(!await region.textContent().then(s=>s.includes('조금 빨랐')))throw Error('Quick feedback');
 await page.clock.runFor(4000);
 if(!await region.textContent().then(s=>s.includes('먼저 한 번')))throw Error('Safe reset');
 await page.getByRole('button',{name:'날갯짓',exact:true}).click();await page.clock.runFor(20);
 for(let i=0;i<3;i++){await page.clock.runFor(560);await page.getByRole('button',{name:'날갯짓',exact:true}).click();await page.clock.runFor(20);}
 await page.getByRole('button',{name:'모험 시작',exact:true}).waitFor();
 for(const [width,height] of [[320,568],[390,844],[740,390],[1440,900]]){await page.setViewportSize({width,height});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow '+width);await page.screenshot({path:'output/playwright/jump-first-flight/practice-'+width+'.png'});}
 await page.getByRole('button',{name:'모험 시작',exact:true}).click();
 if(await region.count())throw Error('Practice not removed');
 if(await page.evaluate(()=>localStorage.getItem('arcade:hachuping-jump:flight-guide-v1'))!=='done')throw Error('Preference');
 await page.clock.runFor(4000);
 await page.getByRole('heading',{name:'잠깐, 구름에 쉬어가요!',exact:true}).waitFor();
 await page.screenshot({path:'output/playwright/jump-first-flight/result.png'});
 await page.getByRole('button',{name:'다시 시작',exact:true}).click();
 await page.getByRole('button',{name:'일시정지',exact:true}).waitFor();
 if(await region.count())throw Error('Retry enters practice');
 await page.getByRole('button',{name:'일시정지',exact:true}).click();await page.getByRole('button',{name:'메인 메뉴',exact:true}).click();
 await page.getByRole('button',{name:'탭 타이밍 연습',exact:true}).click();await region.waitFor();
 await page.getByRole('button',{name:'일시정지',exact:true}).click();await page.clock.runFor(10000);await page.getByRole('button',{name:'계속하기',exact:true}).click();
 await page.getByRole('button',{name:'연습 건너뛰고 시작',exact:true}).click();
 await page.getByRole('button',{name:'일시정지',exact:true}).click();await page.getByRole('button',{name:'메인 메뉴',exact:true}).click();
 await page.clock.resume();await page.reload();await page.getByRole('button',{name:'점프 시작하기',exact:true}).click();
 await page.getByRole('button',{name:'시작하기',exact:true}).click();
 if(await region.count())throw Error('Seen preference lost');
 await page.getByRole('button',{name:'일시정지',exact:true}).click();await page.getByRole('button',{name:'메인 메뉴',exact:true}).click();
 return 'PASS: first visit, wait, Space/quick feedback, safe reset, three good intervals, completion, four viewports, death/retry, repeat practice/pause/skip, reload preference';
}
