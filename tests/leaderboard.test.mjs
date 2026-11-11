import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const compiled=await build({entryPoints:['src/shared/leaderboard.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {parseLeaderboard,insertLeaderboard}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));

test('leaderboard discards malformed entries and sorts only valid local records',()=>{
  assert.deepEqual(parseLeaderboard('broken'),[]);
  assert.deepEqual(parseLeaderboard(JSON.stringify([null,{},3,{score:-1,timestamp:0},{score:9,timestamp:'bad'},{score:4,timestamp:3},{score:8,timestamp:2}])),[{score:8,timestamp:2},{score:4,timestamp:3}]);
});
test('scores outside top ten return null and equal scores identify the new record',()=>{
  const previous=Array.from({length:10},(_,i)=>({score:100-i,timestamp:i}));
  assert.equal(insertLeaderboard(previous,1,99).rank,null);
  assert.equal(insertLeaderboard(previous,100,99).rank,2);
  assert.equal(insertLeaderboard(previous,101,99).rank,1);
  assert.equal(insertLeaderboard(previous,91,99).rank,null);
  assert.deepEqual(previous.map(e=>e.score),[100,99,98,97,96,95,94,93,92,91]);
});
test('invalid submissions leave records intact and consecutive insertions use the latest list',()=>{
  const entries=[{score:10,timestamp:0}];
  for(const bad of [-1,NaN,Infinity])assert.equal(insertLeaderboard(entries,bad).entries,entries);
  const first=insertLeaderboard(entries,10,1),second=insertLeaderboard(first.entries,10,1);
  assert.equal(first.rank,2);assert.equal(second.rank,3);assert.equal(second.entries.length,3);
});
