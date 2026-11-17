import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function loadAnalytics(host, env = {}) {
  const calls = [], scripts = [];
  const location = new URL(`https://${host}/pros/test?utm_source=newsletter&code=secret#access_token=secret`);
  const window = { location, dataLayer: [], gtag: (...args) => calls.push(args) };
  const context = { window, URL, Date, exports: {}, document: {
    createElement: () => ({}), head: { appendChild: s => scripts.push(s) },
  } };
  const source = fs.readFileSync('src/lib/analytics.ts', 'utf8').replaceAll('import.meta.env', JSON.stringify({VITE_GA_MEASUREMENT_ID: 'G-TEST', DEV: false, ...env}));
  vm.runInNewContext(ts.transpileModule(source, {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS}}).outputText, context);
  return { api: context.exports, calls, scripts, window };
}

for (const [host, brand] of [['www.mybagpro.jp','mybagpro'],['mybagpro.jp','mybagpro'],['golfid.jp','golfid'],['www.golfid.jp','golfid']]) {
  const { api, calls, scripts, window } = loadAnalytics(host);
  api.initAnalytics(); api.initAnalytics();
  assert.equal(scripts.length, 1);
  assert.equal(calls.filter(x => x[0] === 'config').length, 1);
  assert.equal(calls.find(x => x[0] === 'config')[2].send_page_view, false);
  api.trackPageView('/pros/test','Selected player','route-a');
  api.trackPageView('/pros/test','Repeated effect','route-a');
  assert.equal(calls.filter(x => x[1] === 'page_view').length, 1);
  window.location = new URL(`https://${host}/articles/example`);
  api.trackPageView('/articles/example','Article','route-b');
  window.location = new URL(`https://${host}/pros/test`);
  api.trackPageView('/pros/test','Selected player','route-a');
  assert.equal(calls.filter(x => x[1] === 'page_view').length, 3, 'Back navigation is a new visit');
  api.trackEvent('click_affiliate_shop',{shop_id:'RAKUTEN',source_page:'pro_setting_detail'});
  const event = calls.at(-1)[2];
  assert.equal(event.site_brand,brand); assert.equal(event.shop_id,'RAKUTEN');
  assert.equal(event.site_hostname,host); assert.equal(event.page_path,'/pros/test');
  for (const call of calls.filter(x => x[2])) {
    assert.equal(call[2].debug_mode,undefined);
    assert.ok(!call[2].page_location.includes('secret'));
  }
  assert.ok(calls.find(x => x[0] === 'config')[2].page_location.includes('utm_source=newsletter'));
}
for (const host of ['localhost','test.vercel.app','mybagpro.jp.example.com']) {
  const {api,calls,scripts} = loadAnalytics(host); api.initAnalytics(); api.trackPageView('/','Test'); api.trackEvent('test');
  assert.equal(calls.length,0); assert.equal(scripts.length,0);
}
const empty = loadAnalytics('mybagpro.jp',{VITE_GA_MEASUREMENT_ID:''}); empty.api.initAnalytics(); assert.equal(empty.calls.length,0);
const debug = loadAnalytics('localhost',{DEV:true,VITE_GA_DEBUG:'true'}); debug.api.initAnalytics(); assert.equal(debug.calls.at(-1)[2].debug_mode,true);

// Run SeoManager's effects with controlled content requests to catch stale-route
// events, failure fallback, slow responses, and title timing without network calls.
async function seoFixture(path, fetchContent) {
  const effects=[], sends=[], timers=new Map(); let timerId=0;
  const document={title:''};
  const location={pathname:path,key:'navigation-1'};
  const context={exports:{}, document, window:{setTimeout: fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id)}, require:id=>({
    react:{useEffect:fn=>effects.push(fn)},
    'react-router-dom':{useLocation:()=>location},
    '../config/brand':{getBrandConfig:()=>({name:'MyBagPro',mainCopy:'Home',description:'Description'})},
    '../lib/analytics':{initAnalytics:()=>{},trackPageView:(...args)=>sends.push(args)},
    '../lib/seo':{getSeoPath:p=>p,applySeo:seo=>{document.title=seo.title+' | MyBagPro';}},
    '../lib/articles':{fetchPublishedArticleBySlug:fetchContent},
    '../lib/contentProfiles':{fetchPublishedSettingProfileBySlug:fetchContent},
  })[id]};
  const source=fs.readFileSync('src/components/SeoManager.tsx','utf8').replaceAll('import.meta.env','{}');
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,context);
  context.exports.SeoManager();
  const cleanup=effects[1]();
  const flush=async()=>{for(let i=0;i<10;i++) await Promise.resolve();};
  return {sends,cleanup,timers,flush};
}
const article=await seoFixture('/articles/example',async()=>({title:'Actual article',excerpt:'Description'})); await article.flush();
assert.equal(article.sends.length,1); assert.equal(article.sends[0][1],'Actual article | MyBagPro');
const failed=await seoFixture('/pros/example',async()=>{throw Error('offline')}); await failed.flush(); assert.equal(failed.sends.length,1);
let resolve;
const stale=await seoFixture('/articles/old',()=>new Promise(r=>{resolve=r})); stale.cleanup(); resolve({title:'Old article'}); await stale.flush(); assert.equal(stale.sends.length,0); assert.equal(stale.timers.size,0);
console.log('PASS: hostname separation, one manual pageview, back navigation, shop attribution, preview exclusion, production debug off, URL sanitization, dynamic title, failure fallback, stale route cancellation.');
