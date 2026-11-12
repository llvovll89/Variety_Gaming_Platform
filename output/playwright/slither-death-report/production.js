async(page)=>{
 await page.goto('http://127.0.0.1:5182');
 await page.getByRole('button',{name:'슬리더 시작하기',exact:true}).click();
 await page.clock.install();
 await page.getByRole('button',{name:'플레이',exact:true}).click();
 await page.getByRole('button',{name:'일시정지',exact:true}).waitFor();
 await page.mouse.move(1400,450);
 await page.clock.runFor(40000);
 await page.getByRole('region',{name:'사망 원인'}).waitFor();
 if(await page.evaluate(()=>typeof window.__engine)!=='undefined')throw Error('Dev hook in production');
 await page.screenshot({path:'output/playwright/slither-death-report/production-result.png'});
 await page.getByRole('button',{name:'다시 출발',exact:true}).click();
 await page.getByRole('button',{name:'일시정지',exact:true}).waitFor();
 if(await page.getByRole('region',{name:'사망 원인'}).count())throw Error('Stale death');
 await page.getByRole('button',{name:'일시정지',exact:true}).click();
 await page.getByRole('button',{name:'게임 메뉴',exact:true}).click();
 await page.getByRole('button',{name:'플레이',exact:true}).waitFor();
 await page.clock.resume();
 return 'PASS: production normal steering/death report/restart/pause/menu, no dev hook';
}
